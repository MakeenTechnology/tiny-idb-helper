/**
 * Tiny IndexedDB Helper - Simplified Version
 * Zero dependencies, Promise-based API with automatic fallback
 */

// Error codes for different failure types
const ERROR_CODES = {
  OPEN_FAILURE: 'OPEN_FAILURE',
  TRANSACTION_FAILURE: 'TRANSACTION_FAILURE',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  NOT_SUPPORTED: 'NOT_SUPPORTED'
};

class TinyIDBHelper {
  constructor() {
    this.config = {
      dbName: 'app-db'
    };
    this.db = null;
    this.useMemoryFallback = false;
    this.memoryStore = new Map();
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Configure the database name
   * @param {Object} options - Configuration options
   * @param {string} options.dbName - Database name (default: 'app-db')
   */
  configure({ dbName = 'app-db' } = {}) {
    if (typeof dbName !== 'string') {
      throw new Error('Invalid configuration: dbName must be string');
    }
    
    // Reset state when reconfiguring
    if (this.db) {
      this.db.close();
    }
    
    this.config = { dbName };
    this.isInitialized = false;
    this.initPromise = null;
    this.db = null;
    this.useMemoryFallback = false;
    this.memoryStore.clear();
  }

  /**
   * Initialize the database connection
   * @returns {Promise<void>}
   */
  async _initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    // Check if IndexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.useMemoryFallback = true;
      this.isInitialized = true;
      return;
    }

    try {
      this.db = await this._openDatabase();
      this.isInitialized = true;
    } catch (error) {
      console.warn('IndexedDB failed, falling back to memory storage:', error);
      this.useMemoryFallback = true;
      this.isInitialized = true;
    }
  }

  /**
   * Open IndexedDB database
   * @returns {Promise<IDBDatabase>}
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, 1);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.OPEN_FAILURE;
        reject(error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Create single object store for all data
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage');
        }
      };
    });
  }

  /**
   * Get item from storage
   * @param {string} key - The key to retrieve
   * @returns {Promise<any|null>} The stored value or null if not found
   */
  async getItem(key) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    await this._initialize();

    if (this.useMemoryFallback) {
      return this.memoryStore.has(key) ? this.memoryStore.get(key) : null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result !== undefined) {
          try {
            // Handle special undefined marker
            if (result === '__TINY_IDB_UNDEFINED__') {
              resolve(undefined);
            } else {
              resolve(JSON.parse(result));
            }
          } catch (parseError) {
            const error = new Error(`JSON parse error: ${parseError.message}`);
            error.code = ERROR_CODES.JSON_PARSE_ERROR;
            reject(error);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        const error = new Error(`Get request failed: ${request.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }

  /**
   * Set item in storage
   * @param {string} key - The key to store under
   * @param {any} value - The value to store
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    await this._initialize();

    if (this.useMemoryFallback) {
      // Test JSON serialization to catch circular references
      try {
        if (value !== undefined) {
          JSON.stringify(value);
        }
      } catch (stringifyError) {
        const error = new Error(`JSON stringify error: ${stringifyError.message}`);
        error.code = ERROR_CODES.JSON_PARSE_ERROR;
        throw error;
      }
      
      this.memoryStore.set(key, value);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      
      let serializedValue;
      try {
        // Handle undefined specifically
        if (value === undefined) {
          serializedValue = '__TINY_IDB_UNDEFINED__';
        } else {
          serializedValue = JSON.stringify(value);
        }
      } catch (stringifyError) {
        const error = new Error(`JSON stringify error: ${stringifyError.message}`);
        error.code = ERROR_CODES.JSON_PARSE_ERROR;
        reject(error);
        return;
      }

      const request = store.put(serializedValue, key);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }

  /**
   * Remove item from storage
   * @param {string} key - The key to remove
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    await this._initialize();

    if (this.useMemoryFallback) {
      this.memoryStore.delete(key);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.delete(key);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }

  /**
   * Set value to null
   * @param {string} key - The key to nullify
   * @returns {Promise<void>}
   */
  async nullify(key) {
    return this.setItem(key, null);
  }

  /**
   * Increment a numeric value
   * @param {string} key - The key to increment
   * @param {number} amount - Amount to increment by (default: 1)
   * @returns {Promise<number>} The new value
   */
  async increment(key, amount = 1) {
    if (typeof amount !== 'number') {
      throw new Error('Increment amount must be a number');
    }

    const currentValue = await this.getItem(key);
    const numValue = typeof currentValue === 'number' ? currentValue : 0;
    const newValue = numValue + amount;
    
    await this.setItem(key, newValue);
    return newValue;
  }

  /**
   * Decrement a numeric value
   * @param {string} key - The key to decrement
   * @param {number} amount - Amount to decrement by (default: 1)
   * @returns {Promise<number>} The new value
   */
  async decrement(key, amount = 1) {
    return this.increment(key, -amount);
  }

  /**
   * Toggle a boolean value
   * @param {string} key - The key to toggle
   * @returns {Promise<boolean>} The new value
   */
  async toggle(key) {
    const currentValue = await this.getItem(key);
    const newValue = !currentValue;
    await this.setItem(key, newValue);
    return newValue;
  }

  /**
   * Append to an array
   * @param {string} key - The key containing the array
   * @param {any} value - Value to append
   * @returns {Promise<any[]>} The new array
   */
  async append(key, value) {
    const currentValue = await this.getItem(key);
    const array = Array.isArray(currentValue) ? currentValue : [];
    array.push(value);
    await this.setItem(key, array);
    return array;
  }

  /**
   * Prepend to an array
   * @param {string} key - The key containing the array
   * @param {any} value - Value to prepend
   * @returns {Promise<any[]>} The new array
   */
  async prepend(key, value) {
    const currentValue = await this.getItem(key);
    const array = Array.isArray(currentValue) ? currentValue : [];
    array.unshift(value);
    await this.setItem(key, array);
    return array;
  }

  /**
   * Get all keys
   * @returns {Promise<string[]>} Array of all keys
   */
  async keys() {
    await this._initialize();

    if (this.useMemoryFallback) {
      return Array.from(this.memoryStore.keys());
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        const error = new Error(`Keys request failed: ${request.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }

  /**
   * Get all values
   * @returns {Promise<any[]>} Array of all values
   */
  async values() {
    await this._initialize();

    if (this.useMemoryFallback) {
      return Array.from(this.memoryStore.values());
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result.map(value => {
          try {
            if (value === '__TINY_IDB_UNDEFINED__') {
              return undefined;
            } else {
              return JSON.parse(value);
            }
          } catch {
            return value;
          }
        });
        resolve(results);
      };

      request.onerror = () => {
        const error = new Error(`Values request failed: ${request.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }

  /**
   * Get all key-value pairs
   * @returns {Promise<Object>} Object with all key-value pairs
   */
  async entries() {
    const keys = await this.keys();
    const result = {};
    
    for (const key of keys) {
      result[key] = await this.getItem(key);
    }
    
    return result;
  }

  /**
   * Replace all data with new data
   * @param {Object} data - Object containing key-value pairs to replace all data
   * @returns {Promise<void>}
   */
  async replaceAll(data) {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data must be an object');
    }

    // Clear all existing data
    await this.clear();

    // Set new data
    for (const [key, value] of Object.entries(data)) {
      await this.setItem(key, value);
    }
  }

  /**
   * Get the number of items in storage
   * @returns {Promise<number>} Number of items
   */
  async length() {
    await this._initialize();

    if (this.useMemoryFallback) {
      return this.memoryStore.size;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        const error = new Error(`Count request failed: ${request.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }

  /**
   * Check if a key exists
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} True if key exists
   */
  async has(key) {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Check if currently using memory fallback
   * @returns {boolean}
   */
  isUsingMemoryFallback() {
    return this.useMemoryFallback;
  }

  /**
   * Clear all data
   * @returns {Promise<void>}
   */
  async clear() {
    await this._initialize();

    if (this.useMemoryFallback) {
      this.memoryStore.clear();
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.clear();

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        const error = new Error(`Clear failed: ${transaction.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.TRANSACTION_FAILURE;
        reject(error);
      };
    });
  }
}

// Create singleton instance
const IDBH = new TinyIDBHelper();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = IDBH;
  module.exports.ERROR_CODES = ERROR_CODES;
} else if (typeof define === 'function' && define.amd) {
  // AMD
  define(() => IDBH);
} else if (typeof window !== 'undefined') {
  // Browser global
  window.IDBH = IDBH;
  window.IDBH.ERROR_CODES = ERROR_CODES;
} 