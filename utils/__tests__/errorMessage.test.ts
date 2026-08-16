import { getErrorMessage } from '../errorMessage';

describe('getErrorMessage', () => {
  it('extracts message from an Error instance', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a plain string error as-is', () => {
    expect(getErrorMessage('حدث خطأ ما')).toBe('حدث خطأ ما');
  });

  it('reads a .message property off a plain object', () => {
    expect(getErrorMessage({ message: 'network failed' })).toBe('network failed');
  });

  it('falls back to the default message for unrecognized shapes', () => {
    expect(getErrorMessage(null)).toBe('خطأ غير معروف');
    expect(getErrorMessage(undefined)).toBe('خطأ غير معروف');
    expect(getErrorMessage(42)).toBe('خطأ غير معروف');
    expect(getErrorMessage({})).toBe('خطأ غير معروف');
  });

  it('honors a custom fallback message', () => {
    expect(getErrorMessage(null, 'فشل غير متوقع')).toBe('فشل غير متوقع');
  });
});
