import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Pressable, Alert, I18nManager, ImageBackground, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Modal, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const { width, height } = Dimensions.get('window');

export default function PerformanceScreen() {
  const router = useRouter();
  const [userProfession, setUserProfession] = useState('معلم/ة');
  const [performanceData, setPerformanceData] = useState([
    {
      id: 1,
      title: 'أداء الواجبات الوظيفية',
      score: 0,
      weight: 10,
      description: 'التقيد بالدوام الرسمي، تأدية الحصص وفق الجدول الدراسي، المشاركة في الإشراف والانتظار والمناوبة، إعداد الدروس والاختبارات والواجبات',
      details: 'التزام بالدوام الرسمي، تنفيذ الحصص الدراسية وفق الجدول المحدد، ومشاركة في الإشراف والمناوبة والانتظار. إعداد منتظم للدروس والاختبارات والواجبات.',
      evidence: [
        { name: 'التقيد بالدوام الرسمي', available: false },
        { name: 'تأدية الحصص وفق الجدول الدراسي', available: false },
        { name: 'المشاركة في الإشراف والمناوبة', available: false },
        { name: 'إعداد الدروس والاختبارات ومتابعتها', available: false },
        { name: 'التوقيع في سجل الدوام', available: false },
        { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false },
        { name: 'خطة توزيع المنهج', available: false }
      ],
    },
    {
      id: 2,
      title: 'التفاعل مع المجتمع المهني',
      score: 0,
      weight: 10,
      description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الزيارات الصفية، تنفيذ الدروس التطبيقية، بحث الدرس، حضور الدورات والورش التدريبية',
      details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للزيارات الصفية، وتنفيذ دروس تطبيقية. إجراء بحوث دروس وحضور للدورات التدريبية والورش التطويرية.',
      evidence: [
        { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
        { name: 'الزيارات التبادلية', available: false },
        { name: 'تنفيذ درس تطبيقي', available: false },
        { name: 'بحث درس', available: false },
        { name: 'حضور ورش ودورات تدريبية', available: false }
      ],
    },
    {
      id: 3,
      title: 'التفاعل مع أولياء الأمور',
      score: 0,
      weight: 10,
      description: 'التواصل الفعّال مع أولياء الأمور، تزويد أولياء الأمور بمستويات الطلاب، إيصال الملاحظات الهامة، تفعيل الخطة الأسبوعية للمدرسة، المشاركة في الجمعية العمومية',
      details: 'تواصل مع أولياء الأمور وتزويدهم بمستويات أبنائهم، إيصال الملاحظات الهامة، وتفعيل للخطة الأسبوعية. مشاركة في الجمعية العمومية.',
      evidence: [
        { name: 'التواصل الفعال مع أولياء الأمور', available: false },
        { name: 'التنسيق مع الموجه الطلابي', available: false },
        { name: 'إيصال الملاحظات الهامة', available: false },
        { name: 'تفعيل الخطة الأسبوعية', available: false },
        { name: 'المشاركة في الجمعية العمومية', available: false }
      ],
    },
    {
      id: 4,
      title: 'تنويع استراتيجيات التدريس',
      score: 0,
      weight: 10,
      description: 'استخدام استراتيجيات متنوعة، مراعاة الفروق الفردية، تطبيق استراتيجيات تناسب مستويات الطلاب',
      details: 'تطبيق لاستراتيجيات تدريس متنوعة، مراعاة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم مستويات الطلاب المختلفة.',
      evidence: [
        { name: 'استخدام استراتيجيات متنوعة', available: false },
        { name: 'مراعاة الفروق الفردية', available: false },
        { name: 'تقرير عن تطبيق استراتيجية', available: false },
        { name: 'ملف إنجاز للمعلم', available: false }
      ],
    },
    {
      id: 5,
      title: 'تحسين نتائج المتعلمين',
      score: 0,
      weight: 10,
      description: 'معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف، وضع خطط إثرائية للمتميزين، تكريم الطلاب المتحسنين',
      details: 'جهود في معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم للطلاب المتحسنين.',
      evidence: [
        { name: 'معالجة الفاقد التعليمي', available: false },
        { name: 'خطط علاجية للطلاب الضعاف', available: false },
        { name: 'خطط إثرائية للمتميزين', available: false },
        { name: 'تكريم الطلاب المتحسنين', available: false },
        { name: 'نتائج الاختبارات القبلية والبعدية', available: false }
      ],
    },
    {
      id: 6,
      title: 'إعداد خطة وتنفيذ التعلم',
      score: 0,
      weight: 10,
      description: 'توزيع المنهج، إعداد الدروس والواجبات والاختبارات',
      details: 'تخطيط لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
      evidence: [
        { name: 'خطة توزيع المنهج', available: false },
        { name: 'إعداد الدروس والاختبارات', available: false },
        { name: 'نماذج من إعداد الدروس', available: false },
        { name: 'نماذج من الواجبات والاختبارات', available: false }
      ],
    },
    {
      id: 7,
      title: 'توظيف تقنيات ووسائل التعلم',
      score: 0,
      weight: 10,
      description: 'دمج التقنية في التعليم، التنويع في الوسائل التعليمية',
      details: 'استخدام للتقنيات في التعليم، تنويع في الوسائل التعليمية المستخدمة، مع دمج للتقنية في العملية التعليمية.',
      evidence: [
        { name: 'دمج التقنية في التعليم', available: false },
        { name: 'تنويع الوسائل التعليمية', available: false },
        { name: 'صور من الوسائل التعليمية', available: false },
        { name: 'تقرير عن برنامج تقني مستخدم', available: false }
      ],
    },
    {
      id: 8,
      title: 'تهيئة البيئة التعليمية',
      score: 0,
      weight: 5,
      description: 'مراعاة حاجات الطلاب، تهيئة نفسية ومادية ومعنوية مناسبة',
      details: 'اهتمام بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة لحاجات الطلاب النفسية والمادية والمعنوية.',
      evidence: [
        { name: 'مراعاة حاجات الطلاب', available: false },
        { name: 'تهيئة نفسية للطلاب', available: false },
        { name: 'تحفيز مادي ومعنوي', available: false },
        { name: 'توفير متطلبات الدرس', available: false }
      ],
    },
    {
      id: 9,
      title: 'الإدارة الصفية',
      score: 0,
      weight: 5,
      description: 'ضبط سلوك الطلاب، شد انتباه الطلاب، مراعاة الفروق الفردية',
      details: 'إدارة للصف، مهارات في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة للفروق الفردية ومتابعة للحضور والانضباط.',
      evidence: [
        { name: 'ضبط سلوك الطلاب', available: false },
        { name: 'شد انتباه الطلاب', available: false },
        { name: 'مراعاة الفروق الفردية', available: false },
        { name: 'متابعة الحضور والغياب', available: false }
      ],
    },
    {
      id: 10,
      title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
      score: 0,
      weight: 10,
      description: 'تحليل نتائج الاختبارات الفصلية والنهائية، تصنيف الطلاب حسب نتائجهم، معالجة الفاقد التعليمي',
      details: 'تحليل لنتائج الاختبارات الفصلية والنهائية، تصنيف للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط لمعالجة الفاقد التعليمي.',
      evidence: [
        { name: 'تحليل نتائج الاختبارات', available: false },
        { name: 'تصنيف الطلاب وفق نتائجهم', available: false },
        { name: 'تحديد نقاط القوة والضعف', available: false },
        { name: 'سجل معالجة الفاقد', available: false }
      ],
    },
    {
      id: 11,
      title: 'تنويع أساليب التقويم',
      score: 0,
      weight: 10,
      description: 'تطبيق الاختبارات الورقية والإلكترونية، المشاريع الطلابية، المهام الأدائية، ملفات الإنجاز',
      details: 'تنويع في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية، وإنشاء مهام أدائية وملفات إنجاز.',
      evidence: [
        { name: 'تطبيق اختبارات ورقية وإلكترونية', available: false },
        { name: 'المشاريع الطلابية', available: false },
        { name: 'المهام الأدائية', available: false },
        { name: 'ملفات إنجاز الطلاب', available: false }
      ],
    },
  ]);

  const [selectedPerformance, setSelectedPerformance] = useState<number | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<{performanceId: number, evidenceIndex: number} | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: {name: string, size: string, date: string, type: string, uri?: string}}>({});
  const [uploadingStates, setUploadingStates] = useState<{[key: string]: boolean}>({});
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptMessage, setPromptMessage] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [promptMode, setPromptMode] = useState<'add' | 'edit'>('add');
  const [promptPerformanceId, setPromptPerformanceId] = useState<number>(0);
  const [promptEvidenceIndex, setPromptEvidenceIndex] = useState<number>(-1);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadPerformanceId, setUploadPerformanceId] = useState<number>(0);
  const [uploadEvidenceIndex, setUploadEvidenceIndex] = useState<number>(0);

  useEffect(() => {
    loadUserProfession();
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (userProfession) {
      loadPerformanceData();
    }
  }, [userProfession]);

  // إضافة مستمع للتركيز على الصفحة باستخدام useFocusEffect
  useFocusEffect(
    React.useCallback(() => {
      console.log('Performance screen focused - checking profession...');
      // إعادة تحميل البيانات عند العودة إلى الصفحة
      loadUserProfession();
      
      // فحص دوري للتأكد من التحديث (كل ثانيتين لمدة 10 ثوانٍ)
      let checkCount = 0;
      const maxChecks = 5;
      const checkInterval = setInterval(() => {
        checkCount++;
        console.log(`Periodic check ${checkCount}/${maxChecks} - loading profession...`);
        loadUserProfession();
        
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          console.log('Periodic profession checks completed');
        }
      }, 2000);

      // تنظيف المؤقت عند الخروج من الصفحة
      return () => {
        clearInterval(checkInterval);
      };
    }, [])
  );

  const loadUserProfession = async () => {
    try {
      const basicData = await AsyncStorage.getItem('basicData');
      if (basicData) {
        const parsedData = JSON.parse(basicData);
        const newProfession = parsedData.profession || 'معلم/ة';
        
        console.log('Current profession:', userProfession, 'New profession:', newProfession);
        
        // تحديث المهنة والبطاقات حتى لو كانت نفس المهنة (للتأكد من التحديث)
        if (newProfession !== userProfession) {
          console.log('Profession changed from', userProfession, 'to', newProfession);
          setUserProfession(newProfession);
        }
        
        // تحديث البطاقات بناءً على المهنة الحالية أو الجديدة
        const currentProfessionData = getPerformanceDataByProfession(newProfession);
        
        // فحص ما إذا كانت البطاقات الحالية تختلف عن المطلوبة
        const shouldUpdate = performanceData.length !== currentProfessionData.length ||
          !performanceData.every((item, index) => 
            item.title === currentProfessionData[index]?.title
          );
          
        if (shouldUpdate) {
          console.log('Cards need update - forcing update for profession:', newProfession);
          await forceUpdateCardsForProfession(newProfession);
        } else {
          console.log('Performance data already matches profession:', newProfession);
        }
      }
    } catch (error) {
      console.log('Error loading user profession:', error);
    }
  };

  // دالة للتحقق من سلامة بيانات الشواهد
  const validateEvidenceData = (data: any[]) => {
    if (!Array.isArray(data)) return false;
    
    return data.every(item => {
      // التحقق من وجود الحقول المطلوبة
      if (!item.id || !item.title || !Array.isArray(item.evidence)) return false;
      
      // التحقق من صحة بيانات الشواهد
      return item.evidence.every((evidence: any) => 
        evidence && 
        typeof evidence.name === 'string' && 
        typeof evidence.available === 'boolean'
      );
    });
  };

  // دالة لإعادة تعيين البطاقات بقوة حسب المهنة
  const forceUpdateCardsForProfession = async (profession: string) => {
    console.log('Force updating cards for profession:', profession);
    
    // حذف البيانات المحفوظة القديمة
    try {
      await AsyncStorage.removeItem('performanceData');
      console.log('Cleared old performance data');
    } catch (error) {
      console.log('Error clearing old data:', error);
    }
    
    // تحميل البطاقات الجديدة
    const newData = getPerformanceDataByProfession(profession);
    setPerformanceData(newData);
    
    // حفظ البيانات الجديدة
    try {
      await AsyncStorage.setItem('performanceData', JSON.stringify(newData));
      console.log('Saved new performance data for profession:', profession);
    } catch (error) {
      console.log('Error saving new data:', error);
    }
  };

  const getPerformanceDataByProfession = (profession: string) => {
    if (profession === 'معلم/ة مسند له نشاط طلابي') {
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 10,
          description: 'التقيد بالدوام الرسمي، تأدية الحصص وفق الجدول الدراسي، المشاركة في الإشراف والانتظار والمناوبة، إعداد الدروس والاختبارات والواجبات',
          details: 'التزام بالدوام الرسمي، تنفيذ الحصص الدراسية وفق الجدول المحدد، ومشاركة في الإشراف والمناوبة والانتظار. إعداد منتظم للدروس والاختبارات والواجبات.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية الحصص وفق الجدول الدراسي', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'إعداد الدروس والاختبارات ومتابعتها', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false },
            { name: 'خطة توزيع المنهج', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 10,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الزيارات الصفية، تنفيذ الدروس التطبيقية، بحث الدرس، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للزيارات الصفية، وتنفيذ دروس تطبيقية. إجراء بحوث دروس وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'الزيارات التبادلية', available: false },
            { name: 'تنفيذ درس تطبيقي', available: false },
            { name: 'بحث درس', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 10,
          description: 'التواصل الفعّال مع أولياء الأمور، تزويد أولياء الأمور بمستويات الطلاب، إيصال الملاحظات الهامة، تفعيل الخطة الأسبوعية للمدرسة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وتزويدهم بمستويات أبنائهم، إيصال الملاحظات الهامة، وتفعيل للخطة الأسبوعية. مشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'التنسيق مع الموجه الطلابي', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'تفعيل الخطة الأسبوعية', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'التنويع في استراتيجيات التدريس',
          score: 0,
          weight: 5,
          description: 'استخدام استراتيجيات متنوعة، مراعاة الفروق الفردية، تطبيق استراتيجيات تناسب مستويات الطلاب',
          details: 'تطبيق لاستراتيجيات تدريس متنوعة، مراعاة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم مستويات الطلاب المختلفة.',
          evidence: [
            { name: 'استخدام استراتيجيات متنوعة', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'تقرير عن تطبيق استراتيجية', available: false },
            { name: 'ملف إنجاز للمعلم', available: false }
          ],
        },
        {
          id: 5,
          title: 'تحسين نتائج المتعلمين',
          score: 0,
          weight: 5,
          description: 'معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف، وضع خطط إثرائية للمتميزين، تكريم الطلاب المتحسنين',
          details: 'جهود في معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم للطلاب المتحسنين.',
          evidence: [
            { name: 'معالجة الفاقد التعليمي', available: false },
            { name: 'خطط علاجية للطلاب الضعاف', available: false },
            { name: 'خطط إثرائية للمتميزين', available: false },
            { name: 'تكريم الطلاب المتحسنين', available: false },
            { name: 'نتائج الاختبارات القبلية والبعدية', available: false }
          ],
        },
        {
          id: 6,
          title: 'إعداد وتنفيذ خطة التعلم',
          score: 0,
          weight: 5,
          description: 'توزيع المنهج، إعداد الدروس والواجبات والاختبارات',
          details: 'تخطيط لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
          evidence: [
            { name: 'خطة توزيع المنهج', available: false },
            { name: 'إعداد الدروس والاختبارات', available: false },
            { name: 'نماذج من إعداد الدروس', available: false },
            { name: 'نماذج من الواجبات والاختبارات', available: false }
          ],
        },
        {
          id: 7,
          title: 'توظيف تقنيات ووسائل التعلم المناسبة',
          score: 0,
          weight: 5,
          description: 'دمج التقنية في التعليم، التنويع في الوسائل التعليمية',
          details: 'استخدام للتقنيات في التعليم، تنويع في الوسائل التعليمية المستخدمة، مع دمج للتقنية في العملية التعليمية.',
          evidence: [
            { name: 'دمج التقنية في التعليم', available: false },
            { name: 'تنويع الوسائل التعليمية', available: false },
            { name: 'صور من الوسائل التعليمية', available: false },
            { name: 'تقرير عن برنامج تقني مستخدم', available: false }
          ],
        },
        {
          id: 8,
          title: 'تهيئة بيئة تعليمية',
          score: 0,
          weight: 5,
          description: 'مراعاة حاجات الطلاب، تهيئة نفسية ومادية ومعنوية مناسبة',
          details: 'اهتمام بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة لحاجات الطلاب النفسية والمادية والمعنوية.',
          evidence: [
            { name: 'مراعاة حاجات الطلاب', available: false },
            { name: 'تهيئة نفسية للطلاب', available: false },
            { name: 'تحفيز مادي ومعنوي', available: false },
            { name: 'توفير متطلبات الدرس', available: false }
          ],
        },
        {
          id: 9,
          title: 'الإدارة الصفية',
          score: 0,
          weight: 5,
          description: 'ضبط سلوك الطلاب، شد انتباه الطلاب، مراعاة الفروق الفردية',
          details: 'إدارة للصف، مهارات في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة للفروق الفردية ومتابعة للحضور والانضباط.',
          evidence: [
            { name: 'ضبط سلوك الطلاب', available: false },
            { name: 'شد انتباه الطلاب', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'متابعة الحضور والغياب', available: false }
          ],
        },
        {
          id: 10,
          title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
          score: 0,
          weight: 5,
          description: 'تحليل نتائج الاختبارات الفصلية والنهائية، تصنيف الطلاب حسب نتائجهم، معالجة الفاقد التعليمي',
          details: 'تحليل لنتائج الاختبارات الفصلية والنهائية، تصنيف للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط لمعالجة الفاقد التعليمي.',
          evidence: [
            { name: 'تحليل نتائج الاختبارات', available: false },
            { name: 'تصنيف الطلاب وفق نتائجهم', available: false },
            { name: 'تحديد نقاط القوة والضعف', available: false },
            { name: 'سجل معالجة الفاقد', available: false }
          ],
        },
        {
          id: 11,
          title: 'تنوع أساليب التقويم',
          score: 0,
          weight: 5,
          description: 'تطبيق الاختبارات الورقية والإلكترونية، المشاريع الطلابية، المهام الأدائية، ملفات الإنجاز',
          details: 'تنويع في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية، وإنشاء مهام أدائية وملفات إنجاز.',
          evidence: [
            { name: 'تطبيق اختبارات ورقية وإلكترونية', available: false },
            { name: 'المشاريع الطلابية', available: false },
            { name: 'المهام الأدائية', available: false },
            { name: 'ملفات إنجاز الطلاب', available: false }
          ],
        },
        {
          id: 12,
          title: 'إعداد خطة مزمنة ومعتمدة لبرامج وفعاليات النشاط الطلابي',
          score: 0,
          weight: 10,
          description: 'إعداد خطة شاملة للنشاط الطلابي، تحديد الأهداف والأنشطة والفعاليات، وضع الجدول الزمني',
          details: 'إعداد خطة شاملة ومفصلة لبرامج وفعاليات النشاط الطلابي، تحديد الأهداف والأنشطة والفعاليات مع وضع جدول زمني محدد.',
          evidence: [
            { name: 'خطة شاملة للنشاط الطلابي', available: false },
            { name: 'جدول زمني للأنشطة', available: false },
            { name: 'أهداف النشاط الطلابي', available: false },
            { name: 'الموافقة على الخطة من الإدارة', available: false },
            { name: 'تحديث الخطة حسب الحاجة', available: false }
          ],
        },
        {
          id: 13,
          title: 'تهيئة البيئة المدرسية للبرامج والأنشطة الطلابية',
          score: 0,
          weight: 5,
          description: 'إعداد الأماكن والمرافق، توفير الأدوات والمواد، تهيئة البيئة المناسبة',
          details: 'تهيئة البيئة المدرسية لاستقبال البرامج والأنشطة الطلابية، إعداد الأماكن والمرافق وتوفير الأدوات والمواد اللازمة.',
          evidence: [
            { name: 'إعداد الأماكن والمرافق', available: false },
            { name: 'توفير الأدوات والمواد', available: false },
            { name: 'تهيئة البيئة المناسبة', available: false },
            { name: 'صور من البيئة المعدة', available: false },
            { name: 'قائمة بالأدوات والمواد', available: false }
          ],
        },
        {
          id: 14,
          title: 'يدعم المتعلمين وفق احتياجاتهم وميولهم للأنشطة',
          score: 0,
          weight: 5,
          description: 'تشخيص احتياجات الطلاب، تحديد ميولهم، توجيههم للأنشطة المناسبة',
          details: 'دعم المتعلمين وفق احتياجاتهم وميولهم للأنشطة، تشخيص احتياجات الطلاب وتحديد ميولهم وتوجيههم للأنشطة المناسبة.',
          evidence: [
            { name: 'تشخيص احتياجات الطلاب', available: false },
            { name: 'تحديد ميول الطلاب', available: false },
            { name: 'توجيه الطلاب للأنشطة المناسبة', available: false },
            { name: 'سجل متابعة الطلاب', available: false },
            { name: 'تقارير عن تطور الطلاب', available: false }
          ],
        },
        {
          id: 15,
          title: 'يحفز المتعلمين على المشاركة في الأنشطة المدرسية',
          score: 0,
          weight: 10,
          description: 'تشجيع الطلاب على المشاركة، تنظيم المسابقات والجوائز، إبراز إنجازات الطلاب',
          details: 'تحفيز المتعلمين على المشاركة في الأنشطة المدرسية، تشجيع الطلاب على المشاركة وتنظيم المسابقات والجوائز وإبراز إنجازات الطلاب.',
          evidence: [
            { name: 'تشجيع الطلاب على المشاركة', available: false },
            { name: 'تنظيم المسابقات والجوائز', available: false },
            { name: 'إبراز إنجازات الطلاب', available: false },
            { name: 'صور من الأنشطة والمسابقات', available: false },
            { name: 'تقارير عن مشاركة الطلاب', available: false },
            { name: 'جوائز وشهادات الطلاب', available: false }
          ],
        },
      ];
    } else if (profession === 'معلم/ة مسند له توجيه صحي') {
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 10,
          description: 'التقيد بالدوام الرسمي، تأدية الحصص وفق الجدول الدراسي، المشاركة في الإشراف والانتظار والمناوبة، إعداد الدروس والاختبارات والواجبات',
          details: 'التزام بالدوام الرسمي، تنفيذ الحصص الدراسية وفق الجدول المحدد، ومشاركة في الإشراف والمناوبة والانتظار. إعداد منتظم للدروس والاختبارات والواجبات.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية الحصص وفق الجدول الدراسي', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'إعداد الدروس والاختبارات ومتابعتها', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false },
            { name: 'خطة توزيع المنهج', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 10,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الزيارات الصفية، تنفيذ الدروس التطبيقية، بحث الدرس، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للزيارات الصفية، وتنفيذ دروس تطبيقية. إجراء بحوث دروس وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'الزيارات التبادلية', available: false },
            { name: 'تنفيذ درس تطبيقي', available: false },
            { name: 'بحث درس', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 10,
          description: 'التواصل الفعّال مع أولياء الأمور، تزويد أولياء الأمور بمستويات الطلاب، إيصال الملاحظات الهامة، تفعيل الخطة الأسبوعية للمدرسة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وتزويدهم بمستويات أبنائهم، إيصال الملاحظات الهامة، وتفعيل للخطة الأسبوعية. مشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'التنسيق مع الموجه الطلابي', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'تفعيل الخطة الأسبوعية', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'التنويع في استراتيجيات التدريس',
          score: 0,
          weight: 5,
          description: 'استخدام استراتيجيات متنوعة، مراعاة الفروق الفردية، تطبيق استراتيجيات تناسب مستويات الطلاب',
          details: 'تطبيق لاستراتيجيات تدريس متنوعة، مراعاة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم مستويات الطلاب المختلفة.',
          evidence: [
            { name: 'استخدام استراتيجيات متنوعة', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'تقرير عن تطبيق استراتيجية', available: false },
            { name: 'ملف إنجاز للمعلم', available: false }
          ],
        },
        {
          id: 5,
          title: 'تحسين نتائج المتعلمين',
          score: 0,
          weight: 5,
          description: 'معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف، وضع خطط إثرائية للمتميزين، تكريم الطلاب المتحسنين',
          details: 'جهود في معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم للطلاب المتحسنين.',
          evidence: [
            { name: 'معالجة الفاقد التعليمي', available: false },
            { name: 'خطط علاجية للطلاب الضعاف', available: false },
            { name: 'خطط إثرائية للمتميزين', available: false },
            { name: 'تكريم الطلاب المتحسنين', available: false },
            { name: 'نتائج الاختبارات القبلية والبعدية', available: false }
          ],
        },
        {
          id: 6,
          title: 'إعداد وتنفيذ خطة التعلم',
          score: 0,
          weight: 5,
          description: 'توزيع المنهج، إعداد الدروس والواجبات والاختبارات',
          details: 'تخطيط لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
          evidence: [
            { name: 'خطة توزيع المنهج', available: false },
            { name: 'إعداد الدروس والاختبارات', available: false },
            { name: 'نماذج من إعداد الدروس', available: false },
            { name: 'نماذج من الواجبات والاختبارات', available: false }
          ],
        },
        {
          id: 7,
          title: 'توظيف تقنيات ووسائل التعلم المناسبة',
          score: 0,
          weight: 5,
          description: 'دمج التقنية في التعليم، التنويع في الوسائل التعليمية',
          details: 'استخدام للتقنيات في التعليم، تنويع في الوسائل التعليمية المستخدمة، مع دمج للتقنية في العملية التعليمية.',
          evidence: [
            { name: 'دمج التقنية في التعليم', available: false },
            { name: 'تنويع الوسائل التعليمية', available: false },
            { name: 'صور من الوسائل التعليمية', available: false },
            { name: 'تقرير عن برنامج تقني مستخدم', available: false }
          ],
        },
        {
          id: 8,
          title: 'تهيئة بيئة تعليمية',
          score: 0,
          weight: 5,
          description: 'مراعاة حاجات الطلاب، تهيئة نفسية ومادية ومعنوية مناسبة',
          details: 'اهتمام بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة لحاجات الطلاب النفسية والمادية والمعنوية.',
          evidence: [
            { name: 'مراعاة حاجات الطلاب', available: false },
            { name: 'تهيئة نفسية للطلاب', available: false },
            { name: 'تحفيز مادي ومعنوي', available: false },
            { name: 'توفير متطلبات الدرس', available: false }
          ],
        },
        {
          id: 9,
          title: 'الإدارة الصفية',
          score: 0,
          weight: 5,
          description: 'ضبط سلوك الطلاب، شد انتباه الطلاب، مراعاة الفروق الفردية',
          details: 'إدارة للصف، مهارات في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة للفروق الفردية ومتابعة للحضور والانضباط.',
          evidence: [
            { name: 'ضبط سلوك الطلاب', available: false },
            { name: 'شد انتباه الطلاب', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'متابعة الحضور والغياب', available: false }
          ],
        },
        {
          id: 10,
          title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
          score: 0,
          weight: 5,
          description: 'تحليل نتائج الاختبارات الفصلية والنهائية، تصنيف الطلاب حسب نتائجهم، معالجة الفاقد التعليمي',
          details: 'تحليل لنتائج الاختبارات الفصلية والنهائية، تصنيف للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط لمعالجة الفاقد التعليمي.',
          evidence: [
            { name: 'تحليل نتائج الاختبارات', available: false },
            { name: 'تصنيف الطلاب وفق نتائجهم', available: false },
            { name: 'تحديد نقاط القوة والضعف', available: false },
            { name: 'سجل معالجة الفاقد', available: false }
          ],
        },
        {
          id: 11,
          title: 'تنوع أساليب التقويم',
          score: 0,
          weight: 5,
          description: 'تطبيق الاختبارات الورقية والإلكترونية، المشاريع الطلابية، المهام الأدائية، ملفات الإنجاز',
          details: 'تنويع في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية، وإنشاء مهام أدائية وملفات إنجاز.',
          evidence: [
            { name: 'تطبيق اختبارات ورقية وإلكترونية', available: false },
            { name: 'المشاريع الطلابية', available: false },
            { name: 'المهام الأدائية', available: false },
            { name: 'ملفات إنجاز الطلاب', available: false }
          ],
        },
        {
          id: 12,
          title: 'تنفيذ الخطة المشتركة للبرامج الصحية المدرسية',
          score: 0,
          weight: 15,
          description: 'تنفيذ البرامج الصحية المدرسية، التنسيق مع الجهات الصحية، متابعة تنفيذ الخطة الصحية',
          details: 'تنفيذ الخطة المشتركة للبرامج الصحية المدرسية، التنسيق مع الجهات الصحية المعنية، ومتابعة تنفيذ الخطة الصحية المدرسية.',
          evidence: [
            { name: 'خطة البرامج الصحية المدرسية', available: false },
            { name: 'التنسيق مع الجهات الصحية', available: false },
            { name: 'متابعة تنفيذ الخطة الصحية', available: false },
            { name: 'تقارير عن البرامج الصحية', available: false },
            { name: 'سجل المتابعة الصحية', available: false }
          ],
        },
        {
          id: 13,
          title: 'حصر الحالات الصحية للمتعلمين',
          score: 0,
          weight: 5,
          description: 'حصر وتوثيق الحالات الصحية للطلاب، متابعة الحالات الخاصة، إعداد السجلات الصحية',
          details: 'حصر وتوثيق الحالات الصحية للمتعلمين، متابعة الحالات الصحية الخاصة، وإعداد السجلات الصحية المطلوبة.',
          evidence: [
            { name: 'حصر الحالات الصحية للطلاب', available: false },
            { name: 'توثيق الحالات الصحية', available: false },
            { name: 'متابعة الحالات الخاصة', available: false },
            { name: 'إعداد السجلات الصحية', available: false },
            { name: 'قاعدة بيانات الحالات الصحية', available: false }
          ],
        },
        {
          id: 14,
          title: 'تهيئة البيئة الصحية المدرسية',
          score: 0,
          weight: 10,
          description: 'تهيئة البيئة الصحية المدرسية، متابعة النظافة والصحة، إعداد التقارير الصحية',
          details: 'تهيئة البيئة الصحية المدرسية، متابعة النظافة والصحة العامة، وإعداد التقارير الصحية المطلوبة.',
          evidence: [
            { name: 'تهيئة البيئة الصحية', available: false },
            { name: 'متابعة النظافة والصحة', available: false },
            { name: 'إعداد التقارير الصحية', available: false },
            { name: 'صور من البيئة الصحية', available: false },
            { name: 'سجل المتابعة الصحية', available: false }
          ],
        },
      ];
    } else if (profession === 'الموجه/ه الطلابي') {
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 20,
          description: 'التقيد بالدوام الرسمي، تأدية المهام المطلوبة، المشاركة في الإشراف والانتظار والمناوبة',
          details: 'التزام بالدوام الرسمي، تنفيذ المهام المطلوبة، ومشاركة في الإشراف والمناوبة والانتظار.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية المهام المطلوبة', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 5,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الخبرات، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للخبرات، وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'تبادل الخبرات', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 5,
          description: 'التواصل الفعّال مع أولياء الأمور، إيصال الملاحظات الهامة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وإيصال الملاحظات الهامة، ومشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'يقدم التدخلات المناسبة لتعزيز الانضباط',
          score: 0,
          weight: 5,
          description: 'تقديم تدخلات مناسبة لتعزيز الانضباط المدرسي، معالجة المشاكل السلوكية',
          details: 'تقديم تدخلات مناسبة لتعزيز الانضباط المدرسي، ومعالجة المشاكل السلوكية للطلاب.',
          evidence: [
            { name: 'تدخلات لتعزيز الانضباط', available: false },
            { name: 'معالجة المشاكل السلوكية', available: false },
            { name: 'تقارير عن التدخلات', available: false },
            { name: 'سجل المتابعة السلوكية', available: false }
          ],
        },
        {
          id: 5,
          title: 'تقديم برامج تربوية لتعزيز دافعية الطلبة للتعلم',
          score: 0,
          weight: 5,
          description: 'تقديم برامج تربوية لتعزيز دافعية الطلبة للتعلم، تحفيز الطلاب',
          details: 'تقديم برامج تربوية لتعزيز دافعية الطلبة للتعلم، وتحفيز الطلاب على التحصيل الدراسي.',
          evidence: [
            { name: 'برامج تربوية لتعزيز الدافعية', available: false },
            { name: 'تحفيز الطلاب للتعلم', available: false },
            { name: 'تقارير عن البرامج التربوية', available: false },
            { name: 'سجل متابعة الدافعية', available: false }
          ],
        },
        {
          id: 6,
          title: 'إعداد خطة لبرامج التوجيه الطلابي',
          score: 0,
          weight: 10,
          description: 'إعداد خطة شاملة لبرامج التوجيه الطلابي، تحديد الأهداف والأنشطة',
          details: 'إعداد خطة شاملة ومفصلة لبرامج التوجيه الطلابي، تحديد الأهداف والأنشطة المطلوبة.',
          evidence: [
            { name: 'خطة شاملة للتوجيه الطلابي', available: false },
            { name: 'تحديد الأهداف والأنشطة', available: false },
            { name: 'جدول زمني للبرامج', available: false },
            { name: 'الموافقة على الخطة من الإدارة', available: false }
          ],
        },
        {
          id: 7,
          title: 'يصنف الحالات ويقدم برامج الدعم المناسبة',
          score: 0,
          weight: 10,
          description: 'تصنيف الحالات الطلابية، تقديم برامج الدعم المناسبة لكل حالة',
          details: 'تصنيف الحالات الطلابية وتقديم برامج الدعم المناسبة لكل حالة حسب احتياجاتها.',
          evidence: [
            { name: 'تصنيف الحالات الطلابية', available: false },
            { name: 'برامج الدعم المناسبة', available: false },
            { name: 'سجل تصنيف الحالات', available: false },
            { name: 'تقارير عن برامج الدعم', available: false }
          ],
        },
        {
          id: 8,
          title: 'يعزز القيم والسلوكيات للمتعلمين',
          score: 0,
          weight: 10,
          description: 'تعزيز القيم والسلوكيات الإيجابية للمتعلمين، تنمية الشخصية',
          details: 'تعزيز القيم والسلوكيات الإيجابية للمتعلمين، وتنمية الشخصية المتكاملة للطلاب.',
          evidence: [
            { name: 'تعزيز القيم الإيجابية', available: false },
            { name: 'تنمية السلوكيات الإيجابية', available: false },
            { name: 'برامج تنمية الشخصية', available: false },
            { name: 'تقارير عن تعزيز القيم', available: false }
          ],
        },
        {
          id: 9,
          title: 'يقدم التدخلات النفسية والاجتماعية',
          score: 0,
          weight: 10,
          description: 'تقديم التدخلات النفسية والاجتماعية للطلاب، معالجة المشاكل النفسية',
          details: 'تقديم التدخلات النفسية والاجتماعية للطلاب، ومعالجة المشاكل النفسية والاجتماعية.',
          evidence: [
            { name: 'التدخلات النفسية', available: false },
            { name: 'التدخلات الاجتماعية', available: false },
            { name: 'معالجة المشاكل النفسية', available: false },
            { name: 'سجل التدخلات النفسية', available: false }
          ],
        },
        {
          id: 10,
          title: 'يساعد المتعلمين على التخطيط المهني والتعليمي',
          score: 0,
          weight: 5,
          description: 'مساعدة المتعلمين على التخطيط المهني والتعليمي، توجيه المسارات',
          details: 'مساعدة المتعلمين على التخطيط المهني والتعليمي، وتوجيه المسارات المناسبة لهم.',
          evidence: [
            { name: 'التخطيط المهني للطلاب', available: false },
            { name: 'التخطيط التعليمي', available: false },
            { name: 'توجيه المسارات', available: false },
            { name: 'سجل التخطيط المهني', available: false }
          ],
        },
        {
          id: 11,
          title: 'يعزز التفوق الدراسي',
          score: 0,
          weight: 5,
          description: 'تعزيز التفوق الدراسي للطلاب، دعم المتفوقين',
          details: 'تعزيز التفوق الدراسي للطلاب، ودعم المتفوقين وتشجيعهم على الاستمرار في التميز.',
          evidence: [
            { name: 'تعزيز التفوق الدراسي', available: false },
            { name: 'دعم المتفوقين', available: false },
            { name: 'برامج تشجيع التفوق', available: false },
            { name: 'سجل المتفوقين', available: false }
          ],
        },
        {
          id: 12,
          title: 'يقدم تدخلات تربوية للمتأخرين دراسياً والمعيدين',
          score: 0,
          weight: 5,
          description: 'تقديم تدخلات تربوية للمتأخرين دراسياً والمعيدين، دعمهم',
          details: 'تقديم تدخلات تربوية للمتأخرين دراسياً والمعيدين، ودعمهم لتحسين مستواهم الدراسي.',
          evidence: [
            { name: 'تدخلات للمتأخرين دراسياً', available: false },
            { name: 'تدخلات للمعيدين', available: false },
            { name: 'دعم تحسين المستوى', available: false },
            { name: 'سجل المتابعة', available: false }
          ],
        },
        {
          id: 13,
          title: 'توعية المتعلمين وأولياء امورهم بقواعد السلوك والمواظبة',
          score: 0,
          weight: 5,
          description: 'توعية المتعلمين وأولياء أمورهم بقواعد السلوك والمواظبة، نشر الوعي',
          details: 'توعية المتعلمين وأولياء أمورهم بقواعد السلوك والمواظبة، ونشر الوعي بالقوانين والأنظمة.',
          evidence: [
            { name: 'توعية بقواعد السلوك', available: false },
            { name: 'توعية بقواعد المواظبة', available: false },
            { name: 'نشر الوعي', available: false },
            { name: 'تقارير التوعية', available: false }
          ],
        },
      ];
    } else if (profession === 'وكيل/ة المدرسة') {
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 5,
          description: 'التقيد بالدوام الرسمي، تأدية المهام المطلوبة، المشاركة في الإشراف والانتظار والمناوبة',
          details: 'التزام بالدوام الرسمي، تنفيذ المهام المطلوبة، ومشاركة في الإشراف والمناوبة والانتظار.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية المهام المطلوبة', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 5,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الخبرات، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للخبرات، وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'تبادل الخبرات', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 5,
          description: 'التواصل الفعّال مع أولياء الأمور، إيصال الملاحظات الهامة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وإيصال الملاحظات الهامة، ومشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'مرن وقادر على تنفيذ أعماله في ظل ظروف العمل المختلفة',
          score: 0,
          weight: 5,
          description: 'المرونة في تنفيذ الأعمال، القدرة على التكيف مع الظروف المختلفة',
          details: 'المرونة في تنفيذ الأعمال، والقدرة على التكيف مع الظروف المختلفة في العمل.',
          evidence: [
            { name: 'المرونة في تنفيذ الأعمال', available: false },
            { name: 'القدرة على التكيف', available: false },
            { name: 'التعامل مع الظروف المختلفة', available: false },
            { name: 'تقارير عن المرونة', available: false }
          ],
        },
        {
          id: 5,
          title: 'يدعم ويشارك في المبادرات النوعية',
          score: 0,
          weight: 10,
          description: 'دعم المبادرات النوعية، المشاركة في المبادرات المدرسية',
          details: 'دعم المبادرات النوعية والمشاركة في المبادرات المدرسية المختلفة.',
          evidence: [
            { name: 'دعم المبادرات النوعية', available: false },
            { name: 'المشاركة في المبادرات', available: false },
            { name: 'تقارير عن المبادرات', available: false },
            { name: 'سجل المبادرات', available: false }
          ],
        },
        {
          id: 6,
          title: 'يتخذ إجراءات تربوية تحقق الانضباط المدرسي',
          score: 0,
          weight: 5,
          description: 'اتخاذ إجراءات تربوية لتحقيق الانضباط المدرسي، ضبط النظام',
          details: 'اتخاذ إجراءات تربوية لتحقيق الانضباط المدرسي، وضبط النظام المدرسي.',
          evidence: [
            { name: 'إجراءات تربوية للانضباط', available: false },
            { name: 'ضبط النظام المدرسي', available: false },
            { name: 'تقارير الانضباط', available: false },
            { name: 'سجل الإجراءات', available: false }
          ],
        },
        {
          id: 7,
          title: 'يدير الموارد في المدرسة بكفاءة',
          score: 0,
          weight: 5,
          description: 'إدارة الموارد المدرسية بكفاءة، توزيع الموارد بشكل عادل',
          details: 'إدارة الموارد المدرسية بكفاءة، وتوزيع الموارد بشكل عادل ومناسب.',
          evidence: [
            { name: 'إدارة الموارد بكفاءة', available: false },
            { name: 'توزيع الموارد', available: false },
            { name: 'تقارير إدارة الموارد', available: false },
            { name: 'سجل الموارد', available: false }
          ],
        },
        {
          id: 8,
          title: 'يشارك في إعداد خطة للتطوير المهني',
          score: 0,
          weight: 5,
          description: 'المشاركة في إعداد خطة للتطوير المهني، دعم التطوير',
          details: 'المشاركة في إعداد خطة للتطوير المهني، ودعم التطوير المهني للمعلمين.',
          evidence: [
            { name: 'المشاركة في إعداد الخطة', available: false },
            { name: 'دعم التطوير المهني', available: false },
            { name: 'خطة التطوير المهني', available: false },
            { name: 'تقارير التطوير', available: false }
          ],
        },
        {
          id: 9,
          title: 'يقدم التغذية الراجعة ويتابع تحقق مؤشرات الأداء الوظيفي',
          score: 0,
          weight: 5,
          description: 'تقديم التغذية الراجعة، متابعة مؤشرات الأداء الوظيفي',
          details: 'تقديم التغذية الراجعة ومتابعة تحقق مؤشرات الأداء الوظيفي.',
          evidence: [
            { name: 'تقديم التغذية الراجعة', available: false },
            { name: 'متابعة مؤشرات الأداء', available: false },
            { name: 'تقارير الأداء', available: false },
            { name: 'سجل المتابعة', available: false }
          ],
        },
        {
          id: 10,
          title: 'يدعم تنفيذ برامج التطوير المهني',
          score: 0,
          weight: 5,
          description: 'دعم تنفيذ برامج التطوير المهني، تشجيع المشاركة',
          details: 'دعم تنفيذ برامج التطوير المهني، وتشجيع المشاركة في البرامج.',
          evidence: [
            { name: 'دعم برامج التطوير', available: false },
            { name: 'تشجيع المشاركة', available: false },
            { name: 'تقارير البرامج', available: false },
            { name: 'سجل المشاركة', available: false }
          ],
        },
        {
          id: 11,
          title: 'يقيم أداء منسوبي المدرسة',
          score: 0,
          weight: 5,
          description: 'تقييم أداء منسوبي المدرسة، متابعة الأداء',
          details: 'تقييم أداء منسوبي المدرسة، ومتابعة الأداء الوظيفي.',
          evidence: [
            { name: 'تقييم أداء المنسوبين', available: false },
            { name: 'متابعة الأداء', available: false },
            { name: 'تقارير التقييم', available: false },
            { name: 'سجل التقييمات', available: false }
          ],
        },
        {
          id: 12,
          title: 'ينفذ إجراءات علمية لتحسين نتائج التعلم',
          score: 0,
          weight: 5,
          description: 'تنفيذ إجراءات علمية لتحسين نتائج التعلم، تطوير العملية التعليمية',
          details: 'تنفيذ إجراءات علمية لتحسين نتائج التعلم، وتطوير العملية التعليمية.',
          evidence: [
            { name: 'إجراءات علمية للتحسين', available: false },
            { name: 'تطوير العملية التعليمية', available: false },
            { name: 'تقارير التحسين', available: false },
            { name: 'سجل الإجراءات', available: false }
          ],
        },
        {
          id: 13,
          title: 'يسهم في تحسين مستوى أداء المدرسة',
          score: 0,
          weight: 5,
          description: 'المساهمة في تحسين مستوى أداء المدرسة، تطوير الأداء العام',
          details: 'المساهمة في تحسين مستوى أداء المدرسة، وتطوير الأداء العام للمؤسسة.',
          evidence: [
            { name: 'تحسين أداء المدرسة', available: false },
            { name: 'تطوير الأداء العام', available: false },
            { name: 'تقارير التحسين', available: false },
            { name: 'سجل التحسينات', available: false }
          ],
        },
        {
          id: 14,
          title: 'يشارك في إعداد الخطط المدرسية اللازمة',
          score: 0,
          weight: 5,
          description: 'المشاركة في إعداد الخطط المدرسية اللازمة، التخطيط الاستراتيجي',
          details: 'المشاركة في إعداد الخطط المدرسية اللازمة، والتخطيط الاستراتيجي للمدرسة.',
          evidence: [
            { name: 'المشاركة في إعداد الخطط', available: false },
            { name: 'التخطيط الاستراتيجي', available: false },
            { name: 'الخطط المدرسية', available: false },
            { name: 'تقارير التخطيط', available: false }
          ],
        },
        {
          id: 15,
          title: 'يتابع تنفيذ الخطط المدرسية بمختلف أنواعها',
          score: 0,
          weight: 5,
          description: 'متابعة تنفيذ الخطط المدرسية بمختلف أنواعها، ضمان التنفيذ',
          details: 'متابعة تنفيذ الخطط المدرسية بمختلف أنواعها، وضمان التنفيذ الفعال.',
          evidence: [
            { name: 'متابعة تنفيذ الخطط', available: false },
            { name: 'ضمان التنفيذ الفعال', available: false },
            { name: 'تقارير المتابعة', available: false },
            { name: 'سجل التنفيذ', available: false }
          ],
        },
        {
          id: 16,
          title: 'يرى الفرص والإمكانات الداعمة لمشاركة الطلاب في الأنشطة الصفية وغير الصفية',
          score: 0,
          weight: 5,
          description: 'رؤية الفرص والإمكانات لدعم مشاركة الطلاب في الأنشطة',
          details: 'رؤية الفرص والإمكانات الداعمة لمشاركة الطلاب في الأنشطة الصفية وغير الصفية.',
          evidence: [
            { name: 'رؤية الفرص', available: false },
            { name: 'دعم مشاركة الطلاب', available: false },
            { name: 'الأنشطة الصفية وغير الصفية', available: false },
            { name: 'تقارير الأنشطة', available: false }
          ],
        },
        {
          id: 17,
          title: 'يوظف المنصات الرقمية وتطبيقاتها المعتمدة في دعم عمليات التعليم والتعلم',
          score: 0,
          weight: 5,
          description: 'توظيف المنصات الرقمية في دعم التعليم والتعلم، التطوير التقني',
          details: 'توظيف المنصات الرقمية وتطبيقاتها المعتمدة في دعم عمليات التعليم والتعلم.',
          evidence: [
            { name: 'توظيف المنصات الرقمية', available: false },
            { name: 'دعم التعليم والتعلم', available: false },
            { name: 'التطوير التقني', available: false },
            { name: 'تقارير التقنية', available: false }
          ],
        },
        {
          id: 18,
          title: 'يتابع تعزيز السلوك الإيجابي للطلاب',
          score: 0,
          weight: 5,
          description: 'متابعة تعزيز السلوك الإيجابي للطلاب، تطوير السلوكيات',
          details: 'متابعة تعزيز السلوك الإيجابي للطلاب، وتطوير السلوكيات الإيجابية.',
          evidence: [
            { name: 'تعزيز السلوك الإيجابي', available: false },
            { name: 'تطوير السلوكيات', available: false },
            { name: 'تقارير السلوك', available: false },
            { name: 'سجل السلوكيات', available: false }
          ],
        },
        {
          id: 19,
          title: 'يبني بيئة مدرسية آمنة ومحفزة على التعلم',
          score: 0,
          weight: 5,
          description: 'بناء بيئة مدرسية آمنة ومحفزة على التعلم، تطوير البيئة',
          details: 'بناء بيئة مدرسية آمنة ومحفزة على التعلم، وتطوير البيئة التعليمية.',
          evidence: [
            { name: 'بناء بيئة آمنة', available: false },
            { name: 'تحفيز التعلم', available: false },
            { name: 'تطوير البيئة التعليمية', available: false },
            { name: 'تقارير البيئة', available: false }
          ],
        },
      ];
    } else if (profession === 'مدير/ة المدرسة') {
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 5,
          description: 'التقيد بالدوام الرسمي، تأدية المهام المطلوبة، المشاركة في الإشراف والانتظار والمناوبة',
          details: 'التزام بالدوام الرسمي، تنفيذ المهام المطلوبة، ومشاركة في الإشراف والمناوبة والانتظار.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية المهام المطلوبة', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 5,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الخبرات، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للخبرات، وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'تبادل الخبرات', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 5,
          description: 'التواصل الفعّال مع أولياء الأمور، إيصال الملاحظات الهامة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وإيصال الملاحظات الهامة، ومشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'مرن وقادر على تنفيذ أعماله في ظل ظروف العمل المختلفة',
          score: 0,
          weight: 5,
          description: 'المرونة في تنفيذ الأعمال، القدرة على التكيف مع الظروف المختلفة',
          details: 'المرونة في تنفيذ الأعمال، والقدرة على التكيف مع الظروف المختلفة في العمل.',
          evidence: [
            { name: 'المرونة في تنفيذ الأعمال', available: false },
            { name: 'القدرة على التكيف', available: false },
            { name: 'التعامل مع الظروف المختلفة', available: false },
            { name: 'تقارير عن المرونة', available: false }
          ],
        },
        {
          id: 5,
          title: 'يدعم ويشارك في المبادرات النوعية',
          score: 0,
          weight: 5,
          description: 'دعم المبادرات النوعية، المشاركة في المبادرات المدرسية',
          details: 'دعم المبادرات النوعية والمشاركة في المبادرات المدرسية المختلفة.',
          evidence: [
            { name: 'دعم المبادرات النوعية', available: false },
            { name: 'المشاركة في المبادرات', available: false },
            { name: 'تقارير عن المبادرات', available: false },
            { name: 'سجل المبادرات', available: false }
          ],
        },
        {
          id: 6,
          title: 'يتخذ إجراءات تربوية تحقق الانضباط المدرسي',
          score: 0,
          weight: 5,
          description: 'اتخاذ إجراءات تربوية لتحقيق الانضباط المدرسي، ضبط النظام',
          details: 'اتخاذ إجراءات تربوية لتحقيق الانضباط المدرسي، وضبط النظام المدرسي.',
          evidence: [
            { name: 'إجراءات تربوية للانضباط', available: false },
            { name: 'ضبط النظام المدرسي', available: false },
            { name: 'تقارير الانضباط', available: false },
            { name: 'سجل الإجراءات', available: false }
          ],
        },
        {
          id: 7,
          title: 'يدير الموارد في المدرسة بكفاءة',
          score: 0,
          weight: 5,
          description: 'إدارة الموارد المدرسية بكفاءة، توزيع الموارد بشكل عادل',
          details: 'إدارة الموارد المدرسية بكفاءة، وتوزيع الموارد بشكل عادل ومناسب.',
          evidence: [
            { name: 'إدارة الموارد بكفاءة', available: false },
            { name: 'توزيع الموارد', available: false },
            { name: 'تقارير إدارة الموارد', available: false },
            { name: 'سجل الموارد', available: false }
          ],
        },
        {
          id: 8,
          title: 'يعد خطة للتطوير المهني',
          score: 0,
          weight: 5,
          description: 'إعداد خطة للتطوير المهني، دعم التطوير',
          details: 'إعداد خطة للتطوير المهني، ودعم التطوير المهني للمعلمين.',
          evidence: [
            { name: 'إعداد خطة التطوير المهني', available: false },
            { name: 'دعم التطوير المهني', available: false },
            { name: 'خطة التطوير المهني', available: false },
            { name: 'تقارير التطوير', available: false }
          ],
        },
        {
          id: 9,
          title: 'يقدم التغذية الراجعة ويتابع تحقق مؤشرات الأداء الوظيفي',
          score: 0,
          weight: 5,
          description: 'تقديم التغذية الراجعة، متابعة مؤشرات الأداء الوظيفي',
          details: 'تقديم التغذية الراجعة ومتابعة تحقق مؤشرات الأداء الوظيفي.',
          evidence: [
            { name: 'تقديم التغذية الراجعة', available: false },
            { name: 'متابعة مؤشرات الأداء', available: false },
            { name: 'تقارير الأداء', available: false },
            { name: 'سجل المتابعة', available: false }
          ],
        },
        {
          id: 10,
          title: 'يدعم تنفيذ برامج التطوير المهني',
          score: 0,
          weight: 5,
          description: 'دعم تنفيذ برامج التطوير المهني، تشجيع المشاركة',
          details: 'دعم تنفيذ برامج التطوير المهني، وتشجيع المشاركة في البرامج.',
          evidence: [
            { name: 'دعم برامج التطوير', available: false },
            { name: 'تشجيع المشاركة', available: false },
            { name: 'تقارير البرامج', available: false },
            { name: 'سجل المشاركة', available: false }
          ],
        },
        {
          id: 11,
          title: 'يقيم أداء منسوبي المدرسة',
          score: 0,
          weight: 5,
          description: 'تقييم أداء منسوبي المدرسة، متابعة الأداء',
          details: 'تقييم أداء منسوبي المدرسة، ومتابعة الأداء الوظيفي.',
          evidence: [
            { name: 'تقييم أداء المنسوبين', available: false },
            { name: 'متابعة الأداء', available: false },
            { name: 'تقارير التقييم', available: false },
            { name: 'سجل التقييمات', available: false }
          ],
        },
        {
          id: 12,
          title: 'ينفذ إجراءات علمية لتحسين نتائج التعلم',
          score: 0,
          weight: 5,
          description: 'تنفيذ إجراءات علمية لتحسين نتائج التعلم، تطوير العملية التعليمية',
          details: 'تنفيذ إجراءات علمية لتحسين نتائج التعلم، وتطوير العملية التعليمية.',
          evidence: [
            { name: 'إجراءات علمية للتحسين', available: false },
            { name: 'تطوير العملية التعليمية', available: false },
            { name: 'تقارير التحسين', available: false },
            { name: 'سجل الإجراءات', available: false }
          ],
        },
        {
          id: 13,
          title: 'يسهم في تحسين مستوى أداء المدرسة',
          score: 0,
          weight: 10,
          description: 'المساهمة في تحسين مستوى أداء المدرسة، تطوير الأداء العام',
          details: 'المساهمة في تحسين مستوى أداء المدرسة، وتطوير الأداء العام للمؤسسة.',
          evidence: [
            { name: 'تحسين أداء المدرسة', available: false },
            { name: 'تطوير الأداء العام', available: false },
            { name: 'تقارير التحسين', available: false },
            { name: 'سجل التحسينات', available: false }
          ],
        },
        {
          id: 14,
          title: 'يعد الخطط المدرسية اللازمة',
          score: 0,
          weight: 5,
          description: 'إعداد الخطط المدرسية اللازمة، التخطيط الاستراتيجي',
          details: 'إعداد الخطط المدرسية اللازمة، والتخطيط الاستراتيجي للمدرسة.',
          evidence: [
            { name: 'إعداد الخطط المدرسية', available: false },
            { name: 'التخطيط الاستراتيجي', available: false },
            { name: 'الخطط المدرسية', available: false },
            { name: 'تقارير التخطيط', available: false }
          ],
        },
        {
          id: 15,
          title: 'يتابع تنفيذ الخطط المدرسية بمختلف أنواعها',
          score: 0,
          weight: 5,
          description: 'متابعة تنفيذ الخطط المدرسية بمختلف أنواعها، ضمان التنفيذ',
          details: 'متابعة تنفيذ الخطط المدرسية بمختلف أنواعها، وضمان التنفيذ الفعال.',
          evidence: [
            { name: 'متابعة تنفيذ الخطط', available: false },
            { name: 'ضمان التنفيذ الفعال', available: false },
            { name: 'تقارير المتابعة', available: false },
            { name: 'سجل التنفيذ', available: false }
          ],
        },
        {
          id: 16,
          title: 'يرى الفرص والإمكانات الداعمة لمشاركة الطلاب في الأنشطة الصفية وغير الصفية',
          score: 0,
          weight: 5,
          description: 'رؤية الفرص والإمكانات لدعم مشاركة الطلاب في الأنشطة',
          details: 'رؤية الفرص والإمكانات الداعمة لمشاركة الطلاب في الأنشطة الصفية وغير الصفية.',
          evidence: [
            { name: 'رؤية الفرص', available: false },
            { name: 'دعم مشاركة الطلاب', available: false },
            { name: 'الأنشطة الصفية وغير الصفية', available: false },
            { name: 'تقارير الأنشطة', available: false }
          ],
        },
        {
          id: 17,
          title: 'يوظف المنصات الرقمية وتطبيقاتها المعتمدة في دعم عمليات التعليم والتعلم',
          score: 0,
          weight: 5,
          description: 'توظيف المنصات الرقمية في دعم التعليم والتعلم، التطوير التقني',
          details: 'توظيف المنصات الرقمية وتطبيقاتها المعتمدة في دعم عمليات التعليم والتعلم.',
          evidence: [
            { name: 'توظيف المنصات الرقمية', available: false },
            { name: 'دعم التعليم والتعلم', available: false },
            { name: 'التطوير التقني', available: false },
            { name: 'تقارير التقنية', available: false }
          ],
        },
        {
          id: 18,
          title: 'يتابع تعزيز السلوك الإيجابي للطلاب',
          score: 0,
          weight: 5,
          description: 'متابعة تعزيز السلوك الإيجابي للطلاب، تطوير السلوكيات',
          details: 'متابعة تعزيز السلوك الإيجابي للطلاب، وتطوير السلوكيات الإيجابية.',
          evidence: [
            { name: 'تعزيز السلوك الإيجابي', available: false },
            { name: 'تطوير السلوكيات', available: false },
            { name: 'تقارير السلوك', available: false },
            { name: 'سجل السلوكيات', available: false }
          ],
        },
        {
          id: 19,
          title: 'يبني بيئة مدرسية آمنة ومحفزة على التعلم',
          score: 0,
          weight: 5,
          description: 'بناء بيئة مدرسية آمنة ومحفزة على التعلم، تطوير البيئة',
          details: 'بناء بيئة مدرسية آمنة ومحفزة على التعلم، وتطوير البيئة التعليمية.',
          evidence: [
            { name: 'بناء بيئة آمنة', available: false },
            { name: 'تحفيز التعلم', available: false },
            { name: 'تطوير البيئة التعليمية', available: false },
            { name: 'تقارير البيئة', available: false }
          ],
        },
      ];
    } else {
      // البيانات الأصلية للمعلم العادي
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 10,
          description: 'التقيد بالدوام الرسمي، تأدية الحصص وفق الجدول الدراسي، المشاركة في الإشراف والانتظار والمناوبة، إعداد الدروس والاختبارات والواجبات',
          details: 'التزام بالدوام الرسمي، تنفيذ الحصص الدراسية وفق الجدول المحدد، ومشاركة في الإشراف والمناوبة والانتظار. إعداد منتظم للدروس والاختبارات والواجبات.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية الحصص وفق الجدول الدراسي', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'إعداد الدروس والاختبارات ومتابعتها', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false },
            { name: 'خطة توزيع المنهج', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 10,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الزيارات الصفية، تنفيذ الدروس التطبيقية، بحث الدرس، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للزيارات الصفية، وتنفيذ دروس تطبيقية. إجراء بحوث دروس وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'الزيارات التبادلية', available: false },
            { name: 'تنفيذ درس تطبيقي', available: false },
            { name: 'بحث درس', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 10,
          description: 'التواصل الفعّال مع أولياء الأمور، تزويد أولياء الأمور بمستويات الطلاب، إيصال الملاحظات الهامة، تفعيل الخطة الأسبوعية للمدرسة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وتزويدهم بمستويات أبنائهم، إيصال الملاحظات الهامة، وتفعيل للخطة الأسبوعية. مشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'التنسيق مع الموجه الطلابي', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'تفعيل الخطة الأسبوعية', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'التنويع في استراتيجيات التدريس',
          score: 0,
          weight: 10,
          description: 'استخدام استراتيجيات متنوعة، مراعاة الفروق الفردية، تطبيق استراتيجيات تناسب مستويات الطلاب',
          details: 'تطبيق لاستراتيجيات تدريس متنوعة، مراعاة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم مستويات الطلاب المختلفة.',
          evidence: [
            { name: 'استخدام استراتيجيات متنوعة', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'تقرير عن تطبيق استراتيجية', available: false },
            { name: 'ملف إنجاز للمعلم', available: false }
          ],
        },
        {
          id: 5,
          title: 'تحسين نتائج المتعلمين',
          score: 0,
          weight: 10,
          description: 'معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف، وضع خطط إثرائية للمتميزين، تكريم الطلاب المتحسنين',
          details: 'جهود في معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم للطلاب المتحسنين.',
          evidence: [
            { name: 'معالجة الفاقد التعليمي', available: false },
            { name: 'خطط علاجية للطلاب الضعاف', available: false },
            { name: 'خطط إثرائية للمتميزين', available: false },
            { name: 'تكريم الطلاب المتحسنين', available: false },
            { name: 'نتائج الاختبارات القبلية والبعدية', available: false }
          ],
        },
        {
          id: 6,
          title: 'إعداد وتنفيذ خطة التعلم',
          score: 0,
          weight: 10,
          description: 'توزيع المنهج، إعداد الدروس والواجبات والاختبارات',
          details: 'تخطيط لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
          evidence: [
            { name: 'خطة توزيع المنهج', available: false },
            { name: 'إعداد الدروس والاختبارات', available: false },
            { name: 'نماذج من إعداد الدروس', available: false },
            { name: 'نماذج من الواجبات والاختبارات', available: false }
          ],
        },
        {
          id: 7,
          title: 'توظيف تقنيات ووسائل التعلم المناسبة',
          score: 0,
          weight: 10,
          description: 'دمج التقنية في التعليم، التنويع في الوسائل التعليمية',
          details: 'استخدام للتقنيات في التعليم، تنويع في الوسائل التعليمية المستخدمة، مع دمج للتقنية في العملية التعليمية.',
          evidence: [
            { name: 'دمج التقنية في التعليم', available: false },
            { name: 'تنويع الوسائل التعليمية', available: false },
            { name: 'صور من الوسائل التعليمية', available: false },
            { name: 'تقرير عن برنامج تقني مستخدم', available: false }
          ],
        },
        {
          id: 8,
          title: 'تهيئة بيئة تعليمية',
          score: 0,
          weight: 10,
          description: 'مراعاة حاجات الطلاب، تهيئة نفسية ومادية ومعنوية مناسبة',
          details: 'اهتمام بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة لحاجات الطلاب النفسية والمادية والمعنوية.',
          evidence: [
            { name: 'مراعاة حاجات الطلاب', available: false },
            { name: 'تهيئة نفسية للطلاب', available: false },
            { name: 'تحفيز مادي ومعنوي', available: false },
            { name: 'توفير متطلبات الدرس', available: false }
          ],
        },
        {
          id: 9,
          title: 'الإدارة الصفية',
          score: 0,
          weight: 10,
          description: 'ضبط سلوك الطلاب، شد انتباه الطلاب، مراعاة الفروق الفردية',
          details: 'إدارة للصف، مهارات في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة للفروق الفردية ومتابعة للحضور والانضباط.',
          evidence: [
            { name: 'ضبط سلوك الطلاب', available: false },
            { name: 'شد انتباه الطلاب', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'متابعة الحضور والغياب', available: false }
          ],
        },
        {
          id: 10,
          title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
          score: 0,
          weight: 10,
          description: 'تحليل نتائج الاختبارات الفصلية والنهائية، تصنيف الطلاب حسب نتائجهم، معالجة الفاقد التعليمي',
          details: 'تحليل لنتائج الاختبارات الفصلية والنهائية، تصنيف للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط لمعالجة الفاقد التعليمي.',
          evidence: [
            { name: 'تحليل نتائج الاختبارات', available: false },
            { name: 'تصنيف الطلاب وفق نتائجهم', available: false },
            { name: 'تحديد نقاط القوة والضعف', available: false },
            { name: 'سجل معالجة الفاقد', available: false }
          ],
        },
        {
          id: 11,
          title: 'تنوع أساليب التقويم',
          score: 0,
          weight: 10,
          description: 'تطبيق الاختبارات الورقية والإلكترونية، المشاريع الطلابية، المهام الأدائية، ملفات الإنجاز',
          details: 'تنويع في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية، وإنشاء مهام أدائية وملفات إنجاز.',
          evidence: [
            { name: 'تطبيق اختبارات ورقية وإلكترونية', available: false },
            { name: 'المشاريع الطلابية', available: false },
            { name: 'المهام الأدائية', available: false },
            { name: 'ملفات إنجاز الطلاب', available: false }
          ],
        },
      ];
      return [
        {
          id: 1,
          title: 'أداء الواجبات الوظيفية',
          score: 0,
          weight: 10,
          description: 'التقيد بالدوام الرسمي، تأدية الحصص وفق الجدول الدراسي، المشاركة في الإشراف والانتظار والمناوبة، إعداد الدروس والاختبارات والواجبات',
          details: 'التزام بالدوام الرسمي، تنفيذ الحصص الدراسية وفق الجدول المحدد، ومشاركة في الإشراف والمناوبة والانتظار. إعداد منتظم للدروس والاختبارات والواجبات.',
          evidence: [
            { name: 'التقيد بالدوام الرسمي', available: false },
            { name: 'تأدية الحصص وفق الجدول الدراسي', available: false },
            { name: 'المشاركة في الإشراف والمناوبة', available: false },
            { name: 'إعداد الدروس والاختبارات ومتابعتها', available: false },
            { name: 'التوقيع في سجل الدوام', available: false },
            { name: 'التوقيع في سجل المناوبة أو الانتظار', available: false },
            { name: 'خطة توزيع المنهج', available: false }
          ],
        },
        {
          id: 2,
          title: 'التفاعل مع المجتمع المهني',
          score: 0,
          weight: 10,
          description: 'المشاركة في مجتمعات التعلم المهنية، تبادل الزيارات الصفية، تنفيذ الدروس التطبيقية، بحث الدرس، حضور الدورات والورش التدريبية',
          details: 'مشاركة في مجتمعات التعلم المهنية، تبادل للزيارات الصفية، وتنفيذ دروس تطبيقية. إجراء بحوث دروس وحضور للدورات التدريبية والورش التطويرية.',
          evidence: [
            { name: 'المشاركة في مجتمعات التعلم المهنية', available: false },
            { name: 'الزيارات التبادلية', available: false },
            { name: 'تنفيذ درس تطبيقي', available: false },
            { name: 'بحث درس', available: false },
            { name: 'حضور ورش ودورات تدريبية', available: false }
          ],
        },
        {
          id: 3,
          title: 'التفاعل مع أولياء الأمور',
          score: 0,
          weight: 10,
          description: 'التواصل الفعّال مع أولياء الأمور، تزويد أولياء الأمور بمستويات الطلاب، إيصال الملاحظات الهامة، تفعيل الخطة الأسبوعية للمدرسة، المشاركة في الجمعية العمومية',
          details: 'تواصل مع أولياء الأمور وتزويدهم بمستويات أبنائهم، إيصال الملاحظات الهامة، وتفعيل للخطة الأسبوعية. مشاركة في الجمعية العمومية.',
          evidence: [
            { name: 'التواصل الفعال مع أولياء الأمور', available: false },
            { name: 'التنسيق مع الموجه الطلابي', available: false },
            { name: 'إيصال الملاحظات الهامة', available: false },
            { name: 'تفعيل الخطة الأسبوعية', available: false },
            { name: 'المشاركة في الجمعية العمومية', available: false }
          ],
        },
        {
          id: 4,
          title: 'تنويع استراتيجيات التدريس',
          score: 0,
          weight: 10,
          description: 'استخدام استراتيجيات متنوعة، مراعاة الفروق الفردية، تطبيق استراتيجيات تناسب مستويات الطلاب',
          details: 'تطبيق لاستراتيجيات تدريس متنوعة، مراعاة للفروق الفردية بين الطلاب، واستخدام استراتيجيات تلائم مستويات الطلاب المختلفة.',
          evidence: [
            { name: 'استخدام استراتيجيات متنوعة', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'تقرير عن تطبيق استراتيجية', available: false },
            { name: 'ملف إنجاز للمعلم', available: false }
          ],
        },
        {
          id: 5,
          title: 'تحسين نتائج المتعلمين',
          score: 0,
          weight: 10,
          description: 'معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف، وضع خطط إثرائية للمتميزين، تكريم الطلاب المتحسنين',
          details: 'جهود في معالجة الفاقد التعليمي، وضع خطط علاجية للطلاب الضعاف وخطط إثرائية للمتميزين، مع تكريم للطلاب المتحسنين.',
          evidence: [
            { name: 'معالجة الفاقد التعليمي', available: false },
            { name: 'خطط علاجية للطلاب الضعاف', available: false },
            { name: 'خطط إثرائية للمتميزين', available: false },
            { name: 'تكريم الطلاب المتحسنين', available: false },
            { name: 'نتائج الاختبارات القبلية والبعدية', available: false }
          ],
        },
        {
          id: 6,
          title: 'إعداد خطة وتنفيذ التعلم',
          score: 0,
          weight: 10,
          description: 'توزيع المنهج، إعداد الدروس والواجبات والاختبارات',
          details: 'تخطيط لتوزيع المنهج بما يتناسب مع الزمن المتاح، إعداد دروس، وتصميم واجبات واختبارات تتماشى مع أهداف التعلم.',
          evidence: [
            { name: 'خطة توزيع المنهج', available: false },
            { name: 'إعداد الدروس والاختبارات', available: false },
            { name: 'نماذج من إعداد الدروس', available: false },
            { name: 'نماذج من الواجبات والاختبارات', available: false }
          ],
        },
        {
          id: 7,
          title: 'توظيف تقنيات ووسائل التعلم',
          score: 0,
          weight: 10,
          description: 'دمج التقنية في التعليم، التنويع في الوسائل التعليمية',
          details: 'استخدام للتقنيات في التعليم، تنويع في الوسائل التعليمية المستخدمة، مع دمج للتقنية في العملية التعليمية.',
          evidence: [
            { name: 'دمج التقنية في التعليم', available: false },
            { name: 'تنويع الوسائل التعليمية', available: false },
            { name: 'صور من الوسائل التعليمية', available: false },
            { name: 'تقرير عن برنامج تقني مستخدم', available: false }
          ],
        },
        {
          id: 8,
          title: 'تهيئة البيئة التعليمية',
          score: 0,
          weight: 5,
          description: 'مراعاة حاجات الطلاب، تهيئة نفسية ومادية ومعنوية مناسبة',
          details: 'اهتمام بتهيئة بيئة تعليمية محفزة ومناسبة، مراعاة لحاجات الطلاب النفسية والمادية والمعنوية.',
          evidence: [
            { name: 'مراعاة حاجات الطلاب', available: false },
            { name: 'تهيئة نفسية للطلاب', available: false },
            { name: 'تحفيز مادي ومعنوي', available: false },
            { name: 'توفير متطلبات الدرس', available: false }
          ],
        },
        {
          id: 9,
          title: 'الإدارة الصفية',
          score: 0,
          weight: 5,
          description: 'ضبط سلوك الطلاب، شد انتباه الطلاب، مراعاة الفروق الفردية',
          details: 'إدارة للصف، مهارات في ضبط سلوك الطلاب وشد انتباههم، مع مراعاة للفروق الفردية ومتابعة للحضور والانضباط.',
          evidence: [
            { name: 'ضبط سلوك الطلاب', available: false },
            { name: 'شد انتباه الطلاب', available: false },
            { name: 'مراعاة الفروق الفردية', available: false },
            { name: 'متابعة الحضور والغياب', available: false }
          ],
        },
        {
          id: 10,
          title: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم',
          score: 0,
          weight: 10,
          description: 'تحليل نتائج الاختبارات الفصلية والنهائية، تصنيف الطلاب حسب نتائجهم، معالجة الفاقد التعليمي',
          details: 'تحليل لنتائج الاختبارات الفصلية والنهائية، تصنيف للطلاب حسب نتائجهم ومستوياتهم، ووضع خطط لمعالجة الفاقد التعليمي.',
          evidence: [
            { name: 'تحليل نتائج الاختبارات', available: false },
            { name: 'تصنيف الطلاب وفق نتائجهم', available: false },
            { name: 'تحديد نقاط القوة والضعف', available: false },
            { name: 'سجل معالجة الفاقد', available: false }
          ],
        },
        {
          id: 11,
          title: 'تنويع أساليب التقويم',
          score: 0,
          weight: 10,
          description: 'تطبيق الاختبارات الورقية والإلكترونية، المشاريع الطلابية، المهام الأدائية، ملفات الإنجاز',
          details: 'تنويع في أساليب التقويم بين الاختبارات الورقية والإلكترونية، تنفيذ مشاريع طلابية، وإنشاء مهام أدائية وملفات إنجاز.',
          evidence: [
            { name: 'تطبيق اختبارات ورقية وإلكترونية', available: false },
            { name: 'المشاريع الطلابية', available: false },
            { name: 'المهام الأدائية', available: false },
            { name: 'ملفات إنجاز الطلاب', available: false }
          ],
        },
      ];
    }
  };

  const loadPerformanceData = async () => {
    try {
      console.log('Loading performance data for profession:', userProfession);
      const storedData = await AsyncStorage.getItem('performanceData');
      const currentProfessionData = getPerformanceDataByProfession(userProfession);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('Found stored data with', parsedData.length, 'performance items');
        
        // التحقق من سلامة بيانات الشواهد
        const isDataValid = validateEvidenceData(parsedData);
        if (!isDataValid) {
          console.log('Stored data validation failed - corrupted evidence data detected');
          setPerformanceData(currentProfessionData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
          return;
        }
        
        // التحقق من أن البيانات المحفوظة تتطابق مع المهنة الحالية
        // مقارنة أعمق - فحص العناوين والأطوال
        const isDataMatching = parsedData.length === currentProfessionData.length && 
          parsedData.every((item, index) => 
            item.title === currentProfessionData[index]?.title
          );
          
        if (isDataMatching) {
          setPerformanceData(parsedData);
          console.log('Loaded existing performance data for profession:', userProfession);
          
          // عد الشواهد المحفوظة
          const evidenceCount = parsedData.reduce((total, item) => total + (item.evidence?.length || 0), 0);
          const availableEvidenceCount = parsedData.reduce((total, item) => 
            total + (item.evidence?.filter(ev => ev.available).length || 0), 0);
          console.log('Total evidence loaded:', evidenceCount, 'Available evidence:', availableEvidenceCount);
          
        } else {
          // إذا تغيرت المهنة أو كانت البيانات غير متطابقة، استخدم البيانات الجديدة
          setPerformanceData(currentProfessionData);
          console.log('Profession changed or data mismatch, using new performance data for:', userProfession);
          // حفظ البيانات الجديدة
          await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
        }
      } else {
        // إذا لم تكن هناك بيانات محفوظة، استخدم البيانات حسب المهنة
        setPerformanceData(currentProfessionData);
        console.log('No stored data, using default performance data for profession:', userProfession);
        // حفظ البيانات الجديدة
        await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
      }
      
      const storedFiles = await AsyncStorage.getItem('uploadedFiles');
      if (storedFiles) {
        setUploadedFiles(JSON.parse(storedFiles));
        console.log('Loaded uploaded files data');
      }
    } catch (error) {
      console.log('Error loading performance data:', error);
      // في حالة الخطأ، استخدم البيانات الافتراضية
      const fallbackData = getPerformanceDataByProfession(userProfession);
      setPerformanceData(fallbackData);
      try {
        await AsyncStorage.setItem('performanceData', JSON.stringify(fallbackData));
      } catch (saveError) {
        console.log('Error saving fallback data:', saveError);
      }
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
    return 'ضعيف';
  };

  const calculateScoreBasedOnEvidence = (evidence: any[]) => {
    if (!evidence || evidence.length === 0) return 0;
    const availableEvidence = evidence.filter(e => e.available).length;
    if (availableEvidence >= 3) return 100;
    return Math.round((availableEvidence / evidence.length) * 100);
  };

  const calculateOverallAverage = () => {
    if (!performanceData || performanceData.length === 0) return 0;
    const totalWeightedScore = performanceData.reduce((sum, performance) => sum + (performance.score * performance.weight), 0);
    const totalWeight = performanceData.reduce((sum, performance) => sum + performance.weight, 0);
    if (totalWeight === 0) return 0;
    return Math.round(totalWeightedScore / totalWeight);
  };

  const updatePerformanceData = async (newData: any[]) => {
    try {
      await AsyncStorage.setItem('performanceData', JSON.stringify(newData));
      setPerformanceData(newData);
    } catch (error) {
      console.error('Error updating performance data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
      throw error;
    }
  };

  const toggleEvidenceStatus = async (performanceId: number, evidenceIndex: number) => {
    console.log('Toggling evidence status for performance ID:', performanceId, 'evidence index:', evidenceIndex);
    
    const newData = performanceData.map(performance => {
      if (performance.id === performanceId) {
        const newEvidence = [...performance.evidence];
        const oldStatus = newEvidence[evidenceIndex].available;
        newEvidence[evidenceIndex] = {
          ...newEvidence[evidenceIndex],
          available: !oldStatus
        };
        
        console.log('Evidence status changed from', oldStatus, 'to', !oldStatus);
        const newScore = calculateScoreBasedOnEvidence(newEvidence);
        console.log('New score calculated:', newScore);

        return {
          ...performance,
          evidence: newEvidence,
          score: newScore
        };
      }
      return performance;
    });
    
    // حفظ البيانات المحدثة
    await updatePerformanceData(newData);
    console.log('Evidence toggle completed successfully');
  };

  const toggleEvidenceDetails = (performanceId: number, evidenceIndex: number) => {
    setSelectedEvidence(prev => 
      prev?.performanceId === performanceId && prev?.evidenceIndex === evidenceIndex 
        ? null 
        : { performanceId, evidenceIndex }
    );
  };

  const applyAddEvidence = async (performanceId: number, evidenceName: string) => {
    const name = evidenceName?.trim();
    if (!name) return false;
    const newData = performanceData.map(performance => {
      if (performance.id === performanceId) {
        const newEvidence = [
          ...performance.evidence,
          { name, available: false }
        ];
        const newScore = calculateScoreBasedOnEvidence(newEvidence);
        return { ...performance, evidence: newEvidence, score: newScore };
      }
      return performance;
    });
    await updatePerformanceData(newData);
    return true;
  };

  const applyEditEvidence = async (performanceId: number, evidenceIndex: number, newName: string) => {
    const name = newName?.trim();
    if (!name || evidenceIndex < 0) return false;
    const newData = performanceData.map(performance => {
      if (performance.id === performanceId) {
        const newEvidence = [...performance.evidence];
        newEvidence[evidenceIndex] = { ...newEvidence[evidenceIndex], name };
        return { ...performance, evidence: newEvidence };
      }
      return performance;
    });
    await updatePerformanceData(newData);
    return true;
  };

  const addEvidence = (performanceId: number) => {
    setPromptTitle('إضافة شاهد جديد');
    setPromptMessage('أدخل اسم الشاهد الجديد:');
    setPromptValue('');
    setPromptMode('add');
    setPromptPerformanceId(performanceId);
    setPromptEvidenceIndex(-1);
    setPromptVisible(true);
  };

  const editEvidence = (performanceId: number, evidenceIndex: number, currentName: string) => {
    setPromptTitle('تعديل الشاهد');
    setPromptMessage('أدخل الاسم الجديد للشاهد:');
    setPromptValue(currentName);
    setPromptMode('edit');
    setPromptPerformanceId(performanceId);
    setPromptEvidenceIndex(evidenceIndex);
    setPromptVisible(true);
  };

  const handlePromptConfirm = async () => {
    const value = promptValue.trim();
    if (!value) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسم الشاهد.');
      return;
    }
    const performanceId = promptPerformanceId;
    const evidenceIndex = promptEvidenceIndex;
    try {
      if (promptMode === 'add') {
        await applyAddEvidence(performanceId, value);
        Alert.alert('نجح', 'تمت إضافة الشاهد بنجاح');
      } else {
        await applyEditEvidence(performanceId, evidenceIndex, value);
        Alert.alert('نجح', 'تم تعديل الشاهد بنجاح');
      }
      setPromptVisible(false);
      setPromptValue('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ';
      Alert.alert('خطأ', msg);
    }
  };

  const deleteEvidence = (performanceId: number, evidenceIndex: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الشاهد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            console.log('Deleting evidence at index:', evidenceIndex, 'from performance ID:', performanceId);
            
            const newData = performanceData.map(performance => {
              if (performance.id === performanceId) {
                const oldEvidenceCount = performance.evidence.length;
                const newEvidence = performance.evidence.filter((_, index) => index !== evidenceIndex);
                const newScore = calculateScoreBasedOnEvidence(newEvidence);
                console.log('Evidence count reduced from', oldEvidenceCount, 'to', newEvidence.length);
                return {
                  ...performance,
                  evidence: newEvidence,
                  score: newScore
                };
              }
              return performance;
            });
            
            // حفظ البيانات المحدثة
            await updatePerformanceData(newData);
            console.log('Evidence deletion completed successfully');
          }
        }
      ]
    );
  };

  const pickImage = async (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    setUploadingStates(prev => ({ ...prev, [fileKey]: true }));

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لرفع الشواهد.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      const asset = !result.canceled && result.assets?.length ? result.assets[0] : null;
      if (!asset) {
        return;
      }

      const fileName = `image_${Date.now()}.jpg`;
      const sizeStr = asset.fileSize ? `${(asset.fileSize / 1024 / 1024).toFixed(2)} MB` : '—';

      const newUploadedFiles = {
        ...uploadedFiles,
        [fileKey]: {
          name: fileName,
          size: sizeStr,
          date: new Date().toLocaleDateString('ar-SA'),
          type: 'صورة',
          uri: asset.uri,
        },
      };

      setUploadedFiles(newUploadedFiles);
      try {
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));
      } catch (e) {
        // تخزين محلي فقط بدون URI إذا فشل (تجاوز الحجم)
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify({
          ...uploadedFiles,
          [fileKey]: { name: fileName, size: sizeStr, date: new Date().toLocaleDateString('ar-SA'), type: 'صورة' },
        }));
      }

      const newPerformanceData = performanceData.map(perf =>
        perf.id === performanceId
          ? {
              ...perf,
              evidence: perf.evidence.map((ev, idx) =>
                idx === evidenceIndex ? { ...ev, available: true } : ev
              ),
            }
          : perf
      );
      const updatedPerformance = newPerformanceData.find(perf => perf.id === performanceId);
      if (updatedPerformance) {
        const newScore = calculateScoreBasedOnEvidence(updatedPerformance.evidence);
        const finalPerformanceData = newPerformanceData.map(perf =>
          perf.id === performanceId ? { ...perf, score: newScore } : perf
        );
        setPerformanceData(finalPerformanceData);
        await AsyncStorage.setItem('performanceData', JSON.stringify(finalPerformanceData));
      } else {
        setPerformanceData(newPerformanceData);
        await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));
      }

      Alert.alert('نجح', 'تم رفع الصورة بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في اختيار الصورة';
      console.log('Error picking image:', error);
      Alert.alert('خطأ', message);
    } finally {
      setUploadingStates(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const pickDocument = async (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    setUploadingStates(prev => ({ ...prev, [fileKey]: true }));

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      const file = !result.canceled && result.assets?.length ? result.assets[0] : null;
      if (!file) {
        return;
      }

      const name = file.name ?? `document_${Date.now()}`;
      const sizeBytes = file.size ?? 0;
      const sizeStr = sizeBytes > 0 ? `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` : '—';

      const newUploadedFiles = {
        ...uploadedFiles,
        [fileKey]: {
          name,
          size: sizeStr,
          date: new Date().toLocaleDateString('ar-SA'),
          type: 'وثيقة',
          uri: file.uri,
        },
      };

      setUploadedFiles(newUploadedFiles);
      try {
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));
      } catch (e) {
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify({
          ...uploadedFiles,
          [fileKey]: { name, size: sizeStr, date: new Date().toLocaleDateString('ar-SA'), type: 'وثيقة' },
        }));
      }

      const newPerformanceData = performanceData.map(perf =>
        perf.id === performanceId
          ? {
              ...perf,
              evidence: perf.evidence.map((ev, idx) =>
                idx === evidenceIndex ? { ...ev, available: true } : ev
              ),
            }
          : perf
      );
      const updatedPerformance = newPerformanceData.find(perf => perf.id === performanceId);
      if (updatedPerformance) {
        const newScore = calculateScoreBasedOnEvidence(updatedPerformance.evidence);
        const finalPerformanceData = newPerformanceData.map(perf =>
          perf.id === performanceId ? { ...perf, score: newScore } : perf
        );
        setPerformanceData(finalPerformanceData);
        await AsyncStorage.setItem('performanceData', JSON.stringify(finalPerformanceData));
      } else {
        setPerformanceData(newPerformanceData);
        await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));
      }

      Alert.alert('نجح', 'تم رفع الوثيقة بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في اختيار الوثيقة';
      console.log('Error picking document:', error);
      Alert.alert('خطأ', message);
    } finally {
      setUploadingStates(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const pickVideo = async (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    setUploadingStates(prev => ({ ...prev, [fileKey]: true }));

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لرفع الفيديو.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      const asset = !result.canceled && result.assets?.length ? result.assets[0] : null;
      if (!asset) {
        return;
      }

      const fileName = `video_${Date.now()}.mp4`;
      const sizeStr = asset.fileSize ? `${(asset.fileSize / 1024 / 1024).toFixed(2)} MB` : '—';

      const newUploadedFiles = {
        ...uploadedFiles,
        [fileKey]: {
          name: fileName,
          size: sizeStr,
          date: new Date().toLocaleDateString('ar-SA'),
          type: 'فيديو',
          uri: asset.uri,
        },
      };

      setUploadedFiles(newUploadedFiles);
      try {
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));
      } catch (e) {
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify({
          ...uploadedFiles,
          [fileKey]: { name: fileName, size: sizeStr, date: new Date().toLocaleDateString('ar-SA'), type: 'فيديو' },
        }));
      }

      const newPerformanceData = performanceData.map(perf =>
        perf.id === performanceId
          ? {
              ...perf,
              evidence: perf.evidence.map((ev, idx) =>
                idx === evidenceIndex ? { ...ev, available: true } : ev
              ),
            }
          : perf
      );
      const updatedPerformance = newPerformanceData.find(perf => perf.id === performanceId);
      if (updatedPerformance) {
        const newScore = calculateScoreBasedOnEvidence(updatedPerformance.evidence);
        const finalPerformanceData = newPerformanceData.map(perf =>
          perf.id === performanceId ? { ...perf, score: newScore } : perf
        );
        setPerformanceData(finalPerformanceData);
        await AsyncStorage.setItem('performanceData', JSON.stringify(finalPerformanceData));
      } else {
        setPerformanceData(newPerformanceData);
        await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));
      }

      Alert.alert('نجح', 'تم رفع الفيديو بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في اختيار الفيديو';
      console.log('Error picking video:', error);
      Alert.alert('خطأ', message);
    } finally {
      setUploadingStates(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const handleFileUpload = (performanceId: number, evidenceIndex: number) => {
    setUploadPerformanceId(performanceId);
    setUploadEvidenceIndex(evidenceIndex);
    setUploadModalVisible(true);
  };

  const chooseUploadType = (type: 'image' | 'document' | 'video') => {
    setUploadModalVisible(false);
    const pid = uploadPerformanceId;
    const eid = uploadEvidenceIndex;
    if (type === 'image') pickImage(pid, eid);
    else if (type === 'document') pickDocument(pid, eid);
    else pickVideo(pid, eid);
  };

  const deleteFile = async (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    const newUploadedFiles = { ...uploadedFiles };
    delete newUploadedFiles[fileKey];
    setUploadedFiles(newUploadedFiles);
    await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));

    // تحديث حالة الشاهد إلى غير متوفر
    const newPerformanceData = performanceData.map(perf => 
      perf.id === performanceId 
        ? {
            ...perf,
            evidence: perf.evidence.map((ev, idx) => 
              idx === evidenceIndex ? { ...ev, available: false } : ev
            )
          }
        : perf
    );
    
    setPerformanceData(newPerformanceData);
    await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));

    Alert.alert('نجح', 'تم حذف الملف بنجاح');
  };

  const savePerformanceData = async () => {
    try {
      await AsyncStorage.setItem('performanceData', JSON.stringify(performanceData));
      Alert.alert('نجح', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      console.log('Error saving performance data:', error);
      Alert.alert('خطأ', 'فشل في حفظ البيانات');
    }
  };

  const resetPerformanceData = () => {
    Alert.alert(
      'تأكيد إعادة التعيين',
      'هل أنت متأكد من إعادة تعيين جميع البيانات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة تعيين',
          style: 'destructive',
          onPress: async () => {
            const resetData = performanceData.map(performance => ({
              ...performance,
              score: 0,
              evidence: performance.evidence.map(evidence => ({
                ...evidence,
                available: false
              }))
            }));
            setPerformanceData(resetData);
            setUploadedFiles({});
            await AsyncStorage.setItem('performanceData', JSON.stringify(resetData));
            await AsyncStorage.setItem('uploadedFiles', JSON.stringify({}));
            Alert.alert('نجح', 'تم إعادة تعيين البيانات بنجاح');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptVisible(false)}
      >
        <View style={styles.promptOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPromptVisible(false)}
          />
          <View style={styles.promptBox} pointerEvents="box-none">
            <ThemedText style={styles.promptTitle}>{promptTitle}</ThemedText>
            <ThemedText style={styles.promptMessage}>{promptMessage}</ThemedText>
            <TextInput
              style={styles.promptInput}
              value={promptValue}
              onChangeText={setPromptValue}
              placeholder="أدخل الاسم..."
              placeholderTextColor="#999"
              autoFocus
              onSubmitEditing={handlePromptConfirm}
            />
            <View style={styles.promptButtons}>
              <TouchableOpacity style={[styles.promptButton, styles.promptButtonCancel]} onPress={() => setPromptVisible(false)}>
                <ThemedText style={styles.promptButtonCancelText}>إلغاء</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.promptButton, styles.promptButtonConfirm]} onPress={handlePromptConfirm} activeOpacity={0.8}>
                <ThemedText style={styles.promptButtonConfirmText}>{promptMode === 'add' ? 'إضافة' : 'تعديل'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.promptOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setUploadModalVisible(false)} />
          <View style={styles.uploadModalBox}>
            <ThemedText style={styles.uploadModalTitle}>اختر نوع الملف</ThemedText>
            <ThemedText style={styles.promptMessage}>اختر نوع الملف الذي تريد رفعه:</ThemedText>
            <TouchableOpacity style={styles.uploadOptionButton} onPress={() => chooseUploadType('image')}>
              <IconSymbol name="photo.fill" size={24} color="#4A90E2" />
              <ThemedText style={styles.uploadOptionText}>صورة</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadOptionButton} onPress={() => chooseUploadType('document')}>
              <IconSymbol name="doc.fill" size={24} color="#4A90E2" />
              <ThemedText style={styles.uploadOptionText}>وثيقة</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadOptionButton} onPress={() => chooseUploadType('video')}>
              <IconSymbol name="video.fill" size={24} color="#4A90E2" />
              <ThemedText style={styles.uploadOptionText}>فيديو</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.uploadOptionButton, styles.uploadOptionCancel]} onPress={() => setUploadModalVisible(false)}>
              <ThemedText style={styles.uploadOptionCancelText}>إلغاء</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ 
              paddingBottom: 40, 
              paddingTop: 8,
              alignItems: 'center',
              width: '100%'
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Header Section */}
          <ThemedView style={styles.headerSection}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol name="chart.bar.fill" size={48} color="#1c1f33" />
            </ThemedView>
            <ThemedText style={styles.headerTitle}> 
              {formatRTLText(`محاور الأداء المهني`)}
            </ThemedText>
            <ThemedText style={styles.headerSubtitle}> 
              {formatRTLText(`${userProfession}`)}
            </ThemedText>
            
            {/* زر إعادة تحديث البطاقات */}
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => forceUpdateCardsForProfession(userProfession)}
              activeOpacity={0.7}
            >
              <IconSymbol size={16} name="arrow.clockwise" color="#4ECDC4" />
              <ThemedText style={styles.refreshButtonText}>تحديث البطاقات</ThemedText>
            </TouchableOpacity>
            
            {/* Overall Score Card */}
            <ThemedView style={styles.overallScoreCard}>
              <ThemedText style={[styles.overallScoreTitle, getTextDirection()]}>معدل الأداء</ThemedText>
              <ThemedText style={[styles.overallScoreValue, getTextDirection()]}>{calculateOverallAverage()}%</ThemedText>
              <ThemedText style={[styles.overallScoreLevel, getTextDirection()]}>{formatRTLText(getScoreLevel(calculateOverallAverage()))}</ThemedText>
            </ThemedView>
                          </ThemedView>

          {/* Performance Cards */}
          {performanceData.map((performance, idx) => (
            <React.Fragment key={performance.id}>
              <TouchableOpacity style={styles.specialCardMain} activeOpacity={0.9} onPress={() => setSelectedPerformance(selectedPerformance === performance.id ? null : performance.id)}>
                {/* رقم المحور */}
                <ThemedView style={styles.specialAxisCircle}><ThemedText style={[styles.specialAxisCircleText, getTextDirection()]}>{idx+1}</ThemedText></ThemedView>
                {/* عنوان المحور */}
                <ThemedText style={styles.specialCardTitle}>{formatRTLText(performance.title)}</ThemedText>
                {/* وصف مختصر */}
                <ThemedText style={styles.specialCardDesc} numberOfLines={1}>{formatRTLText(performance.description)}</ThemedText>
                {/* الوزن */}
                <ThemedText style={styles.specialCardWeight}>الوزن: {performance.weight}%</ThemedText>
                {/* نسبة الأداء */}
                <ThemedView style={styles.specialScoreSection}>
                  <ThemedView style={[
                    styles.specialScoreCircleBig, 
                    performance.score === 0 ? styles.specialScoreCircleRed : styles.specialScoreCircleGreen
                  ]}>
                    <ThemedText style={[
                      styles.specialScorePercent, 
                      performance.score === 0 ? {color:'#F44336'} : {color:'#4CAF50'}
                    ]}>{performance.score}%</ThemedText>
                    <ThemedText style={[
                      styles.specialScoreLevel, 
                      performance.score === 0 ? {color:'#F44336'} : {color:'#4CAF50'}
                    ]}>{performance.score === 0 ? 'يحتاج تحسين' : getScoreLevel(performance.score)}</ThemedText>
                  </ThemedView>
                </ThemedView>
                {/* أيقونة القائمة المنسدلة */}
                <IconSymbol name={selectedPerformance === performance.id ? "chevron.up" : "chevron.down"} size={28} color="#888" style={{marginTop: 8}} />
              </TouchableOpacity>
              {/* قائمة الشواهد المنسدلة */}
              {selectedPerformance === performance.id && (
                <ThemedView style={styles.specialEvidenceDropdown}>
                  <ThemedView style={styles.evidenceHeaderRow}>
                    <ThemedText style={[styles.sectionTitle, getTextDirection()]}>الشواهد المطلوبة:</ThemedText>
                    <Pressable
                      style={({ pressed }) => [styles.addEvidenceButton, pressed && { opacity: 0.8 }]}
                      onPress={() => addEvidence(performance.id)}
                    >
                      <IconSymbol name="plus.circle.fill" size={20} color="#4CAF50" />
                      <ThemedText style={[styles.addEvidenceText, getTextDirection()]}>إضافة شاهد</ThemedText>
                    </Pressable>
                  </ThemedView>
                  {performance.evidence.map((evidence, evidenceIndex) => {
                    const fileKey = `${performance.id}-${evidenceIndex}`;
                    const uploadedFile = uploadedFiles[fileKey];
                    const isUploading = uploadingStates[fileKey];

                    return (
                    <ThemedView key={evidenceIndex} style={styles.evidenceCardRow}>
                      <ThemedText style={[styles.evidenceName, getTextDirection()]}>{formatRTLText(evidence.name)}</ThemedText>
                        
                        {/* عرض الملف المرفوع إذا كان موجود */}
                        {uploadedFile && (
                          <ThemedView style={styles.uploadedFileContainer}>
                            <ThemedView style={styles.fileInfo}>
                              <IconSymbol 
                                name={uploadedFile.type === 'صورة' ? "photo.fill" : uploadedFile.type === 'فيديو' ? "video.fill" : "doc.fill"} 
                                size={20} 
                                color="#4A90E2" 
                              />
                              <ThemedText style={[styles.fileName, getTextDirection()]}>{uploadedFile.name}</ThemedText>
                              <ThemedText style={[styles.fileDetails, getTextDirection()]}>{uploadedFile.size} • {uploadedFile.date}</ThemedText>
                            </ThemedView>
                          </ThemedView>
                        )}

                      <ThemedView style={styles.evidenceRowBottom}>
                        <ThemedView style={[styles.evidenceStatus, evidence.available ? styles.evidenceAvailable : styles.evidenceUnavailable]}>
                          <IconSymbol name={evidence.available ? "checkmark" : "xmark"} size={18} color={evidence.available ? '#fff' : '#fff'} />
                          <ThemedText style={[styles.evidenceStatusText, getTextDirection()]}>{evidence.available ? formatRTLText('متوفر') : formatRTLText('غير متوفر')}</ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.evidenceActionsRow}>
                            <TouchableOpacity 
                              style={[styles.evidenceActionBtn, isUploading && styles.uploadingBtn]} 
                              onPress={() => !isUploading && handleFileUpload(performance.id, evidenceIndex)}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <ActivityIndicator size="small" color="#4A90E2" />
                              ) : (
                                <IconSymbol name="arrow.up.doc.fill" size={24} color="#4A90E2" />
                              )}
                            </TouchableOpacity>
                          <TouchableOpacity style={styles.evidenceActionBtn} onPress={() => editEvidence(performance.id, evidenceIndex, evidence.name)}>
                            <IconSymbol name="pencil" size={24} color="#FF9800" />
                          </TouchableOpacity>
                          {uploadedFile && (
                            <TouchableOpacity 
                              style={styles.evidenceActionBtn} 
                              onPress={() => deleteFile(performance.id, evidenceIndex)}
                            >
                              <IconSymbol name="trash" size={24} color="#F44336" />
                            </TouchableOpacity>
                          )}
                        </ThemedView>
                      </ThemedView>
                        </ThemedView>
                    );
                  })}
                </ThemedView>
              )}
            </React.Fragment>
          ))}

          {/* Action Buttons */}
          </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: { flex: 1 },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 24,
    backgroundColor: 'transparent',
    position: 'relative',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 34,
    textAlign: 'center',
    color: '#000000',
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
    alignSelf: 'center',
    writingDirection: 'rtl',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: 'rtl',
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  overallScoreCard: {
    width: 120,
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  overallScoreTitle: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginBottom: 0, textAlign: 'center' },
  overallScoreValue: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', lineHeight: 26, marginBottom: 0 },
  overallScoreLevel: { fontSize: 12, color: '#4CAF50', opacity: 0.9, textAlign: 'center', marginTop: -2 },
  cardMain: {
    backgroundColor: '#eaf6fa',
    borderRadius: 24,
    padding: 10,
    marginBottom: 12,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  axisCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#b2e0e6', justifyContent: 'center', alignItems: 'center', alignSelf: 'center',
  },
  axisCircleText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', lineHeight: 44 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 4 },
  cardDesc: { fontSize: 16, color: '#4a4a4a', textAlign: 'center', marginBottom: 2 },
  cardWeight: { fontSize: 14, color: '#7f8c8d', textAlign: 'center', marginBottom: 12 },
  scoreSection: { alignItems: 'center', marginBottom: 8 },
  scoreCircleBig: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4CAF50', marginBottom: 8 },
  scorePercent: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center' },
  scoreLevel: { fontSize: 18, color: '#4CAF50', fontWeight: '600', textAlign: 'center' },
  divider: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3, marginVertical: 12, width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 8, marginBottom: 4, textAlign: 'center' },
  sectionDesc: { fontSize: 15, color: '#34495e', marginBottom: 12, textAlign: 'center' },
  evidenceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%', direction: 'rtl' },
  addEvidenceButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d6f5e6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginStart: 8, gap: 4 },
  addEvidenceText: { fontSize: 15, color: '#388e3c', fontWeight: 'bold', textAlign: 'right' },
  evidenceCardRow: { flexDirection: 'column', alignItems: 'flex-end', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1, direction: 'rtl' },
  evidenceName: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#2c3e50', textAlign: 'right', alignSelf: 'stretch' },
  evidenceRowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4, direction: 'rtl' },
  evidenceActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evidenceActionBtn: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 6 },
  evidenceStatus: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginStart: 8, gap: 4 },
  evidenceAvailable: { backgroundColor: '#4CAF50' },
  evidenceUnavailable: { backgroundColor: '#F44336' },
  evidenceStatusText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textAlign: 'right' },
  specialCardMain: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    direction: 'rtl',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  specialAxisCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    direction: 'rtl',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 6,
  },
  specialAxisCircleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 36,
  },
  specialCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  specialCardDesc: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  specialCardWeight: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
    alignSelf: 'center',
    width: '100%',
  },
  specialScoreSection: { alignItems: 'center', marginBottom: 0 },
  specialScoreCircleBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 0,
    flexDirection: 'column',
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialScoreCircleRed: {
    borderColor: '#F44336',
    backgroundColor: '#fff5f5',
  },
  specialScoreCircleGreen: {
    borderColor: '#4CAF50',
    backgroundColor: '#f5fff5',
  },
  specialScorePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
    marginBottom: 0,
  },
  specialScoreLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: -2,
    lineHeight: 12,
  },
  specialEvidenceDropdown: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: -16,
    marginBottom: 24,
    padding: 16,
    alignSelf: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    direction: 'rtl',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    direction: 'rtl',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    direction: 'rtl',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileDetails: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  deleteFileBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 6,
    marginLeft: 8,
    direction: 'rtl',
  },
  uploadingBtn: {
    opacity: 0.6,
  },
  promptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
    elevation: 9999,
  },
  promptBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    direction: 'rtl',
    zIndex: 10000,
    elevation: 10000,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'right',
  },
  promptMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'right',
  },
  promptInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
    direction: 'rtl',
  },
  promptButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  promptButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  promptButtonCancel: {
    backgroundColor: '#E5E5EA',
  },
  promptButtonCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  promptButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  promptButtonConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  uploadModalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    direction: 'rtl',
    zIndex: 10000,
    elevation: 10000,
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'right',
  },
  uploadOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  uploadOptionText: {
    fontSize: 16,
    color: '#1c1f33',
    fontWeight: '500',
    textAlign: 'right',
  },
  uploadOptionCancel: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5EA',
    marginTop: 8,
    marginBottom: 0,
  },
  uploadOptionCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});
