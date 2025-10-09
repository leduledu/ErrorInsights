import { kafkaIntegratedService } from './kafka-integrated.service';
import { IErrorEventCreate } from '../types/error-event.types';
import { logger } from '../utils/logger.util';

export class MockErrorService {
  private static instance: MockErrorService;
  private intervalMs: number = 5000;
  private errorCount: number = 10;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  private constructor() { }

  public static getInstance(): MockErrorService {
    if (!MockErrorService.instance) {
      MockErrorService.instance = new MockErrorService();
    }
    return MockErrorService.instance;
  }

  public startGeneratingErrors(intervalMs?: number, errorCount?: number): void {
    if (this.isRunning) {
      logger.warn('Mock error generation is already running');
      return;
    }

    if (intervalMs !== undefined) {
      this.intervalMs = intervalMs;
    }
    if (errorCount !== undefined) {
      this.errorCount = errorCount;
    }

    logger.info('Starting mock error generation', {
      intervalMs: this.intervalMs,
      errorCount: this.errorCount,
    });

    this.isRunning = true;
    let generatedCount = 0;

    this.intervalId = setInterval(async () => {
      if (generatedCount >= this.errorCount) {
        this.stopGeneratingErrors();
        logger.info('Mock error generation completed', {
          totalGenerated: generatedCount,
        });
        return;
      }
      try {
        const mockError = this.generateMockError();
        const result = await kafkaIntegratedService.sendErrorEvent(mockError);

        if (result.success) {
          generatedCount++;
          logger.debug('Mock error sent successfully', {
            generatedCount,
            totalCount: this.errorCount,
            errorMessage: mockError.errorMessage,
          });
        } else {
          logger.error('Failed to send mock error', {
            error: result.error,
            generatedCount,
          });
        }
      } catch (error) {
        logger.error('Error generating mock error', {
          error,
          generatedCount,
        });
      }
    }, this.intervalMs);
  }

  public stopGeneratingErrors(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Mock error generation stopped');
  }

  public isGenerating(): boolean {
    return this.isRunning;
  }

  public getConfig(): { intervalMs: number; errorCount: number; isRunning: boolean } {
    return {
      intervalMs: this.intervalMs,
      errorCount: this.errorCount,
      isRunning: this.isRunning,
    };
  }

  private generateMockError(): IErrorEventCreate {
    const errorMessages = [
      'TypeError: Cannot read property of undefined',
      'ReferenceError: variable is not defined',
      'SyntaxError: Unexpected token in expression',
      'RangeError: Maximum call stack size exceeded',
      'URIError: URI malformed',
      'Error: Network request failed',
      'Error: Database connection timeout',
      'Error: Authentication failed',
      'Error: Permission denied',
      'Error: Resource not found',
      'Error: Validation failed',
      'Error: Internal server error',
    ];

    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    const users = [
      'john.doe',
      'jane.smith',
      'mike.johnson',
      'sarah.wilson',
      'david.brown',
      'lisa.garcia',
      'tom.anderson',
      'emma.davis',
    ];
    const urls = [
      'https://example.com/dashboard',
      'https://example.com/profile',
      'https://example.com/settings',
      'https://example.com/orders',
      'https://example.com/products',
      'https://example.com/login',
      'https://example.com/signup',
      'https://example.com/about',
    ];

    const stackTraces = [
      'at Object.handleClick (component.js:25:12)\nat HTMLButtonElement.<anonymous> (app.js:42:8)',
      'at fetchData (api.js:15:20)\nat loadUserData (user.js:8:15)\nat init (app.js:30:10)',
      'at validateForm (validation.js:45:5)\nat onSubmit (form.js:12:18)\nat HTMLFormElement.<anonymous> (page.js:22:4)',
      'at processPayment (payment.js:33:7)\nat checkout (cart.js:18:12)\nat click (button.js:9:15)',
      'at renderComponent (render.js:55:10)\nat updateUI (ui.js:28:6)\nat stateChange (state.js:14:20)',
    ];

    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)]!;
    const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)]!;
    const randomUser = users[Math.floor(Math.random() * users.length)]!;
    const randomUrl = urls[Math.floor(Math.random() * urls.length)]!;
    const randomStackTrace = stackTraces[Math.floor(Math.random() * stackTraces.length)]!;

    return {
      timestamp: new Date(),
      userId: randomUser,
      browser: randomBrowser,
      url: randomUrl,
      errorMessage: randomError,
      stackTrace: randomStackTrace,
    };
  }
}

export const mockErrorService = MockErrorService.getInstance();
