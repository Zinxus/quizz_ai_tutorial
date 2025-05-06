import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { JsonOutputFunctionsParser } from '@langchain/core/output_parsers';
import { HumanMessage } from '@langchain/core/messages';

import saveQuizz from './saveToDb';

export async function POST(request: NextRequest) {
    const body = await request.formData();
    const document = body.get('pdf');

    try {
        const pdfLoader = new PDFLoader(document as Blob, {
            parsedItemSeparator: " "
        });
        const docs = await pdfLoader.load();

        const selectedDocuments = docs.filter((doc: { pageContent?: string }) => doc.pageContent !== undefined);
        const texts = selectedDocuments.map((doc) => doc.pageContent);

        const prompt = "Generate a quiz with 5 questions and answers based on the following text:";

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY not provided" },
                { status: 500 }
            );
        }
        
        const model = new ChatOpenAI({
            modelName: 'gpt-4-1106-preview',
            temperature: 0.7,
        });

        const parser = new JsonOutputFunctionsParser();
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
                                    required: ["question", "answer"],
                                },
                            },
                        }
                    }
                },
            }
        }

        const runable = model.bind({
            functions: [extrectionFunctionSchema],
            function_call: { name: "extractor" },
        })
        .pipe(parser);

        const message = new HumanMessage(prompt + "\n" + texts.join("\n"));
        

        const result = await runable.invoke([ message,]);
        
        console.log(result);

        const { quizzId } = await saveQuizz(result.quizz);

        return NextResponse.json({ quizzId }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
