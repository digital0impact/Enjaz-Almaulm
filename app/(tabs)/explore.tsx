
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ExploreScreen() {
  const handleFeaturePress = (feature: string) => {
    Alert.alert('قريباً', `ميزة ${feature} ستكون متاحة قريباً`);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="lightbulb.fill" color="#FFB74D" />
        <ThemedText type="title" style={styles.title}>
          استكشف المزيد
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          اكتشف المزيد من الميزات والأدوات المتاحة
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featuresContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          الميزات المتقدمة
        </ThemedText>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => handleFeaturePress('تقارير مفصلة')}
        >
          <IconSymbol size={32} name="doc.text.fill" color="#4CAF50" />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">تقارير مفصلة</ThemedText>
            <ThemedText style={styles.featureDescription}>
              احصل على تقارير شاملة عن أدائك المهني
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => handleFeaturePress('مشاركة البورتفوليو')}
        >
          <IconSymbol size={32} name="square.and.arrow.up" color="#2196F3" />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">مشاركة البورتفوليو</ThemedText>
            <ThemedText style={styles.featureDescription}>
              شارك إنجازاتك مع الزملاء والإدارة
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => handleFeaturePress('النسخ الاحتياطي')}
        >
          <IconSymbol size={32} name="icloud.and.arrow.up" color="#FF9800" />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">النسخ الاحتياطي</ThemedText>
            <ThemedText style={styles.featureDescription}>
              احتفظ ببياناتك آمنة مع النسخ الاحتياطي التلقائي
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => handleFeaturePress('التقويم التعليمي')}
        >
          <IconSymbol size={32} name="calendar.badge.plus" color="#9C27B0" />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">التقويم التعليمي</ThemedText>
            <ThemedText style={styles.featureDescription}>
              نظم جدولك الدراسي والمهام اليومية
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureCard}
          onPress={() => handleFeaturePress('التعلم المستمر')}
        >
          <IconSymbol size={32} name="graduationcap.fill" color="#607D8B" />
          <ThemedView style={styles.featureContent}>
            <ThemedText type="defaultSemiBold">التعلم المستمر</ThemedText>
            <ThemedText style={styles.featureDescription}>
              دورات ومواد تطوير مهني متخصصة
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.helpSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          المساعدة والدعم
        </ThemedText>
        
        <TouchableOpacity 
          style={styles.helpCard}
          onPress={() => Alert.alert('المساعدة', 'يمكنك التواصل معنا عبر البريد الإلكتروني')}
        >
          <IconSymbol size={24} name="questionmark.circle.fill" color="#4CAF50" />
          <ThemedText>الأسئلة الشائعة</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.helpCard}
          onPress={() => Alert.alert('الدعم الفني', 'سيتم التواصل معك قريباً')}
        >
          <IconSymbol size={24} name="phone.fill" color="#2196F3" />
          <ThemedText>الدعم الفني</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginVertical: 15,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 15,
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  helpSection: {
    marginBottom: 30,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
});
