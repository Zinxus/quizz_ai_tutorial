"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const UploadDoc = () => {
    const [document, setDocument] = useState< File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!document) {
            setError("Please upload a document.");
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append("pdf", document as Blob);
        try {
            const responsive = await fetch("/api/quizz/generate", {
                method: "POST",
                body: formData,
            });
            if (responsive.status === 200) {                
                const data = await responsive.json();
                const quizzId = data.quizzId;

                router.push(`/quizz/${quizzId}`);
            }
        } catch (e) {
            console.error("Error generating quiz:", e);
        }
        setIsLoading(false);
    };

    return (
        <div className="w-full">
            { isLoading ? <p>Loading...</p> :<form className="w-full" onSubmit={handleSubmit}>
                <label htmlFor="document"
                    className="bg-secondary w-full flex h-20 rounded-md border-4 border-dashed border-blue-900 relative"
                >
                    <div className="absolute inset-0 m-auto flex justify-center items-center">
                        {document && document.name ? document.name : "Drag a file"}
                    </div>
                    <input
                        type="file"
                        id="document"
                        className="relative block w-full h-full z-50 opacity-0 cursor-pointer"
                        onChange={(e) => setDocument(e.target.files?.[0] || null)}
                        accept=".pdf, .doc, .docx, .txt"
                    />
                </label>
                {error ? <p className="text-red-600 text-sm mt-2">{error}</p> : null}
                <Button size="lg" className="mt-2" type="submit" disabled={isLoading}>
                    {isLoading ? "Processing..." : "Generate Quiz"}
                </Button>
            </form>}
        </div>
    );
};

export default UploadDoc;
