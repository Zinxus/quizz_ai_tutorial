"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Progressbar from "@/components/progressbar";
import { ChevronLeft, X } from "lucide-react";
import ResultCard from "./ResultCard";
import QuizzSubmission from "./QuizzSubmission";

const questions =  [
      {
        questionText: "Which of the following idioms best describes a situation where someone avoids taking responsibility?",
        answers: [
          { answerText: "To bite the bullet", isCorrect: false, id: 1 },
          { answerText: "To sit on the fence", isCorrect: false, id: 2 },
          { answerText: "To pass the buck", isCorrect: true, id: 3 },
          { answerText: "To go the extra mile", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "The new policy is expected to have a significant impact ________ the company's future.",
        answers: [
          { answerText: "on", isCorrect: true, id: 1 },
          { answerText: "in", isCorrect: false, id: 2 },
          { answerText: "at", isCorrect: false, id: 3 },
          { answerText: "for", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "Despite the overwhelming evidence, he continued to ________ his innocence.",
        answers: [
          { answerText: "profess", isCorrect: true, id: 1 },
          { answerText: "confess", isCorrect: false, id: 2 },
          { answerText: "allege", isCorrect: false, id: 3 },
          { answerText: "assert", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "She has a ________ for classical music and attends concerts regularly.",
        answers: [
          { answerText: "predilection", isCorrect: true, id: 1 },
          { answerText: "disinclination", isCorrect: false, id: 2 },
          { answerText: "negligence", isCorrect: false, id: 3 },
          { answerText: "apathy", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "The company is undergoing a period of ________ due to the recent economic downturn.",
        answers: [
          { answerText: "austerity", isCorrect: true, id: 1 },
          { answerText: "affluence", isCorrect: false, id: 2 },
          { answerText: "proliferation", isCorrect: false, id: 3 },
          { answerText: "exuberance", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "Were it ________ for your timely intervention, the situation could have escalated.",
        answers: [
          { answerText: "not", isCorrect: true, id: 1 },
          { answerText: "without", isCorrect: false, id: 2 },
          { answerText: "but", isCorrect: false, id: 3 },
          { answerText: "except", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "His arguments, while seemingly persuasive, didn't quite ________ muster with the panel of experts.",
        answers: [
          { answerText: "come up to", isCorrect: true, id: 1 },
          { answerText: "look up to", isCorrect: false, id: 2 },
          { answerText: "get away with", isCorrect: false, id: 3 },
          { answerText: "put up with", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "The politician's speech was full of rhetoric, but lacked any real ________.",
        answers: [
          { answerText: "substance", isCorrect: true, id: 1 },
          { answerText: "eloquence", isCorrect: false, id: 2 },
          { answerText: "verbosity", isCorrect: false, id: 3 },
          { answerText: "intonation", isCorrect: false, id: 4 }
        ]
      },
      {
        questionText: "She found it difficult to ________ her feelings after such a traumatic experience.",
        answers: [
          { answerText: "articulate", isCorrect: true, id: 1},
          { answerText: "imply", isCorrect: false, id: 2 },
          { answerText: "infer", isCorrect: false, id: 3 },
          { answerText: "insinuate", isCorrect: false, id: 4}
        ]
      },
      {
        questionText: "The company decided to ________ its operations in several unprofitable regions.",
        answers: [
          { answerText: "downsize", isCorrect: false, id:1 },
          { answerText: "streamline", isCorrect: false, id: 2},
          { answerText: "consolidate", isCorrect: true, id: 3},
          { answerText: "amalgamate", isCorrect: false, id: 4 }
        ]
      }
    ]

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
        <Button variant="neo" size="lg" onClick={handleNext}>
          {!started ? "Start" : (currentQuestion === questions.length - 1) ? "Submit" : "Next"}
        </Button>
      </footer>

    </div>
  );
}
