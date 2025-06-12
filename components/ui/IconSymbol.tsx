// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'graduationcap.fill': 'school',
  'person.fill': 'person',
  'person.circle.fill': 'account-circle',
  'chart.bar.fill': 'bar-chart',
  'wrench.fill': 'build',
  'envelope.fill': 'mail',
  'globe': 'public',
  'apple.logo': 'phone-iphone',
  'power': 'power-settings-new',
  'arrow.left': 'arrow-back',
  'lightbulb.fill': 'lightbulb',
  'doc.text.fill': 'description',
  'arrow.up.doc.fill': 'upload-file',
  'bell.fill': 'notifications',
  'person.crop.circle.badge.xmark': 'person-remove',
  'calendar.badge.clock': 'event',
  'calendar.badge.exclamationmark': 'event-note',
  'calendar.badge.plus': 'event-available',
  'gear': 'settings',
  'gear.fill': 'settings',
  'plus.circle.fill': 'add-circle',
  'checkmark.circle.fill': 'check-circle',
  'doc.badge.plus': 'note-add',
  'person.badge.plus': 'person-add',
  'book.fill': 'book',
  'person.2.fill': 'group',
  'calendar': 'calendar-today',
  'arrow.right.square': 'logout',
  'twitter': 'alternate-email',
  'linkedin': 'business',
  'lock.shield.fill': 'security',
  'target': 'gps-fixed',
  'hand.raised.fill': 'pan-tool',
  'arrow.down.circle.fill': 'file-download',
  'chevron.left': 'chevron-left',
  'plus': 'add',
  'xmark': 'close',
  'checkmark': 'check',
  'pencil': 'edit',
  'trash': 'delete',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  'chevron.right': 'chevron-right',
  'person.crop.circle.badge.plus': 'person-add-alt-1',
  'microsoft': 'business',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
