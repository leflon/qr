import { expect, test } from 'bun:test';
import { encodeAlphanumeric } from '../src/encoding';
import BitBuffer from '../src/classes/BitBuffer';

test('Alphanumeric', () => {
	const expected = new BitBuffer(16);
	expected.appendBits(0b0, 2);
	expected.appendBits(0b100000001010011100111011100111001000010);
	expect(encodeAlphanumeric('AC-42', 1, 'M').toString()).toBe(expected.toString());
});
