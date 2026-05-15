import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';
import {usePermissions} from '../../hooks/usePermissions';
import grievancesService from '../../services/grievancesService';
import volunteersService from '../../services/volunteersService';
import {
  StatCard,
  StatusBadge,
  SearchBar,
  EmptyState,
  LoadingSpinner,
  Card,
  FilterChips,
  PrimaryButton,
  SectionHeader,
} from '../../components/common/UI';
import {
  FormGroup,
  Input,
  SelectField,
  ModalSheet,
} from '../../components/layout/ScreenWrapper';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatDate, truncate} from '../../utils/formatters';
import ScreenHeader from '../../components/common/ScreenHeader';

const CATEGORIES = [
  'Water',
  'Road',
  'Drainage',
  'Garbage',
  'Streetlight',
  'Health',
  'Electricity',
  'Building',
  'Other',
];
const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const CAT_EMOJI = {
  Water: '💧',
  Road: '🛣️',
  Drainage: '🌊',
  Garbage: '🗑️',
  Streetlight: '💡',
  Health: '🏥',
  Electricity: '⚡',
  Building: '🏢',
  Other: '📌',
};

const defaultForm = {
  name: '',
  mobile: '',
  category: 'Water',
  description: '',
  address: '',
  status: 'Pending',
  assignedTo: '',
  resolutionNote: '',
  photoUrl: '',
  ward: '',
};

export default function GrievancesScreen({navigation}) {
  const {nagarsevakId} = useAuth();
  const {can, PERMISSIONS, role} = usePermissions();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;

  const [items, setItems] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCat, setFilterCat] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canCreate = can(PERMISSIONS.CREATE_GRIEVANCE);
  const canAssign = can(PERMISSIONS.ASSIGN_GRIEVANCE);
  const canDelete = can(PERMISSIONS.DELETE_GRIEVANCE);
  const canUpdateStatus = can(PERMISSIONS.UPDATE_GRIEVANCE_STATUS);

  const showToast = (type, msg) => {
    setToast({type, msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(
    async (isRefresh = false) => {
      if (!nagarsevakId) return;
      if (!isRefresh) setLoading(true);
      try {
        const params = {nagarsevak_id: nagarsevakId, limit: 500};
        // Volunteers can only see assigned grievances
        if (role === 'volunteer') params.assignedTo = 'me'; // adjust based on your API

        const [gRes, vRes] = await Promise.all([
          grievancesService.getAll(params),
          volunteersService.getAll({
            status: 'Active',
            limit: 200,
            nagarsevak_id: nagarsevakId,
          }),
        ]);
        setItems(gRes.grievances || []);
        setVolunteers(vRes.volunteers || []);
      } catch (e) {
        showToast('error', 'Failed to load grievances.');
      }
      setLoading(false);
      setRefreshing(false);
    },
    [nagarsevakId, role],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      showToast('error', 'Name and description are required.');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await grievancesService.update(editItem.id, form);
        showToast('success', 'Grievance updated!');
      } else {
        await grievancesService.submit({...form, nagarsevak_id: nagarsevakId});
        showToast('success', 'Grievance added!');
      }
      setShowForm(false);
      setEditItem(null);
      setForm(defaultForm);
      load(true);
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const handleQuickStatus = async (g, status) => {
    try {
      await grievancesService.updateStatus(g.id, status);
      setItems(prev => prev.map(x => (x.id === g.id ? {...x, status} : x)));
      showToast('success', 'Status updated.');
    } catch (e) {
      showToast('error', e.message);
    }
  };

  const handleDelete = g => {
    Alert.alert(
      'Delete Grievance',
      `Are you sure you want to delete this grievance from ${g.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await grievancesService.delete(g.id);
              showToast('success', 'Grievance deleted.');
              load(true);
            } catch (e) {
              showToast('error', e.message);
            }
          },
        },
      ],
    );
  };

  const openAdd = () => {
    setEditItem(null);
    setForm(defaultForm);
    setShowForm(true);
  };
  const openEdit = g => {
    setEditItem(g);
    setForm({...defaultForm, ...g});
    setShowForm(true);
  };

  const filtered = items.filter(g => {
    const s = search.toLowerCase();
    return (
      (!s ||
        g.name?.toLowerCase().includes(s) ||
        g.ticketId?.toLowerCase().includes(s) ||
        g.mobile?.includes(s)) &&
      (filterStatus === 'All' || g.status === filterStatus) &&
      (filterCat === 'All' || g.category === filterCat)
    );
  });

  const stats = {
    total: items.length,
    pending: items.filter(g => g.status === 'Pending').length,
    inProgress: items.filter(g => g.status === 'In Progress').length,
    resolved: items.filter(g => g.status === 'Resolved').length,
  };

  const padding = isTablet ? 20 : 16;
  const numCols = width >= 900 ? 4 : isTablet ? 3 : 2;

  const renderItem = ({item: g}) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => setViewItem(g)}
      activeOpacity={0.7}>
      <View style={styles.itemHeader}>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketId}>{g.ticketId || '—'}</Text>
          <StatusBadge status={g.status} />
        </View>
        <Text style={styles.itemName}>{g.name}</Text>
        <Text style={styles.itemMobile}>{g.mobile}</Text>
      </View>
      <View style={styles.itemMeta}>
        <Text style={styles.catBadge}>
          {CAT_EMOJI[g.category] || '📌'} {g.category}
        </Text>
        {g.ward ? <Text style={styles.ward}>Ward {g.ward}</Text> : null}
      </View>
      <Text style={styles.desc} numberOfLines={2}>
        {g.description}
      </Text>
      <View style={styles.itemFooter}>
        <Text style={styles.date}>{formatDate(g.createdAt)}</Text>
        <View style={styles.actions}>
          {canUpdateStatus && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.infoLight}]}
              onPress={() => {
                const next =
                  g.status === 'Pending'
                    ? 'In Progress'
                    : g.status === 'In Progress'
                    ? 'Resolved'
                    : 'Pending';
                handleQuickStatus(g, next);
              }}>
              <Icon name="refresh" size={14} color={COLORS.info} />
            </TouchableOpacity>
          )}
          {canCreate && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.warningLight}]}
              onPress={() => openEdit(g)}>
              <Icon name="pencil" size={14} color={COLORS.warning} />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: COLORS.dangerLight}]}
              onPress={() => handleDelete(g)}>
              <Icon name="trash" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <ScreenHeader
        title={`Grievance Management`}
        subtitle={formatDate(new Date())}
        rightIcon="notifications-outline"
      />
      <View style={[styles.container, {paddingHorizontal: padding}]}>
        {/* Toast */}
        {toast && (
          <View
            style={[
              styles.toast,
              toast.type === 'error' ? styles.toastError : styles.toastSuccess,
            ]}>
            <Icon
              name={
                toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'
              }
              size={16}
              color="#fff"
            />
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
              {
                icon: '📋',
                label: 'Total',
                value: stats.total,
                color: '#dbeafe',
              },
              {
                icon: '⏳',
                label: 'Pending',
                value: stats.pending,
                color: '#fef3c7',
              },
              {
                icon: '🔄',
                label: 'In Progress',
                value: stats.inProgress,
                color: '#e0f2fe',
              },
              {
                icon: '✅',
                label: 'Resolved',
                value: stats.resolved,
                color: '#d1fae5',
              },
            ].map((s, i) => (
              <StatCard key={i} {...s} />
            ))}
          </ScrollView>

          {/* Search & Filters */}
          <View style={styles.filterRow}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Name, ticket, mobile..."
              style={{flex: 1}}
            />
            {canCreate && (
              <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
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
          <FilterChips
            options={['All', ...CATEGORIES]}
            value={filterCat}
            onChange={setFilterCat}
            style={{marginBottom: SPACING.md}}
          />

          <Text style={styles.count}>
            {filtered.length} of {items.length} grievances
          </Text>

          {/* List */}
          {loading ? (
            <LoadingSpinner text="Loading grievances..." full />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={g => g.id}
              renderItem={renderItem}
              scrollEnabled={false}
              numColumns={isTablet ? 2 : 1}
              key={isTablet ? 'tab' : 'phone'}
              columnWrapperStyle={isTablet ? {gap: SPACING.md} : undefined}
              ItemSeparatorComponent={() => (
                <View style={{height: SPACING.md}} />
              )}
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
                <EmptyState
                  icon="📋"
                  title="No grievances found"
                  subtitle="Try adjusting your filters."
                />
              }
            />
          )}
        </ScrollView>
        {/* Detail Modal */}
        <ModalSheet
          visible={!!viewItem}
          onClose={() => setViewItem(null)}
          title="Grievance Details">
          {viewItem && (
            <View>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTicket}>{viewItem.ticketId}</Text>
                <StatusBadge status={viewItem.status} />
              </View>
              {[
                ['Citizen', viewItem.name],
                ['Mobile', viewItem.mobile],
                [
                  'Category',
                  `${CAT_EMOJI[viewItem.category] || ''} ${viewItem.category}`,
                ],
                ['Ward', viewItem.ward],
                ['Address', viewItem.address],
                ['Assigned To', viewItem.assignedTo],
                ['Date', formatDate(viewItem.createdAt)],
              ].map(([k, v]) =>
                v ? (
                  <View key={k} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{k}</Text>
                    <Text style={styles.detailVal}>{v}</Text>
                  </View>
                ) : null,
              )}
              <Text style={styles.detailDescLabel}>Description</Text>
              <Text style={styles.detailDesc}>{viewItem.description}</Text>
              {viewItem.resolutionNote ? (
                <>
                  <Text style={styles.detailDescLabel}>Resolution Note</Text>
                  <Text style={styles.detailDesc}>
                    {viewItem.resolutionNote}
                  </Text>
                </>
              ) : null}
              {viewItem.photoUrl ? (
                <Image
                  source={{uri: viewItem.photoUrl}}
                  style={styles.detailPhoto}
                  resizeMode="cover"
                />
              ) : null}
              {canUpdateStatus && (
                <View style={{marginTop: SPACING.xl, gap: SPACING.md}}>
                  {STATUSES.filter(s => s !== viewItem.status).map(s => (
                    <PrimaryButton
                      key={s}
                      title={`Mark as ${s}`}
                      variant={s === 'Resolved' ? 'primary' : 'outline'}
                      onPress={() => {
                        handleQuickStatus(viewItem, s);
                        setViewItem(null);
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </ModalSheet>

        {/* Form Modal */}
        <ModalSheet
          visible={showForm}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
            setForm(defaultForm);
          }}
          title={editItem ? 'Edit Grievance' : 'Add Grievance'}>
          <FormGroup label="Citizen Name" required>
            <Input
              value={form.name}
              onChangeText={v => setForm(f => ({...f, name: v}))}
              placeholder="Full name"
            />
          </FormGroup>
          <FormGroup label="Mobile Number">
            <Input
              value={form.mobile}
              onChangeText={v => setForm(f => ({...f, mobile: v}))}
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
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
          <FormGroup label="Category" required>
            <SelectField
              value={form.category}
              options={CATEGORIES}
              onChange={v => setForm(f => ({...f, category: v}))}
            />
          </FormGroup>
          <FormGroup label="Address">
            <Input
              value={form.address}
              onChangeText={v => setForm(f => ({...f, address: v}))}
              placeholder="Location/address"
              multiline
              numberOfLines={2}
            />
          </FormGroup>
          <FormGroup label="Description" required>
            <Input
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              placeholder="Describe the issue..."
              multiline
              numberOfLines={4}
              style={{
                minHeight: 100,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
              }}
            />
          </FormGroup>
          {canAssign && volunteers.length > 0 && (
            <FormGroup label="Assign To">
              <SelectField
                value={form.assignedTo}
                options={[
                  {label: '— None —', value: ''},
                  ...volunteers.map(v => ({label: v.name, value: v.name})),
                ]}
                onChange={v => setForm(f => ({...f, assignedTo: v}))}
              />
            </FormGroup>
          )}
          <FormGroup label="Status">
            <SelectField
              value={form.status}
              options={STATUSES}
              onChange={v => setForm(f => ({...f, status: v}))}
            />
          </FormGroup>
          <FormGroup label="Resolution Note">
            <Input
              value={form.resolutionNote}
              onChangeText={v => setForm(f => ({...f, resolutionNote: v}))}
              placeholder="Optional resolution details..."
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
            title={editItem ? 'Update Grievance' : 'Add Grievance'}
            onPress={handleSave}
            loading={saving}
            style={{marginTop: SPACING.md}}
          />
        </ModalSheet>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  statsGrid: {flexDirection: 'row', marginBottom: SPACING.md, height: 160},
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
  itemHeader: {marginBottom: SPACING.sm},
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ticketId: {
    ...TYPOGRAPHY.mono,
    color: COLORS.gray600,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemName: {...TYPOGRAPHY.label, color: COLORS.gray800},
  itemMobile: {...TYPOGRAPHY.caption, color: COLORS.gray500},
  itemMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  catBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ward: {
    ...TYPOGRAPHY.caption,
    color: COLORS.info,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  desc: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {...TYPOGRAPHY.caption, color: COLORS.gray400},
  actions: {flexDirection: 'row', gap: SPACING.sm},
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detail Modal
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  detailTicket: {
    ...TYPOGRAPHY.mono,
    fontSize: 14,
    color: COLORS.gray700,
    backgroundColor: COLORS.gray100,
    padding: 6,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailKey: {...TYPOGRAPHY.bodySm, color: COLORS.gray500},
  detailVal: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.gray800,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailDescLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray600,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  detailDesc: {...TYPOGRAPHY.body, color: COLORS.gray700, lineHeight: 22},
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    zIndex: 999,
    ...SHADOWS.lg,
  },
  toastSuccess: {backgroundColor: COLORS.success},
  toastError: {backgroundColor: COLORS.danger},
  toastText: {...TYPOGRAPHY.label, color: COLORS.white, flex: 1},
});
