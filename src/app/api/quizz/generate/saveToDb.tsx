import { db } from "@/db";
import { quizzes, questions as dbQuestions, questionAnswers } from "@/db/schema";
import { InferInsertModel } from "drizzle-orm";

// Definition of AiAnswer
interface AiAnswer {
    answerText: string;
    isCorrect: boolean;
}

// Definition of Aiquestion
interface AiQuestion {
    questionText: string;
    type: "multiple_choice" | "write" | "listen";
    audioText?: string; 
    answers: AiAnswer[];
}

// Definition of saveQuizzData
interface SaveQuizzData {
    name: string;
    description: string;
    questions: AiQuestion[];
    userId: string;
}

export default async function saveQuizz(quizzData: SaveQuizzData) {
    const { name, description, userId, questions } = quizzData;

    try {
        // Insert quizz data into the quizzes table
        const [newQuizz] = await db.insert(quizzes).values({
            name,
            description,
            userId,
        }).returning({ insertedId: quizzes.id });

        const quizzId = newQuizz.insertedId;

        // Use a traction to ensure atomicity
        await db.transaction(async (tx) => {
            for (const question of questions) {
                //Insert each question into the questions table
                const [{ questionId }] = await tx
                    .insert(dbQuestions)
                    .values({
                        quizzId: quizzId,
                        questionText: question.questionText,
                        type: question.type,
                        audioText: question.audioText,                         
                    })
                    .returning({ questionId: dbQuestions.id });

                if (!questionId) {
                    throw new Error("Failed to create question.");
                }

                // Insert each answer into the question_answers table
                if (question.answers && question.answers.length > 0) {
                    await tx.insert(questionAnswers).values(
                        question.answers.map((answer) => ({
                            answerText: answer.answerText,
                            isCorrect: answer.isCorrect,
                            questionId: questionId,
                        }))
                    );
                }
            }
        });

        console.log("Quiz saved successfully with ID:", quizzId);
        return { quizzId };
    } catch (error) {
        console.error("Error saving quiz:", error);
        throw error;
    }
}
