import * as Sentry from '@sentry/astro';
import BaseService from '../base';

export default class ErrorService extends BaseService {
	report(error: unknown, context: Record<string, unknown> = {}) {
		console.error('Captured Error:', error, 'Context:', context);
		try {
			Sentry.captureException(error, { extra: context });
		} catch (sentryError) {
			console.error('Sentry.captureException failed:', sentryError);
		}
	}
}
