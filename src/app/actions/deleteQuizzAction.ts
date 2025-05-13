// src/app/actions/deleteQuizzAction.ts
"use server";

import { db } from "@/db";
import { quizzes, questions, questionAnswers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function deleteQuizzAction(quizzId: number) {
  await db.transaction(async (tx) => {
    // 1. Lấy danh sách question IDs của quiz
    const qList = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.quizzId, quizzId));
    const questionIds = qList.map((q) => q.id);

    // 2. Xóa tất cả answers liên quan
    if (questionIds.length) {
      await tx
        .delete(questionAnswers)
        .where(inArray(questionAnswers.questionId, questionIds));
    }

    // 3. Xóa tất cả questions liên quan
    await tx
      .delete(questions)
      .where(eq(questions.quizzId, quizzId));

    // 4. Cuối cùng xóa quiz
    await tx
      .delete(quizzes)
      .where(eq(quizzes.id, quizzId));
  });

  return { success: true };
}
