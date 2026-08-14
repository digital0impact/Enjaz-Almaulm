import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Pressable, I18nManager, ImageBackground, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Modal, TextInput, View } from 'react-native';
import { AlertService } from '@/services/AlertService';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';
import { getPerformanceAxesByProfession, PerformanceAxis } from '@/constants/performance-axes';
import { PerformanceReportView } from '@/components/PerformanceReportView';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

/** المهن التي تعرض بطاقة "الأهداف" (نموذج تقييم أداء التشكيلات الإشرافية) */
const PROFESSIONS_WITH_OBJECTIVES = ['التشكيلات الإشرافية المشتركة', 'التشكيلات الإشرافية'];

const getDefaultObjectivesData = () =>
  Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    objective: '',
    measurementStandard: '',
    relativeWeight: '',
    targetedOutcome: '',
    actualOutcome: '',
    weightedRating: '',
  }));

export default function PerformanceScreen() {
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const [activeView, setActiveView] = useState<'cards' | 'report'>(view === 'report' ? 'report' : 'cards');
  const [userProfession, setUserProfession] = useState('معلم/ة');
  const [performanceData, setPerformanceData] = useState<PerformanceAxis[]>(() => getPerformanceAxesByProfession('معلم/ة'));

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
  const [objectivesData, setObjectivesData] = useState<Array<{ id: number; objective: string; measurementStandard: string; relativeWeight: string; targetedOutcome: string; actualOutcome: string; weightedRating: string }>>(getDefaultObjectivesData());

  const showObjectivesCard = PROFESSIONS_WITH_OBJECTIVES.includes(userProfession);

  // يبقي مفتاح التبديل متجاوبًا مع رابط ?view=report حتى لو كانت الشاشة محمّلة مسبقًا (تبويبات Expo Router تبقى في الذاكرة)
  useEffect(() => {
    if (view === 'report') {
      setActiveView('report');
    }
  }, [view]);

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

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfession();
    }, [])
  );

  const loadUserProfession = async () => {
    try {
      const basicData = await AsyncStorage.getItem('basicData');
      if (basicData) {
        const parsedData = JSON.parse(basicData);
        const newProfession = parsedData.profession || 'معلم/ة';
        
        if (newProfession !== userProfession) {
          console.log('Profession changed from', userProfession, 'to', newProfession);
          setUserProfession(newProfession);
          await forceUpdateCardsForProfession(newProfession);
        } else {
          await loadPerformanceData();
        }
      }
    } catch (error) {
      console.log('Error loading user profession:', error);
    }
  };

  // دالة للتحقق من سلامة بيانات الشواهد (تقبل available غير معرف كـ false)
  const validateEvidenceData = (data: any[]) => {
    if (!Array.isArray(data)) return false;
    
    return data.every(item => {
      if (!item.id || !item.title || !Array.isArray(item.evidence)) return false;
      return item.evidence.every((evidence: any) => 
        evidence && typeof evidence.name === 'string'
      );
    });
  };

  // تطبيع الشواهد: التأكد من أن available دائماً boolean (لتفادي فقدان الحفظ)
  const normalizeEvidenceAvailable = (data: any[]) => {
    return data.map(item => ({
      ...item,
      evidence: (item.evidence || []).map((ev: any) => ({
        ...ev,
        name: ev?.name ?? '',
        available: ev && typeof ev.available === 'boolean' ? ev.available : false,
      })),
    }));
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

  const getPerformanceDataByProfession = (profession: string): PerformanceAxis[] =>
    getPerformanceAxesByProfession(profession);

  const loadPerformanceData = async () => {
    try {
      console.log('Loading performance data for profession:', userProfession);
      const storedData = await AsyncStorage.getItem('performanceData');
      const currentProfessionData = getPerformanceDataByProfession(userProfession);
      
      if (storedData) {
        let parsedData: any[];
        try {
          parsedData = JSON.parse(storedData);
        } catch {
          parsedData = [];
        }
        console.log('Found stored data with', parsedData.length, 'performance items');
        
        const isDataValid = validateEvidenceData(parsedData);
        if (!isDataValid) {
          console.log('Stored data validation failed - corrupted evidence data detected');
          setPerformanceData(currentProfessionData);
          await AsyncStorage.setItem('performanceData', JSON.stringify(currentProfessionData));
          return;
        }
        
        const isDataMatching = parsedData.length === currentProfessionData.length && 
          parsedData.every((item, index) => 
            item.title === currentProfessionData[index]?.title
          );
          
        if (isDataMatching) {
          const normalized = normalizeEvidenceAvailable(parsedData);
          setPerformanceData(normalized);
          await AsyncStorage.setItem('performanceData', JSON.stringify(normalized));
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

      if (PROFESSIONS_WITH_OBJECTIVES.includes(userProfession)) {
        const storedObjectives = await AsyncStorage.getItem('performanceObjectivesData');
        if (storedObjectives) {
          try {
            const parsed = JSON.parse(storedObjectives);
            if (Array.isArray(parsed) && parsed.length >= 6) {
              setObjectivesData(parsed.slice(0, 6).map((r: any, i: number) => ({
                id: i + 1,
                objective: String(r.objective ?? ''),
                measurementStandard: String(r.measurementStandard ?? ''),
                relativeWeight: String(r.relativeWeight ?? ''),
                targetedOutcome: String(r.targetedOutcome ?? ''),
                actualOutcome: String(r.actualOutcome ?? ''),
                weightedRating: String(r.weightedRating ?? ''),
              })));
            } else {
              setObjectivesData(getDefaultObjectivesData());
            }
          } catch {
            setObjectivesData(getDefaultObjectivesData());
          }
        } else {
          setObjectivesData(getDefaultObjectivesData());
        }
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
    if (availableEvidence >= 5) return 100;
    return Math.round((availableEvidence / evidence.length) * 100);
  };

  /** المعدل الحقيقي: المتوسط المرجح للنسب الفعلية (مجموع (الدرجة × الوزن) ÷ مجموع الأوزان) */
  const calculateOverallAverage = () => {
    if (!performanceData || performanceData.length === 0) return 0;
    const totalWeight = performanceData.reduce((acc, p) => acc + (p.weight ?? 0), 0);
    if (totalWeight === 0) return 0;
    const weightedSum = performanceData.reduce(
      (acc, p) => acc + (p.score ?? 0) * (p.weight ?? 0),
      0
    );
    return Math.round(weightedSum / totalWeight);
  };

  const updatePerformanceData = async (newData: any[]) => {
    try {
      await AsyncStorage.setItem('performanceData', JSON.stringify(newData));
      setPerformanceData(newData);
    } catch (error) {
      console.error('Error updating performance data:', error);
      AlertService.alert('خطأ', 'حدث خطأ أثناء حفظ البيانات');
      throw error;
    }
  };

  const updateObjectiveRow = async (index: number, field: string, value: string) => {
    if (!showObjectivesCard || index < 0 || index >= objectivesData.length) return;
    const newData = objectivesData.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setObjectivesData(newData);
    try {
      await AsyncStorage.setItem('performanceObjectivesData', JSON.stringify(newData));
    } catch (e) {
      console.warn('Error saving objectives:', e);
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
      AlertService.alert('تنبيه', 'الرجاء إدخال اسم الشاهد.');
      return;
    }
    const performanceId = promptPerformanceId;
    const evidenceIndex = promptEvidenceIndex;
    try {
      if (promptMode === 'add') {
        await applyAddEvidence(performanceId, value);
        AlertService.alert('نجح', 'تمت إضافة الشاهد بنجاح');
      } else {
        await applyEditEvidence(performanceId, evidenceIndex, value);
        AlertService.alert('نجح', 'تم تعديل الشاهد بنجاح');
      }
      setPromptVisible(false);
      setPromptValue('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ';
      AlertService.alert('خطأ', msg);
    }
  };

  const deleteEvidence = (performanceId: number, evidenceIndex: number) => {
    AlertService.alert(
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
        AlertService.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لرفع الشواهد.');
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

      AlertService.alert('نجح', 'تم رفع الصورة بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في اختيار الصورة';
      console.log('Error picking image:', error);
      AlertService.alert('خطأ', message);
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

      AlertService.alert('نجح', 'تم رفع الوثيقة بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في اختيار الوثيقة';
      console.log('Error picking document:', error);
      AlertService.alert('خطأ', message);
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
        AlertService.alert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور لرفع الفيديو.');
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

      AlertService.alert('نجح', 'تم رفع الفيديو بنجاح');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل في اختيار الفيديو';
      console.log('Error picking video:', error);
      AlertService.alert('خطأ', message);
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

    AlertService.alert('نجح', 'تم حذف الملف بنجاح');
  };

  const savePerformanceData = async () => {
    try {
      await AsyncStorage.setItem('performanceData', JSON.stringify(performanceData));
      AlertService.alert('نجح', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      console.log('Error saving performance data:', error);
      AlertService.alert('خطأ', 'فشل في حفظ البيانات');
    }
  };

  const resetPerformanceData = () => {
    AlertService.alert(
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
            AlertService.alert('نجح', 'تم إعادة تعيين البيانات بنجاح');
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
            
            {/* مفتاح التبديل بين البطاقات والتقرير الكامل */}
            <ThemedView style={styles.viewToggleRow}>
              <TouchableOpacity
                style={[styles.viewToggleButton, activeView === 'cards' && styles.viewToggleButtonActive]}
                onPress={() => setActiveView('cards')}
                activeOpacity={0.7}
              >
                <IconSymbol size={16} name="list.bullet" color={activeView === 'cards' ? '#fff' : '#0f6e5c'} />
                <ThemedText style={[styles.viewToggleButtonText, activeView === 'cards' && styles.viewToggleButtonTextActive]}>المحاور</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleButton, activeView === 'report' && styles.viewToggleButtonActive]}
                onPress={() => setActiveView('report')}
                activeOpacity={0.7}
              >
                <IconSymbol size={16} name="chart.bar.fill" color={activeView === 'report' ? '#fff' : '#0f6e5c'} />
                <ThemedText style={[styles.viewToggleButtonText, activeView === 'report' && styles.viewToggleButtonTextActive]}>التقرير الكامل</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {activeView === 'cards' && (
              <>
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
              </>
            )}
                          </ThemedView>

          {/* بطاقة الأهداف (نموذج تقييم أداء التشكيلات الإشرافية) - للجدارات المشتركة والقيادية فقط */}
          {activeView === 'cards' && showObjectivesCard && (
            <ThemedView style={styles.objectivesCard}>
              <ThemedText style={[styles.objectivesCardTitle, getTextDirection()]}>
                {formatRTLText(
                  userProfession === 'التشكيلات الإشرافية'
                    ? 'نموذج تقييم أداء التشكيلات الإشرافية - الأهداف'
                    : 'نموذج تقييم أداء التشكيلات الإشرافية (المشتركة) - الأهداف'
                )}
              </ThemedText>
              <ThemedView style={styles.objectivesTableHeader}>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColM]}>م</ThemedText>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColObjective]}>الهدف</ThemedText>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColStandard]}>معيار القياس</ThemedText>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColWeight]}>الوزن النسبي</ThemedText>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColTarget]}>الناتج المستهدف</ThemedText>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColActual]}>الناتج الفعلي</ThemedText>
                <ThemedText style={[styles.objectivesTh, getTextDirection(), styles.objectivesColRating]}>التقدير الموزون</ThemedText>
              </ThemedView>
              {objectivesData.map((row, index) => (
                <ThemedView key={row.id} style={styles.objectivesRow}>
                  <ThemedText style={[styles.objectivesTdM, getTextDirection()]}>{row.id}</ThemedText>
                  <TextInput
                    style={[styles.objectivesInput, getTextDirection(), styles.objectivesColObjective]}
                    value={row.objective}
                    onChangeText={(v) => updateObjectiveRow(index, 'objective', v)}
                    placeholder="الهدف"
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={[styles.objectivesInput, getTextDirection(), styles.objectivesColStandard]}
                    value={row.measurementStandard}
                    onChangeText={(v) => updateObjectiveRow(index, 'measurementStandard', v)}
                    placeholder="معيار القياس"
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={[styles.objectivesInput, getTextDirection(), styles.objectivesColWeight]}
                    value={row.relativeWeight}
                    onChangeText={(v) => updateObjectiveRow(index, 'relativeWeight', v)}
                    placeholder="الوزن"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.objectivesInput, getTextDirection(), styles.objectivesColTarget]}
                    value={row.targetedOutcome}
                    onChangeText={(v) => updateObjectiveRow(index, 'targetedOutcome', v)}
                    placeholder="الناتج المستهدف"
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={[styles.objectivesInput, getTextDirection(), styles.objectivesColActual]}
                    value={row.actualOutcome}
                    onChangeText={(v) => updateObjectiveRow(index, 'actualOutcome', v)}
                    placeholder="الناتج الفعلي"
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={[styles.objectivesInput, getTextDirection(), styles.objectivesColRating]}
                    value={row.weightedRating}
                    onChangeText={(v) => updateObjectiveRow(index, 'weightedRating', v)}
                    placeholder="التقدير"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </ThemedView>
              ))}
            </ThemedView>
          )}

          {/* Performance Cards */}
          {activeView === 'cards' && performanceData.map((performance, idx) => {
            const evidenceTotal = performance.evidence.length;
            const evidenceAvailable = performance.evidence.filter((e) => e.available).length;
            const axisStatus =
              evidenceAvailable === 0 ? 'لم يبدأ' : evidenceAvailable === evidenceTotal ? 'مكتمل' : 'قيد التنفيذ';
            const axisStatusStyle =
              evidenceAvailable === 0
                ? styles.axisStatusPending
                : evidenceAvailable === evidenceTotal
                ? styles.axisStatusDone
                : styles.axisStatusProgress;
            return (
            <React.Fragment key={performance.id}>
              <TouchableOpacity style={styles.specialCardMain} activeOpacity={0.9} onPress={() => setSelectedPerformance(selectedPerformance === performance.id ? null : performance.id)}>
                {/* شريط عنوان المحور الملوّن (بأسلوب ملف الإنجاز) */}
                <ThemedView style={styles.axisHeaderBar}>
                  <ThemedView style={styles.axisHeaderBadge}>
                    <ThemedText style={styles.axisHeaderBadgeText}>{idx + 1}</ThemedText>
                  </ThemedView>
                  <ThemedText style={styles.axisHeaderTitle} numberOfLines={2}>{formatRTLText(performance.title)}</ThemedText>
                  <ThemedView style={styles.axisHeaderWeightPill}>
                    <ThemedText style={styles.axisHeaderWeightText}>{formatRTLText(`الوزن ${performance.weight}%`)}</ThemedText>
                  </ThemedView>
                </ThemedView>
                {/* وصف مختصر */}
                <ThemedText style={styles.specialCardDesc} numberOfLines={2}>{formatRTLText(performance.description || '')}</ThemedText>
                {/* صف بادجات المعلومات (شواهد / حالة) بأسلوب الملف */}
                <ThemedView style={styles.axisInfoBadgesRow}>
                  <ThemedView style={styles.axisInfoBadge}>
                    <IconSymbol name="doc.text.fill" size={14} color="#0f6e5c" />
                    <ThemedText style={styles.axisInfoBadgeText}>{formatRTLText(`الشواهد ${evidenceAvailable}/${evidenceTotal}`)}</ThemedText>
                  </ThemedView>
                  <ThemedView style={[styles.axisInfoBadge, axisStatusStyle]}>
                    <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />
                    <ThemedText style={[styles.axisInfoBadgeText, { color: '#fff' }]}>{formatRTLText(axisStatus)}</ThemedText>
                  </ThemedView>
                </ThemedView>
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
            );
          })}

          {/* التقرير الكامل (الرسوم البيانية، الشواهد المجمّعة، التصدير) */}
          {activeView === 'report' && <PerformanceReportView />}

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
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef7f4',
    borderRadius: 24,
    padding: 4,
    marginVertical: 12,
    gap: 4,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#0f6e5c',
  },
  viewToggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f6e5c',
    writingDirection: 'rtl',
  },
  viewToggleButtonTextActive: {
    color: '#fff',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  /* شريط عنوان المحور الملوّن — بأسلوب رأس التقرير في ملف الإنجاز */
  axisHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f6e5c',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginTop: -20,
    marginHorizontal: -20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  axisHeaderBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisHeaderBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  axisHeaderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
    flexWrap: 'wrap',
  },
  axisHeaderWeightPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  axisHeaderWeightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    writingDirection: 'rtl',
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
  /* صف بادجات المعلومات (الشواهد/الحالة) — بأسلوب صناديق المعلومات في ملف الإنجاز */
  axisInfoBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  axisInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef7f4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  axisInfoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f6e5c',
    writingDirection: 'rtl',
  },
  axisStatusPending: { backgroundColor: '#9aa5a1' },
  axisStatusProgress: { backgroundColor: '#b8720a' },
  axisStatusDone: { backgroundColor: '#2f8f5f' },
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
  objectivesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  objectivesCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1f33',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  objectivesTableHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    marginBottom: 8,
  },
  objectivesTh: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  objectivesRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  objectivesTdM: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  objectivesInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
    marginHorizontal: 4,
  },
  objectivesColM: { width: 28, minWidth: 28, maxWidth: 28, flex: 0 },
  objectivesColObjective: { flex: 1.2, minWidth: 70 },
  objectivesColStandard: { flex: 1.2, minWidth: 70 },
  objectivesColWeight: { flex: 0.5, minWidth: 48 },
  objectivesColTarget: { flex: 1, minWidth: 60 },
  objectivesColActual: { flex: 1, minWidth: 60 },
  objectivesColRating: { flex: 0.5, minWidth: 48 },
});
