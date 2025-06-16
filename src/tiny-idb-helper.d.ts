/**
 * Type definitions for tiny-idb-helper - Simplified Version
 * Zero-dependency IndexedDB helper library
 */

export interface IDBHConfig {
  dbName?: string;
}

export interface IDBHError extends Error {
  code: string;
}

export interface TinyIDBHelper {
  /**
   * Configure the database name
   * @param config Configuration options
   */
  configure(config?: IDBHConfig): void;

  /**
   * Get item from storage
   * @param key The key to retrieve
   * @returns Promise resolving to the stored value or null if not found
   */
  getItem<T = any>(key: string): Promise<T | null>;

  /**
   * Set item in storage
   * @param key The key to store under
   * @param value The value to store (will be JSON serialized)
   * @returns Promise resolving when the operation completes
   */
  setItem(key: string, value: any): Promise<void>;

  /**
   * Remove item from storage
   * @param key The key to remove
   * @returns Promise resolving when the operation completes
   */
  removeItem(key: string): Promise<void>;

  /**
   * Set value to null
   * @param key The key to nullify
   * @returns Promise resolving when the operation completes
   */
  nullify(key: string): Promise<void>;

  /**
   * Increment a numeric value
   * @param key The key to increment
   * @param amount Amount to increment by (default: 1)
   * @returns Promise resolving to the new value
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Decrement a numeric value
   * @param key The key to decrement
   * @param amount Amount to decrement by (default: 1)
   * @returns Promise resolving to the new value
   */
  decrement(key: string, amount?: number): Promise<number>;

  /**
   * Toggle a boolean value
   * @param key The key to toggle
   * @returns Promise resolving to the new value
   */
  toggle(key: string): Promise<boolean>;

  /**
   * Append to an array
   * @param key The key containing the array
   * @param value Value to append
   * @returns Promise resolving to the new array
   */
  append(key: string, value: any): Promise<any[]>;

  /**
   * Prepend to an array
   * @param key The key containing the array
   * @param value Value to prepend
   * @returns Promise resolving to the new array
   */
  prepend(key: string, value: any): Promise<any[]>;

  /**
   * Get all keys
   * @returns Promise resolving to array of all keys
   */
  keys(): Promise<string[]>;

  /**
   * Get all values
   * @returns Promise resolving to array of all values
   */
  values(): Promise<any[]>;

  /**
   * Get all key-value pairs
   * @returns Promise resolving to object with all key-value pairs
   */
  entries(): Promise<Record<string, any>>;

  /**
   * Replace all data with new data
   * @param data Object containing key-value pairs to replace all data
   * @returns Promise resolving when the operation completes
   */
  replaceAll(data: Record<string, any>): Promise<void>;

  /**
   * Get the number of items in storage
   * @returns Promise resolving to number of items
   */
  length(): Promise<number>;

  /**
   * Check if a key exists
   * @param key The key to check
   * @returns Promise resolving to true if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Check if currently using memory fallback instead of IndexedDB
   * @returns Whether memory fallback is active
   */
  isUsingMemoryFallback(): boolean;

  /**
   * Clear all data from storage
   * @returns Promise resolving when the operation completes
   */
  clear(): Promise<void>;
}

export const ERROR_CODES: {
  readonly OPEN_FAILURE: 'OPEN_FAILURE';
  readonly TRANSACTION_FAILURE: 'TRANSACTION_FAILURE';
  readonly JSON_PARSE_ERROR: 'JSON_PARSE_ERROR';
  readonly NOT_SUPPORTED: 'NOT_SUPPORTED';
};

declare const IDBH: TinyIDBHelper;

export default IDBH;
export { IDBH }; 