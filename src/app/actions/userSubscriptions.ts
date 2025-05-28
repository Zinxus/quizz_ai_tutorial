import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createSubscription({ stripeCustomerId}: {
    stripeCustomerId: string
}) {
    try {
        await db.update(users).set({ subscribed: true}).where(
            eq(users.stripeCustomerId,
                stripeCustomerId
            )
        );
        console.log(`Subscription created for customer: ${stripeCustomerId}`);
    } catch (error) {
        // Log the error and rethow it
        console.error("Error creating subscription:", error);
        throw error; 
    }
}

export async function deleteSubscription({ stripeCustomerId}: {
    stripeCustomerId: string
}) {
    try {
        await db.update(users).set({ subscribed: false}).where(
            eq(users.stripeCustomerId,
                stripeCustomerId
            )
        );
        console.log(`Subscription deleted for customer: ${stripeCustomerId}`);
    } catch (error) {
        console.error("Error deleting subscription:", error);
        throw error;
    }
}

export async function getUserSubscription({ userId }: {
    userId: string
}): Promise<boolean | undefined> {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });
        return user?.subscribed ?? undefined;
    } catch (error) {
        console.error("Error getting user subscription:", error);
        return undefined; 
    }
}