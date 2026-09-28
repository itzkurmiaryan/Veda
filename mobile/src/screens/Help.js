import React, { useEffect, useRef } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';

import {
  Card,
  FadeIn,
  Screen,
  colors,
} from '../components/UI';

const WHATSAPP_NUMBER = '917524917394';

const WHATSAPP_MESSAGE =
  'Hello AlphaAryX, I need help regarding the Veda app.';

export default function Help() {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    glowLoop.start();
    pulseLoop.start();
    rotateLoop.start();

    return () => {
      glowLoop.stop();
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [glowAnim, pulseAnim, rotateAnim]);

  const openWhatsApp = async () => {
    const encodedMessage =
      encodeURIComponent(WHATSAPP_MESSAGE);

    const appUrl =
      `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;

    const webUrl =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    try {
      const supported =
        await Linking.canOpenURL(appUrl);

      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(webUrl);
      } catch (fallbackError) {
        console.log(
          'WhatsApp open error:',
          fallbackError
        );
      }
    }
  };

  const openAlphaAryX = async () => {
    try {
      await Linking.openURL(
        'https://alphaaryx.vercel.app/'
      );
    } catch (error) {
      console.log(
        'AlphaAryX open error:',
        error
      );
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <Screen scroll>
      <FadeIn>

        {/* ================= HERO ================= */}

        <View style={styles.hero}>

          <Animated.View
            style={[
              styles.heroGlow,
              {
                opacity: glowOpacity,
                transform: [
                  {
                    scale: pulseAnim,
                  },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.orbit,
              {
                transform: [
                  {
                    rotate: spin,
                  },
                ],
              },
            ]}
          >
            <View style={styles.orbitDot} />
          </Animated.View>

          <View style={styles.heroIcon}>
            <Text style={styles.cross}>
              ✚
            </Text>
          </View>

          <View style={styles.badge}>
            <View style={styles.liveDot} />

            <Text style={styles.badgeText}>
              VEDA SUPPORT
            </Text>
          </View>

          <Text style={styles.title}>
            How can we
            <Text style={styles.titleAccent}>
              {' '}help?
            </Text>
          </Text>

          <Text style={styles.subtitle}>
            Everything you need to use Veda
            smoothly — from patient management
            to professional prescriptions.
          </Text>

          <View style={styles.heroMeta}>

            <View style={styles.metaItem}>
              <Text style={styles.metaSymbol}>
                ✦
              </Text>

              <Text style={styles.metaText}>
                Simple
              </Text>
            </View>

            <View style={styles.metaLine} />

            <View style={styles.metaItem}>
              <Text style={styles.metaSymbol}>
                ◉
              </Text>

              <Text style={styles.metaText}>
                Secure
              </Text>
            </View>

            <View style={styles.metaLine} />

            <View style={styles.metaItem}>
              <Text style={styles.metaSymbol}>
                ⚡
              </Text>

              <Text style={styles.metaText}>
                Smart
              </Text>
            </View>

          </View>

        </View>


        {/* ================= SECTION HEADER ================= */}

        <View style={styles.sectionHeader}>

          <View>
            <Text style={styles.sectionEyebrow}>
              QUICK GUIDE
            </Text>

            <Text style={styles.sectionTitle}>
              Using Veda
            </Text>
          </View>

          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>
              06
            </Text>
          </View>

        </View>


        {/* ================= HELP STEPS ================= */}

        <HelpCard
          number="01"
          symbol="＋"
          title="Add a Patient"
          text="Open Patients from the header and select New Patient. Enter the patient's basic information and save the record."
        />

        <HelpCard
          number="02"
          symbol="◉"
          title="Open Patient Record"
          text="Select any patient from the Patients screen to view their profile, previous visits and prescription history."
        />

        <HelpCard
          number="03"
          symbol="✚"
          title="Create Prescription"
          text="From the patient record, create a new visit and enter symptoms, diagnosis, vitals, medicines, advice and follow-up details."
        />

        <HelpCard
          number="04"
          symbol="✎"
          title="Edit Prescription"
          text="Open an existing prescription and use the edit option whenever you need to update patient or prescription information."
        />

        <HelpCard
          number="05"
          symbol="↗"
          title="Print or Share PDF"
          text="Open the prescription and use the available PDF actions to print or share a professional doctor-style prescription."
        />

        <HelpCard
          number="06"
          symbol="◌"
          title="Manage Profile"
          text="Open Profile from the header to view and manage your doctor information, clinic details and profile appearance."
        />


        {/* ================= WHATSAPP SUPPORT ================= */}

        <View style={styles.supportCard}>

          <View style={styles.supportGlow} />

          <View style={styles.supportTop}>

            <View style={styles.whatsappIcon}>
              <Text style={styles.whatsappIconText}>
                ◔
              </Text>
            </View>

            <View style={styles.supportHeading}>

              <Text style={styles.supportEyebrow}>
                NEED ASSISTANCE?
              </Text>

              <Text style={styles.supportTitle}>
                Talk to Veda Support
              </Text>

            </View>

          </View>

          <Text style={styles.supportText}>
            Have a question, facing an issue, or
            need help with Veda? Connect with
            AlphaAryX directly on WhatsApp.
          </Text>

          <View style={styles.contactInfo}>

            <View style={styles.contactDot} />

            <Text style={styles.contactNumber}>
              +91 75249 17394
            </Text>

            <View style={styles.whatsappMini}>
              <Text style={styles.whatsappMiniText}>
                WA
              </Text>
            </View>

          </View>

          <Pressable
            onPress={openWhatsApp}
            style={({ pressed }) => [
              styles.whatsappButton,
              pressed && styles.pressed,
            ]}
          >

            <View style={styles.whatsappButtonIcon}>
              <Text style={styles.whatsappButtonSymbol}>
                ◔
              </Text>
            </View>

            <View style={styles.whatsappButtonContent}>

              <Text style={styles.whatsappButtonTitle}>
                Chat on WhatsApp
              </Text>

              <Text style={styles.whatsappButtonSub}>
                Direct support • Quick response
              </Text>

            </View>

            <Text style={styles.arrow}>
              →
            </Text>

          </Pressable>

          <Text style={styles.supportNote}>
            Your message will open directly in WhatsApp
            with a pre-filled support request.
          </Text>

        </View>


        {/* ================= ALPHAARYX ================= */}

        <View style={styles.brandCard}>

          <View style={styles.brandTop}>

            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>
                AX
              </Text>
            </View>

            <View style={styles.brandTextWrap}>

              <Text style={styles.brandEyebrow}>
                POWERED BY
              </Text>

              <Text style={styles.brandTitle}>
                AlphaAryX
              </Text>

            </View>

            <Text style={styles.brandArrow}>
              ↗
            </Text>

          </View>

          <Text style={styles.brandDescription}>
            Digital solutions, technology and
            creative services for modern businesses
            and personal projects.
          </Text>

          <Pressable
            onPress={openAlphaAryX}
            style={({ pressed }) => [
              styles.brandButton,
              pressed && styles.pressed,
            ]}
          >

            <Text style={styles.brandButtonText}>
              Visit AlphaAryX
            </Text>

            <Text style={styles.brandButtonArrow}>
              →
            </Text>

          </Pressable>

        </View>

      </FadeIn>
    </Screen>
  );
}


/* =====================================================
   HELP CARD
===================================================== */

function HelpCard({
  number,
  symbol,
  title,
  text,
}) {
  const scaleAnim = useRef(
    new Animated.Value(1)
  ).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale: scaleAnim,
          },
        ],
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Card>

          <View style={styles.helpRow}>

            <View style={styles.stepNumber}>

              <Text style={styles.stepNumberText}>
                {number}
              </Text>

              <View style={styles.stepSymbol}>
                <Text style={styles.stepSymbolText}>
                  {symbol}
                </Text>
              </View>

            </View>

            <View style={styles.helpContent}>

              <View style={styles.cardHeadingRow}>

                <Text style={styles.cardTitle}>
                  {title}
                </Text>

                <Text style={styles.cardArrow}>
                  ↗
                </Text>

              </View>

              <Text style={styles.cardText}>
                {text}
              </Text>

            </View>

          </View>

        </Card>
      </Pressable>
    </Animated.View>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  /* HERO */

  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#07111F',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    marginTop: 8,
    marginBottom: 28,
  },

  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: '#2563EB',
    right: -70,
    top: -70,
  },

  orbit: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
    right: -45,
    top: -45,
  },

  orbitDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 10,
    backgroundColor: '#60A5FA',
    top: 22,
    left: 38,
  },

  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  cross: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 30,
    marginBottom: 14,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#34D399',
    marginRight: 7,
  },

  badgeText: {
    color: '#BFDBFE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1,
  },

  titleAccent: {
    color: '#60A5FA',
  },

  subtitle: {
    color: '#A8B6C8',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 330,
  },

  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 23,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaSymbol: {
    color: '#60A5FA',
    fontSize: 12,
    marginRight: 5,
  },

  metaText: {
    color: '#D8E2EF',
    fontSize: 10,
    fontWeight: '800',
  },

  metaLine: {
    width: 1,
    height: 12,
    backgroundColor:
      'rgba(255,255,255,0.16)',
    marginHorizontal: 13,
  },


  /* SECTION */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },

  sectionEyebrow: {
    color: colors.blue,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '900',
  },

  sectionCount: {
    width: 42,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCountText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
  },


  /* HELP CARDS */

  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepNumber: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },

  stepNumberText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },

  stepSymbol: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  stepSymbolText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  helpContent: {
    flex: 1,
    paddingTop: 1,
  },

  cardHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    paddingRight: 8,
  },

  cardArrow: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '800',
  },

  cardText: {
    color: colors.muted,
    fontSize: 12.5,
    lineHeight: 20,
    marginTop: 6,
  },


  /* WHATSAPP SUPPORT */

  supportCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#07111F',
    borderRadius: 28,
    padding: 22,
    marginTop: 10,
    marginBottom: 18,
  },

  supportGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 100,
    backgroundColor: '#0EA5E9',
    opacity: 0.12,
    right: -70,
    bottom: -80,
  },

  supportTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  whatsappIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  whatsappIconText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  supportHeading: {
    flex: 1,
  },

  supportEyebrow: {
    color: '#67E8F9',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  supportTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  supportText: {
    color: '#AAB8C9',
    fontSize: 12.5,
    lineHeight: 20,
    marginTop: 17,
  },

  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    marginBottom: 15,
  },

  contactDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#34D399',
    marginRight: 8,
  },

  contactNumber: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },

  whatsappMini: {
    backgroundColor:
      'rgba(34,197,94,0.14)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  whatsappMiniText: {
    color: '#4ADE80',
    fontSize: 8,
    fontWeight: '900',
  },

  whatsappButton: {
    minHeight: 66,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  whatsappButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  whatsappButtonSymbol: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  whatsappButtonContent: {
    flex: 1,
  },

  whatsappButtonTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  whatsappButtonSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 3,
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    paddingHorizontal: 5,
  },

  supportNote: {
    color: '#6F8094',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 12,
  },


  /* ALPHAARYX */

  brandCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 18,
  },

  brandTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandMark: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  brandTextWrap: {
    flex: 1,
  },

  brandEyebrow: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  brandTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  brandArrow: {
    color: colors.blue,
    fontSize: 19,
    fontWeight: '800',
  },

  brandDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 15,
  },

  brandButton: {
    height: 47,
    borderRadius: 14,
    backgroundColor: colors.ink,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  brandButtonArrow: {
    color: '#60A5FA',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '900',
  },


  /* PRESSED */

  pressed: {
    opacity: 0.78,
  },
});