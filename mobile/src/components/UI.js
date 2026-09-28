import React, {
  useEffect,
  useRef,
} from 'react';

import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import AppHeader from './AppHeader';

import { useAuth } from '../context/AuthContext';


export const colors = {
  ink: '#0F172A',
  muted: '#5D6B82',
  blue: '#1D4ED8',
  cyan: '#14B8A6',
  wash: '#EEF5FF',
  line: '#DDE7F5',
  white: '#FFFFFF',
  danger: '#E11D48',
  panel: '#F8FBFF',
};


/* =================================================
   SCREEN
================================================= */

export const Screen = ({
  children,
  scroll = false,
  contentStyle,
  showHeader = true,
}) => {

  const { width } = useWindowDimensions();

  const horizontalPadding =
    width < 480 ? 14 : 18;

  const maxContentWidth = Math.min(
    width - horizontalPadding * 2,
    1100
  );


  const inner = (
    <View
      style={[
        styles.screenInner,
        {
          width: '100%',
          maxWidth: maxContentWidth,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );


  const content = scroll ? (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingHorizontal:
            horizontalPadding,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={
        Platform.OS === 'ios'
          ? 'interactive'
          : 'on-drag'
      }
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
    >

      {inner}

      {showHeader ? <Footer /> : null}

    </ScrollView>
  ) : (
    <View style={styles.screen}>

      {inner}

      {showHeader ? <Footer /> : null}

    </View>
  );


  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={[
        'top',
        'left',
        'right',
        'bottom',
      ]}
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.ink}
        translucent={false}
      />


      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={0}
      >

        {showHeader ? (
          <View style={styles.headerSlot}>
            <AppHeader />
          </View>
        ) : null}


        <View style={styles.contentSlot}>
          {content}
        </View>


        {/* GLOBAL LOADING OVERLAY */}

        <GlobalLoader />

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
};


/* =================================================
   GLOBAL LOADER
================================================= */

function GlobalLoader() {

  const {
    actionLoading,
    actionMessage,
    actionSubMessage,
  } = useAuth();


  const rotate = useRef(
    new Animated.Value(0)
  ).current;


  const pulse = useRef(
    new Animated.Value(0.8)
  ).current;


  const glow = useRef(
    new Animated.Value(0.35)
  ).current;


  useEffect(() => {

    if (!actionLoading) {
      return;
    }


    const rotateAnimation =
      Animated.loop(
        Animated.timing(
          rotate,
          {
            toValue: 1,
            duration: 1400,
            useNativeDriver:
              Platform.OS !== 'web',
          }
        )
      );


    const pulseAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            pulse,
            {
              toValue: 1,
              duration: 850,
              useNativeDriver:
                Platform.OS !== 'web',
            }
          ),

          Animated.timing(
            pulse,
            {
              toValue: 0.8,
              duration: 850,
              useNativeDriver:
                Platform.OS !== 'web',
            }
          ),
        ])
      );


    const glowAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            glow,
            {
              toValue: 0.7,
              duration: 900,
              useNativeDriver:
                Platform.OS !== 'web',
            }
          ),

          Animated.timing(
            glow,
            {
              toValue: 0.35,
              duration: 900,
              useNativeDriver:
                Platform.OS !== 'web',
            }
          ),
        ])
      );


    rotateAnimation.start();
    pulseAnimation.start();
    glowAnimation.start();


    return () => {

      rotateAnimation.stop();
      pulseAnimation.stop();
      glowAnimation.stop();

      rotate.setValue(0);
      pulse.setValue(0.8);
      glow.setValue(0.35);

    };

  }, [
    actionLoading,
    rotate,
    pulse,
    glow,
  ]);


  if (!actionLoading) {
    return null;
  }


  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: [
      '0deg',
      '360deg',
    ],
  });


  return (
    <View
      style={styles.loaderOverlay}
    >

      <View style={styles.loaderBackdrop} />


      <Animated.View
        style={[
          styles.loaderGlow,
          {
            opacity: glow,
            transform: [
              {
                scale: pulse,
              },
            ],
          },
        ]}
      />


      <View style={styles.loaderCard}>

        {/* VEDA MARK */}

        <View style={styles.loaderLogoWrap}>

          <Animated.View
            style={[
              styles.loaderRing,
              {
                transform: [
                  {
                    rotate: spin,
                  },
                ],
              },
            ]}
          />

          <View style={styles.loaderLogo}>
            <Text style={styles.loaderLogoText}>
              V
            </Text>
          </View>

        </View>


        {/* TITLE */}

        <Text
          style={styles.loaderTitle}
          numberOfLines={2}
        >
          {actionMessage ||
            'Please wait...'}
        </Text>


        {/* DESCRIPTION */}

        <Text
          style={styles.loaderSubTitle}
          numberOfLines={3}
        >
          {actionSubMessage ||
            'Veda is processing your request.'}
        </Text>


        {/* DOTS */}

        <View style={styles.loaderDots}>

          <LoadingDot delay={0} />

          <LoadingDot delay={180} />

          <LoadingDot delay={360} />

        </View>


        <View style={styles.secureRow}>

          <Text style={styles.secureIcon}>
            ✓
          </Text>

          <Text style={styles.secureText}>
            Secure Veda connection
          </Text>

        </View>

      </View>

    </View>
  );
}


/* =================================================
   LOADING DOT
================================================= */

function LoadingDot({ delay = 0 }) {

  const opacity = useRef(
    new Animated.Value(0.3)
  ).current;


  useEffect(() => {

    const animation =
      Animated.loop(
        Animated.sequence([

          Animated.delay(delay),

          Animated.timing(
            opacity,
            {
              toValue: 1,
              duration: 400,
              useNativeDriver:
                Platform.OS !== 'web',
            }
          ),

          Animated.timing(
            opacity,
            {
              toValue: 0.3,
              duration: 400,
              useNativeDriver:
                Platform.OS !== 'web',
            }
          ),

        ])
      );


    animation.start();


    return () => {
      animation.stop();
    };

  }, [delay, opacity]);


  return (
    <Animated.View
      style={[
        styles.loaderDot,
        {
          opacity,
        },
      ]}
    />
  );
}


/* =================================================
   FOOTER
================================================= */

function Footer() {

  const openAlphaAryX = () => {

    Linking.openURL(
      'https://alphaaryx.vercel.app/'
    );

  };


  return (
    <View style={styles.footer}>

      <Text style={styles.footerBrand}>
        Veda
      </Text>


      <Pressable
        onPress={openAlphaAryX}
        hitSlop={8}
      >

        <Text style={styles.footerCompany}>
          A Product by AlphaAryX ↗
        </Text>

      </Pressable>


      <Text style={styles.footerCopyright}>
        © 2026 AlphaAryX • Smart Digital
        Healthcare
      </Text>

    </View>
  );
}


/* =================================================
   INPUT
================================================= */

export const Input = ({
  label,
  ...props
}) => {

  return (
    <View style={styles.field}>

      {label ? (
        <Text style={styles.label}>
          {label}
        </Text>
      ) : null}


      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#9AA9BB"
        selectionColor={colors.blue}
      />

    </View>
  );
};


/* =================================================
   BUTTON
================================================= */

export const Button = ({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
  loading = false,
  loadingText = 'Please wait...',
}) => {

  const scale = useRef(
    new Animated.Value(1)
  ).current;


  const isDisabled =
    disabled || loading;


  const handlePress = () => {

    if (isDisabled) {
      return;
    }


    if (typeof onPress !== 'function') {
      return;
    }


    onPress();

  };


  const handlePressIn = () => {

    if (isDisabled) {
      return;
    }


    Animated.spring(
      scale,
      {
        toValue: 0.98,

        useNativeDriver:
          Platform.OS !== 'web',

        speed: 30,
      }
    ).start();

  };


  const handlePressOut = () => {

    Animated.spring(
      scale,
      {
        toValue: 1,

        useNativeDriver:
          Platform.OS !== 'web',

        speed: 24,
      }
    ).start();

  };


  return (
    <Animated.View
      style={[
        styles.buttonAnimation,
        {
          transform: [
            {
              scale,
            },
          ],
        },
      ]}
    >

      <Pressable
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          secondary &&
            styles.secondary,
          danger &&
            styles.danger,
          isDisabled &&
            styles.disabled,
        ]}
      >

        {loading ? (

          <View style={styles.buttonLoading}>

            <ActivityIndicator
              size="small"
              color={
                secondary || danger
                  ? colors.blue
                  : colors.white
              }
            />

            <Text
              style={[
                styles.buttonText,
                secondary &&
                  styles.secondaryText,
                danger &&
                  styles.dangerText,
                styles.buttonLoadingText,
              ]}
            >
              {loadingText}
            </Text>

          </View>

        ) : (

          <Text
            style={[
              styles.buttonText,
              secondary &&
                styles.secondaryText,
              danger &&
                styles.dangerText,
            ]}
          >

            {icon
              ? `${icon}  `
              : ''}

            {title}

          </Text>

        )}

      </Pressable>

    </Animated.View>
  );
};


/* =================================================
   CARD
================================================= */

export const Card = ({
  children,
  accent = false,
}) => {

  return (
    <View
      style={[
        styles.card,
        accent &&
          styles.accentCard,
      ]}
    >
      {children}
    </View>
  );
};


/* =================================================
   BASIC LOADING
================================================= */

export const Loading = ({
  text = 'Loading...',
}) => {

  return (
    <View style={styles.basicLoading}>

      <ActivityIndicator
        size="large"
        color={colors.blue}
      />

      <Text style={styles.basicLoadingText}>
        {text}
      </Text>

    </View>
  );
};


/* =================================================
   FADE IN
================================================= */

export const FadeIn = ({
  children,
  delay = 0,
}) => {

  const opacity = useRef(
    new Animated.Value(0)
  ).current;


  const translate = useRef(
    new Animated.Value(10)
  ).current;


  useEffect(() => {

    Animated.parallel([

      Animated.timing(
        opacity,
        {
          toValue: 1,
          duration: 420,
          delay,

          useNativeDriver:
            Platform.OS !== 'web',
        }
      ),

      Animated.timing(
        translate,
        {
          toValue: 0,
          duration: 420,
          delay,

          useNativeDriver:
            Platform.OS !== 'web',
        }
      ),

    ]).start();

  }, [
    delay,
    opacity,
    translate,
  ]);


  return (
    <Animated.View
      style={[
        styles.fadeIn,
        {
          opacity,

          transform: [
            {
              translateY: translate,
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};


/* =================================================
   SHADOW
================================================= */

const shadow = Platform.select({

  web: {
    boxShadow:
      '0 16px 36px rgba(15, 23, 42, 0.08)',
  },

  default: {
    elevation: 4,

    shadowColor: '#0F172A',

    shadowOpacity: 0.08,

    shadowRadius: 16,

    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

});


/* =================================================
   STYLES
================================================= */

const styles = StyleSheet.create({

  flex: {
    flex: 1,
    minHeight: 0,
  },


  safeArea: {
    flex: 1,
    backgroundColor: colors.wash,
  },


  headerSlot: {
    width: '100%',
    flexShrink: 0,
  },


  contentSlot: {
    flex: 1,
    minHeight: 0,
  },


  screen: {
    flex: 1,
    backgroundColor: colors.wash,
  },


  scroll: {
    flexGrow: 1,

    paddingTop: 16,
    paddingBottom: 20,
  },


  screenInner: {
    width: '100%',

    alignSelf: 'center',

    paddingBottom: 4,
  },


  fadeIn: {
    width: '100%',

    alignSelf: 'stretch',
  },


  /* =========================
     GLOBAL LOADER
  ========================== */

  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 99999,

    elevation: 99999,
  },


  loaderBackdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      'rgba(7, 15, 30, 0.72)',
  },


  loaderGlow: {
    position: 'absolute',

    width: 250,
    height: 250,

    borderRadius: 125,

    backgroundColor:
      'rgba(37, 99, 235, 0.18)',
  },


  loaderCard: {
    width: '88%',
    maxWidth: 390,

    backgroundColor: colors.white,

    borderRadius: 26,

    paddingHorizontal: 24,
    paddingVertical: 28,

    alignItems: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.8)',

    ...Platform.select({

      web: {
        boxShadow:
          '0 25px 70px rgba(0,0,0,0.28)',
      },

      default: {
        elevation: 18,

        shadowColor: '#000',

        shadowOpacity: 0.22,

        shadowRadius: 30,

        shadowOffset: {
          width: 0,
          height: 14,
        },
      },

    }),
  },


  loaderLogoWrap: {
    width: 82,
    height: 82,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 19,
  },


  loaderRing: {
    position: 'absolute',

    width: 78,
    height: 78,

    borderRadius: 39,

    borderWidth: 3,

    borderColor:
      '#DCEBFF',

    borderTopColor:
      colors.blue,

    borderRightColor:
      colors.cyan,
  },


  loaderLogo: {
    width: 54,
    height: 54,

    borderRadius: 17,

    backgroundColor: colors.ink,

    alignItems: 'center',
    justifyContent: 'center',

    ...Platform.select({

      web: {
        boxShadow:
          '0 8px 20px rgba(29,78,216,0.20)',
      },

      default: {
        elevation: 7,
      },

    }),
  },


  loaderLogoText: {
    color: colors.white,

    fontSize: 25,

    fontWeight: '900',

    letterSpacing: -1,
  },


  loaderTitle: {
    color: colors.ink,

    fontSize: 18,

    fontWeight: '900',

    textAlign: 'center',

    lineHeight: 24,

    marginBottom: 7,
  },


  loaderSubTitle: {
    color: colors.muted,

    fontSize: 12,

    lineHeight: 18,

    textAlign: 'center',

    maxWidth: 300,
  },


  loaderDots: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 17,

    marginBottom: 17,
  },


  loaderDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: colors.blue,

    marginHorizontal: 3,
  },


  secureRow: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F0FDF9',

    borderRadius: 20,

    paddingHorizontal: 11,
    paddingVertical: 6,
  },


  secureIcon: {
    color: '#16A34A',

    fontSize: 11,

    fontWeight: '900',

    marginRight: 5,
  },


  secureText: {
    color: '#15803D',

    fontSize: 10,

    fontWeight: '800',
  },


  /* =========================
     BASIC LOADING
  ========================== */

  basicLoading: {
    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 35,
  },


  basicLoadingText: {
    color: colors.muted,

    fontSize: 13,

    fontWeight: '700',

    marginTop: 10,
  },


  /* =========================
     INPUT
  ========================== */

  field: {
    width: '100%',

    marginBottom: 14,
  },


  label: {
    fontSize: 12,

    fontWeight: '800',

    letterSpacing: 0.4,

    color: colors.muted,

    marginBottom: 7,

    textTransform: 'uppercase',
  },


  input: {
    width: '100%',

    backgroundColor: colors.white,

    borderWidth: 1,

    borderColor: colors.line,

    borderRadius: 14,

    paddingHorizontal: 15,

    paddingVertical: 14,

    minHeight: 52,

    fontSize: 16,

    color: colors.ink,
  },


  /* =========================
     BUTTON
  ========================== */

  buttonAnimation: {
    width: '100%',

    alignSelf: 'stretch',
  },


  button: {
    width: '100%',

    alignSelf: 'stretch',

    backgroundColor: colors.blue,

    paddingVertical: 15,

    paddingHorizontal: 18,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 6,
    marginBottom: 6,

    minHeight: 52,
  },


  secondary: {
    backgroundColor: '#EAF4FF',
  },


  danger: {
    backgroundColor: '#FDECEF',
  },


  disabled: {
    opacity: 0.48,
  },


  buttonText: {
    color: colors.white,

    fontWeight: '900',

    fontSize: 15,

    letterSpacing: 0.25,

    textAlign: 'center',
  },


  secondaryText: {
    color: colors.blue,
  },


  dangerText: {
    color: colors.danger,
  },


  buttonLoading: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },


  buttonLoadingText: {
    marginLeft: 9,
  },


  /* =========================
     CARD
  ========================== */

  card: [
    {
      width: '100%',

      backgroundColor: colors.white,

      borderRadius: 20,

      padding: 18,

      marginBottom: 14,

      borderWidth: 1,

      borderColor:
        'rgba(221, 231, 245, 0.9)',
    },

    shadow,
  ],


  accentCard: {
    borderLeftWidth: 4,

    borderLeftColor:
      colors.cyan,
  },


  /* =========================
     FOOTER
  ========================== */

  footer: {
    width: '100%',

    alignItems: 'center',

    paddingTop: 18,

    paddingBottom: 20,

    marginTop: 6,
  },


  footerBrand: {
    color: colors.ink,

    fontSize: 18,

    fontWeight: '900',
  },


  footerCompany: {
    color: colors.blue,

    fontSize: 12,

    fontWeight: '800',

    marginTop: 3,
  },


  footerCopyright: {
    color: colors.muted,

    fontSize: 10,

    marginTop: 5,

    textAlign: 'center',
  },

});