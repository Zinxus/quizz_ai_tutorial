import { db } from "@/db";
import { quizzes } from "@/db/schema";
import { eq } from "drizzle-orm"; 
import QuizzPage from "../QuizzPage";

// Component this page is render if the user navigations to a specific quiz
// and fetches the quiz data from the database using the quizzId from the URL params.
const QuizDetailPage = async ({ params }: { params: { quizzId: string } }) => {
  const quizzId = parseInt(params.quizzId); 

  // Take quizzId from params and convert it to an integer
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

  // If no quiz id found, render a message
  if (!quizz) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p className="text-xl font-semibold">Quiz not found</p>
      </div>
    );
  }

  // If a quiz is found, render the QuizzPage component
  // Pass the retrieved quizz data, and map quizz.question to questions
  // beause QuizzPage expects a prop named 'quizz' with a 'questions' property
  return (
    <QuizzPage quizz={{ ...quizz, questions: quizz.question }} />
  );
};

export default QuizDetailPage;