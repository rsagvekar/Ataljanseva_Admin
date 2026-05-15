import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {initials} from '../../utils/formatters';

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard = ({
  icon,
  label,
  value,
  color,
  change,
  onPress,
  style,
}) => (
  <TouchableOpacity
    style={[
      styles.statCard,
      {backgroundColor: color || COLORS.infoLight},
      style,
    ]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value ?? '—'}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>
      {label}
    </Text>
    {change ? (
      <Text style={styles.statChange} numberOfLines={1}>
        {change}
      </Text>
    ) : null}
  </TouchableOpacity>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
export const StatusBadge = ({status, style}) => {
  const colorMap = {
    Pending: {bg: '#fef3c7', text: '#92400e'},
    'In Progress': {bg: '#dbeafe', text: '#1e40af'},
    Resolved: {bg: '#d1fae5', text: '#065f46'},
    Active: {bg: '#d1fae5', text: '#065f46'},
    Inactive: {bg: '#f3f4f6', text: '#6b7280'},
    Planned: {bg: '#ede9fe', text: '#4c1d95'},
    Ongoing: {bg: '#dbeafe', text: '#1e40af'},
    Completed: {bg: '#d1fae5', text: '#065f46'},
    Delayed: {bg: '#fee2e2', text: '#991b1b'},
    Cancelled: {bg: '#f3f4f6', text: '#6b7280'},
    Medical: {bg: '#fee2e2', text: '#991b1b'},
    Fire: {bg: '#fef3c7', text: '#92400e'},
    Accident: {bg: '#dbeafe', text: '#1e40af'},
  };
  const c = colorMap[status] || {bg: '#f3f4f6', text: '#6b7280'};
  return (
    <View style={[styles.badge, {backgroundColor: c.bg}, style]}>
      <Text style={[styles.badgeText, {color: c.text}]}>{status}</Text>
    </View>
  );
};

// ── SearchBar ─────────────────────────────────────────────────────────────────
export const SearchBar = ({value, onChangeText, placeholder, style}) => (
  <View style={[styles.searchContainer, style]}>
    <Icon
      name="search"
      size={18}
      color={COLORS.gray400}
      style={styles.searchIcon}
    />
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || 'Search...'}
      placeholderTextColor={COLORS.gray400}
      returnKeyType="search"
    />
    {value ? (
      <TouchableOpacity
        onPress={() => onChangeText('')}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="close-circle" size={18} color={COLORS.gray400} />
      </TouchableOpacity>
    ) : null}
  </View>
);

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({
  icon = '📋',
  title = 'No items found',
  subtitle,
  action,
  actionLabel,
}) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    {action ? (
      <TouchableOpacity style={styles.emptyAction} onPress={action}>
        <Text style={styles.emptyActionText}>{actionLabel || 'Try again'}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export const LoadingSpinner = ({text, full}) => (
  <View style={[styles.spinner, full && styles.spinnerFull]}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    {text ? <Text style={styles.spinnerText}>{text}</Text> : null}
  </View>
);

// ── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({name, size = 40, style}) => {
  const letters = initials(name);
  const colors = [
    '#dbeafe',
    '#d1fae5',
    '#fce7f3',
    '#fef3c7',
    '#ede9fe',
    '#fee2e2',
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  const textColors = [
    '#1e40af',
    '#065f46',
    '#9d174d',
    '#92400e',
    '#4c1d95',
    '#991b1b',
  ];
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors[idx],
        },
        style,
      ]}>
      <Text
        style={[
          styles.avatarText,
          {fontSize: size * 0.36, color: textColors[idx]},
        ]}>
        {letters}
      </Text>
    </View>
  );
};

// ── FilterChips ───────────────────────────────────────────────────────────────
export const FilterChips = ({options, value, onChange, style}) => (
  <View style={[styles.chipRow, style]}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt}
        style={[styles.chip, value === opt && styles.chipActive]}
        onPress={() => onChange(opt)}
        activeOpacity={0.7}>
        <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
          {opt}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── SectionHeader ─────────────────────────────────────────────────────────────
export const SectionHeader = ({title, action, actionLabel}) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action ? (
      <TouchableOpacity onPress={action}>
        <Text style={styles.sectionAction}>{actionLabel || 'View all'}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
export const Toast = ({message, type = 'success', style}) => {
  if (!message) return null;
  const bg =
    type === 'error'
      ? COLORS.danger
      : type === 'warning'
      ? COLORS.warning
      : COLORS.success;
  return (
    <View style={[styles.toast, {backgroundColor: bg}, style]}>
      <Icon
        name={
          type === 'error'
            ? 'alert-circle'
            : type === 'warning'
            ? 'warning'
            : 'checkmark-circle'
        }
        size={18}
        color={COLORS.white}
        style={{marginRight: SPACING.sm}}
      />
      <Text style={styles.toastText} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
};

// ── PrimaryButton ─────────────────────────────────────────────────────────────
export const PrimaryButton = ({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}) => {
  const bg =
    variant === 'danger'
      ? COLORS.danger
      : variant === 'secondary'
      ? COLORS.secondary
      : COLORS.primary;
  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn,
        {backgroundColor: bg},
        (disabled || loading) && {opacity: 0.6},
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({children, style, onPress}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
export const InfoRow = ({label, value, icon}) => (
  <View style={styles.infoRow}>
    {icon ? <Text style={styles.infoIcon}>{icon}</Text> : null}
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  statCard: {
    minHeight: 120,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {fontSize: 22, marginBottom: SPACING.xs},
  statValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.gray900,
    marginVertical: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  statChange: {...TYPOGRAPHY.tiny, color: COLORS.gray500, marginTop: 3},

  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...TYPOGRAPHY.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
    ...SHADOWS.sm,
  },
  searchIcon: {marginRight: SPACING.sm},
  searchInput: {flex: 1, ...TYPOGRAPHY.body, color: COLORS.gray800, padding: 0},

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.gray600,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  emptyActionText: {...TYPOGRAPHY.label, color: COLORS.primary},

  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  spinnerFull: {flex: 1},
  spinnerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },

  avatar: {alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontWeight: '700'},

  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {backgroundColor: COLORS.primary, borderColor: COLORS.primary},
  chipText: {...TYPOGRAPHY.labelSm, color: COLORS.gray600},
  chipTextActive: {color: COLORS.white},

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {...TYPOGRAPHY.h4, color: COLORS.gray800},
  sectionAction: {...TYPOGRAPHY.labelSm, color: COLORS.primary},

  toast: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    zIndex: 9999,
    ...SHADOWS.lg,
  },
  toastText: {...TYPOGRAPHY.label, color: COLORS.white, flex: 1},

  primaryBtn: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...SHADOWS.sm,
  },
  primaryBtnText: {...TYPOGRAPHY.h5, color: COLORS.white},

  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {fontSize: 16, marginRight: SPACING.sm, marginTop: 2},
  infoContent: {flex: 1},
  infoLabel: {...TYPOGRAPHY.caption, color: COLORS.gray500, marginBottom: 2},
  infoValue: {...TYPOGRAPHY.body, color: COLORS.gray800},
});
