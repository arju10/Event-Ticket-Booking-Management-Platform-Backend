import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { apiRoutes } from "./routes";
import { paymentWebhookRoute } from "./modules/payment/payment.route";
import { generalLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

// IMPORTANT: the Stripe webhook route needs the RAW request body to verify
// the signature, so it is registered — with its own express.raw() parser —
// BEFORE the global express.json() below. Express matches routes in
// registration order, so this path is fully handled here and never reaches
// the JSON parser.
app.use(`/api/${env.apiVersion}/payments`, paymentWebhookRoute);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "OK", data: { timestamp: new Date().toISOString() } });
});

app.use(`/api/${env.apiVersion}`, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
