jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  safeGetJSON,
  safeGetItem,
  safeSetJSON,
  safeSetItem,
} from '../safeStorage';

afterEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('safeGetJSON', () => {
  it('parses and returns a stored JSON value', async () => {
    await AsyncStorage.setItem('key', JSON.stringify({ a: 1 }));
    expect(await safeGetJSON('key', {})).toEqual({ a: 1 });
  });

  it('returns the fallback when the key is missing', async () => {
    expect(await safeGetJSON('missing', { a: 0 })).toEqual({ a: 0 });
  });

  it('returns the fallback instead of throwing when the read fails', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    expect(await safeGetJSON('key', { a: -1 })).toEqual({ a: -1 });
  });

  it('returns the fallback instead of throwing on malformed JSON', async () => {
    await AsyncStorage.setItem('key', 'not json');
    expect(await safeGetJSON('key', { a: -1 })).toEqual({ a: -1 });
  });
});

describe('safeGetItem', () => {
  it('returns a stored string value', async () => {
    await AsyncStorage.setItem('key', 'hello');
    expect(await safeGetItem('key')).toBe('hello');
  });

  it('returns the fallback (default null) when missing', async () => {
    expect(await safeGetItem('missing')).toBeNull();
    expect(await safeGetItem('missing', 'x')).toBe('x');
  });

  it('returns the fallback instead of throwing when the read fails', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    expect(await safeGetItem('key', 'fallback')).toBe('fallback');
  });
});

describe('safeSetJSON', () => {
  it('stores the value and returns true on success', async () => {
    expect(await safeSetJSON('key', { a: 1 })).toBe(true);
    expect(await AsyncStorage.getItem('key')).toBe(JSON.stringify({ a: 1 }));
  });

  it('returns false instead of throwing when the write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('boom'));
    expect(await safeSetJSON('key', { a: 1 })).toBe(false);
  });
});

describe('safeSetItem', () => {
  it('stores the value and returns true on success', async () => {
    expect(await safeSetItem('key', 'hello')).toBe(true);
    expect(await AsyncStorage.getItem('key')).toBe('hello');
  });

  it('returns false instead of throwing when the write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('boom'));
    expect(await safeSetItem('key', 'hello')).toBe(false);
  });
});
