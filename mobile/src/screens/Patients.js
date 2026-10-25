import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/api';
import AppHeader from '../components/AppHeader';
import { Loading } from '../components/UI';

export default function Patients({ navigation }) {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const [q, setQ] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  /* SEARCH PATIENTS */
  const fetchPatients = useCallback(async (queryText = '') => {
    try {
      setLoading(true);
      const response = await api.get('/patients', {
        params: {
          q: queryText.trim(),
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
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      fetchPatients(q);
    }, [fetchPatients])
  );

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(q);
    }, 350);
    return () => clearTimeout(timer);
  }, [q, fetchPatients]);

  const handleCall = (mobile) => {
    if (!mobile) return;
    const cleanNumber = mobile.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Find Patient" navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          isTabletOrDesktop && styles.scrollContentTablet,
        ]}
      >
        <View style={[styles.mainInner, isTabletOrDesktop && styles.mainInnerTablet]}>
          {/* TOP BAR / TITLE & ADD PATIENT BUTTON */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.pageEyebrow}>PATIENT DIRECTORY</Text>
              <Text style={styles.pageTitle}>Find Patient</Text>
            </View>
            <TouchableOpacity
              style={styles.addPatientTopBtn}
              onPress={() => navigation.navigate('AddPatient')}
              activeOpacity={0.85}
            >
              <Text style={styles.addPatientTopBtnText}>＋ ADD PATIENT</Text>
            </TouchableOpacity>
          </View>

          {/* MODERN SEARCH BAR */}
          <View style={styles.searchCard}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={q}
                onChangeText={setQ}
                placeholder="Search by name, phone or ID..."
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {q.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setQ('')}
                  style={styles.clearSearchBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* QUICK TABS */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
                onPress={() => {
                  setActiveTab('all');
                  fetchPatients('');
                }}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    activeTab === 'all' && styles.tabChipTextActive,
                  ]}
                >
                  All Patients ({patients.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabChip, activeTab === 'recent' && styles.tabChipActive]}
                onPress={() => setActiveTab('recent')}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    activeTab === 'recent' && styles.tabChipTextActive,
                  ]}
                >
                  Recent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* RESULTS HEADER */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {q.trim() ? `Search Results for "${q}"` : 'All Registered Patients'}
            </Text>
            {!loading ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{patients.length} found</Text>
              </View>
            ) : null}
          </View>

          {/* CONTENT */}
          {loading ? (
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          ) : patients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptySubtitle}>
                {q.trim()
                  ? `No patient record matched "${q}". Try a different name or mobile number.`
                  : 'Your patient directory is currently empty. Add your first patient to begin prescribing.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddPatient')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyAddBtnText}>＋ ADD NEW PATIENT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={isTabletOrDesktop ? styles.cardsGrid : undefined}>
              {patients.map((patient) => {
                const initial = (patient.name || 'P').charAt(0).toUpperCase();
                return (
                  <View
                    key={patient._id}
                    style={[
                      styles.patientCard,
                      isTabletOrDesktop && styles.patientCardTablet,
                    ]}
                  >
                    {/* TOP ROW */}
                    <View style={styles.patientCardHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                      </View>

                      <View style={styles.patientInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.patientName} numberOfLines={1}>
                            {patient.name}
                          </Text>
                          <View style={styles.idBadge}>
                            <Text style={styles.idBadgeText}>
                              {patient.patientId || 'PT-ID'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>
                              {patient.age ? `${patient.age} Yrs` : 'Age N/A'}
                            </Text>
                          </View>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{patient.gender || '—'}</Text>
                          </View>
                          {patient.mobile ? (
                            <TouchableOpacity
                              style={styles.mobileChip}
                              onPress={() => handleCall(patient.mobile)}
                            >
                              <Text style={styles.mobileChipText}>
                                📞 {patient.mobile}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    {/* DIVIDER */}
                    <View style={styles.cardDivider} />

                    {/* ACTION BUTTONS */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.primaryActionBtn}
                        onPress={() =>
                          navigation.navigate('CreateVisit', {
                            patient,
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Text style={styles.primaryActionBtnText}>
                          ⚡ NEW PRESCRIPTION
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.secondaryActionBtn}
                        onPress={() =>
                          navigation.navigate('PatientDetail', {
                            id: patient._id,
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Text style={styles.secondaryActionBtnText}>
                          VIEW HISTORY
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pageEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  addPatientTopBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addPatientTopBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 6,
  },
  clearSearchBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  tabChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: 18,
  },
  emptyAddBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  patientCardTablet: {
    width: '48.8%',
    marginBottom: 0,
  },
  patientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  patientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 17,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  mobileChip: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  mobileChipText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },
});