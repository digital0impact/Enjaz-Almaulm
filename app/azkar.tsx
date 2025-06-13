
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, I18nManager, ImageBackground, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

const azkarData = [
  {
    id: 1,
    category: 'آيات قرآنية',
    icon: 'book.closed.fill',
    color: '#8E44AD',
    azkar: [
      {
        text: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\n\nاللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ\n\n[آية الكرسي - البقرة 255]',
        count: 1
      },
      {
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ\n\n[سورة الإخلاص]',
        count: 3
      },
      {
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ\n\n[سورة الفلق]',
        count: 3
      },
      {
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ\n\n[سورة الناس]',
        count: 3
      }
    ]
  },
  {
    id: 2,
    category: 'أذكار الصباح والمساء',
    icon: 'sun.and.horizon.fill',
    color: '#FF9500',
    azkar: [
      {
        text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ\n\n[ذكر الصباح]',
        count: 1
      },
      {
        text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ\n\n[ذكر المساء]',
        count: 1
      },
      {
        text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ\n\n[ذكر الصباح]',
        count: 1
      },
      {
        text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ\n\n[ذكر المساء]',
        count: 1
      },
      {
        text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ\n\n[للصباح والمساء]',
        count: 100
      }
    ]
  },
  {
    id: 3,
    category: 'أذكار بعد الصلاة',
    icon: 'hands.clap.fill',
    color: '#34C759',
    azkar: [
      {
        text: 'أَسْتَغْفِرُ اللَّهَ',
        count: 3
      },
      {
        text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        count: 1
      },
      {
        text: 'سُبْحَانَ اللَّهِ',
        count: 33
      },
      {
        text: 'الْحَمْدُ لِلَّهِ',
        count: 33
      },
      {
        text: 'اللَّهُ أَكْبَرُ',
        count: 34
      }
    ]
  },
  {
    id: 4,
    category: 'أذكار إضافية من القرآن والسنة',
    icon: 'book.fill',
    color: '#2196F3',
    azkar: [
      {
        text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        count: 3
      },
      {
        text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        count: 3
      },
      {
        text: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        count: 7
      },
      {
        text: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        count: 1
      }
    ]
  },
  {
    id: 5,
    category: 'أذكار النوم',
    icon: 'bed.double.fill',
    color: '#9C27B0',
    azkar: [
      {
        text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
        count: 1
      },
      {
        text: 'اللَّهُمَّ أَنْتَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا لَكَ مَمَاتُهَا وَمَحْيَاهَا إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
        count: 1
      },
      {
        text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
        count: 3
      }
    ]
  },
  {
    id: 6,
    category: 'أذكار الاستيقاظ',
    icon: 'sun.and.horizon.fill',
    color: '#FF5722',
    azkar: [
      {
        text: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        count: 1
      },
      {
        text: 'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي وَرَدَّ عَلَيَّ رُوحِي وَأَذِنَ لِي بِذِكْرِهِ',
        count: 1
      },
      {
        text: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        count: 1
      }
    ]
  },
  {
    id: 7,
    category: 'أذكار الطعام',
    icon: 'fork.knife',
    color: '#4CAF50',
    azkar: [
      {
        text: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
        count: 1
      },
      {
        text: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
        count: 1
      },
      {
        text: 'اللَّهُمَّ أَطْعِمْ مَنْ أَطْعَمَنِي وَاسْقِ مَنْ سَقَانِي',
        count: 1
      }
    ]
  },
  {
    id: 8,
    category: 'أذكار الدخول والخروج',
    icon: 'door.left.hand.open',
    color: '#795548',
    azkar: [
      {
        text: 'بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
        count: 1
      },
      {
        text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ وَرَحْمَتِكَ فَإِنَّهُ لَا يَمْلِكُهَا إِلَّا أَنْتَ',
        count: 1
      },
      {
        text: 'اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا وَفِي لِسَانِي نُورًا وَاجْعَلْ لِي نُورًا',
        count: 1
      }
    ]
  }
];

export default function AzkarScreen() {
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [currentCounts, setCurrentCounts] = useState<{[key: string]: number}>({});

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCountIncrement = (categoryId: number, azkarIndex: number, maxCount: number) => {
    const key = `${categoryId}-${azkarIndex}`;
    const currentCount = currentCounts[key] || 0;
    if (currentCount < maxCount) {
      setCurrentCounts(prev => ({
        ...prev,
        [key]: currentCount + 1
      }));
    }
  };

  const resetCount = (categoryId: number, azkarIndex: number) => {
    const key = `${categoryId}-${azkarIndex}`;
    setCurrentCounts(prev => ({
      ...prev,
      [key]: 0
    }));
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.9)', 'rgba(225,245,244,0.95)', 'rgba(173,212,206,0.8)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView style={styles.scrollContainer}>
              <ThemedView style={styles.header}>
                <ThemedView style={styles.iconContainer}>
                  <IconSymbol size={60} name="book.fill" color="#1c1f33" />
                </ThemedView>
                <ThemedView style={styles.titleRow}>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <IconSymbol size={16} name="arrow.right" color="#1c1f33" />
                  </TouchableOpacity>
                  <ThemedText type="title" style={styles.title}>
                    أذكاري
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.subtitle}>
                  اختر فئة الأذكار للبدء في التسبيح والذكر
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.content}>

                <ThemedView style={[styles.dataSection, { backgroundColor: 'transparent' }]}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    فئات الأذكار
                  </ThemedText>
                  
                  {azkarData.map((category) => (
                    <ThemedView key={category.id} style={styles.categoryContainer}>
                      <TouchableOpacity
                        style={styles.dataItem}
                        onPress={() => toggleCategory(category.id)}
                      >
                        <ThemedView style={styles.categoryContent}>
                          <ThemedView style={styles.categoryIconContainer}>
                            <IconSymbol size={24} name={category.icon as any} color="#1c1f33" />
                          </ThemedView>
                          
                          <ThemedView style={styles.categoryInfo}>
                            <ThemedText style={styles.categoryTitle}>
                              {category.category}
                            </ThemedText>
                            <ThemedText style={styles.categoryCount}>
                              {category.azkar.length} {category.azkar.length === 1 ? 'ذكر' : 'أذكار'}
                            </ThemedText>
                          </ThemedView>
                          
                          <IconSymbol 
                            size={20} 
                            name={expandedCategories.includes(category.id) ? "chevron.up" : "chevron.down"} 
                            color="#C7C7CC" 
                          />
                        </ThemedView>
                      </TouchableOpacity>

                      {expandedCategories.includes(category.id) && (
                        <ThemedView style={styles.azkarDropdown}>
                          {category.azkar.map((zikr, index) => {
                            const key = `${category.id}-${index}`;
                            const currentCount = currentCounts[key] || 0;
                            const isCompleted = currentCount >= zikr.count;

                            return (
                              <ThemedView 
                                key={index} 
                                style={[
                                  styles.azkarItem,
                                  isCompleted && styles.completedCard
                                ]}
                              >
                                <ThemedText style={styles.azkarText}>
                                  {zikr.text}
                                </ThemedText>
                                
                                <ThemedView style={styles.counterContainer}>
                                  <ThemedText style={styles.counterText}>
                                    {currentCount} / {zikr.count}
                                  </ThemedText>
                                  
                                  <ThemedView style={styles.counterButtons}>
                                    <TouchableOpacity 
                                      style={[
                                        styles.counterButton,
                                        isCompleted && styles.completedButton
                                      ]}
                                      onPress={() => handleCountIncrement(category.id, index, zikr.count)}
                                      disabled={isCompleted}
                                    >
                                      <IconSymbol 
                                        size={20} 
                                        name={isCompleted ? "checkmark" : "plus"} 
                                        color={isCompleted ? "#34C759" : "#1c1f33"} 
                                      />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                      style={styles.resetButton}
                                      onPress={() => resetCount(category.id, index)}
                                    >
                                      <IconSymbol size={16} name="arrow.clockwise" color="#FF3B30" />
                                    </TouchableOpacity>
                                  </ThemedView>
                                </ThemedView>
                              </ThemedView>
                            );
                          })}
                        </ThemedView>
                      )}
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            </ScrollView>
          </KeyboardAvoidingView>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
  },
  backButton: {
    backgroundColor: '#add4ce',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  content: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  
  dataSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  categoryContainer: {
    marginBottom: 10,
  },
  dataItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e0f0f1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : 15,
    marginLeft: I18nManager.isRTL ? 15 : 0,
    backgroundColor: 'transparent',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  azkarDropdown: {
    marginTop: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
  azkarItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f7f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: '#F0F9F0',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  azkarText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#000000',
    marginBottom: 15,
  },
  counterContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  counterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  counterButton: {
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
  },
  completedButton: {
    backgroundColor: '#34C759',
  },
  resetButton: {
    backgroundColor: '#F2F2F7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});
