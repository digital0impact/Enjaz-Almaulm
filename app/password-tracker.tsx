import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions, TextInput, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';

const { width } = Dimensions.get('window');

interface PasswordEntry {
  id: string;
  websiteName: string;
  url: string;
  username: string;
  password: string;
  category: string;
  lastUpdated: string;
  strength: 'ضعيف' | 'متوسط' | 'قوي';
  notes?: string;
}

export default function PasswordTrackerScreen() {
  const router = useRouter();
  const [selectedView, setSelectedView] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([
    {
      id: '1',
      websiteName: 'منصة مدرستي',
      url: 'https://schools.madrasati.sa',
      username: 'teacher123',
      password: 'StrongPass789!@#',
      category: 'تعليمي',
      lastUpdated: '2024-01-20',
      strength: 'قوي',
      notes: 'منصة التعليم عن بُعد'
    },
    {
      id: '2',
      websiteName: 'نظام فارس',
      url: 'https://fareshr.gov.sa',
      username: 'emp789',
      password: 'weak123',
      category: 'إداري',
      lastUpdated: '2023-11-10',
      strength: 'ضعيف',
      notes: 'نظام إدارة الموارد البشرية'
    }
  ]);

  const [newPassword, setNewPassword] = useState({
    websiteName: '',
    url: '',
    username: '',
    password: '',
    category: 'تعليمي',
    notes: ''
  });

  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [editPassword, setEditPassword] = useState({
    websiteName: '',
    url: '',
    username: '',
    password: '',
    category: 'تعليمي',
    notes: ''
  });

  const getStrengthColor = (strength: PasswordEntry['strength']) => {
    switch (strength) {
      case 'قوي': return '#4CAF50';
      case 'متوسط': return '#FF9800';
      case 'ضعيف': return '#F44336';
      default: return '#757575';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'تعليمي': return '#2196F3';
      case 'إداري': return '#9C27B0';
      case 'شخصي': return '#FF5722';
      default: return '#607D8B';
    }
  };

  const getPasswordStrength = (password: string): PasswordEntry['strength'] => {
    if (password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return 'قوي';
    } else if (password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return 'متوسط';
    } else {
      return 'ضعيف';
    }
  };

  const addPassword = () => {
    if (newPassword.websiteName.trim() && newPassword.username.trim() && newPassword.password.trim()) {
      const passwordEntry: PasswordEntry = {
        id: Date.now().toString(),
        websiteName: newPassword.websiteName,
        url: newPassword.url,
        username: newPassword.username,
        password: newPassword.password,
        category: newPassword.category,
        lastUpdated: new Date().toISOString().split('T')[0],
        strength: getPasswordStrength(newPassword.password),
        notes: newPassword.notes
      };
      setPasswords([...passwords, passwordEntry]);
      setNewPassword({
        websiteName: '',
        url: '',
        username: '',
        password: '',
        category: 'تعليمي',
        notes: ''
      });
      setShowAddForm(false);
      Alert.alert('تم بنجاح', 'تم إضافة كلمة المرور بنجاح');
    } else {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
    }
  };

  const startEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setEditPassword({
      websiteName: password.websiteName,
      url: password.url || '',
      username: password.username,
      password: password.password,
      category: password.category,
      notes: password.notes || ''
    });
    setSelectedView('edit');
  };

  const updatePassword = () => {
    if (editPassword.websiteName.trim() && editPassword.username.trim() && editPassword.password.trim()) {
      const updatedPasswords = passwords.map(p => 
        p.id === editingPassword?.id ? {
          ...p,
          websiteName: editPassword.websiteName,
          url: editPassword.url,
          username: editPassword.username,
          password: editPassword.password,
          category: editPassword.category,
          lastUpdated: new Date().toISOString().split('T')[0],
          strength: getPasswordStrength(editPassword.password),
          notes: editPassword.notes
        } : p
      );
      setPasswords(updatedPasswords);
      setEditingPassword(null);
      setEditPassword({
        websiteName: '',
        url: '',
        username: '',
        password: '',
        category: 'تعليمي',
        notes: ''
      });
      setSelectedView('overview');
      Alert.alert('تم بنجاح', 'تم تحديث كلمة المرور بنجاح');
    } else {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
    }
  };

  const cancelEdit = () => {
    setEditingPassword(null);
    setEditPassword({
      websiteName: '',
      url: '',
      username: '',
      password: '',
      category: 'تعليمي',
      notes: ''
    });
    setSelectedView('overview');
  };

  const renderOverviewTab = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.summarySection}>
        <ThemedText style={styles.sectionTitle}>إحصائيات كلمات المرور</ThemedText>
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <IconSymbol size={24} name="key.fill" color="#2196F3" />
            <ThemedText style={styles.statValue}>{passwords.length}</ThemedText>
            <ThemedText style={styles.statLabel}>إجمالي كلمات المرور</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <IconSymbol size={24} name="checkmark.shield.fill" color="#4CAF50" />
            <ThemedText style={styles.statValue}>{passwords.filter(p => p.strength === 'قوي').length}</ThemedText>
            <ThemedText style={styles.statLabel}>كلمات مرور قوية</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <IconSymbol size={24} name="exclamationmark.triangle.fill" color="#F44336" />
            <ThemedText style={styles.statValue}>{passwords.filter(p => p.strength === 'ضعيف').length}</ThemedText>
            <ThemedText style={styles.statLabel}>تحتاج تحديث</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.passwordsGrid}>
        {passwords.map((item) => (
          <ThemedView key={item.id} style={styles.passwordCard}>
            <ThemedView style={styles.passwordHeader}>
              <ThemedText style={styles.websiteName} numberOfLines={1}>
                {item.websiteName}
              </ThemedText>
              <ThemedView style={[styles.strengthBadge, { backgroundColor: getStrengthColor(item.strength) }]}>
                <ThemedText style={styles.strengthText}>{item.strength}</ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedText style={styles.username}>المستخدم: {item.username}</ThemedText>
            <ThemedText style={styles.lastUpdated}>آخر تحديث: {item.lastUpdated}</ThemedText>

            <ThemedView style={styles.passwordActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Alert.alert('كلمة المرور', item.password)}
              >
                <IconSymbol size={16} name="eye.fill" color="#2196F3" />
                <ThemedText style={styles.actionButtonText}>عرض</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Alert.alert('تم النسخ', 'تم نسخ كلمة المرور')}
              >
                <IconSymbol size={16} name="doc.on.doc.fill" color="#4CAF50" />
                <ThemedText style={styles.actionButtonText}>نسخ</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => startEditPassword(item)}
              >
                <IconSymbol size={16} name="pencil.circle.fill" color="#FF9800" />
                <ThemedText style={styles.actionButtonText}>تعديل</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );

  const renderAddPasswordForm = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.formContainer}>
        <ThemedText style={styles.sectionTitle}>إضافة كلمة مرور جديدة</ThemedText>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>اسم الموقع *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.websiteName}
            onChangeText={(text) => setNewPassword({ ...newPassword, websiteName: text })}
            placeholder="أدخل اسم الموقع..."
            placeholderTextColor="#999"
            textAlign="right"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>رابط الموقع</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.url}
            onChangeText={(text) => setNewPassword({ ...newPassword, url: text })}
            placeholder="https://example.com"
            placeholderTextColor="#999"
            textAlign="right"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>اسم المستخدم *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.username}
            onChangeText={(text) => setNewPassword({ ...newPassword, username: text })}
            placeholder="أدخل اسم المستخدم..."
            placeholderTextColor="#999"
            textAlign="right"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>كلمة المرور *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.password}
            onChangeText={(text) => setNewPassword({ ...newPassword, password: text })}
            placeholder="أدخل كلمة مرور قوية..."
            placeholderTextColor="#999"
            textAlign="right"
            secureTextEntry
          />
          <ThemedText style={[styles.strengthIndicator, { color: getStrengthColor(getPasswordStrength(newPassword.password)) }]}>
            قوة كلمة المرور: {getPasswordStrength(newPassword.password)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>الفئة</ThemedText>
          <ThemedView style={styles.categorySelector}>
            {['تعليمي', 'إداري', 'شخصي'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  { backgroundColor: getCategoryColor(category) + '20' },
                  newPassword.category === category && { backgroundColor: getCategoryColor(category) }
                ]}
                onPress={() => setNewPassword({ ...newPassword, category })}
              >
                <ThemedText style={[
                  styles.categoryText,
                  newPassword.category === category && { color: 'white' }
                ]}>
                  {category}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>ملاحظات</ThemedText>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={newPassword.notes}
            onChangeText={(text) => setNewPassword({ ...newPassword, notes: text })}
            placeholder="أضف ملاحظات إضافية..."
            placeholderTextColor="#999"
            textAlign="right"
            multiline
            numberOfLines={3}
          />
        </ThemedView>

        <TouchableOpacity style={styles.saveButton} onPress={addPassword}>
          <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
          <ThemedText style={styles.saveButtonText}>حفظ كلمة المرور</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  const renderEditPasswordForm = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.formContainer}>
        <ThemedText style={styles.sectionTitle}>تعديل كلمة المرور</ThemedText>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>اسم الموقع *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.websiteName}
            onChangeText={(text) => setEditPassword({ ...editPassword, websiteName: text })}
            placeholder="أدخل اسم الموقع..."
            placeholderTextColor="#999"
            textAlign="right"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>رابط الموقع</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.url}
            onChangeText={(text) => setEditPassword({ ...editPassword, url: text })}
            placeholder="https://example.com"
            placeholderTextColor="#999"
            textAlign="right"
            keyboardType="url"
            autoCapitalize="none"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>اسم المستخدم *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.username}
            onChangeText={(text) => setEditPassword({ ...editPassword, username: text })}
            placeholder="أدخل اسم المستخدم..."
            placeholderTextColor="#999"
            textAlign="right"
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>كلمة المرور *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.password}
            onChangeText={(text) => setEditPassword({ ...editPassword, password: text })}
            placeholder="أدخل كلمة مرور قوية..."
            placeholderTextColor="#999"
            textAlign="right"
            secureTextEntry
          />
          <ThemedText style={[styles.strengthIndicator, { color: getStrengthColor(getPasswordStrength(editPassword.password)) }]}>
            قوة كلمة المرور: {getPasswordStrength(editPassword.password)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>الفئة</ThemedText>
          <ThemedView style={styles.categorySelector}>
            {['تعليمي', 'إداري', 'شخصي'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  { backgroundColor: getCategoryColor(category) + '20' },
                  editPassword.category === category && { backgroundColor: getCategoryColor(category) }
                ]}
                onPress={() => setEditPassword({ ...editPassword, category })}
              >
                <ThemedText style={[
                  styles.categoryText,
                  editPassword.category === category && { color: 'white' }
                ]}>
                  {category}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.formLabel}>ملاحظات</ThemedText>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={editPassword.notes}
            onChangeText={(text) => setEditPassword({ ...editPassword, notes: text })}
            placeholder="أضف ملاحظات إضافية..."
            placeholderTextColor="#999"
            textAlign="right"
            multiline
            numberOfLines={3}
          />
        </ThemedView>

        <ThemedView style={styles.formButtonsContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={updatePassword}>
            <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
            <ThemedText style={styles.saveButtonText}>حفظ التعديلات</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
            <ThemedText style={styles.cancelButtonText}>إلغاء</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  const renderRecommendationsTab = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.recommendationsContainer}>
        <ThemedText style={styles.sectionTitle}>توصيات الأمان</ThemedText>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={styles.recommendationTitle}>
            <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#F44336" /> كلمات مرور ضعيفة
          </ThemedText>
          {passwords.filter(p => p.strength === 'ضعيف').map((password) => (
            <ThemedText key={password.id} style={styles.recommendationText}>
              • {password.websiteName} - يحتاج إلى تحديث كلمة المرور
            </ThemedText>
          ))}
        </ThemedView>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={styles.recommendationTitle}>
            <IconSymbol size={16} name="calendar" color="#9C27B0" /> كلمات مرور قديمة
          </ThemedText>
          {passwords.filter(p => {
            const lastUpdate = new Date(p.lastUpdated);
            const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsOld > 6;
          }).map((password) => (
            <ThemedText key={password.id} style={styles.recommendationText}>
              • {password.websiteName} - لم يتم تحديثها منذ أكثر من 6 أشهر
            </ThemedText>
          ))}
        </ThemedView>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={styles.recommendationTitle}>
            <IconSymbol size={16} name="star.fill" color="#FF9800" /> نصائح الأمان
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • استخدم كلمات مرور فريدة لكل موقع
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • قم بتحديث كلمات المرور كل 3-6 أشهر
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • استخدم المصادقة الثنائية عند توفرها
          </ThemedText>
          <ThemedText style={styles.recommendationText}>
            • تجنب استخدام معلومات شخصية في كلمات المرور
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  const renderCurrentTab = () => {
    switch (selectedView) {
      case 'add':
        return renderAddPasswordForm();
      case 'edit':
        return renderEditPasswordForm();
      case 'recommendations':
        return renderRecommendationsTab();
      default:
        return renderOverviewTab();
    }
  };

  const handleExportPasswords = () => {
    Alert.alert(
      'تصدير كلمات المرور',
      'اختر تنسيق التصدير:',
      [
        {
          text: 'Excel آمن',
          onPress: () => Alert.alert('تصدير Excel', 'سيتم تصدير كلمات المرور في ملف Excel محمي بكلمة مرور')
        },
        {
          text: 'CSV مشفر',
          onPress: () => Alert.alert('تصدير CSV', 'سيتم إنشاء ملف CSV مشفر')
        },
        {
          text: 'نسخة احتياطية آمنة',
          onPress: () => Alert.alert('نسخة احتياطية', 'سيتم إنشاء نسخة احتياطية مشفرة')
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <ThemedView style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
            </TouchableOpacity>
            <ThemedView style={styles.headerContent}>
              <IconSymbol size={50} name="key.fill" color="#1c1f33" />
              <ThemedText type="title" style={styles.headerTitle}>
                متتبع المواقع وكلمات المرور
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                إدارة آمنة لجميع كلمات المرور والمواقع المهمة
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'recommendations' && styles.activeTabButton]}
              onPress={() => setSelectedView('recommendations')}
            >
              <IconSymbol size={16} name="lightbulb.fill" color={selectedView === 'recommendations' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, selectedView === 'recommendations' && styles.activeTabButtonText]}>
                توصيات الأمان
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'add' && styles.activeTabButton]}
              onPress={() => setSelectedView('add')}
            >
              <IconSymbol size={16} name="plus.circle.fill" color={selectedView === 'add' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, selectedView === 'add' && styles.activeTabButtonText]}>
                إضافة جديد
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, selectedView === 'overview' && styles.activeTabButton]}
              onPress={() => setSelectedView('overview')}
            >
              <IconSymbol size={16} name="list.bullet" color={selectedView === 'overview' ? '#fff' : '#666'} />
              <ThemedText style={[styles.tabButtonText, selectedView === 'overview' && styles.activeTabButtonText]}>
                جميع كلمات المرور
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ScrollView style={styles.content}>
            {renderCurrentTab()}
          </ScrollView>
          <BottomNavigationBar selectedTab={selectedView} onTabChange={setSelectedView} />
        </ExpoLinearGradient>
      </ImageBackground>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    backgroundColor: '#add4ce',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#1c1f33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#1c1f33',
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.8,
    marginTop: 5,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 25,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 5,
  },
  activeTabButton: {
    backgroundColor: '#1c1f33',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 110 : 95,
  },
  tabContent: {
    backgroundColor: 'transparent',
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  passwordsGrid: {
    flexDirection: 'column',
    gap: 15,
  },
  passwordCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 10,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  websiteName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  strengthText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  username: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passwordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 3,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  actionButtonText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  strengthIndicator: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  saveButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  recommendationsContainer: {
    gap: 15,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formButtonsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    textAlign: 'center',
  },

});