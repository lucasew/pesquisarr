// stolen from: https://raw.githubusercontent.com/Chocobo1/bencode_online/master/src/bencode/decode.js
// Refactored to keep decode cursor/state per call (safe under concurrent Workers requests).

const INTEGER_START = 0x69; // 'i'
const STRING_DELIM = 0x3a; // ':'
const DICTIONARY_START = 0x64; // 'd'
const LIST_START = 0x6c; // 'l'
const END_OF_TYPE = 0x65; // 'e'

/**
 * replaces parseInt(buffer.toString('ascii', start, end)).
 * For strings with less then ~30 charachters, this is actually a lot faster.
 *
 * @param {Buffer} data
 * @param {Number} start
 * @param {Number} end
 * @return {Number} calculated number
 */
function getIntFromBuffer(buffer, start, end) {
	let sum = 0;
	let sign = 1;

	for (let i = start; i < end; i++) {
		const num = buffer[i];

		if (num < 58 && num >= 48) {
			sum = sum * 10 + (num - 48);
			continue;
		}

		if (i === start && num === 43) {
			// +
			continue;
		}

		if (i === start && num === 45) {
			// -
			sign = -1;
			continue;
		}

		if (num === 46) {
			// .
			// its a float. break here.
			break;
		}

		throw new Error('not a number: buffer[' + i + '] = ' + num);
	}

	return sum * sign;
}

/** Per-decode cursor and buffer — not shared across concurrent calls. */
class Decoder {
	/**
	 * @param {Buffer} data
	 * @param {String|null} encoding
	 */
	constructor(data, encoding) {
		this.position = 0;
		this.encoding = encoding || null;
		this.data = data;
		this.bytes = data.length;
	}

	next() {
		switch (this.data[this.position]) {
			case DICTIONARY_START:
				return this.dictionary();
			case LIST_START:
				return this.list();
			case INTEGER_START:
				return this.integer();
			default:
				return String(this.buffer());
		}
	}

	find(chr) {
		let i = this.position;
		const c = this.data.length;
		const d = this.data;

		while (i < c) {
			if (d[i] === chr) return i;
			i++;
		}

		throw new Error(
			'Invalid data: Missing delimiter "' +
				String.fromCharCode(chr) +
				'" [0x' +
				chr.toString(16) +
				']'
		);
	}

	dictionary() {
		this.position++;

		const dict = {};

		while (this.data[this.position] !== END_OF_TYPE) {
			const key = this.buffer();
			const from = this.position;
			dict[key] = this.next();
			const to = this.position;
			if (String(key) === 'info') {
				dict['infohashFrom'] = from;
				dict['infohashTo'] = to;
			}
		}

		this.position++;

		return dict;
	}

	list() {
		this.position++;

		const lst = [];

		while (this.data[this.position] !== END_OF_TYPE) {
			lst.push(this.next());
		}

		this.position++;

		return lst;
	}

	integer() {
		const end = this.find(END_OF_TYPE);
		const number = getIntFromBuffer(this.data, this.position + 1, end);

		this.position += end + 1 - this.position;

		return number;
	}

	buffer() {
		let sep = this.find(STRING_DELIM);
		const length = getIntFromBuffer(this.data, this.position, sep);
		sep++;
		const end = sep + length;

		this.position = end;

		return this.encoding
			? this.data.toString(this.encoding, sep, end)
			: this.data.slice(sep, end);
	}
}

/**
 * Decodes bencoded data.
 *
 * @param  {Buffer} data
 * @param  {Number} start (optional)
 * @param  {Number} end (optional)
 * @param  {String} encoding (optional)
 * @return {Object|Array|Buffer|String|Number}
 */
function decode(data, start, end, encoding) {
	if (data == null || data.length === 0) {
		return null;
	}

	if (typeof start !== 'number' && encoding == null) {
		encoding = start;
		start = undefined;
	}

	if (typeof end !== 'number' && encoding == null) {
		encoding = end;
		end = undefined;
	}

	const buf = !Buffer.isBuffer(data) ? Buffer.from(data) : data.slice(start, end);

	return new Decoder(buf, encoding).next();
}

export default decode;
