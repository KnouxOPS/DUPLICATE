import fs from 'fs';
import path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private logPath: string = '';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private initialized = false;
  private logLevel: LogLevel = 'info';

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private initialize(): void {
    if (this.initialized) return;

    try {
      const userDataPath = process.env.APPDATA || 
                          process.env.HOME || 
                          '/tmp';
      
      const logDir = path.join(userDataPath, 'Knoux', 'logs');
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const date = new Date().toISOString().split('T')[0];
      this.logPath = path.join(logDir, `knoux-${date}.log`);
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.logLevel];
  }

  private formatEntry(entry: LogEntry): string {
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    const formattedEntry = this.formatEntry(entry);
    
    switch (level) {
      case 'debug':
        console.debug(formattedEntry);
        break;
      case 'info':
        console.info(formattedEntry);
        break;
      case 'warn':
        console.warn(formattedEntry);
        break;
      case 'error':
        console.error(formattedEntry);
        break;
    }

    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }

  flush(): void {
    if (this.logBuffer.length === 0) return;

    this.initialize();

    if (!this.logPath) return;

    try {
      const content = this.logBuffer
        .map(entry => this.formatEntry(entry))
        .join('\n') + '\n';

      fs.appendFileSync(this.logPath, content, 'utf-8');
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  async getLogs(lines: number = 100): Promise<LogEntry[]> {
    this.initialize();

    if (!this.logPath || !fs.existsSync(this.logPath)) {
      return this.logBuffer.slice(-lines);
    }

    try {
      const content = fs.readFileSync(this.logPath, 'utf-8');
      const logLines = content.trim().split('\n').slice(-lines);
      
      return logLines.map(line => this.parseLine(line)).filter(Boolean) as LogEntry[];
    } catch (error) {
      console.error('Failed to read logs:', error);
      return this.logBuffer.slice(-lines);
    }
  }

  private parseLine(line: string): LogEntry | null {
    const match = line.match(/\[(.+?)\] \[(.+?)\] (.+)/);
    if (!match) return null;

    const [, timestamp, level, rest] = match;
    
    let message = rest;
    let data: Record<string, any> | undefined;

    const jsonMatch = rest.match(/^(.+?) (\{.+\})$/);
    if (jsonMatch) {
      message = jsonMatch[1];
      try {
        data = JSON.parse(jsonMatch[2]);
      } catch {
        message = rest;
      }
    }

    return {
      timestamp,
      level: level.toLowerCase() as LogLevel,
      message,
      data,
    };
  }

  async clearLogs(): Promise<void> {
    this.logBuffer = [];
    
    this.initialize();

    if (this.logPath && fs.existsSync(this.logPath)) {
      try {
        fs.unlinkSync(this.logPath);
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  }

  getLogPath(): string {
    this.initialize();
    return this.logPath;
  }

  async rotateOldLogs(daysToKeep: number = 7): Promise<number> {
    this.initialize();

    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    try {
      const files = fs.readdirSync(logDir);
      
      for (const file of files) {
        if (!file.startsWith('knoux-') || !file.endsWith('.log')) continue;

        const dateMatch = file.match(/knoux-(\d{4}-\d{2}-\d{2})\.log/);
        if (!dateMatch) continue;

        const fileDate = new Date(dateMatch[1]);
        if (fileDate < cutoffDate) {
          fs.unlinkSync(path.join(logDir, file));
          deletedCount++;
        }
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }

    return deletedCount;
  }
}

export const logger = new Logger();

process.on('exit', () => {
  logger.flush();
});

process.on('SIGINT', () => {
  logger.flush();
  process.exit();
});

process.on('SIGTERM', () => {
  logger.flush();
  process.exit();
});
