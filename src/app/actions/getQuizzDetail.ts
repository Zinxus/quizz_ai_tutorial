"use server";

import { db } from "@/db";
import { quizzes, questions, questionAnswers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function getQuizzDetail(quizzId: number) {
  // Add validation for quizzid
  const [quiz] = await db
    .select({
      id: quizzes.id,
      name: quizzes.name,
      description: quizzes.description,
    })
    .from(quizzes)
    .where(eq(quizzes.id, quizzId));

  if (!quiz) return null;

  // Take questions
  const qList = await db
    .select({
      id: questions.id,
      questionText: questions.questionText,
      type: questions.type,
      audioText: questions.audioText,
      order: questions.order,
    })
    .from(questions)
    .where(eq(questions.quizzId, quizzId));

  const questionIds = qList.map((q) => q.id);
  // Take answers
  const answers = questionIds.length
    ? await db
        .select({
          id: questionAnswers.id,
          answerText: questionAnswers.answerText,
          isCorrect: questionAnswers.isCorrect,
          questionId: questionAnswers.questionId,
        })
        .from(questionAnswers)
        .where(inArray(questionAnswers.questionId, questionIds))
    : [];

  // Combine questions with their ansers
  const questionsWithAnswers = qList.map((q) => ({
  ...q,
  // Always filter answers by questionId, regardless of type
  answers: answers.filter((a) => a.questionId === q.id),
  }));

  return {
    ...quiz,
    questions: questionsWithAnswers,
  };
}
