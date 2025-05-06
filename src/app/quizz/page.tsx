"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Progressbar from "@/components/progressbar";
import { ChevronLeft, X } from "lucide-react";
import ResultCard from "./ResultCard";
import QuizzSubmission from "./QuizzSubmission";

const questions = [
  {
    questionText: "What is the virtual DOM?",
    answers: [
      { answerText: "A virtual representation of the DOM", isCorrect: true, id: 1 },
      { answerText: "A real DOM", isCorrect: false, id: 2 },
      { answerText: "A virtual representation of the browser", isCorrect: false, id: 3 },
      { answerText: "A virtual representation of the server", isCorrect: false, id: 4 },
    ],
  },
  {
    questionText: "What is the purpose of React Router?",
    answers: [
      { answerText: "To manage application state", isCorrect: false, id: 1 },
      { answerText: "To handle user authentication", isCorrect: false, id: 2 },
      { answerText: "To manage application routing", isCorrect: true, id: 3 },
      { answerText: "To handle API requests", isCorrect: false, id: 4 },
    ],
  },
];

export default function Home() {
  const [started, setStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number| null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleNext = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }else{
      setSubmitted(true);
      return;
    }

    setSelectedAnswers(null);
    setIsCorrect(null);
  };
  const handleAnswer = (answer: { id: number; isCorrect: boolean; answerText: string }) => {
    setSelectedAnswers(answer.id);  
    const isCurrentCorrect = answer.isCorrect;
    if (isCurrentCorrect) {
      setScore(score + 1);
    }
    setIsCorrect(isCurrentCorrect);
  }

  const scorepercentage: number = Math.round((score / questions.length) * 100);

  if(submitted){
    return(
      <QuizzSubmission
      score={score}
      scorepercentage={scorepercentage}
      totalQuestions={questions.length }
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background shadow-md py-4 px-6">
        <header className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
          <Button size="icon" variant="outline">
            <ChevronLeft />
          </Button>
          <Progressbar value={started ? ((currentQuestion + 1) / questions.length) * 100 : 0} />
          <Button size="icon" variant="outline">
            <X />
          </Button>
        </header>
      </div>

      {/* Main */}
      <main className="flex flex-col flex-1 items-center justify-center px-6">
        {!started ? (
          <h1 className="text-3xl font-bold">Welcome to Quiz Page 👋</h1>
        ) : (
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-6">{questions[currentQuestion].questionText}</h2>
            <div className="flex flex-col gap-4">
              {questions[currentQuestion].answers.map((answer) => {
                const variant = selectedAnswers === answer.id ? (answer.isCorrect ? "neoSuccess" : "neoDanger") : "neoOutline";
                return (
                  <Button key={answer.id} variant={variant} size="xl" onClick={() => handleAnswer(answer)}><p>{answer.answerText}</p></Button>
                ); 
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 pb-9 px-6">
        {started && (
          <ResultCard 
            iscorrect={isCorrect} 
            correctAnswer={questions[currentQuestion].answers.find(answer => answer.isCorrect)?.answerText || ""}
          />
        )}
        <Button variant="default" size="lg" onClick={handleNext}>
          {!started ? "Start" : (currentQuestion === questions.length - 1) ? "Submit" : "Next"}
        </Button>
      </footer>

    </div>
  );
}
