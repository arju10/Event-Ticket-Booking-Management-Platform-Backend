import app from "./app";
import { env } from "@/config/env";
import { prisma } from "@/config/db";
import { logger } from "@/utils/logger";
import { startBackgroundJobs } from "@/jobs/expireStaleBookings.job";

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    const server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
      logger.info(`API base: http://localhost:${env.port}/api/${env.apiVersion}`);
    });

    startBackgroundJobs();

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
}

bootstrap();
