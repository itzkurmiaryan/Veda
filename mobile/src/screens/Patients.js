import React, { useCallback, useState } from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/api';

import {
  Input,
  Button,
  Card,
  Loading,
  Screen,
  FadeIn,
  colors,
} from '../components/UI';

export default function Patients({ navigation }) {
  const [q, setQ] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | SEARCH PATIENTS
  |--------------------------------------------------------------------------
  */

  const search = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get('/patients', {
        params: {
          q: q.trim(),
        },
      });

      setPatients(response.data?.data || []);
    } catch (error) {
      Alert.alert(
        'Search failed',
        error.response?.data?.message ||
          error.message ||
          'Unable to search patients.'
      );
    } finally {
      setLoading(false);
    }
  }, [q]);

  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENTS WHEN SCREEN OPENS
  |--------------------------------------------------------------------------
  */

  useFocusEffect(
    useCallback(() => {
      search();
    }, [search])
  );

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  return (
    <Screen scroll>
      <FadeIn>
        {/* PAGE HEADER */}

        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>
            PATIENT MANAGEMENT
          </Text>

          <Text style={styles.title}>
            Find Patient
          </Text>

          <Text style={styles.subtitle}>
            Search patient records by name, mobile
            number or patient ID.
          </Text>
        </View>

        {/* SEARCH CARD */}

        <Card accent>
          <Text style={styles.sectionTitle}>
            Search Patient
          </Text>

          <Input
            label="Search Name / Mobile / Patient ID"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={search}
            placeholder="Enter patient name, mobile or ID"
            autoCapitalize="none"
            returnKeyType="search"
          />

          <Button
            title="SEARCH"
            onPress={search}
            disabled={loading}
          />
        </Card>

        {/* RESULTS */}

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Patient Records
          </Text>

          {!loading ? (
            <Text style={styles.resultsCount}>
              {patients.length} found
            </Text>
          ) : null}
        </View>

        {loading ? (
          <Card>
            <Loading />
          </Card>
        ) : patients.length === 0 ? (
          <Card>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>
                ◯
              </Text>

              <Text style={styles.emptyTitle}>
                No patients found
              </Text>

              <Text style={styles.emptyText}>
                Try searching with a different name,
                mobile number or patient ID.
              </Text>

              <Button
                title="ADD NEW PATIENT"
                onPress={() =>
                  navigation.navigate('AddPatient')
                }
              />
            </View>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient._id}>
              <View style={styles.patientTop}>
                <View style={styles.patientInfo}>
                  <Text
                    style={styles.patientName}
                    numberOfLines={2}
                  >
                    {patient.name}
                  </Text>

                  <Text style={styles.patientMeta}>
                    {patient.age} Years
                    {'  •  '}
                    {patient.gender}
                  </Text>
                </View>

                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>
                    {patient.patientId}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.mobileRow}>
                <Text style={styles.mobileLabel}>
                  MOBILE
                </Text>

                <Text style={styles.mobileValue}>
                  {patient.mobile || '—'}
                </Text>
              </View>

              <Button
                title="VIEW RECORD"
                onPress={() =>
                  navigation.navigate(
                    'PatientDetail',
                    {
                      id: patient._id,
                    }
                  )
                }
              />
            </Card>
          ))
        )}

        {/* ADD PATIENT */}

        <Card>
          <Text style={styles.addTitle}>
            New patient?
          </Text>

          <Text style={styles.addText}>
            Create a new patient record and start
            managing their prescriptions.
          </Text>

          <Button
            title="ADD NEW PATIENT"
            secondary
            onPress={() =>
              navigation.navigate('AddPatient')
            }
          />
        </Card>
      </FadeIn>
    </Screen>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  pageHeader: {
    marginBottom: 18,
  },

  eyebrow: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    maxWidth: 650,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },

  resultsHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },

  resultsTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },

  resultsCount: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '800',
  },

  patientTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  patientInfo: {
    flex: 1,
    paddingRight: 10,
  },

  patientName: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },

  patientMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 5,
  },

  idBadge: {
    maxWidth: 125,
    backgroundColor: '#E8F1FF',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  idBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 13,
  },

  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },

  mobileLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  mobileValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  emptyIcon: {
    color: colors.blue,
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },

  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
    maxWidth: 500,
  },

  addTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 5,
  },

  addText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
});