import Stripe from "stripe";
import { env } from "./env";

// Guarded so the app can still boot locally without a Stripe key configured;
// any attempt to actually use it without a key will throw a clear error.
export const stripe = env.stripe.secretKey
  ? new Stripe(env.stripe.secretKey, { apiVersion: "2024-06-20" })
  : (null as unknown as Stripe);
