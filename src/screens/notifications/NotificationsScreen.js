import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import notificationsService from '../../services/notificationsService';
import {EmptyState, LoadingSpinner, FilterChips} from '../../components/common/UI';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatRelative} from '../../utils/formatters';

// Loose category → icon/color, purely presentational. Falls back to a
// generic bell for any type not listed here, so new notification sources
// don't need a frontend change to render reasonably.
const TYPE_META = {
  grievance: {icon: 'document-text', color: COLORS.info,    bg: COLORS.infoLight},
  sos:       {icon: 'warning',       color: COLORS.danger,  bg: COLORS.dangerLight},
  volunteer: {icon: 'people',        color: COLORS.purple,  bg: COLORS.purpleLight},
  event:     {icon: 'calendar',      color: COLORS.success, bg: COLORS.successLight},
  work:      {icon: 'construct',     color: COLORS.warning, bg: COLORS.warningLight},
  birthday:  {icon: 'gift',          color: '#DB2777',      bg: '#FCE7F3'},
  program:   {icon: 'megaphone',     color: COLORS.info,    bg: COLORS.infoLight},
  system:    {icon: 'notifications', color: COLORS.gray500, bg: COLORS.gray100},
};
const typeMeta = (t) => TYPE_META[t] || TYPE_META.system;

const FILTERS = ['All', 'Unread', 'Grievance', 'SOS', 'Volunteer', 'Event', 'Work', 'System'];

export default function NotificationsScreen({navigation}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params = {limit: 200};
      if (filter === 'Unread') params.is_read = false;
      else if (filter !== 'All') params.type = filter.toLowerCase();

      const res = await notificationsService.getAll(params);
      setItems(res?.notifications || []);
    } catch (e) {
      // Keep whatever was already on screen rather than wiping it on a
      // transient failure — just stop spinning.
    }
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationsService.markAllRead();
      setItems(prev => prev.map(n => ({...n, isRead: true})));
    } catch {}
  }, []);

  // Header "Mark all read" action — only shown when there's something to mark.
  useEffect(() => {
    const hasUnread = items.some(n => !n.isRead);
    navigation.setOptions({
      headerRight: hasUnread
        ? () => (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerAction}>
              <Text style={styles.headerActionText}>Mark all read</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, handleMarkAllRead, items]);

  const openItem = (item) => {
    if (!item.isRead) {
      setItems(prev => prev.map(n => (n.id === item.id ? {...n, isRead: true} : n)));
    }
    navigation.navigate('NotificationDetail', {id: item.id});
  };

  const renderItem = ({item}) => {
    const meta = typeMeta(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => openItem(item)}
        activeOpacity={0.7}>
        <View style={[styles.iconWrap, {backgroundColor: meta.bg}]}>
          <Icon name={meta.icon} size={20} color={meta.color} />
        </View>
        <View style={{flex: 1}}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, !item.isRead && styles.titleUnread]}
              numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.dot} />}
          </View>
          {item.body ? (
            <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          ) : null}
          <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
        </View>
        <Icon name="chevron-forward" size={18} color={COLORS.gray300} />
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." full />;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 40}}
        ListHeaderComponent={
          <FilterChips
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            style={{marginBottom: SPACING.lg}}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up" />
        }
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{height: SPACING.sm}} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  headerAction: {paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm},
  headerActionText: {...TYPOGRAPHY.labelSm, color: COLORS.white},

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  cardUnread: {
    borderColor: COLORS.primary + '33',
    backgroundColor: COLORS.primaryLight,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center'},
  title: {...TYPOGRAPHY.label, color: COLORS.gray700, flex: 1},
  titleUnread: {color: COLORS.gray900, fontWeight: '700'},
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginLeft: SPACING.sm,
  },
  body: {...TYPOGRAPHY.bodySm, color: COLORS.gray500, marginTop: 2},
  time: {...TYPOGRAPHY.tiny, color: COLORS.gray400, marginTop: SPACING.xs},
});