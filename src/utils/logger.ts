/**
 * Sistema centralizado de logging para desenvolvimento
 */

interface LogLevel {
    ERROR: 'error';
    WARN: 'warn';
    INFO: 'info';
    DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private log(level: keyof LogLevel, message: string, data?: any) {
        if (!this.isDevelopment) return;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        
        switch (level) {
            case 'ERROR':
                console.error(logMessage, data || '');
                break;
            case 'WARN':
                console.warn(logMessage, data || '');
                break;
            case 'INFO':
                console.info(logMessage, data || '');
                break;
            case 'DEBUG':
                console.log(logMessage, data || '');
                break;
        }
    }

    error(message: string, error?: any) {
        this.log('ERROR', message, error);
        
        // Em produção, poderia enviar para serviço de monitoramento
        if (!this.isDevelopment && error) {
            // TODO: Integrar com Sentry, DataDog, etc.
        }
    }

    warn(message: string, data?: any) {
        this.log('WARN', message, data);
    }

    info(message: string, data?: any) {
        this.log('INFO', message, data);
    }

    debug(message: string, data?: any) {
        this.log('DEBUG', message, data);
    }
}

export const logger = new Logger();
export default logger; 