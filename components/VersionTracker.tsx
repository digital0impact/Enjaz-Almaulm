import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StyleProps } from '@/types';
import { VERSION_INFO } from '@/constants/Version';

interface VersionTrackerProps extends StyleProps {
  showBuildInfo?: boolean;
}

export const VersionTracker: React.FC<VersionTrackerProps> = ({ 
  style, 
  showBuildInfo = false 
}) => {
  const appVersion = VERSION_INFO.getVersion();
  const buildNumber = VERSION_INFO.build.toString();
  const releaseDate = VERSION_INFO.releaseDate;

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.versionText}>
        الإصدار {appVersion} • تطوير الأثر الرقمي
      </ThemedText>
      {showBuildInfo && (
        <>
          <ThemedText style={styles.buildText}>
            البناء {buildNumber}
          </ThemedText>
          <ThemedText style={styles.dateText}>
            تاريخ الإصدار: {releaseDate}
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  versionText: {
    fontSize: 14,
    color: '#1c1f33',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  buildText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 2,
    writingDirection: 'rtl',
  },
  dateText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 2,
    writingDirection: 'rtl',
  },
});
