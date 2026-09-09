import express, { Request, Response } from "express";
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
  }),
);


app.use(`/api/${env.apiVersion}/payments`, paymentWebhookRoute);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      success: true,
      message: "OK",
      data: { timestamp: new Date().toISOString() },
    });
});

app.use(`/api/${env.apiVersion}`, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
