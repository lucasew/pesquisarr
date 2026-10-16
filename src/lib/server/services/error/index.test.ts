import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/astro', () => ({
	captureException: vi.fn(),
	addBreadcrumb: vi.fn(),
	getClient: vi.fn(() => undefined)
}));

import * as Sentry from '@sentry/astro';
import ErrorService from './index';
import { createMockEvent } from '../test-utils';

describe('ErrorService', () => {
	let service: ErrorService;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		service = new ErrorService(createMockEvent());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('report forwards unexpected errors to Sentry', () => {
		const err = new Error('result parse failed');
		service.report(err, { message: 'Search failed', sourceName: 'Google' });

		expect(Sentry.captureException).toHaveBeenCalledWith(err, {
			extra: { message: 'Search failed', sourceName: 'Google' }
		});
		expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
	});

	it('warn leaves a breadcrumb and does not capture an exception', () => {
		const err = new Error('Failed to fetch HTML: Too Many Requests');
		service.warn(err, { sourceName: 'Google', message: 'Search source unavailable', status: 429 });

		expect(Sentry.captureException).not.toHaveBeenCalled();
		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
			category: 'upstream',
			level: 'warning',
			message: 'Failed to fetch HTML: Too Many Requests',
			data: { sourceName: 'Google', message: 'Search source unavailable', status: 429 }
		});
	});
});
