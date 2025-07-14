// Logger utility for the Teacher Performance App

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // حفظ آخر 1000 log entry
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data
    };

    this.logs.push(logEntry);

    // الحفاظ على حجم معقول للـ logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // في وضع التطوير، عرض الـ logs في console
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(level, message, context, data);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
      }
    }
  }

  debug(message: string, context?: string, data?: any) {
    this.addLog(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any) {
    this.addLog(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.addLog(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.addLog(LogLevel.ERROR, message, context, data);
  }

  // الحصول على جميع الـ logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // الحصول على الـ logs حسب المستوى
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // مسح جميع الـ logs
  clearLogs() {
    this.logs = [];
  }

  // تصدير الـ logs كـ JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // حفظ الـ logs في AsyncStorage (للاستخدام المستقبلي)
  async saveLogsToStorage(): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('app_logs', JSON.stringify(this.logs));
    } catch (error) {
      this.error('Failed to save logs to storage', 'Logger', error);
    }
  }

  // تحميل الـ logs من AsyncStorage
  async loadLogsFromStorage(): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const storedLogs = await AsyncStorage.default.getItem('app_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (error) {
      this.error('Failed to load logs from storage', 'Logger', error);
    }
  }
}

// إنشاء instance واحد من Logger
export const logger = new Logger();

// Helper functions للاستخدام السريع
export const logDebug = (message: string, context?: string, data?: any) => {
  logger.debug(message, context, data);
};

export const logInfo = (message: string, context?: string, data?: any) => {
  logger.info(message, context, data);
};

export const logWarn = (message: string, context?: string, data?: any) => {
  logger.warn(message, context, data);
};

export const logError = (message: string, context?: string, data?: any) => {
  logger.error(message, context, data);
}; 