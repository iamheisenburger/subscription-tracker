import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, category, planType, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    // Email content to send to usesubwiseapp@gmail.com
    const emailData = {
      to: "usesubwiseapp@gmail.com",
      subject: `SubWise Contact: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; font-size: 20px; margin-top: 0;">Contact Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                ${planType ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Plan Type:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                      ${planType.toUpperCase()}
                    </span>
                  </td>
                </tr>
                ` : ''}
                ${category ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Category:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${category}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0;"><strong>Subject:</strong></td>
                  <td style="padding: 10px 0;">${subject}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; font-size: 20px; margin-top: 0;">Message</h2>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
                <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #555;">${message}</p>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⏰ Response Time:</strong> ${planType === 'premium' ? 'Within 12 hours (Priority Support)' : 'Within 48 hours'}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">Submitted at: ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0 0 0;">This is an automated notification from SubWise contact form.</p>
          </div>
        </div>
      `,
    };

    // In production, integrate with email service (Resend, SendGrid, etc.)
    console.log("Contact form submission:", emailData);

    // TODO: Send actual email using email service
    // await sendEmail(emailData);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully. We'll get back to you soon!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

