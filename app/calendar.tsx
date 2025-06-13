import React from 'react';
import { StyleSheet, ScrollView, ImageBackground, Platform } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function CalendarScreen() {
  const getCurrentDate = () => {
    const today = new Date();
    const gregorian = today.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'gregory'
    });
    const hijri = today.toLocaleDateString('ar-SA-u-ca-islamic');
    return { gregorian, hijri };
  };

  const { gregorian, hijri } = getCurrentDate();

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
                <IconSymbol size={60} name="calendar" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={styles.title}>
                التقويم الهجري والميلادي
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                عرض التقويم بالتاريخين الهجري والميلادي
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              <ThemedView style={styles.calendarSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  التاريخ اليوم
                </ThemedText>

                <ThemedView style={styles.dateCard}>
                  <ThemedView style={styles.dateRow}>
                    <ThemedView style={styles.dateIconWrapper}>
                      <IconSymbol size={24} name="calendar.circle" color="#007AFF" />
                    </ThemedView>
                    <ThemedView style={styles.dateInfo}>
                      <ThemedText style={styles.dateLabel}>التاريخ الميلادي</ThemedText>
                      <ThemedText style={styles.dateValue}>{gregorian}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.dateCard}>
                  <ThemedView style={styles.dateRow}>
                    <ThemedView style={styles.dateIconWrapper}>
                      <IconSymbol size={24} name="moon.circle" color="#4CAF50" />
                    </ThemedView>
                    <ThemedView style={styles.dateInfo}>
                      <ThemedText style={styles.dateLabel}>التاريخ الهجري</ThemedText>
                      <ThemedText style={styles.dateValue}>{hijri}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedView>
              </ThemedView>

              <ThemedView style={styles.calendarSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  معلومات إضافية
                </ThemedText>

                <ThemedView style={styles.infoCard}>
                  <ThemedView style={styles.infoRow}>
                    <ThemedView style={styles.infoIconWrapper}>
                      <IconSymbol size={20} name="info.circle" color="#FF9500" />
                    </ThemedView>
                    <ThemedText style={styles.infoText}>
                      التقويم الهجري يعتمد على دورة القمر
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.infoCard}>
                  <ThemedView style={styles.infoRow}>
                    <ThemedView style={styles.infoIconWrapper}>
                      <IconSymbol size={20} name="info.circle" color="#FF9500" />
                    </ThemedView>
                    <ThemedText style={styles.infoText}>
                      التقويم الميلادي يعتمد على دورة الشمس
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
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
    padding: 30,
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
    marginTop: 15,
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
    padding: 20,
    backgroundColor: 'transparent',
  },
  calendarSection: {
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  dateCard: {
    marginBottom: 15,
    padding: 20,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  dateIconWrapper: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 5,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoCard: {
    marginBottom: 12,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrapper: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
});