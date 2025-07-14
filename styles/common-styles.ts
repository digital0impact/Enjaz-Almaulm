
import { StyleSheet } from 'react-native';
import { RTLStyles } from '@/utils/localization';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    ...RTLStyles.view,
  },
  text: {
    ...RTLStyles.text,
  },
  icon: {
    ...RTLStyles.icon,
  },
});
