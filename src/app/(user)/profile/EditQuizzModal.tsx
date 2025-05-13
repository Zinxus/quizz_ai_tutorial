"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getQuizzDetail } from "@/app/actions/getQuizzDetail";
import { updateQuizzFull } from "@/app/actions/updateQuizzFull";
import { useRouter } from "next/navigation";

export default function EditQuizzModal({ quizzId }: { quizzId: number }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const router = useRouter();

  // Load chi tiết khi mở lần đầu
  const onOpenChange = async (val: boolean) => {
    setOpen(val);
    if (val && !payload) {
      const data = await getQuizzDetail(quizzId);
      setPayload(data);
    }
  };

  // Thêm câu hỏi mới
  const addQuestion = () => {
    setPayload((prev: any) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { questionText: "", answers: [{ answerText: "", isCorrect: false }] },
      ],
    }));
  };

  // Thêm đáp án mới cho câu hỏi i
  const addAnswer = (qIndex: number) => {
    const qs = [...payload.questions];
    qs[qIndex].answers.push({ answerText: "", isCorrect: false });
    setPayload({ ...payload, questions: qs });
  };

  // Các handler cập nhật vẫn như trước…

  const handleSave = async () => {
    await updateQuizzFull(quizzId, payload);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50 grid place-items-center overflow-y-auto" />
        <DialogContent className="bg-background rounded-lg p-6 shadow-lg w-full max-w-3xl mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
          </DialogHeader>

          {!payload ? (
            <div className="py-8 text-center">Loading…</div>
          ) : (
            <div className="space-y-6">
              {/* Name & description */}
              <div>
                <label className="block text-sm mb-1">Name</label>
                <Input
                  value={payload.name}
                  onChange={(e) =>
                    setPayload({ ...payload, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <Input
                  value={payload.description || ""}
                  onChange={(e) =>
                    setPayload({ ...payload, description: e.target.value })
                  }
                />
              </div>

              {/* Questions */}
              {payload.questions.map((q: any, qi: number) => (
                <div key={qi} className="border p-4 rounded space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Question {qi + 1}</label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => addAnswer(qi)}>
                        + Add Answer
                      </Button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 p-1"
                        onClick={() => {
                          const qs2 = payload.questions.filter((_: any, i: number) => i !== qi);
                          setPayload({ ...payload, questions: qs2 });
                        }}>X</button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <Input
                    className="mb-2"
                    placeholder="Question text…"
                    value={q.questionText}
                    onChange={(e) => {
                      const qs2 = [...payload.questions];
                      qs2[qi].questionText = e.target.value;
                      setPayload({ ...payload, questions: qs2 });
                    }}
                  />

                  {/* Answers */}
                  <div className="space-y-2">
                    {q.answers.map((a: any, ai: number) => (
                      <div key={ai} className="flex items-center space-x-2">
                        <Input
                          className="flex-1"
                          placeholder="Answer text…"
                          value={a.answerText}
                          onChange={(e) => {
                            const qs2 = [...payload.questions];
                            qs2[qi].answers[ai].answerText = e.target.value;
                            setPayload({ ...payload, questions: qs2 });
                          }}
                        />
                        <label className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={a.isCorrect}
                            onChange={(e) => {
                              const qs2 = [...payload.questions];
                              qs2[qi].answers[ai].isCorrect = e.target.checked;
                              setPayload({ ...payload, questions: qs2 });
                            }}
                          />
                          <span>Correct</span>
                        </label>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1"
                          onClick={() => {
                            const qs2 = [...payload.questions];
                            qs2[qi].answers = qs2[qi].answers.filter((_: any, j: number) => j !== ai);
                            setPayload({ ...payload, questions: qs2 });
                          }}>🗑</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button size="sm" variant="outline" onClick={addQuestion}>
                + Add Question
              </Button>
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!payload}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
