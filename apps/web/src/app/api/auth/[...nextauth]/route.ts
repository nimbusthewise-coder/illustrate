import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

// Wrap handlers to catch errors and return JSON instead of HTML
const wrappedGET = async (req: NextRequest, context: any) => {
  try {
    return await handlers.GET(req, context);
  } catch (error) {
    console.error("NextAuth GET error:", error);
    // Return a valid JSON response instead of letting Next.js return HTML
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }
};

const wrappedPOST = async (req: NextRequest, context: any) => {
  try {
    return await handlers.POST(req, context);
  } catch (error) {
    console.error("NextAuth POST error:", error);
    // Return a valid JSON response instead of letting Next.js return HTML
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }
};

export { wrappedGET as GET, wrappedPOST as POST }
