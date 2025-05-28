"use client";

import QuizzItem from "./QuizzItem";

export type QuizzBasic = {
  id: number;
  name: string;
  description: string | null;
  questionsCount: number;
};

export default function QuizzList({ quizzes }: { quizzes: QuizzBasic[] }) {
  return (
    <ul className="space-y-4">
      {quizzes.map((q) => (
        <QuizzItem key={q.id} quizz={q} />
      ))}
    </ul>
  );
}
