import React, {
  useCallback,
  useState,
} from 'react';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { createPrescriptionHtml } from '../utils/prescriptionpdf';

import {
  Button,
  Card,
  Loading,
  Screen,
  colors,
} from '../components/UI';


/* =========================================================
   VISIT DETAIL
========================================================= */

export default function VisitDetail({
  route,
  navigation,
}) {

  /* =======================================================
     VISIT ID
  ======================================================= */

  const id =
    route?.params?.id ||
    route?.params?._id ||
    route?.params?.visitId ||
    null;


  /* =======================================================
     AUTH & DIMENSIONS
  ======================================================= */

  const { doctor, showLoading, showSuccess, showError } = useAuth();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;


  /* =======================================================
     STATE
  ======================================================= */

  const [visit, setVisit] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [exporting, setExporting] =
    useState(false);


  /* =======================================================
     LOAD VISIT
  ======================================================= */

  const loadVisit = useCallback(
    async () => {

      if (!id) {

        console.log(
          '❌ VisitDetail: Prescription ID missing'
        );

        setVisit(null);
        setLoading(false);

        return;
      }

      try {

        setLoading(true);

        setDeleteError('');
        setActionError('');

        console.log(
          '📥 Loading prescription:',
          id
        );

        const response =
          await api.get(
            `/visits/${id}`
          );

        console.log(
          '✅ Prescription response:',
          response?.data
        );

        const loadedVisit =
          response?.data?.data ||
          response?.data?.visit ||
          response?.data ||
          null;

        setVisit(
          loadedVisit
        );

      } catch (error) {

        console.log(
          '❌ LOAD PRESCRIPTION ERROR'
        );

        console.log(
          'STATUS:',
          error?.response?.status
        );

        console.log(
          'DATA:',
          error?.response?.data
        );

        console.log(
          'MESSAGE:',
          error?.message
        );

        setVisit(null);

        setDeleteError(
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Unable to load prescription.'
        );

      } finally {

        setLoading(false);

      }

    },
    [id]
  );


  /* =======================================================
     RELOAD WHEN SCREEN OPENS
  ======================================================= */

  useFocusEffect(
    useCallback(() => {

      loadVisit();

    }, [loadVisit])
  );


  /* =======================================================
     DELETE CONFIRMATION
  ======================================================= */

  const handleDeleteButton = () => {

    console.log(
      '🟢 DELETE PRESCRIPTION BUTTON CLICKED'
    );

    console.log(
      '🆔 Prescription ID:',
      id
    );

    setDeleteError('');

    setShowDeleteConfirm(true);
  };


  /* =======================================================
     CANCEL DELETE
  ======================================================= */

  const cancelDelete = () => {

    if (deleting) {
      return;
    }

    console.log(
      '❌ Prescription delete cancelled'
    );

    setShowDeleteConfirm(false);

    setDeleteError('');
  };


  /* =======================================================
     DELETE PRESCRIPTION
  ======================================================= */

  const deletePrescription = async () => {

    console.log(
      '🔥 PRESCRIPTION DELETE STARTED'
    );

    if (!id) {

      setDeleteError(
        'Prescription ID is missing.'
      );

      return;
    }

    if (deleting) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      showLoading(
        'Deleting Prescription...',
        'Removing prescription record from cloud database...'
      );

      console.log(
        '➡️ DELETE URL:',
        `/visits/${id}`
      );

      const response =
        await api.delete(
          `/visits/${id}`
        );

      console.log(
        '✅ PRESCRIPTION DELETE SUCCESS:',
        response?.data
      );

      setVisit(null);
      setShowDeleteConfirm(false);

      showSuccess(
        'Prescription Deleted',
        'The prescription record was permanently removed.',
        () => {
          navigation.goBack();
        },
        'DONE'
      );
    } catch (error) {
      console.log(
        '❌ PRESCRIPTION DELETE FAILED'
      );

      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to delete prescription.';

      setDeleteError(errMsg);
      showError('Delete Failed', errMsg);
    } finally {
      setDeleting(false);

    }
  };


  /* =======================================================
     PRINT PRESCRIPTION (WIRELESS SYSTEM PRINT / SAVE AS PDF)
  ======================================================= */

  const printPrescription = async () => {
    if (!visit) return;

    try {
      setActionError('');
      setExporting(true);

      const patient = getPatientObject(visit?.patientId);
      const html = createPrescriptionHtml(visit, patient, doctor);

      if (Platform.OS === 'web') {
        await printHtmlInBrowser(html);
      } else {
        // Direct native print dialog (allows wireless printing or Save as PDF)
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.log('❌ PRINT ERROR:', error);
      setActionError(error?.message || 'Unable to print prescription.');
    } finally {
      setExporting(false);
    }
  };


  /* =======================================================
     SHARE TO WHATSAPP (DIRECT PATIENT SUMMARY CHAT)
  ======================================================= */

  const shareToWhatsApp = async () => {
    if (!visit) return;

    try {
      setActionError('');
      const patient = getPatientObject(visit?.patientId);
      const patientName = patient?.name || 'Patient';
      const cleanPhone = (patient?.mobile || '').replace(/[^0-9]/g, '');
      const docName = doctor?.name ? `Dr. ${doctor.name}` : 'Doctor';
      const clinic = doctor?.clinicName || 'Veda Health Clinic';
      const dateStr = formatDate(visit?.visitDate);

      // Build WhatsApp prescription summary
      let text = `📋 *PRESCRIPTION - ${clinic.toUpperCase()}*\n`;
      text += `👨‍⚕️ *Doctor:* ${docName}\n`;
      text += `👤 *Patient:* ${patientName}${patient?.age ? ` (${patient.age}y)` : ''}\n`;
      text += `🗓️ *Date:* ${dateStr}\n`;

      const diag = safeArray(visit?.diagnosis);
      if (diag.length > 0) {
        text += `🩺 *Diagnosis:* ${diag.join(', ')}\n`;
      }

      const meds = Array.isArray(visit?.medicines) ? visit.medicines : [];
      if (meds.length > 0) {
        text += `\n💊 *Prescribed Medications:*\n`;
        meds.forEach((m, idx) => {
          const prep = m.preparation ? `${m.preparation.toUpperCase()}. ` : '';
          const str = m.strength ? ` ${m.strength}` : '';
          const dose = m.dosage ? ` | Dose: ${m.dosage}` : '';
          const freq = m.frequency ? ` | ${m.frequency}` : '';
          const dir = m.direction ? ` (${m.direction})` : '';
          const dur = m.duration ? ` for ${m.duration}` : '';
          const inst = m.instructions ? `\n   Note: ${m.instructions}` : '';
          text += `${idx + 1}. *${prep}${m.name || 'Medicine'}${str}*${dose}${freq}${dir}${dur}${inst}\n`;
        });
      }

      const adv = safeArray(visit?.advice);
      if (adv.length > 0) {
        text += `\n📋 *Advice:* ${adv.join('; ')}\n`;
      }

      if (visit?.followUpDate) {
        text += `\n🗓️ *Follow-Up:* ${formatDate(visit.followUpDate)}\n`;
      }

      text += `\n_Generated via RxVault Smart Digital Healthcare_`;

      const encoded = encodeURIComponent(text);
      let targetNumber = '';
      if (cleanPhone && cleanPhone.length >= 10) {
        targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      }

      const waAppUrl = targetNumber
        ? `whatsapp://send?phone=${targetNumber}&text=${encoded}`
        : `whatsapp://send?text=${encoded}`;

      const waWebUrl = targetNumber
        ? `https://api.whatsapp.com/send?phone=${targetNumber}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;

      let opened = false;
      try {
        const canOpen = await Linking.canOpenURL(waAppUrl);
        if (canOpen) {
          await Linking.openURL(waAppUrl);
          opened = true;
        }
      } catch (e) {
        console.log('App URL check failed, trying web URL:', e);
      }

      if (!opened) {
        await Linking.openURL(waWebUrl);
      }
    } catch (error) {
      console.log('❌ WHATSAPP ERROR:', error);
      // Fallback to PDF file share
      await sharePdfFile();
    }
  };


  /* =======================================================
     SHARE PDF FILE (EXPORT PDF TO ANY APP)
  ======================================================= */

  const sharePdfFile = async () => {
    if (!visit) return;

    try {
      setActionError('');
      setExporting(true);

      const patient = getPatientObject(visit?.patientId);
      const html = createPrescriptionHtml(visit, patient, doctor);

      if (Platform.OS === 'web') {
        await printHtmlInBrowser(html);
        return;
      }

      const file = await Print.printToFileAsync({ html });
      if (!file?.uri) {
        throw new Error('PDF file could not be generated.');
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        throw new Error('Sharing is not available on this device.');
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Prescription - ${patient?.name || 'Patient'}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.log('❌ SHARE PDF ERROR:', error);
      setActionError(error?.message || 'Unable to share prescription PDF.');
    } finally {
      setExporting(false);
    }
  };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return <Loading />;
  }


  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!visit) {

    return (
      <Screen scroll>

        <Card>

          <Text
            style={styles.errorTitle}
          >
            Prescription not found
          </Text>

          <Text
            style={styles.errorText}
          >
            {deleteError ||
              'This prescription could not be loaded.'}
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


  /* =======================================================
     PATIENT
  ======================================================= */

  const patient =
    getPatientObject(
      visit?.patientId
    );


  /* =======================================================
     SAFE DATA
  ======================================================= */

  const symptoms =
    safeArray(
      visit?.symptoms
    );

  const diagnosis =
    safeArray(
      visit?.diagnosis
    );

  const advice =
    safeArray(
      visit?.advice
    );

  const medicines =
    Array.isArray(
      visit?.medicines
    )
      ? visit.medicines
      : [];


  /* =======================================================
     SCREEN
  ======================================================= */

  return (
    <Screen scroll>

      {/* ===================================================
          HEADER
      =================================================== */}

      <View
        style={styles.header}
      >

        <Text
          style={styles.eyebrow}
        >
          PRESCRIPTION
        </Text>

        <Text
          style={styles.title}
        >
          Medical Visit
        </Text>

        <Text
          style={styles.date}
        >
          {formatDate(
            visit?.visitDate
          )}
        </Text>

      </View>


      {/* ===================================================
          PATIENT
      =================================================== */}

      <Card accent>

        <Text
          style={styles.sectionTitle}
        >
          Patient
        </Text>

        <InfoRow
          label="Name"
          value={
            patient?.name ||
            'Unknown patient'
          }
        />

        <InfoRow
          label="Patient ID"
          value={
            patient?.patientId ||
            '—'
          }
        />

        <InfoRow
          label="Mobile"
          value={
            patient?.mobile ||
            '—'
          }
        />

        <InfoRow
          label="Age"
          value={
            patient?.age !== undefined &&
            patient?.age !== null &&
            patient?.age !== ''
              ? `${patient.age} years`
              : '—'
          }
        />

        <InfoRow
          label="Gender"
          value={
            patient?.gender ||
            '—'
          }
        />

      </Card>


      {/* ===================================================
          SYMPTOMS
      =================================================== */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Symptoms
        </Text>

        {symptoms.length > 0 ? (

          <List
            items={symptoms}
          />

        ) : (

          <Text
            style={styles.empty}
          >
            No symptoms recorded.
          </Text>

        )}

      </Card>


      {/* ===================================================
          DIAGNOSIS
      =================================================== */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Diagnosis
        </Text>

        {diagnosis.length > 0 ? (

          <List
            items={diagnosis}
          />

        ) : (

          <Text
            style={styles.empty}
          >
            No diagnosis recorded.
          </Text>

        )}

      </Card>


      {/* ===================================================
          VITALS
      =================================================== */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Vitals
        </Text>

        <InfoRow
          label="Blood Pressure"
          value={
            visit?.vitals?.bp ||
            '—'
          }
        />

        <InfoRow
          label="Weight"
          value={
            visit?.vitals?.weight ||
            '—'
          }
        />

        <InfoRow
          label="Temperature"
          value={
            visit?.vitals?.temperature ||
            '—'
          }
        />

        <InfoRow
          label="Sugar"
          value={
            visit?.vitals?.sugar ||
            '—'
          }
        />

      </Card>


      {/* ===================================================
          MEDICINES
      =================================================== */}

      <Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text
            style={styles.sectionTitle}
          >
            Prescribed Medicines
          </Text>
          <View style={{ backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563EB' }}>
              {medicines.length} {medicines.length === 1 ? 'Med' : 'Meds'}
            </Text>
          </View>
        </View>

        {medicines.length > 0 ? (

          medicines.map(
            (medicine, index) => (

              <View
                key={
                  medicine?._id ||
                  `medicine-${index}`
                }
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >

                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {medicine?.preparation ? (
                    <View style={{ backgroundColor: '#DBEAFE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#1E40AF' }}>
                        {medicine.preparation}
                      </Text>
                    </View>
                  ) : null}

                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: '#0F172A',
                    }}
                  >
                    {index + 1}. {medicine?.name || 'Medicine'} {medicine?.strength || ''}
                  </Text>
                </View>

                {/* BADGES ROW */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                  {medicine?.dosage ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                        📏 {medicine.dosage}
                      </Text>
                    </View>
                  ) : null}

                  {medicine?.frequency ? (
                    <View style={{ backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#BFDBFE' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#1D4ED8' }}>
                        ⏱️ {medicine.frequency}
                      </Text>
                    </View>
                  ) : null}

                  {medicine?.route ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                        📍 {medicine.route}
                      </Text>
                    </View>
                  ) : null}

                  {medicine?.direction ? (
                    <View style={{ backgroundColor: '#ECFDF5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#A7F3D0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>
                        🍽️ {medicine.direction}
                      </Text>
                    </View>
                  ) : null}

                  {medicine?.duration ? (
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                        🗓️ {medicine.duration}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {medicine?.instructions ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#64748B',
                      fontWeight: '600',
                      marginTop: 8,
                      lineHeight: 18,
                    }}
                  >
                    ℹ️ Instructions: {medicine.instructions}
                  </Text>
                ) : null}

              </View>

            )
          )

        ) : (

          <Text
            style={styles.empty}
          >
            No medicines prescribed.
          </Text>

        )}

      </Card>


      {/* ===================================================
          ADVICE
      =================================================== */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Advice
        </Text>

        {advice.length > 0 ? (

          <List
            items={advice}
          />

        ) : (

          <Text
            style={styles.empty}
          >
            No advice recorded.
          </Text>

        )}

      </Card>


      {/* ===================================================
          FOLLOW UP
      =================================================== */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Follow-up
        </Text>

        <InfoRow
          label="Follow-up Date"
          value={
            visit?.followUpDate
              ? formatDate(
                  visit.followUpDate
                )
              : 'Not scheduled'
          }
        />

      </Card>


      {/* ===================================================
          ACTIONS
      =================================================== */}

      <Card>

        <Text
          style={styles.sectionTitle}
        >
          Actions
        </Text>

        {actionError ? (

          <View
            style={styles.errorBox}
          >

            <Text
              style={styles.errorBoxTitle}
            >
              Export Error
            </Text>

            <Text
              style={styles.errorBoxText}
            >
              {actionError}
            </Text>

          </View>

        ) : null}


        <View style={isTabletOrDesktop ? { flexDirection: 'row', flexWrap: 'wrap', gap: 10 } : undefined}>
          {/* WHATSAPP SHARE */}
          <View style={isTabletOrDesktop ? { flex: 1, minWidth: 200 } : { marginBottom: 10 }}>
            <Button
              title="💬 SEND ON WHATSAPP"
              disabled={exporting}
              onPress={shareToWhatsApp}
            />
          </View>

          {/* SYSTEM PRINT / SAVE AS PDF */}
          <View style={isTabletOrDesktop ? { flex: 1, minWidth: 200 } : { marginBottom: 10 }}>
            <Button
              title={exporting ? 'OPENING...' : '🖨️ PRINT / SAVE AS PDF'}
              secondary
              disabled={exporting}
              onPress={printPrescription}
            />
          </View>

          {/* SHARE PDF FILE */}
          <View style={isTabletOrDesktop ? { flex: 1, minWidth: 200 } : { marginBottom: 10 }}>
            <Button
              title={exporting ? 'GENERATING PDF...' : '📤 SHARE PDF FILE'}
              secondary
              disabled={exporting}
              onPress={sharePdfFile}
            />
          </View>

          {/* EDIT */}
          <View style={isTabletOrDesktop ? { flex: 1, minWidth: 200 } : { marginBottom: 10 }}>
            <Button
              title="✏️ EDIT PRESCRIPTION"
              secondary
              disabled={exporting}
              onPress={() =>
                navigation.navigate('EditVisit', {
                  visit,
                })
              }
            />
          </View>

          {/* BACK */}
          <View style={isTabletOrDesktop ? { flex: 1, minWidth: 200 } : { marginBottom: 10 }}>
            <Button
              title="BACK"
              secondary
              disabled={exporting}
              onPress={() =>
                navigation.goBack()
              }
            />
          </View>
        </View>

      </Card>


      {/* ===================================================
          DELETE
      =================================================== */}

      <Card>

        <Text
          style={styles.dangerTitle}
        >
          Danger Zone
        </Text>

        <Text
          style={
            styles.deleteDescription
          }
        >
          Permanently delete this
          prescription. This action
          cannot be undone.
        </Text>


        {!showDeleteConfirm ? (

          <Button
            title="DELETE PRESCRIPTION"
            danger
            disabled={deleting}
            onPress={
              handleDeleteButton
            }
          />

        ) : (

          <View
            style={styles.confirmBox}
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
              Are you sure you want to
              permanently delete this
              prescription?
            </Text>

            <Text
              style={
                styles.confirmItem
              }
            >
              Patient:{' '}
              {patient?.name ||
                'Unknown'}
            </Text>

            <Text
              style={
                styles.confirmItem
              }
            >
              Date:{' '}
              {formatDate(
                visit?.visitDate
              )}
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
                    deletePrescription
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
                  Deleting prescription...
                </Text>

              </View>

            ) : null}

          </View>

        )}


        {deleteError ? (

          <View
            style={styles.errorBox}
          >

            <Text
              style={
                styles.errorBoxTitle
              }
            >
              Error
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


/* =========================================================
   GET PATIENT OBJECT
========================================================= */

function printHtmlInBrowser(html) {
  if (typeof window === 'undefined') {
    throw new Error('Browser printing is unavailable.');
  }

  return new Promise(resolve => {
    const frame = document.createElement('iframe');
    frame.setAttribute('title', 'Prescription print preview');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.style.opacity = '0';
    document.body.appendChild(frame);

    let printed = false;

    const print = () => {
      if (printed) return;
      printed = true;
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1000);
      resolve();
    };

    frame.onload = () => setTimeout(print, 250);
    frame.contentDocument.open();
    frame.contentDocument.write(html);
    frame.contentDocument.close();
    setTimeout(print, 500);
  });
}

function getPatientObject(
  patientId
) {

  if (
    patientId &&
    typeof patientId === 'object'
  ) {
    return patientId;
  }

  return null;
}


/* =========================================================
   SAFE ARRAY
========================================================= */

function safeArray(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return [];
  }

  return [value];
}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}) {

  return (

    <View
      style={styles.infoRow}
    >

      <Text
        style={styles.infoLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.infoValue}
      >
        {value ?? '—'}
      </Text>

    </View>

  );
}


/* =========================================================
   LIST
========================================================= */

function List({
  items,
}) {

  const safeItems =
    safeArray(items);

  if (
    safeItems.length === 0
  ) {
    return null;
  }

  return (

    <View>

      {safeItems.map(
        (item, index) => (

          <Text
            key={
              `${String(item)}-${index}`
            }
            style={
              styles.listItem
            }
          >
            • {String(item)}
          </Text>

        )
      )}

    </View>

  );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

  if (!value) {
    return 'Unknown date';
  }

  try {

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
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


/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    header: {
      marginBottom: 18,
    },

    eyebrow: {
      color:
        colors.blue,

      fontSize: 11,

      fontWeight: '900',

      letterSpacing: 1.2,

      marginBottom: 5,
    },

    title: {
      color:
        colors.ink,

      fontSize: 30,

      fontWeight: '900',
    },

    date: {
      color:
        colors.muted,

      fontSize: 14,

      marginTop: 5,
    },

    sectionTitle: {
      color:
        colors.ink,

      fontSize: 18,

      fontWeight: '900',

      marginBottom: 10,
    },

    infoRow: {
      borderBottomWidth: 1,

      borderBottomColor:
        colors.line,

      paddingVertical: 11,
    },

    infoLabel: {
      color:
        colors.muted,

      fontSize: 11,

      fontWeight: '800',

      textTransform:
        'uppercase',

      marginBottom: 4,
    },

    infoValue: {
      color:
        colors.ink,

      fontSize: 15,

      fontWeight: '600',
    },

    listItem: {
      color:
        colors.ink,

      fontSize: 15,

      lineHeight: 25,
    },

    empty: {
      color:
        colors.muted,

      paddingVertical: 8,
    },

    medicine: {
      borderTopWidth: 1,

      borderTopColor:
        colors.line,

      paddingVertical: 13,
    },

    medicineName: {
      color:
        colors.blue,

      fontSize: 17,

      fontWeight: '900',

      marginBottom: 5,
    },

    medicineDetail: {
      color:
        colors.muted,

      lineHeight: 21,

      marginTop: 2,
    },

    dangerTitle: {
      color:
        colors.danger,

      fontSize: 19,

      fontWeight: '900',

      marginBottom: 7,
    },

    deleteDescription: {
      color:
        colors.muted,

      lineHeight: 21,

      marginBottom: 10,
    },

    confirmBox: {
      backgroundColor:
        '#FFF7F8',

      borderWidth: 1,

      borderColor:
        '#F4C5CD',

      borderRadius: 16,

      padding: 16,

      marginTop: 8,
    },

    confirmTitle: {
      color:
        colors.danger,

      fontSize: 17,

      fontWeight: '900',

      marginBottom: 10,
    },

    confirmText: {
      color:
        colors.ink,

      fontWeight: '700',

      lineHeight: 21,

      marginBottom: 8,
    },

    confirmItem: {
      color:
        colors.muted,

      marginTop: 4,
    },

    confirmButtons: {
      flexDirection:
        'row',

      gap: 10,

      marginTop: 14,
    },

    buttonHalf: {
      flex: 1,
    },

    loadingBox: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 9,

      marginTop: 10,
    },

    loadingText: {
      color:
        colors.danger,

      fontWeight: '700',
    },

    errorBox: {
      backgroundColor:
        '#FFF0F2',

      borderRadius: 12,

      padding: 12,

      marginTop: 12,

      marginBottom: 12,
    },

    errorBoxTitle: {
      color:
        colors.danger,

      fontWeight: '900',

      marginBottom: 4,
    },

    errorBoxText: {
      color:
        colors.ink,

      lineHeight: 20,
    },

    errorTitle: {
      color:
        colors.danger,

      fontSize: 22,

      fontWeight: '900',

      marginBottom: 8,
    },

    errorText: {
      color:
        colors.muted,

      lineHeight: 22,

      marginBottom: 10,
    },

  });