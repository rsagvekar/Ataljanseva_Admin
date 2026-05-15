import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useWindowDimensions, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePermissions } from '../../hooks/usePermissions';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';

const ALL_ITEMS = [
  { id: 'Voters', icon: '🗳️', label: 'Voter Management', desc: 'Manage voter database', color: '#dbeafe', perm: 'view_voters', screen: 'Voters' },
  { id: 'Events', icon: '📅', label: 'Events & Campaigns', desc: 'Plan and track events', color: '#fce7f3', perm: 'view_events', screen: 'Events' },
  { id: 'Schedule', icon: '📋', label: 'Schedule', desc: 'Manage your schedule', color: '#fef3c7', perm: 'view_schedule', screen: 'Schedule' },
  { id: 'Communication', icon: '📢', label: 'Bulk Communication', desc: 'Send messages to citizens', color: '#d1fae5', perm: 'send_bulk_message', screen: 'Communication' },
  { id: 'Programs', icon: '📃', label: 'Programs & Services', desc: 'Government schemes', color: '#ede9fe', perm: 'view_programs', screen: 'Programs' },
  { id: 'Birthdays', icon: '🎂', label: 'Birthdays & Anniversaries', desc: 'Greet voters on special days', color: '#fce7f3', perm: 'view_birthdays', screen: 'Birthdays' },
  { id: 'Users', icon: '👥', label: 'User Management', desc: 'Manage users and roles', color: '#fee2e2', perm: 'view_users', screen: 'Users', superAdminOnly: true },
  { id: 'Settings', icon: '⚙️', label: 'Settings', desc: 'Account and app settings', color: '#f3f4f6', screen: 'Settings' },
];

const EMERGENCY_LINES = [
  { label: '🆘 All Emergencies', num: '112' },
  { label: '🚑 Ambulance', num: '108' },
  { label: '🔥 Fire Dept.', num: '101' },
  { label: '🏥 Medical', num: '104' },
];

export default function MoreScreen({ navigation }) {
  const { can, PERMISSIONS, isSuperAdmin } = usePermissions();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;
  const numCols = isLargeTablet ? 3 : isTablet ? 2 : 2;
  const padding = isTablet ? 20 : 16;
  const gap = SPACING.md;

  // Calculate card width without using % (more reliable in RN flexWrap)
  const totalGap = gap * (numCols - 1) + padding * 2;
  const cardWidth = (width - totalGap) / numCols;

  const visibleItems = ALL_ITEMS.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.perm) return can(item.perm);
    return true;
  });

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={{ padding, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>More Features</Text>

      {/* Grid */}
      <View style={[styles.grid, { gap }]}>
        {visibleItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: item.color, width: cardWidth }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.75}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text style={styles.cardLabel} numberOfLines={2}>{item.label}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
            {item.superAdminOnly && (
              <View style={styles.superAdminBadge}>
                <Text style={styles.superAdminText}>Super Admin</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Emergency Helplines */}
      <View style={styles.emergencyBar}>
        <Text style={styles.emergencyTitle}>🆘 Emergency Helplines</Text>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_LINES.map(({ label, num }) => (
            <TouchableOpacity
              key={num}
              style={[styles.emergencyItem, { width: (width - padding * 2 - gap) / 2 }]}
              onPress={() => Linking.openURL(`tel:${num}`)}
              activeOpacity={0.75}
            >
              <Text style={styles.emergencyLabel}>{label}</Text>
              <View style={styles.emergencyNumRow}>
                <Icon name="call" size={14} color={COLORS.primary} />
                <Text style={styles.emergencyNum}>{num}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer note */}
      <Text style={styles.footer}>
        🏛️ AtalJanseva Municipal Management System{'\n'}
        नागरिकांसाठी, नागरिकांद्वारे 🇮🇳
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { ...TYPOGRAPHY.h3, color: COLORS.gray800, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    minHeight: 110,
    ...SHADOWS.sm,
  },
  cardIcon: { fontSize: 30, marginBottom: SPACING.sm },
  cardLabel: { ...TYPOGRAPHY.h5, color: COLORS.gray800, marginBottom: 4, lineHeight: 20 },
  cardDesc: { ...TYPOGRAPHY.caption, color: COLORS.gray500, lineHeight: 16 },
  superAdminBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  superAdminText: { ...TYPOGRAPHY.caption, color: COLORS.white, fontWeight: '700', fontSize: 9 },

  emergencyBar: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  emergencyTitle: { ...TYPOGRAPHY.h5, color: COLORS.white, marginBottom: SPACING.md },
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  emergencyItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emergencyLabel: { ...TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.75)', marginBottom: 6, lineHeight: 16 },
  emergencyNumRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  emergencyNum: { ...TYPOGRAPHY.h4, color: COLORS.primary },
  footer: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.xl,
  },
});
