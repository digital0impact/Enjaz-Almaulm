import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import { AlertService } from '@/services/AlertService';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const CONTACT_EMAIL = 'info@enjaz-almaulm.com';
const CONTACT_TELEGRAM_URL = 'https://t.me/Enjaz_Almualm';

export default function ContactScreen() {
  const router = useRouter();

  const handleContactEmail = async () => {
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}`);
    } catch {
      AlertService.alert(formatRTLText('البريد الإلكتروني'), CONTACT_EMAIL);
    }
  };

  const handleContactTelegram = async () => {
    try {
      await Linking.openURL(CONTACT_TELEGRAM_URL);
    } catch {
      AlertService.alert(formatRTLText('تيليجرام'), CONTACT_TELEGRAM_URL);
    }
  };

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
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ThemedView style={styles.header}>
              <ThemedButton
                icon="chevron.left"
                iconColor="#1c1f33"
                style={styles.backButton}
                onPress={() => router.back()}
              />

              <ThemedView style={styles.iconContainer}>
                <IconSymbol size={60} name="questionmark.circle" color="#1c1f33" />
              </ThemedView>
              <ThemedText type="title" style={[styles.title, getTextDirection()]}>
                {formatRTLText('تواصل معنا')}
              </ThemedText>
              <ThemedText style={[styles.subtitle, getTextDirection()]}>
                {formatRTLText('يسعدنا تواصلك معنا عبر إحدى الوسيلتين التاليتين')}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
              <ThemedCard style={styles.contactCard}>
                <TouchableOpacity
                  onPress={handleContactEmail}
                  activeOpacity={0.7}
                  style={styles.contactRow}
                >
                  <ThemedView style={styles.contactInfo}>
                    <IconSymbol size={24} name="envelope.fill" color="#2563eb" />
                    <ThemedView style={styles.contactText}>
                      <ThemedText style={[styles.contactRowTitle, getTextDirection()]}>البريد الإلكتروني</ThemedText>
                      <ThemedText style={[styles.contactRowDescription, getTextDirection()]}>{CONTACT_EMAIL}</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={20} name="chevron.left" color="#666" />
                </TouchableOpacity>

                <ThemedView style={styles.contactDivider} />

                <TouchableOpacity
                  onPress={handleContactTelegram}
                  activeOpacity={0.7}
                  style={styles.contactRow}
                >
                  <ThemedView style={styles.contactInfo}>
                    <IconSymbol size={24} name="paperplane.fill" color="#0d9488" />
                    <ThemedView style={styles.contactText}>
                      <ThemedText style={[styles.contactRowTitle, getTextDirection()]}>تيليجرام</ThemedText>
                      <ThemedText style={[styles.contactRowDescription, getTextDirection()]}>راسلينا مباشرة عبر تيليجرام</ThemedText>
                    </ThemedView>
                  </ThemedView>
                  <IconSymbol size={20} name="chevron.left" color="#666" />
                </TouchableOpacity>
              </ThemedCard>
            </ThemedView>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
      <BottomNavigationBar />
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 30,
    paddingBottom: 15,
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
    marginBottom: 20,
  },
  content: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contactRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  contactInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  contactText: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  contactRowTitle: {
    fontSize: 16,
    color: '#1c1f33',
    textAlign: 'right',
    backgroundColor: 'transparent',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactRowDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
    backgroundColor: 'transparent',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 14,
  },
});
