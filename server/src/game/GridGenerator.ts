import { NumberRange } from '../types/index.js';

export const DEFAULT_MAX_NUMBER = 500;
export const MIN_NUMBER_COUNT = 5;

export class GridGenerator {
  /**
   * Validates number range bounds
   */
  public static validateRange(range: NumberRange, maxAllowed: number = DEFAULT_MAX_NUMBER): { valid: boolean; error?: string } {
    if (!Number.isInteger(range.min) || !Number.isInteger(range.max)) {
      return { valid: false, error: 'Range boundaries must be integers' };
    }
    if (range.min < 1) {
      return { valid: false, error: 'Minimum number must be at least 1' };
    }
    if (range.max <= range.min) {
      return { valid: false, error: 'Maximum number must be greater than minimum' };
    }
    const count = range.max - range.min + 1;
    if (count < MIN_NUMBER_COUNT) {
      return { valid: false, error: `Grid must contain at least ${MIN_NUMBER_COUNT} numbers` };
    }
    if (range.max > maxAllowed) {
      return { valid: false, error: `Maximum number exceeds allowed limit of ${maxAllowed}` };
    }
    return { valid: true };
  }

  /**
   * Generates sequential numbers array from min to max
   */
  public static generateSequence(min: number, max: number): number[] {
    const count = max - min + 1;
    const sequence = new Array<number>(count);
    for (let i = 0; i < count; i++) {
      sequence[i] = min + i;
    }
    return sequence;
  }

  /**
   * Performs an unbiased Fisher-Yates shuffle on the numbers array
   */
  public static shuffle(numbers: number[]): number[] {
    const result = [...numbers];
    for (let i = result.length - 1; i > 0; i--) {
      // Pick random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  /**
   * Generates and shuffles a complete grid for the given range
   */
  public static generateShuffledGrid(range: NumberRange, maxAllowed: number = DEFAULT_MAX_NUMBER): number[] {
    const validation = this.validateRange(range, maxAllowed);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid range');
    }
    const sequence = this.generateSequence(range.min, range.max);
    return this.shuffle(sequence);
  }

  /**
   * Integrity check: verifies every number from min to max exists exactly once
   */
  public static verifyGridIntegrity(grid: number[], range: NumberRange): boolean {
    const count = range.max - range.min + 1;
    if (grid.length !== count) return false;
    const seen = new Set<number>();
    for (const num of grid) {
      if (num < range.min || num > range.max || seen.has(num)) {
        return false;
      }
      seen.add(num);
    }
    return seen.size === count;
  }
}
