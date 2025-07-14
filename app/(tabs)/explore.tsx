import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ThemedView style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
              </TouchableOpacity>

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="gear" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                الأدوات المساعدة
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                مجموعة من الأدوات المفيدة لتسهيل عملك اليومي
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              <ThemedView style={styles.toolsGrid}>
                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/official-holidays')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={28} name="calendar.badge.plus" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>الإجازات الرسمية</ThemedText>
                  <ThemedText style={styles.toolDescription}>جدول الإجازات والعطل الرسمية</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/calendar')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={28} name="calendar" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>التقويم الهجري والميلادي</ThemedText>
                  <ThemedText style={styles.toolDescription}>عرض التقويم بالتاريخين الهجري والميلادي</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/absence-management')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={28} name="calendar.badge.exclamationmark" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>إدارة غيابي</ThemedText>
                  <ThemedText style={styles.toolDescription}>تسجيل ومتابعة أيام الغياب الشخصية</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCard}
                  onPress={() => router.push('/alerts-management')}
                >
                  <ThemedView style={styles.toolIconWrapper}>
                    <IconSymbol size={28} name="bell.fill" color="#1c1f33" />
                  </ThemedView>
                  <ThemedText style={styles.toolTitle}>التنبيهات المهمة</ThemedText>
                  <ThemedText style={styles.toolDescription}>إنشاء وإدارة التنبيهات والتذكيرات</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
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
    marginBottom: 10,
    textAlign: 'center',
    writingDirection: 'rtl',
    color: '#000000',
    backgroundColor: 'transparent',
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
  toolsGrid: {
    flexDirection: 'column',
    gap: 15,
    backgroundColor: 'transparent',
  },
  toolCard: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 15,
  },
  toolIconWrapper: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#add4ce',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});
