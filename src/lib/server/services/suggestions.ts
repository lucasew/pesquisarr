import BaseService from './base';

export default class SuggestionsService extends BaseService {
	private suggestions = [
		'Pioneer One',
		'Ubuntu ISO',
		'Animatrix',
		'Big Buck Bunny',
		'Cosmos Laundromat',
		'Sintel',
		'Tears of Steel',
		'Debian ISO',
		'Arch Linux ISO',
		'Blender Benchmark',
		'The Open Movie Project',
		'Public Domain Movies'
	];

	getRandomSuggestion(): string {
		const randomIndex = Math.floor(Math.random() * this.suggestions.length);
		return this.suggestions[randomIndex];
	}
}
