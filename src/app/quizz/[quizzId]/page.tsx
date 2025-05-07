import { db } from "@/db";

import { quizzes } from "@/db/schema";
import { eq, param } from "drizzle-orm";
import QuizzQuestions from "../QuizzQuestions";
import { string } from "zod";

const page = async ({ params}:{
    params:{
        quizzId: string
    }
}) => {
    const quizzId = params.quizzId;
    const quizz = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, param(quizzId)),
        with: {
            question: {
                with: {
                    answers: true,
                },
            },
        },
    });
    if (!quizzId || !quizz) {
        return <p>Quizz not found</p>;
    }
    return (
        <QuizzQuestions quizz={{ ...quizz, questions: quizz.question }}/>
    )
}

export default page;