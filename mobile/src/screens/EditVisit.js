import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  Alert,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import MedicineModal from '../components/MedicineModal';

const POPULAR_SYMPTOMS = [
  'Fever',
  'Cough',
  'Cold',
  'Headache',
  'Body Pain',
  'Weakness',
  'Sore Throat',
  'Stomach Ache',
  'Acidity',
];

const POPULAR_DIAGNOSES = [
  'Viral Fever',
  'URTI',
  'Acute Gastritis',
  'Hypertension',
  'Type 2 Diabetes',
  'Allergic Rhinitis',
];

const POPULAR_ADVICE = [
  'Drink plenty of fluids',
  'Adequate bed rest',
  'Avoid cold drinks & ice',
  'Light & non-spicy diet',
  'Steam inhalation twice daily',
];

export default function EditVisit({ route, navigation }) {
  const { showLoading, showSuccess, showError } = useAuth();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const visit = route.params?.visit || {};
  const patient = visit.patientId || {};

  const [symptoms, setSymptoms] = useState((visit.symptoms || []).join(', '));
  const [diagnosis, setDiagnosis] = useState((visit.diagnosis || []).join(', '));
  const [vitals, setVitals] = useState({ ...(visit.vitals || {}) });
  const [medicines, setMedicines] = useState(visit.medicines || []);
  const [advice, setAdvice] = useState((visit.advice || []).join(', '));
  const [busy, setBusy] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedIndex, setEditingMedIndex] = useState(null);

  const setVital = (key, value) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
  };

  const addSymptomChip = (chip) => {
    const list = symptoms
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!list.includes(chip)) {
      list.push(chip);
      setSymptoms(list.join(', '));
    }
  };

  const addDiagnosisChip = (chip) => {
    const list = diagnosis
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!list.includes(chip)) {
      list.push(chip);
      setDiagnosis(list.join(', '));
    }
  };

  const addAdviceChip = (chip) => {
    const list = advice
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!list.includes(chip)) {
      list.push(chip);
      setAdvice(list.join(', '));
    }
  };

  const openAddMedicine = () => {
    setEditingMedIndex(null);
    setModalVisible(true);
  };

  const openEditMedicine = (index) => {
    setEditingMedIndex(index);
    setModalVisible(true);
  };

  const removeMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMedicine = (medicineItem) => {
    if (editingMedIndex !== null) {
      setMedicines((prev) =>
        prev.map((m, i) => (i === editingMedIndex ? medicineItem : m))
      );
    } else {
      setMedicines((prev) => [...prev, medicineItem]);
    }
  };

  const save = async () => {
    try {
      setBusy(true);

      showLoading(
        'Updating Prescription...',
        'Saving modified clinical findings and medications in cloud...'
      );

      const response = await api.put(`/visits/${visit._id}`, {
        symptoms: symptoms
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        diagnosis: diagnosis
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        vitals,
        medicines,
        advice: advice
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      });

      const updatedId = response.data?.data?._id || visit._id;

      showSuccess(
        'Prescription Updated!',
        'Your changes have been saved successfully.',
        () => {
          navigation.replace('VisitDetail', {
            id: updatedId,
          });
        },
        'VIEW PRESCRIPTION'
      );
    } catch (e) {
      showError(
        'Update Failed',
        e.response?.data?.message || e.message || 'Something went wrong while saving changes.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Edit Prescription" navigation={navigation} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isTabletOrDesktop && styles.scrollContentTablet,
          ]}
        >
          <View style={[styles.mainInner, isTabletOrDesktop && styles.mainInnerTablet]}>
            {/* PATIENT HEADER */}
            <View style={styles.patientCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(patient.name || 'P').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.patientDetails}>
                <Text style={styles.patientName}>{patient.name || 'Patient'}</Text>
                <Text style={styles.patientMeta}>
                  {patient.patientId ? `ID: ${patient.patientId} • ` : ''}
                  {patient.age ? `${patient.age} Yrs • ` : ''}
                  {patient.gender || ''}
                </Text>
              </View>
            </View>

            {/* CLINICAL FINDINGS */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🩺</Text>
                <Text style={styles.sectionTitle}>Chief Complaints & Diagnosis</Text>
              </View>

              <View style={isTabletOrDesktop ? styles.row2Col : undefined}>
                <View style={isTabletOrDesktop ? styles.colHalf : undefined}>
                  <Text style={styles.subLabel}>SYMPTOMS (COMMA SEPARATED)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={symptoms}
                    onChangeText={setSymptoms}
                    placeholder="e.g. Fever, cough"
                    placeholderTextColor="#94A3B8"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickChipsRow}
                  >
                    {POPULAR_SYMPTOMS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.quickChip}
                        onPress={() => addSymptomChip(item)}
                      >
                        <Text style={styles.quickChipText}>+ {item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={[isTabletOrDesktop ? styles.colHalf : { marginTop: 14 }]}>
                  <Text style={styles.subLabel}>DIAGNOSIS (COMMA SEPARATED)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={diagnosis}
                    onChangeText={setDiagnosis}
                    placeholder="e.g. Viral Fever"
                    placeholderTextColor="#94A3B8"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickChipsRow}
                  >
                    {POPULAR_DIAGNOSES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.quickChip}
                        onPress={() => addDiagnosisChip(item)}
                      >
                        <Text style={styles.quickChipText}>+ {item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* VITALS (RESPONSIVE 4-COL ON TABLET/PC, 2-COL ON MOBILE) */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>❤️</Text>
                <Text style={styles.sectionTitle}>Patient Vitals</Text>
              </View>

              <View style={[styles.vitalsGrid, isTabletOrDesktop && styles.vitalsGridTablet]}>
                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>BP (mmHg)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={vitals.bp || ''}
                    onChangeText={(x) => setVital('bp', x)}
                    placeholder="120/80"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={vitals.weight || ''}
                    onChangeText={(x) => setVital('weight', x)}
                    placeholder="65 kg"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>Temp (°F)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={vitals.temperature || ''}
                    onChangeText={(x) => setVital('temperature', x)}
                    placeholder="98.6 °F"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>Sugar (mg/dL)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={vitals.sugar || ''}
                    onChangeText={(x) => setVital('sugar', x)}
                    placeholder="110 mg/dL"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* MEDICINES */}
            <View style={[styles.card, styles.medsSectionCard]}>
              <View style={styles.medsHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sectionIcon}>💊</Text>
                  <View>
                    <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
                    <Text style={styles.sectionSubtitle}>
                      {medicines.length} {medicines.length === 1 ? 'medicine' : 'medicines'} added
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addMedBtn}
                  onPress={openAddMedicine}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addMedBtnText}>＋ ADD MEDICINE</Text>
                </TouchableOpacity>
              </View>

              {medicines.length === 0 ? (
                <View style={styles.emptyMedsBox}>
                  <Text style={styles.emptyMedsIcon}>💊</Text>
                  <Text style={styles.emptyMedsTitle}>No medicines added</Text>
                  <TouchableOpacity
                    style={styles.addMedPrimaryBtn}
                    onPress={openAddMedicine}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addMedPrimaryBtnText}>＋ ADD MEDICINE</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  {medicines.map((m, i) => (
                    <View key={i} style={styles.medCard}>
                      <View style={styles.medCardTop}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            {m.preparation ? (
                              <View style={styles.prepBadge}>
                                <Text style={styles.prepBadgeText}>{m.preparation}</Text>
                              </View>
                            ) : null}
                            <Text style={styles.medName}>
                              {i + 1}. {m.name} {m.strength || ''}
                            </Text>
                          </View>

                          <View style={styles.medBadgesRow}>
                            {m.dosage ? (
                              <View style={styles.medChip}>
                                <Text style={styles.medChipText}>📏 {m.dosage}</Text>
                              </View>
                            ) : null}
                            {m.frequency ? (
                              <View style={[styles.medChip, styles.medChipBlue]}>
                                <Text style={[styles.medChipText, styles.medChipTextBlue]}>
                                  ⏱️ {m.frequency}
                                </Text>
                              </View>
                            ) : null}
                            {m.route ? (
                              <View style={styles.medChip}>
                                <Text style={styles.medChipText}>📍 {m.route}</Text>
                              </View>
                            ) : null}
                            {m.direction ? (
                              <View style={[styles.medChip, styles.medChipGreen]}>
                                <Text style={[styles.medChipText, styles.medChipTextGreen]}>
                                  🍽️ {m.direction}
                                </Text>
                              </View>
                            ) : null}
                            {m.duration ? (
                              <View style={styles.medChip}>
                                <Text style={styles.medChipText}>🗓️ {m.duration}</Text>
                              </View>
                            ) : null}
                          </View>

                          {m.instructions ? (
                            <Text style={styles.medInstructions}>
                              ℹ️ {m.instructions}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.medActions}>
                          <TouchableOpacity
                            style={styles.medActionBtn}
                            onPress={() => openEditMedicine(i)}
                          >
                            <Text style={styles.medEditBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.medActionBtn, { marginTop: 8 }]}
                            onPress={() => removeMedicine(i)}
                          >
                            <Text style={styles.medDeleteBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addMoreBtn}
                    onPress={openAddMedicine}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addMoreBtnText}>＋ ADD ANOTHER MEDICINE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ADVICE */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📋</Text>
                <Text style={styles.sectionTitle}>Advice & Follow-Up</Text>
              </View>

              <Text style={styles.subLabel}>ADVICE / INSTRUCTIONS (COMMA SEPARATED)</Text>
              <TextInput
                style={styles.textInput}
                value={advice}
                onChangeText={setAdvice}
                placeholder="e.g. Complete antibiotic course, drink warm water"
                placeholderTextColor="#94A3B8"
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsRow}
              >
                {POPULAR_ADVICE.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.quickChip}
                    onPress={() => addAdviceChip(item)}
                  >
                    <Text style={styles.quickChipText}>+ {item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              style={[styles.saveRxBtn, busy && styles.saveRxBtnDisabled]}
              onPress={save}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.saveRxBtnText}>
                {busy ? 'SAVING CHANGES...' : '💾 UPDATE PRESCRIPTION'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MedicineModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveMedicine}
        initialData={editingMedIndex !== null ? medicines[editingMedIndex] : null}
      />
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
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  patientMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medsSectionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  row2Col: {
    flexDirection: 'row',
    gap: 16,
  },
  colHalf: {
    flex: 1,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  quickChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  quickChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vitalsGridTablet: {
    flexWrap: 'nowrap',
    gap: 12,
  },
  vitalCol: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalColTablet: {
    width: 'auto',
    flex: 1,
  },
  vitalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  vitalInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  medsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addMedBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addMedBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2563EB',
  },
  emptyMedsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyMedsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyMedsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addMedPrimaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 10,
  },
  addMedPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  medCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prepBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  prepBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1E40AF',
  },
  medName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  medBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  medChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  medChipBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  medChipTextBlue: {
    color: '#1D4ED8',
  },
  medChipGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  medChipTextGreen: {
    color: '#047857',
  },
  medInstructions: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
  },
  medActions: {
    alignItems: 'center',
    paddingLeft: 4,
  },
  medActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medEditBtnText: {
    fontSize: 14,
  },
  medDeleteBtnText: {
    fontSize: 14,
  },
  addMoreBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addMoreBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '900',
  },
  saveRxBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveRxBtnDisabled: {
    opacity: 0.6,
  },
  saveRxBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
