"use server";

import { db } from "@/db";
import {
  quizzes,
  questions,
  questionAnswers,
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export interface UpdatedQuizPayload {
  name: string;
  description: string | null;
  questions: Array<{
    id?: number; // `id` sẽ có nếu là câu hỏi đã tồn tại
    questionText: string;
    type: "multiple_choice" | "write" | "listen";
    audioText?: string | null;
    answers?: Array<{
      id?: number; // `id` sẽ có nếu là đáp án đã tồn tại
      answerText: string;
      isCorrect: boolean;
    }>;
    order: number; // Đảm bảo luôn có order
  }>;
}

export async function updateQuizzFull(
  quizzId: number,
  payload: UpdatedQuizPayload
) {
  await db.transaction(async (tx) => {
    // 1. Cập nhật thông tin của quiz
    await tx
      .update(quizzes)
      .set({
        name: payload.name,
        description: payload.description,
      })
      .where(eq(quizzes.id, quizzId));

    // 2. Lấy danh sách các câu hỏi hiện có trong DB cho quiz này
    const currentQuestionsInDb = await tx
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.quizzId, quizzId));

    const currentQuestionIdsInDb = new Set(currentQuestionsInDb.map((q) => q.id));
    const incomingQuestionIds = new Set(payload.questions.filter(q => q.id !== undefined).map(q => q.id!));

    const questionsToUpdate = payload.questions.filter(q => q.id !== undefined && currentQuestionIdsInDb.has(q.id!));
    const questionsToInsert = payload.questions.filter(q => q.id === undefined);
    const questionIdsToDelete = Array.from(currentQuestionIdsInDb).filter(id => !incomingQuestionIds.has(id));

    // 3. Xóa các câu hỏi và đáp án không còn trong payload
    if (questionIdsToDelete.length > 0) {
      // Lấy ID của các đáp án liên quan đến các câu hỏi sẽ bị xóa
      const answersToDelete = await tx
        .select({ id: questionAnswers.id })
        .from(questionAnswers)
        .where(inArray(questionAnswers.questionId, questionIdsToDelete));

      const answerIdsToDelete = answersToDelete.map(a => a.id);

      if (answerIdsToDelete.length > 0) {
        await tx.delete(questionAnswers).where(inArray(questionAnswers.id, answerIdsToDelete));
      }

      await tx.delete(questions).where(inArray(questions.id, questionIdsToDelete));
    }

    // 4. Cập nhật các câu hỏi hiện có
    for (const q of questionsToUpdate) {
      await tx
        .update(questions)
        .set({
          questionText: q.questionText,
          type: q.type,
          audioText: q.type === "listen" ? q.audioText ?? null : null,
          order: q.order, // Cập nhật thứ tự
        })
        .where(eq(questions.id, q.id!));

      // Lấy các đáp án hiện có cho câu hỏi này
      const currentAnswersInDb = await tx
        .select({ id: questionAnswers.id })
        .from(questionAnswers)
        .where(eq(questionAnswers.questionId, q.id!));

      const currentAnswerIdsInDb = new Set(currentAnswersInDb.map(a => a.id));
      const incomingAnswerIds = new Set(q.answers?.filter(a => a.id !== undefined).map(a => a.id!) || []);

      const answersToUpdate = q.answers?.filter(a => a.id !== undefined && currentAnswerIdsInDb.has(a.id!)) || [];
      const answersToInsert = q.answers?.filter(a => a.id === undefined) || [];
      const answerIdsToDelete = Array.from(currentAnswerIdsInDb).filter(id => !incomingAnswerIds.has(id));

      // Xóa đáp án không còn
      if (answerIdsToDelete.length > 0) {
        await tx.delete(questionAnswers).where(inArray(questionAnswers.id, answerIdsToDelete));
      }

      // Cập nhật đáp án hiện có
      for (const a of answersToUpdate) {
        await tx
          .update(questionAnswers)
          .set({
            answerText: a.answerText,
            isCorrect: a.isCorrect,
          })
          .where(eq(questionAnswers.id, a.id!));
      }

      // Insert đáp án mới
      if (answersToInsert.length > 0) {
        await tx.insert(questionAnswers).values(
          answersToInsert.map((a) => ({
            answerText: a.answerText,
            isCorrect: a.isCorrect,
            questionId: q.id!, // Gắn với ID của câu hỏi cha
          }))
        );
      }
    }

    // 5. Thêm mới các câu hỏi (và đáp án của chúng)
    for (const q of questionsToInsert) {
      const [{ insertedId }] = await tx
        .insert(questions)
        .values({
          questionText: q.questionText,
          type: q.type,
          audioText: q.type === "listen" ? q.audioText ?? null : null,
          quizzId,
          order: q.order,
        })
        .returning({ insertedId: questions.id });

      if (q.answers?.length) {
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