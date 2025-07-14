import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  initConnection, 
  getProducts, 
  requestPurchase, 
  finishTransaction,
  Product,
  Purchase,
  validateReceiptIos,
  validateReceiptAndroid
} from 'react-native-iap';
import { supabase } from '../config/supabase';
import { SubscriptionService } from './SubscriptionService';
import { logError } from '@/utils/logger';

// معرفات المنتجات في المتجر
const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'com.enjazalmualm.subscription.yearly',
    'com.enjazalmualm.subscription.halfyearly'
  ],
  android: [
    'yearly_subscription',
    'halfyearly_subscription'
  ],
  default: []
});

// معرفات المنتجات للاستخدام في التطبيق
const PRODUCT_IDS = {
  FREE: 'free_subscription',
  YEARLY: 'yearly_subscription',
  HALF_YEARLY: 'halfyearly_subscription'
};

export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  features: string[];
}

const DEFAULT_FEATURES = {
  yearly: [
    'تصفح جميع مميزات التطبيق',
    'تحميل وتصدير التقارير والملفات',
    'نسخ احتياطية غير محدودة',
    'تحديثات مجانية',
    'إمكانية مشاركة الملفات'
  ],
  half_yearly: [
    'تصفح جميع مميزات التطبيق',
    'تحميل وتصدير التقارير والملفات',
    'نسخ احتياطية محدودة',
    'تحديثات مجانية',
    'إمكانية مشاركة الملفات'
  ]
};

export class InAppPurchaseService {
  private static instance: InAppPurchaseService;
  private products: SubscriptionProduct[] = [];
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): InAppPurchaseService {
    if (!InAppPurchaseService.instance) {
      InAppPurchaseService.instance = new InAppPurchaseService();
    }
    return InAppPurchaseService.instance;
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // تهيئة الاتصال بالمتجر
      await initConnection();
      this.isInitialized = true;
      console.log('✅ تم تهيئة خدمة المشتريات بنجاح');
    } catch (error) {
      logError('فشل في تهيئة خدمة المشتريات', 'InAppPurchaseService', error);
      throw new Error('فشل في الاتصال بمتجر التطبيقات');
    }
  }

  public async loadProducts(): Promise<SubscriptionProduct[]> {
    try {
      await this.initialize();
      
      // جلب المنتجات من المتجر
      let storeProducts: Product[] = [];
      try {
        storeProducts = await getProducts({ skus: SUBSCRIPTION_SKUS });
        console.log('✅ تم جلب المنتجات من المتجر:', storeProducts.length);
      } catch (error) {
        logError('فشل في جلب المنتجات من المتجر', 'InAppPurchaseService', error);
        throw new Error('فشل في جلب المنتجات من المتجر');
      }

      // إنشاء قائمة المنتجات مع الأسعار الحقيقية
      this.products = [
        {
          productId: PRODUCT_IDS.FREE,
          title: 'الخطة المجانية',
          description: 'اشتراك مجاني مع المميزات الأساسية',
          price: 'مجاني',
          features: [
            'تصفح المميزات الأساسية للتطبيق',
            'إضافة وإدارة الطلاب (حتى 20 طالب)',
            'إنشاء التقارير الأساسية (حتى 10 تقرير)',
            'مساحة تخزين محدودة (100 ميجابايت)',
            'تحديثات مجانية'
          ]
        }
      ];

      // جلب الأسعار من Supabase
      const supabasePrices = await this.fetchPricesFromSupabase();
      console.log('📊 الأسعار من Supabase:', supabasePrices);

      // إضافة المنتجات المدفوعة مع الأسعار من المتجر
      const yearlyProduct = storeProducts.find(p => p.productId.includes('yearly'));
      const halfYearlyProduct = storeProducts.find(p => p.productId.includes('halfyearly'));

      if (yearlyProduct) {
        this.products.push({
          productId: yearlyProduct.productId,
          title: 'الخطة السنوية',
          description: 'اشتراك سنوي كامل مع جميع المميزات',
          price: yearlyProduct.localizedPrice,
          features: DEFAULT_FEATURES.yearly
        });
      }

      if (halfYearlyProduct) {
        this.products.push({
          productId: halfYearlyProduct.productId,
          title: 'الخطة النصف سنوية',
          description: 'اشتراك لمدة 6 أشهر مع المميزات الأساسية',
          price: halfYearlyProduct.localizedPrice,
          features: DEFAULT_FEATURES.half_yearly
        });
      }
      
      return this.products;
    } catch (error) {
      logError('خطأ في تحميل المنتجات', 'InAppPurchaseService', error);
      throw error;
    }
  }

  public async purchaseSubscription(productId: string, userId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      // إذا كان الاشتراك مجاني، لا نحتاج لحفظ معلومات شراء
      if (productId === PRODUCT_IDS.FREE) {
        // حذف أي معلومات شراء سابقة للمستخدم
        await AsyncStorage.removeItem(`purchase_${userId}`);
        return true;
      }
      
      // عملية الشراء الحقيقية من المتجر
      const purchase = await requestPurchase({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false
      });
      
      // التحقق من صحة الفاتورة
      const isValid = await this.validateReceipt(purchase as Purchase);
      if (!isValid) {
        throw new Error('فشل في التحقق من صحة الفاتورة');
      }
      
      // إنهاء المعاملة
      await finishTransaction({ purchase: purchase as Purchase });
      
      // حفظ معلومات الشراء
      await this.savePurchaseInfo(purchase as Purchase, userId);
      return true;
    } catch (error) {
      logError('خطأ في عملية الشراء', 'InAppPurchaseService', error);
      throw error;
    }
  }

  private async validateReceipt(purchase: Purchase): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // التحقق من الفاتورة على iOS
        const result = await validateReceiptIos({
          receiptBody: {
            'receipt-data': purchase.transactionReceipt,
            'password': 'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgfrMR/UdVyMim7vE6exh6MwtLQNE1f3JQ+VqQcjMBMSigCgYIKoZIzj0DAQehRANCAAS4xg1CHf6GZOH4n7z2THUazxpZzjzleG1KXmVF3/5mf82XCa8+cOXHzOomVrofswt2yyJA0rEYXf/byzLNx8pE', // يجب استبدالها بالرمز السري الحقيقي
            'exclude-old-transactions': true
          }
        });
        
        return (result as any).status === 0; // 0 يعني نجاح التحقق
      } else if (Platform.OS === 'android') {
        // التحقق من الفاتورة على Android
        const result = await validateReceiptAndroid({
          packageName: 'com.enjazalmualm.app', // يجب استبدالها باسم الحزمة الحقيقي
          productId: purchase.productId,
          productToken: purchase.transactionId || '',
          accessToken: 'your_access_token_here'
        });
        
        return (result as any).isValid;
      }
      
      return false;
    } catch (error) {
      logError('خطأ في التحقق من الفاتورة', 'InAppPurchaseService', error);
      return false;
    }
  }

  private async savePurchaseInfo(purchase: Purchase, userId: string) {
    try {
      const purchaseInfo = {
        userId,
        productId: purchase.productId,
        purchaseDate: new Date().toISOString(), // استخدام التاريخ الحالي بدلاً من purchaseTime
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        expirationDate: this.calculateExpirationDate(purchase.productId)
      };

      // حفظ محلياً
      await AsyncStorage.setItem(`purchase_${userId}`, JSON.stringify(purchaseInfo));
      
      // حفظ في Supabase للنسخ الاحتياطية
      await this.savePurchaseToSupabase(purchaseInfo);
    } catch (error) {
      logError('خطأ في حفظ معلومات الشراء', 'InAppPurchaseService', error);
      throw error;
    }
  }

  private async savePurchaseToSupabase(purchaseInfo: any) {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: purchaseInfo.userId,
          product_id: purchaseInfo.productId,
          purchase_date: purchaseInfo.purchaseDate,
          transaction_id: purchaseInfo.transactionId,
          transaction_receipt: purchaseInfo.transactionReceipt,
          expiration_date: purchaseInfo.expirationDate,
          is_active: true
        });

      if (error) {
        logError('خطأ في حفظ الشراء في Supabase', 'InAppPurchaseService', error);
      }
    } catch (error) {
      logError('خطأ في حفظ الشراء في Supabase', 'InAppPurchaseService', error);
    }
  }

  private calculateExpirationDate(productId: string): string {
    const now = new Date();
    if (productId.includes('yearly')) {
      now.setFullYear(now.getFullYear() + 1);
    } else {
      now.setMonth(now.getMonth() + 6);
    }
    return now.toISOString();
  }

  public async restorePurchases(userId: string): Promise<boolean> {
    try {
      await this.initialize();
      
      // محاولة استعادة المشتريات من المتجر
      // ملاحظة: react-native-iap لا يوفر دالة restorePurchases مباشرة
      // يجب استخدام getAvailablePurchases بدلاً من ذلك
      
      // التحقق من المشتريات المحفوظة محلياً وفي Supabase
      const localPurchase = await AsyncStorage.getItem(`purchase_${userId}`);
      const supabasePurchase = await this.getPurchaseFromSupabase(userId);
      
      if (localPurchase || supabasePurchase) {
        const purchase = localPurchase ? JSON.parse(localPurchase) : supabasePurchase;
        const now = new Date();
        const expiryDate = new Date(purchase.expirationDate);
        
        if (now <= expiryDate) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logError('خطأ في استعادة المشتريات', 'InAppPurchaseService', error);
      throw error;
    }
  }

  private async getPurchaseFromSupabase(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        productId: data.product_id,
        purchaseDate: data.purchase_date,
        transactionId: data.transaction_id,
        expirationDate: data.expiration_date
      };
    } catch (error) {
      logError('خطأ في جلب الشراء من Supabase', 'InAppPurchaseService', error);
      return null;
    }
  }

  public async getCurrentSubscription(userId: string): Promise<{
    type: string;
    expiryDate: string | null;
  }> {
    try {
      // التحقق من Supabase أولاً
      const supabasePurchase = await this.getPurchaseFromSupabase(userId);
      if (supabasePurchase) {
        const now = new Date();
        const expiryDate = new Date(supabasePurchase.expirationDate);

        if (now > expiryDate) {
          // إذا انتهت صلاحية الاشتراك، نحذف المعلومات ونعيد الاشتراك المجاني
          await this.deactivateSubscription(userId);
          return { type: 'مجاني', expiryDate: null };
        }

        return {
          type: supabasePurchase.productId.includes('yearly') ? 'سنوي' : 'نصف سنوي',
          expiryDate: supabasePurchase.expirationDate
        };
      }

      // التحقق من التخزين المحلي كبديل
      const localPurchase = await AsyncStorage.getItem(`purchase_${userId}`);
      if (localPurchase) {
        const purchase = JSON.parse(localPurchase);
        const now = new Date();
        const expiryDate = new Date(purchase.expirationDate);

        if (now > expiryDate) {
          await AsyncStorage.removeItem(`purchase_${userId}`);
          return { type: 'مجاني', expiryDate: null };
        }

        return {
          type: purchase.productId.includes('yearly') ? 'سنوي' : 'نصف سنوي',
          expiryDate: purchase.expirationDate
        };
      }

      return { type: 'مجاني', expiryDate: null };
    } catch (error) {
      logError('خطأ في استرجاع معلومات الاشتراك', 'InAppPurchaseService', error);
      return { type: 'مجاني', expiryDate: null };
    }
  }

  private async deactivateSubscription(userId: string) {
    try {
      // حذف من التخزين المحلي
      await AsyncStorage.removeItem(`purchase_${userId}`);
      
      // إلغاء تفعيل في Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        logError('خطأ في إلغاء تفعيل الاشتراك', 'InAppPurchaseService', error);
      }
    } catch (error) {
      logError('خطأ في إلغاء تفعيل الاشتراك', 'InAppPurchaseService', error);
    }
  }

  // دالة لجلب الأسعار من Supabase
  private async fetchPricesFromSupabase(): Promise<{[key: string]: string}> {
    try {
      console.log('🔍 محاولة جلب الأسعار من Supabase...');
      const { data, error } = await supabase
        .from('subscription_prices')
        .select('plan_type, localized_price')
        .eq('is_active', true);

      if (error) {
        logError('فشل في جلب الأسعار من Supabase', 'InAppPurchaseService', error);
        // إذا كان الجدول غير موجود، نستخدم الأسعار الافتراضية
        if (error.code === '42P01') {
          console.log('📋 جدول subscription_prices غير موجود، استخدام الأسعار الافتراضية');
          return {
            yearly: '50 ريال / سنوياً',
            half_yearly: '30 ريال / 6 أشهر'
          };
        }
        console.log('❌ خطأ في جلب الأسعار من Supabase:', error.message);
        throw error;
      }

      const prices: {[key: string]: string} = {};
      data?.forEach(item => {
        prices[item.plan_type] = item.localized_price;
      });

      console.log('✅ تم جلب الأسعار من Supabase بنجاح');
      return prices;
    } catch (error) {
      logError('فشل في جلب الأسعار من Supabase', 'InAppPurchaseService', error);
      console.log('🔄 استخدام الأسعار الافتراضية');
      // الأسعار الافتراضية في حالة الفشل
      return {
        yearly: '50 ريال / سنوياً',
        half_yearly: '30 ريال / 6 أشهر'
      };
    }
  }
} 