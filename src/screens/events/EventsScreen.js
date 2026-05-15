import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';
import {usePermissions} from '../../hooks/usePermissions';
import eventsService from '../../services/eventsService';
import {
  StatCard,
  StatusBadge,
  SearchBar,
  EmptyState,
  LoadingSpinner,
  FilterChips,
} from '../../components/common/UI';
import {
  ModalSheet,
  FormGroup,
  Input,
  SelectField,
} from '../../components/layout/ScreenWrapper';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatDate, formatDateTime} from '../../utils/formatters';

const EVENT_TYPES = [
  'Meeting',
  'Rally',
  'Cultural',
  'Sports',
  'Social',
  'Health Camp',
  'Other',
];
const defForm = {
  title: '',
  type: 'Meeting',
  date: '',
  time: '',
  venue: '',
  description: '',
  expectedAttendance: '',
  organizer: '',
  status: 'Upcoming',
};

export default function EventsScreen() {
  const {nagarsevakId} = useAuth();
  const {can, PERMISSIONS} = usePermissions();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canManage = can(PERMISSIONS.MANAGE_EVENTS);
  const showToast = (type, msg) => {
    setToast({type, msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(
    async (isRefresh = false) => {
      if (!nagarsevakId) return;
      if (!isRefresh) setLoading(true);
      try {
        const res = await eventsService.getAll({
          nagarsevak_id: nagarsevakId,
          limit: 500,
        });
        setEvents(Array.isArray(res) ? res : res.events || []);
      } catch (e) {
        showToast('error', 'Failed to load events.');
      }
      setLoading(false);
      setRefreshing(false);
    },
    [nagarsevakId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      showToast('error', 'Title and date are required.');
      return;
    }
    setSaving(true);
    try {
      const data = {...form, nagarsevak_id: nagarsevakId};
      if (editItem) await eventsService.update(editItem.id, data);
      else await eventsService.create(data);
      showToast('success', 'Event saved!');
      setShowForm(false);
      setEditItem(null);
      setForm(defForm);
      load(true);
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const handleDelete = e => {
    Alert.alert('Delete Event', `Delete "${e.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await eventsService.delete(e.id);
            showToast('success', 'Deleted.');
            load(true);
          } catch (err) {
            showToast('error', err.message);
          }
        },
      },
    ]);
  };

  const now = new Date();
  const filtered = events.filter(e => {
    const matchSearch =
      !search || e.title?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'Upcoming') return matchSearch && new Date(e.date) >= now;
    if (filter === 'Past') return matchSearch && new Date(e.date) < now;
    return matchSearch;
  });

  const stats = {
    total: events.length,
    upcoming: events.filter(e => new Date(e.date) >= now).length,
    past: events.filter(e => new Date(e.date) < now).length,
    thisMonth: events.filter(e => {
      const d = new Date(e.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  const TYPE_EMOJIS = {
    Meeting: '🤝',
    Rally: '📣',
    Cultural: '🎭',
    Sports: '🏆',
    Social: '🌟',
    'Health Camp': '🏥',
    Other: '📅',
  };

  const renderItem = ({item: e}) => {
    const isPast = new Date(e.date) < now;
    return (
      <TouchableOpacity
        style={[styles.card, isPast && styles.cardPast]}
        onPress={() => setViewItem(e)}
        activeOpacity={0.7}>
        <View style={styles.cardDateCol}>
          <Text style={styles.cardDateNum}>
            {new Date(e.date).getDate?.() || '—'}
          </Text>
          <Text style={styles.cardDateMon}>
            {new Date(e.date).toLocaleString?.('en', {month: 'short'}) || ''}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {TYPE_EMOJIS[e.type] || '📅'} {e.title}
          </Text>
          {e.venue ? <Text style={styles.cardVenue}>📍 {e.venue}</Text> : null}
          {e.time ? <Text style={styles.cardTime}>🕐 {e.time}</Text> : null}
          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{e.type}</Text>
            </View>
            {e.expectedAttendance ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  👥 {e.expectedAttendance}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {canManage && (
          <View style={styles.cardBtns}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditItem(e);
                setForm({...defForm, ...e});
                setShowForm(true);
              }}>
              <Icon name="pencil" size={13} color={COLORS.warning} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.delBtn}
              onPress={() => handleDelete(e)}>
              <Icon name="trash" size={13} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView>
      <View style={[styles.container, {paddingHorizontal: padding}]}>
        {toast && (
          <View
            style={[
              styles.toast,
              toast.type === 'error' ? styles.toastError : styles.toastSuccess,
            ]}>
            <Text style={styles.toastText}>{toast.msg}</Text>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.statsGrid, {paddingTop: padding}]}>
          {[
            {icon: '📅', label: 'Total', value: stats.total, color: '#fce7f3'},
            {
              icon: '🔜',
              label: 'Upcoming',
              value: stats.upcoming,
              color: '#dbeafe',
            },
            {icon: '✅', label: 'Past', value: stats.past, color: '#d1fae5'},
            {
              icon: '🗓️',
              label: 'This Month',
              value: stats.thisMonth,
              color: '#fef3c7',
            },
          ].map((s, i) => (
            <StatCard key={i} {...s} style={{flex: 1}} />
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search events..."
            style={{flex: 1}}
          />
          {canManage && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setEditItem(null);
                setForm(defForm);
                setShowForm(true);
              }}>
              <Icon name="add" size={22} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
        <FilterChips
          options={['All', 'Upcoming', 'Past']}
          value={filter}
          onChange={setFilter}
          style={{marginBottom: SPACING.md}}
        />
        <Text style={styles.count}>{filtered.length} events</Text>

        {loading ? (
          <LoadingSpinner text="Loading events..." full />
        ) : (
          <FlatList
            data={filtered.sort((a, b) => new Date(b.date) - new Date(a.date))}
            keyExtractor={e => e.id}
            renderItem={renderItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{height: SPACING.md}} />}
            contentContainerStyle={{paddingBottom: 120}}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load(true);
                }}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState icon="📅" title="No events found" />
            }
          />
        )}

        {/* Detail */}
        <ModalSheet
          visible={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Event Details">
          {viewItem && (
            <View>
              <Text style={styles.detailTitle}>
                {TYPE_EMOJIS[viewItem.type] || '📅'} {viewItem.title}
              </Text>
              {[
                ['Type', viewItem.type],
                ['Date', formatDate(viewItem.date)],
                ['Time', viewItem.time],
                ['Venue', viewItem.venue],
                ['Expected Attendance', viewItem.expectedAttendance],
                ['Organizer', viewItem.organizer],
              ].map(([k, v]) =>
                v ? (
                  <View key={k} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{k}</Text>
                    <Text style={styles.detailVal}>{v}</Text>
                  </View>
                ) : null,
              )}
              {viewItem.description ? (
                <>
                  <Text style={styles.detailDescLabel}>Description</Text>
                  <Text style={styles.detailDesc}>{viewItem.description}</Text>
                </>
              ) : null}
            </View>
          )}
        </ModalSheet>

        {/* Form */}
        <ModalSheet
          visible={showForm}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
            setForm(defForm);
          }}
          title={editItem ? 'Edit Event' : 'New Event'}>
          <FormGroup label="Event Title" required>
            <Input
              value={form.title}
              onChangeText={v => setForm(f => ({...f, title: v}))}
              placeholder="Event name"
            />
          </FormGroup>
          <FormGroup label="Type">
            <SelectField
              value={form.type}
              options={EVENT_TYPES}
              onChange={v => setForm(f => ({...f, type: v}))}
            />
          </FormGroup>
          <FormGroup label="Date" required>
            <Input
              value={form.date}
              onChangeText={v => setForm(f => ({...f, date: v}))}
              placeholder="YYYY-MM-DD"
            />
          </FormGroup>
          <FormGroup label="Time">
            <Input
              value={form.time}
              onChangeText={v => setForm(f => ({...f, time: v}))}
              placeholder="e.g. 10:00 AM"
            />
          </FormGroup>
          <FormGroup label="Venue">
            <Input
              value={form.venue}
              onChangeText={v => setForm(f => ({...f, venue: v}))}
              placeholder="Venue / location"
            />
          </FormGroup>
          <FormGroup label="Expected Attendance">
            <Input
              value={form.expectedAttendance}
              onChangeText={v => setForm(f => ({...f, expectedAttendance: v}))}
              placeholder="e.g. 200"
              keyboardType="numeric"
            />
          </FormGroup>
          <FormGroup label="Organizer">
            <Input
              value={form.organizer}
              onChangeText={v => setForm(f => ({...f, organizer: v}))}
              placeholder="Organizer name"
            />
          </FormGroup>
          <FormGroup label="Description">
            <Input
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              placeholder="Event details..."
              multiline
              numberOfLines={3}
              style={{
                minHeight: 80,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
              }}
            />
          </FormGroup>
          <TouchableOpacity
            style={[styles.saveBtn, saving && {opacity: 0.6}]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveBtnText}>
              {saving
                ? 'Saving...'
                : editItem
                ? 'Update Event'
                : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </ModalSheet>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  statsGrid: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md},
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  count: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardPast: {opacity: 0.7},
  cardDateCol: {
    width: 44,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDateNum: {...TYPOGRAPHY.h4, color: COLORS.white},
  cardDateMon: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  cardContent: {flex: 1},
  cardTitle: {...TYPOGRAPHY.label, color: COLORS.gray800, marginBottom: 4},
  cardVenue: {...TYPOGRAPHY.caption, color: COLORS.gray500, marginBottom: 2},
  cardTime: {...TYPOGRAPHY.caption, color: COLORS.primary, marginBottom: 4},
  cardMeta: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  metaChip: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: {...TYPOGRAPHY.caption, color: COLORS.gray600},
  cardBtns: {gap: SPACING.sm},
  editBtn: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtn: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    zIndex: 999,
  },
  toastSuccess: {backgroundColor: COLORS.success},
  toastError: {backgroundColor: COLORS.danger},
  toastText: {...TYPOGRAPHY.label, color: COLORS.white},
  detailTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.gray800,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailKey: {...TYPOGRAPHY.bodySm, color: COLORS.gray500},
  detailVal: {...TYPOGRAPHY.bodySm, color: COLORS.gray800, fontWeight: '500'},
  detailDescLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray600,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  detailDesc: {...TYPOGRAPHY.body, color: COLORS.gray700},
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveBtnText: {...TYPOGRAPHY.h5, color: COLORS.white},
});
