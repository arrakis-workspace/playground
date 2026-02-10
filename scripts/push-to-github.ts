import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.local',
  '.upm',
  'dist',
  '.replit',
  'scripts/push-to-github.ts',
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.startsWith(pattern) || filePath.includes('/' + pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (shouldIgnore(relativePath)) continue;

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function main() {
  const repoName = 'playground';

  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();

  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  let repoExists = false;
  try {
    await octokit.repos.get({ owner: user.login, repo: repoName });
    repoExists = true;
    console.log(`Repository ${user.login}/${repoName} already exists.`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating repository ${repoName}...`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Financial tech investment onboarding application',
        private: false,
        auto_init: true,
      });
      console.log(`Repository created: ${user.login}/${repoName}`);
      console.log('Waiting for repo initialization...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      throw e;
    }
  }

  let isEmpty = false;
  try {
    await octokit.git.getRef({ owner: user.login, repo: repoName, ref: 'heads/main' });
  } catch {
    isEmpty = true;
    console.log('Initializing empty repository...');
    await octokit.repos.createOrUpdateFileContents({
      owner: user.login,
      repo: repoName,
      path: 'README.md',
      message: 'Initialize repository',
      content: Buffer.from('# Playground\n\nFinancial tech investment onboarding application\n').toString('base64'),
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('Collecting files...');
  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push.`);

  const blobs: { path: string; sha: string; mode: string; type: string }[] = [];

  for (const filePath of files) {
    const fullPath = path.join(projectDir, filePath);
    const content = fs.readFileSync(fullPath);
    const base64Content = content.toString('base64');

    const { data: blob } = await octokit.git.createBlob({
      owner: user.login,
      repo: repoName,
      content: base64Content,
      encoding: 'base64',
    });

    blobs.push({
      path: filePath,
      sha: blob.sha,
      mode: '100644',
      type: 'blob',
    });
  }

  console.log('Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    tree: blobs as any,
  });

  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
    });
    parentSha = ref.object.sha;
  } catch {}

  console.log('Creating commit...');
  const commitParams: any = {
    owner: user.login,
    repo: repoName,
    message: 'Initial commit: Playground fintech app from Replit',
    tree: tree.sha,
  };
  if (parentSha) {
    commitParams.parents = [parentSha];
  } else {
    commitParams.parents = [];
  }

  const { data: commit } = await octokit.git.createCommit(commitParams);

  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } catch {
    await octokit.git.createRef({
      owner: user.login,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
  }

  console.log(`\nDone! Code pushed to: https://github.com/${user.login}/${repoName}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
