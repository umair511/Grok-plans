/**
 * SS background worker — mirrors PS optimizer.worker pattern.
 * Optimizer logic is imported as-is; this file only offloads CPU work off the UI thread.
 */
import { generateSSJumboRollRequirements, generateSSPlans } from './ssOptimizer';

export type SSWorkerRequest =
  | {
      type: 'RUN_SYNTHESIS';
      orders: any[];
      settings: any;
      film?: string;
      executionId?: string;
    }
  | {
      type: 'RUN_PLANS';
      orders: any[];
      jumboRolls: any[];
      settings: any;
      film?: string;
      requirements?: any[];
      executionId?: string;
    };

export type SSWorkerResponse =
  | {
      type: 'SYNTHESIS_SUCCESS';
      requirements: any[];
      durationMs?: number;
      executionId?: string;
    }
  | {
      type: 'PLANS_SUCCESS';
      result: any;
      durationMs?: number;
      executionId?: string;
    }
  | {
      type: 'SS_ERROR';
      error: string;
      executionId?: string;
    };

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (event: MessageEvent<SSWorkerRequest>) => {
    const data = event.data;
    const executionId = data.executionId || 'SS-' + Math.floor(100000 + Math.random() * 900000);
    const tStart = performance.now();

    try {
      if (data.type === 'RUN_SYNTHESIS') {
        const requirements = generateSSJumboRollRequirements(
          data.orders,
          data.settings,
          data.film
        );
        const durationMs = Math.round((performance.now() - tStart) * 100) / 100;
        const response: SSWorkerResponse = {
          type: 'SYNTHESIS_SUCCESS',
          requirements,
          durationMs,
          executionId,
        };
        self.postMessage(response);
        return;
      }

      if (data.type === 'RUN_PLANS') {
        const result = generateSSPlans(
          data.orders,
          data.jumboRolls,
          data.settings,
          data.film,
          undefined,
          data.requirements
        );
        const durationMs = Math.round((performance.now() - tStart) * 100) / 100;
        const response: SSWorkerResponse = {
          type: 'PLANS_SUCCESS',
          result,
          durationMs,
          executionId,
        };
        self.postMessage(response);
        return;
      }
    } catch (err: any) {
      const response: SSWorkerResponse = {
        type: 'SS_ERROR',
        error: err?.message || 'SS worker error',
        executionId,
      };
      self.postMessage(response);
    }
  };
}
