import type { AppEvent } from '../app-event';

export interface HealthCheckResult {
	ok: boolean;
	[key: string]: unknown;
}

export default abstract class BaseService {
	protected event: AppEvent;

	constructor(event: AppEvent) {
		this.event = event;
	}

	async healthCheck(): Promise<HealthCheckResult> {
		return { ok: true };
	}

	protected get services() {
		if (!this.event.locals.services) {
			throw new Error('Services not initialized in locals');
		}
		return this.event.locals.services;
	}

	protected get env() {
		return this.event.platform?.env ?? (this.event.locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
	}

	protected get platform() {
		return this.event.platform;
	}

	protected get locals() {
		return this.event.locals;
	}
}
