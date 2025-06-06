import { quizzes, questions, quizzSubmissions, users, quizzSubmissionsRelations} from "@/db/schema";
import { auth } from "@/auth";
import { db } from "@/db";
import { count, eq, avg, sql } from "drizzle-orm";
import { create } from "domain";

const getHeatMapData = async () => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return;
    }

    const data = await db.select({
        createdAt: quizzSubmissions.createdAt,
        count: sql`cast(count(${quizzSubmissions.id}) as int)`,
    }).from(quizzSubmissions)
    .innerJoin(quizzes, eq(quizzSubmissions.quizzId, quizzes.id))
    .innerJoin(users, eq(quizzes.userId, users.id))
    .groupBy(quizzSubmissions.createdAt);

    return {data};
}

export default getHeatMapData;