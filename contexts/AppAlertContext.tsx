/**
 * تنبيهات تطبيقية تحافظ على هيئة التطبيق (ألوان، خط، RTL).
 * الاستخدام: استدعِ useAppAlert() ثم appAlert.alert('العنوان', 'الرسالة', [{ text: 'حسناً', onPress: () => {} }])
 * أو مع زرين: appAlert.alert('تأكيد', 'هل تريد الحذف؟', [
 *   { text: 'إلغاء', style: 'cancel' },
 *   { text: 'حذف', style: 'destructive', onPress: () => deleteItem() }
 * ])
 */
import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/contexts/ThemeContext';
import { getTextDirection } from '@/utils/rtl-utils';

export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  style?: AppAlertButtonStyle;
}

interface AppAlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AppAlertButton[];
}

interface AppAlertContextType {
  /** عرض تنبيه بنفس هيئة التطبيق (عنوان، رسالة، أزرار اختيارية) */
  alert: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
  hide: () => void;
}

const defaultState: AppAlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [{ text: 'حسناً', style: 'default' }],
};

const AppAlertContext = createContext<AppAlertContextType | undefined>(undefined);

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppAlertState>(defaultState);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const alert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setState({
      visible: true,
      title: title || '',
      message: message || '',
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'حسناً', style: 'default' }],
    });
  }, []);

  const value: AppAlertContextType = { alert, hide };

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <AppAlertRenderer
        visible={state.visible}
        title={state.title}
        message={state.message}
        buttons={state.buttons}
        onHide={hide}
      />
    </AppAlertContext.Provider>
  );
}

function AppAlertRenderer({
  visible,
  title,
  message,
  buttons,
  onHide,
}: {
  visible: boolean;
  title: string;
  message: string;
  buttons: AppAlertButton[];
  onHide: () => void;
}) {
  const { colors } = useTheme();

  const handleButtonPress = useCallback(
    (button: AppAlertButton) => {
      button.onPress?.();
      onHide();
    },
    [onHide]
  );

  if (!visible) return null;

  const buttonBg = (style?: AppAlertButtonStyle) => {
    if (style === 'destructive') return colors.error;
    if (style === 'cancel') return colors.surface;
    return colors.secondary;
  };
  const buttonFg = (style?: AppAlertButtonStyle) => {
    if (style === 'cancel') return colors.text;
    return '#FFFFFF';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onHide}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onHide}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.box,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.title, getTextDirection()]}
                lightColor={colors.text}
                darkColor={colors.text}
              >
                {title}
              </ThemedText>
              {message ? (
                <ThemedText
                  style={[styles.message, getTextDirection()]}
                  lightColor={colors.textSecondary}
                  darkColor={colors.textSecondary}
                >
                  {message}
                </ThemedText>
              ) : null}
              <View style={[styles.buttonsRow, buttons.length > 1 && styles.buttonsRowMultiple]}>
                {buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.button,
                      buttons.length > 1 && styles.buttonFlex,
                      { backgroundColor: buttonBg(btn.style) },
                    ]}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.8}
                  >
                    <ThemedText
                      style={[styles.buttonText, getTextDirection(), { color: buttonFg(btn.style) }]}
                    >
                      {btn.text}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    ...(Platform.OS === 'web' && { boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }),
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 4,
  },
  buttonsRowMultiple: {
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export function useAppAlert(): AppAlertContextType {
  const ctx = useContext(AppAlertContext);
  if (ctx === undefined) {
    throw new Error('useAppAlert must be used within AppAlertProvider');
  }
  return ctx;
}
