/**
 * All available QR Code versions (excluding micro QR).
 * Version 1 is for a 21x21 matrix. Each following version increases the matrix size by 4 modules in each dimension.
 */
export type Version =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31
	| 32
	| 33
	| 34
	| 35
	| 36
	| 37
	| 38
	| 39
	| 40;

/**
 * All possible Reed-Solomon error correction levels.
 * Each level allows the following percentage of data to be recovered:
 * - `L`: 7%
 * - `M`: 15%
 * - `Q`: 25%
 * - `H`: 30%
 */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * The concatenation of a QR version and an error correction level.
 */
export type QRCodeType = `${Version}${ErrorCorrectionLevel}`;
