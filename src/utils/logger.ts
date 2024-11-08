import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info"; // Default to "info"

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
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
