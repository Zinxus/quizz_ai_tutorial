import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
    createSubscription,
    deleteSubscription
} from "@/app/actions/userSubscriptions";

const relevanEvants = new Set([
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.created",
]);

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get(
        "stripe-signature"
    )as string;

    if(
        !process.env.STRIPE_WEBHOOK_SECRET
    ){
        throw new Error(
            "STRIPE_WEBHOOK_SECRET is not set"
        )
    }

    if (!sig) return;

    const event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );

    const data = event.data.object as Stripe.Subscription;

    if ( relevanEvants.has(event.type)) {
        switch(event.type){
            case "customer.subscription.updated":{
                await createSubscription({
                    stripeCustomerId: data.customer as string
                })
                break;
            }
            case "customer.subscription.deleted":{
                await deleteSubscription({
                    stripeCustomerId: data.customer as string
                })
                break;
            }
            default:{
                break;
            }
        }
    }

    return new Response(
        JSON.stringify({
            received: true
        }),
        { status: 200}
    );
}