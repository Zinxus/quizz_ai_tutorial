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
type question = InferSelectModel<typeof DbQuestions> & { answers: Answer[] };
type Quizz = InferSelectModel<typeof quizzes> & { questions: question[] };

type Props = {
    quizz: Quizz;
}

export default function QuizzQuestions(props: Props) {
  const { questions } = props.quizz;
  const [started, setStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const router = useRouter();

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

  };
  const handleAnswer = (answer: Answer, questionId: number) => {
    setSelectedAnswers(answer.id);
    const newUserAnswersArr = [...userAnswers, { 
        answerId: answer.id,
        questionId
     }];
     setUserAnswers(newUserAnswersArr);
    const isCurrentCorrect = answer.isCorrect;
    if (isCurrentCorrect) {
      setScore(score + 1);
    }
  }

  const handleSubmit = async () => {
    try{
        const subId = await saveSubmission({ score}, props.quizz.id);
    } catch (e){
        console.log(e);
    }

    setSubmitted(true);
  }

  const handlePerssprev = () => {
    if(currentQuestion !== 0){
        setCurrentQuestion(prevCurrentQuestion => prevCurrentQuestion - 1);
    }
  }

  const handleExit = () =>{
    router.push("/dashboard");
  }

  const scorepercentage: number = Math.round((score / questions.length) * 100);
  const selectedAnswers: number | null | undefined = userAnswers.find((item) => item
  .questionId === questions[currentQuestion].id)? .answerId;
  const isCorrect: boolean | null | undefined= questions[currentQuestion].answers.findIndex((answer) => 
    answer.id === selectedAnswers) ? questions[currentQuestion].answers.find((answer) =>
    answer.id === selectedAnswers)? .isCorrect : null ;
  
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
          <Button size="icon" variant="outline"
          onClick={handlePerssprev}><ChevronLeft />
          </Button>
          <Progressbar value={started ? ((currentQuestion + 1) / questions.length) * 100 : 0} />
          <Button size="icon" variant="outline" onClick={handleExit}>
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
                const variant = selectedAnswers === answer.id ? 
                (answer.isCorrect ? "neoSuccess" : "neoDanger") : "neoOutline";
                return (
                  <Button key={answer.id} disabled={!!selectedAnswers } 
                  variant={variant} size="xl" 
                  onClick={() => handleAnswer(answer, questions[currentQuestion].id)} 
                  className=" disabled:opacity-100 "><p>{answer.answerText}</p></Button>
                ); 
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 pb-9 px-6">
          <ResultCard 
            iscorrect={isCorrect} 
            correctAnswer={questions[currentQuestion].answers.find(answer => answer.isCorrect)?.answerText || ""}
          />{
            (currentQuestion === questions.length - 1) ?  
              <Button variant="neo" size="lg" onClick={handleSubmit}>Submit</Button> :
              <Button variant="neo" size="lg" onClick={handleNext}>
                {!started ? "Start" : "Next"}
              </Button>
          }
      </footer>

    </div>
  );
}
