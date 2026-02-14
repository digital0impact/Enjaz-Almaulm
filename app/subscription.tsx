import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Animated, ImageBackground, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { InAppPurchaseService, SubscriptionProduct } from '@/services/InAppPurchaseService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AuthService from '@/services/AuthService';
import { 
  getTextDirection, 
  getFlexDirection, 
  getRTLMargins,
  getRTLPadding,
  getRTLTextStyle,
  formatRTLText,
  formatRTLNumber,
  formatRTLDate 
} from '@/utils/rtl-utils';

const SubscriptionScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadProducts();
    loadCurrentSubscription();
    
    // تحريك الصفحة عند التحميل
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const purchaseService = InAppPurchaseService.getInstance();
      const availableProducts = await purchaseService.getProducts();
      console.log('Loaded products:', availableProducts);
      console.log('Products with features:', availableProducts.map(p => ({
        productId: p.productId,
        title: p.title,
        featuresCount: p.features.length,
        features: p.features
      })));
      setProducts(availableProducts);
    } catch (err) {
      setError('حدث خطأ في تحميل خطط الاشتراك');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      const subscription = await SubscriptionService.getCurrentSubscription(user.id);
      
      // التأكد من أن البيانات صحيحة
      if (subscription && typeof subscription === 'object') {
        console.log('Current subscription loaded:', subscription);
        setCurrentSubscription(subscription);
      } else {
        console.log('No valid subscription found, using default');
        setCurrentSubscription({
          plan_type: 'free',
          status: 'active',
          end_date: null
        });
      }
    } catch (err) {
      console.error('Error loading current subscription:', err);
      // في حالة الخطأ، نضع اشتراك مجاني افتراضي
      setCurrentSubscription({
        plan_type: 'free',
        status: 'active',
        end_date: null
      });
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }
      
      const purchaseService = InAppPurchaseService.getInstance();
      const success = await purchaseService.purchaseSubscription(productId, user.id);
      if (success) {
        // تحديث حالة الاشتراك
        await loadProducts();
        await loadCurrentSubscription();
      } else {
        setError('فشلت عملية الشراء');
      }
    } catch (err) {
      setError('حدث خطأ أثناء عملية الشراء');
      console.error('Error during purchase:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (productId: string) => {
    if (productId.includes('free')) return 'card-giftcard';
    if (productId.includes('yearly')) return 'workspace-premium';
    return 'stars';
  };

  const getPlanColor = (productId: string) => {
    if (productId.includes('free')) return '#4CAF50';
    if (productId.includes('yearly')) return '#FF9800';
    return '#2196F3';
  };

  const formatExpiryDate = (date: Date | string | undefined) => {
    if (!date) return 'غير محدد';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'غير محدد';
      
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'غير محدد';
    }
  };

  const getDaysRemaining = (endDate: Date | string | undefined) => {
    if (!endDate) return 0;
    
    try {
      const now = new Date();
      const end = new Date(endDate);
      
      if (isNaN(end.getTime())) return 0;
      
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays); // لا نريد أيام سالبة
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 0;
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
        <Animated.ScrollView 
          style={[styles.scrollContainer, { opacity: fadeAnim }]}
          contentContainerStyle={{ 
            flexGrow: 1, 
            paddingBottom: 50,
            transform: [{ translateY: slideAnim }]
          }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
            </TouchableOpacity>

            <Animated.View style={[styles.iconContainer, { transform: [{ scale: fadeAnim }] }]}>
              <IconSymbol size={60} name="creditcard.fill" color="#1c1f33" />
            </Animated.View>
            
            <ThemedText type="title" style={[styles.title, getTextDirection()]}>
              {formatRTLText('خطط الاشتراك')}
            </ThemedText>
            
            <ThemedText style={[styles.subtitle, getTextDirection()]}>
              {formatRTLText('اختر الخطة المناسبة لك')}
            </ThemedText>
          </Animated.View>

          {/* Current Subscription */}
          {currentSubscription && (
            <Animated.View style={[styles.currentSubscriptionSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText('الاشتراك الحالي')}
              </ThemedText>
              
              <ThemedView style={styles.currentSubscriptionCard}>
                <ThemedView style={styles.currentSubscriptionHeader}>
                  <ThemedView style={styles.currentSubscriptionIcon}>
                    <IconSymbol 
                      size={32} 
                      name={currentSubscription.plan_type === 'free' ? 'card-giftcard' : 'workspace-premium'} 
                      color={currentSubscription.plan_type === 'free' ? '#4CAF50' : '#FF9800'} 
                    />
                  </ThemedView>
                  <ThemedView style={styles.currentSubscriptionInfo}>
                    <ThemedText style={[styles.currentSubscriptionTitle, getTextDirection()]}>
                      {formatRTLText(currentSubscription.plan_type === 'free' ? 'الاشتراك الأساسي' : 
                       currentSubscription.plan_type === 'yearly' ? 'الاشتراك السنوي' : 'الاشتراك النصف سنوي')}
                    </ThemedText>
                    <ThemedText style={[styles.currentSubscriptionStatus, getTextDirection()]}>
                      {formatRTLText(currentSubscription.status === 'active' ? 'نشط' : 'منتهي')}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {currentSubscription.plan_type !== 'free' && currentSubscription.end_date && (
                  <ThemedView style={styles.expiryInfo}>
                    <ThemedView style={styles.expiryRow}>
                      <IconSymbol size={16} name="calendar" color="#666" />
                      <ThemedText style={[styles.expiryText, getTextDirection()]}>
                        {formatRTLText('تاريخ الانتهاء:')} {formatRTLDate(new Date(currentSubscription.end_date || ''))}
                      </ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.expiryRow}>
                      <IconSymbol size={16} name="clock" color="#666" />
                      <ThemedText style={[styles.expiryText, getTextDirection()]}>
                        {formatRTLText('متبقي:')} {formatRTLNumber(getDaysRemaining(currentSubscription.end_date))} {formatRTLText('يوم')}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                )}
              </ThemedView>
            </Animated.View>
          )}

          {/* Error Message */}
        {error && (
            <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
            </Animated.View>
        )}

          {/* Loading State */}
        {loading ? (
            <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <ThemedText style={styles.loadingText}>جاري تحميل خطط الاشتراك...</ThemedText>
            </Animated.View>
          ) : (
            /* Subscription Plans */
            <Animated.View style={[styles.plansSection, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
              {formatRTLText('الخطط المتاحة')}
            </ThemedText>
              
            {products.map((product, index) => (
                <Animated.View 
                  key={index} 
                  style={[
                    styles.planCard, 
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <ThemedView style={styles.planHeader}>
                    <ThemedView style={styles.planIconContainer}>
                      <IconSymbol 
                        size={32} 
                        name={getPlanIcon(product.productId)} 
                        color={getPlanColor(product.productId)} 
                      />
                    </ThemedView>
                    <ThemedView style={styles.planInfo}>
                      <ThemedText style={[styles.planTitle, getTextDirection()]}>{formatRTLText(product.title)}</ThemedText>
                      <ThemedText style={[styles.planPrice, getTextDirection()]}>{formatRTLText(product.price)}</ThemedText>
                      <ThemedText style={[styles.planDescription, getTextDirection()]}>{formatRTLText(product.description)}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.featuresContainer}>
                    <ThemedText style={[styles.featuresTitle, getTextDirection()]}>
                      {formatRTLText('الميزات المضمنة:')}
                    </ThemedText>
                    {product.features && product.features.length > 0 ? (
                      product.features.map((feature, idx) => (
                        <ThemedView key={idx} style={[styles.featureRow, getFlexDirection()]}>
                          <ThemedText style={[styles.featureText, getTextDirection()]}>{feature}</ThemedText>
                          <IconSymbol size={16} name="checkmark.circle.fill" color="#4CAF50" />
                        </ThemedView>
                      ))
                    ) : (
                      <ThemedView style={[styles.featureRow, getFlexDirection()]}>
                        <ThemedText style={[styles.featureText, getTextDirection()]}>
                          {formatRTLText('جميع الميزات الأساسية')}
                        </ThemedText>
                        <IconSymbol size={16} name="checkmark.circle.fill" color="#4CAF50" />
                      </ThemedView>
                    )}
                  </ThemedView>

                <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      { backgroundColor: getPlanColor(product.productId) }
                    ]}
                  onPress={() => handlePurchase(product.productId)}
                    activeOpacity={0.8}
                >
                    <ThemedText style={[styles.buttonText, getTextDirection()]}>
                      {formatRTLText(product.productId.includes('free') ? 'تفعيل مجاناً' : 'اشترك الآن')}
                    </ThemedText>
                </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          )}



          {/* Terms and Privacy Section - تم نقله إلى صفحة تسجيل الدخول */}
        </Animated.ScrollView>
        
        <BottomNavigationBar />
      </ImageBackground>
    </ThemedView>
  );
};

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
    right: undefined,
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
    ...getRTLTextStyle(),
    color: '#000000',
    backgroundColor: 'transparent',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    ...getRTLTextStyle(),
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  plansSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    marginRight: 12,
    marginBottom: 15,
    writingDirection: 'rtl',
    backgroundColor: 'transparent',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  planHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  planIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    ...getRTLMargins({ left: 15, right: 0 }),
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  planInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    ...getRTLTextStyle(),
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    ...getRTLTextStyle(),
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    ...getRTLTextStyle(),
    backgroundColor: 'transparent',
  },
  featuresContainer: {
    backgroundColor: 'transparent',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    ...getRTLTextStyle(),
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    ...getRTLTextStyle(),
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },

  currentSubscriptionSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  currentSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  currentSubscriptionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  currentSubscriptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  currentSubscriptionInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  currentSubscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    ...getRTLTextStyle(),
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  currentSubscriptionStatus: {
    fontSize: 14,
    color: '#4CAF50',
    ...getRTLTextStyle(),
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  expiryInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  expiryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  expiryText: {
    fontSize: 14,
    color: '#495057',
    ...getRTLTextStyle(),
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  termsSection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  termsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 24,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  termsSubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 20,
    backgroundColor: 'transparent',
  },
  linkText: {
    color: '#add4ce',
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontSize: 16,
    ...getRTLTextStyle(),
  },
});

export default SubscriptionScreen; 
