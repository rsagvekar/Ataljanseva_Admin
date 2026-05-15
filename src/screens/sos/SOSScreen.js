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
  Linking,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';
import {usePermissions} from '../../hooks/usePermissions';
import sosService from '../../services/sosService';
import {
  StatCard,
  StatusBadge,
  EmptyState,
  LoadingSpinner,
  FilterChips,
  SectionHeader,
} from '../../components/common/UI';
import {
  ModalSheet,
  FormGroup,
  Input,
  SelectField,
} from '../../components/layout/ScreenWrapper';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatDate, formatRelative} from '../../utils/formatters';
import ScreenHeader from '../../components/common/ScreenHeader';

const SOS_TYPES = ['Medical', 'Fire', 'Accident'];
const TYPE_INFO = {
  Medical: {icon: '🚑', color: '#fee2e2', text: '#991b1b', border: '#FCA5A5'},
  Fire: {icon: '🔥', color: '#fef3c7', text: '#92400e', border: '#FCD34D'},
  Accident: {icon: '🚗', color: '#dbeafe', text: '#1e40af', border: '#93C5FD'},
};

export default function SOSScreen() {
  const {nagarsevakId} = useAuth();
  const {can, PERMISSIONS} = usePermissions();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Active');
  const [viewItem, setViewItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    type: 'Medical',
    name: '',
    mobile: '',
    location: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canResolve = can(PERMISSIONS.RESOLVE_SOS);
  const canDelete = can(PERMISSIONS.DELETE_SOS);

  const showToast = (type, msg) => {
    setToast({type, msg});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(
    async (isRefresh = false) => {
      if (!nagarsevakId) return;
      if (!isRefresh) setLoading(true);
      try {
        const res = await sosService.getAll({
          nagarsevak_id: nagarsevakId,
          limit: 200,
        });
        setItems(Array.isArray(res) ? res : res.sos || []);
      } catch (e) {
        showToast('error', 'Failed to load SOS alerts.');
      }
      setLoading(false);
      setRefreshing(false);
    },
    [nagarsevakId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Auto refresh every 60s for SOS
  useEffect(() => {
    const timer = setInterval(() => load(true), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const handleResolve = s => {
    Alert.alert('Resolve SOS', `Mark this ${s.type} alert as resolved?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Resolve',
        style: 'default',
        onPress: async () => {
          try {
            await sosService.resolve(s.id);
            showToast('success', 'Alert resolved.');
            setViewItem(null);
            load(true);
          } catch (e) {
            showToast('error', e.message);
          }
        },
      },
    ]);
  };

  const handleDelete = s => {
    Alert.alert('Delete Alert', 'Delete this SOS alert?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await sosService.delete(s.id);
            showToast('success', 'Deleted.');
            load(true);
          } catch (e) {
            showToast('error', e.message);
          }
        },
      },
    ]);
  };

  const handleAddSOS = async () => {
    if (!form.name.trim() || !form.location.trim()) {
      showToast('error', 'Name and location are required.');
      return;
    }
    setSaving(true);
    try {
      await sosService.create({...form, nagarsevak_id: nagarsevakId});
      showToast('success', 'SOS alert created.');
      setShowAdd(false);
      setForm({
        type: 'Medical',
        name: '',
        mobile: '',
        location: '',
        description: '',
      });
      load(true);
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const filtered = items.filter(s => filter === 'All' || s.status === filter);

  const stats = {
    active: items.filter(s => s.status === 'Active').length,
    resolved: items.filter(s => s.status === 'Resolved').length,
    medical: items.filter(s => s.type === 'Medical' && s.status === 'Active')
      .length,
    fire: items.filter(s => s.type === 'Fire' && s.status === 'Active').length,
    accident: items.filter(s => s.type === 'Accident' && s.status === 'Active')
      .length,
  };

  const renderItem = ({item: s}) => {
    const t = TYPE_INFO[s.type] || TYPE_INFO.Medical;
    return (
      <TouchableOpacity
        style={[
          styles.sosCard,
          {backgroundColor: t.color, borderColor: t.border},
        ]}
        onPress={() => setViewItem(s)}
        activeOpacity={0.7}>
        <View style={styles.sosHeader}>
          <View style={styles.sosTypeRow}>
            <Text style={styles.sosEmoji}>{t.icon}</Text>
            <View>
              <Text style={[styles.sosType, {color: t.text}]}>
                {s.type} Emergency
              </Text>
              <Text style={[styles.sosTime, {color: t.text, opacity: 0.7}]}>
                {formatRelative(s.createdAt)}
              </Text>
            </View>
          </View>
          <StatusBadge status={s.status} />
        </View>
        <Text style={[styles.sosName, {color: t.text}]}>{s.name}</Text>
        {s.location && (
          <Text style={[styles.sosLocation, {color: t.text, opacity: 0.8}]}>
            📍 {s.location}
          </Text>
        )}
        <View style={styles.sosFooter}>
          {s.mobile && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${s.mobile}`)}>
              <Icon name="call" size={14} color={t.text} />
              <Text style={[styles.callBtnText, {color: t.text}]}>Call</Text>
            </TouchableOpacity>
          )}
          {s.status === 'Active' && canResolve && (
            <TouchableOpacity
              style={[styles.resolveBtn, {borderColor: t.text}]}
              onPress={() => handleResolve(s)}>
              <Icon name="checkmark-circle" size={14} color={t.text} />
              <Text style={[styles.callBtnText, {color: t.text}]}>Resolve</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={styles.delBtn}
              onPress={() => handleDelete(s)}>
              <Icon name="trash" size={14} color={COLORS.gray500} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScreenHeader
        title={`SOS Management`}
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
            {
              icon: '🆘',
              label: 'Active',
              value: stats.active,
              color: '#fee2e2',
            },
            {
              icon: '✅',
              label: 'Resolved',
              value: stats.resolved,
              color: '#d1fae5',
            },
            {
              icon: '🚑',
              label: 'Medical',
              value: stats.medical,
              color: '#fecaca',
            },
            {icon: '🔥', label: 'Fire', value: stats.fire, color: '#fef3c7'},
          ].map((s, i) => (
            <StatCard key={i} {...s} style={{flex: 1}} />
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <FilterChips
            options={['Active', 'Resolved', 'All']}
            value={filter}
            onChange={setFilter}
            style={{flex: 1}}
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}>
            <Icon name="add" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.count}>
          {filtered.length} alerts · Auto-refreshes every 60s
        </Text>

        {loading ? (
          <LoadingSpinner text="Loading SOS alerts..." full />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={s => s.id}
            renderItem={renderItem}
            numColumns={isTablet ? 2 : 1}
            scrollEnabled={false}
            key={isTablet ? 'tab' : 'phone'}
            columnWrapperStyle={isTablet ? {gap: SPACING.md} : undefined}
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
              <EmptyState
                icon={filter === 'Active' ? '✅' : '🆘'}
                title={
                  filter === 'Active' ? 'No active alerts' : 'No alerts found'
                }
                subtitle={
                  filter === 'Active'
                    ? 'All clear! No ongoing emergencies.'
                    : ''
                }
              />
            }
          />
        )}

        {/* Detail Modal */}
        <ModalSheet
          visible={!!viewItem}
          onClose={() => setViewItem(null)}
          title="SOS Alert Details">
          {viewItem &&
            (() => {
              const t = TYPE_INFO[viewItem.type] || TYPE_INFO.Medical;
              return (
                <View>
                  <View
                    style={[
                      styles.detailTypeBadge,
                      {backgroundColor: t.color, borderColor: t.border},
                    ]}>
                    <Text style={{fontSize: 32}}>{t.icon}</Text>
                    <View>
                      <Text style={[styles.detailTypeText, {color: t.text}]}>
                        {viewItem.type} Emergency
                      </Text>
                      <StatusBadge status={viewItem.status} />
                    </View>
                  </View>
                  {[
                    ['Reported By', viewItem.name],
                    ['Mobile', viewItem.mobile],
                    ['Location', viewItem.location],
                    ['Reported', formatDateTime(viewItem.createdAt)],
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
                      <Text style={styles.detailDesc}>
                        {viewItem.description}
                      </Text>
                    </>
                  ) : null}
                  <View style={{gap: SPACING.md, marginTop: SPACING.xl}}>
                    {viewItem.mobile && (
                      <TouchableOpacity
                        style={styles.callFullBtn}
                        onPress={() =>
                          Linking.openURL(`tel:${viewItem.mobile}`)
                        }>
                        <Icon name="call" size={18} color={COLORS.white} />
                        <Text style={styles.callFullBtnText}>
                          Call {viewItem.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {viewItem.status === 'Active' && canResolve && (
                      <TouchableOpacity
                        style={styles.resolveFullBtn}
                        onPress={() => handleResolve(viewItem)}>
                        <Icon
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.white}
                        />
                        <Text style={styles.callFullBtnText}>
                          Mark as Resolved
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })()}
        </ModalSheet>

        {/* Add SOS Modal */}
        <ModalSheet
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          title="Log SOS Alert">
          <FormGroup label="Emergency Type" required>
            <SelectField
              value={form.type}
              options={SOS_TYPES}
              onChange={v => setForm(f => ({...f, type: v}))}
            />
          </FormGroup>
          <FormGroup label="Reported By" required>
            <Input
              value={form.name}
              onChangeText={v => setForm(f => ({...f, name: v}))}
              placeholder="Name"
            />
          </FormGroup>
          <FormGroup label="Mobile">
            <Input
              value={form.mobile}
              onChangeText={v => setForm(f => ({...f, mobile: v}))}
              placeholder="Mobile number"
              keyboardType="phone-pad"
            />
          </FormGroup>
          <FormGroup label="Location" required>
            <Input
              value={form.location}
              onChangeText={v => setForm(f => ({...f, location: v}))}
              placeholder="Exact location / address"
              multiline
              numberOfLines={2}
            />
          </FormGroup>
          <FormGroup label="Description">
            <Input
              value={form.description}
              onChangeText={v => setForm(f => ({...f, description: v}))}
              placeholder="Additional details..."
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
            style={[styles.addSOSBtn, saving && {opacity: 0.6}]}
            onPress={handleAddSOS}
            disabled={saving}>
            <Text style={styles.addSOSBtnText}>
              {saving ? 'Saving...' : '🆘 Log SOS Alert'}
            </Text>
          </TouchableOpacity>
        </ModalSheet>
        </ScrollView>
      </View>
    </>
  );
}

const formatDateTime = d => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
    backgroundColor: COLORS.danger,
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
  sosCard: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sosTypeRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  sosEmoji: {fontSize: 28},
  sosType: {...TYPOGRAPHY.h5},
  sosTime: {...TYPOGRAPHY.caption},
  sosName: {...TYPOGRAPHY.label, marginBottom: 4},
  sosLocation: {...TYPOGRAPHY.bodySm, marginBottom: SPACING.sm},
  sosFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  callBtnText: {...TYPOGRAPHY.labelSm},
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  delBtn: {marginLeft: 'auto', padding: 6},
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
  detailTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  detailTypeText: {...TYPOGRAPHY.h4, marginBottom: 4},
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
  callFullBtn: {
    backgroundColor: COLORS.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  resolveFullBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  callFullBtnText: {...TYPOGRAPHY.h5, color: COLORS.white},
  addSOSBtn: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  addSOSBtnText: {...TYPOGRAPHY.h5, color: COLORS.white},
});
