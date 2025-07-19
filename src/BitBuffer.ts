import { PAD_CODEWORDS } from './constants';

/**
 * Utility class for building bit sequences of varying length
 * and store them in a `Uint8Array`
 */
export default class BitBuffer {
	/**
	 * The buffer used to store the bit sequence.
	 */
	private buffer: Uint8Array;
	/**
	 * The index of the current byte within the buffer.
	 */
	private bytePointer: number = 0;
	/**
	 * The index of the current bit within the current byte.
	 */
	private bitPointer: number = 0;

	constructor(initialSize: number = 1) {
		this.buffer = new Uint8Array(initialSize);
	}

	get length(): number {
		return this.buffer.length;
	}

	/**
	 * Ensures the buffer has enough capacity to store the specified number of bits.
	 * @param bitsToAdd The number of bits to add to the buffer.
	 */
	private ensureCapacity(bitsToAdd: number): void {
		const requiredCapacity = this.bytePointer + Math.ceil(bitsToAdd / 8);
		if (requiredCapacity > this.buffer.length) {
			const newBuffer = new Uint8Array(requiredCapacity);
			newBuffer.set(this.buffer);
			this.buffer = newBuffer;
		}
	}

	/**
	 * Appends the specified number of bits to the buffer.
	 * @param value The value to append.
	 * @param length The number of bits to append. If there are more bits than the value has,
	 * the value is padded with zeros on the most significant bits.
	 */
	appendBits(value: number, length?: number) {
		const realLength = value === 0 ? 1 : value.toString(2).length;
		if (!length) length = realLength;
		this.ensureCapacity(length);

		const padding = length - realLength;
		// Add padding bits (simply move pointer)
		this.bitPointer += padding;
		if (this.bitPointer >= 8) {
			this.bytePointer += Math.floor(this.bitPointer / 8);
			this.bitPointer %= 8;
		}

		for (let i = realLength - 1; i >= 0; i--) {
			/**
			 * This extracts the i-th bit and places it in the current byte at the current bit index:
			 * - Math.floor(value / Math.pow(2, i)) & 1 : extracts the i-th bit using division instead of
			 * bit shifting to avoid JavaScript's 32-bit signed integer limitations.
			 * - << (7 - this.bitPointer) : shifts the extracted bit to the correct position within the current byte.
			 * - |= : performs a bitwise OR operation to set the bit in the current byte.
			 */
			this.buffer[this.bytePointer]! |= (Math.floor(value / Math.pow(2, i)) & 1) << (7 - this.bitPointer);
			this.bitPointer++;
			if (this.bitPointer === 8) {
				this.bytePointer++;
				this.bitPointer = 0;
			}
		}
	}

	/**
	 * Fills the current byte with zeros and advances to the next byte, if necessary.
	 */
	padByte() {
		if (this.bitPointer > 0) {
			this.bitPointer = 0;
			this.bytePointer++;
		}
	}

	/**
	 * Fills the BitBuffer to its full capacity with pad codewords
	 */
	fill() {
		// If the current byte is not full, pad it with zeros
		this.padByte();
		let i = 0;
		while (this.bytePointer < this.buffer.length) {
			this.buffer[this.bytePointer] = PAD_CODEWORDS[i++]!;
			this.bytePointer++;
			i %= 2;
		}
	}

	/**
	 * Converts the BitBuffer to an array of bytes, keeping only the bytes that have been written.
	 */
	toArray() {
		const totalBytes = this.bytePointer + (this.bitPointer > 0 ? 1 : 0);
		return this.buffer.slice(0, totalBytes);
	}

	toString(pretty = false) {
		let str = '';
		this.buffer.forEach((byte, i) => {
			str += byte.toString(2).padStart(8, '0');
			if (pretty) str += ' ';
		});
		if (pretty) str += `(${this.bitPointer})`;
		return str.trim();
	}
}
