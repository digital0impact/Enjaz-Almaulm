import { supabase } from '../config/supabase';
import { logError } from '@/utils/logger';

export interface SubscriptionPrice {
  id: string;
  plan_type: 'yearly' | 'half_yearly';
  price: number;
  currency: string;
  localized_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class PriceManagementService {
  private static instance: PriceManagementService;

  private constructor() {}

  public static getInstance(): PriceManagementService {
    if (!PriceManagementService.instance) {
      PriceManagementService.instance = new PriceManagementService();
    }
    return PriceManagementService.instance;
  }

  // جلب جميع الأسعار
  public async getAllPrices(): Promise<SubscriptionPrice[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_prices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logError('فشل في جلب الأسعار', 'PriceManagementService', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logError('خطأ في جلب الأسعار', 'PriceManagementService', error);
      throw error;
    }
  }

  // جلب سعر خطة معينة
  public async getPriceByPlanType(planType: string): Promise<SubscriptionPrice | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_prices')
        .select('*')
        .eq('plan_type', planType)
        .eq('is_active', true)
        .single();

      if (error) {
        logError('فشل في جلب السعر', 'PriceManagementService', error);
        return null;
      }

      return data;
    } catch (error) {
      logError('خطأ في جلب السعر', 'PriceManagementService', error);
      return null;
    }
  }

  // تحديث سعر خطة
  public async updatePrice(
    planType: string, 
    price: number, 
    localizedPrice: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscription_prices')
        .update({
          price,
          localized_price: localizedPrice,
          updated_at: new Date().toISOString()
        })
        .eq('plan_type', planType);

      if (error) {
        logError('فشل في تحديث السعر', 'PriceManagementService', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('خطأ في تحديث السعر', 'PriceManagementService', error);
      return false;
    }
  }

  // إضافة سعر جديد
  public async addPrice(
    planType: string,
    price: number,
    localizedPrice: string,
    currency: string = 'SAR'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscription_prices')
        .insert({
          plan_type: planType,
          price,
          localized_price: localizedPrice,
          currency,
          is_active: true
        });

      if (error) {
        logError('فشل في إضافة السعر', 'PriceManagementService', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('خطأ في إضافة السعر', 'PriceManagementService', error);
      return false;
    }
  }

  // تفعيل/إلغاء تفعيل سعر
  public async togglePriceStatus(planType: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscription_prices')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('plan_type', planType);

      if (error) {
        logError('فشل في تحديث حالة السعر', 'PriceManagementService', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('خطأ في تحديث حالة السعر', 'PriceManagementService', error);
      return false;
    }
  }

  // حذف سعر
  public async deletePrice(planType: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscription_prices')
        .delete()
        .eq('plan_type', planType);

      if (error) {
        logError('فشل في حذف السعر', 'PriceManagementService', error);
        return false;
      }

      return true;
    } catch (error) {
      logError('خطأ في حذف السعر', 'PriceManagementService', error);
      return false;
    }
  }

  // جلب الأسعار النشطة فقط
  public async getActivePrices(): Promise<{[key: string]: string}> {
    try {
      const { data, error } = await supabase
        .from('subscription_prices')
        .select('plan_type, localized_price')
        .eq('is_active', true);

      if (error) {
        logError('فشل في جلب الأسعار النشطة', 'PriceManagementService', error);
        return {};
      }

      const prices: {[key: string]: string} = {};
      data?.forEach(item => {
        prices[item.plan_type] = item.localized_price;
      });

      return prices;
    } catch (error) {
      logError('خطأ في جلب الأسعار النشطة', 'PriceManagementService', error);
      return {};
    }
  }
} 