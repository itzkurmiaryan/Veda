import React, { useEffect, useRef } from 'react';

import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

export const colors = {
  ink: '#10233F',
  muted: '#6B7A90',
  blue: '#1769FF',
  cyan: '#17C3B2',
  wash: '#F4F8FC',
  line: '#DFE8F2',
  white: '#FFFFFF',
  danger: '#D94A61',
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

  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {inner}
      </ScrollView>
    );
  }

  return <View style={styles.screen}>{inner}</View>;
};

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

export const Button = ({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
}) => {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const handlePress = () => {
    console.log('🟢 BUTTON PRESSED:', title);

    if (disabled) {
      console.log('⚠️ BUTTON IS DISABLED:', title);
      return;
    }

    if (typeof onPress !== 'function') {
      console.log(
        '❌ NO onPress FUNCTION:',
        title
      );
      return;
    }

    console.log(
      '➡️ Executing onPress:',
      title
    );

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
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
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

export const Card = ({
  children,
  accent = false,
}) => {
  return (
    <View
      style={[
        styles.card,
        accent && styles.accentCard,
      ]}
    >
      {children}
    </View>
  );
};

export const Loading = () => {
  return (
    <ActivityIndicator
      size="large"
      color={colors.blue}
      style={{ margin: 34 }}
    />
  );
};

export const FadeIn = ({
  children,
  delay = 0,
}) => {
  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  const translate = useRef(
    new Animated.Value(12)
  ).current;

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
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          {
            translateY: translate,
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

const shadow = Platform.select({
  web: {
    boxShadow:
      '0 10px 28px rgba(16,35,63,.08)',
  },

  default: {
    elevation: 3,
    shadowColor: '#10233F',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.wash,
  },

  scroll: {
    padding: 14,
    paddingBottom: 34,
  },

  screenInner: {
    width: '100%',
    alignSelf: 'center',
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
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
  },

  button: {
    backgroundColor: colors.blue,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 6,
    minHeight: 52,
    justifyContent: 'center',
  },

  secondary: {
    backgroundColor: '#E8F1FF',
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
    letterSpacing: 0.3,
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
    },
    shadow,
  ],

  accentCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.cyan,
  },
});