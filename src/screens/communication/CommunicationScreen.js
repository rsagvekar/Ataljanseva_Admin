import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';
import {usePermissions} from '../../hooks/usePermissions';
import communicationService from '../../services/communicationService';
import {
  StatCard,
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

const defTemplate = {name: '', type: 'General', message: ''};
const TYPES = ['General', 'Birthday', 'Anniversary', 'Event', 'Alert', 'Other'];

export default function CommunicationScreen() {
  const {nagarsevakId} = useAuth();
  const {can, PERMISSIONS} = usePermissions();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;
  const padding = isTablet ? 20 : 16;

  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defTemplate);
  const [sendForm, setSendForm] = useState({
    templateId: '',
    recipients: 'all',
    message: '',
    channel: 'whatsapp',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const canSend = can(PERMISSIONS.SEND_BULK_MESSAGE);
  const showToast = (t, m) => {
    setToast({type: t, msg: m});
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, lRes] = await Promise.all([
        communicationService.getTemplates({nagarsevak_id: nagarsevakId}),
        communicationService.getLogs({nagarsevak_id: nagarsevakId, limit: 100}),
      ]);
      setTemplates(Array.isArray(tRes) ? tRes : tRes.templates || []);
      setLogs(Array.isArray(lRes) ? lRes : lRes.logs || []);
    } catch (e) {
      showToast('error', 'Failed to load.');
    }
    setLoading(false);
  }, [nagarsevakId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveTemplate = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      showToast('error', 'Name and message required.');
      return;
    }
    setSaving(true);
    try {
      const data = {...form, nagarsevak_id: nagarsevakId};
      if (editItem)
        await communicationService.updateTemplate(editItem.id, data);
      else await communicationService.createTemplate(data);
      showToast('success', 'Template saved!');
      setShowForm(false);
      setEditItem(null);
      setForm(defTemplate);
      load();
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const handleDeleteTemplate = t => {
    Alert.alert('Delete Template', `Delete "${t.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await communicationService.deleteTemplate(t.id);
            showToast('success', 'Deleted.');
            load();
          } catch (e) {
            showToast('error', e.message);
          }
        },
      },
    ]);
  };

  const handleSendBulk = async () => {
    if (!sendForm.message.trim()) {
      showToast('error', 'Message is required.');
      return;
    }
    setSaving(true);
    try {
      await communicationService.sendBulk({
        ...sendForm,
        nagarsevak_id: nagarsevakId,
      });
      showToast('success', 'Message sent successfully!');
      setShowSend(false);
      setSendForm({
        templateId: '',
        recipients: 'all',
        message: '',
        channel: 'whatsapp',
      });
      load();
    } catch (e) {
      showToast('error', e.message);
    }
    setSaving(false);
  };

  const filteredTemplates = templates.filter(
    t => !search || t.name?.toLowerCase().includes(search.toLowerCase()),
  );

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

        {/* Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.statsGrid, {paddingTop: padding, marginBottom: 12}]}>
          <StatCard
            icon="📢"
            label="Templates"
            value={templates.length}
            color="#dbeafe"
            style={{flex: 1}}
          />
          <StatCard
            icon="📨"
            label="Sent"
            value={logs.length}
            color="#d1fae5"
            style={{flex: 1}}
          />
          <StatCard
            icon="📱"
            label="This Month"
            value={
              logs.filter(
                l =>
                  new Date(l.createdAt) > new Date(Date.now() - 30 * 86400000),
              ).length
            }
            color="#fef3c7"
            style={{flex: 1}}
          />
        </ScrollView>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            {id: 'templates', label: '📝 Templates'},
            {id: 'logs', label: '📊 Send Logs'},
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}>
              <Text
                style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'templates' && (
          <>
            <View style={styles.filterRow}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder="Search templates..."
                style={{flex: 1}}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setEditItem(null);
                  setForm(defTemplate);
                  setShowForm(true);
                }}>
                <Icon name="add" size={22} color={COLORS.white} />
              </TouchableOpacity>
              {canSend && (
                <TouchableOpacity
                  style={[styles.addBtn, {backgroundColor: COLORS.success}]}
                  onPress={() => setShowSend(true)}>
                  <Icon name="send" size={18} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
            {loading ? (
              <LoadingSpinner text="Loading..." full />
            ) : (
              <FlatList
                data={filteredTemplates}
                keyExtractor={t => t.id}
                scrollEnabled={false}
                renderItem={({item: t}) => (
                  <View style={styles.templateCard}>
                    <View style={styles.templateHeader}>
                      <View>
                        <Text style={styles.templateName}>{t.name}</Text>
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>{t.type}</Text>
                        </View>
                      </View>
                      <View style={styles.templateBtns}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => {
                            setEditItem(t);
                            setForm({...defTemplate, ...t});
                            setShowForm(true);
                          }}>
                          <Icon
                            name="pencil"
                            size={14}
                            color={COLORS.warning}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.delBtn}
                          onPress={() => handleDeleteTemplate(t)}>
                          <Icon name="trash" size={14} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.templateMsg} numberOfLines={3}>
                      {t.message}
                    </Text>
                  </View>
                )}
                ItemSeparatorComponent={() => (
                  <View style={{height: SPACING.md}} />
                )}
                contentContainerStyle={{paddingBottom: 120}}
                ListEmptyComponent={
                  <EmptyState
                    icon="📝"
                    title="No templates yet"
                    subtitle="Create message templates for quick bulk communication."
                  />
                }
              />
            )}
          </>
        )}

        {tab === 'logs' &&
          (loading ? (
            <LoadingSpinner text="Loading logs..." full />
          ) : (
            <FlatList
              data={logs}
              keyExtractor={l => l.id || String(Math.random())}
              scrollEnabled={false}
              renderItem={({item: l}) => (
                <View style={styles.logCard}>
                  <View style={styles.logLeft}>
                    <Text style={{fontSize: 22}}>
                      {l.channel === 'sms' ? '📱' : '💬'}
                    </Text>
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.logTitle} numberOfLines={1}>
                      {l.message || 'Bulk message'}
                    </Text>
                    <Text style={styles.logMeta}>
                      {l.recipients || 'All'} recipients ·{' '}
                      {formatDate(l.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.logStatus,
                      {
                        backgroundColor:
                          l.status === 'Sent'
                            ? COLORS.successLight
                            : COLORS.warningLight,
                      },
                    ]}>
                    <Text
                      style={{
                        ...TYPOGRAPHY.caption,
                        color:
                          l.status === 'Sent' ? COLORS.success : COLORS.warning,
                      }}>
                      {l.status || 'Sent'}
                    </Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => (
                <View style={{height: SPACING.md}} />
              )}
              contentContainerStyle={{
                paddingBottom: 120,
                paddingTop: SPACING.md,
              }}
              ListEmptyComponent={
                <EmptyState icon="📊" title="No messages sent yet" />
              }
            />
          ))}

        {/* Template Form */}
        <ModalSheet
          visible={showForm}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
            setForm(defTemplate);
          }}
          title={editItem ? 'Edit Template' : 'New Template'}>
          <FormGroup label="Template Name" required>
            <Input
              value={form.name}
              onChangeText={v => setForm(f => ({...f, name: v}))}
              placeholder="e.g. Birthday Wish"
            />
          </FormGroup>
          <FormGroup label="Type">
            <SelectField
              value={form.type}
              options={TYPES}
              onChange={v => setForm(f => ({...f, type: v}))}
            />
          </FormGroup>
          <FormGroup label="Message" required>
            <Input
              value={form.message}
              onChangeText={v => setForm(f => ({...f, message: v}))}
              placeholder="Use {name} for voter name, {ward} for ward number..."
              multiline
              numberOfLines={5}
              style={{
                minHeight: 120,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
              }}
            />
          </FormGroup>
          <Text style={styles.hint}>
            💡 Use {'{name}'} and {'{ward}'} as placeholders
          </Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && {opacity: 0.6}]}
            onPress={handleSaveTemplate}
            disabled={saving}>
            <Text style={styles.saveBtnText}>
              {saving
                ? 'Saving...'
                : editItem
                ? 'Update Template'
                : 'Create Template'}
            </Text>
          </TouchableOpacity>
        </ModalSheet>

        {/* Send Bulk Modal */}
        <ModalSheet
          visible={showSend}
          onClose={() => setShowSend(false)}
          title="Send Bulk Message">
          <FormGroup label="Channel">
            <SelectField
              value={sendForm.channel}
              options={[
                {label: '📱 WhatsApp', value: 'whatsapp'},
                {label: '💬 SMS', value: 'sms'},
              ]}
              onChange={v => setSendForm(f => ({...f, channel: v}))}
            />
          </FormGroup>
          <FormGroup label="Recipients">
            <SelectField
              value={sendForm.recipients}
              options={[
                {label: 'All Voters', value: 'all'},
                {label: 'Supporters Only', value: 'supporters'},
                {label: 'Influencers', value: 'influencers'},
              ]}
              onChange={v => setSendForm(f => ({...f, recipients: v}))}
            />
          </FormGroup>
          {templates.length > 0 && (
            <FormGroup label="Use Template">
              <SelectField
                value={sendForm.templateId}
                options={[
                  {label: '— None —', value: ''},
                  ...templates.map(t => ({label: t.name, value: t.id})),
                ]}
                onChange={v => {
                  const t = templates.find(t => t.id === v);
                  setSendForm(f => ({
                    ...f,
                    templateId: v,
                    message: t?.message || f.message,
                  }));
                }}
              />
            </FormGroup>
          )}
          <FormGroup label="Message" required>
            <Input
              value={sendForm.message}
              onChangeText={v => setSendForm(f => ({...f, message: v}))}
              placeholder="Your message..."
              multiline
              numberOfLines={5}
              style={{
                minHeight: 120,
                textAlignVertical: 'top',
                paddingTop: SPACING.md,
              }}
            />
          </FormGroup>
          <View style={[styles.warnBox]}>
            <Icon name="warning" size={16} color={COLORS.warning} />
            <Text style={styles.warnText}>
              This will send to all selected voters. Please review before
              sending.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, saving && {opacity: 0.6}]}
            onPress={handleSendBulk}
            disabled={saving}>
            <Icon name="send" size={18} color={COLORS.white} />
            <Text style={styles.saveBtnText}>
              {saving ? 'Sending...' : '📢 Send Bulk Message'}
            </Text>
          </TouchableOpacity>
        </ModalSheet>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  statsRow: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg},
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  tabActive: {backgroundColor: COLORS.white, ...SHADOWS.sm},
  tabText: {...TYPOGRAPHY.label, color: COLORS.gray500},
  tabTextActive: {color: COLORS.gray800},
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
  templateCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  templateName: {...TYPOGRAPHY.label, color: COLORS.gray800, marginBottom: 4},
  templateMsg: {...TYPOGRAPHY.bodySm, color: COLORS.gray500, lineHeight: 20},
  templateBtns: {flexDirection: 'row', gap: SPACING.sm},
  chip: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  chipText: {...TYPOGRAPHY.caption, color: COLORS.gray600},
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
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logLeft: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: {...TYPOGRAPHY.label, color: COLORS.gray800, marginBottom: 4},
  logMeta: {...TYPOGRAPHY.caption, color: COLORS.gray500},
  logStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
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
  hint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray500,
    marginBottom: SPACING.md,
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  warnText: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.warningDark,
    flex: 1,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  sendBtn: {
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  saveBtnText: {...TYPOGRAPHY.h5, color: COLORS.white},
});
