import { describe, it, expect } from 'bun:test';
import GaloisField from '../src/classes/GaloisField';

describe('GaloisField', () => {
	describe('add operation', () => {
		it('should perform XOR addition for two elements', () => {
			expect(GaloisField.add(0, 0)).toBe(0);
			expect(GaloisField.add(1, 0)).toBe(1);
			expect(GaloisField.add(0, 1)).toBe(1);
			expect(GaloisField.add(1, 1)).toBe(0);
		});

		it('should handle arbitrary byte values', () => {
			expect(GaloisField.add(0b10101010, 0b01010101)).toBe(0b11111111);
			expect(GaloisField.add(0b11110000, 0b00001111)).toBe(0b11111111);
			expect(GaloisField.add(0xff, 0x00)).toBe(0xff);
			expect(GaloisField.add(0xff, 0xff)).toBe(0x00);
		});

		it('should be commutative', () => {
			const a = 0b11010011;
			const b = 0b01101100;
			expect(GaloisField.add(a, b)).toBe(GaloisField.add(b, a));
		});

		it('should be associative', () => {
			const a = 0b10101010;
			const b = 0b11001100;
			const c = 0b00110011;
			expect(GaloisField.add(GaloisField.add(a, b), c)).toBe(GaloisField.add(a, GaloisField.add(b, c)));
		});

		it('should have identity element (0)', () => {
			const x = 0b11010110;
			expect(GaloisField.add(x, 0)).toBe(x);
			expect(GaloisField.add(0, x)).toBe(x);
		});

		it('should have inverse property (self-inverse)', () => {
			const x = 0b11010110;
			expect(GaloisField.add(x, x)).toBe(0);
		});
	});

	describe('subtract operation', () => {
		it('should be equivalent to addition in GF(2^8)', () => {
			const a = 0b11010011;
			const b = 0b01101100;
			expect(GaloisField.subtract(a, b)).toBe(GaloisField.add(a, b));
		});

		it('should handle zero values', () => {
			expect(GaloisField.subtract(0, 0)).toBe(0);
			expect(GaloisField.subtract(5, 0)).toBe(5);
			expect(GaloisField.subtract(0, 5)).toBe(5);
		});

		it('should be self-inverse', () => {
			const x = 0b10110101;
			expect(GaloisField.subtract(x, x)).toBe(0);
		});

		it('should be commutative (same as addition)', () => {
			const a = 0b11010011;
			const b = 0b01101100;
			expect(GaloisField.subtract(a, b)).toBe(GaloisField.subtract(b, a));
		});
	});

	describe('multiply operation', () => {
		it('should handle multiplication by zero', () => {
			expect(GaloisField.multiply(0, 0)).toBe(0);
			expect(GaloisField.multiply(0, 5)).toBe(0);
			expect(GaloisField.multiply(5, 0)).toBe(0);
			expect(GaloisField.multiply(0, 255)).toBe(0);
		});

		it('should handle multiplication by one', () => {
			expect(GaloisField.multiply(1, 1)).toBe(1);
			expect(GaloisField.multiply(1, 5)).toBe(5);
			expect(GaloisField.multiply(5, 1)).toBe(5);
			expect(GaloisField.multiply(1, 255)).toBe(255);
		});

		it('should be commutative', () => {
			expect(GaloisField.multiply(3, 5)).toBe(GaloisField.multiply(5, 3));
			expect(GaloisField.multiply(7, 13)).toBe(GaloisField.multiply(13, 7));
			expect(GaloisField.multiply(255, 2)).toBe(GaloisField.multiply(2, 255));
		});

		it('should be associative', () => {
			const a = 3;
			const b = 5;
			const c = 7;
			expect(GaloisField.multiply(GaloisField.multiply(a, b), c)).toBe(
				GaloisField.multiply(a, GaloisField.multiply(b, c))
			);
		});

		it('should handle specific known values', () => {
			// α * α = α^2
			expect(GaloisField.multiply(2, 2)).toBe(4);
			// Test some other powers of α
			expect(GaloisField.multiply(2, 4)).toBe(8);
			expect(GaloisField.multiply(2, 8)).toBe(16);
		});

		it('should work with generator element properties', () => {
			// 2 is the generator (α) in GF(2^8)
			// α^255 = 1 in the multiplicative group
			let result = 1;
			for (let i = 0; i < 255; i++) {
				result = GaloisField.multiply(result, 2);
			}
			expect(result).toBe(1);
		});

		it('should handle edge cases with maximum field values', () => {
			// Test multiplication doesn't overflow the field
			expect(GaloisField.multiply(255, 255)).toBeLessThan(256);
			expect(GaloisField.multiply(128, 128)).toBeLessThan(256);
		});

		it('should distribute over addition', () => {
			const a = 3;
			const b = 5;
			const c = 7;
			// a * (b + c) = a * b + a * c
			const left = GaloisField.multiply(a, GaloisField.add(b, c));
			const right = GaloisField.add(GaloisField.multiply(a, b), GaloisField.multiply(a, c));
			expect(left).toBe(right);
		});
	});

	describe('divide operation', () => {
		it('should handle division by one', () => {
			expect(GaloisField.divide(5, 1)).toBe(5);
			expect(GaloisField.divide(255, 1)).toBe(255);
			expect(GaloisField.divide(1, 1)).toBe(1);
		});

		it('should handle zero dividend', () => {
			expect(GaloisField.divide(0, 1)).toBe(0);
			expect(GaloisField.divide(0, 255)).toBe(0);
		});

		it('should throw error on division by zero', () => {
			expect(() => GaloisField.divide(5, 0)).toThrow('Division by zero');
		});

		it('should be inverse of multiplication', () => {
			const a = 7;
			const b = 13;
			const product = GaloisField.multiply(a, b);
			expect(GaloisField.divide(product, b)).toBe(a);
			expect(GaloisField.divide(product, a)).toBe(b);
		});

		it('should handle self-division', () => {
			expect(GaloisField.divide(5, 5)).toBe(1);
			expect(GaloisField.divide(255, 255)).toBe(1);
		});

		it('should maintain field closure', () => {
			// Result should always be in valid field range [0, 255]
			for (const a of [1, 7, 13, 255]) {
				for (const b of [1, 3, 5, 17]) {
					const result = GaloisField.divide(a, b);
					expect(result).toBeGreaterThanOrEqual(0);
					expect(result).toBeLessThan(256);
				}
			}
		});

		it('should satisfy multiplication verification', () => {
			const a = 42;
			const b = 17;
			const quotient = GaloisField.divide(a, b);
			expect(GaloisField.multiply(quotient, b)).toBe(a);
		});
	});

	describe('power operation', () => {
		it('should handle power of zero', () => {
			expect(GaloisField.power(5, 0)).toBe(1);
			expect(GaloisField.power(255, 0)).toBe(1);
			expect(GaloisField.power(1, 0)).toBe(1);
		});

		it('should handle power of one', () => {
			expect(GaloisField.power(5, 1)).toBe(5);
			expect(GaloisField.power(255, 1)).toBe(255);
			expect(GaloisField.power(1, 1)).toBe(1);
		});

		it('should handle powers of the generator element', () => {
			// 2 is the generator (α) in GF(2^8)
			expect(GaloisField.power(2, 1)).toBe(2);
			expect(GaloisField.power(2, 2)).toBe(4);
			expect(GaloisField.power(2, 3)).toBe(8);
			expect(GaloisField.power(2, 4)).toBe(16);
		});

		it('should handle cyclic property of the multiplicative group', () => {
			// α^255 = 1 in the multiplicative group
			expect(GaloisField.power(2, 255)).toBe(1);
			// α^256 = α^1
			expect(GaloisField.power(2, 256)).toBe(GaloisField.power(2, 1));
		});

		it('should be consistent with repeated multiplication', () => {
			const base = 7;
			let result = 1;
			for (let i = 0; i < 5; i++) {
				expect(GaloisField.power(base, i)).toBe(result);
				result = GaloisField.multiply(result, base);
			}
		});

		it('should handle large powers efficiently', () => {
			// Test that large powers don't cause overflow or performance issues
			expect(GaloisField.power(3, 100)).toBeLessThan(256);
			expect(GaloisField.power(5, 200)).toBeLessThan(256);
			expect(GaloisField.power(7, 254)).toBeLessThan(256);
		});

		it('should satisfy power laws when possible', () => {
			const base = 3;
			const exp1 = 5;
			const exp2 = 7;
			// In GF(2^8), we need to be careful about power laws due to the finite field structure
			const power1 = GaloisField.power(base, exp1);
			const power2 = GaloisField.power(base, exp2);
			const combined = GaloisField.multiply(power1, power2);
			const direct = GaloisField.power(base, (exp1 + exp2) % 255);
			expect(combined).toBe(direct);
		});
	});

	describe('field properties and edge cases', () => {
		it('should maintain field closure for all operations', () => {
			const testValues = [0, 1, 2, 3, 5, 7, 13, 17, 255];

			for (const a of testValues) {
				for (const b of testValues) {
					// Addition/subtraction results should be in [0, 255]
					const sum = GaloisField.add(a, b);
					expect(sum).toBeGreaterThanOrEqual(0);
					expect(sum).toBeLessThan(256);

					const diff = GaloisField.subtract(a, b);
					expect(diff).toBeGreaterThanOrEqual(0);
					expect(diff).toBeLessThan(256);

					// Multiplication results should be in [0, 255]
					const product = GaloisField.multiply(a, b);
					expect(product).toBeGreaterThanOrEqual(0);
					expect(product).toBeLessThan(256);

					// Division (when b != 0) should be in [0, 255]
					if (b !== 0) {
						const quotient = GaloisField.divide(a, b);
						expect(quotient).toBeGreaterThanOrEqual(0);
						expect(quotient).toBeLessThan(256);
					}
				}
			}
		});

		it('should handle boundary values correctly', () => {
			// Test with 0 and 255 (max value in GF(2^8))
			expect(GaloisField.add(0, 255)).toBe(255);
			expect(GaloisField.multiply(1, 255)).toBe(255);
			expect(GaloisField.divide(255, 255)).toBe(1);
			expect(GaloisField.power(255, 1)).toBe(255);
		});

		it('should demonstrate non-zero elements form multiplicative group', () => {
			// Every non-zero element should have a multiplicative inverse
			for (let a = 1; a < 256; a++) {
				const inverse = GaloisField.divide(1, a);
				expect(GaloisField.multiply(a, inverse)).toBe(1);
			}
		});

		it('should verify lookup table consistency', () => {
			// Test that the exponential and logarithm tables are consistent
			// This indirectly tests the static initialization
			for (let i = 1; i < 256; i++) {
				const logResult = GaloisField.multiply(i, i);
				expect(logResult).toBeGreaterThanOrEqual(0);
				expect(logResult).toBeLessThan(256);
			}
		});

		it('should handle typical Reed-Solomon operations', () => {
			// Test operations commonly used in Reed-Solomon error correction
			const data = [1, 2, 3, 4, 5];
			const generator = 2; // α

			// Simulate evaluation of polynomial at different points
			for (let x = 1; x < 10; x++) {
				let result = 0;
				let xPower = 1;

				for (const coeff of data) {
					result = GaloisField.add(result, GaloisField.multiply(coeff, xPower));
					xPower = GaloisField.multiply(xPower, x);
				}

				expect(result).toBeGreaterThanOrEqual(0);
				expect(result).toBeLessThan(256);
			}
		});
	});

	describe('mathematical properties verification', () => {
		it('should verify additive group properties', () => {
			const testValues = [0, 1, 5, 17, 255];

			// Closure already tested above

			// Associativity: (a + b) + c = a + (b + c)
			for (const a of testValues) {
				for (const b of testValues) {
					for (const c of testValues) {
						const left = GaloisField.add(GaloisField.add(a, b), c);
						const right = GaloisField.add(a, GaloisField.add(b, c));
						expect(left).toBe(right);
					}
				}
			}

			// Identity element is 0
			for (const a of testValues) {
				expect(GaloisField.add(a, 0)).toBe(a);
				expect(GaloisField.add(0, a)).toBe(a);
			}

			// Every element is its own inverse
			for (const a of testValues) {
				expect(GaloisField.add(a, a)).toBe(0);
			}
		});

		it('should verify multiplicative group properties (excluding 0)', () => {
			const testValues = [1, 2, 5, 17, 255]; // Non-zero elements

			// Associativity: (a * b) * c = a * (b * c)
			for (const a of testValues) {
				for (const b of testValues) {
					for (const c of testValues) {
						const left = GaloisField.multiply(GaloisField.multiply(a, b), c);
						const right = GaloisField.multiply(a, GaloisField.multiply(b, c));
						expect(left).toBe(right);
					}
				}
			}

			// Identity element is 1
			for (const a of testValues) {
				expect(GaloisField.multiply(a, 1)).toBe(a);
				expect(GaloisField.multiply(1, a)).toBe(a);
			}

			// Every non-zero element has an inverse
			for (const a of testValues) {
				const inverse = GaloisField.divide(1, a);
				expect(GaloisField.multiply(a, inverse)).toBe(1);
			}
		});

		it('should verify distributive property', () => {
			const testValues = [0, 1, 2, 5, 17];

			// a * (b + c) = a * b + a * c
			for (const a of testValues) {
				for (const b of testValues) {
					for (const c of testValues) {
						const left = GaloisField.multiply(a, GaloisField.add(b, c));
						const right = GaloisField.add(GaloisField.multiply(a, b), GaloisField.multiply(a, c));
						expect(left).toBe(right);
					}
				}
			}
		});
	});
});
