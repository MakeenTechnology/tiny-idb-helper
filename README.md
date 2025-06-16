# tiny-idb-helper

A zero-dependency JavaScript library that makes IndexedDB as easy to use as `localStorage`. Provides a Promise-based API with automatic fallback to in-memory storage when IndexedDB is unavailable.

## Features

- 🚀 **Simple API** - Just like localStorage but with Promises
- 🔄 **Automatic fallback** - Falls back to memory storage when IndexedDB fails
- 📦 **Zero dependencies** - No external dependencies
- 🔒 **Type safe** - Full TypeScript support with declaration files
- 🎯 **Tiny size** - Under 5KB minified
- 📊 **JSON serialization** - Automatic serialization/deserialization
- ⚡ **Promise-based** - Modern async/await support
- 🧮 **Rich operations** - Increment, decrement, toggle, append, prepend and more
- 🗂️ **Data management** - Easy bulk operations and data replacement

## Installation

```bash
npm install tiny-idb-helper
```

Or include directly in your HTML:

```html
<script src="path/to/tiny-idb-helper.js"></script>
```

## Quick Start

```javascript
import IDBH from 'tiny-idb-helper';

// Configure the database (optional - has sensible defaults)
IDBH.configure({
  dbName: 'my-app-db'
});

// Store and retrieve data just like localStorage
await IDBH.setItem('user', { name: 'John', age: 30 });
const user = await IDBH.getItem('user');
console.log(user); // { name: 'John', age: 30 }

// Use rich operations
await IDBH.increment('counter', 5);     // Add 5 to counter
await IDBH.toggle('darkMode');          // Toggle boolean
await IDBH.append('todos', 'New task'); // Add to array
```

## API Reference

### Configuration

#### `IDBH.configure(options)`

Configure the database name.

```javascript
IDBH.configure({
  dbName: 'my-app-db'  // default: 'app-db'
});
```

**Parameters:**
- `options.dbName` (string, optional) - Database name

### Basic Operations

#### `IDBH.setItem(key, value)`

Store a value in the database.

```javascript
await IDBH.setItem('key', 'value');
await IDBH.setItem('user', { name: 'John', age: 30 });
await IDBH.setItem('numbers', [1, 2, 3, 4, 5]);
```

**Parameters:**
- `key` (string) - Storage key
- `value` (any) - Value to store (will be JSON serialized)

**Returns:** `Promise<void>`

#### `IDBH.getItem(key)`

Retrieve a value from the database.

```javascript
const value = await IDBH.getItem('key');
const user = await IDBH.getItem('user');
const missing = await IDBH.getItem('nonexistent'); // returns null
```

**Parameters:**
- `key` (string) - Storage key

**Returns:** `Promise<any | null>` - The stored value or null if not found

#### `IDBH.removeItem(key)`

Remove a value from the database.

```javascript
await IDBH.removeItem('key');
```

**Parameters:**
- `key` (string) - Storage key

**Returns:** `Promise<void>`

#### `IDBH.nullify(key)`

Set a value to null (different from removing it).

```javascript
await IDBH.nullify('key');
const value = await IDBH.getItem('key'); // returns null
```

**Parameters:**
- `key` (string) - Storage key

**Returns:** `Promise<void>`

### Numeric Operations

#### `IDBH.increment(key, amount?)`

Increment a numeric value.

```javascript
await IDBH.increment('counter');        // +1 (default)
await IDBH.increment('score', 10);      // +10
await IDBH.increment('new_counter');    // starts at 0, becomes 1
```

**Parameters:**
- `key` (string) - Storage key
- `amount` (number, optional) - Amount to increment by (default: 1)

**Returns:** `Promise<number>` - The new value

#### `IDBH.decrement(key, amount?)`

Decrement a numeric value.

```javascript
await IDBH.decrement('counter');        // -1 (default)
await IDBH.decrement('lives', 1);       // -1
```

**Parameters:**
- `key` (string) - Storage key
- `amount` (number, optional) - Amount to decrement by (default: 1)

**Returns:** `Promise<number>` - The new value

### Boolean Operations

#### `IDBH.toggle(key)`

Toggle a boolean value.

```javascript
await IDBH.toggle('darkMode');         // false -> true
await IDBH.toggle('darkMode');         // true -> false
await IDBH.toggle('newFlag');          // undefined -> true
```

**Parameters:**
- `key` (string) - Storage key

**Returns:** `Promise<boolean>` - The new value

### Array Operations

#### `IDBH.append(key, value)`

Append a value to an array.

```javascript
await IDBH.append('todos', 'New task');
await IDBH.append('numbers', 42);
await IDBH.append('new_list', 'first'); // creates new array
```

**Parameters:**
- `key` (string) - Storage key
- `value` (any) - Value to append

**Returns:** `Promise<any[]>` - The new array

#### `IDBH.prepend(key, value)`

Prepend a value to an array.

```javascript
await IDBH.prepend('todos', 'Urgent task');
await IDBH.prepend('numbers', 0);
```

**Parameters:**
- `key` (string) - Storage key
- `value` (any) - Value to prepend

**Returns:** `Promise<any[]>` - The new array

### Data Management

#### `IDBH.keys()`

Get all keys in storage.

```javascript
const keys = await IDBH.keys();
console.log(keys); // ['user', 'settings', 'counter']
```

**Returns:** `Promise<string[]>` - Array of all keys

#### `IDBH.values()`

Get all values in storage.

```javascript
const values = await IDBH.values();
console.log(values); // [userObj, settingsObj, 42]
```

**Returns:** `Promise<any[]>` - Array of all values

#### `IDBH.entries()`

Get all key-value pairs as an object.

```javascript
const data = await IDBH.entries();
console.log(data); // { user: userObj, settings: settingsObj, counter: 42 }
```

**Returns:** `Promise<Object>` - Object with all key-value pairs

#### `IDBH.length()`

Get the number of items in storage.

```javascript
const count = await IDBH.length();
console.log(`Storage has ${count} items`);
```

**Returns:** `Promise<number>` - Number of items

#### `IDBH.has(key)`

Check if a key exists in storage.

```javascript
const exists = await IDBH.has('user');
if (exists) {
  console.log('User data found');
}
```

**Parameters:**
- `key` (string) - Storage key

**Returns:** `Promise<boolean>` - True if key exists

#### `IDBH.replaceAll(data)`

Replace all data in storage with new data.

```javascript
await IDBH.replaceAll({
  user: { name: 'Alice', age: 25 },
  settings: { theme: 'dark' },
  counter: 0
});
```

**Parameters:**
- `data` (Object) - Object containing key-value pairs to replace all data

**Returns:** `Promise<void>`

### Utility Methods

#### `IDBH.clear()`

Clear all data from storage.

```javascript
await IDBH.clear();
```

**Returns:** `Promise<void>`

#### `IDBH.isUsingMemoryFallback()`

Check if currently using memory fallback instead of IndexedDB.

```javascript
if (IDBH.isUsingMemoryFallback()) {
  console.log('Using memory storage - data will be lost on reload');
}
```

**Returns:** `boolean`

## Usage Examples

### Basic Storage Operations

```javascript
import IDBH from 'tiny-idb-helper';

// Store different types of data
await IDBH.setItem('string', 'Hello World');
await IDBH.setItem('number', 42);
await IDBH.setItem('boolean', true);
await IDBH.setItem('object', { 
  name: 'John',
  preferences: { theme: 'dark', lang: 'en' }
});
await IDBH.setItem('array', [1, 2, 3]);

// Retrieve data
const string = await IDBH.getItem('string'); // 'Hello World'
const object = await IDBH.getItem('object'); // { name: 'John', ... }
const missing = await IDBH.getItem('missing'); // null

// Remove data
await IDBH.removeItem('string');
await IDBH.nullify('number'); // sets to null instead of removing
```

### Numeric Operations

```javascript
// Counter example
await IDBH.setItem('score', 100);
await IDBH.increment('score', 50);    // score = 150
await IDBH.decrement('score', 25);    // score = 125

// Page views counter
await IDBH.increment('pageViews');    // starts at 0 if not exists
await IDBH.increment('pageViews');    // now 2
```

### Boolean Toggles

```javascript
// Settings toggles
await IDBH.setItem('darkMode', false);
await IDBH.toggle('darkMode');        // true
await IDBH.toggle('darkMode');        // false

await IDBH.toggle('notifications');  // true (starts undefined -> true)
```

### Array Management

```javascript
// Todo list
await IDBH.setItem('todos', ['Learn JS']);
await IDBH.append('todos', 'Build app');      // ['Learn JS', 'Build app']
await IDBH.prepend('todos', 'Setup project'); // ['Setup project', 'Learn JS', 'Build app']

// Shopping cart
await IDBH.append('cart', { id: 1, name: 'Book', price: 20 });
await IDBH.append('cart', { id: 2, name: 'Pen', price: 5 });
```

### Data Management

```javascript
// Get overview of all data
const keys = await IDBH.keys();       // ['user', 'settings', 'todos']
const count = await IDBH.length();    // 3
const allData = await IDBH.entries(); // { user: {...}, settings: {...}, todos: [...] }

// Check existence
if (await IDBH.has('user')) {
  const user = await IDBH.getItem('user');
}

// Replace everything
await IDBH.replaceAll({
  user: { name: 'New User' },
  version: '2.0'
});
```

### Error Handling

```javascript
import IDBH, { ERROR_CODES } from 'tiny-idb-helper';

try {
  await IDBH.setItem('key', value);
} catch (error) {
  switch (error.code) {
    case ERROR_CODES.OPEN_FAILURE:
      console.log('Failed to open database');
      break;
    case ERROR_CODES.TRANSACTION_FAILURE:
      console.log('Transaction failed');
      break;
    case ERROR_CODES.JSON_PARSE_ERROR:
      console.log('Invalid JSON data');
      break;
    default:
      console.log('Unknown error:', error.message);
  }
}
```

### Fallback Detection

```javascript
import IDBH from 'tiny-idb-helper';

await IDBH.setItem('test', 'value');

if (IDBH.isUsingMemoryFallback()) {
  // Show warning to user
  showWarning('Your data will be lost when you close this tab');
} else {
  // IndexedDB is working normally
  console.log('Data will persist between sessions');
}
```

### Multiple Database Configuration

```javascript
import IDBH from 'tiny-idb-helper';

// Configure for user data
IDBH.configure({ dbName: 'user-data' });
await IDBH.setItem('profile', userProfile);

// Reconfigure for app settings
IDBH.configure({ dbName: 'app-settings' });
await IDBH.setItem('theme', 'dark');
```

## TypeScript Support

The library includes full TypeScript declarations:

```typescript
import IDBH, { IDBHConfig } from 'tiny-idb-helper';

interface User {
  name: string;
  age: number;
}

// Type-safe operations
await IDBH.setItem('user', { name: 'John', age: 30 });
const user = await IDBH.getItem<User>('user');

// Typed configuration
const config: IDBHConfig = {
  dbName: 'my-app'
};
IDBH.configure(config);

// Rich operations with types
const newScore: number = await IDBH.increment('score', 10);
const isEnabled: boolean = await IDBH.toggle('feature');
const items: string[] = await IDBH.append('list', 'new item');
```

## Error Codes

The library provides specific error codes for different failure scenarios:

```javascript
import { ERROR_CODES } from 'tiny-idb-helper';

ERROR_CODES.OPEN_FAILURE        // Database failed to open
ERROR_CODES.TRANSACTION_FAILURE // Transaction failed
ERROR_CODES.JSON_PARSE_ERROR    // JSON serialization failed
ERROR_CODES.NOT_SUPPORTED       // IndexedDB not supported
```

## Browser Support

- **IndexedDB Mode**: Modern browsers (Chrome 24+, Firefox 16+, Safari 7+, Edge 12+)
- **Fallback Mode**: Any JavaScript environment (IE9+, Node.js)

The library automatically detects IndexedDB availability and falls back to in-memory storage when needed.

## How It Works

1. **Automatic Database Setup**: On first use, creates IndexedDB database with configured name
2. **Single Object Store**: Uses one object store for all data for simplicity
3. **JSON Serialization**: All values are automatically JSON serialized for storage
4. **Graceful Fallback**: If IndexedDB fails, switches to `Map`-based memory storage
5. **Rich Operations**: Built-in support for common operations like increment, toggle, append

## Performance

- **Initialization**: Lazy initialization on first use
- **Concurrent Operations**: Handles multiple simultaneous operations
- **Memory Usage**: Minimal overhead, only stores what you put in
- **Bundle Size**: Under 5KB minified and gzipped

## API Summary

### Basic Operations
- `setItem(key, value)` - Store value
- `getItem(key)` - Retrieve value
- `removeItem(key)` - Remove value
- `nullify(key)` - Set to null

### Numeric Operations
- `increment(key, amount?)` - Add to number
- `decrement(key, amount?)` - Subtract from number

### Boolean Operations  
- `toggle(key)` - Toggle boolean

### Array Operations
- `append(key, value)` - Add to end of array
- `prepend(key, value)` - Add to start of array

### Data Management
- `keys()` - Get all keys
- `values()` - Get all values  
- `entries()` - Get all key-value pairs
- `length()` - Get item count
- `has(key)` - Check if key exists
- `replaceAll(data)` - Replace all data
- `clear()` - Remove all data

### Utility
- `configure(options)` - Configure database
- `isUsingMemoryFallback()` - Check storage mode

## Testing

Run the test suite:

```bash
npm test
```

The tests cover:
- Basic CRUD operations
- All rich operations (increment, toggle, append, etc.)
- Data type handling
- Error scenarios
- Fallback mode
- Edge cases

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Changelog

### v1.0.0
- Initial simplified release
- Removed versioning and migrations for simplicity
- Added rich operations: increment, decrement, toggle, append, prepend
- Added data management: keys, values, entries, length, has, replaceAll
- Promise-based API
- Automatic fallback support
- TypeScript declarations
- Comprehensive test suite 