import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ToolsScreen() {
  const handleToolPress = (tool: string) => {
    Alert.alert('قريباً', `أداة ${tool} ستكون متاحة قريباً`);
  };

  const tools = [
    {
      id: 1,
      title: 'التقويم الهجري والميلادي',
      description: 'عرض التواريخ الهجرية والميلادية مع التحويل بينهما',
      icon: 'calendar',
      color: '#4CAF50',
      category: 'أساسية',
    },
    {
      id: 2,
      title: 'الإجازات الرسمية',
      description: 'قائمة بالإجازات الرسمية والمناسبات الوطنية',
      icon: 'calendar.badge.clock',
      color: '#FF9800',
      category: 'أساسية',
    },
    {
      id: 3,
      title: 'التنبيهات',
      description: 'إدارة التنبيهات والمذكرات المهمة',
      icon: 'bell.fill',
      color: '#F44336',
      category: 'أساسية',
    },
    {
      id: 4,
      title: 'متتبع الغياب',
      description: 'تتبع وإدارة غياب الطلاب والحضور',
      icon: 'person.crop.circle.badge.xmark',
      color: '#9C27B0',
      category: 'أساسية',
    },
  ];

  const categories = [...new Set(tools.map(tool => tool.category))];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={60} name="wrench.and.screwdriver.fill" color="#2196F3" />
        <ThemedText type="title" style={styles.title}>
          الأدوات المساعدة
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          مجموعة من الأدوات لتطوير وتحسين أدائك المهني
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {categories.map((category) => (
          <ThemedView key={category} style={styles.categorySection}>
            <ThemedText type="subtitle" style={styles.categoryTitle}>
              أدوات {category}
            </ThemedText>

            <ThemedView style={styles.toolsGrid}>
              {tools
                .filter(tool => tool.category === category)
                .map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.toolCard}
                    onPress={() => handleToolPress(tool.title)}
                  >
                    <ThemedView style={[styles.iconContainer, { backgroundColor: `${tool.color}15` }]}>
                      <IconSymbol size={32} name={tool.icon as any} color={tool.color} />
                    </ThemedView>
                    <ThemedView style={styles.toolContent}>
                      <ThemedText type="defaultSemiBold" style={styles.toolTitle}>
                        {tool.title}
                      </ThemedText>
                      <ThemedText style={styles.toolDescription}>
                        {tool.description}
                      </ThemedText>
                    </ThemedView>
                    <IconSymbol size={16} name="chevron.left" color="#666666" />
                  </TouchableOpacity>
                ))}
            </ThemedView>
          </ThemedView>
        ))}

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
  content: {
    marginBottom: 30,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    marginBottom: 10,
    textAlign: 'right',
    fontSize: 18,
  },
  toolsGrid: {
    flexDirection: 'column',
  },
  toolCard: {
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
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolContent: {
    flex: 1,
    marginRight: 15,
  },
  toolTitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  toolDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'right',
  },
  helpSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 15,
    textAlign: 'center',
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