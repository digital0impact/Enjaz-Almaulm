import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { getTextDirection, formatRTLText } from '@/utils/rtl-utils';

export default function WelcomeScreen() {
  const { userName } = useUser();

  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, getTextDirection()]}> 
        {formatRTLText(`مرحبًا، ${userName} 👋`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
