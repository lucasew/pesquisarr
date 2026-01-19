import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const suggestion = locals.services.suggestions.getRandomSuggestion();
	return {
		suggestion
	};
};
