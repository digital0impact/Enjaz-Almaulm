import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, View, Platform, StatusBar, ActivityIndicator, I18nManager, ImageBackground, KeyboardAvoidingView } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackButton } from '@/components/BackButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { InAppPurchaseService, SubscriptionProduct } from '@/services/InAppPurchaseService';
import { PermissionService } from '@/services/PermissionService';

const SubscriptionScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [subscriptionType, setSubscriptionType] = useState('مجاني');
  const [expiryDate, setExpiryDate] = useState('');
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    canDownload: false,
    canExport: false,
    canBackup: false,
    maxBackups: 0,
    maxStudents: 0,
    maxReports: 0,
    storageLimit: 0
  });

  useEffect(() => {
    // نستخدم loadInitialData دائماً لأننا عدلنا InAppPurchaseService ليعمل في Expo Go
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedInfo = JSON.parse(userInfo);
        setUserId(parsedInfo.id);
        await loadSubscriptionInfo(parsedInfo.id);
        await loadPermissions(parsedInfo.id);
        await loadProducts();
      } else {
        setLoading(false);
        Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
        router.replace('/login');
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      setLoading(false);
    }
  };

  const loadSubscriptionInfo = async (userId: string) => {
    try {
      const purchaseService = InAppPurchaseService.getInstance();
      const subscription = await purchaseService.getCurrentSubscription(userId);
      setSubscriptionType(subscription.type);
      setExpiryDate(subscription.expiryDate || '');
    } catch (error) {
      console.error('خطأ في تحميل معلومات الاشتراك:', error);
    }
  };

  const loadPermissions = async (userId: string) => {
    try {
      const permissionService = PermissionService.getInstance();
      await permissionService.initialize(userId);
      
      setPermissions({
        canDownload: await permissionService.canDownload(),
        canExport: await permissionService.canExport(),
        canBackup: await permissionService.canBackup(),
        maxBackups: await permissionService.getMaxBackups(),
        maxStudents: await permissionService.getMaxStudents(),
        maxReports: await permissionService.getMaxReports(),
        storageLimit: await permissionService.getStorageLimit()
      });
    } catch (error) {
      console.error('خطأ في تحميل الصلاحيات:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const purchaseService = InAppPurchaseService.getInstance();
      const availableProducts = await purchaseService.loadProducts();
      setProducts(availableProducts);
    } catch (error) {
      console.error('خطأ في تحميل المنتجات:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل خطط الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSubscription = async (productId: string) => {
    if (!userId) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setLoading(true);
      const purchaseService = InAppPurchaseService.getInstance();
      const success = await purchaseService.purchaseSubscription(productId, userId);
      
      if (success) {
        Alert.alert('نجاح', 'تم الاشتراك بنجاح');
        await loadSubscriptionInfo(userId);
        await loadPermissions(userId);
      } else {
        Alert.alert('خطأ', 'فشلت عملية الشراء');
      }
    } catch (error) {
      console.error('خطأ في عملية الشراء:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء عملية الشراء');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!userId) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setLoading(true);
      const purchaseService = InAppPurchaseService.getInstance();
      const success = await purchaseService.restorePurchases(userId);
      
      if (success) {
        Alert.alert('نجاح', 'تم استعادة مشترياتك بنجاح');
        await loadSubscriptionInfo(userId);
        await loadPermissions(userId);
      } else {
        Alert.alert('تنبيه', 'لم يتم العثور على مشتريات سابقة');
      }
    } catch (error) {
      console.error('خطأ في استعادة المشتريات:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء استعادة المشتريات');
    } finally {
      setLoading(false);
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === -1) return 'غير محدود';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb} MB`;
  };

  const getMaxText = (value: number): string => {
    if (value === -1) return 'غير محدود';
    return value.toString();
  };

  const getRemainingTimeText = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'منتهي الصلاحية';
    } else if (diffDays === 0) {
      return 'ينتهي اليوم';
    } else if (diffDays === 1) {
      return 'ينتهي غداً';
    } else if (diffDays < 7) {
      return `${diffDays} أيام متبقية`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} أسابيع متبقية`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} أشهر متبقية`;
    }
  };

  const getRemainingTimeColor = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return '#FF6B6B'; // أحمر للمنتهي
    } else if (diffDays <= 7) {
      return '#FFA500'; // برتقالي للاقتراب من الانتهاء
    } else {
      return '#4ECDC4'; // أخضر للوقت الكافي
    }
  };

  const getSubscriptionStatusText = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'منتهي الصلاحية';
    } else if (diffDays <= 7) {
      return 'قريب من الانتهاء';
    } else {
      return 'نشط';
    }
  };

  const getSubscriptionStatusColor = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return '#FF6B6B'; // أحمر
    } else if (diffDays <= 7) {
      return '#FFA500'; // برتقالي
    } else {
      return '#4ECDC4'; // أخضر
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'ios' ? 'transparent' : '#E8F5F4'} 
        translucent={Platform.OS === 'ios'}
      />
      
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
              }}
            >
              {/* Header */}
              <ThemedView style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
                </TouchableOpacity>

                <ThemedView style={styles.iconContainer}>
                  <IconSymbol size={60} name="star.fill" color="#1c1f33" />
                </ThemedView>
                
                <ThemedText type="title" style={styles.title}>
                  إدارة الاشتراك
                </ThemedText>
                
                <ThemedText style={styles.subtitle}>
                  إدارة اشتراكك ومميزاتك
                </ThemedText>
              </ThemedView>

              {/* Content */}
              <ThemedView style={styles.formContainer}>
                {/* معلومات الاشتراك الحالي */}
                <ThemedView style={styles.sectionContainer}>
                  <ThemedText style={styles.sectionTitle}>معلومات الاشتراك الحالي</ThemedText>
                  <ThemedView style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <ThemedText style={styles.infoLabel}>نوع الاشتراك:</ThemedText>
                      <ThemedText style={[styles.infoValue, { color: subscriptionType === 'مجاني' ? colors.text : colors.primary }]}>
                        {subscriptionType}
                      </ThemedText>
                    </View>
                    {expiryDate && (
                      <>
                        <View style={styles.infoRow}>
                          <ThemedText style={styles.infoLabel}>تاريخ انتهاء الاشتراك:</ThemedText>
                          <ThemedText style={styles.infoValue}>{new Date(expiryDate).toLocaleDateString('ar-SA')}</ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                          <ThemedText style={styles.infoLabel}>الوقت المتبقي:</ThemedText>
                          <ThemedText style={[styles.infoValue, { color: getRemainingTimeColor(expiryDate) }]}>
                            {getRemainingTimeText(expiryDate)}
                          </ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                          <ThemedText style={styles.infoLabel}>حالة الاشتراك:</ThemedText>
                          <ThemedText style={[styles.infoValue, { color: getSubscriptionStatusColor(expiryDate) }]}>
                            {getSubscriptionStatusText(expiryDate)}
                          </ThemedText>
                        </View>
                      </>
                    )}
                    {!expiryDate && subscriptionType === 'مجاني' && (
                      <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>حالة الاشتراك:</ThemedText>
                        <ThemedText style={[styles.infoValue, { color: '#666666' }]}>
                          اشتراك مجاني دائم
                        </ThemedText>
                      </View>
                    )}
                  </ThemedView>
                </ThemedView>

                {/* المميزات المتاحة */}
                <ThemedView style={styles.sectionContainer}>
                  <ThemedText style={styles.sectionTitle}>المميزات المتاحة</ThemedText>
                  <ThemedView style={styles.featuresCard}>
                    <View style={styles.featureRow}>
                      <ThemedText style={styles.featureLabel}>التحميل والتصدير</ThemedText>
                      <View style={[styles.featureStatus, { backgroundColor: permissions.canDownload ? '#4ECDC4' : '#FF6B6B' }]}>
                        <IconSymbol name={permissions.canDownload ? 'check' : 'close'} size={16} color="#fff" />
                      </View>
                    </View>

                    <View style={styles.featureRow}>
                      <ThemedText style={styles.featureLabel}>النسخ الاحتياطي</ThemedText>
                      <View style={[styles.featureStatus, { backgroundColor: permissions.canBackup ? '#4ECDC4' : '#FF6B6B' }]}>
                        <IconSymbol name={permissions.canBackup ? 'check' : 'close'} size={16} color="#fff" />
                      </View>
                    </View>

                    <View style={styles.featureRow}>
                      <ThemedText style={styles.featureLabel}>عدد النسخ المتاحة</ThemedText>
                      <ThemedText style={styles.featureValue}>{getMaxText(permissions.maxBackups)}</ThemedText>
                    </View>

                    <View style={styles.featureRow}>
                      <ThemedText style={styles.featureLabel}>عدد الطلاب المسموح</ThemedText>
                      <ThemedText style={styles.featureValue}>{getMaxText(permissions.maxStudents)}</ThemedText>
                    </View>

                    <View style={styles.featureRow}>
                      <ThemedText style={styles.featureLabel}>عدد التقارير المسموح</ThemedText>
                      <ThemedText style={styles.featureValue}>{getMaxText(permissions.maxReports)}</ThemedText>
                    </View>

                    <View style={styles.featureRow}>
                      <ThemedText style={styles.featureLabel}>مساحة التخزين</ThemedText>
                      <ThemedText style={styles.featureValue}>{formatStorageSize(permissions.storageLimit)}</ThemedText>
                    </View>
                  </ThemedView>
                </ThemedView>

                {/* خطط الاشتراك */}
                {loading ? (
                  <ThemedView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#add4ce" />
                    <ThemedText style={styles.loadingText}>جاري تحميل خطط الاشتراك...</ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={styles.sectionContainer}>
                    <ThemedText style={styles.sectionTitle}>خطط الاشتراك المتاحة</ThemedText>
                    
                    {products.map((product) => (
                      <TouchableOpacity 
                        key={product.productId}
                        style={styles.planCard}
                        onPress={() => handleUpgradeSubscription(product.productId)}
                      >
                        <ThemedText style={styles.planTitle}>{product.title}</ThemedText>
                        <ThemedText style={styles.planPrice}>{product.price}</ThemedText>
                        <ThemedText style={styles.planFeatures}>
                          {product.features.map((feature, index) => (
                            `• ${feature}${index < product.features.length - 1 ? '\n' : ''}`
                          ))}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity 
                      style={styles.restoreButton}
                      onPress={handleRestorePurchases}
                    >
                      <ThemedText style={styles.restoreButtonText}>
                        استعادة المشتريات السابقة
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                )}
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
        
      </ImageBackground>
    </ThemedView>
  );
}

export default SubscriptionScreen;

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
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 30,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 15,
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
    marginBottom: 10,
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
    marginBottom: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  formContainer: {
    padding: 30,
    backgroundColor: 'transparent',
    marginTop: -30,
  },
  sectionContainer: {
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    marginBottom: 15,
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  featureLabel: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  featureValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  featureStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#1c1f33',
    backgroundColor: 'transparent',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#add4ce',
    marginBottom: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  planFeatures: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    color: '#666666',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  restoreButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  restoreButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
}); 
