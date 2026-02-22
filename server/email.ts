import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendConnectionRequestEmail(
  recipientEmail: string,
  requesterName: string,
  requesterHandle: string | null
): Promise<boolean> {
  const client = getResendClient();
  if (!client) {
    console.log("Resend API key not configured, skipping email notification");
    return false;
  }

  try {
    const handleText = requesterHandle ? ` (@${requesterHandle})` : "";
    await client.emails.send({
      from: "Playground <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `${requesterName}${handleText} sent you a connection request`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1a1a2e; font-size: 20px; font-weight: 600; margin: 0;">New Connection Request</h2>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 8px 0;">
              <strong>${requesterName}</strong>${handleText}
            </p>
            <p style="color: #666; font-size: 14px; margin: 0;">
              wants to connect with you on Playground
            </p>
          </div>
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            Log in to Playground to accept or decline this request.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error: any) {
    console.error("Failed to send connection request email:", error.message);
    return false;
  }
}
