export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
	const timestamp = new Date().toISOString();

	const errorDetails =
		error instanceof Error
			? { message: error.message, stack: error.stack, name: error.name }
			: { message: String(error) };

	// Centralized logging point.
	// In the future, Sentry.captureException(error, { extra: context }) goes here.
	console.error(
		JSON.stringify({
			timestamp,
			error: errorDetails,
			context
		})
	);
}
