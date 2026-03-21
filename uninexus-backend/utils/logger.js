/**
 * Structured logger utility with level-based logging.
 * Wraps console methods with timestamps and level prefixes.
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel =
  process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * Format a log message with timestamp and level prefix.
 * @param {string} level - Log level label
 * @param {string} message - Log message
 * @param {object} [meta] - Optional metadata object
 * @returns {string} Formatted log string
 */
const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  error: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },

  warn: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  info: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.info(formatMessage('INFO', message, meta));
    }
  },

  debug: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, meta));
    }
  },
};

module.exports = logger;
