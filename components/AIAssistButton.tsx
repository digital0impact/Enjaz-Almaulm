import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { type AISuggestType } from '@/services/AIAssistantService';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

/** حالياً معطّل مع إظهار "قريباً" — لتفعيل المساعد أعد استدعاء suggestWithAI في handlePress */
const AI_ASSIST_DISABLED = true;
const COMING_SOON_MESSAGE = 'سيتم تفعيل مساعد الذكاء الاصطناعي قريباً.';

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
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    if (AI_ASSIST_DISABLED) {
      setModalVisible(true);
      return;
    }
    // عند إعادة التفعيل: استدعِ suggestWithAI هنا وافتح المودال بالاقتراح
  };

  const handleClose = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.button, compact && styles.buttonCompact, AI_ASSIST_DISABLED && styles.buttonDisabled]}
        activeOpacity={0.7}
      >
        <IconSymbol name="stars" size={compact ? 18 : 20} color={AI_ASSIST_DISABLED ? '#999' : '#6366f1'} />
        <ThemedText style={[styles.label, getTextDirection(), AI_ASSIST_DISABLED && styles.labelDisabled]} numberOfLines={1}>
          {formatRTLText(AI_ASSIST_DISABLED ? 'قريباً' : (label ?? ''))}
        </ThemedText>
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
                {formatRTLText('مساعد الذكاء الاصطناعي')}
              </ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={22} color="#666" />
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.comingSoonText, getTextDirection()]}>
              {formatRTLText(COMING_SOON_MESSAGE)}
            </ThemedText>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
              <ThemedText style={styles.closeButtonText}>
                {formatRTLText('حسناً')}
              </ThemedText>
            </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  buttonCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 36,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderColor: 'rgba(0,0,0,0.12)',
  },
  label: {
    fontSize: 13,
    color: '#6366f1',
    maxWidth: 140,
  },
  labelDisabled: {
    color: '#999',
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
