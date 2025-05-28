"use server";

import { db } from "@/db";
import { quizzes, questions, questionAnswers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function deleteQuizzAction(quizzId: number) {
  await db.transaction(async (tx) => {
    // Load all questions for the quiz
    const qList = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.quizzId, quizzId));
    const questionIds = qList.map((q) => q.id);

    // Delete all question ansers 
    if (questionIds.length) {
      await tx
        .delete(questionAnswers)
        .where(inArray(questionAnswers.questionId, questionIds));
    }

    // Delete all question recards
    await tx
      .delete(questions)
      .where(eq(questions.quizzId, quizzId));

    // Delete the quiz itself
    await tx
      .delete(quizzes)
      .where(eq(quizzes.id, quizzId));
  });

  return { success: true };
}
