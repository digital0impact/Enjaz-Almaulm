// Centralized I18nManager utility for safe access across the app
let I18nManager: any = null;

try {
  I18nManager = require('react-native').I18nManager;
} catch (error) {
  console.warn('I18nManager not available, using fallback RTL support');
  // Fallback I18nManager implementation
  I18nManager = {
    isRTL: true, // Default to RTL for Arabic app
    allowRTL: (value: boolean) => {
      I18nManager.isRTL = value;
    },
    forceRTL: async (value: boolean) => {
      I18nManager.isRTL = value;
      return Promise.resolve();
    }
  };
}

/**
 * Safe wrapper for I18nManager functionality
 */
export const SafeI18nManager = {
  /**
   * Check if RTL is enabled
   */
  isRTL: (): boolean => {
    return I18nManager ? I18nManager.isRTL : true;
  },

  /**
   * Allow RTL support
   */
  allowRTL: (value: boolean): void => {
    if (I18nManager && I18nManager.allowRTL) {
      I18nManager.allowRTL(value);
    }
  },

  /**
   * Force RTL direction
   */
  forceRTL: async (value: boolean): Promise<void> => {
    if (I18nManager && I18nManager.forceRTL) {
      await I18nManager.forceRTL(value);
    }
  },

  /**
   * Initialize RTL for Arabic app
   */
  initializeRTL: async (): Promise<{ isRTL: boolean; direction: 'rtl' | 'ltr' }> => {
    try {
      if (I18nManager && !I18nManager.isRTL) {
        await SafeI18nManager.forceRTL(true);
      }
      
      return {
        isRTL: SafeI18nManager.isRTL(),
        direction: SafeI18nManager.isRTL() ? 'rtl' : 'ltr'
      };
    } catch (error) {
      console.error('Error initializing RTL:', error);
      return {
        isRTL: true,
        direction: 'rtl'
      };
    }
  },

  /**
   * Get RTL-aware flex direction
   */
  getFlexDirection: (): 'row' | 'row-reverse' => {
    return SafeI18nManager.isRTL() ? 'row-reverse' : 'row';
  },

  /**
   * Get RTL-aware text alignment
   */
  getTextAlign: (): 'left' | 'right' => {
    return SafeI18nManager.isRTL() ? 'right' : 'left';
  },

  /**
   * Get RTL-aware writing direction
   */
  getWritingDirection: (): 'ltr' | 'rtl' => {
    return SafeI18nManager.isRTL() ? 'rtl' : 'ltr';
  },

  /**
   * Get RTL-aware icon transform
   */
  getIconTransform: () => {
    return [{ scaleX: SafeI18nManager.isRTL() ? -1 : 1 }];
  }
};

export default SafeI18nManager; 