import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, I18nManager } from 'react-native';
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
      } else {
        // بيانات تجريبية
        const samplePasswords: PasswordEntry[] = [
          {
            id: '1',
            siteName: 'نور',
            username: 'teacher@school.edu.sa',
            password: 'MySecurePass123',
            url: 'https://noor.moe.gov.sa',
            category: 'مواقع تعليمية',
            lastUpdated: new Date().toISOString()
          },
          {
            id: '2',
            siteName: 'فارس',
            username: 'teacher.name',
            password: 'FaresPass456',
            url: 'https://fares.moe.gov.sa',
            category: 'مواقع تعليمية',
            lastUpdated: new Date().toISOString()
          }
        ];
        setPasswords(samplePasswords);
        await AsyncStorage.setItem('passwordTracker', JSON.stringify(samplePasswords));
      }
    } catch (error) {
      console.log('Error loading passwords:', error);
    }
  };

  const savePasswords = async (updatedPasswords: PasswordEntry[]) => {
    try {
      await AsyncStorage.setItem('passwordTracker', JSON.stringify(updatedPasswords));
      setPasswords(updatedPasswords);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في حفظ البيانات');
    }
  };

  const addPassword = async () => {
    if (!formData.siteName || !formData.username || !formData.password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newEntry: PasswordEntry = {
      id: editingEntry?.id || Date.now().toString(),
      siteName: formData.siteName,
      username: formData.username,
      password: formData.password,
      url: formData.url,
      category: formData.category,
      lastUpdated: new Date().toISOString()
    };

    let updatedPasswords;
    if (editingEntry) {
      updatedPasswords = passwords.map(p => p.id === editingEntry.id ? newEntry : p);
    } else {
      updatedPasswords = [...passwords, newEntry];
    }

    await savePasswords(updatedPasswords);
    setIsModalVisible(false);
    setEditingEntry(null);
    setFormData({
      siteName: '',
      username: '',
      password: '',
      url: '',
      category: 'مواقع تعليمية'
    });
    Alert.alert('تم الحفظ', editingEntry ? 'تم تحديث البيانات بنجاح' : 'تم إضافة الموقع بنجاح');
  };

  const editPassword = (entry: PasswordEntry) => {
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

  const deletePassword = (id: string) => {
    Alert.alert(
      'حذف الموقع',
      'هل تريد حذف هذا الموقع؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updatedPasswords = passwords.filter(p => p.id !== id);
            await savePasswords(updatedPasswords);
          }
        }
      ]
    );
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         password.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || password.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="chevron.right" color="#fff" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          متتبع المواقع
        </ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* نموذج الإدخال الرئيسي */}
        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputRow}>
            <ThemedText style={styles.label}>اسم الموقع والخدمة</ThemedText>
            <TextInput 
              style={styles.input}
              placeholder="مثال: نور، فارس، إلخ"
              placeholderTextColor="#999"
              textAlign="right"
            />
          </ThemedView>

          <ThemedView style={styles.inputRow}>
            <ThemedText style={styles.label}>الرابط</ThemedText>
            <TextInput 
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor="#999"
              textAlign="right"
            />
          </ThemedView>

          <ThemedView style={styles.inputRow}>
            <ThemedText style={styles.label}>اسم المستخدم والايميل</ThemedText>
            <TextInput 
              style={styles.input}
              placeholder="username@example.com"
              placeholderTextColor="#999"
              textAlign="right"
            />
          </ThemedView>

          <ThemedView style={styles.inputRow}>
            <ThemedText style={styles.label}>كلمة المرور</ThemedText>
            <TextInput 
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
              textAlign="right"
            />
          </ThemedView>

          <ThemedView style={styles.inputRow}>
            <ThemedText style={styles.label}>نوع الخدمة</ThemedText>
            <TextInput 
              style={styles.input}
              placeholder="مواقع تعليمية، بنوك، إلخ"
              placeholderTextColor="#999"
              textAlign="right"
            />
          </ThemedView>

          <TouchableOpacity style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>إضافة الموقع</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* قائمة المواقع المحفوظة */}
        <ThemedView style={styles.savedSitesContainer}>
          <ThemedText style={styles.sectionTitle}>المواقع المحفوظة</ThemedText>

          {filteredPasswords.map((password) => (
            <ThemedView key={password.id} style={styles.siteCard}>
              <ThemedView style={styles.siteHeader}>
                <ThemedText style={styles.siteName}>{password.siteName}</ThemedText>
                <ThemedView style={styles.siteActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => editPassword(password)}
                  >
                    <IconSymbol size={18} name="pencil" color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => deletePassword(password.id)}
                  >
                    <IconSymbol size={18} name="trash" color="#FF3B30" />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.siteDetails}>
                <ThemedText style={styles.siteDetailLabel}>الرابط:</ThemedText>
                <ThemedText style={styles.siteDetailValue}>{password.url}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.siteDetails}>
                <ThemedText style={styles.siteDetailLabel}>المستخدم:</ThemedText>
                <ThemedText style={styles.siteDetailValue}>{password.username}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.siteDetails}>
                <ThemedText style={styles.siteDetailLabel}>كلمة المرور:</ThemedText>
                <ThemedView style={styles.passwordRow}>
                  <ThemedText style={styles.siteDetailValue}>
                    {showPasswords[password.id] ? password.password : '••••••••'}
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => togglePasswordVisibility(password.id)}
                  >
                    <IconSymbol 
                      size={16} 
                      name={showPasswords[password.id] ? "eye.slash" : "eye"} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.siteDetails}>
                <ThemedText style={styles.siteDetailLabel}>النوع:</ThemedText>
                <ThemedText style={styles.siteDetailValue}>{password.category}</ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ScrollView>

      {/* Modal للإضافة والتعديل */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <ThemedView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setIsModalVisible(false);
              setEditingEntry(null);
              setFormData({
                siteName: '',
                username: '',
                password: '',
                url: '',
                category: 'مواقع تعليمية'
              });
            }}>
              <IconSymbol size={24} name="xmark" color="#007AFF" />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.modalTitle}>
              {editingEntry ? 'تعديل الموقع' : 'إضافة موقع جديد'}
            </ThemedText>
            <TouchableOpacity onPress={addPassword}>
              <IconSymbol size={24} name="checkmark" color="#007AFF" />
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.modalContent}>
            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>اسم الموقع *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.siteName}
                onChangeText={(text) => setFormData({...formData, siteName: text})}
                placeholder="أدخل اسم الموقع"
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>الرابط</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.url}
                onChangeText={(text) => setFormData({...formData, url: text})}
                placeholder="https://example.com"
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>اسم المستخدم *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.username}
                onChangeText={(text) => setFormData({...formData, username: text})}
                placeholder="أدخل اسم المستخدم"
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>كلمة المرور *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                placeholder="أدخل كلمة المرور"
                secureTextEntry
                textAlign="right"
              />
            </ThemedView>

            <ThemedView style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>فئة الموقع</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.slice(1).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.category === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setFormData({...formData, category})}
                  >
                    <ThemedText style={[
                      styles.categoryButtonText,
                      formData.category === category && styles.categoryButtonTextActive
                    ]}>
                      {category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputRow: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
    writingDirection: 'rtl',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  savedSitesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  siteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  siteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  siteDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },
  siteDetailLabel: {
    fontSize: 12,
    color: '#666',
    minWidth: 60,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  siteDetailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 5,
  },
  eyeButton: {
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
    writingDirection: 'rtl',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
});