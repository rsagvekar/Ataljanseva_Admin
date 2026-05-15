import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../config/theme';
import { ROLES } from '../config/permissions';

// ── Screens ───────────────────────────────────────────────────────────────────
import DashboardScreen     from '../screens/dashboard/DashboardScreen';
import GrievancesScreen    from '../screens/grievances/GrievancesScreen';
import WorksScreen         from '../screens/works/WorksScreen';
import VolunteersScreen    from '../screens/volunteers/VolunteersScreen';
import SOSScreen           from '../screens/sos/SOSScreen';
import VotersScreen        from '../screens/voters/VotersScreen';
import EventsScreen        from '../screens/events/EventsScreen';
import ScheduleScreen      from '../screens/schedule/ScheduleScreen';
import CommunicationScreen from '../screens/communication/CommunicationScreen';
import ProgramsScreen      from '../screens/programs/ProgramsScreen';
import BirthdaysScreen     from '../screens/birthdays/BirthdaysScreen';
import UserManagementScreen from '../screens/users/UserManagementScreen';
import SettingsScreen      from '../screens/settings/SettingsScreen';
import MoreScreen          from '../screens/more/MoreScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const sharedStackOptions = {
  headerStyle:        { backgroundColor: COLORS.secondary, elevation: 0, shadowOpacity: 0 },
  headerTintColor:    COLORS.white,
  headerTitleStyle:   { ...TYPOGRAPHY.h4, color: COLORS.white },
  headerBackTitleVisible: false,
};

// ── Stack builders ─────────────────────────────────────────────────────────────
const makeStack = (MainScreen, mainName, mainTitle) => () => (
  <Stack.Navigator screenOptions={sharedStackOptions}>
    <Stack.Screen name={mainName} component={MainScreen} options={{ title: mainTitle, headerShown: false }} />
  </Stack.Navigator>
);

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen name="MoreHome"      component={MoreScreen}           options={{ headerShown: false }} />
      <Stack.Screen name="Voters"        component={VotersScreen}          options={{ title: 'Voter Management' }} />
      <Stack.Screen name="Events"        component={EventsScreen}          options={{ title: 'Events & Campaigns' }} />
      <Stack.Screen name="Schedule"      component={ScheduleScreen}        options={{ title: 'Schedule Management' }} />
      <Stack.Screen name="Communication" component={CommunicationScreen}   options={{ title: 'Bulk Communication' }} />
      <Stack.Screen name="Programs"      component={ProgramsScreen}        options={{ title: 'Programs & Services' }} />
      <Stack.Screen name="Birthdays"     component={BirthdaysScreen}       options={{ title: 'Birthdays & Anniversaries' }} />
      <Stack.Screen name="Users"         component={UserManagementScreen}  options={{ title: 'User Management' }} />
      <Stack.Screen name="Settings"      component={SettingsScreen}        options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

const DashboardStack  = makeStack(DashboardScreen,  'DashHome',       'Dashboard');
const GrievancesStack = makeStack(GrievancesScreen, 'GrievList',      'Grievances');
const WorksStack      = makeStack(WorksScreen,      'WorksList',      'Jan Vikas');
const VolunteersStack = makeStack(VolunteersScreen, 'VolunteersList', 'Volunteers');
const SOSStack        = makeStack(SOSScreen,        'SOSList',        'SOS Alerts');

// ── Custom tab bar ────────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation, sosCount }) {
  const insets   = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  return (
    <View style={[
      styles.tabBar,
      { paddingBottom: insets.bottom || SPACING.sm },
      isTablet && { paddingHorizontal: 40 },
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused     = state.index === index;
        const label       = options.tabBarLabel ?? options.title ?? route.name;

        const iconName = {
          Dashboard:  focused ? 'grid'          : 'grid-outline',
          Grievances: focused ? 'document-text' : 'document-text-outline',
          Works:      focused ? 'construct'     : 'construct-outline',
          Volunteers: focused ? 'people'        : 'people-outline',
          SOS:        focused ? 'warning'       : 'warning-outline',
          More:       focused ? 'menu'          : 'menu-outline',
        }[route.name] || 'ellipse-outline';

        const iconColor = route.name === 'SOS'
          ? (focused ? '#DC2626' : COLORS.gray400)
          : (focused ? COLORS.primary : COLORS.gray400);

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tabItem, focused && styles.tabItemFocused]}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <Icon name={iconName} size={24} color={iconColor} />
              {route.name === 'SOS' && sosCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{sosCount > 9 ? '9+' : sosCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, focused && { color: route.name === 'SOS' ? '#DC2626' : COLORS.primary, fontWeight: '700' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main navigator ─────────────────────────────────────────────────────────────
export default function AdminTabNavigator() {
  const { role }        = usePermissions();
  const { nagarsevakId }= useAuth();
  const [sosCount, setSosCount] = React.useState(0);
  const isVolunteer     = role === ROLES.VOLUNTEER;

  React.useEffect(() => {
    if (!nagarsevakId) return;
    const fetchSOS = async () => {
      try {
        const sosService = require('../services/sosService').default;
        const res = await sosService.getAll({ nagarsevak_id: nagarsevakId, status: 'Active' });
        const list = Array.isArray(res) ? res : res?.sos || [];
        setSosCount(list.filter((s) => s.status === 'Active').length);
      } catch {}
    };
    fetchSOS();
    const timer = setInterval(fetchSOS, 60_000);
    return () => clearInterval(timer);
  }, [nagarsevakId]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} sosCount={sosCount} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard"  component={DashboardStack}  options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Grievances" component={GrievancesStack} options={{ title: 'Grievances' }} />
      {!isVolunteer && <Tab.Screen name="Works"      component={WorksStack}      options={{ title: 'Jan Vikas' }} />}
      {!isVolunteer && <Tab.Screen name="Volunteers" component={VolunteersStack} options={{ title: 'Volunteers' }} />}
      {!isVolunteer && <Tab.Screen name="SOS"        component={SOSStack}        options={{ title: 'SOS' }} />}
      <Tab.Screen name="More" component={MoreStack} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.lg,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: SPACING.sm, minHeight: 56,
  },
  tabItemFocused: {},
  tabIconWrap: { position: 'relative' },
  tabLabel:    { ...TYPOGRAPHY.tiny, color: COLORS.gray400, marginTop: 3, fontWeight: '500' },
  badge: {
    position: 'absolute', top: -5, right: -10,
    backgroundColor: COLORS.danger, borderRadius: 9,
    minWidth: 17, height: 17,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
});
