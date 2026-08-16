jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { Themes } from '../Colors';
import { defaultTheme } from '@/contexts/ThemeContext';

describe('Themes.default.light.primary', () => {
  it('derives from contexts/ThemeContext.tsx, the single authoritative color source', () => {
    // Regression guard for the phase-8 decision (contexts/ThemeContext.tsx
    // is authoritative): this must stay a derived reference, not an
    // independently hardcoded value that can drift again.
    expect(Themes.default.light.primary).toBe(defaultTheme.colors.primary);
  });
});
