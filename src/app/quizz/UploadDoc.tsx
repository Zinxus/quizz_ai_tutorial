"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Mode = "upload" | "topic" | "random";

const UploadDoc = () => {
  const [mode, setMode] = useState<Mode>("upload");
  const [document, setDocument] = useState<File | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

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

    setIsLoading(true);
    const formData = new FormData();
    formData.append("mode", mode);
    if (mode === "upload") formData.append("pdf", document as Blob);
    if (mode === "topic") formData.append("topic", topic.trim());

    try {
      const res = await fetch("/api/quizz/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const { quizzId } = await res.json();
      router.push(`/quizz/${quizzId}`);
    } catch (e) {
      console.error("Error generating quiz:", e);
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        {/* Mode Selector */}
        <div className="flex justify-between">
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="upload"
              checked={mode === "upload"}
              onChange={() => setMode("upload")}
              className="mr-2"
            />
            Upload File
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="topic"
              checked={mode === "topic"}
              onChange={() => setMode("topic")}
              className="mr-2"
            />
            By Topic
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="mode"
              value="random"
              checked={mode === "random"}
              onChange={() => setMode("random")}
              className="mr-2"
            />
            Random
          </label>
        </div>

        {/* Conditional Inputs */}
        {mode === "upload" && (
          <label htmlFor="document" className="bg-secondary w-full flex h-20 rounded-md border-4 border-dashed border-blue-900 relative">
            <div className="absolute inset-0 m-auto flex justify-center items-center">
              {document?.name || "Drag or select a file (.pdf, .docx, .txt)"}
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
            placeholder="Enter a topic (e.g., React hooks)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border rounded px-3 py-2 text-black bg-white"
          />
        )}

        {/* Error Message */}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Submit Button */}
        <Button size="lg" type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Generating..." : "Generate Quiz"}
        </Button>
      </form>
    </div>
  );
};

export default UploadDoc;