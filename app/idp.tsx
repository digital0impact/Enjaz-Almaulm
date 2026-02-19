import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const GREEN = '#059669';

export default function IDPScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [entity, setEntity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [objectives70, setObjectives70] = useState<string[]>(['', '', '']);
  const [objectives20, setObjectives20] = useState<string[]>(['', '', '']);
  const [objectives10, setObjectives10] = useState<string[]>(['', '', '']);
  const [priorityObjectives, setPriorityObjectives] = useState([
    { objective: '', activities: '', endDate: '', supporter: '', procedures: '', successCriteria: '' },
    { objective: '', activities: '', endDate: '', supporter: '', procedures: '', successCriteria: '' },
    { objective: '', activities: '', endDate: '', supporter: '', procedures: '', successCriteria: '' },
  ]);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      const s = await AsyncStorage.getItem('idpForm');
      if (s) {
        const data = JSON.parse(s);
        if (data.name) setName(data.name);
        if (data.entity) setEntity(data.entity);
        if (data.startDate) setStartDate(data.startDate);
        if (data.endDate) setEndDate(data.endDate);
        if (data.objectives70) setObjectives70(data.objectives70);
        if (data.objectives20) setObjectives20(data.objectives20);
        if (data.objectives10) setObjectives10(data.objectives10);
        if (data.priorityObjectives) setPriorityObjectives(data.priorityObjectives);
      }
    } catch (_) {}
  };

  const saveForm = async () => {
    try {
      await AsyncStorage.setItem('idpForm', JSON.stringify({
        name, entity, startDate, endDate,
        objectives70, objectives20, objectives10,
        priorityObjectives,
      }));
    } catch (_) {}
  };

  useEffect(() => {
    const t = setTimeout(saveForm, 500);
    return () => clearTimeout(t);
  }, [name, entity, startDate, endDate, objectives70, objectives20, objectives10, priorityObjectives]);

  const updateObjective70 = (i: number, v: string) => {
    const next = [...objectives70];
    next[i] = v;
    setObjectives70(next);
  };
  const updateObjective20 = (i: number, v: string) => {
    const next = [...objectives20];
    next[i] = v;
    setObjectives20(next);
  };
  const updateObjective10 = (i: number, v: string) => {
    const next = [...objectives10];
    next[i] = v;
    setObjectives10(next);
  };
  const updatePriority = (row: number, field: keyof typeof priorityObjectives[0], value: string) => {
    const next = [...priorityObjectives];
    next[row] = { ...next[row], [field]: value };
    setPriorityObjectives(next);
  };

  return (
    <ThemedView style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <IconSymbol size={20} name="chevron.left" color="#1c1f33" />
            </TouchableOpacity>
            <ThemedView style={styles.titleRow}>
              <ThemedView style={styles.tealBar} />
              <ThemedText type="title" style={[styles.mainTitle, getTextDirection()]}>
                {formatRTLText('خطة التطوير الفردية (IDP)')}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* نموذج خطة التطوير الفردية */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText('نموذج خطة التطوير الفردية')}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>الإسم</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={name}
                  onChangeText={setName}
                  placeholder={formatRTLText('الإسم')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>الجهة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={entity}
                  onChangeText={setEntity}
                  placeholder={formatRTLText('الجهة')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.formRow}>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>تاريخ بداية الخطة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder={formatRTLText('YYYY-MM-DD')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
              <ThemedView style={styles.fieldBlock}>
                <ThemedText style={[styles.label, getTextDirection()]}>تاريخ نهاية الخطة</ThemedText>
                <TextInput
                  style={[styles.input, getTextDirection()]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder={formatRTLText('YYYY-MM-DD')}
                  placeholderTextColor="#999"
                />
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* مجالات التطوير المهني - 70-20-10 */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText('مجالات التطوير المهني')}
              </ThemedText>
            </ThemedView>
            <View style={styles.gridTable}>
              <View style={styles.gridRow}>
                <View style={[styles.cellDiagonal, styles.cellHeader]}>
                  <ThemedText style={styles.diagText1}>المنهجية</ThemedText>
                  <ThemedText style={styles.diagText2}>الأهداف</ThemedText>
                </View>
                <View style={[styles.cellHeader, styles.cellWide]}>
                  <ThemedText style={[styles.cellHeaderText, getTextDirection()]}>
                    {formatRTLText('التعلم من خلال التجارب والخبرات (70%)')}
                  </ThemedText>
                  <ThemedText style={[styles.exampleText, getTextDirection()]}>
                    {formatRTLText('مثال: مجتمعات التعلم المهنية')}
                  </ThemedText>
                </View>
                <View style={[styles.cellHeader, styles.cellWide]}>
                  <ThemedText style={[styles.cellHeaderText, getTextDirection()]}>
                    {formatRTLText('التعلم من خلال الآخرين (20%)')}
                  </ThemedText>
                  <ThemedText style={[styles.exampleText, getTextDirection()]}>
                    {formatRTLText('مثال: دورات وندوات تعليمية')}
                  </ThemedText>
                </View>
                <View style={[styles.cellHeader, styles.cellWide]}>
                  <ThemedText style={[styles.cellHeaderText, getTextDirection()]}>
                    {formatRTLText('التعلم المباشر (10%)')}
                  </ThemedText>
                  <ThemedText style={[styles.exampleText, getTextDirection()]}>
                    {formatRTLText('مثال: تعلم نظامي - التعلم الذاتي - الاطلاع والقراءة')}
                  </ThemedText>
                </View>
              </View>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.gridRow}>
                  <View style={styles.cellObjective}>
                    <ThemedText style={[styles.objectiveLabel, getTextDirection()]}>
                      {formatRTLText(i === 0 ? 'الهدف الأول' : i === 1 ? 'الهدف الثاني' : 'الهدف الثالث')}
                    </ThemedText>
                  </View>
                  <View style={styles.cellWide}>
                    <TextInput
                      style={[styles.cellInput, getTextDirection()]}
                      value={objectives70[i]}
                      onChangeText={(v) => updateObjective70(i, v)}
                      placeholder={formatRTLText('...')}
                      placeholderTextColor="#999"
                      multiline
                    />
                  </View>
                  <View style={styles.cellWide}>
                    <TextInput
                      style={[styles.cellInput, getTextDirection()]}
                      value={objectives20[i]}
                      onChangeText={(v) => updateObjective20(i, v)}
                      placeholder={formatRTLText('...')}
                      placeholderTextColor="#999"
                      multiline
                    />
                  </View>
                  <View style={styles.cellWide}>
                    <TextInput
                      style={[styles.cellInput, getTextDirection()]}
                      value={objectives10[i]}
                      onChangeText={(v) => updateObjective10(i, v)}
                      placeholder={formatRTLText('...')}
                      placeholderTextColor="#999"
                      multiline
                    />
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>

          {/* الأهداف التطورية بحسب الأولوية */}
          <ThemedView style={styles.section}>
            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, getTextDirection()]}>
                {formatRTLText('الأهداف التطورية بحسب الأولوية')}
              </ThemedText>
            </ThemedView>
            <View style={styles.priorityTable}>
              <View style={styles.priorityRow}>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader, styles.priorityNum]}>
                  <ThemedText style={styles.priorityHeaderText}>{formatRTLText('الأهداف التطورية بحسب الأولوية')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader]}>
                  <ThemedText style={[styles.priorityHeaderText, getTextDirection()]}>{formatRTLText('الأهداف التطويرية')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader]}>
                  <ThemedText style={[styles.priorityHeaderText, getTextDirection()]}>{formatRTLText('الأنشطة بناء على 10-20-70')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader]}>
                  <ThemedText style={[styles.priorityHeaderText, getTextDirection()]}>{formatRTLText('تاريخ الانتهاء من الهدف')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader]}>
                  <ThemedText style={[styles.priorityHeaderText, getTextDirection()]}>{formatRTLText('الداعم الرئيسي')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader]}>
                  <ThemedText style={[styles.priorityHeaderText, getTextDirection()]}>{formatRTLText('الإجراءات التفصيلية')}</ThemedText>
                </ThemedView>
                <ThemedView style={[styles.priorityCell, styles.priorityHeader]}>
                  <ThemedText style={[styles.priorityHeaderText, getTextDirection()]}>{formatRTLText('معايير النجاح')}</ThemedText>
                </ThemedView>
              </View>
              {[0, 1, 2].map((row) => (
                <View key={row} style={styles.priorityRow}>
                  <ThemedView style={[styles.priorityCell, styles.priorityNum, styles.greenCell]}>
                    <ThemedText style={styles.priorityNumText}>{row + 1}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.priorityCell}>
                    <TextInput
                      style={[styles.priorityInput, getTextDirection()]}
                      value={priorityObjectives[row].objective}
                      onChangeText={(v) => updatePriority(row, 'objective', v)}
                      placeholder="..."
                      placeholderTextColor="#999"
                      multiline
                    />
                  </ThemedView>
                  <ThemedView style={styles.priorityCell}>
                    <TextInput
                      style={[styles.priorityInput, getTextDirection()]}
                      value={priorityObjectives[row].activities}
                      onChangeText={(v) => updatePriority(row, 'activities', v)}
                      placeholder="..."
                      placeholderTextColor="#999"
                      multiline
                    />
                  </ThemedView>
                  <ThemedView style={styles.priorityCell}>
                    <TextInput
                      style={[styles.priorityInput, getTextDirection()]}
                      value={priorityObjectives[row].endDate}
                      onChangeText={(v) => updatePriority(row, 'endDate', v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#999"
                    />
                  </ThemedView>
                  <ThemedView style={styles.priorityCell}>
                    <TextInput
                      style={[styles.priorityInput, getTextDirection()]}
                      value={priorityObjectives[row].supporter}
                      onChangeText={(v) => updatePriority(row, 'supporter', v)}
                      placeholder="..."
                      placeholderTextColor="#999"
                    />
                  </ThemedView>
                  <ThemedView style={styles.priorityCell}>
                    <TextInput
                      style={[styles.priorityInput, getTextDirection()]}
                      value={priorityObjectives[row].procedures}
                      onChangeText={(v) => updatePriority(row, 'procedures', v)}
                      placeholder="..."
                      placeholderTextColor="#999"
                      multiline
                    />
                  </ThemedView>
                  <ThemedView style={styles.priorityCell}>
                    <TextInput
                      style={[styles.priorityInput, getTextDirection()]}
                      value={priorityObjectives[row].successCriteria}
                      onChangeText={(v) => updatePriority(row, 'successCriteria', v)}
                      placeholder="..."
                      placeholderTextColor="#999"
                      multiline
                    />
                  </ThemedView>
                </View>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={{ height: 100 }} />
        </ScrollView>
        <BottomNavigationBar />
      </ImageBackground>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40 },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: Platform.OS === 'ios' ? 0 : -8,
    backgroundColor: '#add4ce',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  tealBar: {
    width: 6,
    height: 44,
    backgroundColor: TEAL,
    borderRadius: 3,
    marginLeft: 10,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1c1f33',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    backgroundColor: TEAL,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  formRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  fieldBlock: { flex: 1, minWidth: 140 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1c1f33',
    backgroundColor: '#f9fafb',
  },
  gridTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gridRow: { flexDirection: 'row-reverse' },
  cellDiagonal: {
    width: 72,
    minHeight: 52,
    backgroundColor: '#f0fdf4',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagText1: { fontSize: 11, fontWeight: '600', color: GREEN },
  diagText2: { fontSize: 11, fontWeight: '600', color: GREEN, marginTop: 2 },
  cellHeader: {
    flex: 1,
    minWidth: 100,
    padding: 8,
    backgroundColor: TEAL_LIGHT,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
  },
  cellHeaderText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  exampleText: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  cellWide: {
    flex: 1,
    minWidth: 100,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 56,
  },
  cellObjective: {
    width: 72,
    minHeight: 52,
    backgroundColor: '#dcfce7',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  objectiveLabel: { fontSize: 12, fontWeight: '600', color: GREEN, textAlign: 'center' },
  cellInput: {
    flex: 1,
    padding: 8,
    fontSize: 12,
    color: '#1c1f33',
    textAlignVertical: 'top',
  },
  priorityTable: { borderWidth: 1, borderColor: '#e5e7eb' },
  priorityRow: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  priorityCell: {
    flex: 1,
    minWidth: 90,
    padding: 6,
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 44,
  },
  priorityHeader: { backgroundColor: TEAL },
  priorityHeaderText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  priorityNum: { minWidth: 44, maxWidth: 52, justifyContent: 'center', alignItems: 'center' },
  greenCell: { backgroundColor: '#dcfce7' },
  priorityNumText: { fontSize: 16, fontWeight: '700', color: GREEN },
  priorityInput: {
    flex: 1,
    padding: 4,
    fontSize: 11,
    color: '#1c1f33',
    textAlignVertical: 'top',
  },
});
