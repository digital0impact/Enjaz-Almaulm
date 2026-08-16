/**
 * يتحقق من إصلاح اكتُشف أثناء تحسين الأنواع في BackupService (المرحلة 13):
 * getUserBackups() كانت تُرجع صفوف Supabase الخام (أعمدة snake_case مثل
 * user_id/backup_type/total_size/created_at) مع الادعاء بأنها BackupData
 * (camelCase) - ما كان يجعل قراءة lastBackup.createdAt/.totalSize/.backupType
 * في app/settings.tsx تُرجع دائمًا undefined (تاريخ غير صالح، حجم "غير محدد"،
 * ونوع "تلقائية" دائمًا بغض النظر عن النوع الفعلي).
 */
import { BackupService } from '@/services/BackupService';
import AuthService from '@/services/AuthService';

jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/AuthService', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

import { supabase } from '@/config/supabase';

describe('BackupService.getUserBackups - تحويل الصفوف الخام (snake_case) إلى BackupData (camelCase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1', email: 'a@b.com' });
  });

  it('يحوّل كل أعمدة الصف الخام إلى الحقول المتوقعة بصيغة camelCase', async () => {
    const rawRow = {
      id: 'backup-1',
      user_id: 'user-1',
      backup_type: 'manual',
      file_count: 1,
      total_size: 2048,
      created_at: '2026-08-01T00:00:00.000Z',
      expires_at: '2026-11-01T00:00:00.000Z',
      status: 'active',
      metadata: { version: '1.0' },
    };

    const orderMock = jest.fn().mockResolvedValue({ data: [rawRow], error: null });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const backupService = BackupService.getInstance();
    const backups = await backupService.getUserBackups();

    expect(backups).toHaveLength(1);
    expect(backups[0]).toEqual({
      id: 'backup-1',
      userId: 'user-1',
      backupType: 'manual',
      fileCount: 1,
      totalSize: 2048,
      createdAt: '2026-08-01T00:00:00.000Z',
      expiresAt: '2026-11-01T00:00:00.000Z',
      status: 'active',
      metadata: { version: '1.0' },
    });
    // قبل الإصلاح: كانت هذه الحقول تساوي undefined لأن الصف الخام لا يملك
    // مفاتيح camelCase إطلاقًا.
    expect(backups[0].createdAt).not.toBeUndefined();
    expect(backups[0].totalSize).not.toBeUndefined();
    expect(backups[0].backupType).not.toBeUndefined();
  });

  it('يرجع مصفوفة فارغة دون رمي خطأ عند فشل الاستعلام', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'network error' } });
    const eqMock = jest.fn().mockReturnValue({ order: orderMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const backupService = BackupService.getInstance();
    const backups = await backupService.getUserBackups();

    expect(backups).toEqual([]);
  });
});
