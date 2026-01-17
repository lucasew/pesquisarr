export interface HealthCheckResult {
	ok: boolean;
	[key: string]: unknown;
}

export default abstract class BaseService {
	protected platform: App.Platform;

	constructor(platform: App.Platform) {
		this.platform = platform;
	}

	async healthCheck(): Promise<HealthCheckResult> {
		return { ok: true };
	}

	protected get services() {
		if (!this.platform!.services) {
			throw new Error('Services not initialized in platform');
		}
		return this.platform!.services;
	}

	protected get env() {
		return this.platform!.env;
	}

	protected get context() {
		return this.platform!.context;
	}
}
