import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRouter } from 'expo-router';
import { BottomNavigationBar } from '@/components/BottomNavigationBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
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

  const [isExporting, setIsExporting] = useState(false);

  const escapeHtml = (s: string) => {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const generateIDPHtml = (): string => {
    const teal = '#0d9488';
    const tealLight = '#14b8a6';
    const green = '#059669';
    const tableBorder = '1px solid #e5e7eb';
    const cellPad = '8px';
    const h = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>خطة التطوير الفردية (IDP)</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #1c1f33; }
    h1 { color: #1c1f33; font-size: 22px; margin-bottom: 24px; text-align: center; }
    .section { margin-bottom: 24px; border: ${tableBorder}; border-radius: 8px; overflow: hidden; }
    .section-header { background: ${teal}; color: #fff; padding: 12px 16px; font-weight: 700; font-size: 16px; }
    .form-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px; }
    .field { flex: 1; min-width: 180px; }
    .field-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .field-value { font-size: 14px; padding: 8px; background: #f9fafb; border: ${tableBorder}; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: ${tableBorder}; padding: ${cellPad}; text-align: right; }
    th { background: ${tealLight}; color: #fff; font-weight: 700; }
    .obj-cell { background: #dcfce7; color: ${green}; font-weight: 600; }
    .priority-num { background: #dcfce7; color: ${green}; font-weight: 700; text-align: center; }
  </style>
</head>
<body>
  <h1>خطة التطوير الفردية (IDP)</h1>

  <div class="section">
    <div class="section-header">نموذج خطة التطوير الفردية</div>
    <div class="form-row">
      <div class="field"><div class="field-label">الإسم</div><div class="field-value">${escapeHtml(name)}</div></div>
      <div class="field"><div class="field-label">الجهة</div><div class="field-value">${escapeHtml(entity)}</div></div>
    </div>
    <div class="form-row">
      <div class="field"><div class="field-label">تاريخ بداية الخطة</div><div class="field-value">${escapeHtml(startDate)}</div></div>
      <div class="field"><div class="field-label">تاريخ نهاية الخطة</div><div class="field-value">${escapeHtml(endDate)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">مجالات التطوير المهني</div>
    <table>
      <tr>
        <th style="width:80px">المنهجية / الأهداف</th>
        <th>التعلم من خلال التجارب والخبرات (70%)<br/><small>مثال: مجتمعات التعلم المهنية</small></th>
        <th>التعلم من خلال الآخرين (20%)<br/><small>مثال: دورات وندوات تعليمية</small></th>
        <th>التعلم المباشر (10%)<br/><small>مثال: تعلم نظامي - التعلم الذاتي - الاطلاع والقراءة</small></th>
      </tr>
      <tr><td class="obj-cell">الهدف الأول</td><td>${escapeHtml(objectives70[0])}</td><td>${escapeHtml(objectives20[0])}</td><td>${escapeHtml(objectives10[0])}</td></tr>
      <tr><td class="obj-cell">الهدف الثاني</td><td>${escapeHtml(objectives70[1])}</td><td>${escapeHtml(objectives20[1])}</td><td>${escapeHtml(objectives10[1])}</td></tr>
      <tr><td class="obj-cell">الهدف الثالث</td><td>${escapeHtml(objectives70[2])}</td><td>${escapeHtml(objectives20[2])}</td><td>${escapeHtml(objectives10[2])}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-header">الأهداف التطورية بحسب الأولوية</div>
    <table>
      <tr>
        <th style="width:40px">#</th>
        <th>الأهداف التطويرية</th>
        <th>الأنشطة بناء على 10-20-70</th>
        <th>تاريخ الانتهاء من الهدف</th>
        <th>الداعم الرئيسي</th>
        <th>الإجراءات التفصيلية</th>
        <th>معايير النجاح</th>
      </tr>
      ${[0, 1, 2].map((i) => {
        const p = priorityObjectives[i];
        return `<tr>
          <td class="priority-num">${i + 1}</td>
          <td>${escapeHtml(p.objective)}</td>
          <td>${escapeHtml(p.activities)}</td>
          <td>${escapeHtml(p.endDate)}</td>
          <td>${escapeHtml(p.supporter)}</td>
          <td>${escapeHtml(p.procedures)}</td>
          <td>${escapeHtml(p.successCriteria)}</td>
        </tr>`;
      }).join('')}
    </table>
  </div>
</body>
</html>`;
    return h;
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const htmlContent = generateIDPHtml();
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') {
          Alert.alert(formatRTLText('تنبيه'), formatRTLText('تصدير PDF غير متاح في هذا السياق.'));
          return;
        }
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        if (w) {
          w.onload = () => setTimeout(() => { try { w.print(); } catch (_) {} }, 500);
          Alert.alert(formatRTLText('تم فتح نافذة الخطة'), formatRTLText('اختر «حفظ كـ PDF» في نافذة الطباعة.'));
        } else {
          Alert.alert(formatRTLText('تنبيه'), formatRTLText('السماح بالنوافذ المنبثقة ثم حاول مرة أخرى.'));
        }
        URL.revokeObjectURL(url);
        return;
      }
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 595,
        height: 842,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(formatRTLText('تم إنشاء الملف'), uri);
        return;
      }
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        const name = `خطة_التطوير_الفردية_${new Date().toISOString().split('T')[0]}.pdf`;
        const dest = `${FileSystem.documentDirectory}${name}`;
        await FileSystem.moveAsync({ from: uri, to: dest });
        await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: formatRTLText('تصدير الخطة PDF') });
      }
      Alert.alert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير الخطة كملف PDF.'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(formatRTLText('فشل التصدير'), formatRTLText('تعذر تصدير PDF.') + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const htmlContent = generateIDPHtml();
      const fileName = `خطة_التطوير_الفردية_${new Date().toISOString().split('T')[0]}.doc`;
      if (Platform.OS === 'web') {
        if (typeof window === 'undefined') {
          Alert.alert(formatRTLText('تنبيه'), formatRTLText('تصدير Word غير متاح في هذا السياق.'));
          return;
        }
        const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert(formatRTLText('تم بنجاح'), formatRTLText('تم تحميل ملف Word.'));
        return;
      }
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, '\ufeff' + htmlContent, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(formatRTLText('تم إنشاء الملف'), filePath);
        return;
      }
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/msword',
        dialogTitle: formatRTLText('تصدير الخطة Word'),
      });
      Alert.alert(formatRTLText('تم بنجاح'), formatRTLText('تم تصدير الخطة كملف Word.'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(formatRTLText('فشل التصدير'), formatRTLText('تعذر تصدير Word.') + (msg ? ` (${msg})` : ''));
    } finally {
      setIsExporting(false);
    }
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

          <ThemedView style={styles.exportSection}>
            <ThemedText style={[styles.exportSectionTitle, getTextDirection()]}>
              {formatRTLText('تصدير الخطة')}
            </ThemedText>
            <View style={styles.exportButtonsRow}>
              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={exportToPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol size={22} name="doc.pdf" color="#fff" />
                    <ThemedText style={[styles.exportButtonText, getTextDirection()]}>
                      {formatRTLText('تصدير PDF')}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, styles.exportButtonWord, isExporting && styles.exportButtonDisabled]}
                onPress={exportToWord}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol size={22} name="doc.text.fill" color="#fff" />
                    <ThemedText style={[styles.exportButtonText, getTextDirection()]}>
                      {formatRTLText('تصدير Word')}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
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
  exportSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exportSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1f33',
    marginBottom: 12,
    textAlign: 'center',
  },
  exportButtonsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  exportButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TEAL,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
    justifyContent: 'center',
  },
  exportButtonWord: {
    backgroundColor: '#2563eb',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
});
