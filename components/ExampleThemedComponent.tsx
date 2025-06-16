
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function MyComponent() {
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <Text style={{ color: colors.text }}>مرحبًا!</Text>

      <View style={{
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        margin: 10,
        borderWidth: 1,
        borderColor: colors.border
      }}>
        <Text style={{ color: colors.text }}>هذا كرت</Text>
      </View>

      <TouchableOpacity style={{
        backgroundColor: colors.buttonPrimary,
        padding: 12,
        borderRadius: 10,
        margin: 10,
        alignItems: 'center'
      }}>
        <Text style={{ color: colors.buttonText }}>زر</Text>
      </TouchableOpacity>
    </View>
  );
}
