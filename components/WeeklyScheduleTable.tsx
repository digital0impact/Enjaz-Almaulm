import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

interface ScheduleEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  class: string;
  type: 'حصة' | 'مناوبة' | 'انتظار' | 'حصص انتظار' | 'فراغ';
  color: string;
}

const TABLE_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const TABLE_TIME_SLOTS = [
  'الحصة الأولى',
  'الحصة الثانية',
  'الحصة الثالثة',
  'الحصة الرابعة',
  'استراحة',
  'الحصة الخامسة',
  'الحصة السادسة',
  'الحصة السابعة',
  'الحصة الثامنة',
];

/**
 * عرض مصغّر للجدول الدراسي الأسبوعي (للقراءة فقط، بلا تفاعل) — يُستخدم
 * كشاهد مضمَّن داخل محور "أداء الواجبات الوظيفية" في شاشة الأداء المهني
 * (app/(tabs)/performance.tsx)، مرتبط مباشرة ببيانات الجدول الفعلية
 * (نفس مصدر app/schedule.tsx: AsyncStorage 'teacherSchedule')، بدل مجرد
 * رابط ينقل لشاشة أخرى.
 */
export function WeeklyScheduleTable() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('teacherSchedule');
        if (stored) setSchedule(JSON.parse(stored));
      } catch (e) {
        console.warn('Could not load teacherSchedule for evidence preview:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;

  const hasAnyData = schedule.some((e) => e.subject && e.subject !== 'استراحة');

  if (!hasAnyData) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={[styles.emptyText, getTextDirection()]}>
          {formatRTLText('لم يتم إعداد الجدول الدراسي بعد.')}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scroll}>
      <ThemedView style={[styles.table, { direction: 'rtl' }]}>
        <ThemedView style={styles.headerRow}>
          <ThemedView style={styles.dayHeaderCell}>
            <ThemedText style={styles.headerText}>{formatRTLText('اليوم')}</ThemedText>
          </ThemedView>
          {TABLE_TIME_SLOTS.map((slot) => (
            <ThemedView key={slot} style={styles.timeHeaderCell}>
              <ThemedText style={styles.headerText}>{formatRTLText(slot)}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        {TABLE_DAYS.map((day) => (
          <ThemedView key={day} style={styles.row}>
            <ThemedView style={styles.dayCell}>
              <ThemedText style={styles.dayCellText}>{formatRTLText(day)}</ThemedText>
            </ThemedView>
            {TABLE_TIME_SLOTS.map((slot) => {
              const entry = schedule.find((e) => e.day === day && e.time === slot);
              const isBreak = slot === 'استراحة';
              return (
                <ThemedView
                  key={`${day}-${slot}`}
                  style={[styles.cell, { backgroundColor: entry?.color || (isBreak ? '#E0E0E0' : '#F8F9FA') }]}
                >
                  {isBreak ? (
                    <ThemedText style={styles.breakText}>{formatRTLText('استراحة')}</ThemedText>
                  ) : entry?.subject ? (
                    <>
                      <ThemedText style={styles.subjectText} numberOfLines={2}>
                        {formatRTLText(entry.subject)}
                      </ThemedText>
                      {entry.class ? (
                        <ThemedText style={styles.classText} numberOfLines={1}>
                          {formatRTLText(entry.class)}
                        </ThemedText>
                      ) : null}
                    </>
                  ) : (
                    <ThemedText style={styles.emptyCellText}>{formatRTLText('فراغ')}</ThemedText>
                  )}
                </ThemedView>
              );
            })}
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const CELL_WIDTH = 72;
const DAY_CELL_WIDTH = 60;

const styles = StyleSheet.create({
  scroll: { marginTop: 8 },
  table: { borderRadius: 8, overflow: 'hidden' },
  emptyContainer: { paddingVertical: 12 },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center' },
  headerRow: { flexDirection: 'row' },
  dayHeaderCell: {
    width: DAY_CELL_WIDTH,
    padding: 6,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeHeaderCell: {
    width: CELL_WIDTH,
    padding: 6,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  headerText: { fontSize: 11, fontWeight: '700', color: '#fff', textAlign: 'center' },
  row: { flexDirection: 'row' },
  dayCell: {
    width: DAY_CELL_WIDTH,
    padding: 6,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  dayCellText: { fontSize: 11, fontWeight: '700', color: '#1c1f33', textAlign: 'center' },
  cell: {
    width: CELL_WIDTH,
    minHeight: 48,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  subjectText: { fontSize: 10, fontWeight: '600', color: '#1c1f33', textAlign: 'center' },
  classText: { fontSize: 9, color: '#555', textAlign: 'center', marginTop: 2 },
  emptyCellText: { fontSize: 9, color: '#bbb', textAlign: 'center' },
  breakText: { fontSize: 9, color: '#777', textAlign: 'center', fontWeight: '600' },
});
