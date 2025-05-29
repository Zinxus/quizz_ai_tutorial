"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ResultCard from "../ResultCard";
import { InferSelectModel } from "drizzle-orm";
import { questions as DbQuestions, questionAnswers } from "@/db/schema";

type Answer = InferSelectModel<typeof questionAnswers>;
type Question = InferSelectModel<typeof DbQuestions> & { answers: Answer[] };

interface WriteQuestionProps {
  question: Question;
  onAnswered: (
    questionId: number,
    isCorrect: boolean,
    selectedAnswerId?: number,
    userAnswerText?: string
  ) => void;
  isLastQuestion: boolean;
}

export default function WriteQuestion({
  question,
  onAnswered,
  isLastQuestion,
}: WriteQuestionProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    setUserAnswer("");
    setIsAnswered(false);
    setIsCorrect(null);
  }, [question.id]);

  const correctAnswerText =
    question.answers[0]?.answerText?.toLowerCase().trim() ?? "";

  const handleSubmitAnswer = async () => {
    if (userAnswer.trim() === "") return;

    setIsAnswered(true);

    try {
      const res = await fetch("/api/quizz/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: question.questionText,
          correctAnswerText,
          userAnswer: userAnswer.trim(),
        }),
      });
      const data = await res.json();
      setIsCorrect(data.isCorrect);
      onAnswered(question.id, data.isCorrect, undefined, userAnswer);
    } catch (error) {
      console.error("Failed to evaluate answer:", error);
      setIsCorrect(false);
      onAnswered(question.id, false, undefined, userAnswer);
    }
  };

  const handleNextOrSubmit = () => {
    if (!isAnswered) return;
  };

  return (
    <div className="w-full max-w-md text-center space-y-4">
      <h2 className="text-2xl font-bold mb-6">{question.questionText}</h2>
      <textarea
        className="w-full p-4 border text-black rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y min-h-[120px] text-lg"
        rows={4}
        placeholder="Write your answer here..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        disabled={isAnswered}
      />
      {!isAnswered ? (
        <Button
          variant="neo"
          size="lg"
          onClick={handleSubmitAnswer}
          disabled={userAnswer.trim() === ""}
        >
          Submit Answer
        </Button>
      ) : (
        <div className="mt-6">
          <ResultCard
            iscorrect={isCorrect}
            correctAnswer={correctAnswerText || ""}
          />
          <Button
            variant="neo"
            size="lg"
            onClick={handleNextOrSubmit}
            className="mt-4"
          >
            {isLastQuestion ? "Submit" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}