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
        Create a test with ${numberOfQuestions} questions. The learners are from intermediate to advanced level according to CEFR or international English learner standards. 
        Design questions that specifically help learners improve their English skills (grammar, vocabulary, listening, and writing). Include the following question types: ${questionTypesString}. 
        Ensure that questions are suitable for language learners (e.g., clear context, limited idiomatic expressions unless explained).`;

        
        const questionSchemaProperties: Record<string, any> = {
            questionText: { type: "string" },
            type: { type: "string", enum: ["multiple_choice", "write", "listen"] },
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

        const endPrompt = `Return JSON in the following format:
        {
        "quizz": {
            "name": "Name of the quiz",
            "description": "Description of the quiz",
            "questions": [
            {
                "questionText": "Quiz question text here",
                "type": "multiple_choice", // Example of question type
                // If listen, add audioText feld
                ${selectedQuestionTypes.includes("listen") ? '"audioText": "This is the text to be spoken for the listening question.",' : ''}
                "answers": [
                { "answerText": "Answer A", "isCorrect": false },
                { "answerText": "Answer B", "isCorrect": true }
                ]
            },
            {
                "questionText": "Question text for write-in answer",
                "type": "write",
                "answers": [
                    { "answerText": "Correct answer for written-in", "isCorrect": true }
                ]
            },
            {
                "questionText": "Question text for listening question",
                "type": "listen",
                "audioText": "This is the text that should be spoken for this listening question.",
                "answers": [
                    { "answerText": "Correct Answer for listening", "isCorrect": true }
                ]
            }
            // ... Any additional questions can be added here
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
                                    required: ["questionText", "type", "answers"],
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
