import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('performanceData');
      if (storedData) {
        setPerformanceData(JSON.parse(storedData));
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
    return 'يحتاج تحسين';
  };

  const calculateScoreBasedOnEvidence = (evidence: any[]) => {
    const availableEvidence = evidence.filter(item => item.available).length;
    if (availableEvidence >= 2) {
      return 100;
    }
    // إذا كان أقل من شاهدين، احتفظ بالنسبة الأصلية
    return null;
  };

  const calculateOverallAverage = () => {
    const weightedSum = performanceData.reduce((acc, item) => acc + (item.score * item.weight), 0);
    const totalWeight = performanceData.reduce((acc, item) => acc + item.weight, 0);
    return Math.round(weightedSum / totalWeight);
  };

  const toggleEvidenceStatus = (performanceId: number, evidenceIndex: number) => {
    setPerformanceData(prevData => 
      prevData.map(item => {
        if (item.id === performanceId) {
          const updatedEvidence = item.evidence.map((evidence, index) => 
            index === evidenceIndex 
              ? { ...evidence, available: !evidence.available }
              : evidence
          );

          // احسب النسبة الجديدة بناءً على الشواهد المتوفرة
          const newScore = calculateScoreBasedOnEvidence(updatedEvidence);

          return {
            ...item,
            evidence: updatedEvidence,
            score: newScore !== null ? newScore : item.score
          };
        }
        return item;
      })
    );
  };

  const toggleEvidenceDetails = (performanceId: number, evidenceIndex: number) => {
    if (selectedEvidence && 
        selectedEvidence.performanceId === performanceId && 
        selectedEvidence.evidenceIndex === evidenceIndex) {
      setSelectedEvidence(null);
    } else {
      setSelectedEvidence({ performanceId, evidenceIndex });
    }
  };

  const addEvidence = (performanceId: number) => {
    Alert.prompt(
      'إضافة شاهد جديد',
      'أدخل اسم الشاهد الجديد:',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'إضافة',
          onPress: (evidenceName) => {
            if (evidenceName && evidenceName.trim()) {
              setPerformanceData(prevData => 
                prevData.map(item => {
                  if (item.id === performanceId) {
                    const updatedEvidence = [...item.evidence, { name: evidenceName.trim(), available: false }];
                    const newScore = calculateScoreBasedOnEvidence(updatedEvidence);

                    return {
                      ...item,
                      evidence: updatedEvidence,
                      score: newScore !== null ? newScore : item.score
                    };
                  }
                  return item;
                })
              );
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const editEvidence = (performanceId: number, evidenceIndex: number, currentName: string) => {
    Alert.prompt(
      'تعديل الشاهد',
      'قم بتعديل اسم الشاهد:',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حفظ',
          onPress: (newName) => {
            if (newName && newName.trim()) {
              setPerformanceData(prevData => 
                prevData.map(item => 
                  item.id === performanceId 
                    ? {
                        ...item,
                        evidence: item.evidence.map((evidence, index) => 
                          index === evidenceIndex 
                            ? { ...evidence, name: newName.trim() }
                            : evidence
                        )
                      }
                    : item
                )
              );
            }
          },
        },
      ],
      'plain-text',
      currentName
    );
  };

  const deleteEvidence = (performanceId: number, evidenceIndex: number) => {
    Alert.alert(
      'حذف الشاهد',
      'هل أنت متأكد من رغبتك في حذف هذا الشاهد؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            setPerformanceData(prevData => 
              prevData.map(item => {
                if (item.id === performanceId) {
                  const updatedEvidence = item.evidence.filter((_, index) => index !== evidenceIndex);
                  const newScore = calculateScoreBasedOnEvidence(updatedEvidence);

                  return {
                    ...item,
                    evidence: updatedEvidence,
                    score: newScore !== null ? newScore : item.score
                  };
                }
                return item;
              })
            );
          },
        },
      ]
    );
  };

  const pickImage = async (performanceId: number, evidenceIndex: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        const fileKey = `${performanceId}-${evidenceIndex}`;
        const fileSize = image.fileSize ? (image.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '2.5 MB';

        const newFile = {
          name: `صورة_${Date.now()}.jpg`,
          size: fileSize,
          date: new Date().toLocaleDateString('ar-SA'),
          type: 'image',
          uri: image.uri
        };

        setUploadedFiles(prev => ({
          ...prev,
          [fileKey]: newFile
        }));

        // تحديث حالة الشاهد تلقائياً إلى متوفر
        const currentEvidence = performanceData.find(item => item.id === performanceId)?.evidence[evidenceIndex];
        if (currentEvidence && !currentEvidence.available) {
          toggleEvidenceStatus(performanceId, evidenceIndex, true);
        }

        Alert.alert('نجح التحميل', `تم تحميل الصورة بنجاح: ${newFile.name}`);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل الصورة');
    }
  };

  const pickDocument = async (performanceId: number, evidenceIndex: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const document = result.assets[0];
        const fileKey = `${performanceId}-${evidenceIndex}`;
        const fileSize = document.size ? (document.size / (1024 * 1024)).toFixed(2) + ' MB' : '1.5 MB';

        const newFile = {
          name: document.name || `مستند_${Date.now()}.pdf`,
          size: fileSize,
          date: new Date().toLocaleDateString('ar-SA'),
          type: 'document',
          uri: document.uri
        };

        setUploadedFiles(prev => ({
          ...prev,
          [fileKey]: newFile
        }));

        // تحديث حالة الشاهد تلقائياً إلى متوفر
        const currentEvidence = performanceData.find(item => item.id === performanceId)?.evidence[evidenceIndex];
        if (currentEvidence && !currentEvidence.available) {
          toggleEvidenceStatus(performanceId, evidenceIndex, true);
        }

        Alert.alert('نجح التحميل', `تم تحميل المستند بنجاح: ${newFile.name}`);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل المستند');
    }
  };

  const pickVideo = async (performanceId: number, evidenceIndex: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        const fileKey = `${performanceId}-${evidenceIndex}`;
        const fileSize = video.fileSize ? (video.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '5.0 MB';

        const newFile = {
          name: `فيديو_${Date.now()}.mp4`,
          size: fileSize,
          date: new Date().toLocaleDateString('ar-SA'),
          type: 'video',
          uri: video.uri
        };

        setUploadedFiles(prev => ({
          ...prev,
          [fileKey]: newFile
        }));

        // تحديث حالة الشاهد تلقائياً إلى متوفر
        const currentEvidence = performanceData.find(item => item.id === performanceId)?.evidence[evidenceIndex];
        if (currentEvidence && !currentEvidence.available) {
          toggleEvidenceStatus(performanceId, evidenceIndex, true);
        }

        Alert.alert('نجح التحميل', `تم تحميل الفيديو بنجاح: ${newFile.name}`);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل الفيديو');
    }
  };

  const handleFileUpload = (performanceId: number, evidenceIndex: number) => {
    Alert.alert(
      'تحميل ملف',
      'اختر نوع الملف:',
      [
        {
          text: 'صورة',
          onPress: () => pickImage(performanceId, evidenceIndex)
        },
        {
          text: 'مستند',
          onPress: () => pickDocument(performanceId, evidenceIndex)
        },
        {
          text: 'فيديو',
          onPress: () => pickVideo(performanceId, evidenceIndex)
        },
        { text: 'إلغاء', style: 'cancel' }
      ]
    );
  };

  const deleteFile = (performanceId: number, evidenceIndex: number) => {
    const fileKey = `${performanceId}-${evidenceIndex}`;
    Alert.alert(
      'حذف الملف',
      'هل أنت متأكد من رغبتك في حذف هذا الملف؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            setUploadedFiles(prev => {
              const newFiles = { ...prev };
              delete newFiles[fileKey];
              return newFiles;
            });
            Alert.alert('تم الحذف', 'تم حذف الملف بنجاح');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <ScrollView style={styles.scrollContainer}>
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="arrow.right" color="#1c1f33" />
              </TouchableOpacity>

              <IconSymbol size={60} name="chart.bar.fill" color="#1c1f33" />
              <ThemedText type="title" style={styles.title}>
                تقييم محاور الأداء المهني
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                تقييم شامل لأدائك في المجالات المهنية المختلفة وفقاً للنظام المعتمد
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.summaryCard}>
              <ThemedText type="subtitle" style={[styles.summaryTitle, { textAlign: 'center' }]}>
                المتوسط العام للأداء
              </ThemedText>
              <ThemedText style={[styles.averageScore, { color: getScoreColor(calculateOverallAverage()) }]}>
                {calculateOverallAverage()}%
              </ThemedText>
              <ThemedText style={styles.averageLevel}>
                {getScoreLevel(calculateOverallAverage())}
              </ThemedText>


            </ThemedView>

            <ThemedView style={styles.content}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    محاور الأداء المهني
                  </ThemedText>

                  <ThemedView style={styles.performanceGrid}>
                    {performanceData.map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.performanceCard}
                        onPress={() => 
                          setSelectedPerformance(selectedPerformance === item.id ? null : item.id)
                        }
                      >
                        <ThemedView style={styles.cardHeader}>
                          <ThemedView style={styles.cardNumberContainer}>
                            <ThemedText style={styles.itemNumber}>
                              {index + 1}
                            </ThemedText>
                          </ThemedView>

                          <ThemedView style={styles.cardContent}>
                            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                              {item.title}
                            </ThemedText>
                            <ThemedText style={styles.cardDescription}>
                              {item.description.length > 60 
                                ? item.description.substring(0, 60) + '...' 
                                : item.description}
                            </ThemedText>
                            <ThemedText style={styles.weightText}>
                              الوزن: {item.weight}%
                            </ThemedText>
                          </ThemedView>

                          <ThemedView style={styles.scoreContainer}>
                            <ThemedText style={[styles.score, { color: getScoreColor(item.score) }]}>
                              {item.score}%
                            </ThemedText>
                            <ThemedText style={[styles.scoreLevel, { color: getScoreColor(item.score) }]}>
                              {getScoreLevel(item.score)}
                            </ThemedText>
                          </ThemedView>
                        </ThemedView>

                        <ThemedView style={styles.progressBar}>
                          <ThemedView 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${item.score}%`,
                                backgroundColor: getScoreColor(item.score)
                              }
                            ]} 
                          />
                        </ThemedView>

              {selectedPerformance === item.id && (
                <ThemedView style={styles.detailsContainer}>
                  <ThemedText style={styles.detailsTitle}>تفاصيل التقييم:</ThemedText>
                  <ThemedText style={styles.detailsText}>{item.details}</ThemedText>

                  <ThemedView style={styles.evidenceHeaderRow}>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={() => addEvidence(item.id)}
                    >
                      <IconSymbol 
                        size={16} 
                        name="plus.circle.fill" 
                        color="#1c1f33" 
                      />
                      <ThemedText style={styles.addButtonText}>إضافة شاهد</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.evidenceTitle}>الشواهد المطلوبة:</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.evidenceContainer}>
                    {/* قائمة الشواهد */}
                    <ThemedView style={styles.evidenceList}>
                      {item.evidence.map((evidenceItem, index) => (
                        <ThemedView key={index}>
                          <TouchableOpacity 
                            style={[
                              styles.evidenceItem,
                              evidenceItem.available ? styles.evidenceAvailable : styles.evidenceUnavailable
                            ]}
                            onPress={() => toggleEvidenceDetails(item.id, index)}
                          >
                            <TouchableOpacity 
                              style={styles.uploadIcon}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleFileUpload(item.id, index);
                              }}
                            >
                              <IconSymbol 
                                size={14} 
                                name="arrow.up.doc.fill" 
                                color="#424242" 
                              />
                            </TouchableOpacity>
                            <IconSymbol 
                              size={8} 
                              name={evidenceItem.available ? "checkmark" : "xmark"} 
                              color={evidenceItem.available ? "#4CAF50" : "#F44336"} 
                            />
                            <ThemedText style={[
                              styles.evidenceText,
                              evidenceItem.available ? styles.evidenceAvailableText : styles.evidenceUnavailableText
                            ]}>
                              {evidenceItem.name}
                            </ThemedText>
                            <ThemedText style={[
                              styles.evidenceStatus,
                              evidenceItem.available ? styles.evidenceAvailableStatus : styles.evidenceUnavailableStatus
                            ]}>
                              {evidenceItem.available ? 'متوفر' : 'غير متوفر'}
                            </ThemedText>
                            <ThemedView style={styles.evidenceActions}>
                              <TouchableOpacity 
                                style={styles.editButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  editEvidence(item.id, index, evidenceItem.name);
                                }}
                              >
                                <IconSymbol 
                                  size={10} 
                                  name="pencil.circle.fill" 
                                  color="#FF9800" 
                                />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.deleteButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  deleteEvidence(item.id, index);
                                }}
                              >
                                <IconSymbol 
                                  size={10} 
                                  name="trash.circle.fill" 
                                  color="#F44336" 
                                />
                              </TouchableOpacity>
                            </ThemedView>
                            <IconSymbol 
                              size={12} 
                              name={selectedEvidence?.performanceId === item.id && selectedEvidence?.evidenceIndex === index ? "chevron.up" : "chevron.down"} 
                              color="#666666" 
                              style={styles.evidenceExpandIcon}
                            />
                          </TouchableOpacity>

                          {selectedEvidence?.performanceId === item.id && selectedEvidence?.evidenceIndex === index && (
                            <ThemedView style={styles.evidenceDropdown}>
                              <ThemedText style={styles.evidenceDropdownTitle}>تفاصيل الشاهد:</ThemedText>

                              {uploadedFiles[`${item.id}-${index}`] ? (
                                <ThemedView style={styles.fileDetailsContainer}>
                                  <ThemedView style={styles.fileHeaderRow}>
                                    <TouchableOpacity 
                                      style={styles.deleteFileButton}
                                      onPress={() => deleteFile(item.id, index)}
                                    >
                                      <IconSymbol size={14} name="trash.fill" color="#F44336" />
                                    </TouchableOpacity>
                                    <ThemedText style={styles.fileDetailsTitle}>الملف المحمل:</ThemedText>
                                  </ThemedView>
                                  <ThemedView style={styles.fileInfoRow}>
                                    <IconSymbol 
                                      size={16} 
                                      name={
                                        uploadedFiles[`${item.id}-${index}`].type === 'image' ? "photo.fill" :
                                        uploadedFiles[`${item.id}-${index}`].type === 'video' ? "video.fill" :
                                        "doc.fill"
                                      } 
                                      color={
                                        uploadedFiles[`${item.id}-${index}`].type === 'image' ? "#4CAF50" :
                                        uploadedFiles[`${item.id}-${index}`].type === 'video' ? "#FF9800" :
                                        "#2196F3"
                                      } 
                                    />
                                    <ThemedView style={styles.fileInfo}>
                                      <ThemedText style={styles.fileName}>
                                        {uploadedFiles[`${item.id}-${index}`].name}
                                      </ThemedText>
                                      <ThemedText style={styles.fileSize}>
                                        الحجم: {uploadedFiles[`${item.id}-${index}`].size}
                                      </ThemedText>
                                      <ThemedText style={styles.fileDate}>
                                        تاريخ التحميل: {uploadedFiles[`${item.id}-${index}`].date}
                                      </ThemedText>
                                      <ThemedText style={styles.fileType}>
                                        النوع: {
                                          uploadedFiles[`${item.id}-${index}`].type === 'image' ? 'صورة' :
                                          uploadedFiles[`${item.id}-${index}`].type === 'video' ? 'فيديو' :
                                          'مستند'
                                        }
                                      </ThemedText>
                                    </ThemedView>
                                  </ThemedView>
                                  <ThemedView style={styles.fileActionsRow}>
                                    <TouchableOpacity 
                                      style={styles.shareFileButton}
                                      onPress={() => Alert.alert('مشاركة الملف', `مشاركة ملف: ${uploadedFiles[`${item.id}-${index}`].name}`)}
                                    >
                                      <IconSymbol size={14} name="square.and.arrow.up.fill" color="#4CAF50" />
                                      <ThemedText style={styles.shareFileButtonText}>مشاركة</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      style={styles.viewFileButton}
                                      onPress={() => Alert.alert('عرض الملف', `فتح ملف: ${uploadedFiles[`${item.id}-${index}`].name}`)}
                                    >
                                      <IconSymbol size={14} name="eye.fill" color="#2196F3" />
                                      <ThemedText style={styles.viewFileButtonText}>عرض الملف</ThemedText>
                                    </TouchableOpacity>
                                  </ThemedView>
                                </ThemedView>
                              ) : (
                                <ThemedView style={styles.noFileContainer}>
                                  <IconSymbol size={20} name="doc.badge.plus" color="#999" />
                                  <ThemedText style={styles.noFileText}>لم يتم تحميل ملف بعد</ThemedText>
                                  <ThemedText style={styles.noFileHint}>اضغط على أيقونة التحميل لرفع ملف</ThemedText>
                                  <TouchableOpacity 
                                    style={styles.uploadHereButton}
                                    onPress={() => handleFileUpload(item.id, index)}
                                  >
                                    <IconSymbol size={16} name="arrow.up.doc.fill" color="#2196F3" />
                                    <ThemedText style={styles.uploadHereButtonText}>تحميل ملف</ThemedText>
                                  </TouchableOpacity>
                                </ThemedView>
                              )}
                            </ThemedView>
                          )}
                        </ThemedView>
                      ))}
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              )}

              <IconSymbol 
                size={16} 
                name={selectedPerformance === item.id ? "chevron.up" : "chevron.down"} 
                color="#666666" 
                style={styles.expandIcon}
              />
            </TouchableOpacity>
                    ))}
                  </ThemedView>
                </ThemedView>
          </ScrollView>
        </ExpoLinearGradient>
      </ImageBackground>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
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
  title: {
    color: '#1c1f33',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  subtitle: {
    color: '#1c1f33',
    fontSize: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
    opacity: 0.9,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  performanceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  performanceHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  expandIcon: {
    marginRight: I18nManager.isRTL ? 10 : 0,
    marginLeft: I18nManager.isRTL ? 0 : 10,
  },
  performanceDetails: {
    padding: 15,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceContainer: {
    marginBottom: 15,
  },
  evidenceList: {
    flex: 1,
  },
  evidenceItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 4,
    marginBottom: 3,
  },
  evidenceName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceStatus: {
    fontSize: 8,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f1f3',
    padding: 12,
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scoreInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    minWidth: 60,
  },
  weightContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
  },
  evidenceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 5,
  },
  addButtonText: {
    color: '#1c1f33',
    fontSize: 14,
    fontWeight: '600',
  },
  addEvidenceButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 4,
  },
  addEvidenceButtonHover: {
    backgroundColor: '#cadfde',
  },
  addEvidenceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceActions: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: 8,
    marginRight: I18nManager.isRTL ? 8 : 0,
    marginLeft: I18nManager.isRTL ? 0 : 8,
  },
  editButton: {
    padding: 2,
    borderRadius: 6,
    backgroundColor: '#FFF3E0',
  },
  deleteButton: {
    padding: 2,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
  },
  weightText: {
    fontSize: 12,
    color: '#1c1f33',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  expandIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cadfde',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  reportButtonHover: {
    backgroundColor: '#b8d1cd',
    transform: [{ scale: 1.02 }],
  },
  improveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#cadfde',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  improveButtonHover: {
    backgroundColor: '#b8d1cd',
    transform: [{ scale: 1.02 }],
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  averageContainer: {
    alignItems: 'center',
  },
  averageScore: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  averageLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 20,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  performanceGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  performanceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginBottom: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 15,
  },
  performanceCardHover: {
    backgroundColor: '#cadfde',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  cardNumberContainer: {
    backgroundColor: '#add4ce',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  cardContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1c1f33',
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  scoreLevel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    marginBottom: 15,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -15,
  },
  evidenceText: {
    fontSize: 10,
    flex: 1,
    marginHorizontal: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceAvailable: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  evidenceUnavailable: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  evidenceAvailableText: {
    color: '#2E7D32',
  },
  evidenceUnavailableText: {
    color: '#D32F2F',
  },
  evidenceAvailableStatus: {
    backgroundColor: '#4CAF50',
    color: 'white',
    textAlign: 'center',
  },
  evidenceUnavailableStatus: {
    backgroundColor: '#F44336',
    color: 'white',
    textAlign: 'center',
  },
  uploadIcon: {
    padding: 1,
    borderRadius: 4,
    backgroundColor: '#E8E9EB',
  },
  summaryCard: {
    backgroundColor: '#add4ce',
    borderRadius: 8,
    marginBottom: 10,
    padding: 8,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1f33',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#add4ce',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  evidenceExpandIcon: {
    marginLeft: 8,
  },
  evidenceDropdown: {
    backgroundColor: '#f8f9fa',
    marginTop: 5,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  evidenceDropdownTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceDropdownText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  evidenceDropdownActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  statusToggleButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
  },
  statusToggleText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  viewFileButton: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 6,
  },
  viewFileText: {
    fontSize: 11,
    color: '#2196F3',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileDetailsContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  fileDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileInfoRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileSize: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  viewFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 4,
    flex: 1,
  },
  viewFileButtonText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noFileContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  noFileText: {
    fontSize: 11,
    color: '#999',
    marginTop: 5,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  noFileHint: {
    fontSize: 9,
    color: '#ccc',
    marginTop: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  uploadHereButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
    gap: 4,
  },
  uploadHereButtonText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  fileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteFileButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  fileType: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fileActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  shareFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 4,
    flex: 1,
  },
  shareFileButtonText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  demoTeacher: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  mainInteractiveButton: {
    backgroundColor: '#1c1f33',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  mainInteractiveButtonHover: {
    backgroundColor: '#373a4e',
  },
  mainInteractiveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  filesContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  filesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filesCountTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  deleteAllFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  deleteAllFilesText: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  fileIndexTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addMoreFilesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    gap: 6,
  },
  addMoreFilesButtonText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});