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

  // Load khi modal mở
  const onOpenChange = async (val: boolean) => {
    setOpen(val);
    if (val && !payload) {
      const data = await getQuizzDetail(quizzId);
      setPayload(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>

      <DialogPortal>
        {/* Overlay có khả năng scroll */}
        <DialogOverlay
          className="fixed inset-0 bg-black/50
                     grid place-items-center overflow-y-auto"
        />

        {/* Content scrollable, giới hạn max-height */}
        <DialogContent
          className="bg-background rounded-lg p-6 shadow-lg
                     w-full max-w-3xl mx-auto
                     max-h-[80vh] overflow-y-auto"
        >
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
                <div key={q.id} className="border p-4 rounded space-y-4">
                  <label className="block text-sm mb-1">
                    Question {qi + 1}
                  </label>
                  <Input
                    className="mb-2"
                    value={q.questionText}
                    onChange={(e) => {
                      const qs = [...payload.questions];
                      qs[qi].questionText = e.target.value;
                      setPayload({ ...payload, questions: qs });
                    }}
                  />

                  {/* Answers */}
                  <div className="space-y-2">
                    {q.answers.map((a: any, ai: number) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          value={a.answerText}
                          onChange={(e) => {
                            const qs = [...payload.questions];
                            qs[qi].answers[ai].answerText = e.target.value;
                            setPayload({ ...payload, questions: qs });
                          }}
                        />
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={a.isCorrect}
                            onChange={(e) => {
                              const qs = [...payload.questions];
                              qs[qi].answers[ai].isCorrect =
                                e.target.checked;
                              setPayload({ ...payload, questions: qs });
                            }}
                          />
                          Correct
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await updateQuizzFull(quizzId, payload);
                setOpen(false);
                router.refresh();
              }}
              disabled={!payload}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
