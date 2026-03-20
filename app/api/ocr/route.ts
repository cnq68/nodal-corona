import { processOCR } from "@/execution/ocr_processor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}";
    const ocrText = await processOCR(imageUrl, credentialsJson);

    return NextResponse.json({ text: ocrText });
  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
