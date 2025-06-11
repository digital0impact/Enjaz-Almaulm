
import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ScrollView, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PasswordEntry {
  id: string;
  siteName: string;
  username: string;
  password: string;
  url: string;
  category: string;
  lastUpdated: string;
}

export default function PasswordTrackerScreen() {
  const router = useRouter();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const [formData, setFormData] = useState({
    siteName: '',
    username: '',
    password: '',
    url: '',
    category: 'مواقع تعليمية'
  });

  const categories = [
    'الكل',
    'مواقع تعليمية',
    'شبكات اجتماعية',
    'بريد إلكتروني',
    'بنوك ومالية',
    'خدمات حكومية',
    'ترفيه',
    'أخرى'
  ];

  useEffect(() => {
    loadPasswords();
  }, []);

  const loadPasswords = async () => {
    try {
      const storedPasswords = await AsyncStorage.getItem('passwordTracker');
      if (storedPasswords) {
        setPasswords(JSON.parse(storedPasswords));
      }
    } catch (error) {
      console.log('Error loading passwords:', error);
    }
  };

  const savePasswords = async (newPasswords: PasswordEntry[]) => {
    try {
      await AsyncStorage.setItem('passwordTracker', JSON.stringify(newPasswords));
      setPasswords(newPasswords);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  const handleSave = () => {
    if (!formData.siteName || !formData.username || !formData.password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newEntry: PasswordEntry = {
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      siteName: formData.siteName,
      username: formData.username,
      password: formData.password,
      url: formData.url,
      category: formData.category,
      lastUpdated: new Date().toLocaleDateString('ar-SA')
    };

    let newPasswords;
    if (editingEntry) {
      newPasswords = passwords.map(p => p.id === editingEntry.id ? newEntry : p);
    } else {
      newPasswords = [...passwords, newEntry];
    }

    savePasswords(newPasswords);
    resetForm();
    setIsModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الإدخال؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            const newPasswords = passwords.filter(p => p.id !== id);
            savePasswords(newPasswords);
          }
        }
      ]
    );
  };

  const handleEdit = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setFormData({
      siteName: entry.siteName,
      username: entry.username,
      password: entry.password,
      url: entry.url,
      category: entry.category
    });
    setIsModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      siteName: '',
      username: '',
      password: '',
      url: '',
      category: 'مواقع تعليمية'
    });
    setEditingEntry(null);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredPasswords = passwords.filter(entry => {
    const matchesSearch = entry.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'مواقع تعليمية': '#4CAF50',
      'شبكات اجتماعية': '#2196F3',
      'بريد إلكتروني': '#FF9800',
      'بنوك ومالية': '#F44336',
      'خدمات حكومية': '#9C27B0',
      'ترفيه': '#FF5722',
      'أخرى': '#607D8B'
    };
    return colors[category as keyof typeof colors] || '#607D8B';
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#007AFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          متتبع المواقع وكلمات المرور
        </ThemedText>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setIsModalVisible(true);
          }}
        >
          <IconSymbol size={24} name="plus" color="#007AFF" />
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="البحث في المواقع..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        <IconSymbol size={20} name="magnifyingglass" color="#666" />
      </ThemedView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <ThemedText style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.selectedCategoryButtonText
            ]}>
              {category}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.passwordsList}>
        {filteredPasswords.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol size={60} name="lock.shield" color="#C7C7CC" />
            <ThemedText style={styles.emptyStateText}>
              لا توجد كلمات مرور محفوظة
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              اضغط على زر + لإضافة موقع جديد
            </ThemedText>
          </ThemedView>
        ) : (
          filteredPasswords.map((entry) => (
            <ThemedView key={entry.id} style={styles.passwordCard}>
              <ThemedView style={styles.cardHeader}>
                <ThemedView style={styles.siteInfo}>
                  <ThemedText style={styles.siteName}>{entry.siteName}</ThemedText>
                  <ThemedView style={[styles.categoryTag, { backgroundColor: getCategoryColor(entry.category) }]}>
                    <ThemedText style={styles.categoryTagText}>{entry.category}</ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedView style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit(entry)}>
                    <IconSymbol size={20} name="pencil" color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                    <IconSymbol size={20} name="trash" color="#FF3B30" />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.cardContent}>
                <ThemedView style={styles.infoRow}>
                  <ThemedText style={styles.label}>اسم المستخدم:</ThemedText>
                  <ThemedText style={styles.value}>{entry.username}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.infoRow}>
                  <ThemedText style={styles.label}>كلمة المرور:</ThemedText>
                  <ThemedView style={styles.passwordRow}>
                    <ThemedText style={styles.value}>
                      {showPasswords[entry.id] ? entry.password : '••••••••'}
                    </ThemedText>
                    <TouchableOpacity onPress={() => togglePasswordVisibility(entry.id)}>
                      <IconSymbol 
                        size={16} 
                        name={showPasswords[entry.id] ? "eye.slash" : "eye"} 
                        color="#007AFF" 
                      />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>

                {entry.url && (
                  <ThemedView style={styles.infoRow}>
                    <ThemedText style={styles.label}>الرابط:</ThemedText>
                    <ThemedText style={styles.urlValue} numberOfLines={1}>
                      {entry.url}
                    </ThemedText>
                  </ThemedView>
                )}

                <ThemedView style={styles.infoRow}>
                  <ThemedText style={styles.lastUpdated}>
                    آخر تحديث: {entry.lastUpdated}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          ))
        )}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <ThemedText style={styles.cancelButton}>إلغاء</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>
              {editingEntry ? 'تعديل الإدخال' : 'إضافة موقع جديد'}
            </ThemedText>
            <TouchableOpacity onPress={handleSave}>
              <ThemedText style={styles.saveButton}>حفظ</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.modalContent}>
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>اسم الموقع *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.siteName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, siteName: text }))}
                placeholder="مثال: Google، Facebook"
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>اسم المستخدم *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholder="البريد الإلكتروني أو اسم المستخدم"
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>كلمة المرور *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="كلمة المرور"
                secureTextEntry
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>رابط الموقع</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.url}
                onChangeText={(text) => setFormData(prev => ({ ...prev, url: text }))}
                placeholder="https://example.com"
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>الفئة</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <ThemedView style={styles.categorySelector}>
                  {categories.slice(1).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categorySelectorButton,
                        formData.category === category && styles.selectedCategorySelectorButton
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                    >
                      <ThemedText style={[
                        styles.categorySelectorText,
                        formData.category === category && styles.selectedCategorySelectorText
                      ]}>
                        {category}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              </ScrollView>
            </ThemedView>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  searchContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    margin: 20,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    writingDirection: 'rtl',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#000000',
    writingDirection: 'rtl',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  passwordsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#8E8E93',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#8E8E93',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  passwordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cardContent: {
    padding: 15,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  value: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passwordRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urlValue: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    writingDirection: 'rtl',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  categorySelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedCategorySelectorButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categorySelectorText: {
    fontSize: 14,
    color: '#000000',
    writingDirection: 'rtl',
  },
  selectedCategorySelectorText: {
    color: '#FFFFFF',
  },
});
