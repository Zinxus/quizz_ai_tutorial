import { auth } from "@/auth";
import { redirect } from "next/navigation";
import QuizzList from "./QuizzList";
import getUserQuizzes from "@/app/actions/getUserQuizzes";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const quizzesRaw = await getUserQuizzes(session.user.id);
  const quizzes = quizzesRaw.map(q => ({
    ...q,
    name: q.name ?? "",
    description: q.description ?? "",
  }));
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Quizzes</h1>
      <QuizzList quizzes={quizzes} />
    </div>
  );
}
