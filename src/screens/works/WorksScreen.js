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
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';
import {usePermissions} from '../../hooks/usePermissions';
import worksService from '../../services/worksService';
import {
  StatCard,
  StatusBadge,
  SearchBar,
  EmptyState,
  LoadingSpinner,
  FilterChips,
  PrimaryButton,
} from '../../components/common/UI';
import {
  FormGroup,
  Input,
  SelectField,
  ModalSheet,
} from '../../components/layout/ScreenWrapper';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatDate, formatCurrency, truncate} from '../../utils/formatters';
import ScreenHeader from '../../components/common/ScreenHeader';

const WORK_CATS = [
  'Road',
  'Drainage',
  'Park',
  'Building',
  'Bridge',
  'Water',
  'Electricity',
  'School',
  'Hospital',
  'Other',
];
const STATUSES = ['Planned', 'Ongoing', 'Completed', 'Delayed'];
const defForm = {
  title: '',
  description: '',
  category: 'Road',
  status: 'Ongoing',
  budget: '',
  contractor: '',
  ward: '',
  startDate: '',
  endDate: '',
  beforePhoto: '',
  afterPhoto: '',
  beneficiaries: '',
};

const STATUS_COLOR = {
  Planned: '#ede9fe',
  Ongoing: '#dbeafe',
  Completed: '#d1fae5',
  Delayed: '#fee2e2',
};

export default function WorksScreen() {
  const {nagarsevakId} = useAuth();
  const {can, PERMISSIONS} = usePermissions();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canManage = can(PERMISSIONS.MANAGE_WORKS);

  const showToast = (type, msg) => {
    setToast({type, msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(
    async (isRefresh = false) => {
      if (!nagarsevakId) return;
      if (!isRefresh) setLoading(true);
      try {
        const res = await worksService.getAll({
          nagarsevak_id: nagarsevakId,
          limit: 500,
        });
        setItems(res.works || []);
      } catch (e) {
        showToast('error', 'Failed to load works.');
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
    if (!form.title.trim()) {
      showToast('error', 'Title is required.');
      return;
    }
    setSaving(true);
    try {
      const data = {...form, nagarsevak_id: nagarsevakId};
      if (editItem) await worksService.update(editItem.id, data);
      else await worksService.create(data);
      showToast('success', 'Work saved!');
      setShowForm(false);
      setEditItem(null);
      setForm(defForm);
      load(true);
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const handleDelete = w => {
    Alert.alert('Delete Work', `Delete "${w.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await worksService.delete(w.id);
            showToast('success', 'Deleted.');
            load(true);
          } catch (e) {
            showToast('error', e.message);
          }
        },
      },
    ]);
  };

  const filtered = items.filter(
    w =>
      (!search ||
        w.title?.toLowerCase().includes(search.toLowerCase()) ||
        w.ward?.toLowerCase().includes(search.toLowerCase())) &&
      (filterStatus === 'All' || w.status === filterStatus),
  );

  const stats = {
    total: items.length,
    completed: items.filter(w => w.status === 'Completed').length,
    ongoing: items.filter(w => w.status === 'Ongoing').length,
    delayed: items.filter(w => w.status === 'Delayed').length,
  };

  const renderItem = ({item: w}) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => setViewItem(w)}
      activeOpacity={0.7}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {w.title}
        </Text>
        <StatusBadge status={w.status} />
      </View>
      <View style={styles.itemMeta}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>📂 {w.category}</Text>
        </View>
        {w.ward ? (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>Ward {w.ward}</Text>
          </View>
        ) : null}
        {w.budget ? (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{formatCurrency(w.budget)}</Text>
          </View>
        ) : null}
      </View>
      {w.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {w.description}
        </Text>
      ) : null}
      <View style={styles.itemFooter}>
        <Text style={styles.date}>
          {formatDate(w.startDate)} →{' '}
          {w.endDate ? formatDate(w.endDate) : 'Ongoing'}
        </Text>
        {canManage && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.warningLight}]}
              onPress={() => {
                setEditItem(w);
                setForm({...defForm, ...w});
                setShowForm(true);
              }}>
              <Icon name="pencil" size={14} color={COLORS.warning} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.dangerLight}]}
              onPress={() => handleDelete(w)}>
              <Icon name="trash" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <ScreenHeader
        title={`Jan Vikas Tracker`}
        subtitle={formatDate(new Date())}
        rightIcon="notifications-outline"
      />
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

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.statsGrid, {paddingTop: padding}]}>
          {[
            {icon: '🏗️', label: 'Total', value: stats.total, color: '#dbeafe'},
            {
              icon: '✅',
              label: 'Completed',
              value: stats.completed,
              color: '#d1fae5',
            },
            {
              icon: '🔄',
              label: 'Ongoing',
              value: stats.ongoing,
              color: '#fef3c7',
            },
            {
              icon: '⚠️',
              label: 'Delayed',
              value: stats.delayed,
              color: '#fee2e2',
            },
          ].map((s, i) => (
            <StatCard key={i} {...s} style={{flex: 1}} />
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title or ward..."
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
          options={['All', ...STATUSES]}
          value={filterStatus}
          onChange={setFilterStatus}
          style={{marginBottom: SPACING.md}}
        />
        <Text style={styles.count}>
          {filtered.length} of {items.length} works
        </Text>

        {loading ? (
          <LoadingSpinner text="Loading works..." full />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={w => w.id}
            renderItem={renderItem}
            numColumns={isTablet ? 2 : 1}
            key={isTablet ? 'tab' : 'phone'}
            columnWrapperStyle={isTablet ? {gap: SPACING.md} : undefined}
            ItemSeparatorComponent={() => <View style={{height: SPACING.md}} />}
            contentContainerStyle={{paddingBottom: 120}}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
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
            ListEmptyComponent={<EmptyState icon="🏗️" title="No works found" />}
          />
        )}

        {/* Detail */}
        <ModalSheet
          visible={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Work Details">
          {viewItem && (
            <View>
              <Text style={styles.detailTitle}>{viewItem.title}</Text>
              <StatusBadge
                status={viewItem.status}
                style={{marginBottom: SPACING.lg}}
              />
              {[
                ['Category', viewItem.category],
                ['Ward', viewItem.ward],
                ['Budget', formatCurrency(viewItem.budget)],
                ['Contractor', viewItem.contractor],
                ['Beneficiaries', viewItem.beneficiaries],
                ['Start Date', formatDate(viewItem.startDate)],
                ['End Date', formatDate(viewItem.endDate)],
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
          title={editItem ? 'Edit Work' : 'Add Work'}>
          <FormGroup label="Title" required>
            <Input
              value={form.title}
              onChangeText={v => setForm(f => ({...f, title: v}))}
              placeholder="Work title"
            />
          </FormGroup>
          <FormGroup label="Category">
            <SelectField
              value={form.category}
              options={WORK_CATS}
              onChange={v => setForm(f => ({...f, category: v}))}
            />
          </FormGroup>
          <FormGroup label="Ward">
            <Input
              value={form.ward}
              onChangeText={v => setForm(f => ({...f, ward: v}))}
              placeholder="Ward number"
              keyboardType="numeric"
            />
          </FormGroup>
          <FormGroup label="Budget (₹)">
            <Input
              value={form.budget}
              onChangeText={v => setForm(f => ({...f, budget: v}))}
              placeholder="e.g. 500000"
              keyboardType="numeric"
            />
          </FormGroup>
          <FormGroup label="Contractor">
            <Input
              value={form.contractor}
              onChangeText={v => setForm(f => ({...f, contractor: v}))}
              placeholder="Contractor name"
            />
          </FormGroup>
          <FormGroup label="Beneficiaries">
            <Input
              value={form.beneficiaries}
              onChangeText={v => setForm(f => ({...f, beneficiaries: v}))}
              placeholder="No. of beneficiaries"
              keyboardType="numeric"
            />
          </FormGroup>
          <FormGroup label="Start Date">
            <Input
              value={form.startDate}
              onChangeText={v => setForm(f => ({...f, startDate: v}))}
              placeholder="YYYY-MM-DD"
            />
          </FormGroup>
          <FormGroup label="End Date">
            <Input
              value={form.endDate}
              onChangeText={v => setForm(f => ({...f, endDate: v}))}
              placeholder="YYYY-MM-DD"
            />
          </FormGroup>
          <FormGroup label="Status">
            <SelectField
              value={form.status}
              options={STATUSES}
              onChange={v => setForm(f => ({...f, status: v}))}
            />
          </FormGroup>
          <FormGroup label="Description">
            <Input
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              placeholder="Work description..."
              multiline
              numberOfLines={3}
              style={{
                minHeight: 80,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
              }}
            />
          </FormGroup>
          <PrimaryButton
            title={editItem ? 'Update Work' : 'Add Work'}
            onPress={handleSave}
            loading={saving}
            style={{marginTop: SPACING.md}}
          />
        </ModalSheet>
        </ScrollView>
      </View>
    </>
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
  itemCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  itemTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.gray800,
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metaChip: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaChipText: {...TYPOGRAPHY.caption, color: COLORS.gray600},
  desc: {...TYPOGRAPHY.bodySm, color: COLORS.gray500, marginBottom: SPACING.sm},
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {...TYPOGRAPHY.caption, color: COLORS.gray400, flex: 1},
  actions: {flexDirection: 'row', gap: SPACING.sm},
  actionBtn: {
    width: 30,
    height: 30,
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
    marginBottom: SPACING.sm,
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
});
