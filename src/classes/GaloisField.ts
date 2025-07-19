/**
 * Utility class for operations in the extension field GF(2^8).
 * Elements in this field are polynomials of degree less than 8, which coefficients are elements of GF(2) (0 or 1).
 * Useful to generate QR code's error correction codes with the Reed-Solomon algorithm.
 */
export default abstract class GaloisField {
	/**
	 * The irreducible polynomial used in GF(2^8) as used in the Advanced Encryption Standard (AES):
	 * x^8 + x^4 + x^3 + x + 1.
	 * Think of it as a prime number but for polynomial arithmetic.
	 */
	private static IRREDUCIBLE_POLYNOMIAL = 0b100011101;

	/**
	 * Exponation lookup table in GF(2^8). Keeping the results beforehand to avoid redundant calculations improves performance.
	 */
	private static expTable: number[] = new Array(512);
	/**
	 * Logarithm lookup table in GF(2^8).
	 */
	private static logTable: number[] = new Array(256);

	// Initialization of lookup tables
	static {
		let x = 1;
		for (let i = 0; i < 255; i++) {
			// log and exp are inverse functions of each other.
			this.expTable[i] = x; // holds the value of α^i
			this.logTable[x] = i; // holds the value of i so that α^i = x

			x = x << 1; // Multiply by 2 (equivalent to α in GF(256))
			if (x >= 256) {
				// XOR with the irreducible polynomial
				// to ensure the result stays within the field.
				x = x ^ this.IRREDUCIBLE_POLYNOMIAL;
			}
		}

		// α^255 = 1, completing the cycle of the exponentiation table.
		this.expTable[255] = this.expTable[0];
		// Logarithm of 0 is undefined, represented here as -Infinity.
		this.logTable[0] = -Infinity;
	}

	// Addition and subtraction of polynomials in GF(2^8) are performed by simply adding their coefficients in GF(2),
	// which is equivalent to performing XOR (^) on them:
	// 0 + 0 mod 2 = 0, 0 ^ 0 = 0
	// 1 + 0 mod 2 = 1, 1 ^ 0 = 1
	// 1 + 1 mod 2 = 0, 1 ^ 1 = 0

	/**
	 * Adds two elements in GF(2^8).
	 */
	static add(a: number, b: number): number {
		return a ^ b; // Addition is equivalent to XOR in GF(2^8)
	}

	/**
	 * Subtracts two elements in GF(2^8).
	 */
	static subtract(a: number, b: number): number {
		return a ^ b; // Subtraction is equivalent to XOR in GF(2^8)
	}

	/**
	 * Multiplies two elements in GF(2^8).
	 *
	 * Step 1: Standard polynomial multiplication.
	 *
	 * Step 2: Reduce the result modulo the irreducible polynomial, to keep it within the field.
	 * That is, keep its degree lower than 8.
	 *
	 * This function performs these operations but in a more efficient way, using the logarithm and exponentiation tables.
	 */
	static multiply(a: number, b: number): number {
		// In any field, multiplication by 0 always results in 0.
		if (a === 0 || b === 0) return 0;
		// Excluding 0, we're working with all non-zero elements of GF(2^8). These form a cyclic group under multiplication of order 255.
		// The key is that, in GF(2^8), a x b = 2^log2(a x b) = 2^(log2(a) + log2(b))
		// Hence, we first get the logs of a and b (from our lookup tables, avoiding calculations)
		const logA = this.logTable[a];
		const logB = this.logTable[b];
		// Then we perform
		const logResult = (logA + logB) % 255; // mod 255 to stay in the group.
		// Finally, we exponentiate back the result, using the exponentiation table.
		return this.expTable[logResult];
	}

	/**
	 * Divides two elements in GF(2^8).
	 * @param a The numerator.
	 * @param b The denominator.
	 */
	static divide(a: number, b: number): number {
		if (a === 0) return 0;
		if (b === 0) throw new Error('Division by zero');
		// Same logic as multiplication: a / b = 2^log2(a / b) = 2^(log2(a) - log2(b))
		const logA = this.logTable[a];
		const logB = this.logTable[b];
		const logResult = (logA - logB + 255) % 255;
		return this.expTable[logResult];
	}

	/**
	 * Computes the power of an element in GF(2^8).
	 * @param x The base.
	 * @param power The exponent.
	 */
	static power(x: number, power: number): number {
		return this.expTable[(this.logTable[x] * power) % 255];
	}
}
