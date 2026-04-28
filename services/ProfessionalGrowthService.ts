import { supabase } from '@/config/supabase';
import { logError } from '@/utils/logger';
import * as FileSystem from 'expo-file-system';

const BUCKET = 'user-files';

export type GrowthType = 'certificate' | 'course';

export interface ProfessionalGrowthItem {
  id: string;
  user_id: string;
  type: GrowthType;
  title: string;
  image_path: string | null;
  sort_order: number;
  imageUri?: string; // URL للعرض (محلي أو signed)
  created_at?: string;
}

export type GrowthAttachmentKind = 'image' | 'pdf';

/** تحويل URI محلي إلى Blob للرفع */
async function uriToBlob(uri: string, dataUrlMime: string): Promise<Blob> {
  const isWeb = typeof window !== 'undefined';
  if (isWeb && (uri.startsWith('blob:') || uri.startsWith('http') || uri.startsWith('data:'))) {
    const res = await fetch(uri);
    return res.blob();
  }
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const res = await fetch(`data:${dataUrlMime};base64,${base64}`);
    return res.blob();
  } catch {
    const res = await fetch(uri);
    return res.blob();
  }
}

function growthImageMimeFromUri(localUri: string): { ext: 'png' | 'jpg'; contentType: string; dataUrlMime: string } {
  const lower = localUri.toLowerCase();
  if (lower.includes('.png')) {
    return { ext: 'png', contentType: 'image/png', dataUrlMime: 'image/png' };
  }
  return { ext: 'jpg', contentType: 'image/jpeg', dataUrlMime: 'image/jpeg' };
}

/** رفع مرفق (صورة أو PDF) إلى Storage وإرجاع المسار */
export async function uploadGrowthAttachment(
  userId: string,
  localUri: string,
  kind: GrowthAttachmentKind
): Promise<string | null> {
  try {
    const mime =
      kind === 'pdf'
        ? { ext: 'pdf' as const, contentType: 'application/pdf', dataUrlMime: 'application/pdf' }
        : (() => {
            const m = growthImageMimeFromUri(localUri);
            return { ext: m.ext, contentType: m.contentType, dataUrlMime: m.contentType };
          })();
    const { ext, contentType, dataUrlMime } = mime;
    const blob = await uriToBlob(localUri, dataUrlMime);
    const fileName = `${userId}/professional-growth/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, blob, {
      contentType,
      upsert: true,
    });

    if (error) {
      logError('ProfessionalGrowth upload', 'ProfessionalGrowthService', error);
      return null;
    }
    return fileName;
  } catch (e) {
    logError('ProfessionalGrowth uriToBlob', 'ProfessionalGrowthService', e);
    return null;
  }
}

/** الحصول على رابط مؤقت للصورة */
export async function getImageUrl(imagePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(imagePath, 3600);
    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** جلب جميع سجلات النمو المهني للمستخدم */
export async function getItems(userId: string): Promise<ProfessionalGrowthItem[]> {
  try {
    const { data, error } = await supabase
      .from('professional_growth')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    const items = (data || []) as ProfessionalGrowthItem[];

    for (const item of items) {
      if (item.image_path) {
        item.imageUri = (await getImageUrl(item.image_path)) || undefined;
      }
    }
    return items;
  } catch (e) {
    logError('ProfessionalGrowth getItems', 'ProfessionalGrowthService', e);
    return [];
  }
}

/** إضافة سجل جديد */
export async function addItem(
  userId: string,
  type: GrowthType,
  title: string,
  imagePath: string | null
): Promise<ProfessionalGrowthItem | null> {
  try {
    const { data: maxData } = await supabase
      .from('professional_growth')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (maxData?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('professional_growth')
      .insert({
        user_id: userId,
        type,
        title: title || '',
        image_path: imagePath,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    const item = data as ProfessionalGrowthItem;
    if (item.image_path) {
      item.imageUri = (await getImageUrl(item.image_path)) || undefined;
    }
    return item;
  } catch (e) {
    logError('ProfessionalGrowth addItem', 'ProfessionalGrowthService', e);
    return null;
  }
}

/** تحديث سجل */
export async function updateItem(
  id: string,
  updates: { title?: string; image_path?: string | null }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('professional_growth')
      .update(updates)
      .eq('id', id);

    return !error;
  } catch (e) {
    logError('ProfessionalGrowth updateItem', 'ProfessionalGrowthService', e);
    return false;
  }
}

/** حذف سجل وصورته من Storage */
export async function deleteItem(id: string, imagePath: string | null): Promise<boolean> {
  try {
    if (imagePath) {
      await supabase.storage.from(BUCKET).remove([imagePath]);
    }
    const { error } = await supabase.from('professional_growth').delete().eq('id', id);
    return !error;
  } catch (e) {
    logError('ProfessionalGrowth deleteItem', 'ProfessionalGrowthService', e);
    return false;
  }
}

/** هل الـ URI محلي (يحتاج رفع)؟ */
function isLocalUri(uri: string): boolean {
  return !!(uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:') || uri.startsWith('data:')));
}

/** مزامنة القائمة الكاملة مع Supabase (استبدال) */
export async function syncItems(
  userId: string,
  items: Array<{
    id: string;
    type: GrowthType;
    title: string;
    imageUri: string;
    image_path?: string | null;
    attachmentKind?: GrowthAttachmentKind;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('professional_growth')
      .select('id, image_path')
      .eq('user_id', userId);
    for (const row of existing || []) {
      if (row.image_path) {
        await supabase.storage.from(BUCKET).remove([row.image_path]);
      }
    }
    const { error: delErr } = await supabase.from('professional_growth').delete().eq('user_id', userId);
    if (delErr) throw delErr;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let imagePath: string | null = item.image_path || null;
      if (isLocalUri(item.imageUri)) {
        const kind: GrowthAttachmentKind =
          item.attachmentKind === 'pdf' || item.imageUri.toLowerCase().includes('.pdf')
            ? 'pdf'
            : 'image';
        imagePath = await uploadGrowthAttachment(userId, item.imageUri, kind);
      }
      const { error: insErr } = await supabase.from('professional_growth').insert({
        user_id: userId,
        type: item.type,
        title: item.title || '',
        image_path: imagePath,
        sort_order: i,
      });
      if (insErr) throw insErr;
    }
    return { success: true };
  } catch (e) {
    logError('ProfessionalGrowth syncItems', 'ProfessionalGrowthService', e);
    return { success: false, error: e instanceof Error ? e.message : 'خطأ غير معروف' };
  }
}
