// Server-side Resend transactional email client for Exam CAGO
// Never import this file into client components ('use client').

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Sends a transactional email using the Resend REST API.
 * Never throws uncaught exceptions if the email service fails or is unconfigured;
 * gracefully logs and returns a typed SendEmailResult so the application never crashes.
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('re_placeholder')) {
    console.warn('[Resend Email Skipped]: RESEND_API_KEY is not configured in environment variables.');
    return {
      success: false,
      skipped: true,
      error: 'RESEND_API_KEY is not configured in environment variables.',
    };
  }

  const fromAddress = options.from || process.env.RESEND_FROM_EMAIL || 'Exam CAGO <support@examcago.com>';
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toAddresses,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Resend API returned HTTP status ${response.status}`;
      console.error('[Resend Email Error]:', errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (err: any) {
    console.error('[Resend Email Exception]:', err?.message || err);
    return {
      success: false,
      error: err?.message || 'Failed to dispatch email request to Resend API.',
    };
  }
}

/**
 * Sends a branded welcome email to newly registered students.
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name?: string;
}): Promise<SendEmailResult> {
  const recipientName = name?.trim() || 'Student';
  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    : 'https://examcago.com/login';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; color: #1F2937; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; }
    .header { background-color: #800000; padding: 24px; text-align: center; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .content { padding: 32px 24px; line-height: 1.6; }
    .token-badge { display: inline-block; background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; padding: 8px 16px; border-radius: 6px; font-weight: bold; margin: 16px 0; }
    .button { display: inline-block; background-color: #800000; color: #FFFFFF !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 16px; }
    .footer { padding: 20px 24px; font-size: 12px; color: #6B7280; text-align: center; border-top: 1px solid #F3F4F6; background: #FAFAFA; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EXAM CAGO</h1>
    </div>
    <div class="content">
      <h2>Welcome to Exam CAGO, ${recipientName}!</h2>
      <p>Your student account has been created for ICAB Certificate Level exam practice.</p>
      
      <div class="token-badge">
        🎉 1 Free Welcome Token has been credited to your account!
      </div>
      
      <p>With Exam CAGO, you have access to syllabus-aligned questions, realistic timed mock exams, and instant performance analysis across all ICAB subjects.</p>
      
      <a href="${loginUrl}" class="button">Access Your Student Portal</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Exam CAGO. ICAB Certificate Level Exam Preparation.</p>
      <p>Need assistance? Reach us at support.cago@gmail.com</p>
    </div>
  </div>
</body>
</html>
`;

  return sendTransactionalEmail({
    to,
    subject: 'Welcome to Exam CAGO — Your Student Account is Ready!',
    html,
    text: `Welcome to Exam CAGO, ${recipientName}!\n\nYour student account has been created with 1 Free Welcome Token.\nLog in to access syllabus-aligned ICAB mock exams: ${loginUrl}\n\nSupport: support.cago@gmail.com`,
  });
}
