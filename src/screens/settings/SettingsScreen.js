import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import authService from '../../services/authService';
import { Avatar } from '../../components/common/UI';
import { FormGroup, Input } from '../../components/layout/ScreenWrapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';
import { ROLE_LABELS, ROLE_COLORS } from '../../config/permissions';

export default function SettingsScreen() {
  const { user, nagarsevakId, logout, refreshUser } = useAuth();
  const { role } = usePermissions();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;
  const maxWidth = isTablet ? 500 : width;

  const [showPassForm, setShowPassForm] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (t, m) => { setToast({ type: t, msg: m }); setTimeout(() => setToast(null), 3000); };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) { showToast('error', 'All fields required.'); return; }
    if (newPass !== confirmPass) { showToast('error', 'Passwords do not match.'); return; }
    if (newPass.length < 8) { showToast('error', 'New password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      await authService.changePassword(currentPass, newPass);
      showToast('success', 'Password changed successfully!');
      setShowPassForm(false); setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e) { showToast('error', e.message || 'Failed to change password.'); }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const rc = ROLE_COLORS[role] || { bg: '#f3f4f6', text: '#4b5563' };

  const MenuItem = ({ icon, label, onPress, color = COLORS.gray700, rightElement }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {rightElement || <Icon name="chevron-forward" size={16} color={COLORS.gray400} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding, paddingBottom: 100 }}>
      {toast && <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}><Text style={styles.toastText}>{toast.msg}</Text></View>}

      {/* Profile Card */}
      <View style={[styles.profileCard, { maxWidth }]}>
        <Avatar name={user?.name || user?.email} size={64} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || user?.email?.split('@')[0] || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
            <Text style={[styles.roleBadgeText, { color: rc.text }]}>{ROLE_LABELS[role] || role}</Text>
          </View>
        </View>
      </View>

      {/* Portal info */}
      {nagarsevakId && (
        <View style={styles.portalCard}>
          <Icon name="business" size={18} color={COLORS.primary} />
          <View>
            <Text style={styles.portalLabel}>Active Portal</Text>
            <Text style={styles.portalId}>{nagarsevakId}</Text>
          </View>
        </View>
      )}

      {/* Account Settings */}
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="refresh" label="Refresh Profile" onPress={() => { refreshUser(); showToast('success', 'Profile refreshed.'); }} />
        <MenuItem icon="lock-closed" label="Change Password" onPress={() => setShowPassForm(p => !p)} />
      </View>

      {/* Change Password Form */}
      {showPassForm && (
        <View style={styles.passForm}>
          <FormGroup label="Current Password">
            <Input value={currentPass} onChangeText={setCurrentPass} placeholder="Current password" secureTextEntry />
          </FormGroup>
          <FormGroup label="New Password">
            <Input value={newPass} onChangeText={setNewPass} placeholder="Min 8 characters" secureTextEntry />
          </FormGroup>
          <FormGroup label="Confirm New Password">
            <Input value={confirmPass} onChangeText={setConfirmPass} placeholder="Repeat new password" secureTextEntry />
          </FormGroup>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Changing...' : 'Change Password'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <Text style={styles.sectionTitle}>App Info</Text>
      <View style={styles.menuCard}>
        <MenuItem icon="information-circle" label="Version" onPress={null} rightElement={<Text style={styles.menuValue}>1.0.0</Text>} />
        <MenuItem icon="globe" label="API Server" onPress={null} rightElement={<Text style={styles.menuValue} numberOfLines={1}>nagarsevak-api.vercel.app</Text>} />
        <MenuItem icon="server" label="Firebase" onPress={null} rightElement={<Text style={styles.menuValue}>Connected ✅</Text>} />
      </View>

      {/* Emergency */}
      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      <View style={styles.menuCard}>
        {[['🆘 All Emergencies', '112'], ['🚑 Ambulance', '108'], ['🔥 Fire Dept.', '101'], ['🏥 Medical Helpline', '104']].map(([label, num]) => (
          <MenuItem key={num} icon="call" label={`${label} — ${num}`} color={COLORS.danger} onPress={() => { const { Linking } = require('react-native'); Linking.openURL(`tel:${num}`); }} />
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Icon name="log-out" size={20} color={COLORS.white} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>🏛️ AtalJanseva Municipal Management System{'\n'}🇮🇳 Made for Municipal Governance · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, backgroundColor: COLORS.secondary, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.md },
  profileInfo: { flex: 1 },
  profileName: { ...TYPOGRAPHY.h4, color: COLORS.white },
  profileEmail: { ...TYPOGRAPHY.bodySm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: SPACING.sm },
  roleBadgeText: { ...TYPOGRAPHY.labelSm },
  portalCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  portalLabel: { ...TYPOGRAPHY.caption, color: COLORS.gray500 },
  portalId: { ...TYPOGRAPHY.label, color: COLORS.primary },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.gray500, marginBottom: SPACING.md, marginTop: SPACING.md },
  menuCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...TYPOGRAPHY.body, flex: 1 },
  menuValue: { ...TYPOGRAPHY.bodySm, color: COLORS.gray400, maxWidth: 140, textAlign: 'right' },
  passForm: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  saveBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center' },
  saveBtnText: { ...TYPOGRAPHY.h5, color: COLORS.white },
  logoutBtn: { backgroundColor: COLORS.danger, borderRadius: RADIUS.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.md + 2, marginBottom: SPACING.xl, ...SHADOWS.sm },
  logoutText: { ...TYPOGRAPHY.h4, color: COLORS.white },
  footer: { ...TYPOGRAPHY.caption, color: COLORS.gray400, textAlign: 'center', lineHeight: 20 },
  toast: { position: 'absolute', top: 80, left: 20, right: 20, padding: SPACING.md, borderRadius: RADIUS.lg, zIndex: 999 },
  toastSuccess: { backgroundColor: COLORS.success }, toastError: { backgroundColor: COLORS.danger },
  toastText: { ...TYPOGRAPHY.label, color: COLORS.white },
});
