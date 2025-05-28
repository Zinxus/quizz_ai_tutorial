"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type QuestionType = "multiple_choice" | "write" | "listen";

type Mode = "upload" | "topic" | "random";

const UploadDoc = () => {
  const [mode, setMode] = useState<Mode>("upload");
  const [document, setDocument] = useState<File | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>(["multiple_choice"]); 
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10); 

  const handleQuestionTypeChange = (type: QuestionType) => {
    setSelectedQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "upload" && !document) {
      setError("Please upload a document.");
      return;
    }
    if (mode === "topic" && !topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    if (numberOfQuestions <= 0) {
      setError("Number of questions must be greater than 0.");
      return;
    }
    if (selectedQuestionTypes.length === 0) {
      setError("Please select at least one question type.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("mode", mode);
    if (mode === "upload") formData.append("pdf", document as Blob);
    if (mode === "topic") formData.append("topic", topic.trim());

    formData.append("questionTypes", JSON.stringify(selectedQuestionTypes));
    formData.append("numberOfQuestions", numberOfQuestions.toString());

    try {
      const res = await fetch("/api/quizz/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const { quizzId } = await res.json();
      router.push(`/quizz/${quizzId}`);
    } catch (e: any) { 
      console.error("Error generating quiz:", e);
      setError(e.message || "Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto"> 
      <form className="w-full space-y-6" onSubmit={handleSubmit}>
        <div className="flex justify-between gap-4">
          <label className="flex items-center cursor-pointer p-2 border rounded-md flex-1 justify-center transition-all duration-200 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{backgroundColor: mode === "upload" ? "lightblue" : ""}}>
            <input
              type="radio"
              name="mode"
              value="upload"
              checked={mode === "upload"}
              onChange={() => setMode("upload")}
              className="mr-2 hidden" 
            />
            <span className="font-medium text-lg">Upload File</span>
          </label>
          <label className="flex items-center cursor-pointer p-2 border rounded-md flex-1 justify-center transition-all duration-200 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{backgroundColor: mode === "topic" ? "lightblue" : ""}}>
            <input
              type="radio"
              name="mode"
              value="topic"
              checked={mode === "topic"}
              onChange={() => setMode("topic")}
              className="mr-2 hidden"
            />
            <span className="font-medium text-lg">By Topic</span>
          </label>
          <label className="flex items-center cursor-pointer p-2 border rounded-md flex-1 justify-center transition-all duration-200 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{backgroundColor: mode === "random" ? "lightblue" : ""}}>
            <input
              type="radio"
              name="mode"
              value="random"
              checked={mode === "random"}
              onChange={() => setMode("random")}
              className="mr-2 hidden"
            />
            <span className="font-medium text-lg">Random</span>
          </label>
        </div>

        {mode === "upload" && (
          <label htmlFor="document" className="bg-secondary w-full flex h-20 rounded-md border-4 border-dashed border-blue-900 relative cursor-pointer">
            <div className="absolute inset-0 m-auto flex justify-center items-center px-4 text-center">
              {document?.name || "Kéo hoặc chọn tệp (.pdf, .docx, .txt)"}
            </div>
            <input
              type="file"
              id="document"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setDocument(e.target.files?.[0] || null)}
              accept=".pdf, .doc, .docx, .txt"
            />
          </label>
        )}

        {mode === "topic" && (
          <input
            type="text"
            placeholder="Nhập chủ đề (ví dụ: React hooks)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <div className="flex flex-col gap-2">
            <label htmlFor="numQuestions" className="font-semibold">Số lượng câu hỏi:</label>
            <input
                type="number"
                id="numQuestions"
                min="1"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 1)}
                className="w-full border rounded px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <div className="flex flex-col gap-2">
            <span className="font-semibold">Chọn loại câu hỏi:</span>
            <div className="flex gap-4 flex-wrap">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedQuestionTypes.includes("multiple_choice")}
                        onChange={() => handleQuestionTypeChange("multiple_choice")}
                        className="mr-2 w-4 h-4"
                    />
                    Trắc nghiệm
                </label>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedQuestionTypes.includes("write")}
                        onChange={() => handleQuestionTypeChange("write")}
                        className="mr-2 w-4 h-4"
                    />
                    Tự luận
                </label>
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selectedQuestionTypes.includes("listen")}
                        onChange={() => handleQuestionTypeChange("listen")}
                        className="mr-2 w-4 h-4"
                    />
                    Nghe
                </label>
            </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

        <Button size="lg" type="submit" disabled={isLoading} className="w-full mt-6">
          {isLoading ? "loading..." : "genarated quizz"}
        </Button>
      </form>
    </div>
  );
};

export default UploadDoc;
