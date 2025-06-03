"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Progressbar from "@/components/progressbar";
import { X } from "lucide-react";
import QuizzSubmission from "./QuizzSubmission"; 
import { InferSelectModel } from "drizzle-orm";
import { questionAnswers, questions as DbQuestions, quizzes } from "@/db/schema";
import { saveSubmission } from "@/actions/saveSubmissons"; 
import { useRouter } from "next/navigation";

// Define data types from Drizzle schema
type Answer = InferSelectModel<typeof questionAnswers>;
type Question = InferSelectModel<typeof DbQuestions> & { answers: Answer[] };
type Quizz = InferSelectModel<typeof quizzes> & { questions: Question[] };

// Define data types for the QuizzPage component props
type Props = { quizz: Quizz };

// Defines the data type for user responses
interface UserAnswer {
  questionId: number;
  selectedAnswerId?: number;
  userAnswerText?: string; 
  isCorrect: boolean;
}

// import there question components
import MultipleChoiceQuestion from "./QuestionTypes/MultipleChoiceQuestion";
import WriteQuestion from "./QuestionTypes/WriteQuestion";
import ListenQuestion from "./QuestionTypes/ListenQuestion";

export default function QuizzPage({ quizz }: Props) {
  const { questions } = quizz; 
  const [started, setStarted] = useState(false); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false); 
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]); 
  const router = useRouter(); 

  // Get the current question based on currentQuestionIndex
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  //Test submission processing
  const handleSubmit = useCallback(async () => {
    try {
      await saveSubmission({ score, userAnswers }, quizz.id);
      setSubmitted(true); 
    } catch (e) {
      console.error("Error submitting quiz:", e);
    }
  }, [score, userAnswers, quizz.id]);

  // Handle when user answers a question
  const handleQuestionAnswered = useCallback(
    (
      questionId: number,
      isCorrect: boolean,
      selectedAnswerId?: number,
      userAnswerText?: string
    ) => {
      // Update score if answer is correct
      if (isCorrect) {
        setScore((prev) => prev + 1);
      }

      // Save user responses
      setUserAnswers((prev) => [
        ...prev,
        { questionId, selectedAnswerId, userAnswerText, isCorrect },
      ]);

      // If this is the last question, submit the test.
      if (isLastQuestion) {
        handleSubmit();
      } else {
      // If not the last question, move to the next question after a short delay
      // (Example: 3 second for the user to view the ResultCard)
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
        }, 1500);
      }
    },
    [isLastQuestion, handleSubmit]
  );

  // Handling exit test
  const handleExit = () => {
    router.push("/dashboard"); 
  };

  // Calculate score percentage
  const scorePercentage = Math.round((score / questions.length) * 100);

  // Show submission screen if submitted
  if (submitted) {
    return (
      <QuizzSubmission
        score={score}
        scorepercentage={scorePercentage}
        totalQuestions={questions.length}
      />
    );
  }

  //Function to render question based on type
  const renderQuestionComponent = () => {
    if (!currentQuestion) {
      return <div>No questions available for this quiz.</div>;
    }

    switch (currentQuestion.type) {
      case "multiple_choice":
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            onAnswered={handleQuestionAnswered}
            isLastQuestion={isLastQuestion}
          />
        );
      case "write":
        return (
          <WriteQuestion
            question={currentQuestion}
            onAnswered={handleQuestionAnswered}
            isLastQuestion={isLastQuestion}
          />
        );
      case "listen":
        return (
          <ListenQuestion
            question={currentQuestion}
            onAnswered={handleQuestionAnswered}
            isLastQuestion={isLastQuestion}
          />
        );
      default:
        return <div>Unsupported question type.</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header with Progressbar and exit button */}
      <div className="sticky top-0 z-20 bg-background shadow-md py-4 px-6">
        <header className="grid grid-cols-[1fr,auto] items-center gap-4">
          <Progressbar
            value={started ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0}
          />
          <Button size="icon" variant="outline" onClick={handleExit}>
            <X />
          </Button>
        </header>
      </div>

      {/* Main content area */}
      <main className="flex flex-col flex-1 items-center justify-center px-6 pb-36">
        {!started ? (
          <>
            <h1 className="text-3xl font-bold mb-6">Welcome to Quiz Page 👋</h1>
            <Button variant="neo" size="lg" onClick={() => setStarted(true)}>
              Start
            </Button>
          </>
        ) : (
          // Show current question
          <div className="w-full max-w-md text-center">
            {renderQuestionComponent()}
          </div>
        )}
      </main>

      {/* Footer  */}
      <footer className="sticky bottom-0 z-20 bg-background pb-9 px-6">
      </footer>
    </div>
  );
}
