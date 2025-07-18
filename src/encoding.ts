import BitBuffer from './BitBuffer';
import { ALPHANUMERIC_ENCODING_TABLE, DATA_CODEWORDS_BY_TYPE, MODE_INDICATOR } from './constants';
import { ErrorCorrectionLevel, QRCodeType, Version } from './types';

/**
 * Base QR Code Encoding Modes as per ISO/IEC 18004.
 */
type EncodingMode = 'numeric' | 'alphanumeric' | 'byte' | 'kanji';

export function encode(data: string, mode: EncodingMode, qrType: QRCodeType): BitBuffer {
	let encoded: BitBuffer = new BitBuffer();

	switch (mode) {
		/** TODO: Implement other encoding modes */
		case 'alphanumeric':
			encoded = encodeAlphanumeric(data, 1, 'M');
			break;
		default:
			throw new Error(`Unsupported encoding mode: ${mode}. Only alphanumeric is supported.`);
	}
	encoded.fill();
	return encoded;
}

export function getCharacterCountIndicatorSize(version: Version, encoding: EncodingMode) {
	switch (encoding) {
		case 'alphanumeric': {
			if (version <= 9) return 9;
			else if (version <= 26) return 11;
			else if (version <= 40) return 13;
			else throw new Error(`Unknown version: ${version}. Only versions 1-40 are supported.`);
		}
		default:
			throw new Error(`Unsupported encoding mode: ${encoding}. Only alphanumeric is supported.`);
	}
}

/**
 * Encodes a string of alphanumeric characters into a binary string.
 */
export function encodeAlphanumeric(data: string, version: Version, errorCorrectionLevel: ErrorCorrectionLevel) {
	if (version !== 1) throw new Error(`Unsupported version: ${version}. Only version 1 is supported.`);
	if (errorCorrectionLevel !== 'M')
		throw new Error(`Unsupported error correction level: ${errorCorrectionLevel}. Only level M is supported.`);

	let size = DATA_CODEWORDS_BY_TYPE[`${version}${errorCorrectionLevel}`];
	let encoded = new BitBuffer(size);
	encoded.appendBits(MODE_INDICATOR.ALPHANUMERIC, 4);
	encoded.appendBits(data.length, getCharacterCountIndicatorSize(version, 'alphanumeric'));
	for (let i = 0; i < data.length; i += 2) {
		const curr = data[i];
		const next = data[i + 1];

		const currValue = ALPHANUMERIC_ENCODING_TABLE[curr];
		const nextValue = ALPHANUMERIC_ENCODING_TABLE[next];

		if (!currValue) throw new Error(`Non-alphanumeric character: ${curr}`);
		if (next && !nextValue) throw new Error(`Non-alphanumeric character: ${next}`);

		// If we have two characters, the value of the first character is multiplied by 45 and added to the value of the second character.
		// For two characters, the chunk is encoded as a 11-bit binary number.
		if (next) encoded.appendBits(currValue * 45 + nextValue, 11);
		else encoded.appendBits(currValue, 6);
	}

	encoded.appendBits(0, 4); // 4-bit terminator
	encoded.padByte();

	return encoded;
}
