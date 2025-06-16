/**
 * Unit tests for tiny-idb-helper - Simplified Version
 * Comprehensive test suite covering all functionality
 */

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 Running tests for tiny-idb-helper...\n');
    
    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Test assertions
function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message = 'Values are not equal') {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message = 'Objects are not equal') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function assertRejects(promise, message = 'Promise should have rejected') {
  try {
    await promise;
    throw new Error(message);
  } catch (error) {
    // Expected to throw
    return error;
  }
}

// Import the library
const IDBH = require('../src/tiny-idb-helper.js');
const { ERROR_CODES } = require('../src/tiny-idb-helper.js');

// Mock IndexedDB for Node.js testing
global.window = {
  indexedDB: null // This will force fallback mode
};

const runner = new TestRunner();

// Test configuration
runner.test('configure() should set database name', async () => {
  IDBH.configure({ dbName: 'test-db' });
  
  await IDBH.setItem('test', 'value');
  const result = await IDBH.getItem('test');
  assertEqual(result, 'value');
  
  await IDBH.clear();
});

runner.test('configure() should validate parameters', async () => {
  const error = await assertRejects(
    Promise.resolve().then(() => IDBH.configure({ dbName: 123 })),
    'Should reject invalid dbName type'
  );
  assert(error.message.includes('Invalid configuration'));
});

// Test basic CRUD operations
runner.test('setItem() and getItem() should work with strings', async () => {
  await IDBH.setItem('string-key', 'hello world');
  const result = await IDBH.getItem('string-key');
  assertEqual(result, 'hello world');
  
  await IDBH.clear();
});

runner.test('setItem() and getItem() should work with numbers', async () => {
  await IDBH.setItem('number-key', 42);
  const result = await IDBH.getItem('number-key');
  assertEqual(result, 42);
  
  await IDBH.clear();
});

runner.test('setItem() and getItem() should work with objects', async () => {
  const obj = { name: 'John', age: 30, active: true };
  await IDBH.setItem('object-key', obj);
  const result = await IDBH.getItem('object-key');
  assertDeepEqual(result, obj);
  
  await IDBH.clear();
});

runner.test('setItem() and getItem() should work with arrays', async () => {
  const arr = [1, 'two', { three: 3 }, [4, 5]];
  await IDBH.setItem('array-key', arr);
  const result = await IDBH.getItem('array-key');
  assertDeepEqual(result, arr);
  
  await IDBH.clear();
});

runner.test('getItem() should return null for non-existent keys', async () => {
  const result = await IDBH.getItem('non-existent-key');
  assertEqual(result, null);
});

runner.test('setItem() should overwrite existing values', async () => {
  await IDBH.setItem('overwrite-key', 'first value');
  await IDBH.setItem('overwrite-key', 'second value');
  const result = await IDBH.getItem('overwrite-key');
  assertEqual(result, 'second value');
  
  await IDBH.clear();
});

// Test removeItem
runner.test('removeItem() should remove items', async () => {
  await IDBH.setItem('remove-key', 'value');
  assertEqual(await IDBH.getItem('remove-key'), 'value');
  
  await IDBH.removeItem('remove-key');
  assertEqual(await IDBH.getItem('remove-key'), null);
  
  await IDBH.clear();
});

// Test nullify
runner.test('nullify() should set value to null', async () => {
  await IDBH.setItem('nullify-key', 'value');
  await IDBH.nullify('nullify-key');
  const result = await IDBH.getItem('nullify-key');
  assertEqual(result, null);
  
  await IDBH.clear();
});

// Test increment/decrement
runner.test('increment() should increment numeric values', async () => {
  await IDBH.setItem('counter', 5);
  
  const result1 = await IDBH.increment('counter');
  assertEqual(result1, 6);
  assertEqual(await IDBH.getItem('counter'), 6);
  
  const result2 = await IDBH.increment('counter', 3);
  assertEqual(result2, 9);
  assertEqual(await IDBH.getItem('counter'), 9);
  
  await IDBH.clear();
});

runner.test('increment() should work with non-existent keys', async () => {
  const result = await IDBH.increment('new-counter');
  assertEqual(result, 1);
  assertEqual(await IDBH.getItem('new-counter'), 1);
  
  await IDBH.clear();
});

runner.test('decrement() should decrement numeric values', async () => {
  await IDBH.setItem('counter', 10);
  
  const result1 = await IDBH.decrement('counter');
  assertEqual(result1, 9);
  
  const result2 = await IDBH.decrement('counter', 4);
  assertEqual(result2, 5);
  
  await IDBH.clear();
});

// Test toggle
runner.test('toggle() should toggle boolean values', async () => {
  await IDBH.setItem('flag', true);
  
  const result1 = await IDBH.toggle('flag');
  assertEqual(result1, false);
  assertEqual(await IDBH.getItem('flag'), false);
  
  const result2 = await IDBH.toggle('flag');
  assertEqual(result2, true);
  
  await IDBH.clear();
});

runner.test('toggle() should work with non-existent keys', async () => {
  const result = await IDBH.toggle('new-flag');
  assertEqual(result, true);
  
  await IDBH.clear();
});

// Test array operations
runner.test('append() should add items to arrays', async () => {
  await IDBH.setItem('list', [1, 2]);
  
  const result1 = await IDBH.append('list', 3);
  assertDeepEqual(result1, [1, 2, 3]);
  assertDeepEqual(await IDBH.getItem('list'), [1, 2, 3]);
  
  const result2 = await IDBH.append('new-list', 'first');
  assertDeepEqual(result2, ['first']);
  
  await IDBH.clear();
});

runner.test('prepend() should add items to beginning of arrays', async () => {
  await IDBH.setItem('list', [2, 3]);
  
  const result1 = await IDBH.prepend('list', 1);
  assertDeepEqual(result1, [1, 2, 3]);
  assertDeepEqual(await IDBH.getItem('list'), [1, 2, 3]);
  
  const result2 = await IDBH.prepend('new-list', 'first');
  assertDeepEqual(result2, ['first']);
  
  await IDBH.clear();
});

// Test utility methods
runner.test('keys() should return all keys', async () => {
  await IDBH.setItem('key1', 'value1');
  await IDBH.setItem('key2', 'value2');
  await IDBH.setItem('key3', 'value3');
  
  const keys = await IDBH.keys();
  assert(keys.includes('key1'));
  assert(keys.includes('key2'));
  assert(keys.includes('key3'));
  assertEqual(keys.length, 3);
  
  await IDBH.clear();
});

runner.test('values() should return all values', async () => {
  await IDBH.setItem('key1', 'value1');
  await IDBH.setItem('key2', 42);
  await IDBH.setItem('key3', true);
  
  const values = await IDBH.values();
  assert(values.includes('value1'));
  assert(values.includes(42));
  assert(values.includes(true));
  assertEqual(values.length, 3);
  
  await IDBH.clear();
});

runner.test('entries() should return all key-value pairs', async () => {
  await IDBH.setItem('name', 'John');
  await IDBH.setItem('age', 30);
  
  const entries = await IDBH.entries();
  assertEqual(entries.name, 'John');
  assertEqual(entries.age, 30);
  assertEqual(Object.keys(entries).length, 2);
  
  await IDBH.clear();
});

runner.test('has() should check if key exists', async () => {
  await IDBH.setItem('exists', 'value');
  
  assert(await IDBH.has('exists'));
  assert(!(await IDBH.has('not-exists')));
  
  await IDBH.clear();
});

runner.test('length() should return number of items', async () => {
  assertEqual(await IDBH.length(), 0);
  
  await IDBH.setItem('key1', 'value1');
  assertEqual(await IDBH.length(), 1);
  
  await IDBH.setItem('key2', 'value2');
  assertEqual(await IDBH.length(), 2);
  
  await IDBH.removeItem('key1');
  assertEqual(await IDBH.length(), 1);
  
  await IDBH.clear();
});

runner.test('replaceAll() should replace all data', async () => {
  await IDBH.setItem('old1', 'value1');
  await IDBH.setItem('old2', 'value2');
  
  await IDBH.replaceAll({
    new1: 'newvalue1',
    new2: 42,
    new3: true
  });
  
  assertEqual(await IDBH.getItem('old1'), null);
  assertEqual(await IDBH.getItem('old2'), null);
  assertEqual(await IDBH.getItem('new1'), 'newvalue1');
  assertEqual(await IDBH.getItem('new2'), 42);
  assertEqual(await IDBH.getItem('new3'), true);
  assertEqual(await IDBH.length(), 3);
  
  await IDBH.clear();
});

// Test parameter validation
runner.test('should validate key parameter types', async () => {
  const error1 = await assertRejects(
    IDBH.getItem(123),
    'Should reject non-string key in getItem'
  );
  assert(error1.message.includes('Key must be a string'));

  const error2 = await assertRejects(
    IDBH.setItem(123, 'value'),
    'Should reject non-string key in setItem'
  );
  assert(error2.message.includes('Key must be a string'));
});

// Test fallback mode detection
runner.test('should detect memory fallback mode', async () => {
  // Since we mocked IndexedDB as null, it should use memory fallback
  assert(IDBH.isUsingMemoryFallback(), 'Should be using memory fallback');
});

// Test clear functionality
runner.test('clear() should remove all data', async () => {
  await IDBH.setItem('key1', 'value1');
  await IDBH.setItem('key2', 'value2');
  
  assertEqual(await IDBH.length(), 2);
  
  await IDBH.clear();
  
  assertEqual(await IDBH.length(), 0);
  assertEqual(await IDBH.getItem('key1'), null);
  assertEqual(await IDBH.getItem('key2'), null);
});

// Test edge cases
runner.test('should handle null and undefined values', async () => {
  await IDBH.setItem('null-key', null);
  await IDBH.setItem('undefined-key', undefined);
  
  assertEqual(await IDBH.getItem('null-key'), null);
  assertEqual(await IDBH.getItem('undefined-key'), undefined);
  
  await IDBH.clear();
});

runner.test('should handle empty strings and objects', async () => {
  await IDBH.setItem('empty-string', '');
  await IDBH.setItem('empty-object', {});
  await IDBH.setItem('empty-array', []);
  
  assertEqual(await IDBH.getItem('empty-string'), '');
  assertDeepEqual(await IDBH.getItem('empty-object'), {});
  assertDeepEqual(await IDBH.getItem('empty-array'), []);
  
  await IDBH.clear();
});

// Test error handling for invalid JSON
runner.test('should handle circular references gracefully', async () => {
  const circularObj = { name: 'test' };
  circularObj.self = circularObj; // Create circular reference
  
  const error = await assertRejects(
    IDBH.setItem('circular', circularObj),
    'Should reject circular references'
  );
  assert(error.message.includes('JSON'));
});

// Test reconfiguration
runner.test('should handle reconfiguration', async () => {
  // Set initial data
  IDBH.configure({ dbName: 'db1' });
  await IDBH.setItem('key1', 'value1');
  
  // Reconfigure with different database
  IDBH.configure({ dbName: 'db2' });
  await IDBH.setItem('key2', 'value2');
  
  // Should not see key1 in new database
  assertEqual(await IDBH.getItem('key1'), null);
  assertEqual(await IDBH.getItem('key2'), 'value2');
  
  await IDBH.clear();
});

// Run all tests
runner.run().catch(console.error); 