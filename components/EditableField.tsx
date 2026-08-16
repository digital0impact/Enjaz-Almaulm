import React from 'react';
import { KeyboardTypeOptions, StyleProp, TextInput, TextStyle, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getTextDirection } from '@/utils/rtl-utils';

/**
 * حقل بيانات قابل للتحرير: يعرض قيمة نصية عادية، أو TextInput عند وضع
 * التعديل. يستخرج نمط `isEditing ? <TextInput/> : <ThemedText/>` المكرر
 * الذي كان مكتوبًا يدويًا نحو 13 مرة في app/(tabs)/basicData.tsx.
 *
 * مقصود أن يكون المكوّن "خاليًا من الأنماط الخاصة به" (style-agnostic):
 * كل قيم الأنماط (containerStyle/labelStyle/valueStyle/...) تُمرَّر من
 * الشاشة المستدعية بنفس كائنات StyleSheet الأصلية، حتى لا تتكرر تعريفات
 * الأنماط في ملفين وتنحرف عن بعضها لاحقًا.
 *
 * لا يغطي هذا المكوّن حقول "المهنة" (قائمة منسدلة، وليست TextInput) أو
 * "الرؤية/الرسالة" (تحتوي زر اقتراح بالذكاء الاصطناعي فوق التسمية) — تلك
 * تبقى مكتوبة صراحةً في الشاشة لأن بنيتها مختلفة فعليًا، وليست تكرارًا.
 */
export interface EditableFieldColors {
  card: string;
  textSecondary: string;
  text: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
}

export interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChangeText: (text: string) => void;
  placeholder: string;
  colors: EditableFieldColors;
  containerStyle: StyleProp<ViewStyle>;
  labelStyle: StyleProp<TextStyle>;
  valueStyle: StyleProp<TextStyle>;
  inputStyle: StyleProp<TextStyle>;
  textAreaStyle?: StyleProp<TextStyle>;
  hintStyle?: StyleProp<TextStyle>;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  hint?: string;
}

export function EditableField({
  label,
  value,
  isEditing,
  onChangeText,
  placeholder,
  colors,
  containerStyle,
  labelStyle,
  valueStyle,
  inputStyle,
  textAreaStyle,
  hintStyle,
  keyboardType,
  multiline,
  hint,
}: EditableFieldProps) {
  return (
    <ThemedView style={[containerStyle, { backgroundColor: colors.card }]}>
      <ThemedText style={[labelStyle, getTextDirection(), { color: colors.textSecondary }]}>
        {label}
      </ThemedText>
      {isEditing ? (
        <TextInput
          style={[
            inputStyle,
            multiline ? textAreaStyle : undefined,
            getTextDirection(),
            { backgroundColor: colors.inputBackground, color: colors.inputText },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      ) : (
        <ThemedText style={[valueStyle, getTextDirection(), { color: colors.text }]}>
          {value}
        </ThemedText>
      )}
      {hint ? (
        <ThemedText style={[hintStyle, getTextDirection(), { color: colors.textSecondary }]}>
          {hint}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}
