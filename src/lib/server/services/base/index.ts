export interface HealthCheckResult {
	ok: boolean;
	[key: string]: unknown;
}

import type { RequestEvent } from '@sveltejs/kit';
import type { Services } from '..';

export default abstract class BaseService {
	protected event?: RequestEvent;

	constructor(event?: RequestEvent) {
		this.event = event;
	}

	async healthCheck(): Promise<HealthCheckResult> {
		return { ok: true };
	}

	protected get services(): Services | undefined {
		return this.event?.services;
	}
}
