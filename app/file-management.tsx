import React, { useState } from 'react';
import { View, StyleSheet, Alert, ImageBackground } from 'react-native';
import { Stack } from 'expo-router';
import { FileManager } from '../components/FileManager';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { ThemedButton } from '../components/ThemedButton';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { FileAttachment } from '../services/StorageService';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

export default function FileManagementScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [relatedId, setRelatedId] = useState<string>('test-record-123');

  const handleFileUploaded = (file: FileAttachment) => {
    console.log('تم رفع ملف جديد:', file);
    Alert.alert('نجح', `تم رفع الملف "${file.file_name}" بنجاح`);
  };

  const handleFileDeleted = (fileId: string) => {
    console.log('تم حذف ملف:', fileId);
  };

  const getCategoryConfig = () => {
    switch (selectedCategory) {
      case 'documents':
        return {
          relatedTable: 'documents',
          allowedTypes: ['.pdf', '.doc', '.docx', '.txt'],
          maxFiles: 5
        };
      case 'images':
        return {
          relatedTable: 'images',
          allowedTypes: ['.jpg', '.jpeg', '.png', '.gif'],
          maxFiles: 10
        };
      case 'performance':
        return {
          relatedTable: 'performance_evidence',
          allowedTypes: ['*'],
          maxFiles: 20
        };
      default:
        return {
          relatedTable: 'general',
          allowedTypes: ['*'],
          maxFiles: 15
        };
    }
  };

  const config = getCategoryConfig();

  return (
    <ImageBackground
      source={require('@/assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'إدارة الملفات',
            headerTitleAlign: 'center',
          }}
        />

        <View style={styles.header}>
          <ThemedText style={[styles.title, getTextDirection()]}>
            {formatRTLText('نظام إدارة الملفات')}
          </ThemedText>
          <ThemedText style={[styles.subtitle, getTextDirection()]}>
            {formatRTLText('اختر فئة الملفات وابدأ في رفع وإدارة ملفاتك')}
          </ThemedText>
        </View>

        <View style={styles.categorySelector}>
          <ThemedText style={[styles.sectionTitle, getTextDirection()]}>فئة الملفات:</ThemedText>
          <View style={styles.categoryButtons}>
            <ThemedButton
              title="عامة"
              onPress={() => setSelectedCategory('general')}
              style={[
                styles.categoryButton,
                selectedCategory === 'general' && styles.selectedCategory
              ]}
            />
            <ThemedButton
              title="وثائق"
              onPress={() => setSelectedCategory('documents')}
              style={[
                styles.categoryButton,
                selectedCategory === 'documents' && styles.selectedCategory
              ]}
            />
            <ThemedButton
              title="صور"
              onPress={() => setSelectedCategory('images')}
              style={[
                styles.categoryButton,
                selectedCategory === 'images' && styles.selectedCategory
              ]}
            />
            <ThemedButton
              title="أداء"
              onPress={() => setSelectedCategory('performance')}
              style={[
                styles.categoryButton,
                selectedCategory === 'performance' && styles.selectedCategory
              ]}
            />
          </View>
        </View>

        <View style={styles.infoPanel}>
          <ThemedText style={[styles.infoTitle, getTextDirection()]}>معلومات الفئة المختارة:</ThemedText>
          <ThemedText style={[styles.infoText, getTextDirection()]}>• الجدول المرتبط: {formatRTLText(config.relatedTable)}</ThemedText>
          <ThemedText style={[styles.infoText, getTextDirection()]}>• الأنواع المسموحة: {formatRTLText(config.allowedTypes.join(', '))}</ThemedText>
          <ThemedText style={[styles.infoText, getTextDirection()]}>• الحد الأقصى: {config.maxFiles} ملفات</ThemedText>
          <ThemedText style={[styles.infoText, getTextDirection()]}>• معرف السجل المرتبط: {formatRTLText(relatedId)}</ThemedText>
        </View>

        <View style={styles.fileManagerContainer}>
          <FileManager
            relatedTable={config.relatedTable}
            relatedId={relatedId}
            onFileUploaded={handleFileUploaded}
            onFileDeleted={handleFileDeleted}
            showUploadButton={true}
            showDeleteButton={true}
            maxFiles={config.maxFiles}
            allowedTypes={config.allowedTypes}
          />
        </View>

        <View style={styles.actions}>
          <ThemedButton
            title="تغيير معرف السجل"
            onPress={() => {
              const newId = `test-record-${Date.now()}`;
              setRelatedId(newId);
              Alert.alert('تم التغيير', `تم تغيير معرف السجل إلى: ${newId}`);
            }}
            style={styles.actionButton}
          />
          <ThemedButton
            title="إعادة تحميل"
            onPress={() => {
              // سيتم إعادة تحميل الملفات تلقائياً عند تغيير relatedId
              const newId = `test-record-${Date.now()}`;
              setRelatedId(newId);
            }}
            style={styles.actionButton}
          />
        </View>
        
        <BottomNavigationBar />
      </ThemedView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  categorySelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: 80,
  },
  selectedCategory: {
    opacity: 0.7,
  },
  infoPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  fileManagerContainer: {
    flex: 1,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
}); 
