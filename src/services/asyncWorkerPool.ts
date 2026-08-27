// src/services/asyncWorkerPool.ts
export type TaskPriority = 'high' | 'normal' | 'background';

export interface BackgroundTask {
  id: string;
  name: string;
  run: () => Promise<any> | any;
  priority?: TaskPriority;
  onError?: (error: any) => void;
  onSuccess?: (result: any) => void;
}

export interface ErrorReport {
  timestamp: number;
  context: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Worker Asíncrono de Errores y Telemetría:
 * Procesa y envía reportes (ej. Sentry / logs) en segundo plano
 * garantizando que nunca se bloquee el hilo principal de renderizado.
 */
class ErrorAndTelemetryWorker {
  private errorBuffer: ErrorReport[] = [];
  private isFlushing = false;
  private listeners: ((error: ErrorReport) => void)[] = [];

  public logError(context: string, error: any, metadata?: Record<string, any>) {
    const report: ErrorReport = {
      timestamp: Date.now(),
      context,
      message: error?.message || String(error),
      stack: error?.stack,
      metadata,
    };

    this.errorBuffer.push(report);
    console.warn(`[AsyncWorkerPool] Error en contexto '${context}':`, report.message);

    // Notificar a listeners registrados (ej. Sentry)
    this.scheduleFlush();
  }

  public registerListener(fn: (error: ErrorReport) => void) {
    this.listeners.push(fn);
  }

  private scheduleFlush() {
    if (this.isFlushing || this.errorBuffer.length === 0) return;

    this.isFlushing = true;
    setTimeout(() => {
      while (this.errorBuffer.length > 0) {
        const item = this.errorBuffer.shift();
        if (item) {
          this.listeners.forEach((listener) => {
            try {
              listener(item);
            } catch (e) {
              console.error('[ErrorWorker] Fallo al despachar listener de error:', e);
            }
          });
        }
      }
      this.isFlushing = false;
    }, 50);
  }
}

/**
 * Worker Asíncrono de Cola de Impresión:
 * Desacopla la conexión Socket TCP térmica del hilo de la interfaz
 * evitando congelamientos y controlando la concurrencia de tickets.
 */
class PrinterWorkerQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;

  public enqueue(printJob: () => Promise<any>): Promise<boolean> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        try {
          await printJob();
          resolve(true);
        } catch (err) {
          errorTelemetryWorker.logError('PrinterWorkerQueue', err);
          resolve(false);
        }
      });

      this.processNext();
    });
  }

  private processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    setTimeout(async () => {
      const nextTask = this.queue.shift();
      if (nextTask) {
        try {
          await nextTask();
        } catch (err) {
          errorTelemetryWorker.logError('PrinterWorkerQueue:Execution', err);
        }
      }

      this.isProcessing = false;
      setTimeout(() => {
        this.processNext();
      }, 100);
    }, 0);
  }
}

// Instancias globales singleton
export const errorTelemetryWorker = new ErrorAndTelemetryWorker();
export const printerWorkerQueue = new PrinterWorkerQueue();

/**
 * Helper para despachar tareas pesadas en segundo plano
 * después de completar las transiciones y animaciones de la UI.
 */
export const runInBackground = (
  task: () => Promise<any> | any,
  context: string = 'BackgroundJob',
): void => {
  setTimeout(async () => {
    try {
      await task();
    } catch (err) {
      errorTelemetryWorker.logError(context, err);
    }
  }, 0);
};
