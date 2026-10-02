import React, { useEffect, useRef } from 'react';

import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function VedaAlertModal({
  visible,
  type = 'info',
  title = 'Veda',
  message = '',
  primaryText = 'Done',
  secondaryText = '',
  onPrimary,
  onSecondary,
  loading = false,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.94);
      translateY.setValue(14);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 18,
          stiffness: 180,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    visible,
    opacity,
    scale,
    translateY,
  ]);

  if (!visible) {
    return null;
  }

  const config = {
    success: {
      icon: '✓',
      label: 'SUCCESS',
      iconBg: '#E9F9F2',
      iconColor: '#159A6B',
      buttonBg: '#159A6B',
    },

    error: {
      icon: '×',
      label: 'ERROR',
      iconBg: '#FFF0F0',
      iconColor: '#D64545',
      buttonBg: '#D64545',
    },

    warning: {
      icon: '!',
      label: 'ATTENTION',
      iconBg: '#FFF6E6',
      iconColor: '#C88719',
      buttonBg: '#C88719',
    },

    confirm: {
      icon: '?',
      label: 'CONFIRM ACTION',
      iconBg: '#EEF4FF',
      iconColor: '#3478C8',
      buttonBg: '#3478C8',
    },

    info: {
      icon: 'i',
      label: 'VEDA',
      iconBg: '#EEF5FF',
      iconColor: '#3478C8',
      buttonBg: '#3478C8',
    },
  };

  const current =
    config[type] || config.info;

  const isDestructive =
    type === 'error' ||
    type === 'warning';

  const handleSecondary = () => {
    if (loading) {
      return;
    }

    if (onSecondary) {
      onSecondary();
    }
  };

  const handlePrimary = () => {
    if (loading) {
      return;
    }

    if (onPrimary) {
      onPrimary();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={
        secondaryText
          ? handleSecondary
          : handlePrimary
      }
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [
                {
                  scale,
                },
                {
                  translateY,
                },
              ],
            },
          ]}
        >
          {/* TOP ACCENT */}

          <View
            style={[
              styles.topAccent,
              {
                backgroundColor:
                  current.buttonBg,
              },
            ]}
          />

          {/* ICON */}

          <View
            style={[
              styles.iconOuter,
              {
                backgroundColor:
                  current.iconBg,
              },
            ]}
          >
            <View
              style={[
                styles.iconInner,
                {
                  borderColor:
                    `${current.iconColor}25`,
                },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  {
                    color:
                      current.iconColor,
                  },
                ]}
              >
                {current.icon}
              </Text>
            </View>
          </View>

          {/* CONTENT */}

          <View style={styles.content}>
            <Text style={styles.eyebrow}>
              {current.label}
            </Text>

            <Text style={styles.title}>
              {title}
            </Text>

            <Text style={styles.message}>
              {message}
            </Text>
          </View>

          {/* ACTIONS */}

          <View style={styles.actions}>
            {secondaryText ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  secondaryText
                }
                disabled={loading}
                onPress={
                  handleSecondary
                }
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed &&
                    !loading &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.secondaryText
                  }
                >
                  {secondaryText}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                primaryText
              }
              disabled={loading}
              onPress={handlePrimary}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor:
                    current.buttonBg,
                },
                pressed &&
                  !loading &&
                  styles.buttonPressed,
              ]}
            >
              {loading ? (
                <Text
                  style={
                    styles.primaryText
                  }
                >
                  Please wait...
                </Text>
              ) : (
                <Text
                  style={[
                    styles.primaryText,
                    isDestructive &&
                      styles.destructivePrimaryText,
                  ]}
                >
                  {primaryText}
                </Text>
              )}
            </Pressable>
          </View>

          {/* FOOTER */}

          <Text style={styles.footer}>
            Veda • Smart Healthcare
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor:
      'rgba(10, 20, 35, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    overflow: 'hidden',

    shadowColor: '#08111F',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 18,
  },

  topAccent: {
    height: 4,
    width: '100%',
  },

  iconOuter: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignSelf: 'center',
    marginTop: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconInner: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 31,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    color: '#8A96A8',
    marginBottom: 7,
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#172033',
    textAlign: 'center',
  },

  message: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: '#667085',
    textAlign: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 24,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE3EC',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  destructivePrimaryText: {
    color: '#FFFFFF',
  },

  secondaryText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  footer: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: '#A2ACBA',
    marginTop: 17,
    marginBottom: 19,
  },
});