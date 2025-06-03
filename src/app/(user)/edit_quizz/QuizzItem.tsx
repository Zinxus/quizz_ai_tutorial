"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteQuizzAction } from "@/app/actions/deleteQuizzAction";
import { QuizzBasic } from "./QuizzList";

const EditQuizzModal = dynamic(
  () => import("./EditQuizzModal"),
  { ssr: false }
);

export default function QuizzItem({ quizz }: { quizz: QuizzBasic }) {
  const router = useRouter();
  const onDelete = async () => {
    if (confirm("Delete this quiz?")) {
      await deleteQuizzAction(quizz.id);
      router.refresh();
    }
  };

  return (
    <li className="border p-4 rounded-md flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{quizz.name}</h2>
        {quizz.description && <p className="text-sm text-muted">{quizz.description}</p>}
        <p className="text-sm text-muted">Questions: {quizz.questionsCount}</p>
      </div>
      <div className="flex gap-2">
        <EditQuizzModal quizzId={quizz.id} />
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}
