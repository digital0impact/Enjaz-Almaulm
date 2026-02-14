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
    'Enjaz_basic_free',
    'Enjaz_Yearly_Subscription_50',
    'Enjaz.Half_Yearly_Subscription30'
  ],
  android: [
    'enjaz_subscription',
    'enjazyearly50',
    'enjazhalfyearly30'
  ]
});

export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  features: string[];
}

export class InAppPurchaseService {
  private static instance: InAppPurchaseService;
  private isInitialized = false;
  private products: Product[] = [];

  private constructor() {}

  static getInstance(): InAppPurchaseService {
    if (!InAppPurchaseService.instance) {
      InAppPurchaseService.instance = new InAppPurchaseService();
    }
    return InAppPurchaseService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // محاولة الاتصال بـ IAP
      await initConnection();
      console.log('IAP connection established');
      
      // محاولة جلب المنتجات من المتجر
      if (SUBSCRIPTION_SKUS && SUBSCRIPTION_SKUS.length > 0) {
        try {
          this.products = await getProducts({ skus: SUBSCRIPTION_SKUS });
          console.log(`IAP initialized successfully with ${this.products.length} products from store`);
        } catch (productsError) {
          console.log('Could not fetch products from store (normal in development), using default products');
          this.products = [];
        }
      } else {
        console.log('No subscription SKUs configured, using default products');
        this.products = [];
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.log('IAP connection failed (normal in development), using default products');
      // في حالة الفشل، نستخدم المنتجات الافتراضية
      this.products = [];
      this.isInitialized = true;
    }
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // إذا لم تكن هناك منتجات من المتجر، نعرض المنتجات الافتراضية
    if (this.products.length === 0) {
      return Platform.select({
        ios: [
          {
            productId: 'Enjaz_basic_free',
            title: 'الاشتراك الأساسي',
            description: 'اشتراك مجاني مع ميزات أساسية',
            price: 'مجاني',
            features: this.getFeaturesByProductId('Enjaz_basic_free')
          },
          {
            productId: 'Enjaz.Half_Yearly_Subscription30',
            title: 'الاشتراك النصف سنوي',
            description: 'اشتراك لمدة 6 أشهر',
            price: '29.99 ريال',
            features: this.getFeaturesByProductId('Enjaz.Half_Yearly_Subscription30')
          },
          {
            productId: 'Enjaz_Yearly_Subscription_50',
            title: 'الاشتراك السنوي',
            description: 'اشتراك شامل لمدة سنة كاملة',
            price: '49.99 ريال',
            features: this.getFeaturesByProductId('Enjaz_Yearly_Subscription_50')
          }
        ],
        android: [
          {
            productId: 'enjaz_subscription',
            title: 'الاشتراك الأساسي',
            description: 'اشتراك مجاني مع ميزات أساسية',
            price: 'مجاني',
            features: this.getFeaturesByProductId('enjaz_subscription')
          },
          {
            productId: 'enjazhalfyearly30',
            title: 'الاشتراك النصف سنوي',
            description: 'اشتراك لمدة 6 أشهر',
            price: '29.99 ريال',
            features: this.getFeaturesByProductId('enjazhalfyearly30')
          },
          {
            productId: 'enjazyearly50',
            title: 'الاشتراك السنوي',
            description: 'اشتراك شامل لمدة سنة كاملة',
            price: '49.99 ريال',
            features: this.getFeaturesByProductId('enjazyearly50')
          }
        ]
      }) || [];
    }

    return this.products.map(product => ({
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.localizedPrice,
      features: this.getFeaturesByProductId(product.productId)
    }));
  }

  private getFeaturesByProductId(productId: string): string[] {
    const features: { [key: string]: string[] } = {
      'Enjaz_basic_free': [
        'إدارة الطلاب الأساسية',
        'تتبع الأداء البسيط',
        'تقارير أساسية',
        'نسخ احتياطي محدود (5 ملفات)'
      ],
      'enjaz_subscription': [
        'إدارة الطلاب الأساسية',
        'تتبع الأداء البسيط',
        'تقارير أساسية',
        'نسخ احتياطي محدود (5 ملفات)'
      ],
      'Enjaz_Yearly_Subscription_50': [
        'جميع الميزات الأساسية',
        'تقارير متقدمة وشاملة',
        'نسخ احتياطي غير محدود',
        'تحديثات مجانية ومستمرة',
        'تصدير التقارير بصيغ متعددة',
        'إحصائيات تفصيلية'
      ],
      'Enjaz.Half_Yearly_Subscription30': [
        'جميع الميزات الأساسية',
        'تقارير متقدمة وشاملة',
        'نسخ احتياطي غير محدود',
        'تحديثات مجانية ومستمرة',
        'تصدير التقارير بصيغ متعددة',
        'إحصائيات تفصيلية'
      ],
      'enjazyearly50': [
        'جميع الميزات الأساسية',
        'تقارير متقدمة وشاملة',
        'نسخ احتياطي غير محدود',
        'تحديثات مجانية ومستمرة',
        'تصدير التقارير بصيغ متعددة',
        'إحصائيات تفصيلية'
      ],
      'enjazhalfyearly30': [
        'جميع الميزات الأساسية',
        'تقارير متقدمة وشاملة',
        'نسخ احتياطي غير محدود',
        'تحديثات مجانية ومستمرة',
        'تصدير التقارير بصيغ متعددة',
        'إحصائيات تفصيلية'
      ]
    };
    
    const result = features[productId] || [];
    console.log(`Getting features for ${productId}:`, result);
    return result;
  }

  async purchaseSubscription(productId: string, userId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // في بيئة التطوير، نسمح بالشراء الافتراضي للمنتجات المجانية
      if (productId === 'Enjaz_basic_free' || productId === 'enjaz_subscription') {
        console.log('Creating free subscription for development');
        await SubscriptionService.createVerifiedSubscription(
          userId,
          'free',
          'dev-free-subscription',
          true
        );
        return true;
      }

      // محاولة الشراء من المتجر
      try {
        const purchase = await requestPurchase({ sku: productId });
        if (purchase) {
          const isValid = await this.validateReceipt(purchase as any);

        if (isValid) {
            await finishTransaction({ purchase: purchase as any });
          await SubscriptionService.createVerifiedSubscription(
            userId,
            this.getPlanTypeFromProductId(productId),
              (purchase as any).transactionId || 'dev-transaction',
            true
          );
          return true;
          }
        }
      } catch (purchaseError) {
        console.log('Purchase failed (normal in development):', purchaseError);
        // في بيئة التطوير، نسمح بإنشاء اشتراك تجريبي
        if (__DEV__) {
          console.log('Creating development subscription');
          await SubscriptionService.createVerifiedSubscription(
            userId,
            this.getPlanTypeFromProductId(productId),
            'dev-subscription-' + Date.now(),
            true
          );
          return true;
        }
      }

      return false;
    } catch (error) {
      console.log('Error in purchaseSubscription:', error);
      return false;
    }
  }

  private getPlanTypeFromProductId(productId: string): 'yearly' | 'half_yearly' {
    return productId.includes('yearly') ? 'yearly' : 'half_yearly';
  }

  private async validateReceipt(purchase: Purchase): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await validateReceiptIos({
          receiptBody: {
            'receipt-data': purchase.transactionReceipt || '',
            'password': process.env.EXPO_PUBLIC_IOS_SHARED_SECRET || '',
            'exclude-old-transactions': true
          }
        });
        return result.status === 0;
      } else if (Platform.OS === 'android') {
        const result = await validateReceiptAndroid({
          packageName: 'teacher-performance-app',
          productId: purchase.productId,
          productToken: purchase.transactionId || '',
          accessToken: process.env.EXPO_PUBLIC_ANDROID_ACCESS_TOKEN || ''
        });
        return Boolean(result.isValid);
      }
      return false;
    } catch (error) {
      logError('Error validating receipt', 'InAppPurchaseService', error);
      return false;
    }
  }
}