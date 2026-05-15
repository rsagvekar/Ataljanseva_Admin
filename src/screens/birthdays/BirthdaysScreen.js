import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, RefreshControl, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import votersService from '../../services/votersService';
import birthdayService from '../../services/birthdayService';
import { StatCard, EmptyState, LoadingSpinner, SearchBar, Avatar } from '../../components/common/UI';
import { ModalSheet } from '../../components/layout/ScreenWrapper';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';
import { formatDate } from '../../utils/formatters';

export default function BirthdaysScreen() {
  const { nagarsevakId } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [tab, setTab] = useState('birthdays');
  const [birthdayVoters, setBirthdayVoters] = useState([]);
  const [anniversaryVoters, setAnniversaryVoters] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!nagarsevakId) return;
    if (!isRefresh) setLoading(true);
    try {
      const [bRes, aRes, upRes] = await Promise.all([
        votersService.todayBirthdays({ nagarsevak_id: nagarsevakId }),
        votersService.todayAnniversaries({ nagarsevak_id: nagarsevakId }),
        votersService.upcomingBirthdays({ nagarsevak_id: nagarsevakId }),
      ]);
      setBirthdayVoters(Array.isArray(bRes) ? bRes : bRes.voters || []);
      setAnniversaryVoters(Array.isArray(aRes) ? aRes : aRes.voters || []);
      setUpcomingBirthdays(Array.isArray(upRes) ? upRes : upRes.voters || []);
    } catch (e) { console.error(e); }
    setLoading(false); setRefreshing(false);
  }, [nagarsevakId]);

  useEffect(() => { load(); }, [load]);

  const defaultBdayMsg = 'जन्मदिनाच्या हार्दिक शुभेच्छा {name}जी! 🎂 तुमचे दीर्घायुष्य आणि उत्तम आरोग्यासाठी प्रार्थना. - तुमचा नगरसेवक';
  const defaultAnnivMsg = 'वैवाहिक वर्धापनदिनाच्या हार्दिक शुभेच्छा {name}जी! 💍 सुखी दाम्पत्य जीवनासाठी शुभकामना. - तुमचा नगरसेवक';

  const sendWhatsApp = (voter, isBday) => {
    const template = isBday ? defaultBdayMsg : defaultAnnivMsg;
    const msg = birthdayService.buildMessage(template, voter);
    const mobile = voter.mobile?.replace(/\D/g, '');
    if (!mobile) { alert('No mobile number'); return; }
    Linking.openURL(`https://wa.me/91${mobile}?text=${encodeURIComponent(msg)}`);
  };

  const renderVoterCard = (voter, isBday) => (
    <View key={voter.id} style={styles.voterCard}>
      <Avatar name={voter.name} size={46} />
      <View style={styles.voterInfo}>
        <Text style={styles.voterName}>{voter.name}</Text>
        <Text style={styles.voterMeta}>{voter.mobile} {voter.ward ? `· Ward ${voter.ward}` : ''}</Text>
        <Text style={styles.voterDob}>{isBday ? `🎂 DOB: ${formatDate(voter.dob)}` : `💍 Anniv: ${formatDate(voter.anniversary)}`}</Text>
      </View>
      {voter.mobile && (
        <TouchableOpacity style={styles.waBtn} onPress={() => sendWhatsApp(voter, isBday)}>
          <Text style={{ fontSize: 20 }}>💬</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const currentList = tab === 'birthdays' ? birthdayVoters : tab === 'anniversaries' ? anniversaryVoters : upcomingBirthdays;

  return (
    <View style={[styles.container, { paddingHorizontal: padding }]}>
      <View style={[styles.statsRow, { paddingTop: padding }]}>
        <StatCard icon="🎂" label="Birthdays Today" value={birthdayVoters.length} color="#fce7f3" style={{ flex: 1 }} />
        <StatCard icon="💍" label="Anniversaries" value={anniversaryVoters.length} color="#dbeafe" style={{ flex: 1 }} />
        <StatCard icon="📅" label="Upcoming (7 days)" value={upcomingBirthdays.length} color="#fef3c7" style={{ flex: 1 }} />
      </View>

      <View style={styles.tabRow}>
        {[{ id: 'birthdays', label: '🎂 Today' }, { id: 'anniversaries', label: '💍 Anniversaries' }, { id: 'upcoming', label: '📅 Upcoming' }].map(t => (
          <TouchableOpacity key={t.id} style={[styles.tab, tab === t.id && styles.tabActive]} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <LoadingSpinner text="Loading..." full /> : (
        <FlatList
          data={currentList}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => renderVoterCard(item, tab !== 'anniversaries')}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'birthdays' ? '🎂' : tab === 'anniversaries' ? '💍' : '📅'}
              title={tab === 'birthdays' ? 'No birthdays today' : tab === 'anniversaries' ? 'No anniversaries today' : 'No upcoming birthdays'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: RADIUS.lg, padding: 4, marginBottom: SPACING.lg },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white, ...SHADOWS.sm },
  tabText: { ...TYPOGRAPHY.labelSm, color: COLORS.gray500 },
  tabTextActive: { color: COLORS.gray800 },
  voterCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, ...SHADOWS.sm },
  voterInfo: { flex: 1 },
  voterName: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  voterMeta: { ...TYPOGRAPHY.caption, color: COLORS.gray500, marginTop: 2 },
  voterDob: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginTop: 4 },
  waBtn: { width: 44, height: 44, backgroundColor: '#d1fae5', borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
});
