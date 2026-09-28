import React, { useState } from 'react';

import {
  Alert,
  Keyboard,
  Text,
  View,
} from 'react-native';

import {
  Input,
  Button,
  Card,
  FadeIn,
  Screen,
  colors,
} from '../components/UI';

import { useAuth } from '../context/AuthContext';

export default function Register({
  navigation,
}) {
  const { register } = useAuth();

  const [b, setB] =
    useState({
      name: '',
      email: '',
      phone: '',
      password: '',
      qualification: '',
      specialization: '',
      registrationNumber: '',
      clinicName: '',
      clinicAddress: '',
    });

  const [busy, setBusy] =
    useState(false);

  const set = (key, value) => {
    setB((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const go = async () => {
    try {
      Keyboard.dismiss();

      setBusy(true);

      const result =
        await register(b);

      Alert.alert(
        'Request submitted',
        result.message,
        [
          {
            text: 'Go to login',
            onPress: () =>
              navigation.navigate(
                'Login'
              ),
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        'Registration failed',
        e.response?.data?.message ||
          e.message ||
          'Unable to submit registration.'
      );
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ['name', 'Full Name'],
    ['email', 'Email'],
    ['phone', 'Mobile Number'],
    ['password', 'Password'],
    ['qualification', 'Qualification'],
    ['specialization', 'Specialization'],
    [
      'registrationNumber',
      'Medical Registration Number',
    ],
    ['clinicName', 'Clinic Name'],
    ['clinicAddress', 'Clinic Address'],
  ];

  return (
    <Screen scroll>
      <FadeIn>
        <View
          style={{
            width: '100%',
            paddingTop: 10,
            paddingBottom: 18,
          }}
        >
          <Card accent>
            <Text
              style={{
                fontSize: 26,
                lineHeight: 32,
                fontWeight: '900',
                color: colors.ink,
                marginBottom: 7,
              }}
            >
              Join Veda
            </Text>

            <Text
              style={{
                color: colors.muted,
                marginBottom: 20,
                lineHeight: 21,
                fontSize: 14,
              }}
            >
              Submit your details for
              admin approval. Your account
              becomes active after review.
            </Text>

            {fields.map(
              ([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={b[key]}
                  onChangeText={(value) =>
                    set(key, value)
                  }
                  secureTextEntry={
                    key === 'password'
                  }
                  autoCapitalize={
                    key === 'email'
                      ? 'none'
                      : 'sentences'
                  }
                  autoCorrect={false}
                  keyboardType={
                    key === 'email'
                      ? 'email-address'
                      : key === 'phone'
                      ? 'phone-pad'
                      : 'default'
                  }
                  returnKeyType="next"
                  editable={!busy}
                />
              )
            )}

            <Button
              title={
                busy
                  ? 'Sending...'
                  : 'Send approval request'
              }
              onPress={go}
              disabled={busy}
            />
          </Card>
        </View>
      </FadeIn>
    </Screen>
  );
}