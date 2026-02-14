import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, Dimensions, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { getTextDirection, formatRTLText, getRTLTextStyle } from '@/utils/rtl-utils';

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
  const insets = useSafeAreaInsets();
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

  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected || false);
        
        if (!state.isConnected) {
          Alert.alert(
            'تنبيه',
            'لا يوجد اتصال بالإنترنت. بعض الميزات قد لا تعمل بشكل صحيح.',
            [{ text: 'حسناً', style: 'default' }]
          );
        }
      } catch (error) {
        console.error('خطأ في فحص الاتصال:', error);
      }
    };

    checkConnection();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleNetworkError = () => {
    if (!isConnected) {
      Alert.alert(
        'خطأ في الاتصال',
        'يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى',
        [{ text: 'حسناً', style: 'default' }]
      );
      return true;
    }
    return false;
  };

  const addPassword = async () => {
    if (handleNetworkError()) return;
    
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error('خطأ في إضافة كلمة المرور:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة كلمة المرور. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
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

  const updatePassword = async () => {
    if (handleNetworkError()) return;
    
    setIsLoading(true);
    try {
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
    } catch (error) {
      console.error('خطأ في تحديث كلمة المرور:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
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
        <ThemedText style={[styles.sectionTitle, getTextDirection()]}>{formatRTLText('إحصائيات كلمات المرور')}</ThemedText>
        <ThemedView style={styles.statsGrid}>
          <ThemedView style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <IconSymbol size={24} name="key.fill" color="#2196F3" />
            <ThemedText style={[styles.statValue, getTextDirection()]}>{passwords.length}</ThemedText>
            <ThemedText style={[styles.statLabel, getTextDirection()]}>إجمالي كلمات المرور</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <IconSymbol size={24} name="checkmark.shield.fill" color="#4CAF50" />
            <ThemedText style={[styles.statValue, getTextDirection()]}>{passwords.filter(p => p.strength === 'قوي').length}</ThemedText>
            <ThemedText style={[styles.statLabel, getTextDirection()]}>كلمات مرور قوية</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <IconSymbol size={24} name="exclamationmark.triangle.fill" color="#F44336" />
            <ThemedText style={[styles.statValue, getTextDirection()]}>{passwords.filter(p => p.strength === 'ضعيف').length}</ThemedText>
            <ThemedText style={[styles.statLabel, getTextDirection()]}>تحتاج تحديث</ThemedText>
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

            <ThemedText style={[styles.username, getTextDirection()]}>المستخدم: {item.username}</ThemedText>
            <ThemedText style={[styles.lastUpdated, getTextDirection()]}>آخر تحديث: {item.lastUpdated}</ThemedText>

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
        <ThemedView style={styles.formHeader}>
          <IconSymbol size={30} name="plus.circle.fill" color="#add4ce" />
          <ThemedText style={[styles.sectionTitle, getTextDirection()]}>إضافة كلمة مرور جديدة</ThemedText>
          <ThemedText style={[styles.formSubtitle, getTextDirection()]}>
            {formatRTLText('أضف معلومات الموقع وكلمة المرور بأمان')}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>اسم الموقع *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.websiteName}
            onChangeText={(text) => setNewPassword({ ...newPassword, websiteName: text })}
            placeholder="أدخل اسم الموقع..."
            placeholderTextColor="#999"
            textAlign="right"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>رابط الموقع</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.url}
            onChangeText={(text) => setNewPassword({ ...newPassword, url: text })}
            placeholder="https://example.com"
            placeholderTextColor="#999"
            textAlign="right"
            keyboardType="url"
            autoCapitalize="none"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>اسم المستخدم *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.username}
            onChangeText={(text) => setNewPassword({ ...newPassword, username: text })}
            placeholder="أدخل اسم المستخدم..."
            placeholderTextColor="#999"
            textAlign="right"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>كلمة المرور *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={newPassword.password}
            onChangeText={(text) => setNewPassword({ ...newPassword, password: text })}
            placeholder="أدخل كلمة مرور قوية..."
            placeholderTextColor="#999"
            textAlign="right"
            secureTextEntry
            returnKeyType="next"
            blurOnSubmit={false}
          />
          <ThemedView style={styles.strengthContainer}>
            <ThemedText style={[styles.strengthIndicator, getTextDirection(), { color: getStrengthColor(getPasswordStrength(newPassword.password)) }]}>
              {formatRTLText('قوة كلمة المرور:')} {getPasswordStrength(newPassword.password)}
            </ThemedText>
            <ThemedView style={[styles.strengthBar, { backgroundColor: getStrengthColor(getPasswordStrength(newPassword.password)) + '30' }]}>
              <ThemedView 
                style={[
                  styles.strengthBarFill, 
                  { 
                    backgroundColor: getStrengthColor(getPasswordStrength(newPassword.password)),
                    width: newPassword.password.length > 0 ? `${Math.min((newPassword.password.length / 12) * 100, 100)}%` : '0%'
                  }
                ]} 
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>الفئة</ThemedText>
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
                activeOpacity={0.7}
              >
                <ThemedText style={[
                  styles.categoryText,
                  getTextDirection(),
                  newPassword.category === category && { color: 'white' }
                ]}>
                  {formatRTLText(category)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>ملاحظات</ThemedText>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={newPassword.notes}
            onChangeText={(text) => setNewPassword({ ...newPassword, notes: text })}
            placeholder="أضف ملاحظات إضافية..."
            placeholderTextColor="#999"
            textAlign="right"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
          />
        </ThemedView>

        <TouchableOpacity style={styles.saveButton} onPress={addPassword} activeOpacity={0.8}>
          <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
          <ThemedText style={[styles.saveButtonText, getTextDirection()]}>حفظ كلمة المرور</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  const renderEditPasswordForm = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.formContainer}>
        <ThemedView style={styles.formHeader}>
          <IconSymbol size={30} name="pencil.circle.fill" color="#add4ce" />
          <ThemedText style={[styles.sectionTitle, getTextDirection()]}>تعديل كلمة المرور</ThemedText>
          <ThemedText style={[styles.formSubtitle, getTextDirection()]}>
            {formatRTLText('قم بتحديث معلومات كلمة المرور')}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>اسم الموقع *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.websiteName}
            onChangeText={(text) => setEditPassword({ ...editPassword, websiteName: text })}
            placeholder="أدخل اسم الموقع..."
            placeholderTextColor="#999"
            textAlign="right"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>رابط الموقع</ThemedText>
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
          <ThemedText style={[styles.formLabel, getTextDirection()]}>اسم المستخدم *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.username}
            onChangeText={(text) => setEditPassword({ ...editPassword, username: text })}
            placeholder="أدخل اسم المستخدم..."
            placeholderTextColor="#999"
            textAlign="right"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>كلمة المرور *</ThemedText>
          <TextInput
            style={styles.formInput}
            value={editPassword.password}
            onChangeText={(text) => setEditPassword({ ...editPassword, password: text })}
            placeholder="أدخل كلمة مرور قوية..."
            placeholderTextColor="#999"
            textAlign="right"
            secureTextEntry
            returnKeyType="next"
            blurOnSubmit={false}
          />
          <ThemedView style={styles.strengthContainer}>
            <ThemedText style={[styles.strengthIndicator, getTextDirection(), { color: getStrengthColor(getPasswordStrength(editPassword.password)) }]}>
              {formatRTLText('قوة كلمة المرور:')} {getPasswordStrength(editPassword.password)}
            </ThemedText>
            <ThemedView style={[styles.strengthBar, { backgroundColor: getStrengthColor(getPasswordStrength(editPassword.password)) + '30' }]}>
              <ThemedView 
                style={[
                  styles.strengthBarFill, 
                  { 
                    backgroundColor: getStrengthColor(getPasswordStrength(editPassword.password)),
                    width: editPassword.password.length > 0 ? `${Math.min((editPassword.password.length / 12) * 100, 100)}%` : '0%'
                  }
                ]} 
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>الفئة</ThemedText>
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
                  getTextDirection(),
                  editPassword.category === category && { color: 'white' }
                ]}>
                  {formatRTLText(category)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.formLabel, getTextDirection()]}>ملاحظات</ThemedText>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={editPassword.notes}
            onChangeText={(text) => setEditPassword({ ...editPassword, notes: text })}
            placeholder="أضف ملاحظات إضافية..."
            placeholderTextColor="#999"
            textAlign="right"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
          />
        </ThemedView>

        <ThemedView style={styles.formButtonsContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={updatePassword} activeOpacity={0.8}>
            <IconSymbol size={20} name="checkmark.circle.fill" color="#1c1f33" />
            <ThemedText style={[styles.saveButtonText, getTextDirection()]}>حفظ التعديلات</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit} activeOpacity={0.8}>
            <IconSymbol size={20} name="xmark.circle.fill" color="#F44336" />
            <ThemedText style={[styles.cancelButtonText, getTextDirection()]}>إلغاء</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  const renderRecommendationsTab = () => (
    <ThemedView style={styles.tabContent}>
      <ThemedView style={styles.recommendationsContainer}>
        <ThemedText style={[styles.sectionTitle, getTextDirection()]}>توصيات الأمان</ThemedText>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={[styles.recommendationTitle, getTextDirection()]}>
            <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#F44336" /> {formatRTLText('كلمات مرور ضعيفة')}
          </ThemedText>
          {passwords.filter(p => p.strength === 'ضعيف').map((password) => (
            <ThemedText key={password.id} style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('•')} {password.websiteName} - {formatRTLText('يحتاج إلى تحديث كلمة المرور')}
            </ThemedText>
          ))}
        </ThemedView>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={[styles.recommendationTitle, getTextDirection()]}>
            <IconSymbol size={16} name="calendar" color="#9C27B0" /> {formatRTLText('كلمات مرور قديمة')}
          </ThemedText>
          {passwords.filter(p => {
            const lastUpdate = new Date(p.lastUpdated);
            const monthsOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsOld > 6;
          }).map((password) => (
            <ThemedText key={password.id} style={[styles.recommendationText, getTextDirection()]}>
              {formatRTLText('•')} {password.websiteName} - {formatRTLText('لم يتم تحديثها منذ أكثر من 6 أشهر')}
            </ThemedText>
          ))}
        </ThemedView>

        <ThemedView style={styles.recommendationCard}>
          <ThemedText style={[styles.recommendationTitle, getTextDirection()]}>
            <IconSymbol size={16} name="star.fill" color="#FF9800" /> {formatRTLText('نصائح الأمان')}
          </ThemedText>
          <ThemedText style={[styles.recommendationText, getTextDirection()]}>• استخدم كلمات مرور فريدة لكل موقع</ThemedText>
          <ThemedText style={[styles.recommendationText, getTextDirection()]}>• قم بتحديث كلمات المرور كل 3-6 أشهر</ThemedText>
          <ThemedText style={[styles.recommendationText, getTextDirection()]}>• استخدم المصادقة الثنائية عند توفرها</ThemedText>
          <ThemedText style={[styles.recommendationText, getTextDirection()]}>• تجنب استخدام معلومات شخصية في كلمات المرور</ThemedText>
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
    <ThemedView style={[styles.container, { direction: 'rtl' }]}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={[styles.backgroundImage, { direction: 'rtl' }]}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedView style={[styles.header, { paddingTop: insets.top + 20 }]}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="key.fill" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={[styles.title, getTextDirection()]}> 
                {formatRTLText('متتبع المواقع وكلمات المرور')}
              </ThemedText>
              <ThemedText style={[styles.subtitle, getTextDirection()]}> 
                {formatRTLText('إدارة آمنة لجميع كلمات المرور والمواقع المهمة')}
              </ThemedText>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setSelectedView('add')}
              >
                <IconSymbol size={24} name="plus" color="#1c1f33" />
                <ThemedText style={[styles.addButtonText, getTextDirection()]}>إضافة كلمة مرور</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabButton, selectedView === 'overview' && styles.activeTabButton]}
                onPress={() => setSelectedView('overview')}
              >
                <IconSymbol size={16} name="list.bullet" color={selectedView === 'overview' ? '#fff' : '#666'} />
                <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'overview' && styles.activeTabButtonText]}> 
                  {formatRTLText('جميع كلمات المرور')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, selectedView === 'add' && styles.activeTabButton]}
                onPress={() => setSelectedView('add')}
              >
                <IconSymbol size={16} name="plus.circle.fill" color={selectedView === 'add' ? '#fff' : '#666'} />
                <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'add' && styles.activeTabButtonText]}> 
                  {formatRTLText('إضافة جديد')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, selectedView === 'recommendations' && styles.activeTabButton]}
                onPress={() => setSelectedView('recommendations')}
              >
                <IconSymbol size={16} name="lightbulb.fill" color={selectedView === 'recommendations' ? '#fff' : '#666'} />
                <ThemedText style={[styles.tabButtonText, getTextDirection(), selectedView === 'recommendations' && styles.activeTabButtonText]}> 
                  {formatRTLText('توصيات الأمان')}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {renderCurrentTab()}
          </ScrollView>
        </KeyboardAvoidingView>
        
        <BottomNavigationBar />
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: 'transparent',
    position: 'relative',
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
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    ...getRTLTextStyle(),
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    ...getRTLTextStyle(),
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.4)',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    ...getRTLTextStyle(),
  },
  tabSelector: {
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    ...getRTLTextStyle(),
  },
  activeTabButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 105,
  },
  tabContent: {
    backgroundColor: 'transparent',
    flex: 1,
    width: '100%',
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
    width: '100%',
    alignSelf: 'stretch',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    ...getRTLTextStyle(),
    marginBottom: 15,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
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
    ...getRTLTextStyle(),
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
    direction: 'rtl',
  },
  passwordHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  websiteName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    ...getRTLTextStyle(),
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 10,
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
    ...getRTLTextStyle(),
  },
  lastUpdated: {
    fontSize: 10,
    color: '#999',
    marginBottom: 8,
    ...getRTLTextStyle(),
  },
  passwordActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 3,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
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
  formHeader: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    ...getRTLTextStyle(),
    marginTop: 5,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    ...getRTLTextStyle(),
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    ...getRTLTextStyle(),
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  strengthIndicator: {
    fontSize: 12,
    marginTop: 5,
    ...getRTLTextStyle(),
    fontWeight: '600',
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  categorySelector: {
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
    ...getRTLTextStyle(),
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
    ...getRTLTextStyle(),
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
    ...getRTLTextStyle(),
  },
  formButtonsContainer: {
    flexDirection: 'row-reverse',
    gap: 15,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row-reverse',
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
    ...getRTLTextStyle(),
  },

});
