/**
 * Encodes or decodes a text using the Caesar cipher.
 * Supports standard English alphabet (A-Z, a-z) preserving case.
 * Non-alphabetic characters remain untouched.
 *
 * @param text The input string to shift.
 * @param shift Integer shift value (positive shifts right, negative shifts left).
 * @returns The transformed string.
 */
export function caesarCipher(text: string, shift: number): string {
  const len = 26;
  const normalizedShift = ((shift % len) + len) % len;

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // Uppercase A-Z (65-90)
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(65 + ((code - 65 + normalizedShift) % len));
      }
      // Lowercase a-z (97-122)
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(97 + ((code - 97 + normalizedShift) % len));
      }
      return char;
    })
    .join('');
}
