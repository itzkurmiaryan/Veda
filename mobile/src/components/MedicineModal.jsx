import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';

export const PREPARATION_OPTIONS = [
  { label: 'Tab (Tablet)', value: 'Tab', icon: '💊' },
  { label: 'Cap (Capsule)', value: 'Cap', icon: '💊' },
  { label: 'Syp (Syrup)', value: 'Syp', icon: '🧪' },
  { label: 'Inj (Injection)', value: 'Inj', icon: '💉' },
  { label: 'Oint (Ointment)', value: 'Oint', icon: '🧴' },
  { label: 'Drops', value: 'Drops', icon: '💧' },
  { label: 'Inhaler', value: 'Inhaler', icon: '🫁' },
  { label: 'Cream', value: 'Cream', icon: '🧴' },
  { label: 'Gel', value: 'Gel', icon: '🧴' },
  { label: 'Suspension (Susp)', value: 'Susp', icon: '🧪' },
  { label: 'Powder', value: 'Powder', icon: '📦' },
  { label: 'Lotion', value: 'Lotion', icon: '🧴' },
  { label: 'Spray', value: 'Spray', icon: '💨' },
];

export const STRENGTH_UNITS = [
  'mg',
  'ml',
  'mcg',
  'g',
  'IU',
  '%',
  'mg/ml',
  'mg/5ml',
];

export const DOSAGE_UNITS = [
  'Tablet',
  'Capsule',
  'ml',
  'Drops',
  'Puff',
  'tsp (5ml)',
  'tbsp (15ml)',
  'Sachet',
  'Ampoule',
  'Application',
];

export const ROUTE_OPTIONS = [
  { label: 'Oral (PO)', value: 'Oral', desc: 'By mouth' },
  { label: 'IV (Intravenous)', value: 'IV', desc: 'Direct into vein' },
  { label: 'IM (Intramuscular)', value: 'IM', desc: 'Into muscle' },
  { label: 'SC (Subcutaneous)', value: 'SC', desc: 'Under skin' },
  { label: 'Topical', value: 'Topical', desc: 'Apply on skin' },
  { label: 'Sublingual', value: 'Sublingual', desc: 'Under tongue' },
  { label: 'Inhalation', value: 'Inhalation', desc: 'Breathed in' },
  { label: 'Eye (Ophthalmic)', value: 'Eye', desc: 'Into eyes' },
  { label: 'Ear (Otic)', value: 'Ear', desc: 'Into ear canal' },
  { label: 'Nasal', value: 'Nasal', desc: 'Nose drops/spray' },
];

export const FREQUENCY_OPTIONS = [
  { label: '1-0-1 (Twice daily / BD)', value: '1-0-1 (BD)', desc: 'Morning & Night' },
  { label: '1-0-0 (Morning only / OD)', value: '1-0-0 (OD)', desc: 'Once daily - Morning' },
  { label: '0-0-1 (Night only / OD)', value: '0-0-1 (OD)', desc: 'Once daily - Night' },
  { label: '0-1-0 (Afternoon / OD)', value: '0-1-0 (OD)', desc: 'Once daily - Afternoon' },
  { label: '1-1-1 (Thrice daily / TDS)', value: '1-1-1 (TDS)', desc: 'Morning, Noon, Night' },
  { label: '1-1-1-1 (4 times / QID)', value: '1-1-1-1 (QID)', desc: 'Every 6 hours' },
  { label: 'SOS (As needed)', value: 'SOS (As needed)', desc: 'Only when required/pain' },
  { label: 'Stat (Immediately)', value: 'Stat (Immediately)', desc: 'Single urgent dose' },
  { label: 'Every 8 Hours', value: 'Every 8 Hours', desc: 'TDS spaced evenly' },
  { label: 'Alternate Days', value: 'Alternate Days', desc: 'Every 48 hours' },
  { label: 'Once a Week', value: 'Once a Week', desc: 'Weekly once' },
];

export const DIRECTION_OPTIONS = [
  { label: 'After food (PC)', value: 'After food (PC)', desc: 'Within 30 mins of meal' },
  { label: 'Before food (AC)', value: 'Before food (AC)', desc: '30 mins before meal' },
  { label: 'With food', value: 'With food', desc: 'During meals' },
  { label: 'Empty stomach', value: 'Empty stomach', desc: 'At least 1 hr before eating' },
  { label: 'At bedtime (HS)', value: 'At bedtime (HS)', desc: 'Right before sleep' },
  { label: 'Early morning', value: 'Early morning', desc: 'First thing after waking up' },
  { label: 'As directed', value: 'As directed', desc: 'Follow specific instructions' },
];

export const DURATION_PRESETS = [
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '1 Month',
  '2 Months',
  '3 Months',
];

export const OTHER_INSTRUCTIONS_PRESETS = [
  'Drink plenty of water',
  'Avoid alcohol',
  'Complete full course',
  'Take with warm water',
  'Avoid oily & spicy food',
  'Take with milk',
  'Do not crush or chew',
  'Store in a cool dry place',
  'Avoid driving/heavy machinery',
  'Check BP / Sugar regularly',
];

export const COMMON_MEDICINE_SUGGESTIONS = [
  'Paracetamol',
  'Amoxicillin',
  'Azithromycin',
  'Pantoprazole',
  'Cetirizine',
  'Metformin',
  'Telmisartan',
  'Ibuprofen',
  'Omeprazole',
  'Montelukast',
  'Atorvastatin',
  'Ciprofloxacin',
  'Dolo 650',
  'Augmentin',
];

export default function MedicineModal({
  visible,
  onClose,
  onSave,
  initialData = null,
}) {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;
  const isDesktop = width >= 1024;

  const [name, setName] = useState('');
  const [preparation, setPreparation] = useState('Tab');
  const [strength, setStrength] = useState('');
  const [strengthUnit, setStrengthUnit] = useState('mg');
  const [dosage, setDosage] = useState('1');
  const [dosageUnit, setDosageUnit] = useState('Tablet');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('1-0-1 (BD)');
  const [direction, setDirection] = useState('After food (PC)');
  const [duration, setDuration] = useState('5 Days');
  const [selectedInstructions, setSelectedInstructions] = useState([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [error, setError] = useState('');

  // DOWNSIDE PICKER STATE
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({
    title: '',
    type: '',
    items: [],
  });

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPreparation(initialData.preparation || 'Tab');

      if (initialData.strengthUnit) {
        setStrength(initialData.strengthVal || initialData.strength || '');
        setStrengthUnit(initialData.strengthUnit);
      } else if (initialData.strength) {
        const parts = String(initialData.strength).trim().split(' ');
        if (parts.length > 1 && STRENGTH_UNITS.includes(parts[parts.length - 1])) {
          setStrengthUnit(parts[parts.length - 1]);
          setStrength(parts.slice(0, -1).join(' '));
        } else {
          setStrength(initialData.strength);
          setStrengthUnit('mg');
        }
      } else {
        setStrength('');
        setStrengthUnit('mg');
      }

      if (initialData.dosageUnit) {
        setDosage(initialData.dosageVal || initialData.dosage || '1');
        setDosageUnit(initialData.dosageUnit);
      } else if (initialData.dosage) {
        const parts = String(initialData.dosage).trim().split(' ');
        if (parts.length > 1 && DOSAGE_UNITS.includes(parts[parts.length - 1])) {
          setDosageUnit(parts[parts.length - 1]);
          setDosage(parts.slice(0, -1).join(' '));
        } else {
          setDosage(initialData.dosage);
          setDosageUnit('Tablet');
        }
      } else {
        setDosage('1');
        setDosageUnit('Tablet');
      }

      setRoute(initialData.route || 'Oral');
      setFrequency(initialData.frequency || '1-0-1 (BD)');
      setDirection(initialData.direction || 'After food (PC)');
      setDuration(initialData.duration || '5 Days');

      const other = initialData.otherInstructions || '';
      const matched = OTHER_INSTRUCTIONS_PRESETS.filter((p) =>
        other.toLowerCase().includes(p.toLowerCase())
      );
      setSelectedInstructions(matched);
      setCustomInstructions(initialData.customInstructions || initialData.instructions || '');
    } else {
      resetForm();
    }
    setError('');
  }, [visible, initialData]);

  const resetForm = () => {
    setName('');
    setPreparation('Tab');
    setStrength('');
    setStrengthUnit('mg');
    setDosage('1');
    setDosageUnit('Tablet');
    setRoute('Oral');
    setFrequency('1-0-1 (BD)');
    setDirection('After food (PC)');
    setDuration('5 Days');
    setSelectedInstructions([]);
    setCustomInstructions('');
    setError('');
  };

  /* OPEN DOWNSIDE PICKER SHEET */
  const openPicker = (type) => {
    let title = '';
    let items = [];

    switch (type) {
      case 'preparation':
        title = 'Select Preparation / Formulation';
        items = PREPARATION_OPTIONS;
        break;
      case 'strengthUnit':
        title = 'Select Strength Unit';
        items = STRENGTH_UNITS.map((u) => ({ label: u, value: u }));
        break;
      case 'dosageUnit':
        title = 'Select Dose Unit';
        items = DOSAGE_UNITS.map((u) => ({ label: u, value: u }));
        break;
      case 'route':
        title = 'Select Route of Administration';
        items = ROUTE_OPTIONS;
        break;
      case 'frequency':
        title = 'Select Frequency / Dosage Timing';
        items = FREQUENCY_OPTIONS;
        break;
      case 'direction':
        title = 'Select Direction (Food Timing)';
        items = DIRECTION_OPTIONS;
        break;
      case 'duration':
        title = 'Select Duration';
        items = DURATION_PRESETS.map((d) => ({ label: d, value: d }));
        break;
      case 'otherInstructions':
        title = 'Select Other Instructions';
        items = OTHER_INSTRUCTIONS_PRESETS.map((i) => ({ label: i, value: i }));
        break;
      default:
        return;
    }

    setPickerConfig({ title, type, items });
    setPickerVisible(true);
  };

  const handleSelectPickerItem = (val) => {
    switch (pickerConfig.type) {
      case 'preparation':
        setPreparation(val);
        if (val === 'Tab') setDosageUnit('Tablet');
        else if (val === 'Cap') setDosageUnit('Capsule');
        else if (val === 'Syp' || val === 'Susp') setDosageUnit('tsp (5ml)');
        else if (val === 'Drops') setDosageUnit('Drops');
        else if (val === 'Inhaler') setDosageUnit('Puff');
        else if (val === 'Oint' || val === 'Cream' || val === 'Gel') {
          setDosageUnit('Application');
          setRoute('Topical');
        } else if (val === 'Inj') {
          setDosageUnit('Ampoule');
          setRoute('IV');
        }
        setPickerVisible(false);
        break;
      case 'strengthUnit':
        setStrengthUnit(val);
        setPickerVisible(false);
        break;
      case 'dosageUnit':
        setDosageUnit(val);
        setPickerVisible(false);
        break;
      case 'route':
        setRoute(val);
        setPickerVisible(false);
        break;
      case 'frequency':
        setFrequency(val);
        setPickerVisible(false);
        break;
      case 'direction':
        setDirection(val);
        setPickerVisible(false);
        break;
      case 'duration':
        setDuration(val);
        setPickerVisible(false);
        break;
      case 'otherInstructions':
        setSelectedInstructions((prev) =>
          prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
        );
        break;
      default:
        setPickerVisible(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Medicine name is required.');
      return;
    }

    const formattedStrength = strength.trim()
      ? `${strength.trim()} ${strengthUnit}`
      : '';

    const formattedDosage = dosage.trim()
      ? `${dosage.trim()} ${dosageUnit}`
      : dosageUnit;

    const combinedOther = selectedInstructions.join(', ');
    const fullInstructions = [direction, combinedOther, customInstructions.trim()]
      .filter(Boolean)
      .join(' • ');

    const medicineItem = {
      name: name.trim(),
      preparation,
      strength: formattedStrength,
      strengthVal: strength.trim(),
      strengthUnit,
      dosage: formattedDosage,
      dosageVal: dosage.trim(),
      dosageUnit,
      route,
      frequency,
      direction,
      duration,
      instructions: fullInstructions,
      otherInstructions: combinedOther,
      customInstructions: customInstructions.trim(),
    };

    onSave(medicineItem);
    onClose();
  };

  // Preview string
  const previewText = `${preparation ? preparation + '. ' : ''}${name || 'Medicine'} ${
    strength ? strength + ' ' + strengthUnit : ''
  } — ${dosage} ${dosageUnit} • ${frequency} • ${route} • ${direction} • for ${duration}`;

  // Helper to get active label
  const getPrepLabel = () => {
    const found = PREPARATION_OPTIONS.find((p) => p.value === preparation);
    return found ? `${found.icon} ${found.label}` : preparation;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalDialog,
            isTabletOrDesktop && styles.modalDialogTablet,
            isDesktop && styles.modalDialogDesktop,
          ]}
        >
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {initialData ? 'Edit Medicine' : 'Add Medicine'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Tap any field to select from downside options
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* LIVE PREVIEW BANNER */}
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>PRESCRIPTION PREVIEW</Text>
            <Text style={styles.previewText} numberOfLines={2}>
              {previewText}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {error ? (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* RESPONSIVE FORM GRID */}
            <View style={isTabletOrDesktop ? styles.responsiveGrid : undefined}>
              {/* LEFT COLUMN / OR SEQUENTIAL */}
              <View style={isTabletOrDesktop ? styles.gridCol : undefined}>
                {/* PREPARATION (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>PREPARATION / FORMULATION</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => openPicker('preparation')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownValueText}>{getPrepLabel()}</Text>
                    <View style={styles.chevronBadge}>
                      <Text style={styles.chevronText}>▼ Change</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* STRENGTH + UNIT (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>STRENGTH & UNIT</Text>
                  <View style={styles.inputWithSelectorRow}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={strength}
                      onChangeText={setStrength}
                      placeholder="e.g. 500, 650, 250"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={styles.attachedSelectorBtn}
                      onPress={() => openPicker('strengthUnit')}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.attachedSelectorText}>
                        {strengthUnit} ▼
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ROUTE (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>ROUTE OF ADMINISTRATION</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => openPicker('route')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownValueText}>📍 {route}</Text>
                    <View style={styles.chevronBadge}>
                      <Text style={styles.chevronText}>▼ Select</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* DIRECTION (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>DIRECTION (FOOD TIMING)</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => openPicker('direction')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownValueText}>🍽️ {direction}</Text>
                    <View style={styles.chevronBadge}>
                      <Text style={styles.chevronText}>▼ Select</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* RIGHT COLUMN */}
              <View style={isTabletOrDesktop ? styles.gridCol : undefined}>
                {/* MEDICINE NAME */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>MEDICINE NAME *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={(t) => {
                      setName(t);
                      if (error) setError('');
                    }}
                    placeholder="e.g. Paracetamol, Amoxicillin"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                  {/* Quick Suggestions Chips */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionRow}
                  >
                    {COMMON_MEDICINE_SUGGESTIONS.slice(0, 6).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.suggestionChip}
                        onPress={() => setName(s)}
                      >
                        <Text style={styles.suggestionText}>+ {s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* DOSE QUANTITY + UNIT (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>DOSE QUANTITY & UNIT</Text>
                  <View style={styles.inputWithSelectorRow}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={dosage}
                      onChangeText={setDosage}
                      placeholder="e.g. 1, 2, 5"
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      style={styles.attachedSelectorBtn}
                      onPress={() => openPicker('dosageUnit')}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.attachedSelectorText}>
                        {dosageUnit} ▼
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* FREQUENCY (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>FREQUENCY</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => openPicker('frequency')}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownValueText}>⏱️ {frequency}</Text>
                    <View style={styles.chevronBadge}>
                      <Text style={styles.chevronText}>▼ Select</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* DURATION (DOWNSIDE SELECTOR) */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>DURATION</Text>
                  <View style={styles.inputWithSelectorRow}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={duration}
                      onChangeText={setDuration}
                      placeholder="e.g. 5 Days"
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      style={styles.attachedSelectorBtn}
                      onPress={() => openPicker('duration')}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.attachedSelectorText}>Presets ▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* OTHER INSTRUCTIONS (FULL WIDTH) */}
            <View style={styles.formGroup}>
              <View style={styles.instructionsHeaderRow}>
                <Text style={styles.fieldLabel}>
                  OTHER INSTRUCTIONS ({selectedInstructions.length} selected)
                </Text>
                <TouchableOpacity
                  onPress={() => openPicker('otherInstructions')}
                  style={styles.pickInstructionsBtn}
                >
                  <Text style={styles.pickInstructionsBtnText}>
                    ▼ Open Options List
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Selected Pills */}
              {selectedInstructions.length > 0 ? (
                <View style={styles.selectedPillsWrap}>
                  {selectedInstructions.map((item) => (
                    <View key={item} style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>✓ {item}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedInstructions((prev) =>
                            prev.filter((i) => i !== item)
                          )
                        }
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.selectedPillRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptyInstructionsCard}
                  onPress={() => openPicker('otherInstructions')}
                >
                  <Text style={styles.emptyInstructionsText}>
                    + Tap to select instructions (Water, Alcohol, Food precautions...)
                  </Text>
                </TouchableOpacity>
              )}

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                value={customInstructions}
                onChangeText={setCustomInstructions}
                placeholder="Additional instructions / notes (optional)..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* ACTION BUTTON */}
            <View style={styles.actionWrap}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {initialData ? 'UPDATE MEDICINE' : '＋ ADD TO PRESCRIPTION'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ========================================================
            DOWNSIDE SELECTOR SHEET (SLIDES UP FROM BOTTOM)
        ======================================================== */}
        <Modal
          visible={pickerVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPickerVisible(false)}
        >
          <View style={styles.pickerBackdrop}>
            <TouchableOpacity
              style={styles.pickerBackdropPressable}
              activeOpacity={1}
              onPress={() => setPickerVisible(false)}
            />

            <View
              style={[
                styles.downsideSheet,
                isTabletOrDesktop && styles.downsideSheetTablet,
              ]}
            >
              {/* SHEET HANDLE */}
              <View style={styles.sheetHandle} />

              {/* SHEET HEADER */}
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>{pickerConfig.title}</Text>
                  <Text style={styles.sheetSubtitle}>
                    Scroll and tap your desired option
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetDoneBtn}
                  onPress={() => setPickerVisible(false)}
                >
                  <Text style={styles.sheetDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* SCROLLABLE DOWN-SIDE OPTIONS */}
              <ScrollView
                style={styles.sheetScrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 30 }}
              >
                {pickerConfig.items.map((item) => {
                  const val = item.value !== undefined ? item.value : item;
                  const label = item.label || val;
                  const isSelected =
                    pickerConfig.type === 'preparation'
                      ? preparation === val
                      : pickerConfig.type === 'strengthUnit'
                      ? strengthUnit === val
                      : pickerConfig.type === 'dosageUnit'
                      ? dosageUnit === val
                      : pickerConfig.type === 'route'
                      ? route === val
                      : pickerConfig.type === 'frequency'
                      ? frequency === val
                      : pickerConfig.type === 'direction'
                      ? direction === val
                      : pickerConfig.type === 'duration'
                      ? duration === val
                      : selectedInstructions.includes(val);

                  return (
                    <TouchableOpacity
                      key={String(val)}
                      style={[
                        styles.sheetItemRow,
                        isSelected && styles.sheetItemRowSelected,
                      ]}
                      onPress={() => handleSelectPickerItem(val)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {item.icon ? (
                            <Text style={styles.sheetItemIcon}>{item.icon} </Text>
                          ) : null}
                          <Text
                            style={[
                              styles.sheetItemLabel,
                              isSelected && styles.sheetItemLabelSelected,
                            ]}
                          >
                            {label}
                          </Text>
                        </View>
                        {item.desc ? (
                          <Text style={styles.sheetItemDesc}>{item.desc}</Text>
                        ) : null}
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected ? (
                          <Text style={styles.radioCheckmark}>✓</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDialog: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '92%',
    minHeight: '65%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalDialogTablet: {
    alignSelf: 'center',
    borderRadius: 24,
    maxWidth: 720,
    marginBottom: 'auto',
    marginTop: 'auto',
    maxHeight: '88%',
  },
  modalDialogDesktop: {
    maxWidth: 760,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '800',
  },
  previewBox: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  previewText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    lineHeight: 18,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorAlertText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  responsiveGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  chevronBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chevronText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  inputWithSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFlex: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  attachedSelectorBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 95,
  },
  attachedSelectorText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563EB',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  suggestionChip: {
    backgroundColor: '#F0FDF4',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pickInstructionsBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pickInstructionsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  selectedPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  selectedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  selectedPillRemove: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
  },
  emptyInstructionsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyInstructionsText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  actionWrap: {
    marginTop: 14,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* =========================
     DOWNSIDE SELECTOR SHEET
  ========================== */
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  pickerBackdropPressable: {
    flex: 1,
  },
  downsideSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '65%',
    minHeight: '40%',
    width: '100%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 25,
  },
  downsideSheetTablet: {
    alignSelf: 'center',
    maxWidth: 620,
    borderRadius: 24,
    marginBottom: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetDoneBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sheetDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  sheetScrollView: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetItemRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  sheetItemIcon: {
    fontSize: 18,
  },
  sheetItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  sheetItemLabelSelected: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  sheetItemDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  radioCheckmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
