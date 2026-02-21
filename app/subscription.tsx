import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Animated, ImageBackground, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { InAppPurchaseService, SubscriptionProduct } from '@/services/InAppPurchaseService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AuthService from '@/services/AuthService';
import { supabase } from '@/config/supabase';
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

/** خطط احتياطية عند فشل تحميل المنتجات من الخدمة (مثلاً على الويب) */
const FALLBACK_PLANS: SubscriptionProduct[] = [
  {
    productId: 'enjaz_subscription',
    title: 'الاشتراك الأساسي',
    description: 'اشتراك مجاني مع ميزات أساسية',
    price: 'مجاني',
    features: ['إدارة الطلاب الأساسية', 'تتبع الأداء البسيط', 'تقارير أساسية', 'نسخ احتياطي محدود (5 ملفات)']
  },
  {
    productId: 'enjazhalfyearly30',
    title: 'الاشتراك النصف سنوي',
    description: 'اشتراك لمدة 6 أشهر',
    price: '29.99 ريال',
    features: ['جميع الميزات الأساسية', 'تقارير متقدمة وشاملة', 'نسخ احتياطي غير محدود', 'تحديثات مجانية ومستمرة']
  },
  {
    productId: 'enjazyearly50',
    title: 'الاشتراك السنوي',
    description: 'اشتراك شامل لمدة سنة كاملة',
    price: '49.99 ريال',
    features: ['جميع الميزات الأساسية', 'تقارير متقدمة وشاملة', 'نسخ احتياطي غير محدود', 'تحديثات مجانية ومستمرة', 'تصدير التقارير بصيغ متعددة', 'إحصائيات تفصيلية']
  }
];

/** روابط وهمية لا تُفتح (يجب استبدالها بروابط متجرك الفعلية في .env أو app.json) */
function isPlaceholderStoreUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes('your-store') || u.includes('رابط-المنتج');
}

/** قراءة رابط صفحة منتج الخطة في متجر الويب (صفحة المنتج وليس عربة الشراء) */
function getWebStoreProductUrl(plan: 'yearly' | 'half_yearly'): string {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  if (plan === 'yearly') {
    const url = (env?.EXPO_PUBLIC_WEB_STORE_URL_YEARLY ?? extra?.webStoreUrlYearly ?? '').trim();
    if (url && !isPlaceholderStoreUrl(url)) return url;
    const fallback = (env?.EXPO_PUBLIC_WEB_STORE_URL ?? extra?.webStoreUrl ?? '').trim();
    if (fallback && !isPlaceholderStoreUrl(fallback)) return fallback.includes('?') ? `${fallback}&plan=yearly` : `${fallback}?plan=yearly`;
  } else {
    const url = (env?.EXPO_PUBLIC_WEB_STORE_URL_HALF_YEARLY ?? extra?.webStoreUrlHalfYearly ?? '').trim();
    if (url && !isPlaceholderStoreUrl(url)) return url;
    const fallback = (env?.EXPO_PUBLIC_WEB_STORE_URL ?? extra?.webStoreUrl ?? '').trim();
    if (fallback && !isPlaceholderStoreUrl(fallback)) return fallback.includes('?') ? `${fallback}&plan=half_yearly` : `${fallback}?plan=half_yearly`;
  }
  return '';
}

/** هل يوجد أي رابط لمتجر الويب (لإظهار ملاحظة المتصفح) */
function hasWebStoreUrl(): boolean {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  if ((env?.EXPO_PUBLIC_WEB_STORE_URL ?? extra?.webStoreUrl ?? '').trim()) return true;
  if ((env?.EXPO_PUBLIC_WEB_STORE_URL_YEARLY ?? extra?.webStoreUrlYearly ?? '').trim()) return true;
  if ((env?.EXPO_PUBLIC_WEB_STORE_URL_HALF_YEARLY ?? extra?.webStoreUrlHalfYearly ?? '').trim()) return true;
  return false;
}

/** على الويب: الحصول على رابط التطبيق الأساسي لاستخدامه كرابط عودة بعد الدفع */
function getAppReturnBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const url = (env?.EXPO_PUBLIC_APP_URL ?? '').trim();
  return url ? url.replace(/\/$/, '') : '';
}

/** إضافة رابط العودة للتطبيق بعد الدفع إلى رابط المتجر (يدعمه بعض المتاجر مثل سلة عند ضبطه في الإعدادات) */
function appendReturnUrl(storeUrl: string): string {
  const base = getAppReturnBaseUrl();
  if (!base) return storeUrl;
  const returnPath = '/subscription?purchase=success';
  const returnUrl = encodeURIComponent(base + returnPath);
  const sep = storeUrl.includes('?') ? '&' : '?';
  return `${storeUrl}${sep}return_url=${returnUrl}`;
}

const SubscriptionScreen = () => {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const hasWebStore = hasWebStoreUrl();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingAfterPurchase, setSyncingAfterPurchase] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const lastSubscriptionRef = useRef<any>(null);

  /** تحميل اشتراك المستخدم الحالي من Supabase (مستقر للاستدعاء من Realtime والتركيز) */
  const loadCurrentSubscription = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) return;

      const subscription = await SubscriptionService.getCurrentSubscription(user.id);
      const resolved = subscription && typeof subscription === 'object' ? subscription : { plan_type: 'free', status: 'active', end_date: null };
      lastSubscriptionRef.current = resolved;

      if (subscription && typeof subscription === 'object') {
        setCurrentSubscription(subscription);
      } else {
        setCurrentSubscription(resolved);
      }
    } catch (err) {
      console.error('Error loading current subscription:', err);
      const fallback = { plan_type: 'free', status: 'active', end_date: null };
      lastSubscriptionRef.current = fallback;
      setCurrentSubscription(fallback);
    }
  }, []);

  /** تحديث حالة الاشتراك (مفيد بعد الشراء من متجر سلة) */
  const onRefreshSubscription = useCallback(async () => {
    setRefreshing(true);
    await loadCurrentSubscription();
    setRefreshing(false);
  }, [loadCurrentSubscription]);

  useFocusEffect(
    useCallback(() => {
      loadCurrentSubscription();
    }, [loadCurrentSubscription])
  );

  // على الويب: عند فتح الصفحة برابط العودة بعد الدفع (?purchase=success) ننتظر جاهزية الجلسة ثم نحدّث الاشتراك مع إعادة المحاولة (ويب هوك المتجر قد يتأخر)
  useEffect(() => {
    if (!isWeb || typeof window === 'undefined' || typeof window.location?.search !== 'string') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') !== 'success') return;
    const cleanUrl = window.location.pathname || '/subscription';
    window.history.replaceState({}, '', cleanUrl);
    setSyncingAfterPurchase(true);
    let cancelled = false;
    const maxAttempts = 6;
    const delayMs = 2000;
    const authWaitMs = 400;
    const authWaitMax = 3000;

    const waitForAuth = (): Promise<boolean> => {
      return new Promise((resolve) => {
        let elapsed = 0;
        const check = async () => {
          if (cancelled) {
            resolve(false);
            return;
          }
          const user = await AuthService.getCurrentUser();
          if (user?.id) {
            resolve(true);
            return;
          }
          elapsed += authWaitMs;
          if (elapsed >= authWaitMax) {
            resolve(false);
            return;
          }
          setTimeout(check, authWaitMs);
        };
        check();
      });
    };

    const run = async () => {
      if (cancelled) return;
      const ready = await waitForAuth();
      if (!ready || cancelled) {
        setSyncingAfterPurchase(false);
        return;
      }
      let attempts = 0;
      const doSync = async () => {
        if (cancelled) return;
        await loadCurrentSubscription();
        attempts += 1;
        const sub = lastSubscriptionRef.current;
        const isPaid = sub && sub.plan_type !== 'free' && sub.purchase_verified;
        if (isPaid || attempts >= maxAttempts) {
          setSyncingAfterPurchase(false);
          return;
        }
        setTimeout(doSync, delayMs);
      };
      doSync();
    };
    run();
    return () => { cancelled = true; };
  }, [isWeb, loadCurrentSubscription]);

  // على الويب: عند عودة المستخدم لتبويب التطبيق بعد الشراء، نحدّث حالة الاشتراك
  useEffect(() => {
    if (!isWeb || typeof document === 'undefined') return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCurrentSubscription();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isWeb, loadCurrentSubscription]);

  // الاشتراك في Realtime: عند إضافة أو تحديث اشتراك المستخدم في قاعدة البيانات (مثلاً بعد ويب هوك الدفع) يصل التحديث فوراً
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;
    AuthService.getCurrentUser().then((user) => {
      if (!mounted || !user?.id) return;
      channel = supabase
        .channel(`subscriptions:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadCurrentSubscription();
          }
        )
        .subscribe();
    });
    return () => {
      mounted = false;
      channel?.unsubscribe();
    };
  }, [loadCurrentSubscription]);

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
  }, [loadCurrentSubscription]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const purchaseService = InAppPurchaseService.getInstance();
      const availableProducts = await purchaseService.getProducts();
      if (availableProducts && availableProducts.length > 0) {
        setProducts(availableProducts);
      } else {
        setProducts(FALLBACK_PLANS);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts(FALLBACK_PLANS);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  /** استخراج نوع الخطة من productId لاستخدامه في رابط متجر الويب */
  const getPlanTypeForWebStore = (productId: string): 'yearly' | 'half_yearly' | null => {
    if (productId.includes('yearly') && !productId.includes('half')) return 'yearly';
    if (productId.includes('half') || productId.includes('Half')) return 'half_yearly';
    return null;
  };

  const handleSubscribePress = async (productId: string) => {
    const isFreePlan = productId.includes('free') || productId.includes('subscription');
    const planType = getPlanTypeForWebStore(productId);

    // على الويب: التعامل مع كل الحالات دون استخدام IAP
    if (isWeb) {
      if (isFreePlan) {
        // الخطة المجانية: تفعيلها مباشرة من Supabase دون شراء
        await activateFreePlanOnWeb();
        return;
      }
      if (planType) {
        let productUrl = getWebStoreProductUrl(planType);
        if (productUrl) {
          try {
            if (typeof window !== 'undefined') {
              // إضافة رابط العودة للتطبيق (يدعمه بعض المتاجر للعودة تلقائياً بعد الدفع)
              productUrl = appendReturnUrl(productUrl);
              // فتح المتجر في نفس التبويب حتى إذا وجّه المتجر للمستخدم إلى return_url يعود مباشرة للتطبيق
              window.location.href = productUrl;
            } else {
              await Linking.openURL(productUrl);
            }
          } catch (e) {
            console.error('Error opening product page:', e);
            setError('تعذر فتح صفحة المنتج');
          }
          return;
        }
      }
      setError('الشراء من المتصفح يتطلب إضافة روابط صفحات المنتجات (سنوي / نصف سنوي) في الإعدادات. يمكنك أيضاً الشراء من تطبيق الجوال.');
      return;
    }

    await handlePurchase(productId);
  };

  /** على الويب: تفعيل الاشتراك المجاني دون استخدام IAP */
  const activateFreePlanOnWeb = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await AuthService.getCurrentUser();
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        return;
      }
      const ok = await SubscriptionService.createVerifiedSubscription(
        user.id,
        'free',
        'web-free-' + Date.now(),
        true
      );
      if (ok) {
        await loadCurrentSubscription();
        await loadProducts();
      } else {
        // قد يكون الاشتراك المجاني مفعّلاً مسبقاً
        await loadCurrentSubscription();
      }
    } catch (err) {
      console.error('Error activating free plan on web:', err);
      setError('حدث خطأ أثناء التفعيل. إن كان اشتراكك الأساسي مفعّلاً، يمكنك تجاهل هذه الرسالة.');
      await loadCurrentSubscription();
    } finally {
      setLoading(false);
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
              <View style={[styles.currentSubscriptionSectionHeader, getFlexDirection()]}>
                <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                  {formatRTLText('الاشتراك الحالي')}
                </ThemedText>
                <TouchableOpacity
                  onPress={onRefreshSubscription}
                  disabled={refreshing}
                  style={styles.refreshSubscriptionButton}
                >
                  <IconSymbol size={18} name="arrow.clockwise" color={refreshing ? '#999' : '#1c1f33'} />
                  <ThemedText style={[styles.refreshSubscriptionText, getTextDirection()]}>
                    {formatRTLText(refreshing ? 'جاري التحديث...' : 'تحديث')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
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

          {/* بعد الدفع: جاري مزامنة الاشتراك + زر تحقق */}
        {syncingAfterPurchase && (
            <Animated.View style={[styles.webStoreNote, { opacity: fadeAnim, backgroundColor: '#E3F2FD', marginVertical: 8 }]}>
              <IconSymbol size={20} name="arrow.clockwise" color="#1976D2" />
              <ThemedText style={[styles.webStoreNoteText, getTextDirection()]}>
                {formatRTLText('جاري تحديث الاشتراك... إن لم يظهر خلال لحظات اضغط «تحقق من اشتراكي» أو تأكد من استخدام نفس رقم الجوال في المتجر.')}
              </ThemedText>
            </Animated.View>
        )}
          {/* زر تحقق من الاشتراك (مفيد بعد الدفع من المتجر) */}
        {hasWebStore && (
            <TouchableOpacity
              style={[styles.verifyButton, { opacity: fadeAnim }]}
              onPress={async () => {
                setRefreshing(true);
                await loadCurrentSubscription();
                setRefreshing(false);
                if (syncingAfterPurchase) setSyncingAfterPurchase(false);
              }}
              disabled={refreshing}
            >
              <IconSymbol size={18} name="checkmark.circle" color="#1976D2" />
              <ThemedText style={[styles.verifyButtonText, getTextDirection()]}>
                {formatRTLText(refreshing ? 'جاري التحقق...' : 'تحقق من اشتراكي')}
              </ThemedText>
            </TouchableOpacity>
        )}

          {/* Loading State */}
        {loading ? (
            <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <ThemedText style={styles.loadingText}>جاري تحميل خطط الاشتراك...</ThemedText>
            </Animated.View>
          ) : (
            <>
              {/* Subscription Plans */}
              {isWeb && hasWebStore ? (
                <Animated.View style={[styles.webStoreNote, { opacity: fadeAnim }]}>
                  <IconSymbol size={20} name="link" color="#2196F3" />
                  <ThemedText style={[styles.webStoreNoteText, getTextDirection()]}>
                    {formatRTLText('الاشتراك من المتصفح يتم عبر صفحة المنتج في متجرنا. بعد الدفع إن كان المتجر يدعم رابط العودة سيُعاد توجيهك تلقائياً للتطبيق؛ وإلا ارجع لهذا الرابط أو حدّث الصفحة لتحديث اشتراكك.')}
                  </ThemedText>
                </Animated.View>
              ) : null}
              {hasWebStore ? (
                <Animated.View style={[styles.webStoreNote, styles.webStorePhoneAlert, { opacity: fadeAnim }]}>
                  <IconSymbol size={20} name="info.circle.fill" color="#FF9800" />
                  <ThemedText style={[styles.webStoreNoteText, styles.webStorePhoneAlertText, getTextDirection()]}>
                    {formatRTLText('لتفعيل الاشتراك تلقائياً بعد الشراء: استخدم نفس رقم الجوال المسجّل في التطبيق (الإعدادات → البيانات الأساسية) عند إتمام الطلب في المتجر.')}
                  </ThemedText>
                </Animated.View>
              ) : null}
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
                  onPress={() => handleSubscribePress(product.productId)}
                    activeOpacity={0.8}
                >
                    <ThemedText style={[styles.buttonText, getTextDirection()]}>
                      {formatRTLText(product.productId.includes('free') || product.productId.includes('subscription') ? 'مشترك' : 'اشترك الآن')}
                    </ThemedText>
                </TouchableOpacity>
                </Animated.View>
              ))}
              </Animated.View>
            </>
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
  webStoreNote: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  webStorePhoneAlert: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    borderColor: 'rgba(255, 152, 0, 0.35)',
  },
  webStorePhoneAlertText: {
    color: '#E65100',
  },
  webStoreNoteText: {
    fontSize: 14,
    color: '#1976D2',
    ...getRTLTextStyle(),
  },
  verifyButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  verifyButtonText: {
    fontSize: 15,
    color: '#1565C0',
    fontWeight: '600',
    ...getRTLTextStyle(),
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
  currentSubscriptionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  refreshSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  refreshSubscriptionText: {
    fontSize: 14,
    color: '#1c1f33',
    fontWeight: '500',
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
