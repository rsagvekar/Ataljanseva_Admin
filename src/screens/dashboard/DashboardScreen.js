import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';
import {usePermissions} from '../../hooks/usePermissions';
import dashboardService from '../../services/dashboardService';
import notificationsService from '../../services/notificationsService';
import {
  StatCard,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  Card,
  SectionHeader,
} from '../../components/common/UI';
import {COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS} from '../../config/theme';
import {formatDate, formatRelative} from '../../utils/formatters';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function DashboardScreen({navigation}) {
  const {user, nagarsevakId} = useAuth();
  const {role, isSuperAdmin, isAdmin} = usePermissions();
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ── Breakpoints ────────────────────────────────────────────────────────────
  const isTablet = width >= 600;
  const cols = width >= 1200 ? 4 : width >= 768 ? 3 : width >= 480 ? 2 : 2;
  const padding = isTablet ? 20 : 16;

  // Card width: total padding on both sides + gap between cards
  // gap * (cols - 1) spread across cols cards
  const gridGap = SPACING.md ?? 12;
  const GRID_MARGIN = 8; // space between cards (adjust to match SPACING.md)
  const cardWidth = (width - padding * 2 - GRID_MARGIN * (cols - 1)) / cols;
  // cols === 1
  //   ? width - padding * 2
  //   : (width - padding * 2 - GRID_MARGIN * (cols - 1)) / cols;

  console.log('cardWidth', cardWidth);

  const [stats, setStats] = useState(null);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [recentSOS, setRecentSOS] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // NEW — feeds the bell icon's badge. Polled the same way the tab bar
  // already polls the SOS count (see AdminTabNavigator.js), so a
  // notification created while the admin is sitting on this screen still
  // shows up within a minute without needing a manual refresh.
  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationsService.getUnreadCount();
      setUnreadCount(res?.total || 0);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchUnread();
    const timer = setInterval(fetchUnread, 60_000);
    return () => clearInterval(timer);
  }, [fetchUnread]);

  // Also refresh immediately on focus — covers coming back from the
  // Notifications screen after reading some, without waiting for the poll.
  useFocusEffect(
    useCallback(() => { fetchUnread(); }, [fetchUnread])
  );

  // ── Data load ──────────────────────────────────────────────────────────────
  const load = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const d = await dashboardService.getSummary({
          nagarsevak_id: nagarsevakId,
        });
        setStats({
          voters: parseInt(d.voters?.total || 0),
          supporters: parseInt(d.voters?.supporters || 0),
          grievances: parseInt(d.grievances?.total || 0),
          pending: parseInt(d.grievances?.pending || 0),
          resolved: parseInt(d.grievances?.resolved || 0),
          works: parseInt(d.works?.total || 0),
          volunteers: parseInt(d.volunteers?.total || 0),
          events: parseInt(d.events?.total || 0),
          surveys: parseInt(d.surveys?.total || 0),
          sos: parseInt(d.sos?.active || 0),
        });
        setRecentGrievances(d.recentGrievances || []);
        setRecentSOS(d.recentSOS || []);
      } catch (e) {
        console.error('Dashboard load error:', e);
      }
      setLoading(false);
      setRefreshing(false);
    },
    [nagarsevakId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  // ── Stat card definitions ─────────────────────────────────────────────────
  const STAT_CARDS = stats
    ? [
        {
          icon: '🗳️',
          label: 'Total Voters',
          value: stats.voters,
          color: '#dbeafe',
          change: `${stats.supporters} supporters`,
        },
        {
          icon: '📋',
          label: 'Grievances',
          value: stats.grievances,
          color: '#fef3c7',
          change: `${stats.pending} pending`,
        },
        {
          icon: '✅',
          label: 'Resolved',
          value: stats.resolved,
          color: '#d1fae5',
        },
        {icon: '🏗️', label: 'Works', value: stats.works, color: '#e0f2fe'},
        {
          icon: '🤝',
          label: 'Volunteers',
          value: stats.volunteers,
          color: '#ede9fe',
        },
        {icon: '📅', label: 'Events', value: stats.events, color: '#fce7f3'},
        // {icon: '📊', label: 'Surveys', value: stats.surveys, color: '#ecfdf5'},
        {icon: '🆘', label: 'Active SOS', value: stats.sos, color: '#fee2e2'},
      ]
    : [];

  if (loading) return <LoadingSpinner text="Loading dashboard..." full />;

  // ── Supporter % for progress bar ──────────────────────────────────────────
  const supporterPct = stats?.voters
    ? Math.round((stats.supporters / stats.voters) * 100)
    : 0;

  return (
    <>
      <ScreenHeader
        title={`Welcome ${user?.name || 'Admin'}`}
        subtitle={formatDate(new Date())}
        rightIcon="notifications-outline"
        onRightPress={() => navigation.navigate('Notifications')}
        badgeCount={unreadCount}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingHorizontal: padding,
          paddingBottom: 100,
          paddingTop: SPACING.lg,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }>
        {/* ── Stats Grid ────────────────────────────────────────────────────── */}
        {stats && (
          <>
            {/* <SectionHeader
              title="Overview"
              subtitle="Live statistics from your portal"
            /> */}
            <View
              style={[
                styles.statsGrid,
                {
                  marginBottom: SPACING.xl,
                },
              ]}>
              {STAT_CARDS.map((s, i) => {
                const isLastInRow = (i + 1) % cols === 0;

                return (
                  <StatCard
                    key={i}
                    icon={s.icon}
                    label={s.label}
                    value={s.value}
                    color={s.color}
                    change={s.change}
                    style={{
                      width: cardWidth,
                      marginRight: isLastInRow ? 0 : GRID_MARGIN,
                      marginBottom: GRID_MARGIN,
                    }}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* ── Two-column on tablet / single on phone ─────────────────────── */}
        <View style={[styles.row, isTablet && {gap: SPACING.lg}]}>
          {/* Recent Grievances */}
          <Card style={[styles.sectionCard, isTablet && {flex: 1}]}>
            <SectionHeader
              title="📋 Recent Grievances"
              subtitle={`${stats?.pending || 0} pending`}
              action={() => navigation?.navigate?.('Grievances')}
              actionLabel="View All →"
            />
            {recentGrievances.length === 0 ? (
              <EmptyState icon="📋" title="No grievances yet" />
            ) : (
              recentGrievances.slice(0, 5).map(g => (
                <View key={g.id} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <Text style={styles.ticketId}>{g.ticketId || '—'}</Text>
                    <Text style={styles.listItemName} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={styles.listItemSub} numberOfLines={1}>
                      {g.category} · {formatRelative(g.createdAt)}
                    </Text>
                  </View>
                  <StatusBadge status={g.status} />
                </View>
              ))
            )}
          </Card>

          {/* Tablet right column */}
          {isTablet && (
            <View style={{flex: 1, gap: SPACING.lg}}>
              {/* SOS Alerts */}
              <Card style={styles.sectionCard}>
                <SectionHeader title="🆘 SOS Alerts" />
                {recentSOS.length === 0 ? (
                  <EmptyState icon="🆘" title="No active SOS" />
                ) : (
                  recentSOS.slice(0, 3).map(s => (
                    <View key={s.id} style={styles.sosItem}>
                      <Text style={styles.sosEmoji}>
                        {s.type === 'Medical'
                          ? '🚑'
                          : s.type === 'Fire'
                          ? '🔥'
                          : '🚗'}
                      </Text>
                      <View style={{flex: 1}}>
                        <Text style={styles.sosItemTitle}>
                          {s.type} Emergency
                        </Text>
                        <Text style={styles.sosItemSub} numberOfLines={1}>
                          {s.location || s.name}
                        </Text>
                      </View>
                      <StatusBadge status={s.status} />
                    </View>
                  ))
                )}
              </Card>

              {/* Voter Breakdown */}
              {(isSuperAdmin || isAdmin) && stats && (
                <Card style={styles.sectionCard}>
                  <SectionHeader title="🗳️ Voter Breakdown" />
                  <View style={styles.voterTagRow}>
                    {['Supporter', 'Neutral', 'Opponent', 'Influencer'].map(
                      t => (
                        <View key={t} style={styles.voterTag}>
                          <Text style={styles.voterTagText}>{t}</Text>
                        </View>
                      ),
                    )}
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Supporters</Text>
                    <Text style={styles.progressPct}>{supporterPct}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, {width: `${supporterPct}%`}]}
                    />
                  </View>
                </Card>
              )}
            </View>
          )}
        </View>

        {/* ── SOS section on phone ──────────────────────────────────────────── */}
        {!isTablet && recentSOS.length > 0 && (
          <Card style={[styles.sectionCard, {marginTop: SPACING.lg}]}>
            <SectionHeader title="🆘 Recent SOS Alerts" />
            {recentSOS.slice(0, 3).map(s => (
              <View key={s.id} style={styles.sosItem}>
                <Text style={styles.sosEmoji}>
                  {s.type === 'Medical'
                    ? '🚑'
                    : s.type === 'Fire'
                    ? '🔥'
                    : '🚗'}
                </Text>
                <View style={{flex: 1}}>
                  <Text style={styles.sosItemTitle}>{s.type} Emergency</Text>
                  <Text style={styles.sosItemSub} numberOfLines={1}>
                    {s.location || s.name}
                  </Text>
                </View>
                <StatusBadge status={s.status} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  // ── Welcome card ────────────────────────────────────────────────────────
  welcomeCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  welcomeLeft: {flex: 1, marginRight: SPACING.md},
  welcomeGreet: {
    ...TYPOGRAPHY.bodySm,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 2,
  },
  welcomeName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roleText: {...TYPOGRAPHY.labelSm, color: COLORS.white},
  welcomeRight: {alignItems: 'flex-end', gap: 4},
  welcomeDateLabel: {...TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.5)'},
  welcomeDate: {...TYPOGRAPHY.label, color: COLORS.white},
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  sosText: {...TYPOGRAPHY.caption, color: COLORS.danger, fontWeight: '600'},

  // ── Stats grid ──────────────────────────────────────────────────────────
  // gap is set inline so the pixel cardWidth calculation stays in sync
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  // ── Section layout ──────────────────────────────────────────────────────
  row: {flexDirection: 'row', flexWrap: 'wrap'},
  sectionCard: {marginBottom: SPACING.lg},

  // ── Grievance list item ─────────────────────────────────────────────────
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  listItemLeft: {flex: 1, minWidth: 0}, // minWidth:0 lets flex child shrink + truncate text
  ticketId: {
    ...TYPOGRAPHY.mono,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginBottom: 2,
    color: COLORS.gray700,
  },
  listItemName: {...TYPOGRAPHY.label, color: COLORS.gray800},
  listItemSub: {...TYPOGRAPHY.caption, color: COLORS.gray500, marginTop: 2},

  // ── SOS item ────────────────────────────────────────────────────────────
  sosItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sosEmoji: {fontSize: 22},
  sosItemTitle: {...TYPOGRAPHY.label, color: COLORS.gray800},
  sosItemSub: {...TYPOGRAPHY.caption, color: COLORS.gray500},

  // ── Voter breakdown ─────────────────────────────────────────────────────
  voterTagRow: {
    // replaces invalid inline-flex on individual tags
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  voterTag: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  voterTagText: {...TYPOGRAPHY.labelSm, color: COLORS.gray600},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: '600',
    color: COLORS.gray700,
  },
  progressPct: {...TYPOGRAPHY.bodySm, color: COLORS.gray500},
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
  },
});