import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/auth/error?error=MissingToken", request.url))
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/auth/error?error=InvalidToken", request.url))
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      return NextResponse.redirect(new URL("/auth/error?error=ExpiredToken", request.url))
    }

    // Update user's emailVerified field
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    })

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    })

    // Redirect to success page
    return NextResponse.redirect(new URL("/auth/verify-email?success=true", request.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/auth/error?error=VerificationFailed", request.url))
  }
}
