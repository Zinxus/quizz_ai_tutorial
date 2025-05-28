"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ResultCard from "../ResultCard"; 
import { InferSelectModel } from "drizzle-orm";
import { questionAnswers, questions as DbQuestions } from "@/db/schema";

// Define the type for the answer model
type Answer = InferSelectModel<typeof questionAnswers>;
type Question = InferSelectModel<typeof DbQuestions> & { answers: Answer[] };

interface MultipleChoiceQuestionProps {
  question: Question;
  onAnswered: (
    questionId: number,
    isCorrect: boolean,
    selectedAnswerId: number
  ) => void;
  isLastQuestion: boolean;
}

export default function MultipleChoiceQuestion({
  question,
  onAnswered,
  isLastQuestion,
}: MultipleChoiceQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false); 

  // Reset selected answer and answered state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
  }, [question.id]);

  // Find the correct answer based on the question's answers
  const correctAnswer = question.answers.find((a) => a.isCorrect);
  const isCorrect =
    selectedAnswer !== null ? correctAnswer?.id === selectedAnswer : null;

  // Select an answer and mark the question as answered
  const handleSelectAnswer = (answer: Answer) => {
    if (!isAnswered) {
      setSelectedAnswer(answer.id);
      setIsAnswered(true);
    }
  };

  // Mark the question as answered and call the onAnswered callback
  const handleNextOrSubmit = () => {
    if (selectedAnswer !== null) {
      // Call callback onAnswered with question ID, correctness, and selected answer
      onAnswered(question.id, isCorrect || false, selectedAnswer);
    }
  };

  return (
    <div className="w-full max-w-md text-center">
      <h2 className="text-2xl font-bold mb-6">{question.questionText}</h2>
      <div className="flex flex-col gap-4">
        {question.answers.map((answer) => {
          const variant =
            isAnswered && selectedAnswer === answer.id
              ? answer.isCorrect
                ? "neoSuccess" 
                : "neoDanger" 
              : isAnswered && answer.isCorrect 
              ? "neoSuccess" 
              : "neoOutline"; 

          return (
            <Button
              key={answer.id}
              disabled={isAnswered} 
              variant={variant}
              size="xl"
              onClick={() => handleSelectAnswer(answer)}
              className="disabled:opacity-100 whitespace-normal break-words text-left"
            >
              {answer.answerText}
            </Button>
          );
        })}
      </div>

      {/* Display ResultCard and Next/Submit button after answering */}
      {isAnswered && (
        <div className="mt-6">
          <ResultCard
            iscorrect={isCorrect}
            correctAnswer={correctAnswer?.answerText || ""}
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