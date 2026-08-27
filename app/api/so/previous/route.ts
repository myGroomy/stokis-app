// app/api/so/previous/route.ts
import { NextResponse } from "next/server";
import { callAppsScript } from "@/lib/appsscript";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cabangId = searchParams.get("cabang") || "";

    const result = await callAppsScript("getPreviousSO", cabangId || undefined);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data?.items || {} });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: "Gagal mengambil data SO sebelumnya: " + err.message } },
      { status: 500 }
    );
  }
}
