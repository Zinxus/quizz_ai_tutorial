import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: string;
  content: string;
};

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          text-black px-3 py-2 rounded-lg max-w-xs
          ${isUser ? "bg-blue-100" : "bg-gray-100"}
          prose prose-sm /* để markdown đẹp hơn */
        `}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
