import { processSTT } from "@/execution/stt_processor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}";
    const transcript = await processSTT(buffer, credentialsJson);

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("STT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
