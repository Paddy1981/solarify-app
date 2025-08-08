// Logging utility with structured logging support
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private isClient: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isClient = typeof window !== 'undefined';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, metadata?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (metadata) {
      // Extract common fields
      if (metadata.requestId) entry.requestId = metadata.requestId;
      if (metadata.userId) entry.userId = metadata.userId;
      if (metadata.context) entry.context = metadata.context;
      if (metadata.stack) entry.stack = metadata.stack;
      
      // Store remaining metadata
      const { requestId, userId, context, stack, ...rest } = metadata;
      if (Object.keys(rest).length > 0) {
        entry.metadata = rest;
      }
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const { level, message, metadata, ...logData } = entry;

    if (this.isDevelopment) {
      // Pretty print for development
      const color = this.getLogColor(level);
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      
      console.group(`${color}[${level}] ${timestamp} - ${message}\x1b[0m`);
      
      if (entry.requestId) console.log(`🔍 Request ID: ${entry.requestId}`);
      if (entry.userId) console.log(`👤 User ID: ${entry.userId}`);
      if (entry.context) console.log(`📍 Context: ${entry.context}`);
      
      if (metadata && Object.keys(metadata).length > 0) {
        console.log('📋 Metadata:', metadata);
      }
      
      if (entry.stack && level === 'ERROR') {
        console.log('📚 Stack trace:', entry.stack);
      }
      
      console.groupEnd();
    } else {
      // Structured JSON logging for production
      console.log(JSON.stringify(entry));
    }

    // Send to external logging service in production
    if (!this.isDevelopment && this.isClient) {
      this.sendToExternalService(entry);
    }
  }

  private getLogColor(level: string): string {
    switch (level) {
      case 'ERROR': return '\x1b[31m'; // Red
      case 'WARN': return '\x1b[33m';  // Yellow
      case 'INFO': return '\x1b[36m';  // Cyan
      case 'DEBUG': return '\x1b[37m'; // White
      default: return '\x1b[0m';       // Reset
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // In production, this would send logs to a service like:
      // - Datadog
      // - New Relic
      // - Splunk
      // - CloudWatch
      // - Custom logging endpoint
      
      // For now, we'll just store in local storage for client-side logs
      if (this.isClient && entry.level === 'ERROR') {
        const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        logs.push(entry);
        
        // Keep only last 50 error logs
        if (logs.length > 50) {
          logs.splice(0, logs.length - 50);
        }
        
        localStorage.setItem('error_logs', JSON.stringify(logs));
      }
    } catch (error) {
      // Don't let logging errors crash the application
      console.warn('Failed to send log to external service:', error);
    }
  }

  public error(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.formatMessage('ERROR', message, metadata);
    this.output(entry);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.formatMessage('WARN', message, metadata);
    this.output(entry);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.formatMessage('INFO', message, metadata);
    this.output(entry);
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.formatMessage('DEBUG', message, metadata);
    this.output(entry);
  }

  // Specialized logging methods
  public auth(message: string, metadata?: Record<string, any>): void {
    this.info(`[AUTH] ${message}`, { ...metadata, context: 'authentication' });
  }

  public solar(message: string, metadata?: Record<string, any>): void {
    this.info(`[SOLAR] ${message}`, { ...metadata, context: 'solar_calculations' });
  }

  public api(message: string, metadata?: Record<string, any>): void {
    this.info(`[API] ${message}`, { ...metadata, context: 'api' });
  }

  public performance(message: string, metadata?: Record<string, any>): void {
    this.debug(`[PERF] ${message}`, { ...metadata, context: 'performance' });
  }

  public security(message: string, metadata?: Record<string, any>): void {
    this.warn(`[SECURITY] ${message}`, { ...metadata, context: 'security' });
  }

  // Utility methods
  public createChildLogger(context: string, metadata?: Record<string, any>): Logger {
    const childLogger = new Logger();
    
    // Override output method to include context
    const originalOutput = childLogger.output.bind(childLogger);
    childLogger.output = (entry: LogEntry) => {
      entry.context = context;
      if (metadata) {
        entry.metadata = { ...entry.metadata, ...metadata };
      }
      originalOutput(entry);
    };

    return childLogger;
  }

  public async time<T>(
    operation: () => Promise<T>, 
    message: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substr(2, 9);
    
    this.debug(`${message} - Started`, { 
      ...metadata, 
      operationId,
      context: 'timing' 
    });

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.info(`${message} - Completed`, { 
        ...metadata, 
        operationId,
        duration: `${duration}ms`,
        context: 'timing'
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`${message} - Failed`, { 
        ...metadata, 
        operationId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        context: 'timing'
      });

      throw error;
    }
  }

  // Get stored error logs (client-side only)
  public getStoredErrorLogs(): LogEntry[] {
    if (!this.isClient) return [];
    
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear stored error logs (client-side only)
  public clearStoredErrorLogs(): void {
    if (this.isClient) {
      localStorage.removeItem('error_logs');
    }
  }

  // Export logs for debugging
  public exportLogs(): string {
    const logs = this.getStoredErrorLogs();
    return JSON.stringify(logs, null, 2);
  }
}

// Create and export singleton instance
export const logger = new Logger();

// Utility function for request logging
export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.createChildLogger('request', { requestId, userId });
}

// Performance measurement decorator
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = `${className}.${propertyName}`;
    
    return logger.time(
      () => method.apply(this, args),
      methodName,
      { 
        className, 
        methodName, 
        args: args.length 
      }
    );
  };

  return descriptor;
}

// Log cleanup utility for client-side
if (typeof window !== 'undefined') {
  // Clean up old logs periodically
  setInterval(() => {
    const logs = logger.getStoredErrorLogs();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const recentLogs = logs.filter(log => 
      new Date(log.timestamp).getTime() > oneDayAgo
    );
    
    if (recentLogs.length !== logs.length) {
      localStorage.setItem('error_logs', JSON.stringify(recentLogs));
    }
  }, 60 * 60 * 1000); // Check every hour
}