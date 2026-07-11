import fs from 'fs';
import path from 'path';

// Log levels enum
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    VERBOSE = 4
}

// Log entry interface
interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
    error?: Error;
    requestId?: string;
}

// Logger configuration
interface LoggerConfig {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    logDir: string;
    maxFileSize: number; // in MB
    maxFiles: number;
}

class Logger {
    private config: LoggerConfig;
    private logStream: fs.WriteStream | null = null;
    private currentLogFile: string = '';

    constructor(config?: Partial<LoggerConfig>) {
        this.config = {
            level: LogLevel.INFO,
            enableConsole: true,
            enableFile: true,
            logDir: './logs',
            maxFileSize: 10, // 10MB
            maxFiles: 5,
            ...config
        };

        this.initializeLogDirectory();
        this.rotateLogFile();
    }

    private initializeLogDirectory(): void {
        if (this.config.enableFile && !fs.existsSync(this.config.logDir)) {
            fs.mkdirSync(this.config.logDir, { recursive: true });
        }
    }

    private rotateLogFile(): void {
        if (!this.config.enableFile) return;

        const timestamp = new Date().toISOString().split('T')[0];
        const logFileName = `app-${timestamp}.log`;
        const logFilePath = path.join(this.config.logDir, logFileName);

        // Close existing stream
        if (this.logStream) {
            this.logStream.end();
        }

        // Create new stream
        this.currentLogFile = logFilePath;
        this.logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

        // Check file size and rotate if needed
        this.checkAndRotateLogFile();
    }

    private checkAndRotateLogFile(): void {
        if (!this.logStream || !this.config.enableFile) return;

        if (!fs.existsSync(this.currentLogFile)) return;

        const stats = fs.statSync(this.currentLogFile);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB >= this.config.maxFileSize) {
            this.rotateLogFile();
        }
    }

    private formatMessage(entry: LogEntry): string {
        const { timestamp, level, message, data, error, requestId } = entry;

        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}]`;

        if (requestId) {
            formattedMessage += ` [${requestId}]`;
        }

        formattedMessage += ` ${message}`;

        if (data && Object.keys(data).length > 0) {
            formattedMessage += ` | Data: ${JSON.stringify(data)}`;
        }

        if (error) {
            formattedMessage += ` | Error: ${error.message}`;
            if (error.stack) {
                formattedMessage += ` | Stack: ${error.stack}`;
            }
        }

        return formattedMessage;
    }

    private shouldLog(level: LogLevel): boolean {
        return level <= this.config.level;
    }

    private log(level: LogLevel, message: string, data?: any, error?: Error, requestId?: string): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: LogLevel[level],
            message,
            data,
            error,
            requestId
        };

        const formattedMessage = this.formatMessage(entry);

        // Console logging
        if (this.config.enableConsole) {
            const colors = {
                [LogLevel.ERROR]: '\x1b[31m', // Red
                [LogLevel.WARN]: '\x1b[33m',  // Yellow
                [LogLevel.INFO]: '\x1b[36m',  // Cyan
                [LogLevel.DEBUG]: '\x1b[35m', // Magenta
                [LogLevel.VERBOSE]: '\x1b[37m' // White
            };

            const resetColor = '\x1b[0m';
            console.log(`${colors[level]}${formattedMessage}${resetColor}`);
        }

        // File logging
        if (this.config.enableFile && this.logStream) {
            this.checkAndRotateLogFile();
            this.logStream.write(formattedMessage + '\n');
        }
    }

    // Public logging methods
    error(message: string, error?: Error, data?: any, requestId?: string): void {
        this.log(LogLevel.ERROR, message, data, error, requestId);
    }

    warn(message: string, data?: any, requestId?: string): void {
        this.log(LogLevel.WARN, message, data, undefined, requestId);
    }

    info(message: string, data?: any, requestId?: string): void {
        this.log(LogLevel.INFO, message, data, undefined, requestId);
    }

    debug(message: string, data?: any, requestId?: string): void {
        this.log(LogLevel.DEBUG, message, data, undefined, requestId);
    }

    verbose(message: string, data?: any, requestId?: string): void {
        this.log(LogLevel.VERBOSE, message, data, undefined, requestId);
    }

    // Request logging helper
    logRequest(method: string, url: string, statusCode: number, responseTime: number, requestId?: string): void {
        const level = statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
        const message = `${method} ${url} - ${statusCode} (${responseTime}ms)`;

        this.log(level, message, { method, url, statusCode, responseTime }, undefined, requestId);
    }

    // Database logging helper
    logDatabase(operation: string, collection: string, duration: number, success: boolean, error?: Error): void {
        const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
        const message = `DB ${operation} on ${collection} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;

        this.log(level, message, { operation, collection, duration, success }, error);
    }

    // Cleanup method
    close(): void {
        if (this.logStream) {
            this.logStream.end();
        }
    }
}

// Create default logger instance
const logger = new Logger({
    level: process.env.LOG_LEVEL ? LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO : LogLevel.INFO,
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFile: process.env.NODE_ENV === 'production',
    logDir: process.env.LOG_DIR || './logs'
});

export default logger;
