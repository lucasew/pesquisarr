import BaseService from '../base';

export default class ErrorService extends BaseService {
	report(error: unknown, context: Record<string, unknown> = {}): void {
		const timestamp = new Date().toISOString();

		const errorDetails =
			error instanceof Error
				? { message: error.message, stack: error.stack, name: error.name }
				: { message: String(error) };

		// Centralized logging point.
		// In the future, this is where Sentry.captureException would be called.
		// if (this.services.sentry) {
		//   this.services.sentry.captureException(error, { extra: context });
		// }

		console.error(
			JSON.stringify({
				timestamp,
				error: errorDetails,
				context
			})
		);
	}

	async healthCheck() {
		// Error service is always healthy as it has no external dependencies currently
		return { ok: true };
	}
}
