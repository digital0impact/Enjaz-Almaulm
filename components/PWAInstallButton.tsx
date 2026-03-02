/**
 * زر عائم لتثبيت التطبيق على الشاشة الرئيسية (PWA)
 * يظهر على الويب فقط عندما يدعم المتصفح التثبيت (أندرويد/Chrome) أو على iOS
 */
import React, { useState, useEffect } from 'react';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { shouldShowInstallPrompt, promptInstall, isIOSWeb } from '@/utils/pwa-install';
import { formatRTLText } from '@/utils/rtl-utils';
import { AlertService } from '@/services/AlertService';

export function PWAInstallButton() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    setMounted(true);
    if (shouldShowInstallPrompt()) setVisible(true);
    const id = setInterval(() => {
      if (shouldShowInstallPrompt()) setVisible(true);
    }, 500);
    const stop = setTimeout(() => clearInterval(id), 8000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, []);

  const handlePress = () => {
    if (isIOSWeb()) {
      AlertService.alert(
        formatRTLText('إضافة إلى الشاشة الرئيسية'),
        formatRTLText('اضغط زر المشاركة في المتصفح (السهم للأعلى) ثم اختر "إضافة إلى الشاشة الرئيسية".')
      );
    } else {
      promptInstall();
    }
  };

  if (!mounted || !visible || Platform.OS !== 'web') return null;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <IconSymbol name="arrow.down.to.line" size={22} color="#fff" />
      <ThemedText style={styles.label}>{formatRTLText('تثبيت التطبيق')}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
