import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { suggestWithAI, type AISuggestType } from '@/services/AIAssistantService';
/** حالياً معطّل مع إظهار "قريباً" — لتفعيل المساعد أعد استدعاء suggestWithAI في handlePress */
const AI_ASSIST_DISABLED = true;
const COMING_SOON_MESSAGE = 'سيتم تفعيل مساعد الذكاء الاصطناعي قريباً.';

import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

interface AIAssistButtonProps {
  type: AISuggestType;
  currentText?: string;
  onApply: (text: string) => void;
  label?: string;
  compact?: boolean;
}

export function AIAssistButton({
  type,
  currentText = '',
  onApply,
  label,
  compact = true,
}: AIAssistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestedText, setSuggestedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePress = async () => {
    setLoading(true);
    setError(null);
    setSuggestedText('');
    try {
      const text = await suggestWithAI(type, currentText);
      setSuggestedText(text);
      setModalVisible(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (Platform.OS === 'web') {
        setError(msg);
        setModalVisible(true);
      } else {
    // عند إعادة التفعيل: استدعِ suggestWithAI هنا وافتح المودال بالاقتراح
        AlertService.alert(formatRTLText('مساعد الذكاء الاصطناعي'), msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestedText) onApply(suggestedText);
    setModalVisible(false);
    setSuggestedText('');
    setError(null);
  };

  const handleClose = () => {
    setModalVisible(false);
    setSuggestedText('');
    setError(null);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={loading}
        style={[styles.button, compact && styles.buttonCompact]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : (
          <>
            <IconSymbol name="stars" size={compact ? 18 : 20} color="#6366f1" />
            {label ? (
              <ThemedText style={[styles.label, getTextDirection()]} numberOfLines={1}>
                {label}
              </ThemedText>
            ) : null}
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <ThemedView style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, getTextDirection()]}>
                {formatRTLText('اقتراح المساعد')}
              </ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            {error ? (
              <ThemedText style={[styles.errorText, getTextDirection()]}>
                {formatRTLText(error)}
              </ThemedText>
            ) : (
              <ScrollView style={styles.suggestionScroll}>
                <ThemedText style={[styles.suggestionText, getTextDirection()]}>
                  {formatRTLText(suggestedText)}
                </ThemedText>
              </ScrollView>
            )}
            {suggestedText ? (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
                  <ThemedText style={styles.applyButtonText}>
                    {formatRTLText('تطبيق الاقتراح')}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.8}>
                  <ThemedText style={[styles.cancelButtonText, getTextDirection()]}>
                    {formatRTLText('إلغاء')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : null}
          </ThemedView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  buttonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: 'rgba(0,0,0,0.12)',
  },
    borderWidth: 1,
  labelDisabled: {
    color: '#999',
  },
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  buttonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 36,
  },
  label: {
    fontSize: 13,
    color: '#6366f1',
    maxWidth: 140,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  comingSoonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1f33',
  },
  closeBtn: {
    padding: 4,
  },
  suggestionScroll: {
    maxHeight: 200,
    marginBottom: 16,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 10,
    justifyContent: 'flex-start',
  },
  applyButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
  },
});
