"use server";

import { db } from "@/db";
import {
  quizzes,
  questions,
  questionAnswers,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export interface UpdatedQuizPayload {
  name: string;
  description: string | null;
  questions: Array<{
    questionText: string;
    answers: Array<{
      answerText: string;
      isCorrect: boolean;
    }>;
  }>;
}

export async function updateQuizzFull(
  quizzId: number,
  payload: UpdatedQuizPayload
) {
  await db.transaction(async (tx) => {
    // Update information of the quiz
    await tx
      .update(quizzes)
      .set({
        name: payload.name,
        description: payload.description,
      })
      .where(eq(quizzes.id, quizzId));

    // Take the old questions for the quiz
    const oldQuestions = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.quizzId, quizzId));

    const questionIds = oldQuestions.map((q) => q.id);

    // Delete old answers for the quiz
    if (questionIds.length > 0) {
      await tx
        .delete(questionAnswers)
        .where(inArray(questionAnswers.questionId, questionIds));
    }

    // Dellete old questions for the quiz
    await tx
      .delete(questions)
      .where(eq(questions.quizzId, quizzId));

    // Insert new questions and answers
    for (const q of payload.questions) {
      const [{ insertedId }] = await tx
        .insert(questions)
        .values({
          questionText: q.questionText,
          quizzId,                         
        })
        .returning({ insertedId: questions.id });

      if (q.answers.length > 0) {
        await tx.insert(questionAnswers).values(
          q.answers.map((a) => ({
            answerText: a.answerText,     
            isCorrect: a.isCorrect,        
            questionId: insertedId,        
          }))
        );
      }
    }
  });

  return { success: true };
}
