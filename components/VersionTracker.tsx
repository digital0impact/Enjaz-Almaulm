
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { VERSION_INFO } from '@/constants/Version';

interface VersionTrackerProps {
  showBuildInfo?: boolean;
  style?: any;
}

export function VersionTracker({ showBuildInfo = true, style }: VersionTrackerProps) {
  const versionInfo = VERSION_INFO.getVersionInfo();
  
  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.versionText}>
        الإصدار: {versionInfo.version}
      </ThemedText>
      
      {showBuildInfo && (
        <>
          <ThemedText style={styles.buildText}>
            رقم البناء: {versionInfo.buildNumber}
          </ThemedText>
          <ThemedText style={styles.dateText}>
            تاريخ الإصدار: {versionInfo.releaseDate}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginVertical: 8,
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
  buildText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
