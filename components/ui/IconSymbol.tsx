// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
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
  'chart.line.uptrend.xyaxis': 'show-chart',
  'wrench.fill': 'build',
  'envelope.fill': 'mail',
  'phone.fill': 'phone',
  'globe': 'public',
  'questionmark.circle': 'help',
  'help': 'help',
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
  'person.crop.circle.badge.plus': 'person-add-alt-1',
  'microsoft': 'business',
  
  'hourglass.fill': 'hourglass-full',
  'check': 'check',
  'close': 'close',
  
  // إضافة الأيقونات المفقودة
  'arrow.clockwise': 'refresh',
  'key.fill': 'vpn-key',
  'checkmark.shield.fill': 'verified-user',
  'exclamationmark.triangle.fill': 'warning',
  'eye.fill': 'visibility',
  'doc.on.doc.fill': 'content-copy',
  'pencil.circle.fill': 'edit',
  'xmark.circle.fill': 'cancel',
  'star.fill': 'star',
  'list.bullet': 'list',
  'heart.fill': 'favorite',
  'note.text': 'note',
  'person.3.fill': 'group',
  'star': 'star-border',
  'arrow.down.circle': 'keyboard-arrow-down',
  'doc.text': 'description',
  'doc.pdf': 'picture-as-pdf',
  'person.2.slash': 'person-off',
  'creditcard.fill': 'credit-card',
  'trash.fill': 'delete',
  'info.circle.fill': 'info',
  'plus.circle': 'add-circle-outline',
  'square.and.arrow.up': 'share',
  'square.and.arrow.up.fill': 'share',
  'printer.fill': 'print',
  'arrow.up.circle.fill': 'keyboard-arrow-up',
  'play.circle.fill': 'play-circle',
  'pause.circle.fill': 'pause-circle',
  'pause.circle': 'pause-circle-outline',
  'checkmark.circle': 'check-circle-outline',
  'xmark.circle': 'cancel',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'minus.circle.fill': 'remove-circle',
  'heart.text.square': 'favorite',
  'person.text.rectangle': 'person',
  
  // أيقونات الأذكار
  'book.closed.fill': 'book',
  'sun.and.horizon.fill': 'wb-sunny',
  'hands.clap.fill': 'pan-tool',
  'bed.double.fill': 'hotel',
  'fork.knife': 'restaurant',
  'door.left.hand.open': 'door-front-door',
  
  // أيقونات الإجازات الرسمية
  'moon.stars.fill': 'nights-stay',
  'flag.fill': 'flag',
  'bell.badge.fill': 'notifications-active',
  'clock.arrow.circlepath': 'history',
  'clock.fill': 'schedule',
  'card-giftcard': 'card-giftcard',
  'workspace-premium': 'workspace-premium',
  'stars': 'stars',
} as IconMapping;

/**
 * An icon component that uses Material Icons across all platforms.
 * This ensures a consistent look and optimal resource usage.
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
  weight?: string;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
