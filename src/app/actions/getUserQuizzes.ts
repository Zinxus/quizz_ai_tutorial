// src/actions/getUserQuizzes.ts
import { db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { quizzes, questions } from "@/db/schema";

export default async function getUserQuizzes(userId: string) {
  return db
    .select({
      id: quizzes.id,
      name: quizzes.name,
      description: quizzes.description,
      questionsCount: sql<number>`(
        SELECT COUNT(*) FROM ${questions} WHERE ${questions.quizzId} = ${quizzes.id}
      )`,
    })
    .from(quizzes)
    .where(eq(quizzes.userId, userId));
}
