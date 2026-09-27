export function formatPrescriptionDate(value) {
  if (!value) return '—';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeArray(value) {
  if (Array.isArray(value)) return value;

  if (value === null || value === undefined || value === '') {
    return [];
  }

  return [value];
}

function imageHtml(value, className) {
  if (!value) return '';

  const src = String(value).trim();

  if (
    !src.startsWith('http://') &&
    !src.startsWith('https://') &&
    !src.startsWith('data:image/')
  ) {
    return '';
  }

  return `
    <img
      class="${className}"
      src="${escapeHtml(src)}"
    />
  `;
}

export function createPrescriptionHtml(
  visit,
  patient,
  doctor
) {
  const doctorName =
    doctor?.name || 'Doctor';

  const clinicName =
    doctor?.clinicName || 'Veda Clinic';

  const clinicAddress =
    doctor?.clinicAddress || '';

  const phone =
    doctor?.phone || '';

  const email =
    doctor?.email || '';

  const qualification =
    doctor?.qualification || '';

  const specialization =
    doctor?.specialization || '';

  const registrationNumber =
    doctor?.registrationNumber || '';

  const clinicLogo =
    doctor?.clinicLogo || '';

  const signature =
    doctor?.signature || '';

  const patientName =
    patient?.name || 'Unknown Patient';

  const patientId =
    patient?.patientId || '—';

  const age =
    patient?.age !== undefined &&
    patient?.age !== null &&
    patient?.age !== ''
      ? `${patient.age} years`
      : '—';

  const gender =
    patient?.gender || '—';

  const mobile =
    patient?.mobile || '—';

  const address =
    patient?.address || '';

  const symptoms =
    safeArray(visit?.symptoms);

  const diagnosis =
    safeArray(visit?.diagnosis);

  const advice =
    safeArray(visit?.advice);

  const medicines =
    Array.isArray(visit?.medicines)
      ? visit.medicines
      : [];

  const date =
    formatPrescriptionDate(
      visit?.visitDate
    );

  const logo =
    imageHtml(
      clinicLogo,
      'logo'
    );

  const signatureImage =
    imageHtml(
      signature,
      'signature-image'
    );

  const medicinesHtml =
    medicines.length > 0
      ? medicines
          .map((medicine, index) => {
            return `
              <tr>
                <td class="number">
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
                    medicine?.dosage || '—'
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    medicine?.frequency || '—'
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    medicine?.duration || '—'
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    medicine?.instructions || '—'
                  )}
                </td>
              </tr>
            `;
          })
          .join('')
      : `
        <tr>
          <td
            colspan="6"
            class="empty"
          >
            No medicines prescribed.
          </td>
        </tr>
      `;

  const listHtml = (items) => {
    if (!items.length) {
      return `
        <span class="empty">
          Not recorded
        </span>
      `;
    }

    return `
      <ul>
        ${items
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
  };

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

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

body {
  margin: 0;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: #10233f;
  background: #f8fbff;
  font-size: 10px;
}

.page {
  width: 100%;
  min-height: 270mm;
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 14mm 12mm;
}

.header {
  width: 100%;
  border: 1px solid #dfe8f2;
  background: linear-gradient(135deg, #0f172a 0%, #163b6b 100%);
  border-radius: 14px;
  padding: 14px 16px 12px;
  margin-bottom: 14px;
  color: white;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.header-table {
  width: 100%;
  border-collapse: collapse;
}

.header-left {
  width: 62%;
  vertical-align: top;
}

.header-right {
  width: 38%;
  vertical-align: top;
  text-align: right;
}

.doctor-name {
  font-size: 25px;
  font-weight: bold;
  letter-spacing: 0.2px;
  margin: 0 0 6px 0;
  color: #ffffff;
}

.qualification {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.82);
}

.registration {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 5px;
}

.logo {
  max-width: 62px;
  max-height: 58px;
  margin-bottom: 5px;
  border-radius: 12px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.08);
}

.clinic-name {
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
}

.clinic-info {
  font-size: 8.5px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.5;
}

.rx-row {
  width: 100%;
  margin-bottom: 12px;
}

.rx-table {
  width: 100%;
  border-collapse: collapse;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #dff8f5 0%, #dfeeff 100%);
  border: 1px solid #bfe5e2;
  border-radius: 12px;
  padding: 8px 12px 8px 10px;
  color: #0f172a;
  font-weight: bold;
}

.brand-mark {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.4px;
}

.brand-name {
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.date {
  text-align: right;
  font-size: 10px;
  font-weight: bold;
  color: #10233f;
}

.box {
  border: 1px solid #d8e3f1;
  background: #ffffff;
  border-radius: 12px;
  padding: 9px 10px;
  margin-bottom: 12px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.02);
}

.heading {
  font-size: 8px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #1d4ed8;
  border-bottom: 1px solid #dfe8f2;
  padding-bottom: 5px;
  margin-bottom: 7px;
}

.patient-table {
  width: 100%;
  border-collapse: collapse;
}

.patient-table td {
  padding: 4px;
  vertical-align: top;
}

.label {
  display: block;
  font-size: 7px;
  color: #6b7280;
  text-transform: uppercase;
}

.value {
  display: block;
  font-size: 10px;
  font-weight: bold;
  margin-top: 2px;
}

.two-column {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}

.two-column td {
  width: 50%;
  vertical-align: top;
  padding-right: 10px;
}

ul {
  margin: 3px 0 0 0;
  padding-left: 17px;
}

li {
  margin-bottom: 3px;
  font-size: 9px;
}

.empty {
  color: #9ca3af;
  font-style: italic;
}

.vitals {
  width: 100%;
  border-collapse: collapse;
}

.vitals td {
  width: 25%;
  border: 1px solid #e5e7eb;
  padding: 7px;
}

.vital-label {
  font-size: 7px;
  color: #6b7280;
  text-transform: uppercase;
}

.vital-value {
  font-size: 10px;
  font-weight: bold;
  margin-top: 3px;
}

.medicine-table {
  width: 100%;
  border-collapse: collapse;
}

.medicine-table th {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 6px;
  text-align: left;
  font-size: 7.5px;
  text-transform: uppercase;
}

.medicine-table td {
  border: 1px solid #e5e7eb;
  padding: 7px 6px;
  vertical-align: top;
  font-size: 8.5px;
}

.number {
  width: 25px;
  text-align: center;
  font-weight: bold;
}

.small {
  color: #6b7280;
  font-size: 8px;
  margin-top: 2px;
}

.advice {
  border: 1px solid #d1d5db;
  padding: 9px;
  margin-top: 10px;
}

.bottom {
  width: 100%;
  margin-top: 35px;
}

.bottom-table {
  width: 100%;
  border-collapse: collapse;
}

.follow {
  vertical-align: bottom;
  font-size: 9px;
}

.signature {
  width: 180px;
  text-align: center;
  vertical-align: bottom;
}

.signature-image {
  max-width: 140px;
  max-height: 55px;
  margin-bottom: 5px;
}

.signature-line {
  height: 35px;
  border-bottom: 1px solid #111827;
  margin-bottom: 5px;
}

.signature-name {
  font-size: 9px;
  font-weight: bold;
}

.footer {
  margin-top: 25px;
  padding-top: 5px;
  border-top: 1px solid #d1d5db;
  width: 100%;
  font-size: 7px;
  color: #9ca3af;
  text-align: center;
}

</style>

</head>

<body>

<div class="page">

  <!-- DOCTOR -->

  <div class="header">

    <table class="header-table">

      <tr>

        <td class="header-left">

          <div class="doctor-name">
            Dr. ${escapeHtml(doctorName)}
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
                      ? ` | ${escapeHtml(
                          specialization
                        )}`
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

          ${logo}

          <div class="clinic-name">
            ${escapeHtml(clinicName)}
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
                  ${escapeHtml(phone)}
                </div>
              `
              : ''
          }

          ${
            email
              ? `
                <div class="clinic-info">
                  ${escapeHtml(email)}
                </div>
              `
              : ''
          }

        </td>

      </tr>

    </table>

  </div>


  <!-- RX -->

  <div class="rx-row">

    <table class="rx-table">

      <tr>

        <td>
          <div class="brand-badge">
            <div class="brand-mark">V</div>
            <div class="brand-name">Veda</div>
          </div>
        </td>

        <td class="date">
          Date: ${escapeHtml(date)}
        </td>

      </tr>

    </table>

  </div>


  <!-- PATIENT -->

  <div class="box">

    <div class="heading">
      Patient Information
    </div>

    <table class="patient-table">

      <tr>

        <td>
          <span class="label">
            Patient Name
          </span>

          <span class="value">
            ${escapeHtml(patientName)}
          </span>
        </td>

        <td>
          <span class="label">
            Age
          </span>

          <span class="value">
            ${escapeHtml(age)}
          </span>
        </td>

        <td>
          <span class="label">
            Gender
          </span>

          <span class="value">
            ${escapeHtml(gender)}
          </span>
        </td>

        <td>
          <span class="label">
            Patient ID
          </span>

          <span class="value">
            ${escapeHtml(patientId)}
          </span>
        </td>

      </tr>

      <tr>

        <td colspan="2">

          <span class="label">
            Mobile
          </span>

          <span class="value">
            ${escapeHtml(mobile)}
          </span>

        </td>

        <td colspan="2">

          <span class="label">
            Address
          </span>

          <span class="value">
            ${escapeHtml(address || '—')}
          </span>

        </td>

      </tr>

    </table>

  </div>


  <!-- SYMPTOMS + DIAGNOSIS -->

  <table class="two-column">

    <tr>

      <td>

        <div class="box">

          <div class="heading">
            Symptoms / Complaints
          </div>

          ${listHtml(symptoms)}

        </div>

      </td>

      <td>

        <div class="box">

          <div class="heading">
            Diagnosis
          </div>

          ${listHtml(diagnosis)}

        </div>

      </td>

    </tr>

  </table>


  <!-- VITALS -->

  <div class="box">

    <div class="heading">
      Vitals
    </div>

    <table class="vitals">

      <tr>

        <td>

          <div class="vital-label">
            Blood Pressure
          </div>

          <div class="vital-value">
            ${escapeHtml(
              visit?.vitals?.bp || '—'
            )}
          </div>

        </td>

        <td>

          <div class="vital-label">
            Weight
          </div>

          <div class="vital-value">
            ${escapeHtml(
              visit?.vitals?.weight || '—'
            )}
          </div>

        </td>

        <td>

          <div class="vital-label">
            Temperature
          </div>

          <div class="vital-value">
            ${escapeHtml(
              visit?.vitals?.temperature || '—'
            )}
          </div>

        </td>

        <td>

          <div class="vital-label">
            Sugar
          </div>

          <div class="vital-value">
            ${escapeHtml(
              visit?.vitals?.sugar || '—'
            )}
          </div>

        </td>

      </tr>

    </table>

  </div>


  <!-- MEDICINES -->

  <div class="box">

    <div class="heading">
      Prescription
    </div>

    <table class="medicine-table">

      <thead>

        <tr>

          <th>#</th>
          <th>Medicine</th>
          <th>Dose</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Instructions</th>

        </tr>

      </thead>

      <tbody>

        ${medicinesHtml}

      </tbody>

    </table>

  </div>


  <!-- ADVICE -->

  ${
    advice.length
      ? `
        <div class="advice">

          <div class="heading">
            Advice
          </div>

          ${listHtml(advice)}

        </div>
      `
      : ''
  }


  <!-- FOLLOW UP -->

  <div class="bottom">

    <table class="bottom-table">

      <tr>

        <td class="follow">

          <strong>
            Follow-up:
          </strong>

          ${escapeHtml(
            visit?.followUpDate
              ? formatPrescriptionDate(
                  visit.followUpDate
                )
              : 'Not scheduled'
          )}

        </td>

        <td class="signature">

          ${
            signatureImage
              ? signatureImage
              : `
                <div class="signature-line"></div>
              `
          }

          <div class="signature-name">
            Dr. ${escapeHtml(doctorName)}
          </div>

          ${
            registrationNumber
              ? `
                <div class="registration">
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

  </div>


  <div class="footer">

    ${escapeHtml(clinicName)}
    &nbsp; • &nbsp;
    Veda Digital Prescription

  </div>

</div>

</body>

</html>
`;
}