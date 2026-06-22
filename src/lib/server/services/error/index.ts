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
