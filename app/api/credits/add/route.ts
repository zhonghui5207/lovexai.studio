import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addUserCredits } from "@/models/credit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { amount, order_no, expired_days = 365 } = await request.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!order_no) {
      return NextResponse.json(
        { error: "Order number required" },
        { status: 400 }
      );
    }

    const creditRecord = await addUserCredits(
      session.user.email,
      amount,
      order_no,
      expired_days
    );
    
    return NextResponse.json({
      success: true,
      credit_record: creditRecord
    });
  } catch (error) {
    console.error("Error adding credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}