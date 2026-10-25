import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

export default function FeedbackModal({
  visible = false,
  type = 'loading', // 'loading' | 'success' | 'error'
  title = '',
  message = '',
  subMessage = '',
  confirmText = 'OK',
  onConfirm = null,
  onClose = null,
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Render cold-start elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer = null;
    if (visible && type === 'loading') {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, type]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      if (type === 'loading') {
        const loopRotate = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          })
        );
        const loopPulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 800,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: Platform.OS !== 'web',
            }),
          ])
        );
        loopRotate.start();
        loopPulse.start();

        return () => {
          loopRotate.stop();
          loopPulse.stop();
          rotateAnim.setValue(0);
          pulseAnim.setValue(1);
        };
      }
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, type]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePressConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  // Dynamic server cold start hint
  let serverHint = null;
  if (type === 'loading') {
    if (elapsedSeconds >= 4 && elapsedSeconds < 15) {
      serverHint = '☁️ Connecting to Render cloud server...';
    } else if (elapsedSeconds >= 15 && elapsedSeconds < 30) {
      serverHint = '⚡ Waking up server from sleep (Render free tier takes ~30-45s)...';
    } else if (elapsedSeconds >= 30) {
      serverHint = '⏳ Almost there! Server is booting and establishing database connection...';
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={type !== 'loading' ? onClose : undefined}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              width: isTablet ? 420 : '88%',
              maxWidth: 440,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* HEADER ICON / SPINNER */}
          <View style={styles.iconContainer}>
            {type === 'loading' && (
              <View style={styles.loadingWrapper}>
                <Animated.View
                  style={[
                    styles.spinnerRing,
                    {
                      transform: [{ rotate: spin }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.logoCenter,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Text style={styles.logoLetter}>V</Text>
                </Animated.View>
              </View>
            )}

            {type === 'success' && (
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Text style={styles.badgeSuccessIcon}>✓</Text>
              </View>
            )}

            {type === 'error' && (
              <View style={[styles.badge, styles.badgeError]}>
                <Text style={styles.badgeErrorIcon}>✕</Text>
              </View>
            )}
          </View>

          {/* TITLE */}
          <Text
            style={[
              styles.title,
              type === 'success' && styles.titleSuccess,
              type === 'error' && styles.titleError,
            ]}
          >
            {title || (type === 'loading' ? 'Processing...' : type === 'success' ? 'Success!' : 'Request Failed')}
          </Text>

          {/* MESSAGE */}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* SUBMESSAGE OR ERROR DETAILS */}
          {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}

          {/* RENDER CLOUD STATUS BANNER */}
          {serverHint ? (
            <View style={styles.renderNoticeBox}>
              <Text style={styles.renderNoticeText}>{serverHint}</Text>
              <Text style={styles.renderTimerText}>Elapsed: {elapsedSeconds}s</Text>
            </View>
          ) : null}

          {/* ACTION BUTTON (FOR SUCCESS & ERROR) */}
          {type !== 'loading' && (
            <View style={styles.buttonWrapper}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  type === 'success' ? styles.buttonSuccess : styles.buttonError,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handlePressConfirm}
              >
                <Text style={styles.buttonText}>{confirmText || 'OK'}</Text>
              </Pressable>
            </View>
          )}

          {/* LOADING LIVE DOTS */}
          {type === 'loading' && (
            <View style={styles.dotsRow}>
              <View style={[styles.dot, { opacity: 0.4 }]} />
              <View style={[styles.dot, { opacity: 0.7 }]} />
              <View style={[styles.dot, { opacity: 1 }]} />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrapper: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#EFF6FF',
    borderTopColor: '#2563EB',
    borderRightColor: '#3B82F6',
  },
  logoCenter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  logoLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  badgeSuccessIcon: {
    fontSize: 34,
    fontWeight: '900',
    color: '#059669',
  },
  badgeError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  badgeErrorIcon: {
    fontSize: 30,
    fontWeight: '900',
    color: '#DC2626',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  titleSuccess: {
    color: '#065F46',
  },
  titleError: {
    color: '#991B1B',
  },
  message: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 6,
  },
  subMessage: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  renderNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  renderNoticeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  renderTimerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
    marginTop: 3,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 18,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonError: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
});
