import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
// import type { PlatformKey } from "@/types/platform"; // keep your central type

// If you really need it local, don't re-declare; rely on the imported type.
type PlatformKey = "instagram" | "youtube" | "twitter" | "linkedin";

type RouteParams = {
  platform: string; // must be string for Next.js
};

function isValidPlatform(value: string): value is PlatformKey {
  const allowed: PlatformKey[] = ["instagram", "youtube", "twitter", "linkedin"];
  return allowed.includes(value as PlatformKey);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> } // or { params: RouteParams } if your Next version uses non-Promise params
) {
  try {
    const { platform } = await context.params; // await if Promise-based

    if (!isValidPlatform(platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid platform" },
        { status: 400 }
      );
    }

    const typedPlatform: PlatformKey = platform;
    const userId = "demo_user"; // TODO: replace with real authenticated user id

    // Get the user document
    const snap = await adminDb.collection("users").doc(userId).get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = snap.data() as any;
    const accounts = userData.connectedAccounts || [];

    // Find the account to remove
    const accountToRemove = accounts.find(
      (acc: any) => acc.platform === typedPlatform
    );

    if (!accountToRemove) {
      return NextResponse.json(
        { success: false, error: "Account not connected" },
        { status: 404 }
      );
    }

    // Remove from connectedAccounts array
    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        connectedAccounts: adminFieldValue.arrayRemove(accountToRemove),
      });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Disconnect error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
