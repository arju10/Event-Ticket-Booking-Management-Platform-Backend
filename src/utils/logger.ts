import winston from "winston";
import { env } from "../config/env";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    ...(env.nodeEnv !== "production"
      ? [new winston.transports.Console({ format: winston.format.simple() })]
      : []),
  ],
});
