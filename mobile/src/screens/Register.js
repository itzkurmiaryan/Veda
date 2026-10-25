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
  const { register, showLoading, showSuccess, showError } = useAuth();

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
    if (!b.name.trim() || !b.email.trim() || !b.password) {
      showError(
        'Missing Details',
        'Please provide at least your Full Name, Email, and Password.'
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setBusy(true);

      showLoading(
        'Submitting Registration...',
        'Sending your doctor account details to Veda cloud...'
      );

      const result =
        await register(b);

      showSuccess(
        'Registration Submitted!',
        result?.message || 'Your account has been submitted for admin approval. You can log in once verified.',
        () => navigation.navigate('Login'),
        'GO TO LOGIN'
      );
    } catch (e) {
      showError(
        'Registration Failed',
        e.response?.data?.message ||
          e.message ||
          'Unable to submit registration. Please try again.'
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