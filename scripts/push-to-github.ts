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

async function pushToRepo(octokit: Octokit, repoOwner: string, repoName: string, commitMessage: string) {
  console.log(`\n--- Pushing to ${repoOwner}/${repoName} ---`);

  let repoExists = false;
  try {
    await octokit.repos.get({ owner: repoOwner, repo: repoName });
    repoExists = true;
    console.log(`Repository ${repoOwner}/${repoName} already exists.`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating repository ${repoName} in ${repoOwner}...`);
      try {
        await octokit.repos.createInOrg({
          org: repoOwner,
          name: repoName,
          description: 'Butterfli - Financial tech investment platform',
          private: false,
          auto_init: true,
        });
      } catch {
        await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: 'Butterfli - Financial tech investment platform',
          private: false,
          auto_init: true,
        });
      }
      console.log(`Repository created: ${repoOwner}/${repoName}`);
      console.log('Waiting for repo initialization...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      throw e;
    }
  }

  try {
    await octokit.git.getRef({ owner: repoOwner, repo: repoName, ref: 'heads/main' });
  } catch {
    console.log('Initializing empty repository...');
    await octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: 'README.md',
      message: 'Initialize repository',
      content: Buffer.from('# Butterfli\n\nFinancial tech investment platform\n').toString('base64'),
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
      owner: repoOwner,
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
    owner: repoOwner,
    repo: repoName,
    tree: blobs as any,
  });

  let parentSha: string | undefined;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
    });
    parentSha = ref.object.sha;
  } catch {}

  console.log('Creating commit...');
  const commitParams: any = {
    owner: repoOwner,
    repo: repoName,
    message: commitMessage,
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
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } catch {
    await octokit.git.createRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
  }

  console.log(`Done! Code pushed to: https://github.com/${repoOwner}/${repoName}`);
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();

  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);

  const commitMessage = 'Update: Butterfli fintech app from Replit';

  await pushToRepo(octokit, user.login, 'playground', commitMessage);

  await pushToRepo(octokit, 'arrakis-workspace', 'playground', commitMessage);

  console.log('\nAll repositories updated!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
