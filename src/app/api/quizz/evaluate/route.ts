import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionText, correctAnswerText, userAnswer } = body;

    if (!questionText || !correctAnswerText || !userAnswer) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
    });

    const prompt = new HumanMessage(
      `You are an English teacher grading a student's answer.

    Question: "${questionText}"
    Expected answer: "${correctAnswerText}"
    Student's answer: "${userAnswer}"

    Evaluate the student's answer. Ignore minor grammatical mistakes and focus on meaning.
    Respond in this exact JSON format:
    {
    "isCorrect": true,
    "score": 1,
    "feedback": "Correct!"
    }`
    );

    const response = await model.invoke([prompt]);
    const content = response?.content?.toString().trim();

    // Extract JSON safely
    const jsonMatch = content?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON returned from model.");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
