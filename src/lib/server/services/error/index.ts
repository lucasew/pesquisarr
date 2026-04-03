import BaseService from '../base';

import * as Sentry from '@sentry/sveltekit';

export default class ErrorService extends BaseService {
	report(error: unknown, context: Record<string, unknown> = {}) {
		Sentry.captureException(error, { extra: context });
		console.error('Captured Error:', error, 'Context:', context);
	}
}
