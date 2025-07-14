import React from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';

interface BackupProgressModalProps {
  visible: boolean;
  progress: {
    current: number;
    total: number;
    message: string;
    percentage: number;
  };
  onCancel?: () => void;
}

export const BackupProgressModal: React.FC<BackupProgressModalProps> = ({
  visible,
  progress,
  onCancel
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.iconContainer}>
            <IconSymbol size={50} name="arrow.clockwise" color="#4CAF50" />
          </ThemedView>
          
          <ThemedText style={styles.title}>جاري إنشاء النسخة الاحتياطية</ThemedText>
          
          <ThemedText style={styles.message}>{progress.message}</ThemedText>
          
          <ThemedView style={styles.progressContainer}>
            <ThemedView style={styles.progressBar}>
              <ThemedView 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(progress.percentage, 100)}%` }
                ]} 
              />
            </ThemedView>
            
            <ThemedText style={styles.progressText}>
              {progress.current} من {progress.total} ({Math.min(progress.percentage, 100)}%)
            </ThemedText>
          </ThemedView>

          {/* معلومات إضافية للتشخيص في وضع التطوير */}
          {__DEV__ && (
            <ThemedView style={styles.debugContainer}>
              <ThemedText style={styles.debugText}>
                Debug: {progress.current}/{progress.total} - {progress.percentage}%
              </ThemedText>
            </ThemedView>
          )}
          
          <ActivityIndicator size="large" color="#4CAF50" style={styles.spinner} />
          
          {onCancel && (
            <ThemedText style={styles.cancelText} onPress={onCancel}>
              إلغاء العملية
            </ThemedText>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F0F8F0',
    borderRadius: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    marginBottom: 15,
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 25,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  spinner: {
    marginBottom: 20,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF6B6B',
    textDecorationLine: 'underline',
    writingDirection: 'rtl',
  },
  debugContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
}); 