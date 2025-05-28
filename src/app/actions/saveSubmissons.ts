"use server"; 

import { db } from "@/db"; 
import { quizzSubmissions, userAnswers } from "@/db/schema"; 
import { auth } from '@/auth';

// Definition of UserAnserData
interface UserAnswerData {
  questionId: number;
  selectedAnswerId?: number;
  userAnswerText?: string;
  isCorrect: boolean; 
}

// Definition if SaveSubmissionDate
interface SaveSubmissionData {
  score: number;
  userAnswers: UserAnswerData[];
}

// function to save quiz submission and user answers
export async function saveSubmission(
  data: SaveSubmissionData,
  quizzId: number
) {
  
  const userSession = await auth();
  const userId = userSession?.user?.id; 

  try {
    // Save the quiz submiossion to the table quizz_submissions
    const [newSubmission] = await db
      .insert(quizzSubmissions)
      .values({
        quizzId: quizzId,
        userId: userId, 
        score: data.score, 
      })
      .returning({ id: quizzSubmissions.id });

    if (!newSubmission) {
      throw new Error("Failed to create quiz submission.");
    }

    const submissionId = newSubmission.id;

    // Loop through user ansers and prepare data for interting into user_answers table
    const answersToInsert = data.userAnswers.map((answer) => ({
      submissionId: submissionId,
      questionId: answer.questionId,
      selectedAnswerId: answer.selectedAnswerId, 
      userAnswerText: answer.userAnswerText, 
      isCorrect: answer.isCorrect,
    }));

    // only insert answers if there are any
    if (answersToInsert.length > 0) {
      await db.insert(userAnswers).values(answersToInsert);
    }

    console.log("Submission and user answers saved successfully!");
  } catch (error) {
    console.error("Error saving quiz submission and answers:", error);
    throw error; 
  }
}
