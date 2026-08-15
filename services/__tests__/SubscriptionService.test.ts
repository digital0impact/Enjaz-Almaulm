/**
 * يتحقق من سلوك "الرجوع الآمن" (fallback) في السعر الفعّال المستخدم عند
 * إنشاء اشتراك: يجب أن يُستخدم السعر الديناميكي من PriceManagementService
 * عند توفره، ويجب أن يرجع تلقائيًا للقيم الثابتة (49.99/29.99) دون أي
 * تعطّل إن تعذّر الوصول لجدول subscription_prices (خطأ، أو قيمة فارغة) -
 * هذا هو أساس أمان المرحلة 12 من خطة إعادة الهيكلة (تفعيل PriceManagementService
 * كمصدر ديناميكي مع الحفاظ على القيم الثابتة كشبكة أمان).
 */
import { SubscriptionService } from '@/services/SubscriptionService';
import { PriceManagementService } from '@/services/PriceManagementService';

jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/PriceManagementService', () => ({
  PriceManagementService: {
    getInstance: jest.fn(),
  },
}));

import { supabase } from '@/config/supabase';

describe('SubscriptionService.createVerifiedSubscription - سعر الاشتراك الديناميكي مع رجوع آمن', () => {
  let insertMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    insertMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });
  });

  it('يستخدم السعر الديناميكي من PriceManagementService عند توفره', async () => {
    (PriceManagementService.getInstance as jest.Mock).mockReturnValue({
      getPriceByPlanType: jest.fn().mockResolvedValue({ price: 39.99 }),
    });

    await SubscriptionService.createVerifiedSubscription('user-1', 'yearly', 'txn-1');

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ price: 39.99, plan_type: 'yearly' })
    );
  });

  it('يرجع للسعر الثابت (49.99) عندما يُرجع PriceManagementService قيمة فارغة (null)', async () => {
    (PriceManagementService.getInstance as jest.Mock).mockReturnValue({
      getPriceByPlanType: jest.fn().mockResolvedValue(null),
    });

    await SubscriptionService.createVerifiedSubscription('user-1', 'yearly', 'txn-2');

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ price: 49.99, plan_type: 'yearly' })
    );
  });

  it('يرجع للسعر الثابت (29.99) عندما يفشل PriceManagementService (استثناء)', async () => {
    (PriceManagementService.getInstance as jest.Mock).mockReturnValue({
      getPriceByPlanType: jest.fn().mockRejectedValue(new Error('network error')),
    });

    await SubscriptionService.createVerifiedSubscription('user-1', 'half_yearly', 'txn-3');

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ price: 29.99, plan_type: 'half_yearly' })
    );
  });

  it('يرجع للسعر الثابت عندما يُرجع PriceManagementService سعرًا غير صالح (صفر أو سالب)', async () => {
    (PriceManagementService.getInstance as jest.Mock).mockReturnValue({
      getPriceByPlanType: jest.fn().mockResolvedValue({ price: 0 }),
    });

    await SubscriptionService.createVerifiedSubscription('user-1', 'half_yearly', 'txn-4');

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ price: 29.99, plan_type: 'half_yearly' })
    );
  });

  it('لا يستدعي PriceManagementService إطلاقًا للخطة المجانية، ويستخدم السعر 0', async () => {
    const getPriceByPlanType = jest.fn();
    (PriceManagementService.getInstance as jest.Mock).mockReturnValue({ getPriceByPlanType });

    await SubscriptionService.createVerifiedSubscription('user-1', 'free', 'txn-5');

    expect(getPriceByPlanType).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ price: 0, plan_type: 'free' })
    );
  });
});
