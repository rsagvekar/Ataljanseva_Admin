import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../config/theme';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isPhone       = width < BREAKPOINTS.tablet;
  const isTablet      = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.largeTablet;
  const isLargeTablet = width >= BREAKPOINTS.largeTablet;

  const statColumns   = isLargeTablet ? 4 : isTablet ? 3 : 2;
  const listColumns   = isLargeTablet ? 2 : isTablet ? 2 : 1;
  const screenPadding = isLargeTablet ? 24 : isTablet ? 20 : 16;
  const showSidebar   = isLargeTablet;
  const isLandscape   = width > height;

  // Card width helper — pass number of columns
  const cardWidth = (cols, gap = 12) =>
    (width - screenPadding * 2 - gap * (cols - 1)) / cols;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isLargeTablet,
    statColumns,
    listColumns,
    screenPadding,
    showSidebar,
    isLandscape,
    cardWidth,
  };
};
