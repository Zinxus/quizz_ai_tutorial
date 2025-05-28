"use client";

import { useEffect } from "react";
import Bar from "@/components/Bar";
import Image from "next/image";
import { useReward } from "react-rewards";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";


type Props = {
    scorepercentage: number;
    score: number;
    totalQuestions: number;
}

// QuizzSubmission component displays the results of a quiz submission
export default function QuizzSubmission(props: Props) {
    const { scorepercentage, score, totalQuestions } = props;
    const { reward } = useReward("rewardId", "confetti"); 
    const router = useRouter();

    useEffect(() => {
        if (scorepercentage === 100) {
            reward();
        }
    }, [scorepercentage, reward]);

    const onHandleBack = () => {
        router.back();
    }

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-10 shadow-md py-4 w-full bg-background">
            <header className="flex items-center justify-end py-2 gap-2 px-6">
            <Button size="icon" variant="outline" onClick={onHandleBack}>
                <X />
            </Button>
            </header>
        </div>
        <main className="py-11 flex flex-col gap-4 items-center flex-1 mt-24 px-6 text-center">
            <h2 className="text-3xl font-bold">Quiz Complete!</h2>
            <p className="text-xl">You Scored: {scorepercentage}%</p>
            {scorepercentage === 100 ? (
                <div>
                    <p className="text-2xl font-semibold text-green-600 mb-4">Congratulations!</p>
                    <div className="flex justify-center">
                        <Image 
                            src="https://placehold.co/400x400/87CEEB/FFFFFF?text=Great+Job!" 
                            alt="Smiling Character" 
                            width={400} 
                            height={400}
                            onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/400x400/CCCCCC/000000?text=Image+Error";
                            }}
                        />
                    </div>
                    <span id="rewardId" className="block mt-4"/>
                </div>
            ) : (
            <>
                <div className="flex flex-row gap-8 mt-6">
                    <Bar percentage={scorepercentage} color="green"/>
                    <Bar percentage={100 - scorepercentage} color="red"/>
                </div>
                <div className="flex flex-row gap-8 text-lg font-medium">
                    <p className="text-green-700">{score} Correct</p>
                    <p className="text-red-700">{totalQuestions - score} Incorrect</p>
                </div>
            </>
            )}
        </main> 
    </div>
  );
}
