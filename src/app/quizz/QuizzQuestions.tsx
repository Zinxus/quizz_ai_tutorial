"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Progressbar from "@/components/progressbar";
import { ChevronLeft, X } from "lucide-react";
import ResultCard from "./ResultCard";
import QuizzSubmission from "./QuizzSubmission";
import { InferSelectModel } from "drizzle-orm";
import { questionAnswers, questions as DbQuestions, quizzes } from "@/db/schema";
import { saveSubmission } from "@/actions/saveSubmissons";
import { useRouter } from "next/navigation";

type Answer = InferSelectModel<typeof questionAnswers>;
type Question = InferSelectModel<typeof DbQuestions> & { answers: Answer[] };
type Quizz = InferSelectModel<typeof quizzes> & { questions: Question[] };

type Props = {
  quizz: Quizz;
};

export default function QuizzQuestions({ quizz }: Props) {
  const { questions } = quizz;
  const [started, setStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ questionId: number; answerId: number }[]>([]);
  const router = useRouter();

  const handleNext = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
    } else {
      setSubmitted(true);
    }
  };

  const handleAnswer = (answer: Answer, questionId: number) => {
    setSelectedAnswer(answer.id);
    setUserAnswers((prev) => [...prev, { questionId, answerId: answer.id }]);
    if (answer.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await saveSubmission({ score }, quizz.id);
    } catch (e) {
      console.error(e);
    }
    setSubmitted(true);
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(null);
    }
  };

  const handleExit = () => {
    router.push("/dashboard");
  };

  const scorePercentage = Math.round((score / questions.length) * 100);

  const currentQuestionData = questions[currentQuestion];
  const isCorrect =
    selectedAnswer !== null
      ? currentQuestionData.answers.find((a) => a.id === selectedAnswer)?.isCorrect ?? null
      : null;

  if (submitted) {
    return (
      <QuizzSubmission
        score={score}
        scorepercentage={scorePercentage}
        totalQuestions={questions.length}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background shadow-md py-4 px-6">
        <header className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
          <Button size="icon" variant="outline" onClick={handlePrev}>
            <ChevronLeft />
          </Button>
          <Progressbar
            value={started ? ((currentQuestion + 1) / questions.length) * 100 : 0}
          />
          <Button size="icon" variant="outline" onClick={handleExit}>
            <X />
          </Button>
        </header>
      </div>

      <main className="flex flex-col flex-1 items-center justify-center px-6">
        {!started ? (
          <h1 className="text-3xl font-bold">Welcome to Quiz Page 👋</h1>
        ) : (
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-6">
              {currentQuestionData.questionText}
            </h2>
            <div className="flex flex-col gap-4">
              {currentQuestionData.answers.map((answer) => {
                const variant =
                  selectedAnswer === answer.id
                    ? answer.isCorrect
                      ? "neoSuccess"
                      : "neoDanger"
                    : "neoOutline";
                return (
                  <Button
                    key={answer.id}
                    disabled={selectedAnswer !== null}
                    variant={variant}
                    size="xl"
                    onClick={() => handleAnswer(answer, currentQuestionData.id)}
                    className="disabled:opacity-100"
                  >
                    <p>{answer.answerText}</p>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 pb-9 px-6">
        <ResultCard
          iscorrect={isCorrect}
          correctAnswer={
            currentQuestionData.answers.find((a) => a.isCorrect)?.answerText || ""
          }
        />
        {currentQuestion === questions.length - 1 ? (
          <Button variant="neo" size="lg" onClick={handleSubmit}>
            Submit
          </Button>
        ) : (
          <Button variant="neo" size="lg" onClick={handleNext}>
            {!started ? "Start" : "Next"}
          </Button>
        )}
      </footer>
    </div>
  );
}
