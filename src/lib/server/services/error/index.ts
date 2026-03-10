import BaseService from '../base';

export default class ErrorService extends BaseService {
	report(error: unknown, context: Record<string, unknown> = {}) {
		// Log the error to console or any external service like Sentry
		console.error('Captured Error:', error, 'Context:', context);
		// If Sentry were integrated, we would use Sentry.captureException(error, { extra: context })
	}
}
