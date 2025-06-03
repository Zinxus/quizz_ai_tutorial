import { db } from "@/db";
import { quizzes } from "@/db/schema";
import { eq } from "drizzle-orm"; 
import QuizzPage from "../QuizzPage";

const QuizDetailPage = async ({ params }: { params: { quizzId: string } }) => {
  const quizzId = parseInt(params.quizzId); 

  const quizz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizzId), 
    with: {
      question: { 
        with: {
          answers: true, 
        },
      },
    },
  });

  if (!quizz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p className="text-xl font-semibold">Quiz not found</p>
      </div>
    );
  }

  return (
    <QuizzPage quizz={{ ...quizz, questions: quizz.question }} />
  );
};

export default QuizDetailPage;