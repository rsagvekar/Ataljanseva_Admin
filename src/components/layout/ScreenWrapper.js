import React, { forwardRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal, TextInput,
  useWindowDimensions, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, HEADER_HEIGHT } from '../../config/theme';

// ── ScreenWrapper ─────────────────────────────────────────────────────────────
export const ScreenWrapper = ({
  children, title, subtitle, onBack, headerRight,
  scrollable = true, refreshControl,
  noPadding = false, backgroundColor = COLORS.background, style,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padding = width >= 900 ? 24 : width >= 600 ? 20 : 16;

  const body = (
    <View style={[styles.body, noPadding ? {} : { padding }, style]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={HEADER_HEIGHT + insets.top}
    >
      {(title || onBack || headerRight) && (
        <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: padding }]}>
          <View style={styles.headerInner}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="arrow-back" size={22} color={COLORS.white} />
              </TouchableOpacity>
            )}
            <View style={styles.headerTextWrap}>
              {title    && <Text style={styles.headerTitle}    numberOfLines={1}>{title}</Text>}
              {subtitle && <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>
            {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
          </View>
        </View>
      )}

      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {body}
        </ScrollView>
      ) : body}
    </KeyboardAvoidingView>
  );
};

// ── ModalSheet ────────────────────────────────────────────────────────────────
export const ModalSheet = ({ visible, onClose, title, children }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.xl }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={22} color={COLORS.gray500} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING.lg }}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── FormGroup ─────────────────────────────────────────────────────────────────
export const FormGroup = ({ label, required, children, error, hint }) => (
  <View style={styles.formGroup}>
    {label && (
      <Text style={styles.formLabel}>
        {label}{required ? <Text style={styles.formRequired}> *</Text> : null}
      </Text>
    )}
    {children}
    {error  ? <Text style={styles.formError}>{error}</Text>  : null}
    {hint   ? <Text style={styles.formHint}>{hint}</Text>    : null}
  </View>
);

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(({
  value, onChangeText, placeholder, secureTextEntry,
  multiline, numberOfLines, keyboardType, autoCapitalize,
  style, editable = true, ...rest
}, ref) => (
  <TextInput
    ref={ref}
    style={[
      styles.input,
      multiline && { minHeight: numberOfLines ? numberOfLines * 24 : 80, textAlignVertical: 'top', paddingTop: SPACING.md },
      !editable && { backgroundColor: COLORS.gray100, color: COLORS.gray500 },
      style,
    ]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={COLORS.gray400}
    secureTextEntry={secureTextEntry}
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType || 'default'}
    autoCapitalize={autoCapitalize !== undefined ? autoCapitalize : 'sentences'}
    editable={editable}
    {...rest}
  />
));

// ── SelectField ───────────────────────────────────────────────────────────────
export const SelectField = ({ value, options, onChange, style }) => {
  const [open, setOpen] = React.useState(false);
  const insets = useSafeAreaInsets();

  const labelFor = (o) => (typeof o === 'object' ? o.label : o);
  const valueFor = (o) => (typeof o === 'object' ? o.value : o);
  const display  = options.find((o) => valueFor(o) === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.select, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !value && { color: COLORS.gray400 }]}>
          {display ? labelFor(display) : 'Select...'}
        </Text>
        <Icon name="chevron-down" size={16} color={COLORS.gray400} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.selectSheet, { paddingBottom: insets.bottom + SPACING.xl }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.selectSheetTitle}>Select an option</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const val = valueFor(opt);
                const lbl = labelFor(opt);
                const isSelected = val === value;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                    onPress={() => { onChange(val); setOpen(false); }}
                  >
                    <Text style={[styles.selectOptionText, isSelected && styles.selectOptionTextActive]}>{lbl}</Text>
                    {isSelected && <Icon name="checkmark" size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { backgroundColor: COLORS.secondary, paddingBottom: SPACING.md },
  headerInner:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  backBtn:         { width: 36, height: 36, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTextWrap:  { flex: 1 },
  headerTitle:     { ...TYPOGRAPHY.h4, color: COLORS.white },
  headerSubtitle:  { ...TYPOGRAPHY.caption, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  headerRight:     { flexShrink: 0 },
  scroll:          { flex: 1 },
  body:            { flex: 1 },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, maxHeight: '90%', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, ...SHADOWS.lg },
  modalHandle:   { width: 40, height: 4, backgroundColor: COLORS.gray200, borderRadius: RADIUS.full, alignSelf: 'center', marginBottom: SPACING.md },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle:    { ...TYPOGRAPHY.h4, color: COLORS.gray900 },

  formGroup:    { marginBottom: SPACING.md },
  formLabel:    { ...TYPOGRAPHY.labelSm, color: COLORS.gray700, marginBottom: SPACING.xs },
  formRequired: { color: COLORS.danger },
  formError:    { ...TYPOGRAPHY.caption, color: COLORS.danger, marginTop: SPACING.xs },
  formHint:     { ...TYPOGRAPHY.caption, color: COLORS.gray400, marginTop: SPACING.xs },

  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.gray800,
    minHeight: 48,
  },

  select:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 48 },
  selectText: { ...TYPOGRAPHY.body, color: COLORS.gray800, flex: 1 },

  selectSheet:         { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, maxHeight: '70%', paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, ...SHADOWS.lg },
  selectSheetTitle:    { ...TYPOGRAPHY.h5, color: COLORS.gray600, textAlign: 'center', marginBottom: SPACING.md },
  selectOption:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  selectOptionActive:  { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm },
  selectOptionText:    { ...TYPOGRAPHY.body, color: COLORS.gray700 },
  selectOptionTextActive: { color: COLORS.primary, fontWeight: '600' },
});
