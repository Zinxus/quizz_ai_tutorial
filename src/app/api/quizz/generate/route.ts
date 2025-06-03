import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { HumanMessage } from '@langchain/core/messages';

import saveQuizz from './saveToDb';

export async function POST(request: NextRequest) {
    const userSession = await auth();
    const userId = userSession?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.formData();
    const mode = body.get("mode")?.toString();
    const topic = body.get("topic")?.toString() || "";
    const document = body.get("pdf");

    const questionTypesRaw = body.get("questionTypes")?.toString();
    const numberOfQuestionsRaw = body.get("numberOfQuestions")?.toString();
    const level = body.get("level")?.toString() || "A2";

    let selectedQuestionTypes: string[] = [];
    if (questionTypesRaw) {
        try {
            selectedQuestionTypes = JSON.parse(questionTypesRaw);
        } catch (e) {
            console.error("Error parsing questionTypes:", e);
            return NextResponse.json({ error: "Invalid question types format." }, { status: 400 });
        }
    } else {
        selectedQuestionTypes = ["multiple_choice"];
    }

    const numberOfQuestions = parseInt(numberOfQuestionsRaw || "10");

    if (mode === "upload" && !document) {
        return NextResponse.json({ error: "No document provided." }, { status: 400 });
    }
    if (mode === "topic" && !topic.trim()) {
        return NextResponse.json({ error: "No topic provided." }, { status: 400 });
    }
    if (numberOfQuestions <= 0) {
        return NextResponse.json({ error: "Number of questions must be greater than 0." }, { status: 400 });
    }
    if (selectedQuestionTypes.length === 0) {
        return NextResponse.json({ error: "Please select at least one question type." }, { status: 400 });
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
        if (mode === "topic") {
            textToQuiz = `on the topic: ${topic}`;
        }
        if (mode === "random") {
            textToQuiz = "";
        }

        const questionTypesString = selectedQuestionTypes.map(type => {
            switch (type) {
                case "multiple_choice": return "multiple choice";
                case "write": return "write-in (short answer)";
                case "listen": return "listen-and-write (provide the text to be spoken, not an audio URL)";
                default: return "";
            }
        }).filter(Boolean).join(", ");

        const basePrompt = `You are an experienced English teacher preparing a language learning quiz for non-native speakers who are studying English as a second language. 
        Create a test with ${numberOfQuestions} questions. Create a test for learners at ${level} according to CEFR. 
        Design questions that specifically help learners improve their English skills (grammar, vocabulary, listening, and writing). Include the following question types: ${questionTypesString}. 
        Ensure that questions are suitable for language learners (e.g., clear context, limited idiomatic expressions unless explained).`;


        const questionSchemaProperties: Record<string, any> = {
            questionText: { type: "string" },
            type: { type: "string", enum: ["multiple_choice", "write", "listen"] },
            order: { type: "integer", description: "The sequential order of the question in the quiz, starting from 0." }, 
            answers: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        answerText: { type: "string" },
                        isCorrect: { type: "boolean" },
                    },
                    required: ["answerText", "isCorrect"],
                },
            },
        };

        if (selectedQuestionTypes.includes("listen")) {
            questionSchemaProperties.audioText = { type: "string", description: "The text content that should be spoken for a listen type question." };
            if (questionSchemaProperties.audioUrl) {
                delete questionSchemaProperties.audioUrl;
            }
        }

        const endPrompt = `Trả về JSON theo định dạng sau:
        {
        "quizz": {
            "name": "Tên của bài kiểm tra",
            "description": "Mô tả của bài kiểm tra",
            "questions": [
            {
                // Tạo câu hỏi theo tiêu chuẩn CERF, Toeic, Ielts
                "questionText": "Văn bản cho câu hỏi trắc nghiệm tại đây",
                "type": "multiple_choice", // Ví dụ về loại câu hỏi
                "order": 0,
                // If listen, add audioText feld
                ${selectedQuestionTypes.includes("listen") ? '"audioText": "Tạo phần nghe cho câu hỏi có thể là một đoạn văn, một vài câu giao tiếp, một vài câu, một câu, một từ "",' : ''}
                "answers": [
                { "answerText": "Câu trả lời A", "isCorrect": false },
                { "answerText": "Câu trả lời B", "isCorrect": true }
                ]
            },
            {
                // Tạo câu hỏi theo tiêu chuẩn CERF, Toeic, Ielts
                "questionText": "Tạo câu hỏi để người dùng viết một từ hoặc một câu tham khảo từ các bài kiểm tra tiếng Anh",
                "type": "write",
                "order": 1, 
                "answers": [
                    { "answerText": "Câu trả lời đúng cho câu trả lời viết", "isCorrect": true }
                ]
            },
            {
                // Tạo câu hỏi cho nội dung nghe theo tiêu chuẩn CERF, Toeic, Ielts
                "questionText": "Câu hỏi cho đoạn văn nghe tham khảo từ các bài kiểm tra tiếng Anh",
                "type": "listen",
                "order": 2, 
                "audioText": "Đây là văn bản sẽ được nói cho câu hỏi nghe này.",
                "answers": [
                    { "answerText": "Câu trả lời đúng cho phần nghe", "isCorrect": true }
                ]
            }
            // ... Bất kỳ câu hỏi bổ sung nào cũng có thể được thêm vào đây, đảm bảo thứ tự chính xác cho từng câu hỏi.
            ]
        }
        }`;


        const fullPrompt =
            mode === "topic" || mode === "random"
                ? `${basePrompt} ${textToQuiz} ${endPrompt}.`
                : `${basePrompt} based on the following text:\n\n${textToQuiz} \n\n${endPrompt}`;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY not provided" },
                { status: 500 }
            );
        }

        const model = new ChatOpenAI({
            modelName: 'gpt-4o',
            temperature: 0.7,
        });

        const extrectionFunctionSchema = {
            name: "extractor",
            description: "Extracts fields from the output",
            parameters: {
                type: "object",
                properties: {
                    quizz: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            questions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: questionSchemaProperties, 
                                    required: ["questionText", "type", "answers", "order"],
                                },
                            },
                        },
                    },
                },
                required: ["quizz"],
            },
        };

        const runable = model.bind({
            functions: [extrectionFunctionSchema],
            function_call: { name: "extractor" },
        });

        const message = new HumanMessage(fullPrompt);
        const response = await runable.invoke([message]);

        const functionCall = response?.additional_kwargs?.function_call;
        const argsJson = functionCall?.arguments;

        if (!argsJson) {
            console.error("OpenAI response:", response);
            throw new Error("No function_call.arguments returned from OpenAI. Check if the prompt was clear enough or if the model understood the schema.");
        }

        const parsed = JSON.parse(argsJson);
        const { quizz } = parsed;

        quizz.questions.sort((a: any, b: any) => a.order - b.order);


        const { quizzId } = await saveQuizz({ ...quizz, userId });

        return NextResponse.json({ quizzId }, { status: 200 });

    } catch (e: any) {
        console.error("Error in /api/quizz/generate:", e);
        return NextResponse.json(
            { error: e.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}