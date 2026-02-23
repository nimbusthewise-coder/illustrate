import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@illustrate.md",
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to illustrate.md!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: white; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send verification email:", error)
    throw error
  }
}
