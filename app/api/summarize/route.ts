import { processSummarize } from "@/execution/summarize_processor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const summary = await processSummarize(transcript, apiKey);

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
