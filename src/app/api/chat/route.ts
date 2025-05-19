import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();
  // history: [{ role: "user"|"assistant", content: string }, ...]
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      ...history,
      { role: "user", content: message },
    ],
  });

  const bot = resp.choices[0].message;
  return NextResponse.json({ message: bot });
}
