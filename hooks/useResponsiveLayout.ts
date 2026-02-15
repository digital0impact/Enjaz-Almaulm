import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';
export const CONTENT_MAX_WIDTH_WEB = 560;
export const CONTENT_MAX_WIDTH_WEB_LARGE = 680;

export function useResponsiveLayout() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isWeb = IS_WEB;
  const isSmallScreen = screenWidth < 380;
  const contentMaxWidth = isWeb ? Math.min(screenWidth, CONTENT_MAX_WIDTH_WEB) : screenWidth;
  const horizontalPadding = isSmallScreen ? 16 : isWeb ? 32 : 20;
  const safePaddingTop = Platform.OS === 'ios' ? 60 : 44;

  return {
    screenWidth,
    screenHeight,
    isWeb,
    isSmallScreen,
    contentMaxWidth,
    horizontalPadding,
    safePaddingTop,
  };
}
