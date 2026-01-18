import type { RequestEvent } from '@sveltejs/kit';

export interface HealthCheckResult {
	ok: boolean;
	[key: string]: unknown;
}

export default abstract class BaseService {
	protected event: RequestEvent;

	constructor(event: RequestEvent) {
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
		return this.event.platform?.env;
	}

	protected get platform() {
		return this.event.platform;
	}

	protected get locals() {
		return this.event.locals;
	}
}
