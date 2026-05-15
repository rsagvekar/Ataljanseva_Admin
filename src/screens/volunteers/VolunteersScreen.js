import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import volunteersService from '../../services/volunteersService';
import { StatCard, StatusBadge, SearchBar, EmptyState, LoadingSpinner, FilterChips, Avatar } from '../../components/common/UI';
import { ModalSheet, FormGroup, Input, SelectField } from '../../components/layout/ScreenWrapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';
import { formatDate } from '../../utils/formatters';

const ROLES = ['Volunteer', 'Karyakarta', 'Team Leader', 'Coordinator', 'Booth Agent'];
const defForm = { name: '', mobile: '', ward: '', role: 'Volunteer', skills: '', status: 'Active', address: '', joinDate: '' };
const defReport = { date: '', task: '', status: 'Completed', note: '', hours: '' };

export default function VolunteersScreen() {
  const { nagarsevakId } = useAuth();
  const { can, PERMISSIONS } = usePermissions();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [selectedVol, setSelectedVol] = useState(null);
  const [form, setForm] = useState(defForm);
  const [reportForm, setReportForm] = useState(defReport);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canManage = can(PERMISSIONS.MANAGE_VOLUNTEERS);
  const canDeactivate = can(PERMISSIONS.DEACTIVATE_VOLUNTEER);
  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async (isRefresh = false) => {
    if (!nagarsevakId) return;
    if (!isRefresh) setLoading(true);
    try {
      const res = await volunteersService.getAll({ nagarsevak_id: nagarsevakId, limit: 500 });
      setVolunteers(res.volunteers || []);
    } catch (e) { showToast('error', 'Failed to load volunteers.'); }
    setLoading(false);
    setRefreshing(false);
  }, [nagarsevakId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'Name is required.'); return; }
    setSaving(true);
    try {
      const data = { ...form, nagarsevak_id: nagarsevakId };
      if (editItem) await volunteersService.update(editItem.id, data);
      else await volunteersService.create(data);
      showToast('success', 'Volunteer saved!');
      setShowForm(false); setEditItem(null); setForm(defForm); load(true);
    } catch (e) { showToast('error', e.message); }
    setSaving(false);
  };

  const handleSubmitReport = async () => {
    if (!reportForm.task.trim() || !reportForm.date) { showToast('error', 'Date and task are required.'); return; }
    setSaving(true);
    try {
      await volunteersService.createReport({
        ...reportForm,
        volunteerId: selectedVol.id,
        volunteerName: selectedVol.name,
        ward: selectedVol.ward,
        nagarsevak_id: nagarsevakId,
      });
      showToast('success', 'Report submitted!');
      setShowReport(false); setReportForm(defReport);
    } catch (e) { showToast('error', e.message); }
    setSaving(false);
  };

  const handleDelete = (v) => {
    Alert.alert('Remove Volunteer', `Remove ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await volunteersService.delete(v.id); showToast('success', 'Removed.'); load(true); }
        catch (e) { showToast('error', e.message); }
      }},
    ]);
  };

  const filtered = volunteers.filter((v) =>
    (!search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.mobile?.includes(search) || v.ward?.includes(search))
    && (filterStatus === 'All' || v.status === filterStatus)
  );

  const stats = {
    total: volunteers.length,
    active: volunteers.filter(v => v.status === 'Active').length,
    leaders: volunteers.filter(v => v.role === 'Team Leader').length,
    karyakarta: volunteers.filter(v => v.role === 'Karyakarta').length,
  };

  const renderItem = ({ item: v }) => (
    <TouchableOpacity style={styles.card} onPress={() => setViewItem(v)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Avatar name={v.name} photo={v.photo} size={44} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{v.name}</Text>
          <Text style={styles.cardRole}>{v.role}</Text>
          <Text style={styles.cardMobile}>{v.mobile}</Text>
        </View>
        <StatusBadge status={v.status} />
      </View>
      <View style={styles.cardMeta}>
        {v.ward ? <View style={styles.metaChip}><Text style={styles.metaChipText}>Ward {v.ward}</Text></View> : null}
        {v.skills ? <View style={styles.metaChip}><Text style={styles.metaChipText} numberOfLines={1}>{v.skills}</Text></View> : null}
      </View>
      {canManage && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.reportBtn} onPress={() => { setSelectedVol(v); setShowReport(true); }}>
            <Icon name="document-text" size={14} color={COLORS.primary} />
            <Text style={styles.reportBtnText}>Add Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => { setEditItem(v); setForm({ ...defForm, ...v }); setShowForm(true); }}>
            <Icon name="pencil" size={14} color={COLORS.warning} />
          </TouchableOpacity>
          {canDeactivate && (
            <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(v)}>
              <Icon name="trash" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingHorizontal: padding }]}>
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <View style={[styles.statsGrid, { paddingTop: padding }]}>
        {[
          { icon: '🤝', label: 'Total', value: stats.total, color: '#ede9fe' },
          { icon: '✅', label: 'Active', value: stats.active, color: '#d1fae5' },
          { icon: '👑', label: 'Leaders', value: stats.leaders, color: '#fce7f3' },
          { icon: '🏃', label: 'Karyakarta', value: stats.karyakarta, color: '#dbeafe' },
        ].map((s, i) => <StatCard key={i} {...s} style={{ flex: 1 }} />)}
      </View>

      <View style={styles.filterRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Name, mobile, ward..." style={{ flex: 1 }} />
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditItem(null); setForm(defForm); setShowForm(true); }}>
            <Icon name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <FilterChips options={['All', 'Active', 'Inactive']} value={filterStatus} onChange={setFilterStatus} style={{ marginBottom: SPACING.md }} />
      <Text style={styles.count}>{filtered.length} volunteers</Text>

      {loading ? <LoadingSpinner text="Loading volunteers..." full /> : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.id}
          renderItem={renderItem}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tab' : 'phone'}
          columnWrapperStyle={isTablet ? { gap: SPACING.md } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="🤝" title="No volunteers found" />}
        />
      )}

      {/* Detail */}
      <ModalSheet visible={!!viewItem} onClose={() => setViewItem(null)} title="Volunteer Profile">
        {viewItem && (
          <View>
            <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
              <Avatar name={viewItem.name} photo={viewItem.photo} size={72} />
              <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.gray800, marginTop: SPACING.md }}>{viewItem.name}</Text>
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray500 }}>{viewItem.role}</Text>
              <StatusBadge status={viewItem.status} style={{ marginTop: SPACING.sm }} />
            </View>
            {[
              ['Mobile', viewItem.mobile],
              ['Ward', viewItem.ward],
              ['Skills', viewItem.skills],
              ['Address', viewItem.address],
              ['Joined', formatDate(viewItem.joinDate)],
            ].map(([k, v]) => v ? (
              <View key={k} style={styles.detailRow}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailVal}>{v}</Text>
              </View>
            ) : null)}
          </View>
        )}
      </ModalSheet>

      {/* Add/Edit Form */}
      <ModalSheet visible={showForm} onClose={() => { setShowForm(false); setEditItem(null); setForm(defForm); }} title={editItem ? 'Edit Volunteer' : 'Add Volunteer'}>
        <FormGroup label="Full Name" required>
          <Input value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} placeholder="Full name" />
        </FormGroup>
        <FormGroup label="Mobile">
          <Input value={form.mobile} onChangeText={(v) => setForm(f => ({ ...f, mobile: v }))} placeholder="10-digit mobile" keyboardType="phone-pad" />
        </FormGroup>
        <FormGroup label="Ward">
          <Input value={form.ward} onChangeText={(v) => setForm(f => ({ ...f, ward: v }))} placeholder="Ward number" keyboardType="numeric" />
        </FormGroup>
        <FormGroup label="Role">
          <SelectField value={form.role} options={ROLES} onChange={(v) => setForm(f => ({ ...f, role: v }))} />
        </FormGroup>
        <FormGroup label="Skills">
          <Input value={form.skills} onChangeText={(v) => setForm(f => ({ ...f, skills: v }))} placeholder="e.g. Communication, Event Mgmt" />
        </FormGroup>
        <FormGroup label="Address">
          <Input value={form.address} onChangeText={(v) => setForm(f => ({ ...f, address: v }))} placeholder="Address" multiline numberOfLines={2} />
        </FormGroup>
        <FormGroup label="Join Date">
          <Input value={form.joinDate} onChangeText={(v) => setForm(f => ({ ...f, joinDate: v }))} placeholder="YYYY-MM-DD" />
        </FormGroup>
        <FormGroup label="Status">
          <SelectField value={form.status} options={['Active', 'Inactive']} onChange={(v) => setForm(f => ({ ...f, status: v }))} />
        </FormGroup>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Update Volunteer' : 'Add Volunteer'}</Text>
        </TouchableOpacity>
      </ModalSheet>

      {/* Report Form */}
      <ModalSheet visible={showReport} onClose={() => { setShowReport(false); setReportForm(defReport); }} title={`Report for ${selectedVol?.name}`}>
        <FormGroup label="Date" required>
          <Input value={reportForm.date} onChangeText={(v) => setReportForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" />
        </FormGroup>
        <FormGroup label="Task Performed" required>
          <Input value={reportForm.task} onChangeText={(v) => setReportForm(f => ({ ...f, task: v }))} placeholder="Describe the task..." multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.md }} />
        </FormGroup>
        <FormGroup label="Hours Worked">
          <Input value={reportForm.hours} onChangeText={(v) => setReportForm(f => ({ ...f, hours: v }))} placeholder="e.g. 4" keyboardType="numeric" />
        </FormGroup>
        <FormGroup label="Status">
          <SelectField value={reportForm.status} options={['Completed', 'Pending', 'In Progress']} onChange={(v) => setReportForm(f => ({ ...f, status: v }))} />
        </FormGroup>
        <FormGroup label="Notes">
          <Input value={reportForm.note} onChangeText={(v) => setReportForm(f => ({ ...f, note: v }))} placeholder="Additional notes..." multiline numberOfLines={2} />
        </FormGroup>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSubmitReport} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Submitting...' : 'Submit Report'}</Text>
        </TouchableOpacity>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  addBtn: { width: 44, height: 44, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  count: { ...TYPOGRAPHY.caption, color: COLORS.gray500, marginBottom: SPACING.sm },
  card: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.sm },
  cardInfo: { flex: 1 },
  cardName: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  cardRole: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginBottom: 2 },
  cardMobile: { ...TYPOGRAPHY.caption, color: COLORS.gray500 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaChip: { backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  metaChipText: { ...TYPOGRAPHY.caption, color: COLORS.gray600, maxWidth: 120 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, backgroundColor: COLORS.primaryLight, padding: SPACING.sm, borderRadius: RADIUS.md, justifyContent: 'center' },
  reportBtnText: { ...TYPOGRAPHY.labelSm, color: COLORS.primary },
  editBtn: { width: 32, height: 32, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  delBtn: { width: 32, height: 32, backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', top: 80, left: 20, right: 20, padding: SPACING.md, borderRadius: RADIUS.lg, zIndex: 999 },
  toastSuccess: { backgroundColor: COLORS.success },
  toastError: { backgroundColor: COLORS.danger },
  toastText: { ...TYPOGRAPHY.label, color: COLORS.white },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailKey: { ...TYPOGRAPHY.bodySm, color: COLORS.gray500 },
  detailVal: { ...TYPOGRAPHY.bodySm, color: COLORS.gray800, fontWeight: '500' },
  saveBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.md },
  saveBtnText: { ...TYPOGRAPHY.h5, color: COLORS.white },
});
