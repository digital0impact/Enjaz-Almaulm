import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  Product,
  Purchase
} from 'react-native-iap';
import { supabase } from '../config/supabase';
import { SubscriptionService } from './SubscriptionService';
import { PriceManagementService } from './PriceManagementService';
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

    // إذا لم تكن هناك منتجات من المتجر (ويب، محاكي، أو عدم اتصال)، نعرض المنتجات الافتراضية
    if (this.products.length === 0) {
      return await this.getDefaultPlans();
    }

    return this.products.map(product => ({
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.localizedPrice,
      features: this.getFeaturesByProductId(product.productId)
    }));
  }

  /**
   * خطط افتراضية عند عدم توفر منتجات من المتجر (ويب / محاكي / تطوير).
   * تُحاول أولاً قراءة الأسعار الحالية من جدول subscription_prices (المصدر
   * الديناميكي عبر PriceManagementService)، وترجع تلقائيًا للقيم الثابتة
   * أدناه لأي خطة لم يُعثر لها على سعر نشط في قاعدة البيانات - حتى لا تتعطل
   * الشاشة أبدًا إن كان الجدول غير موجود أو فارغًا.
   */
  private async getDefaultPlans(): Promise<SubscriptionProduct[]> {
    const isIOS = Platform.OS === 'ios';
    let livePrices: { [key: string]: string } = {};
    try {
      livePrices = await PriceManagementService.getInstance().getActivePrices();
    } catch (error) {
      logError('تعذّر جلب الأسعار الديناميكية، ستُستخدم القيم الثابتة', 'InAppPurchaseService', error);
    }
    return [
      {
        productId: isIOS ? 'Enjaz_basic_free' : 'enjaz_subscription',
        title: 'الاشتراك الأساسي',
        description: 'اشتراك مجاني مع ميزات أساسية',
        price: 'مجاني',
        features: this.getFeaturesByProductId(isIOS ? 'Enjaz_basic_free' : 'enjaz_subscription')
      },
      {
        productId: isIOS ? 'Enjaz.Half_Yearly_Subscription30' : 'enjazhalfyearly30',
        title: 'الاشتراك النصف سنوي',
        description: 'اشتراك لمدة 6 أشهر',
        price: livePrices.half_yearly || '29.99 ريال',
        features: this.getFeaturesByProductId(isIOS ? 'Enjaz.Half_Yearly_Subscription30' : 'enjazhalfyearly30')
      },
      {
        productId: isIOS ? 'Enjaz_Yearly_Subscription_50' : 'enjazyearly50',
        title: 'الاشتراك السنوي',
        description: 'اشتراك شامل لمدة سنة كاملة',
        price: livePrices.yearly || '49.99 ريال',
        features: this.getFeaturesByProductId(isIOS ? 'Enjaz_Yearly_Subscription_50' : 'enjazyearly50')
      }
    ];
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
        const purchaseResult = await requestPurchase({ sku: productId });
        // requestPurchase قد يُرجع عنصرًا واحدًا أو مصفوفة (بعض تدفقات iOS)؛
        // هذا التطبيق يطلب SKU واحدًا فقط، لذا نأخذ العنصر الأول عند وجود مصفوفة.
        const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;
        if (purchase) {
          // التحقق من صحة عملية الشراء يتم الآن على الخادم فقط (دالة
          // verify-iap-purchase)، وليس داخل التطبيق كما كان سابقًا — لا
          // يثق الخادم بأي شيء يرسله العميل سوى الإيصال الخام نفسه، ثم
          // يتحقق منه فعليًا مع Apple/Google قبل منح الاشتراك.
          const isValid = await this.verifyPurchaseOnServer(purchase, productId);

          if (isValid) {
            await finishTransaction({ purchase });
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

  /**
   * مطابقة تامة بمعرّف المنتج (وليس .includes) — 'enjazhalfyearly30'.includes('yearly')
   * كانت تُرجع true (لاحتواء "halfyearly" على "yearly" كسلسلة فرعية)
   * فتُصنَّف خطأً كخطة سنوية. نفس الخريطة الصحيحة مستخدمة أيضًا على
   * الخادم في supabase/functions/verify-iap-purchase (المصدر الفعلي
   * لتحديد الخطة الممنوحة؛ هذه النسخة هنا للعرض المحلي فقط مثل مسار
   * التطوير __DEV__ أدناه).
   */
  private getPlanTypeFromProductId(productId: string): 'yearly' | 'half_yearly' {
    if (productId === 'Enjaz_Yearly_Subscription_50' || productId === 'enjazyearly50') return 'yearly';
    return 'half_yearly';
  }

  /**
   * يرسل الإيصال الخام (بلا أي تحقق محلي) إلى دالة verify-iap-purchase
   * على الخادم، والتي تتحقق منه فعليًا مع Apple/Google بأسرار غير
   * مُضمَّنة في التطبيق، ثم تمنح الاشتراك بصلاحية service_role إن كان
   * صالحًا. لا يعود التطبيق يتحقق من الإيصال أو يكتب في جدول
   * subscriptions مباشرة إطلاقًا.
   */
  private async verifyPurchaseOnServer(purchase: Purchase, productId: string): Promise<boolean> {
    try {
      const purchaseAny = purchase as unknown as { purchaseToken?: string; purchaseTokenAndroid?: string };
      const { data, error } = await supabase.functions.invoke<{ success?: boolean }>('verify-iap-purchase', {
        body: {
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          productId,
          transactionId: purchase.transactionId,
          transactionReceipt: Platform.OS === 'ios' ? purchase.transactionReceipt : undefined,
          purchaseToken: Platform.OS === 'android' ? (purchaseAny.purchaseToken ?? purchaseAny.purchaseTokenAndroid) : undefined,
        },
      });
      if (error) {
        logError('IAP server verification failed', 'InAppPurchaseService', error);
        return false;
      }
      return Boolean(data?.success);
    } catch (e) {
      logError('IAP server verification error', 'InAppPurchaseService', e);
      return false;
    }
  }

}