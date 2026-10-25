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
import AccessRequiredModal from '../components/AccessRequiredModal';
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
  'Vomiting',
];

const POPULAR_DIAGNOSES = [
  'Viral Fever',
  'URTI',
  'Acute Gastritis',
  'Hypertension',
  'Type 2 Diabetes',
  'Allergic Rhinitis',
  'Migraine',
  'Gastroenteritis',
];

const POPULAR_ADVICE = [
  'Drink plenty of fluids',
  'Adequate bed rest',
  'Avoid cold drinks & ice',
  'Light & non-spicy diet',
  'Steam inhalation twice daily',
  'Monitor BP daily',
];

const FOLLOWUP_PRESETS = [
  'After 3 Days',
  'After 5 Days',
  'After 1 Week',
  'After 10 Days',
  'After 2 Weeks',
  'As needed',
];

export default function CreateVisit({ route, navigation }) {
  const { showLoading, showSuccess, showError, hideFeedback } = useAuth();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const isDesktop = width >= 1024;

  const p = route.params?.patient || {};

  const [sym, setSym] = useState('');
  const [diag, setDiag] = useState('');

  const [v, setV] = useState({
    bp: '',
    weight: '',
    temperature: '',
    sugar: '',
  });

  const [meds, setMeds] = useState([]);
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('After 5 Days');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedIndex, setEditingMedIndex] = useState(null);

  const [busy, setBusy] = useState(false);
  const [accessPromptVisible, setAccessPromptVisible] = useState(false);

  const setVt = (k, x) => {
    setV((a) => ({
      ...a,
      [k]: x,
    }));
  };

  const addSymptomChip = (chip) => {
    const list = sym
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!list.includes(chip)) {
      list.push(chip);
      setSym(list.join(', '));
    }
  };

  const addDiagnosisChip = (chip) => {
    const list = diag
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    if (!list.includes(chip)) {
      list.push(chip);
      setDiag(list.join(', '));
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
    setMeds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveMedicine = (medicineItem) => {
    if (editingMedIndex !== null) {
      setMeds((prev) =>
        prev.map((m, i) => (i === editingMedIndex ? medicineItem : m))
      );
    } else {
      setMeds((prev) => [...prev, medicineItem]);
    }
  };

  const save = async () => {
    if (meds.length === 0 && !diag.trim() && !sym.trim()) {
      showError(
        'Empty Prescription',
        'Please add at least symptoms, diagnosis, or prescribed medicines before saving.'
      );
      return;
    }

    try {
      setBusy(true);

      showLoading(
        'Saving Prescription...',
        'Generating digital prescription and storing medical records in cloud...'
      );

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
        followUpDate: followUp || undefined,
      });

      const newVisitId = r.data?.data?._id;

      showSuccess(
        'Prescription Saved Successfully!',
        `Prescription generated for ${p.name || 'patient'}.`,
        () => {
          navigation.replace('VisitDetail', {
            id: newVisitId,
          });
        },
        'VIEW PRESCRIPTION'
      );
    } catch (e) {
      if (e.response?.data?.code === 'ACCESS_DISABLED') {
        hideFeedback();
        setAccessPromptVisible(true);
        return;
      }

      showError(
        'Save Failed',
        e.response?.data?.message || e.message || 'Failed to save prescription. Please check connection.'
      );
    } finally {
      setBusy(false);
    }
  };

  const patientInitial = (p.name || 'P').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <AppHeader title="New Prescription" navigation={navigation} />

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
            {/* PATIENT BAR */}
            <View style={styles.patientCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{patientInitial}</Text>
              </View>
              <View style={styles.patientDetails}>
                <View style={styles.patientNameRow}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <View style={styles.patientBadge}>
                    <Text style={styles.patientBadgeText}>
                      {p.patientId || 'PT-ID'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.patientMeta}>
                  {p.age ? `${p.age} Yrs` : '—'} • {p.gender || '—'}
                  {p.mobile ? ` • 📞 ${p.mobile}` : ''}
                </Text>
              </View>
            </View>

            {/* SECTION: CLINICAL FINDINGS (SYMPTOMS & DIAGNOSIS) */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🩺</Text>
                <Text style={styles.sectionTitle}>Chief Complaints & Diagnosis</Text>
              </View>

              <View style={isTabletOrDesktop ? styles.row2Col : undefined}>
                {/* Symptoms */}
                <View style={isTabletOrDesktop ? styles.colHalf : undefined}>
                  <Text style={styles.subLabel}>SYMPTOMS (COMMA SEPARATED)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sym}
                    onChangeText={setSym}
                    placeholder="e.g. High fever, dry cough, headache"
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

                {/* Diagnosis */}
                <View style={[isTabletOrDesktop ? styles.colHalf : { marginTop: 14 }]}>
                  <Text style={styles.subLabel}>DIAGNOSIS (COMMA SEPARATED)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={diag}
                    onChangeText={setDiag}
                    placeholder="e.g. Viral Fever, URTI"
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

            {/* SECTION: VITALS (RESPONSIVE 4-COL ON TABLET/PC, 2-COL ON MOBILE) */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>❤️</Text>
                <Text style={styles.sectionTitle}>Patient Vitals</Text>
              </View>

              <View style={[styles.vitalsGrid, isTabletOrDesktop && styles.vitalsGridTablet]}>
                {/* BP */}
                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>BP (mmHg)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={v.bp}
                    onChangeText={(x) => setVt('bp', x)}
                    placeholder="120/80"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Weight */}
                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={v.weight}
                    onChangeText={(x) => setVt('weight', x)}
                    placeholder="65 kg"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                {/* Temperature */}
                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>Temp (°F)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={v.temperature}
                    onChangeText={(x) => setVt('temperature', x)}
                    placeholder="98.6 °F"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                {/* Sugar */}
                <View style={[styles.vitalCol, isTabletOrDesktop && styles.vitalColTablet]}>
                  <Text style={styles.vitalLabel}>Sugar (mg/dL)</Text>
                  <TextInput
                    style={styles.vitalInput}
                    value={v.sugar}
                    onChangeText={(x) => setVt('sugar', x)}
                    placeholder="110 mg/dL"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* SECTION: MEDICINES */}
            <View style={[styles.card, styles.medsSectionCard]}>
              <View style={styles.medsHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sectionIcon}>💊</Text>
                  <View>
                    <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
                    <Text style={styles.sectionSubtitle}>
                      {meds.length} {meds.length === 1 ? 'medicine' : 'medicines'} added
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

              {/* MEDICINES LIST */}
              {meds.length === 0 ? (
                <View style={styles.emptyMedsBox}>
                  <Text style={styles.emptyMedsIcon}>💊</Text>
                  <Text style={styles.emptyMedsTitle}>No medicines added yet</Text>
                  <Text style={styles.emptyMedsSubtitle}>
                    Tap below to add medicines with preparation, dosage, route, frequency and directions.
                  </Text>
                  <TouchableOpacity
                    style={styles.addMedPrimaryBtn}
                    onPress={openAddMedicine}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addMedPrimaryBtnText}>
                      ＋ ADD MEDICINE NOW
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  {meds.map((m, i) => (
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

                          {/* Badges row */}
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

                          {/* Instructions */}
                          {m.instructions ? (
                            <Text style={styles.medInstructions}>
                              ℹ️ {m.instructions}
                            </Text>
                          ) : null}
                        </View>

                        {/* Actions */}
                        <View style={styles.medActions}>
                          <TouchableOpacity
                            style={styles.medActionBtn}
                            onPress={() => openEditMedicine(i)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.medEditBtnText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.medActionBtn, { marginTop: 8 }]}
                            onPress={() => removeMedicine(i)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

            {/* SECTION: GENERAL ADVICE & FOLLOW-UP (RESPONSIVE 2-COL ON TABLET/PC) */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📋</Text>
                <Text style={styles.sectionTitle}>Advice & Follow-Up</Text>
              </View>

              <View style={isTabletOrDesktop ? styles.row2Col : undefined}>
                <View style={isTabletOrDesktop ? styles.colHalf : undefined}>
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

                <View style={[isTabletOrDesktop ? styles.colHalf : { marginTop: 14 }]}>
                  <Text style={styles.subLabel}>FOLLOW-UP</Text>
                  <TextInput
                    style={styles.textInput}
                    value={followUp}
                    onChangeText={setFollowUp}
                    placeholder="e.g. After 5 Days"
                    placeholderTextColor="#94A3B8"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickChipsRow}
                  >
                    {FOLLOWUP_PRESETS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.quickChip,
                          followUp === item && styles.quickChipActive,
                        ]}
                        onPress={() => setFollowUp(item)}
                      >
                        <Text
                          style={[
                            styles.quickChipText,
                            followUp === item && styles.quickChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* SAVE PRESCRIPTION ACTION */}
            <TouchableOpacity
              style={[styles.saveRxBtn, busy && styles.saveRxBtnDisabled]}
              onPress={save}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.saveRxBtnText}>
                {busy ? 'SAVING PRESCRIPTION...' : '💾 SAVE & GENERATE PRESCRIPTION'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                © 2026 AlphaAryX • Veda Smart Digital Healthcare
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MEDICINE MODAL WITH DOWNSIDE PICKER */}
      <MedicineModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveMedicine}
        initialData={editingMedIndex !== null ? meds[editingMedIndex] : null}
      />

      <AccessRequiredModal
        visible={accessPromptVisible}
        onClose={() => setAccessPromptVisible(false)}
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  patientDetails: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  patientBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  patientBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  patientMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
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
  quickChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  emptyMedsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    maxWidth: 280,
    lineHeight: 18,
  },
  addMedPrimaryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addMedPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    lineHeight: 17,
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
    letterSpacing: 0.5,
  },
  saveRxBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#16A34A',
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
    letterSpacing: 0.5,
  },
  footerNote: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 4,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});