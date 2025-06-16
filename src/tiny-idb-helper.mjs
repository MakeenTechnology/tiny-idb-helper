/**
 * Tiny IndexedDB Helper - ES Module Version
 * Zero dependencies, Promise-based API with automatic fallback
 */

// Error codes for different failure types
export const ERROR_CODES = {
  OPEN_FAILURE: 'OPEN_FAILURE',
  TRANSACTION_FAILURE: 'TRANSACTION_FAILURE',
  UPGRADE_FAILURE: 'UPGRADE_FAILURE',
  JSON_PARSE_ERROR: 'JSON_PARSE_ERROR',
  NOT_SUPPORTED: 'NOT_SUPPORTED'
};

class TinyIDBHelper {
  constructor() {
    this.config = {
      dbName: 'app-db',
      version: 1
    };
    this.upgradeCallback = null;
    this.db = null;
    this.useMemoryFallback = false;
    this.memoryStore = new Map();
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Configure the database name and version
   * @param {Object} options - Configuration options
   * @param {string} options.dbName - Database name (default: 'app-db')
   * @param {number} options.version - Database version (default: 1)
   */
  configure({ dbName = 'app-db', version = 1 } = {}) {
    if (typeof dbName !== 'string' || typeof version !== 'number' || version < 1) {
      throw new Error('Invalid configuration: dbName must be string, version must be positive number');
    }
    
    // Reset state when reconfiguring
    if (this.db) {
      this.db.close();
    }
    
    this.config = { dbName, version };
    this.isInitialized = false;
    this.initPromise = null;
    this.db = null;
    this.useMemoryFallback = false;
    this.memoryStore.clear(); // Clear existing memory data when reconfiguring
  }

  /**
   * Register upgrade callback for schema migrations
   * @param {Function} callback - Callback function (oldVersion, newVersion, db) => void
   */
  onUpgrade(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Upgrade callback must be a function');
    }
    this.upgradeCallback = callback;
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
      console.warn('IndexedDB not available, using memory fallback');
      this.useMemoryFallback = true;
      this.isInitialized = true;
      return;
    }

    try {
      this.db = await this._openDatabase();
      this.isInitialized = true;
      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.warn('IndexedDB failed, falling back to memory storage:', error);
      this.useMemoryFallback = true;
      this.isInitialized = true;
    }
  }

  /**
   * Open IndexedDB database with upgrade handling
   * @returns {Promise<IDBDatabase>}
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.OPEN_FAILURE;
        reject(error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;
          const oldVersion = event.oldVersion;
          const newVersion = event.newVersion;

          if (this.upgradeCallback) {
            this.upgradeCallback(oldVersion, newVersion, db);
          }
        } catch (error) {
          const upgradeError = new Error(`Upgrade failed: ${error.message}`);
          upgradeError.code = ERROR_CODES.UPGRADE_FAILURE;
          reject(upgradeError);
        }
      };
    });
  }

  /**
   * Ensure object store exists for the given key
   * @param {string} key - The key/store name
   * @returns {Promise<void>}
   */
  async _ensureObjectStore(key) {
    if (this.useMemoryFallback) return;

    // If store doesn't exist, we need to increment version and recreate database
    if (!this.db.objectStoreNames.contains(key)) {
      this.db.close();
      this.config.version += 1;
      
      // Set a temporary upgrade callback to create the new store
      const originalCallback = this.upgradeCallback;
      this.upgradeCallback = (oldVersion, newVersion, db) => {
        if (originalCallback) {
          originalCallback(oldVersion, newVersion, db);
        }
        if (!db.objectStoreNames.contains(key)) {
          db.createObjectStore(key);
        }
      };

      this.db = await this._openDatabase();
      this.upgradeCallback = originalCallback;
    }
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
      // Check if key exists in map to distinguish between undefined value and missing key
      if (this.memoryStore.has(key)) {
        return this.memoryStore.get(key); // This could be undefined
      } else {
        return null; // Key doesn't exist
      }
    }

    try {
      await this._ensureObjectStore(key);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([key], 'readonly');
        const store = transaction.objectStore(key);
        const request = store.get('value');

        transaction.onerror = () => {
          const error = new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`);
          error.code = ERROR_CODES.TRANSACTION_FAILURE;
          reject(error);
        };

        request.onsuccess = () => {
          const result = request.result;
          if (result && result.data !== undefined) {
            try {
              // Handle our special undefined marker
              if (result.data === '__TINY_IDB_UNDEFINED__') {
                resolve(undefined);
              } else {
                resolve(JSON.parse(result.data));
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
    } catch (error) {
      throw error;
    }
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
      // Even in memory mode, test JSON serialization to catch circular references
      try {
        if (value !== undefined) {
          JSON.stringify(value);
        }
      } catch (stringifyError) {
        const error = new Error(`JSON stringify error: ${stringifyError.message}`);
        error.code = ERROR_CODES.JSON_PARSE_ERROR;
        throw error;
      }
      
      // Store the actual value including undefined
      this.memoryStore.set(key, value);
      return;
    }

    try {
      await this._ensureObjectStore(key);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([key], 'readwrite');
        const store = transaction.objectStore(key);
        
        let serializedValue;
        try {
          // Handle undefined specifically since JSON.stringify(undefined) returns undefined
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

        const request = store.put({ data: serializedValue }, 'value');

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          const error = new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`);
          error.code = ERROR_CODES.TRANSACTION_FAILURE;
          reject(error);
        };

        request.onerror = () => {
          const error = new Error(`Put request failed: ${request.error?.message || 'Unknown error'}`);
          error.code = ERROR_CODES.TRANSACTION_FAILURE;
          reject(error);
        };
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if currently using memory fallback
   * @returns {boolean}
   */
  isUsingMemoryFallback() {
    return this.useMemoryFallback;
  }

  /**
   * Clear all data (useful for testing)
   * @returns {Promise<void>}
   */
  async clear() {
    await this._initialize();

    if (this.useMemoryFallback) {
      this.memoryStore.clear();
      return;
    }

    if (this.db) {
      this.db.close();
    }

    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.config.dbName);
      
      deleteRequest.onsuccess = () => {
        this.db = null;
        this.isInitialized = false;
        this.initPromise = null;
        resolve();
      };

      deleteRequest.onerror = () => {
        const error = new Error(`Failed to delete database: ${deleteRequest.error?.message || 'Unknown error'}`);
        error.code = ERROR_CODES.OPEN_FAILURE;
        reject(error);
      };
    });
  }
}

// Create singleton instance
const IDBH = new TinyIDBHelper();

// ES module export
export default IDBH; 