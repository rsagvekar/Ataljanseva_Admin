import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import votersService from '../../services/votersService';
import {
  StatCard, StatusBadge, SearchBar, EmptyState, LoadingSpinner,
  FilterChips, Avatar,
} from '../../components/common/UI';
import { ModalSheet, FormGroup, Input, SelectField } from '../../components/layout/ScreenWrapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';
import { formatDate } from '../../utils/formatters';

const VOTER_TYPES = ['Supporter', 'Neutral', 'Opponent', 'Influencer'];
const GENDERS = ['Male', 'Female', 'Other'];
const defForm = {
  name: '', mobile: '', voterId: '', ward: '', booth: '',
  dob: '', gender: 'Male', address: '', voterType: 'Supporter',
  anniversary: '', occupation: '', notes: '',
};

export default function VotersScreen() {
  const { nagarsevakId } = useAuth();
  const { can, PERMISSIONS } = usePermissions();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canManage = can(PERMISSIONS.MANAGE_VOTERS);
  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async (isRefresh = false) => {
    if (!nagarsevakId) return;
    if (!isRefresh) setLoading(true);
    try {
      const res = await votersService.getAll({ nagarsevak_id: nagarsevakId, limit: 1000 });
      setVoters(Array.isArray(res) ? res : res.voters || []);
    } catch (e) { showToast('error', 'Failed to load voters.'); }
    setLoading(false);
    setRefreshing(false);
  }, [nagarsevakId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'Name is required.'); return; }
    setSaving(true);
    try {
      const data = { ...form, nagarsevak_id: nagarsevakId };
      if (editItem) await votersService.update(editItem.id, data);
      else await votersService.create(data);
      showToast('success', 'Voter saved!');
      setShowForm(false); setEditItem(null); setForm(defForm); load(true);
    } catch (e) { showToast('error', e.message); }
    setSaving(false);
  };

  const handleDelete = (v) => {
    Alert.alert('Delete Voter', `Delete ${v.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await votersService.delete(v.id); showToast('success', 'Deleted.'); load(true); }
        catch (e) { showToast('error', e.message); }
      }},
    ]);
  };

  const TYPE_COLORS = {
    Supporter: { bg: '#d1fae5', text: '#065f46' },
    Neutral: { bg: '#f3f4f6', text: '#4b5563' },
    Opponent: { bg: '#fee2e2', text: '#991b1b' },
    Influencer: { bg: '#ede9fe', text: '#4c1d95' },
  };

  const filtered = voters.filter((v) =>
    (!search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.mobile?.includes(search) || v.voterId?.toLowerCase().includes(search.toLowerCase()))
    && (filterType === 'All' || v.voterType === filterType)
  );

  const stats = {
    total: voters.length,
    supporters: voters.filter(v => v.voterType === 'Supporter').length,
    neutral: voters.filter(v => v.voterType === 'Neutral').length,
    influencers: voters.filter(v => v.voterType === 'Influencer').length,
  };

  const renderItem = ({ item: v }) => {
    const tc = TYPE_COLORS[v.voterType] || { bg: '#f3f4f6', text: '#4b5563' };
    return (
      <TouchableOpacity style={styles.card} onPress={() => setViewItem(v)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Avatar name={v.name} size={42} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{v.name}</Text>
            <Text style={styles.cardSub}>{v.mobile} {v.ward ? `· Ward ${v.ward}` : ''}</Text>
            {v.voterId ? <Text style={styles.cardVoterId}>ID: {v.voterId}</Text> : null}
          </View>
          <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
            <Text style={[styles.typeBadgeText, { color: tc.text }]}>{v.voterType || '—'}</Text>
          </View>
        </View>
        {canManage && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => { setEditItem(v); setForm({ ...defForm, ...v }); setShowForm(true); }}>
              <Icon name="pencil" size={14} color={COLORS.warning} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(v)}>
              <Icon name="trash" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingHorizontal: padding }]}>
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <View style={[styles.statsGrid, { paddingTop: padding }]}>
        {[
          { icon: '🗳️', label: 'Total', value: stats.total, color: '#dbeafe' },
          { icon: '💚', label: 'Supporters', value: stats.supporters, color: '#d1fae5' },
          { icon: '😐', label: 'Neutral', value: stats.neutral, color: '#f3f4f6' },
          { icon: '⭐', label: 'Influencers', value: stats.influencers, color: '#ede9fe' },
        ].map((s, i) => <StatCard key={i} {...s} style={{ flex: 1 }} />)}
      </View>

      <View style={styles.filterRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Name, mobile, voter ID..." style={{ flex: 1 }} />
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditItem(null); setForm(defForm); setShowForm(true); }}>
            <Icon name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <FilterChips options={['All', ...VOTER_TYPES]} value={filterType} onChange={setFilterType} style={{ marginBottom: SPACING.md }} />
      <Text style={styles.count}>{filtered.length} of {voters.length} voters</Text>

      {loading ? <LoadingSpinner text="Loading voters..." full /> : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.id}
          renderItem={renderItem}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tab' : 'phone'}
          columnWrapperStyle={isTablet ? { gap: SPACING.md } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="🗳️" title="No voters found" />}
        />
      )}

      {/* Detail */}
      <ModalSheet visible={!!viewItem} onClose={() => setViewItem(null)} title="Voter Details">
        {viewItem && (
          <View>
            <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
              <Avatar name={viewItem.name} size={64} />
              <Text style={{ ...TYPOGRAPHY.h3, marginTop: SPACING.md, color: COLORS.gray800 }}>{viewItem.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[viewItem.voterType] || {}).bg || '#f3f4f6', marginTop: SPACING.sm }]}>
                <Text style={[styles.typeBadgeText, { color: (TYPE_COLORS[viewItem.voterType] || {}).text || '#4b5563' }]}>{viewItem.voterType}</Text>
              </View>
            </View>
            {[
              ['Mobile', viewItem.mobile],
              ['Voter ID', viewItem.voterId],
              ['Ward', viewItem.ward],
              ['Booth', viewItem.booth],
              ['Gender', viewItem.gender],
              ['Date of Birth', formatDate(viewItem.dob)],
              ['Anniversary', formatDate(viewItem.anniversary)],
              ['Occupation', viewItem.occupation],
              ['Address', viewItem.address],
            ].map(([k, v]) => v && v !== '—' ? (
              <View key={k} style={styles.detailRow}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailVal}>{v}</Text>
              </View>
            ) : null)}
            {viewItem.notes ? (
              <><Text style={styles.detailDescLabel}>Notes</Text><Text style={styles.detailDesc}>{viewItem.notes}</Text></>
            ) : null}
          </View>
        )}
      </ModalSheet>

      {/* Form */}
      <ModalSheet visible={showForm} onClose={() => { setShowForm(false); setEditItem(null); setForm(defForm); }} title={editItem ? 'Edit Voter' : 'Add Voter'}>
        <FormGroup label="Full Name" required>
          <Input value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} placeholder="Full name" />
        </FormGroup>
        <FormGroup label="Mobile">
          <Input value={form.mobile} onChangeText={(v) => setForm(f => ({ ...f, mobile: v }))} placeholder="10-digit mobile" keyboardType="phone-pad" />
        </FormGroup>
        <FormGroup label="Voter ID">
          <Input value={form.voterId} onChangeText={(v) => setForm(f => ({ ...f, voterId: v }))} placeholder="Voter ID number" autoCapitalize="characters" />
        </FormGroup>
        <FormGroup label="Ward">
          <Input value={form.ward} onChangeText={(v) => setForm(f => ({ ...f, ward: v }))} placeholder="Ward number" keyboardType="numeric" />
        </FormGroup>
        <FormGroup label="Booth">
          <Input value={form.booth} onChangeText={(v) => setForm(f => ({ ...f, booth: v }))} placeholder="Booth number" keyboardType="numeric" />
        </FormGroup>
        <FormGroup label="Gender">
          <SelectField value={form.gender} options={GENDERS} onChange={(v) => setForm(f => ({ ...f, gender: v }))} />
        </FormGroup>
        <FormGroup label="Date of Birth">
          <Input value={form.dob} onChangeText={(v) => setForm(f => ({ ...f, dob: v }))} placeholder="YYYY-MM-DD" />
        </FormGroup>
        <FormGroup label="Anniversary">
          <Input value={form.anniversary} onChangeText={(v) => setForm(f => ({ ...f, anniversary: v }))} placeholder="YYYY-MM-DD" />
        </FormGroup>
        <FormGroup label="Voter Type">
          <SelectField value={form.voterType} options={VOTER_TYPES} onChange={(v) => setForm(f => ({ ...f, voterType: v }))} />
        </FormGroup>
        <FormGroup label="Occupation">
          <Input value={form.occupation} onChangeText={(v) => setForm(f => ({ ...f, occupation: v }))} placeholder="Occupation" />
        </FormGroup>
        <FormGroup label="Address">
          <Input value={form.address} onChangeText={(v) => setForm(f => ({ ...f, address: v }))} placeholder="Full address" multiline numberOfLines={2} />
        </FormGroup>
        <FormGroup label="Notes">
          <Input value={form.notes} onChangeText={(v) => setForm(f => ({ ...f, notes: v }))} placeholder="Any additional notes..." multiline numberOfLines={2} />
        </FormGroup>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Update Voter' : 'Add Voter'}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardInfo: { flex: 1 },
  cardName: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  cardSub: { ...TYPOGRAPHY.caption, color: COLORS.gray500, marginTop: 2 },
  cardVoterId: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginTop: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  typeBadgeText: { ...TYPOGRAPHY.labelSm },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  editBtn: { width: 30, height: 30, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  delBtn: { width: 30, height: 30, backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', top: 80, left: 20, right: 20, padding: SPACING.md, borderRadius: RADIUS.lg, zIndex: 999 },
  toastSuccess: { backgroundColor: COLORS.success },
  toastError: { backgroundColor: COLORS.danger },
  toastText: { ...TYPOGRAPHY.label, color: COLORS.white },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailKey: { ...TYPOGRAPHY.bodySm, color: COLORS.gray500 },
  detailVal: { ...TYPOGRAPHY.bodySm, color: COLORS.gray800, fontWeight: '500' },
  detailDescLabel: { ...TYPOGRAPHY.label, color: COLORS.gray600, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  detailDesc: { ...TYPOGRAPHY.body, color: COLORS.gray700 },
  saveBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.md },
  saveBtnText: { ...TYPOGRAPHY.h5, color: COLORS.white },
});
