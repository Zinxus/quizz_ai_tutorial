import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
    createSubscription,
    deleteSubscription
} from "@/app/actions/userSubscriptions";

const relevantEvents = new Set([
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.created",
]);

export async function POST(request: Request) {
    const body = await request.text();
    const sig = request.headers.get(
        "stripe-signature"
    ) as string;
    const webHookSecret = process.env.NODE_ENV === "production"
        ? process.env.STRIPE_WEBHOOK_SECRET
        : process.env.STRIPE_WEBHOOK_LOCAL_SECRET;

    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error(
            "STRIPE_WEBHOOK_SECRET is not set in production"
        );
    }

    if (!sig || !webHookSecret) return new Response("Webhook error: No signature or secret", { status: 400 });

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webHookSecret);
    } catch (err: any) {
        console.log(`Webhook Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const data = event.data.object as Stripe.Subscription | Stripe.Checkout.Session;

    if (relevantEvents.has(event.type)) {
        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const checkoutSession = data as Stripe.Checkout.Session;
                    const customerId = checkoutSession.customer as string;
                    if (customerId) {
                        await createSubscription({ stripeCustomerId: customerId });
                    }
                    break;
                }
                case "customer.subscription.created": {
                    const subscription = data as Stripe.Subscription;
                    await createSubscription({
                        stripeCustomerId: subscription.customer as string
                    });
                    break;
                }
                case "customer.subscription.updated": {
                    const subscription = data as Stripe.Subscription;
                    if (subscription.status === 'active' || subscription.status === 'trialing') {
                        await createSubscription({
                            stripeCustomerId: subscription.customer as string
                        });
                    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                        await deleteSubscription({
                            stripeCustomerId: subscription.customer as string
                        });
                    }
                    break;
                }
                case "customer.subscription.deleted": {
                    const subscription = data as Stripe.Subscription;
                    await deleteSubscription({
                        stripeCustomerId: subscription.customer as string
                    });
                    break;
                }
                default:
                    break;
            }
        } catch (error: any) {
            console.error("Webhook handler failed:", error.message);
            return new Response(`Webhook handler failed: ${error.message}`, { status: 400 });
        }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}