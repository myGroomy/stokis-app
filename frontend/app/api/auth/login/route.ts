import { NextResponse } from "next/server";
import { callAppsScript } from "@/lib/appsscript";

export async function POST(request: Request) {
  try {
    const { username, pin } = await request.json();

    if (!username || !pin) {
      return NextResponse.json(
        { success: false, error: { message: "Username dan PIN wajib diisi" } },
        { status: 400 }
      );
    }

    const result = await callAppsScript("login", undefined, {
      username: username.trim(),
      pin: pin.trim(),
    });

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json(
      { success: false, error: result.error || { message: "Username atau PIN salah" } },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: "Gagal memproses login: " + err.message } },
      { status: 500 }
    );
  }
}
