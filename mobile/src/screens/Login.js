import React, { useState } from 'react';

import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  View,
} from 'react-native';

import {
  Button,
  Card,
  FadeIn,
  Input,
  Screen,
  colors,
} from '../components/UI';

import { useAuth } from '../context/AuthContext';


export default function Login({ navigation }) {

  const {
    login,
    actionLoading,
  } = useAuth();


  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [busy, setBusy] =
    useState(false);


  const isBusy =
    busy || actionLoading;


  const go = async () => {

    if (isBusy) {
      return;
    }


    if (
      !email.trim() ||
      !password
    ) {

      Alert.alert(
        'Missing details',
        'Please enter your email and password.'
      );

      return;
    }


    try {

      Keyboard.dismiss();

      setBusy(true);


      await login(
        email.trim(),
        password
      );

    } catch (e) {

      Alert.alert(
        'Login failed',
        e.response?.data?.message ||
          e.message ||
          'Unable to login. Please try again.'
      );

    } finally {

      setBusy(false);

    }

  };


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

          {/* =================================
              INTRO
          ================================== */}

          <View
            style={{
              marginBottom: 20,
            }}
          >

            <Text
              style={{
                fontSize: 13,
                fontWeight: '900',
                letterSpacing: 1.5,
                color: colors.cyan,
              }}
            >
              VEDA  /  CLINICAL WORKSPACE
            </Text>


            <Text
              style={{
                fontSize: 38,
                lineHeight: 44,
                fontWeight: '900',
                color: colors.ink,
                marginTop: 10,
              }}
            >
              Care, organized.
            </Text>


            <Text
              style={{
                fontSize: 15,
                lineHeight: 23,
                color: colors.muted,
                marginTop: 8,
              }}
            >
              A calmer way to manage
              prescriptions, patients,
              and practice insights.
            </Text>

          </View>


          {/* =================================
              LOGIN CARD
          ================================== */}

          <Card accent>

            <Text
              style={{
                fontSize: 21,
                fontWeight: '900',
                color: colors.ink,
                marginBottom: 18,
              }}
            >
              Welcome back
            </Text>


            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              editable={!isBusy}
              placeholder="Enter your email"
            />


            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={go}
              editable={!isBusy}
              placeholder="Enter your password"
            />


            {/* SIGN IN */}

            <Button
              title="SIGN IN"
              onPress={go}
              loading={isBusy}
              loadingText="Signing in..."
              disabled={isBusy}
            />


            {/* REGISTER */}

            <Pressable
              onPress={() =>
                navigation.navigate(
                  'Register'
                )
              }
              disabled={isBusy}
              style={({ pressed }) => ({
                width: '100%',
                paddingVertical: 14,

                opacity:
                  isBusy
                    ? 0.45
                    : pressed
                      ? 0.65
                      : 1,
              })}
            >

              <Text
                style={{
                  textAlign: 'center',
                  color: colors.blue,
                  fontWeight: '900',
                  fontSize: 14,
                }}
              >
                Create a doctor account →
              </Text>

            </Pressable>

          </Card>


          {/* =================================
              SECURITY NOTE
          ================================== */}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',

              marginTop: 12,
            }}
          >

            <Text
              style={{
                color: '#16A34A',
                fontSize: 12,
                fontWeight: '900',
                marginRight: 5,
              }}
            >
              ✓
            </Text>

            <Text
              style={{
                textAlign: 'center',
                fontSize: 11,
                lineHeight: 17,
                color: colors.muted,
              }}
            >
              Secure access for approved
              clinical teams
            </Text>

          </View>

        </View>

      </FadeIn>

    </Screen>
  );
}