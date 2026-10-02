import React, {
  useState,
} from 'react';

import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  Text,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import {
  Button,
  Card,
  FadeIn,
  Input,
  Screen,
  colors,
} from '../components/UI';

import { useAuth } from '../context/AuthContext';

export default function Login({
  navigation,
}) {

  const {
    login,
    requestAccess,
    actionLoading,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [accessDisabled, setAccessDisabled] =
    useState(false);

  const [requestSent, setRequestSent] =
    useState(false);

  const [inactiveDoctor, setInactiveDoctor] =
    useState(null);

  const [paymentProof, setPaymentProof] =
    useState(null);

  const isBusy =
    busy || actionLoading;

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

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

      setAccessDisabled(false);
      setRequestSent(false);
      setInactiveDoctor(null);

      await login(
        email.trim(),
        password
      );

    } catch (e) {

      const code =
        e.response?.data?.code;

      if (
        code ===
        'ACCESS_DISABLED'
      ) {

        setAccessDisabled(true);
        setInactiveDoctor(
          e.response?.data?.doctor || null
        );

        return;
      }

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

  /*
  |--------------------------------------------------------------------------
  | REQUEST ACCESS
  |--------------------------------------------------------------------------
  */

  const choosePaymentProof = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo access to attach a payment screenshot.'
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.45,
          base64: true,
        });

      if (result.canceled) {
        return;
      }

      const image = result.assets?.[0];

      if (!image?.base64) {
        Alert.alert(
          'Image unavailable',
          'Please select another payment screenshot.'
        );
        return;
      }

      const resizeAction =
        image.width >= image.height
          ? { resize: { width: 1200 } }
          : { resize: { height: 1200 } };

      const compressedImage =
        await ImageManipulator.manipulateAsync(
          image.uri,
          [resizeAction],
          {
            compress: 0.55,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

      if (!compressedImage.base64) {
        Alert.alert(
          'Image unavailable',
          'Please select another payment screenshot.'
        );
        return;
      }

      setPaymentProof({
        data: compressedImage.base64,
        contentType: 'image/jpeg',
        fileName: 'payment-proof.jpg',
        uri: compressedImage.uri,
      });
    } catch (error) {
      Alert.alert(
        'Unable to select image',
        error.message ||
          'Please try selecting the screenshot again.'
      );
    }
  };

  const paymentDue = (() => {
    if (!inactiveDoctor || inactiveDoctor.paymentStatus === 'paid') {
      return false;
    }

    if (inactiveDoctor.paymentReminderRequested) {
      return true;
    }

    if (!inactiveDoctor.nextPaymentDate) {
      return true;
    }

    const nextPaymentDate =
      new Date(inactiveDoctor.nextPaymentDate);

    return (
      !Number.isNaN(nextPaymentDate.getTime()) &&
      nextPaymentDate <= new Date()
    );
  })();

  const sendAccessRequest =
    async () => {

      if (
        isBusy ||
        !email.trim() ||
        !password
      ) {
        Alert.alert(
          'Details required',
          'Enter your email and password first.'
        );

        return;
      }

      try {

        Keyboard.dismiss();

        setBusy(true);

        const result =
          await requestAccess(
            email.trim(),
            password,
            {
              paymentProof: paymentProof
                ? {
                    data: paymentProof.data,
                    contentType:
                      paymentProof.contentType,
                    fileName:
                      paymentProof.fileName,
                  }
                : undefined,
            }
          );

        setRequestSent(true);

        Alert.alert(
          'Request sent',
          result?.message ||
            'Your access request has been sent to the administrator.'
        );

      } catch (error) {

        Alert.alert(
          'Request failed',
          error.response?.data?.message ||
            error.message ||
            'Unable to send access request.'
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

          {/* INTRO */}

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

          {/* LOGIN */}

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
              onChangeText={(value) => {
                setEmail(value);
                setAccessDisabled(false);
                setRequestSent(false);
                setInactiveDoctor(null);
                setPaymentProof(null);
              }}
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
              onChangeText={(value) => {
                setPassword(value);
                setAccessDisabled(false);
                setRequestSent(false);
                setInactiveDoctor(null);
                setPaymentProof(null);
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={go}
              editable={!isBusy}
              placeholder="Enter your password"
            />

            {/* ACCESS DISABLED */}

            {accessDisabled && (
              <View
                style={{
                  backgroundColor: '#FFF7F8',
                  borderWidth: 1,
                  borderColor: '#F0CDD3',
                  borderRadius: 15,
                  padding: 14,
                  marginBottom: 14,
                }}
              >

                <Text
                  style={{
                    color: '#8E2633',
                    fontSize: 14,
                    fontWeight: '900',
                  }}
                >
                  Veda access is inactive
                </Text>

                <Text
                  style={{
                    color: '#9A626A',
                    fontSize: 10.5,
                    lineHeight: 16,
                    marginTop: 5,
                  }}
                >
                  Your doctor account and clinical
                  records are preserved. You can
                  request access from the administrator.
                </Text>

                {paymentDue && (
                  <View
                    style={{
                      backgroundColor: '#FFF2D8',
                      borderRadius: 11,
                      padding: 12,
                      marginTop: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: '#805514',
                        fontSize: 12,
                        fontWeight: '900',
                      }}
                    >
                      Payment due
                    </Text>
                    <Text
                      style={{
                        color: '#8D6A34',
                        fontSize: 11,
                        lineHeight: 17,
                        marginTop: 4,
                      }}
                    >
                      Complete your payment to request access. You may attach a screenshot for admin review.
                    </Text>
                  </View>
                )}

                {!requestSent && (
                  <View style={{ marginTop: 12 }}>
                    <Pressable
                      onPress={choosePaymentProof}
                      disabled={isBusy}
                      style={({ pressed }) => ({
                        minHeight: 44,
                        borderWidth: 1,
                        borderColor: '#CBD9E3',
                        borderStyle: 'dashed',
                        borderRadius: 11,
                        paddingHorizontal: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text
                        style={{
                          color: colors.ink,
                          fontSize: 11,
                          fontWeight: '800',
                        }}
                      >
                        {paymentProof
                          ? 'Replace payment screenshot'
                          : 'Attach payment screenshot (optional)'}
                      </Text>
                    </Pressable>

                    {paymentProof && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 9,
                        }}
                      >
                        <Image
                          source={{ uri: paymentProof.uri }}
                          style={{
                            width: 58,
                            height: 58,
                            borderRadius: 9,
                            backgroundColor: '#E8EEF2',
                          }}
                        />
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            color: colors.muted,
                            fontSize: 10,
                            marginHorizontal: 9,
                          }}
                        >
                          {paymentProof.fileName}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Remove payment screenshot"
                          onPress={() => setPaymentProof(null)}
                          hitSlop={8}
                        >
                          <Text
                            style={{
                              color: '#A62F3D',
                              fontSize: 12,
                              fontWeight: '800',
                            }}
                          >
                            Remove
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                {requestSent ? (

                  <View
                    style={{
                      backgroundColor: '#FFF4DF',
                      borderRadius: 11,
                      paddingVertical: 11,
                      paddingHorizontal: 10,
                      marginTop: 12,
                      alignItems: 'center',
                    }}
                  >

                    <Text
                      style={{
                        color: '#9B6C1D',
                        fontSize: 10,
                        fontWeight: '900',
                      }}
                    >
                      ✓ ACCESS REQUEST SENT
                    </Text>

                  </View>

                ) : (

                  <Pressable
                    onPress={
                      sendAccessRequest
                    }
                    disabled={isBusy}
                    style={({ pressed }) => ({
                      minHeight: 46,
                      borderRadius: 12,
                      backgroundColor:
                        colors.blue,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 12,
                      opacity:
                        isBusy
                          ? 0.55
                          : pressed
                            ? 0.75
                            : 1,
                    })}
                  >

                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: '900',
                      }}
                    >
                      {isBusy
                        ? 'Sending request...'
                        : 'REQUEST ACCESS'}
                    </Text>

                  </Pressable>

                )}

              </View>
            )}

            {/* SIGN IN */}

            {!accessDisabled && (

              <Button
                title="SIGN IN"
                onPress={go}
                loading={isBusy}
                loadingText="Signing in..."
                disabled={isBusy}
              />

            )}

            {/* RETRY LOGIN */}

            {accessDisabled && !requestSent && (

              <Pressable
                onPress={() =>
                  setAccessDisabled(false)
                }
                disabled={isBusy}
                style={{
                  width: '100%',
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >

                <Text
                  style={{
                    color: colors.blue,
                    fontWeight: '900',
                    fontSize: 12,
                  }}
                >
                  ← Back to sign in
                </Text>

              </Pressable>

            )}

            {/* REGISTER */}

            {!accessDisabled && (

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

            )}

          </Card>

          {/* SECURITY */}

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