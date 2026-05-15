// ──────────────────────────────────────────────────────────────────────────────
// ProgramsScreen
// ──────────────────────────────────────────────────────────────────────────────
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
import programsService from '../../services/programsService';
import {
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
  SearchBar,
} from '../../components/common/UI';
import {
  ModalSheet,
  FormGroup,
  Input,
  SelectField,
} from '../../components/layout/ScreenWrapper';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatDate} from '../../utils/formatters';

const CATEGORIES = [
  'Healthcare',
  'Education',
  'Women Empowerment',
  'Youth Development',
  'Infrastructure',
  'Agriculture',
  'Other',
];
const defForm = {
  name: '',
  category: 'Healthcare',
  description: '',
  eligibility: '',
  benefits: '',
  startDate: '',
  endDate: '',
  applicationLink: '',
  status: 'Active',
};

export default function ProgramsScreen() {
  const {nagarsevakId} = useAuth();
  const {can, PERMISSIONS} = usePermissions();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Active');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const canManage = can(PERMISSIONS.MANAGE_PROGRAMS);
  const showToast = (t, m) => {
    setToast({type: t, msg: m});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(
    async (isRefresh = false) => {
      if (!nagarsevakId) return;
      if (!isRefresh) setLoading(true);
      try {
        const res = await programsService.getAll({
          nagarsevak_id: nagarsevakId,
          limit: 500,
        });
        setItems(Array.isArray(res) ? res : res.programs || []);
      } catch (e) {
        showToast('error', 'Failed to load.');
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
    if (!form.name.trim()) {
      showToast('error', 'Name required.');
      return;
    }
    setSaving(true);
    try {
      const data = {...form, nagarsevak_id: nagarsevakId};
      if (editItem) await programsService.update(editItem.id, data);
      else await programsService.create(data);
      showToast('success', 'Saved!');
      setShowForm(false);
      setEditItem(null);
      setForm(defForm);
      load(true);
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const handleDelete = p =>
    Alert.alert('Delete Program', `Delete "${p.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await programsService.delete(p.id);
            showToast('success', 'Deleted.');
            load(true);
          } catch (e) {
            showToast('error', e.message);
          }
        },
      },
    ]);

  const CAT_EMOJIS = {
    Healthcare: '🏥',
    Education: '📚',
    'Women Empowerment': '👩',
    'Youth Development': '🎯',
    Infrastructure: '🏗️',
    Agriculture: '🌾',
    Other: '📌',
  };
  const filtered = items.filter(
    p =>
      (!search || p.name?.toLowerCase().includes(search.toLowerCase())) &&
      (filter === 'All' || p.status === filter),
  );

  return (
    <ScrollView>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: COLORS.background,
            paddingHorizontal: padding,
          },
        ]}>
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
          style={[styles.statsGrid, {paddingTop: padding, marginBottom: 12}]}>
          <StatCard
            icon="📃"
            label="Total"
            value={items.length}
            color="#dbeafe"
            style={{flex: 1}}
          />
          <StatCard
            icon="✅"
            label="Active"
            value={items.filter(p => p.status === 'Active').length}
            color="#d1fae5"
            style={{flex: 1}}
          />
          <StatCard
            icon="⏰"
            label="Expired"
            value={items.filter(p => p.status === 'Expired').length}
            color="#fee2e2"
            style={{flex: 1}}
          />
        </ScrollView>
        <View style={styles.filterRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search programs..."
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
        <View
          style={{
            flexDirection: 'row',
            gap: SPACING.sm,
            marginBottom: SPACING.md,
          }}>
          {['Active', 'Expired', 'All'].map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
              onPress={() => setFilter(f)}>
              <Text
                style={[
                  styles.filterChipText,
                  filter === f && styles.filterChipTextActive,
                ]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? (
          <LoadingSpinner text="Loading programs..." full />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            scrollEnabled={false}
            renderItem={({item: p}) => (
              <View style={styles.progCard}>
                <View style={styles.progHeader}>
                  <Text style={{fontSize: 28}}>
                    {CAT_EMOJIS[p.category] || '📌'}
                  </Text>
                  <View style={{flex: 1}}>
                    <Text style={styles.progName}>{p.name}</Text>
                    <Text style={styles.progCat}>{p.category}</Text>
                  </View>
                  <StatusBadge status={p.status} />
                </View>
                {p.description ? (
                  <Text style={styles.progDesc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
                {p.eligibility ? (
                  <Text style={styles.progElig}>👥 {p.eligibility}</Text>
                ) : null}
                <View style={styles.progFooter}>
                  <Text style={styles.progDate}>
                    {formatDate(p.startDate)} → {formatDate(p.endDate)}
                  </Text>
                  {canManage && (
                    <View style={styles.progBtns}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setEditItem(p);
                          setForm({...defForm, ...p});
                          setShowForm(true);
                        }}>
                        <Icon name="pencil" size={13} color={COLORS.warning} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.delBtn}
                        onPress={() => handleDelete(p)}>
                        <Icon name="trash" size={13} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
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
              <EmptyState icon="📃" title="No programs found" />
            }
          />
        )}
        <ModalSheet
          visible={showForm}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
            setForm(defForm);
          }}
          title={editItem ? 'Edit Program' : 'Add Program'}>
          <FormGroup label="Program Name" required>
            <Input
              value={form.name}
              onChangeText={v => setForm(f => ({...f, name: v}))}
              placeholder="Program name"
            />
          </FormGroup>
          <FormGroup label="Category">
            <SelectField
              value={form.category}
              options={CATEGORIES}
              onChange={v => setForm(f => ({...f, category: v}))}
            />
          </FormGroup>
          <FormGroup label="Description">
            <Input
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              placeholder="Description..."
              multiline
              numberOfLines={3}
              style={{
                minHeight: 80,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
              }}
            />
          </FormGroup>
          <FormGroup label="Eligibility">
            <Input
              value={form.eligibility}
              onChangeText={v => setForm(f => ({...f, eligibility: v}))}
              placeholder="Who is eligible?"
            />
          </FormGroup>
          <FormGroup label="Benefits">
            <Input
              value={form.benefits}
              onChangeText={v => setForm(f => ({...f, benefits: v}))}
              placeholder="Key benefits..."
              multiline
              numberOfLines={2}
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
          <FormGroup label="Application Link">
            <Input
              value={form.applicationLink}
              onChangeText={v => setForm(f => ({...f, applicationLink: v}))}
              placeholder="https://..."
              autoCapitalize="none"
            />
          </FormGroup>
          <FormGroup label="Status">
            <SelectField
              value={form.status}
              options={['Active', 'Expired']}
              onChange={v => setForm(f => ({...f, status: v}))}
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
                ? 'Update Program'
                : 'Add Program'}
            </Text>
          </TouchableOpacity>
        </ModalSheet>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statsRow: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md},
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
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {...TYPOGRAPHY.labelSm, color: COLORS.gray600},
  filterChipTextActive: {color: COLORS.white},
  progCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  progHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  progName: {...TYPOGRAPHY.label, color: COLORS.gray800},
  progCat: {...TYPOGRAPHY.caption, color: COLORS.gray500, marginTop: 2},
  progDesc: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  progElig: {
    ...TYPOGRAPHY.caption,
    color: COLORS.info,
    marginBottom: SPACING.sm,
  },
  progFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progDate: {...TYPOGRAPHY.caption, color: COLORS.gray400},
  progBtns: {flexDirection: 'row', gap: SPACING.sm},
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
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  saveBtnText: {...TYPOGRAPHY.h5, color: COLORS.white},
});
