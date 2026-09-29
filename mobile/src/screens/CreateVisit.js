import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  Alert,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { api } from '../api/api';
import { Input, Button, Card } from '../components/UI';
import AppHeader from '../components/AppHeader';

export default function CreateVisit({ route, navigation }) {
  const p = route.params.patient;

  const [sym, setSym] = useState('');
  const [diag, setDiag] = useState('');

  const [v, setV] = useState({
    bp: '',
    weight: '',
    temperature: '',
    sugar: '',
  });

  const [meds, setMeds] = useState([]);

  const [m, setM] = useState({
    name: '',
    strength: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  const [advice, setAdvice] = useState('');
  const [busy, setBusy] = useState(false);

  const setVt = (k, x) => {
    setV((a) => ({
      ...a,
      [k]: x,
    }));
  };

  const add = () => {
    if (!m.name.trim()) {
      Alert.alert('Medicine required', 'Please enter medicine name.');
      return;
    }

    setMeds((a) => [...a, m]);

    setM({
      name: '',
      strength: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
  };

  const save = async () => {
    try {
      setBusy(true);

      const r = await api.post('/visits', {
        patientId: p._id,

        symptoms: sym
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),

        diagnosis: diag
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),

        vitals: v,
        medicines: meds,

        advice: advice
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      });

      navigation.replace('VisitDetail', {
        id: r.data.data._id,
      });
    } catch (e) {
      Alert.alert(
        'Save failed',
        e.response?.data?.message || e.message
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <AppHeader
        title="New Prescription"
        navigation={navigation}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 18,
            paddingBottom: 40,
          }}
        >
          {/* PATIENT */}
          <Card>
            <Text
              style={{
                fontSize: 21,
                fontWeight: '900',
              }}
            >
              {p.name}
            </Text>

            <Text
              style={{
                marginTop: 5,
                color: '#64748b',
              }}
            >
              {p.age} Years • {p.gender} • {p.patientId}
            </Text>
          </Card>

          {/* SYMPTOMS */}
          <Input
            label="Symptoms (comma separated)"
            value={sym}
            onChangeText={setSym}
            placeholder="Fever, Headache"
          />

          {/* DIAGNOSIS */}
          <Input
            label="Diagnosis (comma separated)"
            value={diag}
            onChangeText={setDiag}
            placeholder="Viral Fever"
          />

          {/* VITALS */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '900',
              marginVertical: 8,
              color: '#0f172a',
            }}
          >
            Vitals
          </Text>

          <Input
            label="BP"
            value={v.bp}
            onChangeText={(x) => setVt('bp', x)}
            placeholder="120/80"
          />

          <Input
            label="Weight"
            value={v.weight}
            onChangeText={(x) => setVt('weight', x)}
            placeholder="70 kg"
          />

          <Input
            label="Temperature"
            value={v.temperature}
            onChangeText={(x) => setVt('temperature', x)}
            placeholder="98.6 °F"
          />

          <Input
            label="Sugar"
            value={v.sugar}
            onChangeText={(x) => setVt('sugar', x)}
            placeholder="100 mg/dL"
          />

          {/* MEDICINE */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '900',
              marginVertical: 8,
              color: '#0f172a',
            }}
          >
            Medicine
          </Text>

          <Input
            label="Medicine"
            value={m.name}
            onChangeText={(x) =>
              setM((a) => ({
                ...a,
                name: x,
              }))
            }
            placeholder="Paracetamol"
          />

          <Input
            label="Strength"
            value={m.strength}
            onChangeText={(x) =>
              setM((a) => ({
                ...a,
                strength: x,
              }))
            }
            placeholder="500 mg"
          />

          <Input
            label="Dosage"
            value={m.dosage}
            onChangeText={(x) =>
              setM((a) => ({
                ...a,
                dosage: x,
              }))
            }
            placeholder="1 tablet"
          />

          <Input
            label="Frequency"
            value={m.frequency}
            onChangeText={(x) =>
              setM((a) => ({
                ...a,
                frequency: x,
              }))
            }
            placeholder="Twice daily"
          />

          <Input
            label="Duration"
            value={m.duration}
            onChangeText={(x) =>
              setM((a) => ({
                ...a,
                duration: x,
              }))
            }
            placeholder="5 days"
          />

          <Input
            label="Instructions"
            value={m.instructions}
            onChangeText={(x) =>
              setM((a) => ({
                ...a,
                instructions: x,
              }))
            }
            placeholder="After food"
          />

          <Button
            title="＋ ADD MEDICINE"
            secondary
            onPress={add}
          />

          {/* ADDED MEDICINES */}
          {meds.map((x, i) => (
            <Card key={i}>
              <Text
                style={{
                  fontWeight: '900',
                  color: '#0f172a',
                }}
              >
                {i + 1}. {x.name} {x.strength}
              </Text>

              <Text style={{ marginTop: 4 }}>
                {x.dosage} • {x.frequency} • {x.duration}
              </Text>

              {!!x.instructions && (
                <Text
                  style={{
                    marginTop: 4,
                    color: '#64748b',
                  }}
                >
                  {x.instructions}
                </Text>
              )}
            </Card>
          ))}

          {/* ADVICE */}
          <Input
            label="Advice (comma separated)"
            value={advice}
            onChangeText={setAdvice}
            placeholder="Take rest, Drink water"
          />

          {/* SAVE */}
          <Button
            title={busy ? 'Saving...' : 'SAVE PRESCRIPTION'}
            onPress={save}
            disabled={busy}
          />

          {/* FOOTER */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 24,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              © 2026 AlphaAryX • Smart Digital Healthcare
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}