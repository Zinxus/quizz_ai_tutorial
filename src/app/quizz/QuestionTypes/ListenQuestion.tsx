"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ResultCard from "../ResultCard";
import { InferSelectModel } from "drizzle-orm";
import { questions as DbQuestions, questionAnswers } from "@/db/schema";
import { Play, Pause, RotateCcw } from "lucide-react";

type Answer = InferSelectModel<typeof questionAnswers>;
type Question = InferSelectModel<typeof DbQuestions> & {
  answers: Answer[];
  audioText?: string | null;
};

interface ListenQuestionProps {
  question: Question;
  onAnswered: (
    questionId: number,
    isCorrect: boolean,
    selectedAnswerId?: number,
    userAnswerText?: string
  ) => void;
  isLastQuestion: boolean;
}

export default function ListenQuestion({
  question,
  onAnswered,
  isLastQuestion,
}: ListenQuestionProps) {
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const correctAnswerText =
    question.answers[0]?.answerText?.toLowerCase().trim() ?? "";

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    setUserAnswer("");
    setIsAnswered(false);
    setIsCorrect(null);
    setPlaybackRate(1);
    cancelSpeech();
  }, [question.id, cancelSpeech]);

  const speakText = useCallback((text: string, rate: number = 1) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("Speech synthesis not supported or text is empty.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;

    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handlePlayPauseClick = () => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
    } else if (synth.paused) {
      synth.resume();
    } else if (question.audioText) {
      speakText(question.audioText, playbackRate);
    }
  };

  const handleReplayClick = () => {
    cancelSpeech();
    setTimeout(() => {
      if (question.audioText) {
        speakText(question.audioText, playbackRate);
      }
    }, 100); // Delay to allow any previous speech to cancel
  };

  const handleChangePlaybackRate = useCallback(
    (rate: number) => {
      setPlaybackRate(rate);
      cancelSpeech();
      setTimeout(() => {
        if (question.audioText) {
          speakText(question.audioText, rate);
        }
      }, 100);
    },
    [question.audioText, speakText, cancelSpeech]
  );

  const handleSubmitAnswer = async () => {
    if (userAnswer.trim() === "") return;

    cancelSpeech();
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

  const getSpeechStatus = () => {
    if (typeof window === "undefined") return "idle";
    const synth = window.speechSynthesis;
    if (synth.paused) return "paused";
    if (synth.speaking) return "speaking";
    return "idle";
  };

  return (
    <div className="w-full max-w-md text-center space-y-4 p-4 bg-card rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-card-foreground">{question.questionText}</h2>

      {question.audioText && (
        <div className="flex items-center justify-center gap-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-full p-1 shadow-md">
          <Button
            onClick={handlePlayPauseClick}
            disabled={isAnswered}
            variant="ghost"
            size="icon"
            title={
              getSpeechStatus() === "speaking"
                ? "Stop"
                : getSpeechStatus() === "paused"
                ? "Continue"
                : "Start"
            }
            className="rounded-full w-12 h-12 text-2xl text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {getSpeechStatus() === "speaking" ? <Pause /> : <Play />}
          </Button>

          <Button
            onClick={handleReplayClick}
            disabled={isAnswered}
            variant="ghost"
            size="icon"
            title="Replay"
            className="rounded-full w-12 h-12 text-2xl text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <RotateCcw />
          </Button>

          <div className="flex gap-1 p-1 rounded-xl">
            {[0.5, 0.7, 1].map((rate) => (
              <Button
                key={rate}
                onClick={() => handleChangePlaybackRate(rate)}
                disabled={isAnswered || playbackRate === rate}
                variant={playbackRate === rate ? "secondary" : "ghost"}
                size="sm"
                title={`${rate}x`}
                className="rounded-lg px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        className="w-full p-4 border border-input rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-lg text-foreground bg-input"
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
          className="w-full mt-4"
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
            className="mt-4 w-full"
          >
            {isLastQuestion ? "Submit" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
