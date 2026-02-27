import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions
} from 'react-native';
import { AlertService } from '@/services/AlertService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StorageService, FileAttachment } from '../services/StorageService';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';
import { useThemeColor } from '../hooks/useThemeColor';
import { logError } from '@/utils/logger';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

interface FileManagerProps {
  relatedTable?: string;
  relatedId?: string;
  onFileUploaded?: (file: FileAttachment) => void;
  onFileDeleted?: (fileId: string) => void;
  showUploadButton?: boolean;
  showDeleteButton?: boolean;
  maxFiles?: number;
  allowedTypes?: string[];
}

const { width } = Dimensions.get('window');

export const FileManager: React.FC<FileManagerProps> = ({
  relatedTable,
  relatedId,
  onFileUploaded,
  onFileDeleted,
  showUploadButton = true,
  showDeleteButton = true,
  maxFiles = 10,
  allowedTypes = ['*']
}) => {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    loadFiles();
  }, [relatedTable, relatedId]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      let fileList: FileAttachment[];
      
      if (relatedTable && relatedId) {
        fileList = await StorageService.getRelatedFiles(relatedTable, relatedId);
      } else {
        fileList = await StorageService.getUserFiles();
      }
      
      setFiles(fileList);
    } catch (error) {
      logError('خطأ في تحميل الملفات', 'FileManager', error);
      AlertService.alert('خطأ', 'فشل في تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };

  const checkFileType = (fileName: string): boolean => {
    if (allowedTypes.includes('*')) return true;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    return allowedTypes.some(type => 
      type.startsWith('.') ? type.slice(1) === extension : fileName.includes(type)
    );
  };

  const handleFileUpload = async (file: File) => {
    if (!checkFileType(file.name)) {
      AlertService.alert('خطأ', 'نوع الملف غير مسموح به');
      return;
    }

    if (files.length >= maxFiles) {
      AlertService.alert('خطأ', `يمكن رفع ${maxFiles} ملفات كحد أقصى`);
      return;
    }

    setUploading(true);
    try {
      const result = await StorageService.uploadFile(file, file.name, {
        relatedTable,
        relatedId,
        description: `ملف مرفق: ${file.name}`
      });

      if (result.success) {
        await loadFiles();
        onFileUploaded?.(files[files.length - 1]);
        AlertService.alert('نجح', 'تم رفع الملف بنجاح');
      } else {
        AlertService.alert('خطأ', result.error || 'فشل في رفع الملف');
      }
    } catch (error) {
      logError('خطأ في رفع الملف', 'FileManager', error);
      AlertService.alert('خطأ', 'فشل في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const fileObj = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });
        await handleFileUpload(fileObj);
      }
    } catch (error) {
      logError('خطأ في اختيار الملف', 'FileManager', error);
      AlertService.alert('خطأ', 'فشل في اختيار الملف');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const fileName = `image_${Date.now()}.jpg`;
        const fileObj = new File([blob], fileName, { type: 'image/jpeg' });
        await handleFileUpload(fileObj);
      }
    } catch (error) {
      logError('خطأ في اختيار الصورة', 'FileManager', error);
      AlertService.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const deleteFile = async (file: FileAttachment) => {
    AlertService.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف الملف "${file.file_name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await StorageService.deleteFile(file.bucket_name, file.file_path);
              if (success) {
                await loadFiles();
                onFileDeleted?.(file.id);
                AlertService.alert('نجح', 'تم حذف الملف بنجاح');
              } else {
                AlertService.alert('خطأ', 'فشل في حذف الملف');
              }
            } catch (error) {
              logError('خطأ في حذف الملف', 'FileManager', error);
              AlertService.alert('خطأ', 'فشل في حذف الملف');
            }
          }
        }
      ]
    );
  };

  const openFile = async (file: FileAttachment) => {
    try {
      const url = StorageService.getFileUrl(file.bucket_name, file.file_path);
      // يمكن إضافة منطق لفتح الملف حسب نوعه
      AlertService.alert('فتح الملف', `URL الملف: ${url}`);
    } catch (error) {
      logError('خطأ في فتح الملف', 'FileManager', error);
      AlertService.alert('خطأ', 'فشل في فتح الملف');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'غير معروف';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={textColor} />
        <ThemedText style={[styles.loadingText, getTextDirection()]}> 
          {formatRTLText('جاري تحميل الملفات...')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {showUploadButton && (
        <View style={styles.uploadSection}>
          <ThemedText style={[styles.sectionTitle, getTextDirection()]}> 
            {formatRTLText('رفع ملفات جديدة')}
          </ThemedText>
          <View style={styles.uploadButtons}>
            <ThemedButton
              title={formatRTLText('اختيار ملف')}
              onPress={pickDocument}
              disabled={uploading}
              style={styles.uploadButton}
            />
            <ThemedButton
              title={formatRTLText('اختيار صورة')}
              onPress={pickImage}
              disabled={uploading}
              style={styles.uploadButton}
            />
          </View>
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={textColor} />
              <ThemedText style={[styles.uploadingText, getTextDirection()]}> 
                {formatRTLText('جاري رفع الملف...')}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      <View style={styles.filesSection}>
        <ThemedText style={[styles.sectionTitle, getTextDirection()]}> 
          {formatRTLText(`الملفات (${files.length}/${maxFiles})`)}
        </ThemedText>
        
        {files.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: textColor }]}>📁</Text>
            <ThemedText style={[styles.emptyText, getTextDirection()]}> 
              {formatRTLText('لا توجد ملفات مرفقة')}
            </ThemedText>
          </ThemedView>
        ) : (
          <ScrollView style={styles.filesList}>
            {files.map((file) => (
              <ThemedView key={file.id} style={[styles.fileItem, { borderColor }]}>
                <TouchableOpacity
                  style={styles.fileContent}
                  onPress={() => openFile(file)}
                >
                  <Text style={styles.fileIcon}>{getFileIcon(file.file_name)}</Text>
                  <View style={styles.fileInfo}>
                    <ThemedText style={styles.fileName} numberOfLines={1}>
                      {file.file_name}
                    </ThemedText>
                    <ThemedText style={styles.fileDetails}>
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('ar-SA')}
                    </ThemedText>
                    {file.description && (
                      <ThemedText style={styles.fileDescription} numberOfLines={2}>
                        {file.description}
                      </ThemedText>
                    )}
                  </View>
                </TouchableOpacity>
                
                {showDeleteButton && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteFile(file)}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </ThemedView>
            ))}
          </ScrollView>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  uploadSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
  },
  filesSection: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
  filesList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  fileDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
}); 