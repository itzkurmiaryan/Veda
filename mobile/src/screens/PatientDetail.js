import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/api';

import {
  Button,
  Card,
  Loading,
  Screen,
  colors,
} from '../components/UI';

export default function PatientDetail({
  route,
  navigation,
}) {
  const id = route?.params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENT
  |--------------------------------------------------------------------------
  */

  const loadPatient = useCallback(
    async () => {
      if (!id) {
        console.log(
          '❌ PatientDetail: Patient ID missing'
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        console.log(
          '📥 Loading patient:',
          id
        );

        const response =
          await api.get(
            `/patients/${id}`
          );

        console.log(
          '📥 Patient loaded:',
          response.data
        );

        setData(
          response.data?.data
        );
      } catch (error) {
        console.log(
          '❌ LOAD PATIENT ERROR'
        );

        console.log(
          'STATUS:',
          error.response?.status
        );

        console.log(
          'DATA:',
          error.response?.data
        );

        console.log(
          'MESSAGE:',
          error.message
        );

        setDeleteError(
          error.response?.data?.message ||
            error.message ||
            'Unable to load patient.'
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useFocusEffect(
    useCallback(() => {
      loadPatient();
    }, [loadPatient])
  );

  /*
  |--------------------------------------------------------------------------
  | OPEN DELETE CONFIRMATION
  |--------------------------------------------------------------------------
  */

  const handleDeleteButton = () => {
    console.log('');
    console.log(
      '🟢 DELETE BUTTON HANDLER RUNNING'
    );

    console.log(
      '🆔 Patient ID:',
      id
    );

    setDeleteError('');

    setShowDeleteConfirm(true);

    console.log(
      '✅ Inline delete confirmation opened'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CANCEL DELETE
  |--------------------------------------------------------------------------
  */

  const cancelDelete = () => {
    console.log(
      '❌ Delete cancelled'
    );

    setShowDeleteConfirm(false);
    setDeleteError('');
  };

  /*
  |--------------------------------------------------------------------------
  | ACTUAL DELETE REQUEST
  |--------------------------------------------------------------------------
  */

  const deletePatient = async () => {
    console.log('');
    console.log(
      '🔥🔥🔥 ACTUAL DELETE STARTED 🔥🔥🔥'
    );

    console.log(
      '🆔 Patient ID:',
      id
    );

    if (!id) {
      console.log(
        '❌ DELETE STOPPED: Missing patient ID'
      );

      setDeleteError(
        'Patient ID is missing.'
      );

      return;
    }

    if (deleting) {
      console.log(
        '⚠️ Delete already in progress'
      );

      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      console.log(
        '➡️ Sending DELETE request...'
      );

      console.log(
        '➡️ DELETE URL:',
        `/patients/${id}`
      );

      const response =
        await api.delete(
          `/patients/${id}`
        );

      console.log(
        '✅✅✅ DELETE SUCCESS ✅✅✅'
      );

      console.log(
        '📦 DELETE RESPONSE:',
        response.data
      );

      /*
      |--------------------------------------------------------------------------
      | Go back to Patients
      |--------------------------------------------------------------------------
      */

      console.log(
        '➡️ Navigating to Patients screen'
      );

      navigation.replace(
        'Patients'
      );
    } catch (error) {
      console.log('');
      console.log(
        '❌❌❌ DELETE FAILED ❌❌❌'
      );

      console.log(
        'STATUS:',
        error.response?.status
      );

      console.log(
        'DATA:',
        error.response?.data
      );

      console.log(
        'MESSAGE:',
        error.message
      );

      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          'Unable to delete patient.'
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return <Loading />;
  }

  /*
  |--------------------------------------------------------------------------
  | PATIENT NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (!data?.patient) {
    return (
      <Screen scroll>
        <Card>
          <Text style={styles.errorTitle}>
            Patient not found
          </Text>

          <Text style={styles.errorText}>
            The patient record could not
            be loaded.
          </Text>

          <Button
            title="GO BACK"
            secondary
            onPress={() =>
              navigation.goBack()
            }
          />
        </Card>
      </Screen>
    );
  }

  const patient = data.patient;
  const visits = data.visits || [];

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          PATIENT RECORD
        </Text>

        <Text style={styles.title}>
          {patient.name}
        </Text>

        <Text style={styles.patientId}>
          {patient.patientId}
        </Text>
      </View>

      {/* PATIENT INFORMATION */}

      <Card accent>
        <Text style={styles.sectionTitle}>
          Patient Information
        </Text>

        <InfoRow
          label="Name"
          value={patient.name}
        />

        <InfoRow
          label="Patient ID"
          value={patient.patientId}
        />

        <InfoRow
          label="Mobile"
          value={
            patient.mobile || '—'
          }
        />

        <InfoRow
          label="Age"
          value={`${patient.age} years`}
        />

        <InfoRow
          label="Gender"
          value={patient.gender}
        />

        <InfoRow
          label="Address"
          value={
            patient.address || '—'
          }
        />
      </Card>

      {/* PRESCRIPTION HISTORY */}

      <Card>
        <View
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>
            Prescription History
          </Text>

          <Text style={styles.count}>
            {visits.length}
          </Text>
        </View>

        {visits.length === 0 ? (
          <Text style={styles.empty}>
            No prescriptions found.
          </Text>
        ) : (
          visits.map(
            (visit, index) => (
              <View
                key={
                  visit._id ||
                  `visit-${index}`
                }
                style={styles.visit}
              >
                <Text
                  style={
                    styles.visitDate
                  }
                >
                  {formatDate(
                    visit.visitDate
                  )}
                </Text>

                {Array.isArray(
                  visit.diagnosis
                ) &&
                visit.diagnosis.length >
                  0 ? (
                  <Text
                    style={
                      styles.diagnosis
                    }
                  >
                    Diagnosis:{' '}
                    {visit.diagnosis.join(
                      ', '
                    )}
                  </Text>
                ) : null}

                {Array.isArray(
                  visit.medicines
                ) &&
                visit.medicines.length >
                  0 ? (
                  <Text
                    style={
                      styles.medicine
                    }
                  >
                    Medicines:{' '}
                    {visit.medicines
                      .map(
                        (medicine) =>
                          medicine.name
                      )
                      .join(', ')}
                  </Text>
                ) : null}

                <Button
                  title="VIEW PRESCRIPTION"
                  secondary
                  onPress={() =>
                    navigation.navigate(
                      'VisitDetail',
                      {
                        id: visit._id,
                      }
                    )
                  }
                />
              </View>
            )
          )
        )}
      </Card>

      {/* ACTIONS */}

      <Card>
        <Text style={styles.sectionTitle}>
          Actions
        </Text>

        <Button
          title="NEW VISIT / PRESCRIPTION"
          onPress={() =>
            navigation.navigate(
              'CreateVisit',
              {
                patient,
              }
            )
          }
        />
      </Card>

      {/* DANGER ZONE */}

      <Card>
        <Text style={styles.dangerTitle}>
          Danger Zone
        </Text>

        <Text style={styles.deleteDescription}>
          Permanently delete this patient
          and all prescriptions associated
          with this patient.
        </Text>

        {!showDeleteConfirm ? (
          <Button
            title="DELETE PATIENT & PRESCRIPTIONS"
            danger
            disabled={deleting}
            onPress={
              handleDeleteButton
            }
          />
        ) : (
          <View
            style={
              styles.confirmBox
            }
          >
            <Text
              style={
                styles.confirmTitle
              }
            >
              Confirm permanent deletion
            </Text>

            <Text
              style={
                styles.confirmText
              }
            >
              This will permanently delete:
            </Text>

            <Text
              style={
                styles.confirmItem
              }
            >
              • Patient: {patient.name}
            </Text>

            <Text
              style={
                styles.confirmItem
              }
            >
              • Patient ID:{' '}
              {patient.patientId}
            </Text>

            <Text
              style={
                styles.confirmItem
              }
            >
              • Prescriptions:{' '}
              {visits.length}
            </Text>

            <View
              style={
                styles.confirmButtons
              }
            >
              <View
                style={
                  styles.buttonHalf
                }
              >
                <Button
                  title="CANCEL"
                  secondary
                  disabled={deleting}
                  onPress={
                    cancelDelete
                  }
                />
              </View>

              <View
                style={
                  styles.buttonHalf
                }
              >
                <Button
                  title={
                    deleting
                      ? 'DELETING...'
                      : 'YES, DELETE'
                  }
                  danger
                  disabled={deleting}
                  onPress={
                    deletePatient
                  }
                />
              </View>
            </View>

            {deleting ? (
              <View
                style={
                  styles.loadingBox
                }
              >
                <ActivityIndicator
                  size="small"
                  color={
                    colors.danger
                  }
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Deleting patient and
                  prescriptions...
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {deleteError ? (
          <View
            style={
              styles.errorBox
            }
          >
            <Text
              style={
                styles.errorBoxTitle
              }
            >
              Delete failed
            </Text>

            <Text
              style={
                styles.errorBoxText
              }
            >
              {deleteError}
            </Text>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}

/*
|--------------------------------------------------------------------------
| INFO ROW
|--------------------------------------------------------------------------
*/

function InfoRow({
  label,
  value,
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| DATE FORMAT
|--------------------------------------------------------------------------
*/

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  try {
    return new Date(
      value
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  } catch {
    return String(value);
  }
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  header: {
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

  patientId: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },

  count: {
    backgroundColor: '#E8F1FF',
    color: colors.blue,
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontWeight: '900',
  },

  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 11,
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  infoValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },

  visit: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 14,
    marginTop: 10,
  },

  visitDate: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },

  diagnosis: {
    color: colors.ink,
    marginTop: 7,
    lineHeight: 21,
  },

  medicine: {
    color: colors.muted,
    marginTop: 5,
    lineHeight: 21,
  },

  empty: {
    color: colors.muted,
    paddingVertical: 15,
  },

  dangerTitle: {
    color: colors.danger,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 7,
  },

  deleteDescription: {
    color: colors.muted,
    lineHeight: 21,
    marginBottom: 10,
  },

  confirmBox: {
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#F4C5CD',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },

  confirmTitle: {
    color: colors.danger,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },

  confirmText: {
    color: colors.ink,
    fontWeight: '700',
    marginBottom: 6,
  },

  confirmItem: {
    color: colors.muted,
    marginTop: 4,
  },

  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  buttonHalf: {
    flex: 1,
  },

  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 9,
  },

  loadingText: {
    color: colors.danger,
    fontWeight: '700',
  },

  errorBox: {
    backgroundColor: '#FFF0F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  errorBoxTitle: {
    color: colors.danger,
    fontWeight: '900',
    marginBottom: 4,
  },

  errorBoxText: {
    color: colors.ink,
    lineHeight: 20,
  },

  errorTitle: {
    color: colors.danger,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },

  errorText: {
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 10,
  },
});