import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width, height } = Dimensions.get('window');

export default function PerformanceScreen() {
  const router = useRouter();
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

  useEffect(() => {
    loadPerformanceData();
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  }, []);

  const loadPerformanceData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        setPerformanceData(JSON.parse(storedData));
      }
      
      const storedFiles = await AsyncStorage.getItem('uploadedFiles');
      if (storedFiles) {
        setUploadedFiles(JSON.parse(storedFiles));
      }
    } catch (error) {
      console.log('Error loading performance data:', error);
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
      // حفظ البيانات في AsyncStorage
      await AsyncStorage.setItem('performanceData', JSON.stringify(newData));
      
      // تحديث حالة البيانات محلياً
      setPerformanceData(newData);
    } catch (error) {
      console.error('Error updating performance data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
    }
  };

  const toggleEvidenceStatus = (performanceId: number, evidenceIndex: number) => {
    setPerformanceData(prevData => {
      const newData = prevData.map(performance => {
        if (performance.id === performanceId) {
          const newEvidence = [...performance.evidence];
          newEvidence[evidenceIndex] = {
            ...newEvidence[evidenceIndex],
            available: !newEvidence[evidenceIndex].available
          };
          
          const newScore = calculateScoreBasedOnEvidence(newEvidence);

          return {
            ...performance,
            evidence: newEvidence,
            score: newScore
          };
        }
        return performance;
      });
      
      // استخدام الدالة الجديدة لتحديث البيانات
      updatePerformanceData(newData);
      return newData;
    });
  };

  const toggleEvidenceDetails = (performanceId: number, evidenceIndex: number) => {
    setSelectedEvidence(prev => 
      prev?.performanceId === performanceId && prev?.evidenceIndex === evidenceIndex 
        ? null 
        : { performanceId, evidenceIndex }
    );
  };

  const addEvidence = (performanceId: number) => {
    Alert.prompt(
      'إضافة شاهد جديد',
      'أدخل اسم الشاهد الجديد:',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إضافة',
          onPress: (evidenceName) => {
            if (evidenceName && evidenceName.trim()) {
              setPerformanceData(prevData => {
                const newData = prevData.map(performance => {
                  if (performance.id === performanceId) {
                    const newEvidence = [
                      ...performance.evidence,
                      { name: evidenceName.trim(), available: false }
                    ];
                    const newScore = calculateScoreBasedOnEvidence(newEvidence);
                    return {
                      ...performance,
                      evidence: newEvidence,
                      score: newScore
                    };
                  }
                  return performance;
                });
                // استخدام الدالة الجديدة لتحديث البيانات
                updatePerformanceData(newData);
                return newData;
              });
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const editEvidence = (performanceId: number, evidenceIndex: number, currentName: string) => {
    Alert.prompt(
      'تعديل الشاهد',
      'أدخل الاسم الجديد للشاهد:',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تعديل',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              setPerformanceData(prevData => {
                const newData = prevData.map(performance => {
                  if (performance.id === performanceId) {
                    const newEvidence = [...performance.evidence];
                    newEvidence[evidenceIndex] = {
                      ...newEvidence[evidenceIndex],
                      name: newName.trim()
                    };
                    return {
                      ...performance,
                      evidence: newEvidence
                    };
                  }
                  return performance;
                });
                // استخدام الدالة الجديدة لتحديث البيانات
                updatePerformanceData(newData);
                return newData;
              });
            }
          }
        }
      ],
      'plain-text',
      currentName
    );
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
          onPress: () => {
            setPerformanceData(prevData => {
              const newData = prevData.map(performance => {
                if (performance.id === performanceId) {
                  const newEvidence = performance.evidence.filter((_, index) => index !== evidenceIndex);
                  const newScore = calculateScoreBasedOnEvidence(newEvidence);
                  return {
                    ...performance,
                    evidence: newEvidence,
                    score: newScore
                  };
                }
                return performance;
              });
              // استخدام الدالة الجديدة لتحديث البيانات
              updatePerformanceData(newData);
              return newData;
            });
          }
        }
      ]
    );
  };

  const pickImage = async (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    setUploadingStates(prev => ({ ...prev, [fileKey]: true }));
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `image_${Date.now()}.jpg`;

        // محاكاة عملية التحميل
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newUploadedFiles = {
          ...uploadedFiles,
          [fileKey]: {
            name: fileName,
            size: '2.5 MB',
            date: new Date().toLocaleDateString('ar-SA'),
            type: 'صورة',
            uri: asset.uri
          }
        };
        
        setUploadedFiles(newUploadedFiles);
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));

        // تحديث حالة الشاهد إلى متوفر وإعادة حساب الـ score
        const newPerformanceData = performanceData.map(perf => 
          perf.id === performanceId 
            ? {
                ...perf,
                evidence: perf.evidence.map((ev, idx) => 
                  idx === evidenceIndex ? { ...ev, available: true } : ev
                )
              }
            : perf
        );
        // إعادة حساب الـ score للمحور المحدد
        const updatedPerformance = newPerformanceData.find(perf => perf.id === performanceId);
        if (updatedPerformance) {
          const newScore = calculateScoreBasedOnEvidence(updatedPerformance.evidence);
          const finalPerformanceData = newPerformanceData.map(perf => 
            perf.id === performanceId 
              ? { ...perf, score: newScore }
              : perf
          );
          setPerformanceData(finalPerformanceData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(finalPerformanceData));
        } else {
          setPerformanceData(newPerformanceData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));
        }

        Alert.alert('نجح', 'تم تحميل الصورة بنجاح');
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
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
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];

        // محاكاة عملية التحميل
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newUploadedFiles = {
          ...uploadedFiles,
          [fileKey]: {
            name: file.name,
            size: `${((file.size || 0) / 1024 / 1024).toFixed(2)} MB`,
            date: new Date().toLocaleDateString('ar-SA'),
            type: 'وثيقة',
            uri: file.uri
          }
        };
        
        setUploadedFiles(newUploadedFiles);
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));

        // تحديث حالة الشاهد إلى متوفر وإعادة حساب الـ score
        const newPerformanceData = performanceData.map(perf => 
          perf.id === performanceId 
            ? {
                ...perf,
                evidence: perf.evidence.map((ev, idx) => 
                  idx === evidenceIndex ? { ...ev, available: true } : ev
                )
              }
            : perf
        );
        // إعادة حساب الـ score للمحور المحدد
        const updatedPerformance = newPerformanceData.find(perf => perf.id === performanceId);
        if (updatedPerformance) {
          const newScore = calculateScoreBasedOnEvidence(updatedPerformance.evidence);
          const finalPerformanceData = newPerformanceData.map(perf => 
            perf.id === performanceId 
              ? { ...perf, score: newScore }
              : perf
          );
          setPerformanceData(finalPerformanceData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(finalPerformanceData));
        } else {
          setPerformanceData(newPerformanceData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));
        }

        Alert.alert('نجح', 'تم تحميل الوثيقة بنجاح');
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('خطأ', 'فشل في اختيار الوثيقة');
    } finally {
      setUploadingStates(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const pickVideo = async (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    setUploadingStates(prev => ({ ...prev, [fileKey]: true }));
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `video_${Date.now()}.mp4`;

        // محاكاة عملية التحميل
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newUploadedFiles = {
          ...uploadedFiles,
          [fileKey]: {
            name: fileName,
            size: '15.2 MB',
            date: new Date().toLocaleDateString('ar-SA'),
            type: 'فيديو',
            uri: asset.uri
          }
        };
        
        setUploadedFiles(newUploadedFiles);
        await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));

        // تحديث حالة الشاهد إلى متوفر وإعادة حساب الـ score
        const newPerformanceData = performanceData.map(perf => 
          perf.id === performanceId 
            ? {
                ...perf,
                evidence: perf.evidence.map((ev, idx) => 
                  idx === evidenceIndex ? { ...ev, available: true } : ev
                )
              }
            : perf
        );
        // إعادة حساب الـ score للمحور المحدد
        const updatedPerformance = newPerformanceData.find(perf => perf.id === performanceId);
        if (updatedPerformance) {
          const newScore = calculateScoreBasedOnEvidence(updatedPerformance.evidence);
          const finalPerformanceData = newPerformanceData.map(perf => 
            perf.id === performanceId 
              ? { ...perf, score: newScore }
              : perf
          );
          setPerformanceData(finalPerformanceData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(finalPerformanceData));
        } else {
          setPerformanceData(newPerformanceData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(newPerformanceData));
        }

        Alert.alert('نجح', 'تم تحميل الفيديو بنجاح');
      }
    } catch (error) {
      console.log('Error picking video:', error);
      Alert.alert('خطأ', 'فشل في اختيار الفيديو');
    } finally {
      setUploadingStates(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const handleFileUpload = (performanceId: number, evidenceIndex: number) => {
    Alert.alert(
      'اختيار نوع الملف',
      'اختر نوع الملف الذي تريد رفعه:',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'صورة', onPress: () => pickImage(performanceId, evidenceIndex) },
        { text: 'وثيقة', onPress: () => pickDocument(performanceId, evidenceIndex) },
        { text: 'فيديو', onPress: () => pickVideo(performanceId, evidenceIndex) }
      ]
    );
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
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Header Section */}
          <ThemedView style={styles.headerSection}>
            <ThemedView style={styles.iconContainer}>
              <IconSymbol name="chart.bar.fill" size={48} color="#1c1f33" />
            </ThemedView>
            <ThemedText style={styles.headerTitle}>محاور الأداء المهني</ThemedText>
            <ThemedText style={styles.headerSubtitle}>تقييم شامل للأداء المهني والمعلم</ThemedText>
            
            {/* Overall Score Card */}
            <ThemedView style={styles.overallScoreCard}>
              <ThemedText style={styles.overallScoreTitle}>معدل الأداء</ThemedText>
              <ThemedText style={styles.overallScoreValue}>{calculateOverallAverage()}%</ThemedText>
              <ThemedText style={styles.overallScoreLevel}>{getScoreLevel(calculateOverallAverage())}</ThemedText>
            </ThemedView>
                          </ThemedView>

          {/* Performance Cards */}
          {performanceData.map((performance, idx) => (
            <React.Fragment key={performance.id}>
              <TouchableOpacity style={styles.specialCardMain} activeOpacity={0.9} onPress={() => setSelectedPerformance(selectedPerformance === performance.id ? null : performance.id)}>
                {/* رقم المحور */}
                <ThemedView style={styles.specialAxisCircle}><ThemedText style={styles.specialAxisCircleText}>{idx+1}</ThemedText></ThemedView>
                {/* عنوان المحور */}
                <ThemedText style={styles.specialCardTitle}>{performance.title}</ThemedText>
                {/* وصف مختصر */}
                <ThemedText style={styles.specialCardDesc} numberOfLines={1}>{performance.description}</ThemedText>
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
                    <TouchableOpacity style={styles.addEvidenceButton} onPress={() => addEvidence(performance.id)}>
                      <IconSymbol name="plus.circle.fill" size={20} color="#4CAF50" />
                      <ThemedText style={styles.addEvidenceText}>إضافة شاهد</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.sectionTitle}>الشواهد المطلوبة:</ThemedText>
                  </ThemedView>
                  {performance.evidence.map((evidence, evidenceIndex) => {
                    const fileKey = `${performance.id}-${evidenceIndex}`;
                    const uploadedFile = uploadedFiles[fileKey];
                    const isUploading = uploadingStates[fileKey];

                    return (
                    <ThemedView key={evidenceIndex} style={styles.evidenceCardRow}>
                      <ThemedText style={styles.evidenceName}>{evidence.name}</ThemedText>
                        
                        {/* عرض الملف المرفوع إذا كان موجود */}
                        {uploadedFile && (
                          <ThemedView style={styles.uploadedFileContainer}>
                            <ThemedView style={styles.fileInfo}>
                              <IconSymbol 
                                name={uploadedFile.type === 'صورة' ? "photo.fill" : uploadedFile.type === 'فيديو' ? "video.fill" : "doc.fill"} 
                                size={20} 
                                color="#4A90E2" 
                              />
                              <ThemedText style={styles.fileName}>{uploadedFile.name}</ThemedText>
                              <ThemedText style={styles.fileDetails}>{uploadedFile.size} • {uploadedFile.date}</ThemedText>
                            </ThemedView>
                          </ThemedView>
                        )}

                      <ThemedView style={styles.evidenceRowBottom}>
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
                        <ThemedView style={[styles.evidenceStatus, evidence.available ? styles.evidenceAvailable : styles.evidenceUnavailable]}>
                          <IconSymbol name={evidence.available ? "checkmark" : "xmark"} size={18} color={evidence.available ? '#fff' : '#fff'} />
                          <ThemedText style={styles.evidenceStatusText}>{evidence.available ? 'متوفر' : 'غير متوفر'}</ThemedText>
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
  container: { flex: 1, backgroundColor: '#f6fbfa', direction: 'rtl' },
  backgroundImage: { flex: 1, direction: 'rtl' },
  gradientOverlay: { flex: 1 },
  scrollView: { flex: 1, padding: 16, direction: 'rtl' },
  headerSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 24,
    backgroundColor: 'transparent',
    position: 'relative',
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
    writingDirection: 'rtl',
    color: '#000000',
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 16,
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
  overallScoreTitle: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginBottom: 0, textAlign: 'center' },
  overallScoreValue: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', lineHeight: 26, marginBottom: 0 },
  overallScoreLevel: { fontSize: 12, color: '#4CAF50', opacity: 0.9, textAlign: 'center', marginTop: -2 },
  cardMain: {
    backgroundColor: '#eaf6fa',
    borderRadius: 24,
    padding: 10,
    marginBottom: 12,
    alignItems: 'flex-end',
    direction: 'rtl',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  axisCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#b2e0e6', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', direction: 'rtl',
  },
  axisCircleText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', writingDirection: 'rtl', lineHeight: 44 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#2c3e50', textAlign: 'right', marginBottom: 4, writingDirection: 'rtl' },
  cardDesc: { fontSize: 16, color: '#4a4a4a', textAlign: 'right', marginBottom: 2, writingDirection: 'rtl' },
  cardWeight: { fontSize: 14, color: '#7f8c8d', textAlign: 'right', marginBottom: 12, writingDirection: 'rtl' },
  scoreSection: { alignItems: 'center', marginBottom: 8, direction: 'rtl' },
  scoreCircleBig: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4CAF50', marginBottom: 8, direction: 'rtl' },
  scorePercent: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', writingDirection: 'rtl' },
  scoreLevel: { fontSize: 18, color: '#4CAF50', fontWeight: '600', textAlign: 'center', writingDirection: 'rtl' },
  divider: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3, marginVertical: 12, width: '100%', direction: 'rtl' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginTop: 8, marginBottom: 4, textAlign: 'right', writingDirection: 'rtl' },
  sectionDesc: { fontSize: 15, color: '#34495e', marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  evidenceHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%', direction: 'rtl' },
  addEvidenceButton: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#d6f5e6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 8, direction: 'rtl' },
  addEvidenceText: { fontSize: 15, color: '#388e3c', fontWeight: 'bold', marginRight: 4, textAlign: 'right', writingDirection: 'rtl' },
  evidenceCardRow: { flexDirection: 'column', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1, direction: 'rtl' },
  evidenceName: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#2c3e50', textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-start' },
  evidenceRowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 },
  evidenceActionsRow: { flexDirection: 'row', alignItems: 'center' },
  evidenceActionBtn: { marginHorizontal: 2, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 6, direction: 'rtl' },
  evidenceStatus: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8, direction: 'rtl' },
  evidenceAvailable: { backgroundColor: '#4CAF50' },
  evidenceUnavailable: { backgroundColor: '#F44336' },
  evidenceStatusText: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 4, textAlign: 'right', writingDirection: 'rtl' },
  specialCardMain: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    direction: 'rtl',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  specialAxisCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', direction: 'rtl', borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 8,
  },
  specialAxisCircleText: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', writingDirection: 'rtl', lineHeight: 44 },
  specialCardTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 2, writingDirection: 'rtl' },
  specialCardDesc: { fontSize: 15, color: '#4a4a4a', textAlign: 'center', marginBottom: 1, writingDirection: 'rtl' },
  specialCardWeight: { fontSize: 13, color: '#7f8c8d', textAlign: 'center', marginBottom: 6, writingDirection: 'rtl' },
  specialScoreSection: { alignItems: 'center', marginBottom: 4 },
  specialScoreCircleBig: { 
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    backgroundColor: 'transparent', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    marginBottom: 4, 
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
    backgroundColor: '#fff5f5' 
  },
  specialScoreCircleGreen: { 
    borderColor: '#4CAF50', 
    backgroundColor: '#f5fff5' 
  },
  specialScorePercent: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    writingDirection: 'rtl', 
    lineHeight: 20,
    marginBottom: 0
  },
  specialScoreLevel: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    writingDirection: 'rtl', 
    marginTop: -2,
    lineHeight: 13
  },
  specialEvidenceDropdown: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: -16,
    marginBottom: 24,
    padding: 16,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
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
});
