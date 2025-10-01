import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Send email notification to usesubwiseapp@gmail.com
    const emailData = {
      to: "usesubwiseapp@gmail.com",
      subject: "New SubWise Newsletter Subscription",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Newsletter Subscription</h2>
          <p style="font-size: 16px; color: #555;">
            A new user has subscribed to SubWise updates:
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">
              📧 ${email}
            </p>
          </div>
          <p style="font-size: 14px; color: #777;">
            Subscribed at: ${new Date().toLocaleString()}
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">
            This is an automated notification from SubWise newsletter subscription system.
          </p>
        </div>
      `,
    };

    // In production, integrate with email service (SendGrid, Resend, etc.)
    // For now, log to console
    console.log("Newsletter subscription:", emailData);

    // TODO: Add to mailing list (MailChimp, ConvertKit, etc.)
    // await addToMailingList(email);

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}

