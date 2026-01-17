export interface HealthCheckResult {
	ok: boolean;
	[key: string]: unknown;
}

import type { RequestEvent } from '@sveltejs/kit';

export default abstract class BaseService {
	protected platform: App.Platform;
	protected event?: RequestEvent;

	constructor(platform: App.Platform, event?: RequestEvent) {
		this.platform = platform;
		this.event = event;
	}

	async healthCheck(): Promise<HealthCheckResult> {
		return { ok: true };
	}

	protected get services() {
		if (!this.event?.services) {
			throw new Error('Services not initialized in event');
		}
		return this.event.services;
	}

	protected get env() {
		return this.platform?.env;
	}

	protected get context() {
		return this.platform?.context;
	}
}
