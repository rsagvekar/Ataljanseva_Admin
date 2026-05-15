import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import scheduleService from '../../services/scheduleService';
import { StatCard, EmptyState, LoadingSpinner, FilterChips, SearchBar } from '../../components/common/UI';
import { ModalSheet, FormGroup, Input, SelectField } from '../../components/layout/ScreenWrapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';
import { formatDate } from '../../utils/formatters';

const TYPES = ['Meeting', 'Site Visit', 'Felicitation', 'Press Conference', 'Welfare Camp', 'Other'];
const TYPE_EMOJIS = { Meeting: '🤝', 'Site Visit': '🏗️', Felicitation: '🏆', 'Press Conference': '📰', 'Welfare Camp': '❤️', Other: '📋' };
const defForm = { title: '', type: 'Meeting', date: '', time: '', venue: '', notes: '' };

export default function ScheduleScreen() {
  const { nagarsevakId } = useAuth();
  const { can, PERMISSIONS } = usePermissions();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;
  const now = new Date();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canManage = can(PERMISSIONS.MANAGE_SCHEDULE);
  const showToast = (t, m) => { setToast({ type: t, msg: m }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async (isRefresh = false) => {
    if (!nagarsevakId) return;
    if (!isRefresh) setLoading(true);
    try {
      const res = await scheduleService.getAll({ nagarsevak_id: nagarsevakId, limit: 500 });
      setItems(Array.isArray(res) ? res : res.schedule || []);
    } catch (e) { showToast('error', 'Failed to load schedule.'); }
    setLoading(false); setRefreshing(false);
  }, [nagarsevakId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) { showToast('error', 'Title and date required.'); return; }
    setSaving(true);
    try {
      const data = { ...form, nagarsevak_id: nagarsevakId };
      if (editItem) await scheduleService.update(editItem.id, data);
      else await scheduleService.create(data);
      showToast('success', 'Saved!');
      setShowForm(false); setEditItem(null); setForm(defForm); load(true);
    } catch (e) { showToast('error', e.message); }
    setSaving(false);
  };

  const handleAttendance = async (item, attended) => {
    try {
      await scheduleService.markAttendance(item.id, attended);
      showToast('success', attended ? 'Marked attended.' : 'Unmarked.');
      load(true);
    } catch (e) { showToast('error', e.message); }
  };

  const filtered = items.filter((s) => {
    const matches = !search || s.title?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Upcoming') return matches && new Date(s.date) >= now;
    if (filter === 'Past') return matches && new Date(s.date) < now;
    return matches;
  });

  const stats = {
    total: items.length,
    upcoming: items.filter(s => new Date(s.date) >= now).length,
    attended: items.filter(s => s.attended).length,
    thisWeek: items.filter(s => { const d = new Date(s.date), diff = (d - now) / 86400000; return diff >= 0 && diff <= 7; }).length,
  };

  const renderItem = ({ item: s }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={{ fontSize: 22 }}>{TYPE_EMOJIS[s.type] || '📋'}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
        <Text style={styles.cardDate}>{formatDate(s.date)}{s.time ? ` · ${s.time}` : ''}</Text>
        {s.venue ? <Text style={styles.cardVenue}>📍 {s.venue}</Text> : null}
        <View style={styles.cardMeta}>
          <View style={styles.chip}><Text style={styles.chipText}>{s.type}</Text></View>
          {s.attended ? <View style={[styles.chip, { backgroundColor: COLORS.successLight }]}><Text style={[styles.chipText, { color: COLORS.success }]}>✅ Attended</Text></View> : null}
        </View>
      </View>
      {canManage && (
        <View style={styles.cardBtns}>
          <TouchableOpacity style={styles.editBtn} onPress={() => { setEditItem(s); setForm({ ...defForm, ...s }); setShowForm(true); }}>
            <Icon name="pencil" size={13} color={COLORS.warning} />
          </TouchableOpacity>
          {new Date(s.date) < now && (
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: s.attended ? COLORS.gray100 : COLORS.successLight }]} onPress={() => handleAttendance(s, !s.attended)}>
              <Icon name={s.attended ? 'close' : 'checkmark'} size={13} color={s.attended ? COLORS.gray500 : COLORS.success} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingHorizontal: padding }]}>
      {toast && <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}><Text style={styles.toastText}>{toast.msg}</Text></View>}
      <View style={[styles.statsGrid, { paddingTop: padding }]}>
        {[{ icon: '📋', label: 'Total', value: stats.total, color: '#dbeafe' }, { icon: '🔜', label: 'Upcoming', value: stats.upcoming, color: '#fef3c7' }, { icon: '✅', label: 'Attended', value: stats.attended, color: '#d1fae5' }, { icon: '📆', label: 'This Week', value: stats.thisWeek, color: '#ede9fe' }].map((s, i) => <StatCard key={i} {...s} style={{ flex: 1 }} />)}
      </View>
      <View style={styles.filterRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search schedule..." style={{ flex: 1 }} />
        {canManage && <TouchableOpacity style={styles.addBtn} onPress={() => { setEditItem(null); setForm(defForm); setShowForm(true); }}><Icon name="add" size={22} color={COLORS.white} /></TouchableOpacity>}
      </View>
      <FilterChips options={['Upcoming', 'Past', 'All']} value={filter} onChange={setFilter} style={{ marginBottom: SPACING.md }} />
      {loading ? <LoadingSpinner text="Loading schedule..." full /> : (
        <FlatList
          data={filtered.sort((a, b) => new Date(a.date) - new Date(b.date))}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="📋" title="No schedule items" />}
        />
      )}
      <ModalSheet visible={showForm} onClose={() => { setShowForm(false); setEditItem(null); setForm(defForm); }} title={editItem ? 'Edit Schedule' : 'Add Schedule'}>
        <FormGroup label="Title" required><Input value={form.title} onChangeText={(v) => setForm(f => ({ ...f, title: v }))} placeholder="Event title" /></FormGroup>
        <FormGroup label="Type"><SelectField value={form.type} options={TYPES} onChange={(v) => setForm(f => ({ ...f, type: v }))} /></FormGroup>
        <FormGroup label="Date" required><Input value={form.date} onChangeText={(v) => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" /></FormGroup>
        <FormGroup label="Time"><Input value={form.time} onChangeText={(v) => setForm(f => ({ ...f, time: v }))} placeholder="e.g. 11:00 AM" /></FormGroup>
        <FormGroup label="Venue"><Input value={form.venue} onChangeText={(v) => setForm(f => ({ ...f, venue: v }))} placeholder="Location" /></FormGroup>
        <FormGroup label="Notes"><Input value={form.notes} onChangeText={(v) => setForm(f => ({ ...f, notes: v }))} placeholder="Notes..." multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: SPACING.md }} /></FormGroup>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Update' : 'Add to Schedule'}</Text>
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
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardLeft: { width: 44, height: 44, backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  cardDate: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginTop: 2 },
  cardVenue: { ...TYPOGRAPHY.caption, color: COLORS.gray500, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, flexWrap: 'wrap' },
  chip: { backgroundColor: COLORS.gray100, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { ...TYPOGRAPHY.caption, color: COLORS.gray600 },
  cardBtns: { gap: SPACING.sm },
  editBtn: { width: 30, height: 30, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', top: 80, left: 20, right: 20, padding: SPACING.md, borderRadius: RADIUS.lg, zIndex: 999 },
  toastSuccess: { backgroundColor: COLORS.success }, toastError: { backgroundColor: COLORS.danger },
  toastText: { ...TYPOGRAPHY.label, color: COLORS.white },
  saveBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.md },
  saveBtnText: { ...TYPOGRAPHY.h5, color: COLORS.white },
});
