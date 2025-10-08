import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    if (!resend) {
      console.error("Resend API key not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Send email notification to usesubwiseapp@gmail.com
    const emailResult = await resend.emails.send({
      from: "SubWise <noreply@usesubwise.app>",
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
            });

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



