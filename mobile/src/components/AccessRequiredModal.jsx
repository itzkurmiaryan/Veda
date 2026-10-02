import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../api/api';

export default function AccessRequiredModal({
  visible,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setLoading(false);
      setSent(false);
      setError('');
    }
  }, [visible]);

  const requestAccess = async () => {
    if (loading || sent) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/request-access-session', {
        message:
          'Doctor requested access while trying to add a patient or prescription.',
      });
      setSent(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to send access request.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.accent} />
          <View style={styles.iconOuter}>
            <Text style={styles.icon}>{sent ? '\u2713' : '!'}</Text>
          </View>

          <Text style={styles.eyebrow}>VEDA ACCESS</Text>
          <Text style={styles.title}>
            {sent ? 'Request sent' : 'Access is paused'}
          </Text>
          <Text style={styles.description}>
            {sent
              ? 'Your administrator has been notified. You can continue viewing existing records while access is reviewed.'
              : 'You can still sign in and view existing records. Request access to add patients or create prescriptions.'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={sent ? onClose : requestAccess}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>
                {sent ? 'Done' : 'Request access'}
              </Text>
            )}
          </Pressable>

          {!sent ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryText}>Not now</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(7, 22, 32, 0.68)',
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EAF0',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#14B8A6',
  },
  iconOuter: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#E7F6F3',
    marginBottom: 18,
  },
  icon: {
    color: '#087A66',
    fontSize: 22,
    fontWeight: '900',
  },
  eyebrow: {
    color: '#087A66',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: '#14233B',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginTop: 5,
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF3F3',
    marginTop: 14,
  },
  errorText: {
    color: '#B42318',
    fontSize: 11,
    lineHeight: 16,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#14233B',
    marginTop: 20,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  secondaryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
});
