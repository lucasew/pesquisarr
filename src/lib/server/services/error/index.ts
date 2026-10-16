import * as Sentry from '@sentry/astro';
import BaseService from '../base';

function toError(error: unknown): Error {
	if (error instanceof Error) return error;
	if (typeof error === 'string') return new Error(error);
	try {
		return new Error(JSON.stringify(error));
	} catch {
		return new Error(String(error));
	}
}

export default class ErrorService extends BaseService {
	/** Report an application error; always logs, forwards to Sentry when the SDK is live. */
	report(error: unknown, context: Record<string, unknown> = {}) {
		const err = toError(error);
		console.error('Captured Error:', err, 'Context:', context);
		// captureException is sync/non-throwing in normal SDK paths; try/catch is belt for transport/init edge cases.
		try {
			Sentry.captureException(err, { extra: context });
		} catch (sentryError) {
			console.error('Sentry.captureException failed:', sentryError);
		}
	}

	/**
	 * Expected upstream failure (rate limit, dropped connection).
	 * Leaves a breadcrumb for the next real error and does not open a Sentry issue.
	 */
	warn(error: unknown, context: Record<string, unknown> = {}) {
		const err = toError(error);
		console.warn('Upstream failure:', err.message, 'Context:', context);
		try {
			Sentry.addBreadcrumb({
				category: 'upstream',
				level: 'warning',
				message: err.message,
				data: context
			});
		} catch (sentryError) {
			console.error('Sentry.addBreadcrumb failed:', sentryError);
		}
	}

	async healthCheck() {
		const client = Sentry.getClient();
		const enabled = Boolean(client?.getOptions()?.enabled);
		return {
			ok: true,
			service: 'error',
			sentryEnabled: enabled,
			sentryDsnConfigured: Boolean(client?.getDsn())
		};
	}
}
