import React from 'react'
import {clsx} from "clsx";
import { cn } from "@/lib/utils";

type Props = {
    iscorrect: boolean | null | undefined;
    correctAnswer: string;
}

const ResultCard = (props: Props) => {
    const { iscorrect } = props;

    if (iscorrect === null || iscorrect === undefined) {
        return null;
    }
    const text = iscorrect ? "Correct!" : "Incorrect! The correct anser is:" + props.correctAnswer;
    
    const borderClasses = clsx({
      "border border-green-500": iscorrect,
      "border border-red-500": !iscorrect,
    })

    return (
    <div className={cn(
      borderClasses,
      "border-2",
      "rounded-lg",
      "p-4",
      "text-center",
      "text-lg",
      "font-semibold",
      "mt-4",
      "bg-secondary",
    )}>{text}</div>
  )
}

export default ResultCard