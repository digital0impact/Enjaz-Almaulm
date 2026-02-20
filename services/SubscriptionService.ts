import { supabase } from '../config/supabase';
import { logError } from '@/utils/logger';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'yearly' | 'half_yearly' | 'free';
  start_date: Date;
  end_date: Date;
  status: 'active' | 'expired' | 'cancelled';
  price: number;
  transaction_id?: string; // إضافة معرف المعاملة
  purchase_verified: boolean; // إضافة حقل للتحقق من الشراء
}

export interface SubscriptionFeatures {
  canDownload: boolean;
  canExport: boolean;
  canBackup: boolean;
  maxBackups: number;
  supportLevel: 'none' | 'business' | '24/7';
}

const SUBSCRIPTION_PRICES = {
  yearly: 49.99,
  half_yearly: 29.99,
  free: 0
};

const SUBSCRIPTION_DURATIONS = {
  yearly: 365, // 365 يوم
  half_yearly: 180, // 180 يوم
  free: 0
};

const SUBSCRIPTION_FEATURES: Record<Subscription['plan_type'], SubscriptionFeatures> = {
  yearly: {
    canDownload: true,
    canExport: true,
    canBackup: true,
    maxBackups: -1, // غير محدود
    supportLevel: 'none'
  },
  half_yearly: {
    canDownload: true,
    canExport: true,
    canBackup: true,
    maxBackups: -1, // غير محدود
    supportLevel: 'none'
  },
  free: {
    canDownload: false,
    canExport: false,
    canBackup: false,
    maxBackups: 0,
    supportLevel: 'none'
  }
};

export class SubscriptionService {
  static async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logError('Error fetching subscription', 'SubscriptionService', error);
      return null;
    }

    return data ?? {
      id: 'free',
      user_id: userId,
      plan_type: 'free',
      start_date: new Date(),
      end_date: new Date(),
      status: 'active',
      price: 0,
      purchase_verified: true // الاشتراك المجاني موثق دائماً
    };
  }

  // دالة جديدة لإنشاء اشتراك بعد التحقق من الدفع
  static async createVerifiedSubscription(
    userId: string, 
    planType: 'yearly' | 'half_yearly' | 'free', 
    transactionId: string,
    verified: boolean = true
  ): Promise<boolean> {
    try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_DURATIONS[planType]);

      const subscriptionData = {
        user_id: userId,
        plan_type: planType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        price: SUBSCRIPTION_PRICES[planType],
        transaction_id: transactionId,
        purchase_verified: verified
      };

      console.log('Creating subscription with data:', subscriptionData);

      const { error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);

    if (error) {
        console.error('Database error:', error);
      logError('Error creating verified subscription', 'SubscriptionService', error);
        
        // في بيئة التطوير، نعرض رسالة أكثر وضوحاً
        if (__DEV__) {
          console.log('⚠️ Database schema issue detected. Please run the update-subscription-schema.sql script in Supabase.');
        }
        
        return false;
      }

      console.log('Subscription created successfully');
      return true;
    } catch (error) {
      console.error('Unexpected error in createVerifiedSubscription:', error);
      logError('Unexpected error creating subscription', 'SubscriptionService', error);
      return false;
    }
  }

  // دالة قديمة - محذوفة لمنع الاستخدام المباشر
  static async startSubscription(userId: string, planType: 'yearly' | 'half_yearly'): Promise<boolean> {
    console.warn('⚠️ startSubscription deprecated - use createVerifiedSubscription instead');
    return false; // منع الاستخدام المباشر
  }

  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subscriptionId);

    if (error) {
      logError('Error cancelling subscription', 'SubscriptionService', error);
      return false;
    }

    return true;
  }

  static async checkSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    daysRemaining: number | null;
    currentPlan: string | null;
    features: SubscriptionFeatures;
  }> {
    const subscription = await this.getCurrentSubscription(userId);
    
    if (!subscription || subscription.plan_type === 'free') {
      return {
        isActive: true,
        daysRemaining: null,
        currentPlan: 'free',
        features: SUBSCRIPTION_FEATURES.free
      };
    }

    // التحقق من أن الاشتراك مدفوع ومتحقق منه
    if (!subscription.purchase_verified) {
      console.warn('⚠️ Subscription not verified:', subscription.id);
      return {
        isActive: false,
        daysRemaining: 0,
        currentPlan: 'free',
        features: SUBSCRIPTION_FEATURES.free
      };
    }

    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      // تحديث حالة الاشتراك إلى منتهي
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);

      return {
        isActive: false,
        daysRemaining: 0,
        currentPlan: 'free',
        features: SUBSCRIPTION_FEATURES.free
      };
    }

    return {
      isActive: true,
      daysRemaining,
      currentPlan: subscription.plan_type,
      features: SUBSCRIPTION_FEATURES[subscription.plan_type]
    };
  }

  static getFeatures(planType: Subscription['plan_type']): SubscriptionFeatures {
    return SUBSCRIPTION_FEATURES[planType];
  }
} 