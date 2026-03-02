/**
 * صفحة إعادة تعيين كلمة المرور
 * يُعاد توجيه المستخدم هنا بعد النقر على رابط البريد الإلكتروني من Supabase
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/config/supabase';
import { AlertService } from '@/services/AlertService';
import { rtlStyles } from '@/styles/rtl-styles';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const isWeb = typeof window !== 'undefined';
      if (isWeb && window.location?.hash) {
        setIsReady(true);
        return;
      }
      try {
        const url = await Linking.getInitialURL();
        if (url && (url.includes('#') || url.includes('access_token'))) {
          setIsReady(true);
          return;
        }
      } catch (_) {}
      setIsReady(true);
    };
    init();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      AlertService.alert('تم بنجاح', 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.');
      router.replace('/login');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث كلمة المرور';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={styles.card}>
            <IconSymbol name="lock.shield.fill" size={48} color="#2D7D7D" />
            <ThemedText style={[styles.title, rtlStyles.text]}>تعيين كلمة مرور جديدة</ThemedText>
            <ThemedText style={[styles.subtitle, rtlStyles.text]}>
              أدخل كلمة المرور الجديدة أدناه
            </ThemedText>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={[styles.label, rtlStyles.text]}>كلمة المرور الجديدة</ThemedText>
              <TextInput
                style={[styles.input, rtlStyles.text]}
                value={password}
                onChangeText={setPassword}
                placeholder="6 أحرف على الأقل"
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#999"
                textAlign="right"
              />
            </ThemedView>
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={[styles.label, rtlStyles.text]}>تأكيد كلمة المرور</ThemedText>
              <TextInput
                style={[styles.input, rtlStyles.text]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="أعد إدخال كلمة المرور"
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#999"
                textAlign="right"
              />
            </ThemedView>

            {error ? <ThemedText style={[styles.errorText, rtlStyles.text]}>{error}</ThemedText> : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !isReady}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={[styles.buttonText, rtlStyles.text]}>حفظ كلمة المرور</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/login')}>
              <ThemedText style={[styles.backLinkText, rtlStyles.text]}>العودة لتسجيل الدخول</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    marginBottom: 12,
    width: '100%',
  },
  button: {
    backgroundColor: '#2D7D7D',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: '#2D7D7D',
    fontSize: 14,
  },
});
