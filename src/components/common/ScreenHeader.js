import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
} from '../../config/theme';

export default function ScreenHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      {/* Safe Area */}
      <View
        style={{
          height: insets.top,
          backgroundColor: COLORS.primaryDark,
        }}
      />

      {/* Header Content */}
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>{title}</Text>

          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}
        </View>

        {rightIcon ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onRightPress}>
            <Icon
              name={rightIcon}
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.primaryDark,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.md,
  },

  container: {
    minHeight: 90,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontWeight: '700',
  },

  subtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,

    backgroundColor: 'rgba(255,255,255,0.12)',

    alignItems: 'center',
    justifyContent: 'center',
  },
});