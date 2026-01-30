/**
 * Utility for parsing transport time strings into seconds.
 *
 * This provides a robust, pure implementation of time parsing that doesn't
 * depend on the global Tone context state, making it suitable for
 * debugging, offline analysis, and testing.
 */

/**
 * Parse a time value into seconds.
 *
 * Supports:
 * - Numbers (treated as seconds)
 * - "bars:quarters:sixteenths" format (e.g. "1:2:0")
 *
 * @param time - Time to parse
 * @param bpm - Beats (quarter notes) per minute
 * @param timeSignature - Time signature (numerator or [numerator, denominator])
 * @returns Seconds or null if format not supported
 */
export function parseTransportTime(
  time: string | number,
  bpm: number,
  timeSignature: number | number[]
): number | null {
  // Handle numeric input (already seconds)
  if (typeof time === 'number') {
    return time;
  }

  if (typeof time !== 'string') {
    return null;
  }

  // Handle "bars:quarters:sixteenths" format
  if (time.includes(':')) {
    const parts = time.split(':').map(p => parseFloat(p));

    // Valid format is "B:Q:S" or "B:Q"
    if (parts.some(isNaN)) {
      return null;
    }

    const bars = parts[0] || 0;
    const quarters = parts[1] || 0;
    const sixteenths = parts[2] || 0;

    // Calculate quarters per bar based on time signature
    let quartersPerBar = 4; // Default to 4/4

    if (typeof timeSignature === 'number') {
      // If just a number, it's the numerator over 4
      quartersPerBar = timeSignature;
    } else if (Array.isArray(timeSignature) && timeSignature.length >= 2) {
      const [numerator, denominator] = timeSignature;
      // Formula: numerator * (4 / denominator)
      // e.g. 6/8 -> 6 * (4/8) = 3 quarters
      quartersPerBar = numerator * (4 / denominator);
    }

    // Calculate total quarters
    const totalQuarters = (bars * quartersPerBar) + quarters + (sixteenths / 4);

    // Calculate seconds: quarters * (60 / BPM)
    // BPM is defined as quarter notes per minute in Tone.js
    if (bpm <= 0) return 0; // Avoid division by zero issues
    return totalQuarters * (60 / bpm);
  }

  // Other formats (notation like "4n", "8t", expressions) are not supported
  // by this parser and should fallback to Tone.Time
  return null;
}
