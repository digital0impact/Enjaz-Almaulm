
import { StyleSheet, Platform } from 'react-native';

export const commonStyles = StyleSheet.create({
  containerWithBottomNav: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 75, // Space for bottom navigation
  },
  scrollViewWithBottomNav: {
    paddingBottom: Platform.OS === 'ios' ? 90 : 75, // Space for bottom navigation
  },
});

export default commonStyles;
