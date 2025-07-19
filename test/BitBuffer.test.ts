import { describe, it, expect } from 'bun:test';
import BitBuffer from '../src/classes/BitBuffer';

describe('BitBuffer', () => {
	describe('constructor', () => {
		it('should create buffer with default size', () => {
			const buffer = new BitBuffer();
			expect(buffer.length).toBe(1);
		});

		it('should create buffer with custom size', () => {
			const buffer = new BitBuffer(4);
			expect(buffer.length).toBe(4);
		});
	});

	describe('appendBits', () => {
		it('should append single bit', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(1, 1);
			expect(buffer.toString()).toBe('10000000');
		});

		it('should append multiple bits', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0b1010, 4);
			expect(buffer.toString()).toBe('10100000');
		});

		it('should append a long sequence of bits', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0b100000001010011100111011100111001000010);
			expect(buffer.toString()).toBe('1000000010100111001110111001110010000100');
		});

		it('should auto-detect bit length when not specified', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(7); // 0b111
			expect(buffer.toString()).toBe('11100000');
		});

		it('should pad with zeros when specified length is larger than value', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0b11, 5); // pad 0b11 to 5 bits: 0b00011
			expect(buffer.toString()).toBe('00011000');
		});

		it('should handle zero value', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0, 3);
			expect(buffer.toString()).toBe('00000000');
		});

		it('should handle consecutive appends within same byte', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0b101, 3);
			buffer.appendBits(0b110, 3);
			expect(buffer.toString()).toBe('10111000');
		});

		it('should handle appends across byte boundaries', () => {
			const buffer = new BitBuffer(2);
			buffer.appendBits(0b11111111, 8); // fill first byte
			buffer.appendBits(0b101, 3); // start second byte
			expect(buffer.toString()).toBe('1111111110100000');
		});

		it('should auto-resize buffer when needed', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0xff, 8);
			buffer.appendBits(0xff, 8);
			expect(buffer.length).toBeGreaterThan(1);
			expect(buffer.toString()).toBe('1111111111111111');
		});
	});

	describe('padByte', () => {
		it('should advance to next byte when current byte is partially filled', () => {
			const buffer = new BitBuffer(2);
			buffer.appendBits(0b101, 3);
			buffer.padByte();
			buffer.appendBits(0b11, 2);
			expect(buffer.toString()).toBe('1010000011000000');
		});

		it('should do nothing when current byte is empty', () => {
			const buffer = new BitBuffer();
			buffer.padByte();
			buffer.appendBits(0b11, 2);
			expect(buffer.toString()).toBe('11000000');
		});
	});

	describe('fill', () => {
		it('should fill remaining buffer with pad codewords', () => {
			const buffer = new BitBuffer(4);
			buffer.appendBits(0xff, 8);
			buffer.fill();
			const array = buffer.toArray();
			expect(array.length).toBe(4);
			expect(array[0]).toBe(0xff);
			// Should alternate between pad codewords (236, 17)
			expect([236, 17]).toContain(array[1]);
			expect([236, 17]).toContain(array[2]);
			expect([236, 17]).toContain(array[3]);
		});

		it('should pad current byte before filling', () => {
			const buffer = new BitBuffer(3);
			buffer.appendBits(0b101, 3); // partial byte
			buffer.fill();
			const array = buffer.toArray();
			expect(array[0]).toBe(0b10100000); // padded with zeros
		});
	});

	describe('extend', () => {
		it('should extend the buffer with another BitBuffer', () => {
			const buffer1 = new BitBuffer();
			buffer1.appendBits(0xff, 8);
			const buffer2 = new BitBuffer();
			buffer2.appendBits(0b101, 3);
			buffer1.extend(buffer2);
			const array = buffer1.toArray();
			expect(array.length).toBe(2);
			expect(array[0]).toBe(0xff);
			expect(array[1]).toBe(0b10100000);
		});

		it('should extend the buffer with an Uint8Array', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0xff, 8);
			buffer.extend(new Uint8Array([0b101, 0b110]));
			const array = buffer.toArray();
			expect(array.length).toBe(3);
			expect(array[0]).toBe(0xff);
			expect(array[1]).toBe(0b00000101);
			expect(array[2]).toBe(0b00000110);
		});
	});

	describe('toArray', () => {
		it('should return only used bytes', () => {
			const buffer = new BitBuffer(10);
			buffer.appendBits(0xff, 8);
			buffer.appendBits(0b101, 3);
			const array = buffer.toArray();
			expect(array.length).toBe(2);
			expect(array[0]).toBe(0xff);
			expect(array[1]).toBe(0b10100000);
		});

		it('should handle empty buffer', () => {
			const buffer = new BitBuffer();
			const array = buffer.toArray();
			expect(array.length).toBe(0);
		});

		it('should handle full byte alignment', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0xff, 8);
			const array = buffer.toArray();
			expect(array.length).toBe(1);
			expect(array[0]).toBe(0xff);
		});
	});

	describe('toString', () => {
		it('should return binary representation without pretty format', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0b10101010, 8);
			buffer.appendBits(0b11, 2);
			expect(buffer.toString()).toBe('1010101011000000');
		});

		it('should return binary representation with pretty format', () => {
			const buffer = new BitBuffer();
			buffer.appendBits(0b10101010, 8);
			buffer.appendBits(0b11, 2);
			expect(buffer.toString(true)).toBe('10101010 11000000 (2)');
		});
	});

	describe('edge cases', () => {
		it('should handle large values', () => {
			const buffer = new BitBuffer();
			const largeValue = 0xffffff; // 24-bit value
			buffer.appendBits(largeValue);
			expect(buffer.toString()).toBe('111111111111111111111111');
		});
		it('should handle boundary conditions in ensureCapacity', () => {
			const buffer = new BitBuffer();
			// This should trigger multiple resizes
			for (let i = 0; i < 20; i++) {
				buffer.appendBits(i, 4);
			}
			expect(buffer.toArray().length).toBeGreaterThan(1);
		});
	});
});
