
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, I18nManager } from 'react-native';
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
      }
    ]
  },
  {
    id: 2,
    category: 'أذكار الصباح',
    icon: 'sun.max.fill',
    color: '#FF9500',
    azkar: [
      {
        text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
        count: 1
      },
      {
        text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
        count: 1
      },
      {
        text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        count: 100
      }
    ]
  },
  {
    id: 3,
    category: 'أذكار المساء',
    icon: 'moon.fill',
    color: '#5856D6',
    azkar: [
      {
        text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
        count: 1
      },
      {
        text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
        count: 1
      }
    ]
  },
  {
    id: 4,
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
  }
];

export default function AzkarScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentCounts, setCurrentCounts] = useState<{[key: string]: number}>({});

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

  if (selectedCategory) {
    const category = azkarData.find(cat => cat.id === selectedCategory);
    if (!category) return null;

    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedCategory(null)}
          >
            <IconSymbol size={24} name="arrow.right" color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            {category.category}
          </ThemedText>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.back()}
          >
            <IconSymbol size={24} name="house.fill" color="#007AFF" />
          </TouchableOpacity>
        </ThemedView>

        <ScrollView style={styles.azkarContainer} showsVerticalScrollIndicator={false}>
          {category.azkar.map((zikr, index) => {
            const key = `${selectedCategory}-${index}`;
            const currentCount = currentCounts[key] || 0;
            const isCompleted = currentCount >= zikr.count;

            return (
              <ThemedView 
                key={index} 
                style={[
                  styles.azkarCard,
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
                      onPress={() => handleCountIncrement(selectedCategory, index, zikr.count)}
                      disabled={isCompleted}
                    >
                      <IconSymbol 
                        size={20} 
                        name={isCompleted ? "checkmark" : "plus"} 
                        color={isCompleted ? "#34C759" : "white"} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.resetButton}
                      onPress={() => resetCount(selectedCategory, index)}
                    >
                      <IconSymbol size={16} name="arrow.clockwise" color="#FF3B30" />
                    </TouchableOpacity>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol size={24} name="arrow.right" color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          أذكاري
        </ThemedText>
        <ThemedView style={styles.placeholder} />
      </ThemedView>

      <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionTitle}>
          اختر فئة الأذكار
        </ThemedText>
        
        {azkarData.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { borderLeftColor: category.color }]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <ThemedView style={styles.categoryContent}>
              <ThemedView style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <IconSymbol size={24} name={category.icon as any} color="white" />
              </ThemedView>
              
              <ThemedView style={styles.categoryInfo}>
                <ThemedText style={styles.categoryTitle}>
                  {category.category}
                </ThemedText>
                <ThemedText style={styles.categoryCount}>
                  {category.azkar.length} ذكر
                </ThemedText>
              </ThemedView>
              
              <IconSymbol size={20} name="chevron.left" color="#C7C7CC" />
            </ThemedView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  homeButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  categoriesContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 20,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: I18nManager.isRTL ? 0 : 15,
    marginLeft: I18nManager.isRTL ? 15 : 0,
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
  azkarContainer: {
    flex: 1,
    padding: 20,
  },
  azkarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
