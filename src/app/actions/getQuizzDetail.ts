// src/app/actions/getQuizzDetail.ts
"use server";

import { db } from "@/db";
import { quizzes, questions, questionAnswers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function getQuizzDetail(quizzId: number) {
  // Lấy quiz cơ bản
  const [quiz] = await db
    .select({ id: quizzes.id, name: quizzes.name, description: quizzes.description })
    .from(quizzes)
    .where(eq(quizzes.id, quizzId));
  if (!quiz) return null;

  // Lấy questions
  const qList = await db
    .select({ id: questions.id, questionText: questions.questionText })
    .from(questions)
    .where(eq(questions.quizzId, quizzId));

  const qIds = qList.map((q) => q.id);
  // Lấy answers
  const aList = qIds.length
    ? await db
        .select({
          id: questionAnswers.id,
          answerText: questionAnswers.answerText,
          isCorrect: questionAnswers.isCorrect,
          questionId: questionAnswers.questionId,
        })
        .from(questionAnswers)
        .where(inArray(questionAnswers.questionId, qIds))
    : [];

  // Gắn answers vào questions
  const questionsWithAnswers = qList.map((q) => ({
    ...q,
    answers: aList.filter((a) => a.questionId === q.id),
  }));

  return { ...quiz, questions: questionsWithAnswers };
}
