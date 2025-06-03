"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQuizzDetail } from "@/app/actions/getQuizzDetail";
import { updateQuizzFull } from "@/app/actions/updateQuizzFull";
import { useRouter } from "next/navigation";

export default function EditQuizzModal({ quizzId }: { quizzId: number }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [newQuestionType, setNewQuestionType] = useState("multiple_choice");
  const router = useRouter();

  // Effect function to update
  useEffect(() => {
    if (payload?.questions) {
      const updatedQuestionsWithOrder = payload.questions.map((q: any, index: number) => ({
        ...q,        
        id: q.id, 
        order: index,
      }));
      if (JSON.stringify(updatedQuestionsWithOrder.map((q:any) => ({ id: q.id, order: q.order}))) !==
          JSON.stringify(payload.questions.map((q:any) => ({ id: q.id, order: q.order})))) {
        setPayload((prev: any) => ({
          ...prev,
          questions: updatedQuestionsWithOrder,
        }));
      }
    }
  }, [payload?.questions]);

  // Load quizz details when dialog opens
  const onOpenChange = async (val: boolean) => {
    setOpen(val);
    if (val && !payload) {
      const data = await getQuizzDetail(quizzId);
      if (data && data.questions) {
        const questionsWithInitialOrder = data.questions.map((q: any, index: number) => ({
          ...q,
          order: index,
        }));
        setPayload({ ...data, questions: questionsWithInitialOrder });
      }
    }
  };
  // Question shuffle function
  const shuffleQuestions = () => {
    if (!payload || !payload.questions) return;

    setPayload((prev: any) => {
      const shuffledQuestions = [...prev.questions];
      // Fisher-Yates shuffle algorithm
      for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      }

      const updatedQuestionsWithOrder = shuffledQuestions.map((q: any, index: number) => ({
        ...q,
        order: index,
      }));

      return {
        ...prev,
        questions: updatedQuestionsWithOrder,
      };
    });
  };

  // Add Question
  const addQuestion = () => {
    const base = { questionText: "", type: newQuestionType };
    let newQ: any = {};
    if (newQuestionType === "multiple_choice") {
      newQ = { ...base, answers: [{ answerText: "", isCorrect: false }] };
    } else if (newQuestionType === "write") {
      newQ = { ...base, answers: [{ answerText: "", isCorrect: true }] };
    } else if (newQuestionType === "listen") {
      newQ = {
        ...base,
        audioText: "",
        answers: [{ answerText: "", isCorrect: true }],
      };
    }

    setPayload((prev: any) => {
      const newQuestions = [...prev.questions, { ...newQ, order: prev.questions.length }];
      return {
        ...prev,
        questions: newQuestions,
      };
    });
  };

  // Add Answer
  const addAnswer = (qIndex: number) => {
    const qs = [...payload.questions];
    qs[qIndex].answers.push({ answerText: "", isCorrect: false });
    setPayload({ ...payload, questions: qs });
  };

  // Handler to save changes
  const handleSave = async () => {
    const questionsToSave = payload.questions.map((q: any, index: number) => ({
        ...q,
        order: index 
    }));
    await updateQuizzFull(quizzId, { ...payload, questions: questionsToSave });
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

              <div className="flex justify-end">
                <Button variant="secondary" onClick={shuffleQuestions}>
                  Shuffle Questions
                </Button>
              </div>

              {/* Questions */}
              {payload.questions.map((q: any, qi: number) => (
                <div key={qi} className="border p-4 rounded space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Question {qi + 1}</label>
                    <div className="flex gap-2">
                      {q.type === "multiple_choice" && (
                        <Button size="sm" variant="outline" onClick={() => addAnswer(qi)}>
                          + Add Answer
                        </Button>
                      )}
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
                  {q.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {q.answers.map((a: any, ai: number) => (
                      <div key={ai} className="flex items-center space-x-2">
                        <label className="block text-sm mb-1">Answer:</label>
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
                  </div>)}
                  {q.type === "write" && (
                    <div className="space-y-2">
                      <div className=" flex items-center space-x-2">
                        <label className="block text-sm mb-1">Answer:</label>
                        <Input
                          placeholder="Correct written answer"
                          value={q.answers?.[0]?.answerText || ""}
                          onChange={(e) => {
                            const qs2 = [...payload.questions];
                            qs2[qi].answers[0].answerText = e.target.value;
                            setPayload({ ...payload, questions: qs2 });
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {q.type === "listen" && (
                  <div className="space-y-2">
                    <div className=" flex items-center space-x-2">
                      <label className="block text-sm mb-1">Audio:</label>
                      <Input
                        placeholder="Audio text"
                        className="mb-2"
                        value={q.audioText || ""}
                        onChange={(e) => {
                          const qs2 = [...payload.questions];
                          qs2[qi].audioText = e.target.value;
                          setPayload({ ...payload, questions: qs2 });
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="block text-sm mb-1">Answer:</label>
                      <Input
                        placeholder="Correct answer for listening"
                        value={q.answers?.[0]?.answerText || ""}
                        onChange={(e) => {
                          const qs2 = [...payload.questions];
                          qs2[qi].answers[0].answerText = e.target.value;
                          setPayload({ ...payload, questions: qs2 });
                        }}
                      />
                    </div>
                  </div>
                )}

                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <Select value={newQuestionType} onValueChange={(v) => setNewQuestionType(v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="write">Written Answer</SelectItem>
                    <SelectItem value="listen">Listening</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={addQuestion}>
                  + Add Question
                </Button>
              </div>
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
