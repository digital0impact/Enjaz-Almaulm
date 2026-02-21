import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, Dimensions, View, ActivityIndicator, Linking, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '@/services/AuthService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { getTextDirection, formatRTLText, isRTL } from '@/utils/rtl-utils';
import { calculateOverallAverageFivePoint } from '@/utils/performance-five-point';

const { width } = Dimensions.get('window');

type Evidence = {
  name: string;
  available: boolean;
};

type PerformanceItem = {
  id: number | string;
  title: string;
  score: number;
  weight: number;
  category: string;
  evidence?: Evidence[];
};

export default function InteractiveReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedChart, setSelectedChart] = useState('evidence');
  const [performanceData, setPerformanceData] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  /** الملفات المرفقة للشواهد (مفتاح: محور-رقم_شاهد) لمعاينة الشاهد */
  const [uploadedFilesMap, setUploadedFilesMap] = useState<Record<string, { name: string; size: string; date: string; type: string; uri?: string }>>({});
  /** معاينة الصورة: URI المعروض وحالة ظهور الـ Modal */
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  // إضافة مستمع للتركيز على الصفحة باستخدام useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      // إعادة تحميل البيانات عند العودة إلى الصفحة
      loadPerformanceData();
    }, [])
  );

  // تحميل البيانات الفعلية من AsyncStorage
  useEffect(() => {
    loadPerformanceData();
  }, []);

  // إضافة مستمع لتغيير المهنة
  useEffect(() => {
    const checkProfessionChange = async () => {
      try {
        const basicData = await AsyncStorage.getItem('basicData');
        if (basicData) {
          const parsedBasicData = JSON.parse(basicData);
          const currentProfession = parsedBasicData.profession || 'معلم/ة';
          
          // التحقق من تغيير المهنة وإعادة تحميل البيانات إذا لزم الأمر
          const currentProfessionData = getDefaultPerformanceData(currentProfession);
          if (performanceData.length !== currentProfessionData.length) {
            console.log('Profession changed, reloading data...');
            loadPerformanceData();
          }
        }
      } catch (error) {
        console.log('Error checking profession change:', error);
      }
    };

    // فحص تغيير المهنة كل 3 ثانية (تقليل التكرار)
    const interval = setInterval(checkProfessionChange, 3000);
    return () => clearInterval(interval);
  }, [performanceData.length]);

  const loadPerformanceData = async () => {
    try {
      // تحميل البيانات الأساسية للحصول على المهنة
      const basicData = await AsyncStorage.getItem('basicData');
      let profession = 'معلم/ة';
      if (basicData) {
        const parsedBasicData = JSON.parse(basicData);
        profession = parsedBasicData.profession || 'معلم/ة';
      }

      // تحميل بيانات الأداء
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // التحقق من أن البيانات المحفوظة تتطابق مع المهنة الحالية
        const currentProfessionData = getDefaultPerformanceData(profession);
        
        if (Array.isArray(parsedData) && parsedData.length === currentProfessionData.length) {
          // إذا كانت البيانات المحفوظة تتطابق مع المهنة الحالية
          const normalizedData = parsedData.map(item => ({
            ...item,
            category: getCategoryByTitle(item.title, profession),
          }));
          setPerformanceData(normalizedData);
          console.log('Loaded performanceData from AsyncStorage:', normalizedData);
        } else {
          // إذا تغيرت المهنة أو كانت البيانات غير متطابقة، استخدم البيانات الجديدة
          setPerformanceData(currentProfessionData);
          console.log('Profession changed or data mismatch, using new profession data');
          // حفظ البيانات الجديدة
          await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
        }
      } else {
        // إذا لم تكن هناك بيانات محفوظة، استخدم البيانات حسب المهنة
        setPerformanceData(currentProfessionData);
        console.log('No data in AsyncStorage, using default data for profession:', profession);
        // حفظ البيانات الجديدة
        await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
      }

      // تحميل الملفات المرفقة للشواهد (للمعاينة)
      const storedFiles = await AsyncStorage.getItem('uploadedFiles');
      if (storedFiles) {
        try {
          const parsed = JSON.parse(storedFiles) as Record<string, { name: string; size: string; date: string; type: string; uri?: string }>;
          setUploadedFilesMap(typeof parsed === 'object' && parsed !== null ? parsed : {});
        } catch (_) {
          setUploadedFilesMap({});
        }
      } else {
        setUploadedFilesMap({});
      }

      setLoading(false);
    } catch (error) {
      console.log('Error loading performance data:', error);
      const fallbackData = getDefaultPerformanceData('معلم/ة');
      setPerformanceData(fallbackData);
      setUploadedFilesMap({});
      // حفظ البيانات الافتراضية في حالة الخطأ
      try {
        await AsyncStorage.setItem('performanceData', JSON.stringify(fallbackData));
      } catch (saveError) {
        console.log('Error saving fallback data:', saveError);
      }
      setLoading(false);
    }
  };

  const getCategoryByTitle = (title: string, profession: string) => {
    // تصنيف المحاور حسب المهنة - مطابق لصفحة الأداء المهني
    switch (profession) {
      case 'معلم/ة مسند له نشاط طلابي':
        // المحاور الوظيفية
        if (title.includes('أداء الواجبات الوظيفية') || title.includes('التفاعل مع المجتمع المهني') || title.includes('التفاعل مع أولياء الأمور')) {
          return 'وظيفي';
        }
        // المحاور التعليمية
        else if (title.includes('التنويع في استراتيجيات التدريس') || title.includes('تحسين نتائج المتعلمين') || 
                 title.includes('إعداد وتنفيذ خطة التعلم') || title.includes('توظيف تقنيات ووسائل التعلم المناسبة') ||
                 title.includes('تهيئة بيئة تعليمية') || title.includes('الإدارة الصفية') ||
                 title.includes('تحليل نتائج المتعلمين وتشخيص مستوياتهم') || title.includes('تنوع أساليب التقويم')) {
          return 'تعليمي';
        }
        // المحاور الخاصة بالنشاط الطلابي
        else if (title.includes('إعداد خطة مزمنة ومعتمدة لبرامج وفعاليات النشاط الطلابي') || 
                 title.includes('تهيئة البيئة المدرسية للبرامج والأنشطة الطلابية') ||
                 title.includes('يدعم المتعلمين وفق احتياجاتهم وميولهم للأنشطة') ||
                 title.includes('يحفز المتعلمين على المشاركة في الأنشطة المدرسية')) {
          return 'نشاط طلابي';
        }
        break;

      case 'معلم/ة مسند له توجيه صحي':
        // المحاور الوظيفية
        if (title.includes('أداء الواجبات الوظيفية') || title.includes('التفاعل مع المجتمع المهني') || title.includes('التفاعل مع أولياء الأمور')) {
          return 'وظيفي';
        }
        // المحاور التعليمية
        else if (title.includes('التنويع في استراتيجيات التدريس') || title.includes('تحسين نتائج المتعلمين') || 
                 title.includes('إعداد وتنفيذ خطة التعلم') || title.includes('توظيف تقنيات ووسائل التعلم المناسبة') ||
                 title.includes('تهيئة بيئة تعليمية') || title.includes('الإدارة الصفية') ||
                 title.includes('تحليل نتائج المتعلمين وتشخيص مستوياتهم') || title.includes('تنوع أساليب التقويم')) {
          return 'تعليمي';
        }
        // المحاور الصحية
        else if (title.includes('تنفيذ الخطة المشتركة للتوجيه الصحي') || 
                 title.includes('حصر الحالات الصحية وتصنيفها') ||
                 title.includes('تهيئة البيئة الصحية المدرسية') ||
                 title.includes('تنفيذ برامج التوعية الصحية') ||
                 title.includes('متابعة الحالات الصحية وتوثيقها')) {
          return 'صحي';
        }
        break;

      case 'الموجه/ه الطلابي':
        // المحاور الوظيفية
        if (title.includes('أداء الواجبات الوظيفية') || title.includes('التفاعل مع المجتمع المهني') || title.includes('التفاعل مع أولياء الأمور')) {
          return 'وظيفي';
        }
        // المحاور التوجيهية
        else if (title.includes('تعزيز الانضباط المدرسي') || title.includes('تعزيز دافعية التعلم') || 
                 title.includes('إعداد خطة لبرامج التوجيه الطلابي') ||
                 title.includes('تنفيذ برامج التوجيه الطلابي') ||
                 title.includes('متابعة وتقييم برامج التوجيه')) {
          return 'توجيه';
        }
        // المحاور الإرشادية
        else if (title.includes('يصنف الحالات الطلابية') || title.includes('يقدم التدخلات الإرشادية') || 
                 title.includes('يساعد المتعلمين في حل مشكلاتهم') ||
                 title.includes('يعد التقارير الإرشادية') ||
                 title.includes('يتعاون مع الجهات المختصة')) {
          return 'إرشاد';
        }
        break;

      case 'وكيل/ة المدرسة':
        // المحاور الوظيفية
        if (title.includes('أداء الواجبات الوظيفية') || title.includes('التفاعل مع المجتمع المهني') || title.includes('التفاعل مع أولياء الأمور')) {
          return 'وظيفي';
        }
        // المحاور الإدارية
        else if (title.includes('يدير الموارد المدرسية') || title.includes('يقيم أداء منسوبي المدرسة') || 
                 title.includes('يتابع تنفيذ الخطط والبرامج') ||
                 title.includes('يدير الشؤون المالية والإدارية') ||
                 title.includes('يتابع الأمن والسلامة المدرسية')) {
          return 'إداري';
        }
        // المحاور التطويرية
        else if (title.includes('يدعم تنفيذ برامج التطوير') || title.includes('يعد خطة للتطوير المهني') || 
                 title.includes('يشارك في إعداد خطة المدرسة الاستراتيجية') ||
                 title.includes('يتابع تطبيق المعايير المهنية') ||
                 title.includes('يدعم المبادرات التطويرية')) {
          return 'تطويري';
        }
        // المحاور التربوية
        else if (title.includes('يتابع تعزيز السلوك الإيجابي') || title.includes('يبني بيئة مدرسية محفزة') || 
                 title.includes('يدعم الأنشطة الطلابية') ||
                 title.includes('يتابع تطبيق السياسات التربوية')) {
          return 'تربوي';
        }
        break;

      case 'مدير/ة المدرسة':
        // المحاور الوظيفية
        if (title.includes('أداء الواجبات الوظيفية') || title.includes('التفاعل مع المجتمع المهني') || title.includes('التفاعل مع أولياء الأمور')) {
          return 'وظيفي';
        }
        // المحاور الإدارية
        else if (title.includes('يدير الموارد المدرسية') || title.includes('يقيم أداء منسوبي المدرسة') || 
                 title.includes('يتابع تنفيذ الخطط والبرامج') ||
                 title.includes('يدير الشؤون المالية والإدارية') ||
                 title.includes('يتابع الأمن والسلامة المدرسية')) {
          return 'إداري';
        }
        // المحاور التطويرية
        else if (title.includes('يدعم تنفيذ برامج التطوير') || title.includes('يعد خطة للتطوير المهني') || 
                 title.includes('يشارك في إعداد خطة المدرسة الاستراتيجية') ||
                 title.includes('يتابع تطبيق المعايير المهنية') ||
                 title.includes('يدعم المبادرات التطويرية')) {
          return 'تطويري';
        }
        // المحاور التربوية
        else if (title.includes('يتابع تعزيز السلوك الإيجابي') || title.includes('يبني بيئة مدرسية محفزة') || 
                 title.includes('يدعم الأنشطة الطلابية') ||
                 title.includes('يتابع تطبيق السياسات التربوية')) {
          return 'تربوي';
        }
        break;

      case 'الجدارات الوظيفية العامة (المشتركة)':
        return 'جدارات مشتركة';

      case 'الجدارات الوظيفية القيادية':
        if (title.includes('قيادة التغيير') || title.includes('تطوير وتمكين الموظفين') || 
            title.includes('التوجه الاستراتيجي') || title.includes('اتخاذ القرارات')) {
          return 'جدارات قيادية';
        }
        return 'جدارات مشتركة';

      default: // معلم/ة عادي
        // المحاور الوظيفية
        if (title.includes('أداء الواجبات الوظيفية') || title.includes('التفاعل مع المجتمع المهني') || title.includes('التفاعل مع أولياء الأمور')) {
          return 'وظيفي';
        }
        // المحاور التعليمية
        else if (title.includes('التنويع في استراتيجيات التدريس') || title.includes('تحسين نتائج المتعلمين') || 
                 title.includes('إعداد وتنفيذ خطة التعلم') || title.includes('توظيف تقنيات ووسائل التعلم المناسبة') ||
                 title.includes('تهيئة بيئة تعليمية') || title.includes('الإدارة الصفية') ||
                 title.includes('تحليل نتائج المتعلمين وتشخيص مستوياتهم') || title.includes('تنوع أساليب التقويم')) {
          return 'تعليمي';
        }
        break;
    }
    return 'غير محدد';
  };

  const getDefaultPerformanceData = (profession: string) => {
    // هيكل المحاور فقط (درجة 0) — البيانات الحقيقية تُحمّل من AsyncStorage من صفحة الأداء المهني
    switch (profession) {
      case 'معلم/ة مسند له نشاط طلابي':
        return [
          {
            id: 1,
            title: 'أداء الواجبات الوظيفية',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 2,
            title: 'التفاعل مع المجتمع المهني',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 3,
            title: 'التفاعل مع أولياء الأمور',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 4,
            title: 'التنويع في استراتيجيات التدريس',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 5,
            title: 'تحسين نتائج المتعلمين',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 6,
            title: 'إعداد وتنفيذ خطة التعلم',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 7,
            title: 'توظيف تقنيات ووسائل التعلم المناسبة',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 8,
            title: 'تهيئة بيئة تعليمية',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 9,
            title: 'الإدارة الصفية',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 10,
            title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 11,
            title: 'تنوع أساليب التقويم',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 12,
            title: 'إعداد خطة مزمنة ومعتمدة لبرامج وفعاليات النشاط الطلابي',
            score: 0,
            weight: 10,
            category: 'نشاط طلابي'
          },
          {
            id: 13,
            title: 'تهيئة البيئة المدرسية للبرامج والأنشطة الطلابية',
            score: 0,
            weight: 5,
            category: 'نشاط طلابي'
          },
          {
            id: 14,
            title: 'يدعم المتعلمين وفق احتياجاتهم وميولهم للأنشطة',
            score: 0,
            weight: 5,
            category: 'نشاط طلابي'
          },
          {
            id: 15,
            title: 'يحفز المتعلمين على المشاركة في الأنشطة المدرسية',
            score: 0,
            weight: 10,
            category: 'نشاط طلابي'
          }
        ];

      case 'معلم/ة مسند له توجيه صحي':
        return [
          {
            id: 1,
            title: 'أداء الواجبات الوظيفية',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 2,
            title: 'التفاعل مع المجتمع المهني',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 3,
            title: 'التفاعل مع أولياء الأمور',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 4,
            title: 'التنويع في استراتيجيات التدريس',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 5,
            title: 'تحسين نتائج المتعلمين',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 6,
            title: 'إعداد وتنفيذ خطة التعلم',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 7,
            title: 'توظيف تقنيات ووسائل التعلم المناسبة',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 8,
            title: 'تهيئة بيئة تعليمية',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 9,
            title: 'الإدارة الصفية',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 10,
            title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 11,
            title: 'تنوع أساليب التقويم',
            score: 0,
            weight: 5,
            category: 'تعليمي'
          },
          {
            id: 12,
            title: 'تنفيذ الخطة المشتركة للتوجيه الصحي',
            score: 0,
            weight: 10,
            category: 'صحي'
          },
          {
            id: 13,
            title: 'حصر الحالات الصحية وتصنيفها',
            score: 0,
            weight: 5,
            category: 'صحي'
          },
          {
            id: 14,
            title: 'تهيئة البيئة الصحية المدرسية',
            score: 0,
            weight: 5,
            category: 'صحي'
          },
          {
            id: 15,
            title: 'تنفيذ برامج التوعية الصحية',
            score: 0,
            weight: 5,
            category: 'صحي'
          },
          {
            id: 16,
            title: 'متابعة الحالات الصحية وتوثيقها',
            score: 0,
            weight: 5,
            category: 'صحي'
          }
        ];

      case 'الموجه/ه الطلابي':
        return [
          {
            id: 1,
            title: 'أداء الواجبات الوظيفية',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 2,
            title: 'التفاعل مع المجتمع المهني',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 3,
            title: 'التفاعل مع أولياء الأمور',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 4,
            title: 'تعزيز الانضباط المدرسي',
            score: 0,
            weight: 10,
            category: 'توجيه'
          },
          {
            id: 5,
            title: 'تعزيز دافعية التعلم',
            score: 0,
            weight: 10,
            category: 'توجيه'
          },
          {
            id: 6,
            title: 'إعداد خطة لبرامج التوجيه الطلابي',
            score: 0,
            weight: 10,
            category: 'توجيه'
          },
          {
            id: 7,
            title: 'تنفيذ برامج التوجيه الطلابي',
            score: 0,
            weight: 10,
            category: 'توجيه'
          },
          {
            id: 8,
            title: 'متابعة وتقييم برامج التوجيه',
            score: 0,
            weight: 10,
            category: 'توجيه'
          },
          {
            id: 9,
            title: 'يصنف الحالات الطلابية',
            score: 0,
            weight: 10,
            category: 'إرشاد'
          },
          {
            id: 10,
            title: 'يقدم التدخلات الإرشادية',
            score: 0,
            weight: 10,
            category: 'إرشاد'
          },
          {
            id: 11,
            title: 'يساعد المتعلمين في حل مشكلاتهم',
            score: 0,
            weight: 10,
            category: 'إرشاد'
          },
          {
            id: 12,
            title: 'يعد التقارير الإرشادية',
            score: 0,
            weight: 10,
            category: 'إرشاد'
          },
          {
            id: 13,
            title: 'يتعاون مع الجهات المختصة',
            score: 0,
            weight: 10,
            category: 'إرشاد'
          }
        ];

      case 'وكيل/ة المدرسة':
        return [
          {
            id: 1,
            title: 'أداء الواجبات الوظيفية',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 2,
            title: 'التفاعل مع المجتمع المهني',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 3,
            title: 'التفاعل مع أولياء الأمور',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 4,
            title: 'يدير الموارد المدرسية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 5,
            title: 'يقيم أداء منسوبي المدرسة',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 6,
            title: 'يتابع تنفيذ الخطط والبرامج',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 7,
            title: 'يدير الشؤون المالية والإدارية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 8,
            title: 'يتابع الأمن والسلامة المدرسية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 9,
            title: 'يدعم تنفيذ برامج التطوير',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 10,
            title: 'يعد خطة للتطوير المهني',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 11,
            title: 'يشارك في إعداد خطة المدرسة الاستراتيجية',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 12,
            title: 'يتابع تطبيق المعايير المهنية',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 13,
            title: 'يدعم المبادرات التطويرية',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 14,
            title: 'يتابع تعزيز السلوك الإيجابي',
            score: 0,
            weight: 10,
            category: 'تربوي'
          },
          {
            id: 15,
            title: 'يبني بيئة مدرسية محفزة',
            score: 0,
            weight: 10,
            category: 'تربوي'
          },
          {
            id: 16,
            title: 'يدعم الأنشطة الطلابية',
            score: 0,
            weight: 10,
            category: 'تربوي'
          },
          {
            id: 17,
            title: 'يتابع تطبيق السياسات التربوية',
            score: 0,
            weight: 10,
            category: 'تربوي'
          }
        ];

      case 'مدير/ة المدرسة':
        return [
          {
            id: 1,
            title: 'أداء الواجبات الوظيفية',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 2,
            title: 'التفاعل مع المجتمع المهني',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 3,
            title: 'التفاعل مع أولياء الأمور',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 4,
            title: 'يدير الموارد المدرسية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 5,
            title: 'يقيم أداء منسوبي المدرسة',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 6,
            title: 'يتابع تنفيذ الخطط والبرامج',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 7,
            title: 'يدير الشؤون المالية والإدارية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 8,
            title: 'يتابع الأمن والسلامة المدرسية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 9,
            title: 'يدعم تنفيذ برامج التطوير',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 10,
            title: 'يعد خطة للتطوير المهني',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 11,
            title: 'يشارك في إعداد خطة المدرسة الاستراتيجية',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 12,
            title: 'يتابع تطبيق المعايير المهنية',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 13,
            title: 'يدعم المبادرات التطويرية',
            score: 0,
            weight: 10,
            category: 'تطويري'
          },
          {
            id: 14,
            title: 'يتابع تعزيز السلوك الإيجابي',
            score: 0,
            weight: 10,
            category: 'تربوي'
          },
          {
            id: 15,
            title: 'يبني بيئة مدرسية محفزة',
            score: 0,
            weight: 10,
            category: 'تربوي'
          },
          {
            id: 16,
            title: 'يدعم الأنشطة الطلابية',
            score: 0,
            weight: 10,
            category: 'تربوي'
          },
          {
            id: 17,
            title: 'يتابع تطبيق السياسات التربوية',
            score: 0,
            weight: 10,
            category: 'تربوي'
          }
        ];

      case 'الجدارات الوظيفية العامة (المشتركة)':
        return [
          { id: 1, title: 'المسؤولية', score: 0, weight: 20, category: 'جدارات مشتركة' },
          { id: 2, title: 'العمل الجماعي', score: 0, weight: 25, category: 'جدارات مشتركة' },
          { id: 3, title: 'المرونة للتغيير', score: 0, weight: 30, category: 'جدارات مشتركة' },
          { id: 4, title: 'المبادرة', score: 0, weight: 25, category: 'جدارات مشتركة' },
        ];

      case 'الجدارات الوظيفية القيادية':
        return [
          { id: 1, title: 'المسؤولية', score: 0, weight: 15, category: 'جدارات مشتركة' },
          { id: 2, title: 'العمل الجماعي', score: 0, weight: 10, category: 'جدارات مشتركة' },
          { id: 3, title: 'المرونة للتغيير', score: 0, weight: 10, category: 'جدارات مشتركة' },
          { id: 4, title: 'المبادرة', score: 0, weight: 10, category: 'جدارات مشتركة' },
          { id: 5, title: 'قيادة التغيير', score: 0, weight: 20, category: 'جدارات قيادية' },
          { id: 6, title: 'تطوير وتمكين الموظفين', score: 0, weight: 10, category: 'جدارات قيادية' },
          { id: 7, title: 'التوجه الاستراتيجي', score: 0, weight: 10, category: 'جدارات قيادية' },
          { id: 8, title: 'اتخاذ القرارات', score: 0, weight: 15, category: 'جدارات قيادية' },
        ];

      default: // معلم/ة عادي
        return [
          {
            id: 1,
            title: 'أداء الواجبات الوظيفية',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 2,
            title: 'التفاعل مع المجتمع المهني',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 3,
            title: 'التفاعل مع أولياء الأمور',
            score: 0,
            weight: 10,
            category: 'وظيفي'
          },
          {
            id: 4,
            title: 'التنويع في استراتيجيات التدريس',
            score: 0,
            weight: 10,
            category: 'تعليمي'
          },
          {
            id: 5,
            title: 'تحسين نتائج المتعلمين',
            score: 0,
            weight: 10,
            category: 'تعليمي'
          },
          {
            id: 6,
            title: 'إعداد خطة وتنفيذ التعلم',
            score: 0,
            weight: 10,
            category: 'تخطيطي'
          },
          {
            id: 7,
            title: 'توظيف تقنيات ووسائل التعلم',
            score: 0,
            weight: 10,
            category: 'تخطيطي'
          },
          {
            id: 8,
            title: 'تهيئة البيئة التعليمية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 9,
            title: 'الإدارة الصفية',
            score: 0,
            weight: 10,
            category: 'إداري'
          },
          {
            id: 10,
            title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
            score: 0,
            weight: 5,
            category: 'تقويمي'
          },
          {
            id: 11,
            title: 'تنوع أساليب التقويم',
            score: 0,
            weight: 5,
            category: 'تقويمي'
          }
        ];
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4CAF50';
    if (score >= 80) return '#FF9800';
    if (score >= 70) return '#FFC107';
    return '#F44336';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    return 'يحتاج تحسين';
  };

  const calculateOverallAverage = () => {
    if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) return 0;
    const items = performanceData.map(item => ({ score: item?.score ?? 0, weight: item?.weight ?? 0 }));
    const hasAnyScore = items.some(item => item.score > 0);
    if (!hasAnyScore) return 0;
    return calculateOverallAverageFivePoint(items);
  };

  const getCategoryAverage = (category: string) => {
    if (!category || !performanceData || !Array.isArray(performanceData) || performanceData.length === 0) {
      return 0;
    }
    
    const categoryItems = performanceData.filter(item => item?.category === category);
    if (categoryItems.length === 0) return 0;
    const sum = categoryItems.reduce((acc, item) => acc + (item?.score || 0), 0);
    return Math.round(sum / categoryItems.length);
  };

  type FileInfo = {
    name: string;
    size: string;
    type: string;
    date: string;
  };

  type UploadedFiles = {
    [key: string]: FileInfo[];
  };

  type Category = {
    name: string;
    average: number;
    count: number;
  };

  const getCategories = (): Category[] => {
    if (!performanceData || !Array.isArray(performanceData) || performanceData.length === 0) {
      return [];
    }
    
    // استخدام عناوين المحاور بدلاً من الفئات
    return performanceData.map(item => ({
      name: item?.title || 'غير محدد',
      average: item?.score || 0,
      count: 1
    })).filter(cat => cat && cat.name);
  };

  const renderProgressChart = () => {
    const sortedData = [...performanceData].sort((a: PerformanceItem, b: PerformanceItem) => b.score - a.score);
    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>ترتيب المحاور حسب الأداء</ThemedText>
        <ThemedView>
          {sortedData.map((item: PerformanceItem, index: number) => (
            <ThemedView key={item.id} style={{ marginBottom: 8 }}>
              <ThemedView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <ThemedText style={{ fontSize: 12, fontWeight: 'bold' }}>{item.title}</ThemedText>
                <ThemedText style={{ fontSize: 12, color: getScoreColor(item.score) }}>{item.score}%</ThemedText>
              </ThemedView>
              <ThemedView style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                <ThemedView 
                  style={{ 
                    height: '100%', 
                    backgroundColor: getScoreColor(item.score),
                    width: `${Math.min(100, item.score)}%`,
                    borderRadius: 10
                  }} 
                />
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    );
  };

  const renderEvidence = () => {
    const itemsWithEvidence = performanceData.filter(
      (item) => item.evidence && item.evidence.length > 0
    );

    if (itemsWithEvidence.length === 0) {
      return (
        <ThemedView style={styles.evidenceContainer}>
          <ThemedText style={styles.sectionTitle}>الشواهد - محاور الأداء المهني</ThemedText>
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              لا توجد شواهد مُدخلة في محاور الأداء المهني. أضف الشواهد من تبويب محاور الأداء المهني.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }

    return (
      <ThemedView style={styles.evidenceContainer}>
        <ThemedText style={styles.sectionTitle}>الشواهد - محاور الأداء المهني</ThemedText>
        <ThemedText style={styles.evidenceIntro}>
          الشواهد المُدخلة في كل محور من محاور الأداء المهني:
        </ThemedText>
        <ScrollView
          style={styles.evidenceScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {itemsWithEvidence.map((item) => (
            <ThemedView key={String(item.id)} style={styles.evidenceAxisCard}>
              <ThemedText style={styles.evidenceAxisTitle}>{item.title}</ThemedText>
              <ThemedView style={styles.evidenceList}>
                {(item.evidence || []).map((ev, idx) => {
                  const fileKey = `${item.id}-${idx}`;
                  const file = uploadedFilesMap[fileKey];
                  const canPreview = ev.available && file?.uri;
                  const isImage = file?.type === 'صورة';
                  return (
                    <ThemedView key={idx} style={styles.evidenceRow}>
                      <ThemedView style={styles.evidenceRowContent}>
                        <ThemedText style={styles.evidenceName}>{ev.name}</ThemedText>
                      </ThemedView>
                      <ThemedView style={styles.evidenceRowBadge}>
                        <ThemedView
                          style={[
                            styles.evidenceBadge,
                            ev.available ? styles.evidenceBadgeAvailable : styles.evidenceBadgeUnavailable,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.evidenceBadgeText,
                              ev.available ? styles.evidenceBadgeTextAvailable : styles.evidenceBadgeTextUnavailable,
                            ]}
                          >
                            {ev.available ? 'متوفر' : 'غير متوفر'}
                          </ThemedText>
                        </ThemedView>
                        {canPreview && (
                          <TouchableOpacity
                            style={styles.evidencePreviewButton}
                            onPress={() => {
                              if (isImage) {
                                setPreviewImageUri(file.uri!);
                                setPreviewVisible(true);
                              } else {
                                Linking.openURL(file.uri!).catch(() =>
                                  Alert.alert('لا يمكن فتح الملف', 'المعاينة غير متاحة لهذا النوع على هذا الجهاز.')
                                );
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <IconSymbol size={16} name="eye.fill" color="#1c1f33" />
                            <ThemedText style={styles.evidencePreviewButtonText}>معاينة</ThemedText>
                          </TouchableOpacity>
                        )}
                      </ThemedView>
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </ThemedView>
          ))}
        </ScrollView>
      </ThemedView>
    );
  };

  const renderCategoriesChart = () => {
    const categories = getCategories();
    const screenWidth = Dimensions.get('window').width - 40;
    const minBarWidth = 80; // عرض أدنى لكل عمود
    const chartWidth = Math.max(screenWidth, categories.length * minBarWidth);

    // التأكد من وجود بيانات
    if (!categories || categories.length === 0) {
      return (
        <ThemedView style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>لا توجد بيانات متاحة للعرض</ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }

    // التأكد من أن البيانات صحيحة
    const validCategories = categories.filter(cat => cat && cat.name && typeof cat.average === 'number');
    
    if (validCategories.length === 0) {
      return (
        <ThemedView style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>البيانات غير صحيحة</ThemedText>
          </ThemedView>
        </ThemedView>
      );
    }

    const data = {
      labels: validCategories.map(cat => {
        const name = String(cat.name || 'غير محدد');
        // تقصير العناوين أكثر لأندرويد
        return name.length > 6 ? name.substring(0, 6) + '...' : name;
      }),
      datasets: [
        {
          data: validCategories.map(cat => Math.max(0, cat.average || 0)),
        }
      ]
    };

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1, index?: number) => {
        const score = index !== undefined ? validCategories[index]?.average || 0 : 0;
        const color = getScoreColor(score);
        // تحويل اللون إلى rgba
        switch (color) {
          case '#4CAF50': return `rgba(76, 175, 80, ${opacity})`; // أخضر
          case '#FF9800': return `rgba(255, 152, 0, ${opacity})`; // برتقالي
          case '#FFC107': return `rgba(255, 193, 7, ${opacity})`; // أصفر
          case '#F44336': return `rgba(244, 67, 54, ${opacity})`; // أحمر
          default: return `rgba(33, 150, 243, ${opacity})`; // لون افتراضي
        }
      },
      labelColor: (opacity = 1) => `rgba(28, 31, 51, ${opacity})`,
      style: {
        borderRadius: 16
      },
      barPercentage: 0.6,
      propsForBackgroundLines: {
        strokeDasharray: '',
        stroke: 'rgba(0, 0, 0, 0.1)',
        strokeWidth: 1,
      },
      propsForLabels: {
        fontSize: 9,
        fontWeight: 'bold',
        fill: '#1c1f33',
      },
      propsForVerticalLabels: {
        fontSize: 9,
        fontWeight: 'bold',
        fill: '#1c1f33',
      },
      propsForValues: {
        fontSize: 11,
        fontWeight: 'bold',
        fill: '#1c1f33',
      },
    };



    return (
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>توزيع محاور الأداء المهني</ThemedText>

        {/* محاولة عرض الرسم البياني مع معالجة خاصة لأندرويد */}
        {Platform.OS === 'android' ? (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            indicatorStyle="black"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ marginVertical: 10 }}
          >
            <BarChart
              // @ts-ignore
              data={data}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              fromZero={true}
              showBarTops={true}
              showValuesOnTopOfBars={true}
              withInnerLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={5}
              yAxisLabel=""
              yAxisSuffix=""
              yLabelsOffset={10}
              xLabelsOffset={-10}
            />
          </ScrollView>
                ) : (
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            indicatorStyle="black"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ marginVertical: 10 }}
          >
            <BarChart
              // @ts-ignore
              data={data}
              width={chartWidth}
              height={280}
              chartConfig={chartConfig}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              fromZero={true}
              showBarTops={true}
              showValuesOnTopOfBars={true}
              withInnerLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={5}
              yAxisLabel=""
              yAxisSuffix=""
              yLabelsOffset={10}
              xLabelsOffset={-10}
            />
          </ScrollView>
        )}


        

      </ThemedView>
    );
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'evidence':
        return renderEvidence();
      case 'overall':
        return renderProgressChart();
      case 'categories':
        return renderCategoriesChart();
      default:
        return renderEvidence();
    }
  };

  type ReportData = {
    performanceId: number;
    evidenceIndex: number;
    evidence: Evidence[];
    files: FileInfo[];
  };

  type ReportItem = {
    id: number;
    title: string;
    score: number;
    weight: number;
    evidence: Evidence[];
  };

  const generateReportHTML = async () => {
    // تحميل شعار الوزارة للتقرير المصدر (PDF) — على الويب لا نستخدم expo-asset/FileSystem
    let logoDataUri = 'https://i.ibb.co/7XqJqK7/moe-logo.png';
    if (Platform.OS !== 'web') {
      try {
        const Asset = require('expo-asset').Asset;
        const asset = Asset.fromModule(require('@/assets/images/moe_logo.png'));
        await asset.downloadAsync();
        if (asset.localUri) {
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
          if (base64) logoDataUri = `data:image/png;base64,${base64}`;
        }
      } catch (_) {
        // الإبقاء على الرابط الافتراضي إن فشل تحميل الأصل المحلي
      }
    }

    // تحميل البيانات الشخصية والمهنية
    let userData = {
      fullName: 'غير محدد',
      profession: 'غير محدد',
      specialty: 'غير محدد',
      experience: 'غير محدد',
      education: 'غير محدد',
      school: 'غير محدد',
      educationDepartment: 'غير محدد',
      gradeLevel: 'غير محدد',
      vision: 'غير محدد',
      mission: 'غير محدد',
      email: 'غير محدد',
      phone: 'غير محدد'
    };

    // تحميل الشواهد المرفقة
    let uploadedFiles: UploadedFiles = {};
    let performanceDataWithEvidence: ReportItem[] = [];

    try {
      const storedData = await AsyncStorage.getItem('basicData');
      if (storedData) {
        userData = { ...userData, ...JSON.parse(storedData) };
      }

      // تحميل بيانات الأداء مع الشواهد
      const storedPerformanceData = await AsyncStorage.getItem('performanceData');
      if (storedPerformanceData) {
        performanceDataWithEvidence = JSON.parse(storedPerformanceData);
      }

      // تحميل الملفات المرفقة
      const storedFiles = await AsyncStorage.getItem('uploadedFiles');
      if (storedFiles) {
        uploadedFiles = JSON.parse(storedFiles);
      }
    } catch (error) {
      console.log('Error loading data for report:', error);
    }

    // استخدام البيانات المحفوظة فعلياً للإحصائيات والتوصيات في التقرير المصدر
    const reportData = Array.isArray(performanceDataWithEvidence) && performanceDataWithEvidence.length > 0
      ? performanceDataWithEvidence
      : performanceData;
    const reportScores = reportData.map((item: { score?: number }) => Number(item?.score ?? 0));
    const reportItems = reportData.map((item: ReportItem) => ({
      ...item,
      score: Number(item?.score ?? 0),
    }));
    const hasAnyScore = reportItems.some(item => item.score > 0);
    const reportAverageScore = hasAnyScore
      ? calculateOverallAverageFivePoint(reportItems.map(item => ({ score: item.score, weight: item?.weight ?? 0 })))
      : 0;
    const reportCategories = reportItems.map(item => ({
      name: item?.title || 'غير محدد',
      average: item.score,
      count: 1,
    })).filter(cat => cat && cat.name);
    const maxScore = Math.max(...reportScores, 0);
    const minScore = reportScores.length ? Math.min(...reportScores) : 0;
    const excellentCount = reportScores.filter(s => s >= 90).length;
    const goodCount = reportScores.filter(s => s >= 80 && s < 90).length;
    const needsImprovementCount = reportScores.filter(s => s < 70).length;
    const needsImprovementItems = reportItems
      .filter(item => item.score < 85)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>التقرير التفاعلي للأداء المهني</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1c1f33;
        }
        .logo-section {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
        }
        .logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .ministry-info {
          text-align: center;
        }
        .ministry-title {
          font-size: 24px;
          font-weight: bold;
          color: #1c1f33;
          margin: 0;
        }
        .ministry-subtitle {
          font-size: 16px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .header h1 {
          color: #1c1f33;
          font-size: 28px;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 16px;
        }
        .personal-info-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 30px;
          border: 2px solid #dee2e6;
        }
        .personal-info-title {
          color: #1c1f33;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          border-bottom: 2px solid #1c1f33;
          padding-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 15px;
          background: white;
          border-radius: 8px;
          border-right: 4px solid #add4ce;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-label {
          font-weight: bold;
          color: #666;
          font-size: 14px;
        }
        .info-value {
          color: #333;
          font-size: 14px;
          max-width: 200px;
          text-align: left;
        }

        .summary-section {
          background: linear-gradient(135deg, #add4ce 0%, #e1f5f4 100%);
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 30px;
          text-align: center;
        }
        .summary-row {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 32px;
          font-weight: bold;
          color: ${getScoreColor(reportAverageScore)};
          margin-bottom: 5px;
        }
        .summary-label {
          font-size: 14px;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 2px solid #e9ecef;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin: 10px 0;
        }
        .stat-label {
          font-size: 14px;
          color: #666;
        }
        .categories-section {
          margin: 30px 0;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin-bottom: 10px;
          background: #f8f9fa;
          border-radius: 10px;
          border-right: 5px solid ${getScoreColor(reportAverageScore)};
        }
        .category-name {
          font-weight: bold;
          color: #333;
        }
        .category-score {
          font-weight: bold;
          font-size: 18px;
        }
        .performance-list {
          margin-top: 30px;
        }
        .performance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border-radius: 8px;
          border-right: 4px solid #ddd;
        }
        .recommendations {
          background: #fff8e1;
          padding: 25px;
          border-radius: 15px;
          margin-top: 30px;
          border-right: 5px solid #ff9800;
        }
        .recommendations h3 {
          color: #333;
          margin-bottom: 15px;
        }
        .recommendation-item {
          margin-bottom: 10px;
          padding: 10px;
          background: rgba(255, 152, 0, 0.1);
          border-radius: 8px;
        }
        .evidence-section {
          background: #f0f8ff;
          padding: 25px;
          border-radius: 15px;
          margin-top: 30px;
          border-right: 5px solid #4A90E2;
        }
        .evidence-section h3 {
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }
        .performance-evidence {
          margin-bottom: 25px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e1f5fe;
        }
        .performance-evidence h4 {
          color: #1c1f33;
          margin-bottom: 15px;
          border-bottom: 2px solid #4A90E2;
          padding-bottom: 8px;
        }
        .evidence-list {
          margin-left: 20px;
        }
        .evidence-item {
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border-right: 3px solid #4A90E2;
        }
        .evidence-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        .evidence-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .evidence-available {
          background: #4CAF50;
          color: white;
        }
        .evidence-unavailable {
          background: #F44336;
          color: white;
        }
        .evidence-files {
          margin-top: 10px;
        }
        .file-item {
          display: flex;
          align-items: center;
          padding: 8px;
          background: #e3f2fd;
          border-radius: 6px;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .file-icon {
          margin-left: 8px;
          font-size: 16px;
        }
        .file-info {
          flex: 1;
        }
        .file-name {
          font-weight: bold;
          color: #1976d2;
        }
        .file-details {
          color: #666;
          font-size: 11px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          color: #666;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            <img src="${logoDataUri}" alt="شعار وزارة التعليم" class="logo">
            <div class="ministry-info">
              <h2 class="ministry-title">المملكة العربية السعودية</h2>
              <p class="ministry-subtitle">وزارة التعليم</p>
            </div>
          </div>
          <h1>📊 التقرير التفاعلي للأداء المهني</h1>
          <p>تحليل شامل لأداءك المهني مع مؤشرات تفاعلية</p>
          <p><strong>المهنة:</strong> ${userData.profession}</p>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <div class="personal-info-section">
          <h3 class="personal-info-title">البيانات الشخصية والمهنية</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">الاسم الكامل:</span>
              <span class="info-value">${userData.fullName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المهنة:</span>
              <span class="info-value">${userData.profession}</span>
            </div>
            <div class="info-item">
              <span class="info-label">التخصص:</span>
              <span class="info-value">${userData.specialty}</span>
            </div>
            <div class="info-item">
              <span class="info-label">سنوات الخبرة:</span>
              <span class="info-value">${userData.experience}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المؤهل العلمي:</span>
              <span class="info-value">${userData.education}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المدرسة:</span>
              <span class="info-value">${userData.school}</span>
            </div>
            <div class="info-item">
              <span class="info-label">الإدارة التعليمية:</span>
              <span class="info-value">${userData.educationDepartment}</span>
            </div>
            <div class="info-item">
              <span class="info-label">المرحلة الدراسية:</span>
              <span class="info-value">${userData.gradeLevel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">البريد الإلكتروني:</span>
              <span class="info-value">${userData.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">رقم الهاتف:</span>
              <span class="info-value">${userData.phone}</span>
            </div>
          </div>
        </div>



        <div class="summary-section">
          <h2>ملخص الأداء العام - ${userData.profession}</h2>
          <div class="summary-row">
            <div class="summary-item">
              <div class="summary-value">${reportAverageScore}%</div>
              <div class="summary-label">المتوسط العام</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${getScoreLevel(reportAverageScore)}</div>
              <div class="summary-label">مستوى الأداء</div>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${maxScore}%</div>
            <div class="stat-label">أعلى درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${minScore}%</div>
            <div class="stat-label">أقل درجة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${excellentCount}</div>
            <div class="stat-label">محاور ممتازة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${goodCount}</div>
            <div class="stat-label">محاور جيدة</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${needsImprovementCount}</div>
            <div class="stat-label">تحتاج تحسين</div>
          </div>
        </div>

        <div class="categories-section">
          <h3>متوسط الدرجات حسب الفئة - ${userData.profession}</h3>
          ${reportCategories.map(category => `
            <div class="category-item">
              <span class="category-name">${category.name}</span>
              <span class="category-score" style="color: ${getScoreColor(category.average)}">${category.average}%</span>
            </div>
          `).join('')}
        </div>

        <div class="page-break"></div>

        <div class="performance-list">
          <h3>تفاصيل جميع المحاور - ${userData.profession}</h3>
          ${reportItems
            .sort((a, b) => b.score - a.score)
            .map((item, index) => `
              <div class="performance-item">
                <span>${index + 1}. ${item.title}</span>
                <span style="color: ${getScoreColor(item.score)}; font-weight: bold;">${item.score}%</span>
              </div>
            `).join('')}
        </div>

        <div class="recommendations">
          <h3>🔍 توصيات للتحسين - ${userData.profession}</h3>
          ${needsImprovementItems
            .map(item => `
              <div class="recommendation-item">
                • ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.score}%)
              </div>
            `).join('')}
          ${needsImprovementItems.length === 0 ?
            '<div class="recommendation-item">• ممتاز! جميع المحاور تحصل على درجات عالية. استمر في الأداء المتميز.</div>' : ''}
        </div>

        <div class="page-break"></div>

        <div class="evidence-section">
          <h3>📎 الشواهد المرفقة - ${userData.profession}</h3>
          ${performanceDataWithEvidence.length > 0 ? 
            performanceDataWithEvidence
              .filter((item: ReportItem) => item.evidence && item.evidence.length > 0)
              .map((item: ReportItem, index: number) => `
                <div class="performance-evidence">
                  <h4>${index + 1}. ${item.title}</h4>
                  <div class="evidence-list">
                    ${item.evidence.map((evidence: Evidence, evidenceIndex: number) => {
                      const fileKey = `${item.id}_${evidenceIndex}`;
                      const files = uploadedFiles[fileKey] || [];
                      return `
                        <div class="evidence-item">
                          <div class="evidence-name">${evidence.name}</div>
                          <div class="evidence-status ${evidence.available ? 'evidence-available' : 'evidence-unavailable'}">
                            ${evidence.available ? 'متوفر' : 'غير متوفر'}
                          </div>
                          ${files.length > 0 ? `
                            <div class="evidence-files">
                              <strong>الملفات المرفقة:</strong>
                              ${files.map((file: FileInfo) => `
                                <div class="file-item">
                                  <span class="file-icon">📎</span>
                                  <div class="file-info">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-details">${file.size} • ${file.type} • ${file.date}</div>
                                  </div>
                                </div>
                              `).join('')}
                            </div>
                          ` : '<div class="evidence-files"><em>لا توجد ملفات مرفقة</em></div>'}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('') : 
            '<div class="performance-evidence"><p>لا توجد شواهد مرفقة حالياً</p></div>'
          }
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام تقييم الأداء المهني</p>
          <p>© ${new Date().getFullYear()} - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  /** على الويب: تحميل التقرير كملف HTML دون الاعتماد على النوافذ المنبثقة */
  const webDownloadReport = (htmlContent: string) => {
    if (typeof document === 'undefined') return;
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_الأداء_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  };

  // على الويب Alert.alert غير مدعوم — نستخدم window.alert/confirm حتى تظهر التنبيهات ونافذة الطباعة
  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: string }>
  ) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert([title, message].filter(Boolean).join('\n\n'));
      const action = buttons?.find((b) => b.onPress);
      if (action && window.confirm(action.text + '؟')) action.onPress?.();
      return;
    }
    Alert.alert(title, message, buttons);
  };

  const openReportForPrint = async () => {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    try {
      const htmlContent = await generateReportHTML();
      if (isWeb) {
        webDownloadReport(htmlContent);
        showAlert(
          formatRTLText('تم تحميل التقرير'),
          formatRTLText('تم تحميل ملف التقرير. افتح الملف من مجلد التحميلات واختر من المتصفح «طباعة» ثم «حفظ كـ PDF» أو «Print to PDF».')
        );
      } else {
        await exportToPDF();
      }
    } catch (e) {
      console.error('Open report for print:', e);
      showAlert(formatRTLText('خطأ'), formatRTLText('تعذر فتح التقرير.'));
    }
  };

  const handleExportReport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    try {
      let user = await AuthService.getCurrentUser();
      if (!user) user = await AuthService.checkAuthStatus();
      if (!user) {
        showAlert(
          formatRTLText('تسجيل الدخول مطلوب'),
          formatRTLText('يرجى تسجيل الدخول مرة أخرى للسماح بتصدير التقرير.'),
          [{ text: formatRTLText('حسناً'), style: 'cancel' as const }]
        );
        return;
      }
      const status = await SubscriptionService.checkSubscriptionStatus(user.id);
      if (!status?.features?.canExport) {
        showAlert(
          formatRTLText('تنبيه'),
          formatRTLText('لا يمكنك طباعة أو تصدير التقرير إلا بعد الانضمام لإحدى الخطط المدفوعة (الاشتراك السنوي أو النصف سنوي). يرجى ترقية اشتراكك للاستفادة من التصدير والطباعة.'),
          [
            { text: formatRTLText('حسناً'), style: 'cancel' as const },
            { text: formatRTLText('عرض الخطط'), onPress: () => router.push('/subscription') },
          ]
        );
        return;
      }
      if (isWeb) {
        const htmlContent = await generateReportHTML();
        webDownloadReport(htmlContent);
        showAlert(
          formatRTLText('تم تحميل التقرير'),
          formatRTLText('تم تحميل ملف التقرير. افتح الملف من مجلد التحميلات واختر «طباعة» ثم «حفظ كـ PDF» إن رغبت.')
        );
      } else {
        await exportToPDF();
      }
    } catch (err) {
      console.error('Export report error:', err);
      showAlert(
        formatRTLText('خطأ'),
        formatRTLText('حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى أو التحقق من الاتصال.'),
        [
          { text: formatRTLText('حسناً'), style: 'cancel' as const },
          { text: formatRTLText('تحميل التقرير'), onPress: () => openReportForPrint() },
        ]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    let htmlContent: string;
    try {
      htmlContent = await generateReportHTML();
    } catch (genError) {
      console.error('Error generating report HTML:', genError);
      showAlert(
        formatRTLText('خطأ في إنشاء التقرير'),
        formatRTLText('تعذر إنشاء محتوى التقرير. يرجى المحاولة مرة أخرى أو التأكد من وجود بيانات الأداء.')
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          showAlert('تنبيه', 'تصدير PDF غير متاح في هذا السياق.');
          return;
        }
        // استخدام iframe في نفس الصفحة بدلاً من نافذة منبثقة لتجنب حظر المتصفح — نافذة الطباعة تفتح مباشرة
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const doPrint = () => {
          try {
            if (iframe.contentWindow) iframe.contentWindow.print();
          } catch (e) {
            console.error('Print error:', e);
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        };
        iframe.src = url;
        iframe.onload = () => setTimeout(doPrint, 400);
        // احتياطاً إذا تأخر التحميل
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            doPrint();
          }
        }, 3000);
        showAlert(
          formatRTLText('تم فتح نافذة الطباعة'),
          formatRTLText('اختر «حفظ كـ PDF» أو «Save as PDF» في نافذة الطباعة لحفظ الملف.')
        );
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 595,
        height: 842,
      });

      // محاولة فتح الملف في عارض PDF الافتراضي (إن وُجد)
      try {
        const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
        await Linking.openURL(fileUri);
      } catch (_) {
        // تجاهل الفشل — نعرض مشاركة الملف أدناه
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        showAlert(
          formatRTLText('تم إنشاء الملف'),
          formatRTLText('تم إنشاء ملف PDF. المسار: ') + uri
        );
        return;
      }

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf'
        });
      } else {
        const pdfName = `تقرير_الأداء_${new Date().toISOString().split('T')[0]}.pdf`;
        const pdfUri = `${FileSystem.documentDirectory}${pdfName}`;
        await FileSystem.moveAsync({
          from: uri,
          to: pdfUri
        });
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: formatRTLText('حفظ التقرير كـ PDF'),
        });
      }

      showAlert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير التقرير كملف PDF'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showAlert(
        formatRTLText('فشل التصدير'),
        formatRTLText('فشل في تصدير التقرير كملف PDF. يرجى المحاولة مرة أخرى.') + (msg ? ` (${msg})` : '')
      );
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>جاري تحميل البيانات...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={true}
            indicatorStyle="black"
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="chart.line.uptrend.xyaxis" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                التقرير التفاعلي
              </ThemedText>
                <ThemedText style={styles.subtitle}>
                  تحليل شامل لأداءك المهني مع مؤشرات تفاعلية
                </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              <ThemedView style={styles.summaryCard}>
                              <ThemedText type="subtitle" style={styles.summaryTitle}>
                  ملخص الأداء العام
                </ThemedText>
              <ThemedView style={styles.summaryRow}>
                <ThemedView style={styles.summaryItem}>
                  <ThemedText style={[styles.summaryValue, { color: getScoreColor(calculateOverallAverage()) }]}>
                    {calculateOverallAverage()}%
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>المتوسط العام</ThemedText>
                </ThemedView>
                <ThemedView style={styles.summaryItem}>
                  <ThemedText style={[styles.summaryValue, { color: getScoreColor(calculateOverallAverage()) }]}>
                    {getScoreLevel(calculateOverallAverage())}
                  </ThemedText>
                  <ThemedText style={styles.summaryLabel}>مستوى الأداء</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.chartSelector}>
                              <ThemedText style={styles.selectorTitle}>
                  اختر نوع التحليل:
                </ThemedText>
              <ThemedView style={styles.selectorButtons}>
                <TouchableOpacity
                  style={[styles.selectorButton, selectedChart === 'evidence' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('evidence')}
                >
                  <IconSymbol size={16} name="doc.text.fill" color={selectedChart === 'evidence' ? '#fff' : '#666'} />
                  <ThemedText style={[styles.selectorButtonText, selectedChart === 'evidence' && styles.activeSelectorButtonText]}>
                    الشواهد
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectorButton, selectedChart === 'overall' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('overall')}
                >
                  <IconSymbol size={16} name="list.bullet" color={selectedChart === 'overall' ? '#fff' : '#666'} />
                                    <ThemedText style={[styles.selectorButtonText, selectedChart === 'overall' && styles.activeSelectorButtonText]}>
                    الترتيب
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectorButton, selectedChart === 'categories' && styles.activeSelectorButton]}
                  onPress={() => setSelectedChart('categories')}
                >
                  <IconSymbol size={16} name="chart.bar.fill" color={selectedChart === 'categories' ? '#fff' : '#666'} />
                                    <ThemedText style={[styles.selectorButtonText, selectedChart === 'categories' && styles.activeSelectorButtonText]}>
                    الفئة
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {renderChart()}

            <ThemedView style={styles.recommendationsCard}>
                              <ThemedText style={styles.recommendationsTitle}>
                  <IconSymbol size={20} name="lightbulb.fill" color="#FF9800" /> توصيات للتحسين
                </ThemedText>
              <ThemedView style={styles.recommendationsList}>
                {performanceData
                  .map(item => ({ ...item, scoreNum: Number(item?.score ?? 0) }))
                  .filter(item => item.scoreNum < 85)
                  .sort((a, b) => a.scoreNum - b.scoreNum)
                  .slice(0, 3)
                  .map((item) => (
                    <ThemedView key={item.id} style={styles.recommendationItem}>
                      <ThemedText style={styles.recommendationText}>
                        {`• ركز على تحسين "${item.title}" (الدرجة الحالية: ${item.scoreNum}%)`}
                      </ThemedText>
                    </ThemedView>
                  ))}
                {performanceData.filter(item => Number(item?.score ?? 0) < 85).length === 0 && (
                  <ThemedView key="no-improvements-needed" style={styles.recommendationItem}>
                                        <ThemedText style={styles.recommendationText}>
                      • ممتاز! جميع المحاور تحصل على درجات عالية. استمر في الأداء المتميز.
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={() => router.push('/share-achievements')}
                activeOpacity={0.7}
              >
                <IconSymbol size={20} name="square.and.arrow.up" color="#1c1f33" />
                <ThemedText style={styles.buttonText}>
                  {formatRTLText('مشاركة الإنجازات')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={handleExportReport}
                disabled={isExporting}
                activeOpacity={0.7}
              >
                {isExporting ? (
                  <ActivityIndicator color="#1c1f33" size="small" />
                ) : (
                  <IconSymbol size={20} name="square.and.arrow.up.fill" color="#1c1f33" />
                )}
                <ThemedText style={styles.buttonText}>
                  {isExporting ? formatRTLText('جاري التصدير...') : formatRTLText('تصدير التقرير التفاعلي')}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewVisible(false)}
        >
          <View style={styles.previewContent} pointerEvents="box-none">
            {previewImageUri ? (
              <Image source={{ uri: previewImageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : null}
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={() => setPreviewVisible(false)}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.previewCloseText}>إغلاق</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNavigationBar />
    </ThemedView>
  );
}

const styles = StyleSheet.create<any>({
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
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
    marginBottom: 20,
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
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',

    marginBottom: 2,
  },
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  summaryCard: {
    marginBottom: 20,
    padding: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 120,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1c1f33',
    textAlign: 'center',

  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(173, 212, 206, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(173, 212, 206, 0.3)',
    minHeight: 80,
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',

    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 36,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'center',

    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    lineHeight: 20,
  },
  chartSelector: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    alignSelf: 'flex-end',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 10,
  },
  selectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeSelectorButton: {
    backgroundColor: '#add4ce',
    borderColor: '#add4ce',
  },
  selectorButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'left',

  },
  activeSelectorButtonText: {
    color: '#1c1f33',
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    alignItems: 'center',
  },
  horizontalScrollContainer: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  colorLegend: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',

    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  legendText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'left',

    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',

    marginBottom: 15,
  },
  pieLegendContainer: {
    marginTop: 20,
    width: '100%',
  },
  pieLegendItem: {
    marginBottom: 15,
  },
  pieLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pieColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pieInfo: {
    flex: 1,
  },
  pieLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'left',

    marginBottom: 4,
  },
  pieDetails: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',

    marginBottom: 2,
  },
  pieAverage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',

  },
  progressList: {
    gap: 12,
  },
  progressItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 15,
  },
  progressRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    minWidth: 60,
    height: 60,
    textAlign: 'center',

    backgroundColor: '#add4ce',
    borderRadius: 30,
    lineHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    fontWeight: '500',
  },
  progressScore: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(173, 212, 206, 0.1)',
    borderRadius: 10,
    alignSelf: 'center',
  },
  progressBarWrapper: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#add4ce',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  recommendationsCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    alignSelf: 'flex-end',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 15,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    backgroundColor: 'rgba(173, 212, 206, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#add4ce',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#add4ce',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',

    textAlign: 'center',
  },
  statisticsContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  evidenceContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  evidenceIntro: {
    fontSize: 14,
    color: '#555',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 12,
  },
  evidenceScroll: {
    maxHeight: 380,
  },
  evidenceAxisCard: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: 'rgba(245, 245, 247, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.5)',
  },
  evidenceAxisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 10,
  },
  evidenceList: {
    gap: 8,
  },
  evidenceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.4)',
  },
  evidenceName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
  evidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  evidenceBadgeAvailable: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  evidenceBadgeUnavailable: {
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
  },
  evidenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  evidenceBadgeTextAvailable: {
    color: '#2e7d32',
  },
  evidenceBadgeTextUnavailable: {
    color: '#616161',
  },
  evidenceRowContent: {
    flex: 1,
  },
  evidenceRowBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  evidencePreviewButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(28, 31, 51, 0.08)',
    borderRadius: 8,
  },
  evidencePreviewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1f33',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 360,
    borderRadius: 12,
  },
  previewCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  previewCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    alignSelf: 'flex-end',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    marginBottom: 15,
  },
  // أنماط التمثيل البصري الجديد
  visualRepresentation: {
    gap: 12,
  },
  visualItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 234, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#add4ce',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    textDirection: 'rtl',
    lineHeight: 18,
  },
  scoreContainer: {
    minWidth: 50,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    textDirection: 'rtl',
  },
});
