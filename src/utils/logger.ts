import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info"; // Default to "info"

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      if (!stack) {
        return `[${timestamp}] ${level}: ${message}`;
      } else {
        return `[${timestamp}] ${level}: ${message}\n${stack}`;
      }
    }),
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ],
});

// Function to update the log level dynamically
export function setLogLevel(level: string) {
  logger.level = level;
  logger.info(`Log level set to ${level}`);
}

export default logger;
