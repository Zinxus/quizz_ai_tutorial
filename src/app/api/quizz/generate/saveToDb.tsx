import { db } from "@/db";
import { quizzes, questions as dbQuestions, questionAnswers } from "@/db/schema";
import { InferInsertModel } from "drizzle-orm";

type Quizz = InferInsertModel<typeof quizzes>;

interface SaveQuizzData extends Quizz {
    questions: Array<{
        questionText: string;
        answer: Array<{
            answerText: string;
            isCorrect: boolean;
        }>;
    }>;
    userId?: string;
}


export default async function saveQuizz(quizzData: SaveQuizzData) {
    const { name, description, userId, questions } = quizzData;

    const newQuizz = await db.insert(quizzes).values({
        name,
        description,
        userId,
    }).returning({insertedId: quizzes.id});
    const quizzId = newQuizz[0].insertedId;

    await db.transaction(async (tx) => {
        for (const question of questions){
            const [{questionId}] = await tx
                .insert(dbQuestions)
                .values({
                    questionText: question.questionText,
                    quizzId
                })
                .returning({questionId: dbQuestions.id});

                if (question.answer && question.answer.length > 0) {
                    await tx.insert(questionAnswers).values(
                        question.answer.map((answer) => ({
                            answerText: answer.answerText,
                            isCorrect: answer.isCorrect,
                            questionId
                        }))
                    )
                }
        }
    })

    return { quizzId };    
}