import React, { useEffect, useRef } from 'react';

import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

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

export const Screen = ({
  children,
  scroll = false,
  contentStyle,
}) => {
  const { width } = useWindowDimensions();

  const inner = (
    <View
      style={[
        styles.screenInner,
        {
          maxWidth: Math.min(width - 28, 980),
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
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {inner}
    </ScrollView>
  ) : (
    <View style={styles.screen}>{inner}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.ink}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const Input = ({
  label,
  ...props
}) => {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#9AA9BB"
        selectionColor={colors.blue}
      />
    </View>
  );
};

export const Button = ({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) {
      return;
    }

    if (typeof onPress !== 'function') {
      return;
    }

    onPress();
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 24,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        disabled={disabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          secondary && styles.secondary,
          danger && styles.danger,
          disabled && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            secondary && styles.secondaryText,
            danger && styles.dangerText,
          ]}
        >
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const Card = ({ children, accent = false }) => {
  return <View style={[styles.card, accent && styles.accentCard]}>{children}</View>;
};

export const Loading = () => {
  return <ActivityIndicator size="large" color={colors.blue} style={{ margin: 34 }} />;
};

export const FadeIn = ({ children, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: translate }],
      }}
    >
      {children}
    </Animated.View>
  );
};

const shadow = Platform.select({
  web: {
    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.08)',
  },
  default: {
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.wash,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.wash,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },

  screenInner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 10,
  },

  field: {
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

  button: {
    backgroundColor: colors.blue,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
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
  },

  secondaryText: {
    color: colors.blue,
  },

  dangerText: {
    color: colors.danger,
  },

  card: [
    {
      backgroundColor: colors.white,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: 'rgba(221, 231, 245, 0.9)',
    },
    shadow,
  ],

  accentCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.cyan,
  },
});