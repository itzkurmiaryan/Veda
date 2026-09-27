import React, {
  useCallback,
  useState,
} from 'react';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';

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
     AUTH
  ======================================================= */

  const { doctor } = useAuth();


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

      navigation.goBack();

    } catch (error) {

      console.log(
        '❌ PRESCRIPTION DELETE FAILED'
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

      setDeleteError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Unable to delete prescription.'
      );

    } finally {

      setDeleting(false);

    }
  };


  /* =======================================================
     PRINT PRESCRIPTION
  ======================================================= */

  const printPrescription = async () => {

    if (!visit) {
      return;
    }

    try {

      setActionError('');

      setExporting(true);

      console.log(
        '🖨️ Creating prescription for printing...'
      );

      const patient =
        getPatientObject(
          visit?.patientId
        );

      const html =
        createPrescriptionHtml(
          visit,
          patient,
          doctor
        );

      console.log(
        '🧾 Prescription HTML created'
      );

      if (Platform.OS === 'web') {
        await printHtmlInBrowser(html);
      } else {
        await Print.printAsync({
          html,
        });
      }

      console.log(
        '✅ Print screen opened'
      );

    } catch (error) {

      console.log(
        '❌ PRINT ERROR:',
        error
      );

      setActionError(
        error?.message ||
        'Unable to print prescription.'
      );

    } finally {

      setExporting(false);

    }
  };


  /* =======================================================
     SHARE PDF
  ======================================================= */

  const sharePrescription = async () => {

    if (!visit) {
      return;
    }

    try {

      setActionError('');

      setExporting(true);

      console.log(
        '📄 Creating prescription PDF...'
      );

      const patient =
        getPatientObject(
          visit?.patientId
        );

      const html =
        createPrescriptionHtml(
          visit,
          patient,
          doctor
        );

      if (Platform.OS === 'web') {
        await printHtmlInBrowser(html);
        return;
      }

      const file =
        await Print.printToFileAsync({
          html,
        });

      console.log(
        '📄 PDF created:',
        file?.uri
      );

      if (!file?.uri) {

        throw new Error(
          'PDF file was not created.'
        );
      }

      const available =
        await Sharing.isAvailableAsync();

      if (!available) {

        throw new Error(
          'Sharing is not available on this device.'
        );
      }

      await Sharing.shareAsync(
        file.uri,
        {
          mimeType:
            'application/pdf',

          dialogTitle:
            'Share Prescription PDF',

          UTI:
            'com.adobe.pdf',
        }
      );

      console.log(
        '✅ Prescription PDF shared'
      );

    } catch (error) {

      console.log(
        '❌ SHARE PDF ERROR:',
        error
      );

      setActionError(
        error?.message ||
        'Unable to create or share prescription PDF.'
      );

    } finally {

      setExporting(false);

    }
  };


  /* =======================================================
     DOWNLOAD / SAVE PDF
  ======================================================= */

  const downloadPrescription = async () => {

    if (!visit) {
      return;
    }

    try {

      setActionError('');

      setExporting(true);

      console.log(
        '📥 Creating PDF...'
      );

      const patient =
        getPatientObject(
          visit?.patientId
        );

      const html =
        createPrescriptionHtml(
          visit,
          patient,
          doctor
        );

      if (Platform.OS === 'web') {
        await printHtmlInBrowser(html);
        return;
      }

      const file =
        await Print.printToFileAsync({
          html,
        });

      console.log(
        '📄 PDF generated:',
        file?.uri
      );

      if (!file?.uri) {

        throw new Error(
          'PDF file was not created.'
        );
      }

      const available =
        await Sharing.isAvailableAsync();

      if (!available) {

        throw new Error(
          'Sharing is not available on this device.'
        );
      }

      await Sharing.shareAsync(
        file.uri,
        {
          mimeType:
            'application/pdf',

          dialogTitle:
            'Save or Share Prescription',

          UTI:
            'com.adobe.pdf',
        }
      );

    } catch (error) {

      console.log(
        '❌ DOWNLOAD PDF ERROR:',
        error
      );

      setActionError(
        error?.message ||
        'Unable to create prescription PDF.'
      );

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

        <Text
          style={styles.sectionTitle}
        >
          Medicines
        </Text>

        {medicines.length > 0 ? (

          medicines.map(
            (medicine, index) => (

              <View
                key={
                  medicine?._id ||
                  `medicine-${index}`
                }
                style={styles.medicine}
              >

                <Text
                  style={
                    styles.medicineName
                  }
                >
                  {medicine?.name ||
                    'Medicine'}
                </Text>

                {medicine?.strength ? (

                  <Text
                    style={
                      styles.medicineDetail
                    }
                  >
                    Strength:{' '}
                    {medicine.strength}
                  </Text>

                ) : null}

                {medicine?.dosage ? (

                  <Text
                    style={
                      styles.medicineDetail
                    }
                  >
                    Dosage:{' '}
                    {medicine.dosage}
                  </Text>

                ) : null}

                {medicine?.frequency ? (

                  <Text
                    style={
                      styles.medicineDetail
                    }
                  >
                    Frequency:{' '}
                    {medicine.frequency}
                  </Text>

                ) : null}

                {medicine?.duration ? (

                  <Text
                    style={
                      styles.medicineDetail
                    }
                  >
                    Duration:{' '}
                    {medicine.duration}
                  </Text>

                ) : null}

                {medicine?.instructions ? (

                  <Text
                    style={
                      styles.medicineDetail
                    }
                  >
                    Instructions:{' '}
                    {medicine.instructions}
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


        <Button
          title={
            exporting
              ? 'CREATING PDF...'
              : Platform.OS === 'web'
                ? 'PRINT / SAVE PDF'
                : 'SHARE PDF ON WHATSAPP'
          }
          disabled={exporting}
          onPress={
            sharePrescription
          }
        />


        <Button
          title={
            exporting
              ? 'PLEASE WAIT...'
              : Platform.OS === 'web'
                ? 'PRINT / SAVE PDF'
                : 'DOWNLOAD / SHARE PDF'
          }
          secondary
          disabled={exporting}
          onPress={
            downloadPrescription
          }
        />


        <Button
          title={
            exporting
              ? 'PLEASE WAIT...'
              : 'PRINT PRESCRIPTION'
          }
          secondary
          disabled={exporting}
          onPress={
            printPrescription
          }
        />


        <Button
          title="BACK"
          secondary
          disabled={exporting}
          onPress={() =>
            navigation.goBack()
          }
        />

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
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


/* =========================================================
   HTML LIST
========================================================= */

function htmlList(items) {

  const safeItems =
    safeArray(items);

  if (
    safeItems.length === 0
  ) {

    return `
      <div class="muted">
        None recorded
      </div>
    `;
  }

  return `
    <ul>
      ${safeItems
        .map(
          (item) => `
            <li>
              ${escapeHtml(item)}
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}


/* =========================================================
   IMAGE
========================================================= */

function getImageHtml(
  value,
  className
) {

  if (!value) {
    return '';
  }

  const source =
    String(value).trim();

  if (
    !source.startsWith(
      'http://'
    ) &&
    !source.startsWith(
      'https://'
    ) &&
    !source.startsWith(
      'data:image/'
    )
  ) {
    return '';
  }

  return `
    <img
      class="${className}"
      src="${escapeHtml(source)}"
    />
  `;
}


/* =========================================================
   CREATE PRESCRIPTION HTML
========================================================= */

function createPrescriptionHtml(
  visit,
  patient,
  doctor
) {

  /* -------------------------------------------------------
     DOCTOR
  ------------------------------------------------------- */

  const doctorName =
    doctor?.name ||
    'Doctor';

  const clinicName =
    doctor?.clinicName ||
    'Veda Clinic';

  const clinicAddress =
    doctor?.clinicAddress ||
    '';

  const phone =
    doctor?.phone ||
    '';

  const email =
    doctor?.email ||
    '';

  const qualification =
    doctor?.qualification ||
    '';

  const specialization =
    doctor?.specialization ||
    '';

  const registrationNumber =
    doctor?.registrationNumber ||
    '';

  const clinicLogo =
    doctor?.clinicLogo ||
    '';

  const signature =
    doctor?.signature ||
    '';


  /* -------------------------------------------------------
     PATIENT
  ------------------------------------------------------- */

  const patientName =
    patient?.name ||
    'Unknown Patient';

  const patientId =
    patient?.patientId ||
    '—';

  const age =
    patient?.age !== undefined &&
    patient?.age !== null &&
    patient?.age !== ''
      ? `${patient.age} years`
      : '—';

  const gender =
    patient?.gender ||
    '—';

  const mobile =
    patient?.mobile ||
    '—';

  const address =
    patient?.address ||
    '—';


  /* -------------------------------------------------------
     VISIT DATA
  ------------------------------------------------------- */

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


  const date =
    formatDate(
      visit?.visitDate
    );


  /* -------------------------------------------------------
     LOGO
  ------------------------------------------------------- */

  const logoHtml =
    getImageHtml(
      clinicLogo,
      'clinic-logo'
    );


  /* -------------------------------------------------------
     SIGNATURE
  ------------------------------------------------------- */

  const signatureHtml =
    getImageHtml(
      signature,
      'signature-image'
    );


  /* -------------------------------------------------------
     MEDICINES HTML
  ------------------------------------------------------- */

  const medicinesHtml =
    medicines.length > 0

      ? medicines
          .map(
            (
              medicine,
              index
            ) => {

              return `
                <tr>

                  <td class="medicine-number">
                    ${index + 1}
                  </td>

                  <td>

                    <strong>
                      ${escapeHtml(
                        medicine?.name ||
                        'Medicine'
                      )}
                    </strong>

                    ${
                      medicine?.strength
                        ? `
                          <div class="small">
                            ${escapeHtml(
                              medicine.strength
                            )}
                          </div>
                        `
                        : ''
                    }

                  </td>

                  <td>
                    ${escapeHtml(
                      medicine?.dosage ||
                      '—'
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      medicine?.frequency ||
                      '—'
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      medicine?.duration ||
                      '—'
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      medicine?.instructions ||
                      '—'
                    )}
                  </td>

                </tr>
              `;
            }
          )
          .join('')

      : `
          <tr>

            <td
              colspan="6"
              class="muted center"
            >
              No medicines prescribed
            </td>

          </tr>
        `;


  /* -------------------------------------------------------
     VITALS
  ------------------------------------------------------- */

  const bp =
    visit?.vitals?.bp ||
    '—';

  const weight =
    visit?.vitals?.weight ||
    '—';

  const temperature =
    visit?.vitals?.temperature ||
    '—';

  const sugar =
    visit?.vitals?.sugar ||
    '—';


  /* -------------------------------------------------------
     FOLLOW UP
  ------------------------------------------------------- */

  const followUp =
    visit?.followUpDate
      ? formatDate(
          visit.followUpDate
        )
      : 'Not scheduled';


  /* -------------------------------------------------------
     RETURN HTML
  ------------------------------------------------------- */

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>
Prescription - ${escapeHtml(patientName)}
</title>


<style>

@page {
  size: A4;
  margin: 12mm;
}


* {
  box-sizing: border-box;
}


html,
body {
  margin: 0;
  padding: 0;
  background: #ffffff;
}


body {
  color: #172a46;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  font-size: 10px;
}


.page {
  width: 100%;
  min-height: 270mm;
  position: relative;
  background: #ffffff;
}


/* =====================================================
   TOP LINE
===================================================== */

.top-line {
  height: 4px;
  background: #13b8a6;
  margin-bottom: 14px;
}


/* =====================================================
   HEADER
===================================================== */

.header-table {
  width: 100%;
  border-collapse: collapse;
  border-bottom: 1px solid #dce5ed;
}


.header-left {
  width: 60%;
  vertical-align: top;
  padding-bottom: 12px;
}


.header-right {
  width: 40%;
  vertical-align: top;
  text-align: right;
  padding-bottom: 12px;
}


.doctor-name {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #10233f;
}


.qualification {
  margin-top: 5px;
  color: #6b7a90;
  font-size: 10px;
}


.registration {
  margin-top: 4px;
  color: #6b7a90;
  font-size: 8px;
}


.clinic-logo {
  max-width: 65px;
  max-height: 55px;
  margin-bottom: 4px;
}


.clinic-name {
  color: #10233f;
  font-size: 14px;
  font-weight: bold;
}


.clinic-info {
  color: #6b7a90;
  font-size: 8px;
  line-height: 1.5;
}


/* =====================================================
   RX
===================================================== */

.rx-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 13px;
  margin-bottom: 12px;
}


  .veda-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, #dff9f6 0%, #dfeeff 100%);
    border: 1px solid #bfe7e2;
    border-radius: 12px;
    padding: 8px 12px 8px 10px;
    color: #10233f;
    font-weight: 900;
    box-shadow: 0 8px 20px rgba(16, 35, 63, 0.06);
  }


  .veda-mark {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: linear-gradient(135deg, #10233f 0%, #1769ff 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.3px;
  }


  .veda-word {
    font-size: 11px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
}


/* =====================================================
   PATIENT
===================================================== */

.patient-box {
  border: 1px solid #dce5ed;
  border-left: 4px solid #13b8a6;
  background: #f7fafc;
  padding: 11px;
  margin-bottom: 14px;
}


.heading {
  color: #10233f;
  font-size: 8px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 1px solid #dce5ed;
}


.patient-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 7px;
}


.patient-table td {
  width: 25%;
  padding: 5px;
  vertical-align: top;
}


.label {
  color: #6b7a90;
  font-size: 7px;
  text-transform: uppercase;
  letter-spacing: .5px;
}


.value {
  color: #172a46;
  font-size: 10px;
  font-weight: bold;
  margin-top: 2px;
}


/* =====================================================
   TWO COLUMNS
===================================================== */

.two-column {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 13px;
}


.two-column td {
  width: 50%;
  vertical-align: top;
  padding-right: 8px;
}


.two-column td:last-child {
  padding-right: 0;
  padding-left: 8px;
}


/* =====================================================
   SECTION
===================================================== */

.section {
  margin-bottom: 13px;
}


.section-title {
  color: #10233f;
  font-size: 8px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 2px solid #13b8a6;
}


ul {
  margin: 7px 0 0 0;
  padding-left: 16px;
}


li {
  font-size: 9px;
  line-height: 1.5;
  margin-bottom: 2px;
}


.muted {
  color: #8a98a9;
  font-size: 9px;
}


.center {
  text-align: center;
}


/* =====================================================
   VITALS
===================================================== */

.vitals-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}


.vitals-table td {
  width: 25%;
  border: 1px solid #e5ecf2;
  padding: 7px;
  background: #f7fafc;
}


/* =====================================================
   MEDICINES
===================================================== */

.medicine-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 8px;
}


.medicine-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}


.medicine-rx {
  color: #1769ff;
    font-size: 13px;
    line-height: 1;
    letter-spacing: 1px;
    font-weight: 900;

.medicine-table th {
  background: #10233f;
  color: #ffffff;
  font-size: 7px;
  text-align: left;
  text-transform: uppercase;
  padding: 7px 5px;
  border: 1px solid #10233f;
}


.medicine-table td {
  padding: 7px 5px;
  border: 1px solid #dce5ed;
  vertical-align: top;
}


.medicine-number {
  width: 25px;
  text-align: center;
  color: #1769ff;
  font-weight: bold;
}


.small {
  color: #6b7a90;
  font-size: 8px;
  margin-top: 2px;
}


/* =====================================================
   ADVICE
===================================================== */

.advice-box {
  background: #f0fbf9;
  border: 1px solid #d9efeb;
  padding: 10px;
  margin-top: 12px;
}


/* =====================================================
   BOTTOM
===================================================== */

.bottom-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 30px;
}


.follow-up {
  width: 60%;
  vertical-align: bottom;
  font-size: 9px;
}


.signature {
  width: 40%;
  text-align: center;
  vertical-align: bottom;
}


.signature-image {
  max-width: 135px;
  max-height: 50px;
  margin-bottom: 4px;
}


.signature-line {
  width: 150px;
  height: 35px;
  border-bottom: 1px solid #172a46;
  margin: 0 auto 5px auto;
}


.signature-name {
  color: #172a46;
  font-size: 9px;
  font-weight: bold;
}


.signature-reg {
  color: #6b7a90;
  font-size: 7px;
  margin-top: 2px;
}


/* =====================================================
   FOOTER
===================================================== */

.footer {
  margin-top: 22px;
  border-top: 1px solid #dce5ed;
  padding-top: 6px;
  text-align: center;
  color: #8a98a9;
  font-size: 7px;
}


</style>

</head>


<body>

<div class="page">


  <!-- TOP -->

  <div class="top-line"></div>


  <!-- DOCTOR HEADER -->

  <table class="header-table">

    <tr>

      <td class="header-left">

        <div class="doctor-name">

          Dr.
          ${escapeHtml(doctorName)}

        </div>


        ${
          qualification ||
          specialization
            ? `
              <div class="qualification">

                ${escapeHtml(
                  qualification
                )}

                ${
                  specialization
                    ? `
                      |
                      ${escapeHtml(
                        specialization
                      )}
                    `
                    : ''
                }

              </div>
            `
            : ''
        }


        ${
          registrationNumber
            ? `
              <div class="registration">

                Registration No:
                ${escapeHtml(
                  registrationNumber
                )}

              </div>
            `
            : ''
        }

      </td>


      <td class="header-right">

        ${logoHtml}


        <div class="clinic-name">

          ${escapeHtml(
            clinicName
          )}

        </div>


        ${
          clinicAddress
            ? `
              <div class="clinic-info">

                ${escapeHtml(
                  clinicAddress
                )}

              </div>
            `
            : ''
        }


        ${
          phone
            ? `
              <div class="clinic-info">

                Phone:
                ${escapeHtml(
                  phone
                )}

              </div>
            `
            : ''
        }


        ${
          email
            ? `
              <div class="clinic-info">

                ${escapeHtml(
                  email
                )}

              </div>
            `
            : ''
        }

      </td>

    </tr>

  </table>


  <!-- RX -->

  <table class="rx-table">

    <tr>

      <td>
        <div class="veda-badge">
          <div class="veda-mark">V</div>
          <div class="veda-word">Veda</div>
        </div>
      </td>

      <td class="prescription-date">

        DATE:
        ${escapeHtml(date)}

      </td>

    </tr>

  </table>


  <!-- PATIENT -->

  <section class="patient-box">

    <div class="heading">

      Patient Information

    </div>


    <table class="patient-table">

      <tr>

        <td>

          <div class="label">
            Name
          </div>

          <div class="value">
            ${escapeHtml(
              patientName
            )}
          </div>

        </td>


        <td>

          <div class="label">
            Age
          </div>

          <div class="value">
            ${escapeHtml(age)}
          </div>

        </td>


        <td>

          <div class="label">
            Gender
          </div>

          <div class="value">
            ${escapeHtml(gender)}
          </div>

        </td>


        <td>

          <div class="label">
            Patient ID
          </div>

          <div class="value">
            ${escapeHtml(patientId)}
          </div>

        </td>

      </tr>


      <tr>

        <td>

          <div class="label">
            Mobile
          </div>

          <div class="value">
            ${escapeHtml(mobile)}
          </div>

        </td>


        <td colspan="3">

          <div class="label">
            Address
          </div>

          <div class="value">
            ${escapeHtml(address)}
          </div>

        </td>

      </tr>

    </table>

  </section>


  <!-- SYMPTOMS + DIAGNOSIS -->

  <table class="two-column">

    <tr>

      <td>

        <section class="section">

          <div class="section-title">
            Symptoms / Complaints
          </div>

          ${htmlList(symptoms)}

        </section>

      </td>


      <td>

        <section class="section">

          <div class="section-title">
            Diagnosis
          </div>

          ${htmlList(diagnosis)}

        </section>

      </td>

    </tr>

  </table>


  <!-- VITALS -->

  <section class="section">

    <div class="section-title">
      Vitals
    </div>


    <table class="vitals-table">

      <tr>

        <td>

          <div class="label">
            Blood Pressure
          </div>

          <div class="value">
            ${escapeHtml(bp)}
          </div>

        </td>


        <td>

          <div class="label">
            Weight
          </div>

          <div class="value">
            ${escapeHtml(weight)}
          </div>

        </td>


        <td>

          <div class="label">
            Temperature
          </div>

          <div class="value">
            ${escapeHtml(temperature)}
          </div>

        </td>


        <td>

          <div class="label">
            Sugar
          </div>

          <div class="value">
            ${escapeHtml(sugar)}
          </div>

        </td>

      </tr>

    </table>

  </section>


  <!-- MEDICINES -->

  <section class="section">

    <div class="section-title medicine-heading">
      <span>Prescription</span>
      <span class="medicine-rx">Veda</span>
    </div>


    <table class="medicine-table">

      <thead>

        <tr>

          <th>
            #
          </th>

          <th>
            Medicine
          </th>

          <th>
            Dosage
          </th>

          <th>
            Frequency
          </th>

          <th>
            Duration
          </th>

          <th>
            Instructions
          </th>

        </tr>

      </thead>


      <tbody>

        ${medicinesHtml}

      </tbody>

    </table>

  </section>


  <!-- ADVICE -->

  ${
    advice.length > 0
      ? `
        <section class="advice-box">

          <div class="section-title">
            Advice
          </div>

          ${htmlList(advice)}

        </section>
      `
      : ''
  }


  <!-- FOLLOW UP + SIGNATURE -->

  <table class="bottom-table">

    <tr>

      <td class="follow-up">

        <strong>
          Follow-up:
        </strong>

        ${escapeHtml(
          followUp
        )}

      </td>


      <td class="signature">

        ${
          signatureHtml
            ? signatureHtml
            : `
              <div class="signature-line">
              </div>
            `
        }


        <div class="signature-name">

          Dr.
          ${escapeHtml(
            doctorName
          )}

        </div>


        ${
          registrationNumber
            ? `
              <div class="signature-reg">

                Reg. No:
                ${escapeHtml(
                  registrationNumber
                )}

              </div>
            `
            : ''
        }

      </td>

    </tr>

  </table>


  <!-- FOOTER -->

  <div class="footer">

    ${escapeHtml(
      clinicName
    )}

    &nbsp; • &nbsp;

    Prescription

  </div>


</div>

</body>

</html>
`;
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