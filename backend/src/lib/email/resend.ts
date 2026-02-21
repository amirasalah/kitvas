import { Resend } from 'resend';
import { logger } from '../logger.js';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.ALERT_FROM_EMAIL || 'Kitvas <alerts@kitvas.com>';

export async function sendBreakoutAlert(
  email: string,
  ingredients: string[]
): Promise<boolean> {
  if (!resend) {
    logger.warn('RESEND_API_KEY not set — skipping email alert');
    return false;
  }

  const ingredientList = ingredients.map((i) => `<li><strong>${i}</strong></li>`).join('\n');

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `🔥 Breakout ingredients detected: ${ingredients.slice(0, 3).join(', ')}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #111827;">Breakout Ingredients Detected</h2>
        <p style="color: #4B5563;">
          The following ingredients are experiencing explosive growth (&gt;5000%) on Google Trends right now:
        </p>
        <ul style="color: #111827; line-height: 1.8;">
          ${ingredientList}
        </ul>
        <p style="color: #4B5563;">
          This could be a great time to create content featuring these ingredients before the trend peaks.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">
          You're receiving this because you enabled breakout alerts on Kitvas.
          To unsubscribe, sign in and toggle off alerts in the menu.
        </p>
      </div>
    `,
  });

  if (error) {
    logger.error(`Failed to send alert to ${email}`, { error: error.message });
    return false;
  }

  return true;
}
