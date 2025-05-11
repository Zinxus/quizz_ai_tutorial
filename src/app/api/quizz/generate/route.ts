import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage } from '@langchain/core/messages';

import saveQuizz from './saveToDb';

export async function POST(request: NextRequest) {
    const userSession = await auth();
    const userId = userSession?.user?.id;

    const body = await request.formData();
    const mode = body.get("mode");
    const topic = body.get("topic")?.toString() || "";
    const document = body.get("pdf");

    if (mode === "upload" && !document) {
        return NextResponse.json({ error: "No document provided." }, { status: 400 });
    }
    if (mode === "topic" && !topic.trim()) {
        return NextResponse.json({ error: "No topic provided." }, { status: 400 });
    }

    try {
        let textToQuiz = "";
        let docs;

        if (mode === "upload" && document instanceof Blob) {
            const pdfLoader = new PDFLoader(document, { parsedItemSeparator: " " });
            docs = await pdfLoader.load();
            textToQuiz = docs
                .filter(d => d.pageContent)
                .map(d => d.pageContent!)
                .join("\n\n");
        }
        // mode topic: chỉ lấy topic
        if (mode === "topic") {
            textToQuiz = `on the topic: ${topic}`;
        }
        // mode random: để trống hoặc custom prompt
        if (mode === "random") {
            textToQuiz = ""; // prompt chung bên dưới sẽ cover
        }

        // Tạo prompt chung
        const basePrompt = `Create a multiple choice test with 10 questions and answers, in various formats (grammar, vocabulary, English usage). 
        Questions, answers, and difficulty levels from intermediate to advanced according to international English learners' standards.`;
        const endPrompt = `Return JSON in the following format:
        {
        "quizz": {
            "name": "",
            "description": "",
            "questions": [
            {
                "questionText": "",
                "answer": [
                { "answerText": "", "isCorrect":  },
                { "answerText": "", "isCorrect":  },
                ...
                ]
            },
            ...
            ]
        }
        }`;
        const fullPrompt =
            mode === "topic" || mode === "random"
                ? `${basePrompt} ${textToQuiz} ${endPrompt}.`
                : `${basePrompt} based on the following text:\n\n${textToQuiz} \n\n${endPrompt}`;

        let texts: string[] = [];
        if (mode === "upload" && docs) {
            const selectedDocuments = docs.filter((doc: { pageContent?: string }) => doc.pageContent !== undefined);
            texts = selectedDocuments.map((doc) => doc.pageContent!);
        }

        const prompt = fullPrompt; // Sử dụng fullPrompt đã tạo

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY not provided" },
                { status: 500 }
            );
        }

        const model = new ChatOpenAI({
            modelName: 'gpt-4.1-nano',
            temperature: 0.7,
        });

        const parser = new JsonOutputParser();
        const extrectionFunctionSchema = {
            name: "extractor",
            description: "Extracts fields from the oputput",
            parameters:{
                type: "object",
                properties: {
                    quizz:{
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            questions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        questionText: { type: "string" },
                                        answer: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    answerText: { type: "string" },
                                                    isCorrect: { type: "boolean" },
                                                },
                                            },
                                        },
                                    },
                                    required: ["questionText", "answer"],
                                },
                            },
                        },
                    },
                },
            },
        };

        const runable = model.bind({
            functions: [extrectionFunctionSchema],
            function_call: { name: "extractor" },
        });

        const message = new HumanMessage(prompt); // Sử dụng prompt đã tạo
        const response = await runable.invoke([message]);

        const functionCall = response?.additional_kwargs?.function_call;
        const argsJson = functionCall?.arguments;

        if (!argsJson) {
            throw new Error("No function_call.arguments returned from OpenAI");
        }

        const parsed = JSON.parse(argsJson);
        const { quizz } = parsed;
        const { quizzId } = await saveQuizz({...quizz, userId});

        return NextResponse.json({ quizzId }, { status: 200 });

    } catch (e: any) {
        console.error("Error in /api/quizz/generate:", e);
        return NextResponse.json(
            { error: e.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}