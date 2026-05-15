import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { EmptyState, LoadingSpinner, SearchBar, Avatar } from '../../components/common/UI';
import { ModalSheet, FormGroup, Input, SelectField } from '../../components/layout/ScreenWrapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';
import { ROLE_LABELS, ROLE_COLORS, ROLES } from '../../config/permissions';
import { formatDate } from '../../utils/formatters';

const ROLE_OPTIONS = [
  { label: '👑 Super Admin', value: ROLES.SUPER_ADMIN },
  { label: '🛡️ Admin', value: ROLES.ADMIN },
  { label: '🤝 Volunteer', value: ROLES.VOLUNTEER },
];
const defForm = { name: '', email: '', password: '', role: ROLES.ADMIN, mobile: '' };

export default function UserManagementScreen() {
  const { nagarsevakId } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (t, m) => { setToast({ type: t, msg: m }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authService.getAllUsers({ nagarsevak_id: nagarsevakId });
      setUsers(Array.isArray(res) ? res : res.users || []);
    } catch (e) { showToast('error', 'Failed to load users.'); }
    setLoading(false);
  }, [nagarsevakId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateUser = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.name.trim()) {
      showToast('error', 'Name, email and password required.');
      return;
    }
    setSaving(true);
    try {
      await authService.createUser({ ...form, nagarsevak_id: nagarsevakId });
      showToast('success', 'User created!');
      setShowForm(false); setForm(defForm); load();
    } catch (e) { showToast('error', e.message); }
    setSaving(false);
  };

  const handleAssignRole = async () => {
    if (!newRole || !selectedUser) return;
    setSaving(true);
    try {
      await authService.updateUserRole(selectedUser.id, newRole);
      showToast('success', 'Role updated!');
      setShowRoleModal(false); setSelectedUser(null); setNewRole(''); load();
    } catch (e) { showToast('error', e.message); }
    setSaving(false);
  };

  const handleDeactivate = (u) => {
    Alert.alert('Deactivate User', `Deactivate ${u.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try { await authService.deactivateUser(u.id); showToast('success', 'User deactivated.'); load(); }
        catch (e) { showToast('error', e.message); }
      }},
    ]);
  };

  const handleDelete = (u) => {
    Alert.alert('Delete User', `Permanently delete ${u.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await authService.deleteUser(u.id); showToast('success', 'User deleted.'); load(); }
        catch (e) { showToast('error', e.message); }
      }},
    ]);
  };

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.container, { paddingHorizontal: padding }]}>
      {toast && <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}><Text style={styles.toastText}>{toast.msg}</Text></View>}

      {/* Super Admin badge */}
      <View style={[styles.adminBanner, { marginTop: padding }]}>
        <Icon name="shield-checkmark" size={20} color={COLORS.primary} />
        <Text style={styles.adminBannerText}>Super Admin — User & Role Management</Text>
      </View>

      <View style={styles.filterRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search users..." style={{ flex: 1 }} />
        <TouchableOpacity style={styles.addBtn} onPress={() => { setForm(defForm); setShowForm(true); }}>
          <Icon name="person-add" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <Text style={styles.count}>{filtered.length} users</Text>

      {loading ? <LoadingSpinner text="Loading users..." full /> : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={({ item: u }) => {
            const rc = ROLE_COLORS[u.role] || { bg: '#f3f4f6', text: '#4b5563' };
            return (
              <View style={styles.userCard}>
                <Avatar name={u.name} size={46} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: rc.text }]}>{ROLE_LABELS[u.role] || u.role}</Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity style={styles.roleBtn} onPress={() => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); }}>
                    <Icon name="shield" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deactivateBtn} onPress={() => handleDeactivate(u)}>
                    <Icon name="ban" size={14} color={COLORS.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                    <Icon name="trash" size={14} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="👥" title="No users found" />}
        />
      )}

      {/* Create User Modal */}
      <ModalSheet visible={showForm} onClose={() => { setShowForm(false); setForm(defForm); }} title="Create New User">
        <FormGroup label="Full Name" required><Input value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} placeholder="Full name" /></FormGroup>
        <FormGroup label="Email" required><Input value={form.email} onChangeText={(v) => setForm(f => ({ ...f, email: v }))} placeholder="user@example.com" keyboardType="email-address" autoCapitalize="none" /></FormGroup>
        <FormGroup label="Password" required><Input value={form.password} onChangeText={(v) => setForm(f => ({ ...f, password: v }))} placeholder="Min 8 characters" secureTextEntry /></FormGroup>
        <FormGroup label="Mobile"><Input value={form.mobile} onChangeText={(v) => setForm(f => ({ ...f, mobile: v }))} placeholder="Mobile number" keyboardType="phone-pad" /></FormGroup>
        <FormGroup label="Role">
          <SelectField value={form.role} options={ROLE_OPTIONS} onChange={(v) => setForm(f => ({ ...f, role: v }))} />
        </FormGroup>
        <View style={styles.warnBox}>
          <Icon name="information-circle" size={16} color={COLORS.info} />
          <Text style={styles.warnText}>The user will receive an email with login instructions.</Text>
        </View>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleCreateUser} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Creating...' : 'Create User'}</Text>
        </TouchableOpacity>
      </ModalSheet>

      {/* Assign Role Modal */}
      <ModalSheet visible={showRoleModal} onClose={() => { setShowRoleModal(false); setSelectedUser(null); setNewRole(''); }} title={`Assign Role — ${selectedUser?.name}`}>
        <Text style={styles.roleModalDesc}>Select a role for this user. This will change what they can access in the app.</Text>
        {ROLE_OPTIONS.map(r => (
          <TouchableOpacity key={r.value} style={[styles.roleOption, newRole === r.value && styles.roleOptionActive]} onPress={() => setNewRole(r.value)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleOptionLabel, newRole === r.value && styles.roleOptionLabelActive]}>{r.label}</Text>
              <Text style={styles.roleOptionDesc}>{r.value === ROLES.SUPER_ADMIN ? 'Full access + manage users & roles' : r.value === ROLES.ADMIN ? 'Full operational access, no user mgmt' : 'View assigned tasks, limited access'}</Text>
            </View>
            {newRole === r.value && <Icon name="checkmark-circle" size={22} color={COLORS.primary} />}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.saveBtn, { marginTop: SPACING.xl }, saving && { opacity: 0.6 }]} onPress={handleAssignRole} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Updating...' : 'Assign Role'}</Text>
        </TouchableOpacity>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  adminBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  adminBannerText: { ...TYPOGRAPHY.label, color: COLORS.primary },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  addBtn: { width: 44, height: 44, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  count: { ...TYPOGRAPHY.caption, color: COLORS.gray500, marginBottom: SPACING.sm },
  userCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, ...SHADOWS.sm },
  userInfo: { flex: 1 },
  userName: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  userEmail: { ...TYPOGRAPHY.caption, color: COLORS.gray500, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: SPACING.sm },
  roleBadgeText: { ...TYPOGRAPHY.labelSm },
  userActions: { gap: SPACING.sm },
  roleBtn: { width: 30, height: 30, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  deactivateBtn: { width: 30, height: 30, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 30, height: 30, backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', top: 80, left: 20, right: 20, padding: SPACING.md, borderRadius: RADIUS.lg, zIndex: 999 },
  toastSuccess: { backgroundColor: COLORS.success }, toastError: { backgroundColor: COLORS.danger },
  toastText: { ...TYPOGRAPHY.label, color: COLORS.white },
  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.infoLight, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  warnText: { ...TYPOGRAPHY.bodySm, color: COLORS.infoDark, flex: 1, lineHeight: 18 },
  saveBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.sm },
  saveBtnText: { ...TYPOGRAPHY.h5, color: COLORS.white },
  roleModalDesc: { ...TYPOGRAPHY.body, color: COLORS.gray500, marginBottom: SPACING.lg, lineHeight: 22 },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.md },
  roleOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  roleOptionLabel: { ...TYPOGRAPHY.label, color: COLORS.gray800, marginBottom: 4 },
  roleOptionLabelActive: { color: COLORS.primary },
  roleOptionDesc: { ...TYPOGRAPHY.bodySm, color: COLORS.gray500, lineHeight: 18 },
});
