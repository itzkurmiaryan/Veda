import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function LoginReminder({
  navigation,
}) {
  const {
    token,
    loading: authLoading,
  } = useAuth();

  const [visible, setVisible] = useState(false);

  const scaleAnim = useRef(
    new Animated.Value(0.88)
  ).current;

  const opacityAnim = useRef(
    new Animated.Value(0)
  ).current;

  const iconScale = useRef(
    new Animated.Value(0.7)
  ).current;

  /*
   * Show login reminder every 60 seconds
   * when user is not logged in.
   */
  useEffect(() => {
    if (authLoading || token) {
      setVisible(false);
      return;
    }

    const showReminder = () => {
      setVisible(true);

      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
      iconScale.setValue(0.7);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),

        Animated.spring(iconScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // First reminder after 1 minute
    const timer = setInterval(
      showReminder,
      60 * 1000
    );

    return () => {
      clearInterval(timer);
    };
  }, [
    token,
    authLoading,
    scaleAnim,
    opacityAnim,
    iconScale,
  ]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),

      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const goToLogin = () => {
    setVisible(false);

    navigation.navigate('Login');
  };

  if (authLoading || token) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scale: scaleAnim,
                },
              ],
            },
          ]}
        >
          {/* TOP ACCENT */}
          <View style={styles.topAccent} />

          {/* ICON */}
          <Animated.View
            style={[
              styles.iconOuter,
              {
                transform: [
                  {
                    scale: iconScale,
                  },
                ],
              },
            ]}
          >
            <View style={styles.iconInner}>
              <Text style={styles.icon}>
                ✦
              </Text>
            </View>
          </Animated.View>

          {/* CONTENT */}
          <Text style={styles.eyebrow}>
            WELCOME TO VEDA
          </Text>

          <Text style={styles.title}>
            Continue with your
          </Text>

          <Text style={styles.titleAccent}>
            secure workspace
          </Text>

          <Text style={styles.description}>
            Log in to access your patients,
            prescriptions and professional
            healthcare workspace.
          </Text>

          {/* SECURITY */}
          <View style={styles.securityBox}>
            <View style={styles.securityIcon}>
              <Text style={styles.securityIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>
                Secure access
              </Text>

              <Text style={styles.securityText}>
                Your Veda account keeps your
                clinical workspace connected.
              </Text>
            </View>
          </View>

          {/* LOGIN */}
          <Pressable
            onPress={goToLogin}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.loginButtonText}>
              Login to Veda
            </Text>

            <Text style={styles.loginArrow}>
              →
            </Text>
          </Pressable>

          {/* MAYBE LATER */}
          <Pressable
            onPress={closeModal}
            style={({ pressed }) => [
              styles.laterButton,
              pressed && {
                opacity: 0.6,
              },
            ]}
          >
            <Text style={styles.laterText}>
              Maybe later
            </Text>
          </Pressable>

          <Text style={styles.reminderText}>
            You'll be reminded again in 1 minute.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 15, 25, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 22,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 18,
  },

  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#08A9C4',
  },

  iconOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F9FC',
    marginBottom: 20,
  },

  iconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BCECF3',
  },

  icon: {
    fontSize: 25,
    color: '#08A9C4',
    fontWeight: '900',
  },

  eyebrow: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    color: '#08A9C4',
    marginBottom: 9,
  },

  title: {
    textAlign: 'center',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    color: '#10212D',
  },

  titleAccent: {
    textAlign: 'center',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    color: '#08A9C4',
  },

  description: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: '#71808C',
    marginTop: 11,
    marginHorizontal: 8,
  },

  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FAFC',
    borderWidth: 1,
    borderColor: '#E4F0F4',
    borderRadius: 16,
    padding: 13,
    marginTop: 20,
  },

  securityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E1F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  securityIconText: {
    color: '#16A085',
    fontSize: 17,
    fontWeight: '900',
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1B303B',
  },

  securityText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: '#7B8992',
    marginTop: 2,
  },

  loginButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: '#102A38',
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#102A38',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  buttonPressed: {
    transform: [
      {
        scale: 0.98,
      },
    ],
    opacity: 0.9,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  loginArrow: {
    color: '#71E1EF',
    fontSize: 21,
    fontWeight: '800',
    marginLeft: 12,
  },

  laterButton: {
    alignSelf: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    marginTop: 5,
  },

  laterText: {
    color: '#647580',
    fontSize: 12,
    fontWeight: '700',
  },

  reminderText: {
    textAlign: 'center',
    color: '#A0ABB2',
    fontSize: 9.5,
    marginTop: 1,
  },
});