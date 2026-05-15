import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, useWindowDimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../config/theme';

export default function LoginScreen() {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const cardWidth = isTablet ? Math.min(440, width * 0.6) : width;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch (err) {
      setError('Could not send reset email. Check the address and try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING.xxl, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { width: cardWidth, alignSelf: 'center' }]}>

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>🏛️</Text>
            </View>
            <Text style={styles.appName}>AtalJanseva</Text>
            <Text style={styles.appTagline}>Admin Panel — Municipal Management System</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Reset success */}
          {resetSent ? (
            <View style={styles.successBox}>
              <Icon name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.successText}>Password reset email sent! Check your inbox.</Text>
            </View>
          ) : null}

          {!resetMode ? (
            <>
              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <Icon name="mail-outline" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@ward.gov.in"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <Icon name="lock-closed-outline" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.gray400}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                    <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray400} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot password */}
              <TouchableOpacity onPress={() => { setResetMode(true); setError(''); }} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Login button */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.loginBtnText}>Login to Admin Panel</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.resetDesc}>
                Enter your registered email and we'll send you a link to reset your password.
              </Text>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <Icon name="mail-outline" size={18} color={COLORS.gray400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="admin@ward.gov.in"
                    placeholderTextColor={COLORS.gray400}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.loginBtnText}>Send Reset Email</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setResetMode(false); setResetSent(false); setError(''); }} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>🔒 Secure Admin Access</Text>
            <Text style={styles.footerText}>🇮🇳 Made for Municipal Governance</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    marginHorizontal: SPACING.lg,
    ...SHADOWS.xl,
  },
  brand: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  logoIcon: { fontSize: 36 },
  appName: { ...TYPOGRAPHY.h2, color: COLORS.secondary, marginBottom: 4 },
  appTagline: { ...TYPOGRAPHY.bodySm, color: COLORS.gray500, textAlign: 'center' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.danger, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successText: { ...TYPOGRAPHY.bodySm, color: COLORS.success, flex: 1 },

  field: { marginBottom: SPACING.lg },
  label: { ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray50,
    paddingHorizontal: SPACING.md,
    minHeight: 50,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, ...TYPOGRAPHY.body, color: COLORS.gray800 },
  eyeBtn: { padding: SPACING.xs },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.lg, marginTop: -SPACING.sm },
  forgotText: { ...TYPOGRAPHY.label, color: COLORS.primary },

  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { ...TYPOGRAPHY.h4, color: COLORS.white },

  resetDesc: { ...TYPOGRAPHY.body, color: COLORS.gray500, marginBottom: SPACING.xl, lineHeight: 22 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: { ...TYPOGRAPHY.caption, color: COLORS.gray400 },
});
