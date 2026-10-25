import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import { Loading } from '../components/UI';

export default function PatientDetail({ route, navigation }) {
  const { showLoading, showSuccess, showError } = useAuth();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const id = route?.params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadPatient = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/patients/${id}`);
      setData(response.data?.data);
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          'Unable to load patient record.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadPatient();
    }, [loadPatient])
  );

  const deletePatient = async () => {
    if (!id || deleting) return;

    try {
      setDeleting(true);
      setDeleteError('');

      showLoading(
        'Deleting Patient Record...',
        'Removing patient and associated medical records from cloud database...'
      );

      await api.delete(`/patients/${id}`);

      showSuccess(
        'Patient Deleted',
        'Patient record and history have been removed.',
        () => {
          navigation.replace('Patients');
        },
        'DONE'
      );
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        'Unable to delete patient.';

      setDeleteError(errMsg);
      showError('Delete Failed', errMsg);
    } finally {
      setDeleting(false);
    }
  };

  const handleCall = (mobile) => {
    if (!mobile) return;
    const cleanNumber = mobile.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Loading />
      </View>
    );
  }

  if (!data?.patient) {
    return (
      <View style={styles.container}>
        <AppHeader title="Patient Record" navigation={navigation} />
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundIcon}>⚠️</Text>
          <Text style={styles.notFoundTitle}>Patient Not Found</Text>
          <Text style={styles.notFoundSubtitle}>
            {deleteError || 'This patient record does not exist or was removed.'}
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const patient = data.patient;
  const visits = data.visits || [];
  const initial = (patient.name || 'P').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Profile" navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTabletOrDesktop && styles.scrollContentTablet,
        ]}
      >
        <View style={[styles.mainInner, isTabletOrDesktop && styles.mainInnerTablet]}>
          {/* PATIENT PROFILE HERO CARD */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.heroInfo}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName}>{patient.name}</Text>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>
                      {patient.patientId || 'PT-ID'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroMeta}>
                  {patient.age ? `${patient.age} Years • ` : ''}
                  {patient.gender || ''}
                </Text>
              </View>
            </View>

            {/* QUICK CONTACT / VITALS ROW */}
            <View style={styles.quickInfoRow}>
              {patient.mobile ? (
                <TouchableOpacity
                  style={styles.quickInfoItem}
                  onPress={() => handleCall(patient.mobile)}
                >
                  <Text style={styles.quickInfoLabel}>MOBILE</Text>
                  <Text style={styles.quickInfoValueBlue}>
                    📞 {patient.mobile}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoLabel}>PRESCRIPTIONS</Text>
                <Text style={styles.quickInfoValue}>{visits.length} Visits</Text>
              </View>

              {patient.address ? (
                <View style={[styles.quickInfoItem, { flex: 1.5 }]}>
                  <Text style={styles.quickInfoLabel}>LOCATION</Text>
                  <Text style={styles.quickInfoValue} numberOfLines={1}>
                    {patient.address}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* PRIMARY CALL-TO-ACTION */}
            <TouchableOpacity
              style={styles.newRxBtn}
              onPress={() =>
                navigation.navigate('CreateVisit', {
                  patient,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.newRxBtnText}>
                ⚡ WRITE NEW PRESCRIPTION
              </Text>
            </TouchableOpacity>
          </View>

          {/* PRESCRIPTION HISTORY SECTION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionIcon}>📑</Text>
                <Text style={styles.sectionTitle}>Prescription History</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{visits.length}</Text>
              </View>
            </View>

            {visits.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Text style={styles.emptyHistoryIcon}>📝</Text>
                <Text style={styles.emptyHistoryTitle}>
                  No prescriptions recorded yet
                </Text>
                <Text style={styles.emptyHistoryText}>
                  Create the patient's first clinical prescription with medicines, vitals, and advice.
                </Text>
                <TouchableOpacity
                  style={styles.firstRxBtn}
                  onPress={() =>
                    navigation.navigate('CreateVisit', {
                      patient,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.firstRxBtnText}>
                    ＋ WRITE FIRST PRESCRIPTION
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={isTabletOrDesktop ? styles.visitsGrid : undefined}>
                {visits.map((visit, index) => {
                  const medCount = visit.medicines?.length || 0;
                  return (
                    <View
                      key={visit._id || index}
                      style={[
                        styles.visitCard,
                        isTabletOrDesktop && styles.visitCardTablet,
                      ]}
                    >
                      {/* VISIT CARD HEADER */}
                      <View style={styles.visitHeader}>
                        <View style={styles.dateBadge}>
                          <Text style={styles.dateBadgeText}>
                            🗓️ {formatDate(visit.visitDate)}
                          </Text>
                        </View>
                        <View style={styles.medCountBadge}>
                          <Text style={styles.medCountText}>
                            💊 {medCount} {medCount === 1 ? 'Med' : 'Meds'}
                          </Text>
                        </View>
                      </View>

                      {/* DIAGNOSIS */}
                      {Array.isArray(visit.diagnosis) && visit.diagnosis.length > 0 ? (
                        <View style={styles.diagRow}>
                          <Text style={styles.diagLabel}>Diagnosis:</Text>
                          <View style={styles.chipsWrap}>
                            {visit.diagnosis.map((d, di) => (
                              <View key={di} style={styles.diagChip}>
                                <Text style={styles.diagChipText}>{d}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}

                      {/* MEDICINES SUMMARY */}
                      {Array.isArray(visit.medicines) && visit.medicines.length > 0 ? (
                        <View style={styles.medsSummaryBox}>
                          <Text style={styles.medsSummaryText} numberOfLines={2}>
                            {visit.medicines
                              .map((m) => `${m.preparation ? m.preparation + '. ' : ''}${m.name} ${m.strength || ''}`)
                              .join(', ')}
                          </Text>
                        </View>
                      ) : null}

                      {/* ACTIONS */}
                      <View style={styles.visitActionsRow}>
                        <TouchableOpacity
                          style={styles.viewRxBtn}
                          onPress={() =>
                            navigation.navigate('VisitDetail', {
                              id: visit._id,
                            })
                          }
                          activeOpacity={0.85}
                        >
                          <Text style={styles.viewRxBtnText}>VIEW PRESCRIPTION</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.editRxBtn}
                          onPress={() =>
                            navigation.navigate('EditVisit', {
                              visit,
                            })
                          }
                          activeOpacity={0.85}
                        >
                          <Text style={styles.editRxBtnText}>✏️ EDIT</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* DANGER ZONE */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Patient Record Options</Text>
            <Text style={styles.dangerSubtitle}>
              Delete this patient and their complete clinical prescription records.
            </Text>

            {!showDeleteConfirm ? (
              <TouchableOpacity
                style={styles.deleteOutlineBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Text style={styles.deleteOutlineBtnText}>
                  🗑️ DELETE PATIENT RECORD
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmTitle}>
                  Confirm Permanent Deletion
                </Text>
                <Text style={styles.confirmText}>
                  Are you sure you want to delete {patient.name} ({patient.patientId})? This cannot be undone.
                </Text>

                {deleteError ? (
                  <Text style={styles.deleteErrorText}>{deleteError}</Text>
                ) : null}

                <View style={styles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setDeleteError('');
                    }}
                    disabled={deleting}
                  >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmDeleteBtn}
                    onPress={deletePatient}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmDeleteBtnText}>
                        YES, DELETE
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scrollContentTablet: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  mainInner: {
    width: '100%',
  },
  mainInnerTablet: {
    maxWidth: 1040,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  heroInfo: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  idBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
  },
  heroMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  quickInfoRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickInfoItem: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickInfoValueBlue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  newRxBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  newRxBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB',
  },
  emptyHistoryBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyHistoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyHistoryText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
    maxWidth: 260,
  },
  firstRxBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  firstRxBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  visitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  visitCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  visitCardTablet: {
    width: '48.8%',
    marginBottom: 0,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  medCountBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  medCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  diagRow: {
    marginBottom: 6,
  },
  diagLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  diagChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  diagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  medsSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medsSummaryText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 17,
  },
  visitActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewRxBtn: {
    flex: 1.5,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRxBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  editRxBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editRxBtnText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '800',
  },
  dangerCard: {
    backgroundColor: '#FFF7F8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 14,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#991B1B',
  },
  dangerSubtitle: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 17,
  },
  deleteOutlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteOutlineBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B91C1C',
    marginBottom: 4,
  },
  confirmText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  deleteErrorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  notFoundBox: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notFoundIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});