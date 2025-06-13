
import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();

  const tools = [
    {
      id: 1,
      title: 'متتبع المواقع وكلمات المرور',
      description: 'إدارة وحفظ كلمات المرور والمواقع المهمة',
      icon: 'lock.shield.fill',
      route: '/password-tracker',
      color: '#FF6B6B'
    },
    {
      id: 2,
      title: 'تتبع حالة متعلم',
      description: 'متابعة تطور الطلاب وتسجيل الملاحظات',
      icon: 'person.crop.circle.badge.plus',
      route: '/student-tracking',
      color: '#4ECDC4'
    },
    {
      id: 3,
      title: 'إدارة الغياب',
      description: 'تسجيل ومتابعة غياب الطلاب',
      icon: 'calendar.badge.minus',
      route: '/absence-management',
      color: '#45B7D1'
    },
    {
      id: 4,
      title: 'إدارة التنبيهات',
      description: 'إنشاء وإدارة التنبيهات والتذكيرات',
      icon: 'bell.badge.fill',
      route: '/alerts-management',
      color: '#FFA07A'
    },
    {
      id: 5,
      title: 'الأذكار',
      description: 'مجموعة شاملة من الأذكار اليومية',
      icon: 'book.closed.fill',
      route: '/azkar',
      color: '#98D8C8'
    },
    {
      id: 6,
      title: 'التقويم الشهري',
      description: 'عرض وإدارة الأحداث الشهرية',
      icon: 'calendar',
      route: '/monthly-calendar',
      color: '#F7DC6F'
    },
    {
      id: 7,
      title: 'الإجازات الرسمية',
      description: 'جدول الإجازات والعطل الرسمية',
      icon: 'calendar.badge.plus',
      route: '/official-holidays',
      color: '#BB8FCE'
    },
    {
      id: 8,
      title: 'الجدول الأسبوعي',
      description: 'عرض وتنظيم الجدول الأسبوعي',
      icon: 'calendar.day.timeline.leading',
      route: '/schedule',
      color: '#85C1E9'
    }
  ];

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
              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="wrench.and.screwdriver.fill" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                الأدوات المساعدة
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                مجموعة من الأدوات المفيدة لتسهيل عملك اليومي
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              {tools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={styles.dataCard}
                  onPress={() => router.push(tool.route)}
                >
                  <ThemedView style={styles.cardContent}>
                    <ThemedView style={styles.cardIconContainer}>
                      <ThemedView style={[styles.iconBackground, { backgroundColor: tool.color + '20' }]}>
                        <IconSymbol size={28} name={tool.icon} color={tool.color} />
                      </ThemedView>
                    </ThemedView>
                    <ThemedView style={styles.cardTextContainer}>
                      <ThemedText style={styles.cardTitle}>
                        {tool.title}
                      </ThemedText>
                      <ThemedText style={styles.cardDescription}>
                        {tool.description}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.cardArrow}>
                      <IconSymbol size={16} name="chevron.left" color="#8E8E93" />
                    </ThemedView>
                  </ThemedView>
                </TouchableOpacity>
              ))}

              <ThemedView style={styles.helpSection}>
                <ThemedText type="subtitle" style={styles.helpTitle}>
                  هل تحتاج مساعدة؟
                </ThemedText>
                <ThemedText style={styles.helpText}>
                  يمكنك الوصول إلى دليل الاستخدام أو التواصل مع الدعم الفني من خلال الإعدادات
                </ThemedText>
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={() => router.push('/settings')}
                >
                  <IconSymbol size={20} name="questionmark.circle.fill" color="#1c1f33" />
                  <ThemedText style={styles.helpButtonText}>مركز المساعدة</ThemedText>
                </TouchableOpacity>
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
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
  },
  content: {
    backgroundColor: 'transparent',
    gap: 15,
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  cardIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  cardArrow: {
    padding: 8,
  },
  helpSection: {
    backgroundColor: '#add4ce',
    borderRadius: 15,
    padding: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 20,
    lineHeight: 22,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  helpButtonText: {
    color: '#1c1f33',
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
});
