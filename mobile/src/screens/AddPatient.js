import React, { useState } from 'react';

import {
  Alert,
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

import { api } from '../api/api';

import { useAuth } from '../context/AuthContext';
import AccessRequiredModal from '../components/AccessRequiredModal';

export default function AddPatient({ navigation }) {
  const {
    startAction,
    stopAction,
    actionLoading,
  } = useAuth();

  const [b, setB] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: 'Male',
    address: '',
  });

  const [busy, setBusy] = useState(false);
  const [accessPromptVisible, setAccessPromptVisible] =
    useState(false);

  const isBusy = busy || actionLoading;

  const set = (key, value) => {
    setB((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const save = async () => {
    if (isBusy) {
      return;
    }

    if (!b.name.trim() || !b.age.trim()) {
      Alert.alert(
        'Required',
        'Name and age are required.'
      );
      return;
    }

    try {
      setBusy(true);

      startAction(
        'Creating patient record...',
        'Saving the patient information securely.'
      );

      const r = await api.post('/patients', {
        ...b,
        name: b.name.trim(),
        mobile: b.mobile.trim(),
        age: Number(b.age),
        gender: b.gender.trim(),
        address: b.address.trim(),
      });

      startAction(
        'Patient created successfully...',
        'Opening the new patient record.'
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 450)
      );

      navigation.replace(
        'PatientDetail',
        {
          id: r.data.data._id,
        }
      );
    } catch (e) {
      if (
        e.response?.data?.code ===
        'ACCESS_DISABLED'
      ) {
        setAccessPromptVisible(true);
        return;
      }

      Alert.alert(
        'Unable to create patient',
        e.response?.data?.message ||
          e.message ||
          'Something went wrong.'
      );
    } finally {
      setBusy(false);
      stopAction();
    }
  };

  return (
    <Screen scroll>
      <FadeIn>
        <View
          style={{
            width: '100%',
            paddingTop: 8,
            paddingBottom: 20,
          }}
        >
          {/* PAGE HEADER */}
          <View
            style={{
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '900',
                letterSpacing: 1.5,
                color: colors.cyan,
              }}
            >
              VEDA / PATIENTS
            </Text>

            <Text
              style={{
                fontSize: 32,
                lineHeight: 38,
                fontWeight: '900',
                color: colors.ink,
                marginTop: 8,
              }}
            >
              Add New Patient
            </Text>

            <Text
              style={{
                fontSize: 14,
                lineHeight: 21,
                color: colors.muted,
                marginTop: 7,
              }}
            >
              Create a secure patient record
              for your clinical workspace.
            </Text>
          </View>

          {/* FORM */}
          <Card accent>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '900',
                color: colors.ink,
                marginBottom: 18,
              }}
            >
              Patient Information
            </Text>

            <Input
              label="Patient Name *"
              value={b.name}
              onChangeText={(value) =>
                set('name', value)
              }
              editable={!isBusy}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Enter patient name"
            />

            <Input
              label="Mobile Number"
              value={b.mobile}
              onChangeText={(value) =>
                set('mobile', value)
              }
              keyboardType="phone-pad"
              editable={!isBusy}
              placeholder="Enter mobile number"
              maxLength={15}
            />

            <Input
              label="Age *"
              value={b.age}
              onChangeText={(value) =>
                set(
                  'age',
                  value.replace(/[^0-9]/g, '')
                )
              }
              keyboardType="numeric"
              editable={!isBusy}
              placeholder="Enter age"
              maxLength={3}
            />

            <Input
              label="Gender"
              value={b.gender}
              onChangeText={(value) =>
                set('gender', value)
              }
              editable={!isBusy}
              placeholder="Male / Female / Other"
            />

            <Input
              label="Address"
              value={b.address}
              onChangeText={(value) =>
                set('address', value)
              }
              editable={!isBusy}
              placeholder="Enter patient address"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                minHeight: 90,
              }}
            />

            <View
              style={{
                marginTop: 6,
              }}
            >
              <Button
                title="CREATE PATIENT"
                onPress={save}
                loading={isBusy}
                loadingText="Creating patient..."
                disabled={isBusy}
              />
            </View>
          </Card>

          {/* SECURITY NOTE */}
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 6,
              paddingBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                lineHeight: 17,
                color: colors.muted,
                textAlign: 'center',
              }}
            >
              ✓ Patient information is handled
              through your secure Veda workspace.
            </Text>
          </View>
        </View>
      </FadeIn>
      <AccessRequiredModal
        visible={accessPromptVisible}
        onClose={() => setAccessPromptVisible(false)}
      />
    </Screen>
  );
}