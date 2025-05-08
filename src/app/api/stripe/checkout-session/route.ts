import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';
import { auth } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';

export async function POST(request: Request) {
    const { price, quantity } = await request.json();
    const userSession = await auth();
    const userId = userSession?.user?.id;

    if (!userId) {
        return new Response(
            JSON.stringify({
                error: "Unauthorized",
            }),
            {
                status: 401,
            }
        )
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    let customer;
    
    if (user?.stripeCustomerId){
        customer = {
            id: user.stripeCustomerId,
        };
    } else {
        const customerData: {
            metadata: {
                 dbId: string;
            }
        } = {
            metadata: {
                dbId: userId,
            },
        }

        const response =await stripe.customers.create(
            customerData
        );
        
        customer = { id: response.id };

        await db.update(users).set({
            stripeCustomerId: customer.id,
        }).where(eq(users.id, userId));
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
        const session = await stripe.checkout.sessions.create({
            success_url: `${baseUrl}/billing/payment/success`,
            cancel_url: `${baseUrl}/payment/cancel`,
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [
                {
                    price,
                    quantity,
                },
            ],
            mode: 'subscription',
        }) as Stripe.Checkout.Session;

        if (session && session.id) {
            return new Response(
                JSON.stringify({
                    sessionId: session.id,
                }),
                {
                    status: 200,
                }
            )
        } else {
            return new Response(
                JSON.stringify({
                    error: "Failed to create a session",
                }),
                {
                    status: 500,
                }
            )
        }
    } catch (error) {
        console.log("Error creating checkout session:", error);
        return new Response(
            JSON.stringify({
                error,
            }),
            {
                status: 500,
            }
        )
    }
}
