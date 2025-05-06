import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { error } from 'console';

export async function POST(request: Request) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId){
        return new Response(
            JSON.stringify({
                error: "Unauthorized"
            }),
            {
                status: 401,
            }
        )
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
    });

    if (!user){
        return new Response(
            JSON.stringify({
                error: "User not found"
            }),
            {
                status: 404,
            }
        )
    } 
    let customer;
    if(user?.stripeCustomerId){
        customer = {
            id: user.stripeCustomerId,
        };
    } else {
        const customerData: {
            metadata: {
                dbId: string;
            };
        } = {
            metadata: {
                dbId: userId,
            },
        };
        const response = await stripe.customers.create(
            customerData
        );

        customer = { id: response.id };
    }

    const baseUrl = 
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

    const url = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${baseUrl}/billing`
    });

    return new Response(JSON.stringify({ url }), {
        status: 200,
    })
}