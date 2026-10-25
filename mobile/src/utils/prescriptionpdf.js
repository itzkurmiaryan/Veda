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
  return `<img class="${className}" src="${escapeHtml(src)}" alt="Clinic Logo" />`;
}

export function createPrescriptionHtml(visit, patient, doctor) {
  // Doctor info
  const doctorName = doctor?.name || 'Practitioner';
  const clinicName = doctor?.clinicName || 'Veda Health Clinic';
  const clinicAddress = doctor?.clinicAddress || '';
  const phone = doctor?.phone || '';
  const email = doctor?.email || '';
  const qualification = doctor?.qualification || '';
  const specialization = doctor?.specialization || '';
  const registrationNumber = doctor?.registrationNumber || '';
  const clinicLogo = doctor?.clinicLogo || '';
  const signature = doctor?.signature || '';

  // Patient info (handle if populated or raw)
  const p = patient && typeof patient === 'object' ? patient : (visit?.patientId && typeof visit.patientId === 'object' ? visit.patientId : {});
  const patientName = p?.name || 'Patient';
  const patientId = p?.patientId || 'PT-ID';
  const age = p?.age !== undefined && p?.age !== null && p?.age !== '' ? `${p.age} Yrs` : '—';
  const gender = p?.gender || '—';
  const mobile = p?.mobile || '—';
  const address = p?.address || '';

  // Clinical data
  const symptoms = safeArray(visit?.symptoms);
  const diagnosis = safeArray(visit?.diagnosis);
  const advice = safeArray(visit?.advice);
  const medicines = Array.isArray(visit?.medicines) ? visit.medicines : [];
  const vitals = visit?.vitals || {};
  const date = formatPrescriptionDate(visit?.visitDate || new Date());
  const followUpDate = visit?.followUpDate ? formatPrescriptionDate(visit.followUpDate) : (typeof visit?.followUpDate === 'string' ? visit.followUpDate : 'As needed');

  const logoImg = imageHtml(clinicLogo, 'clinic-logo');
  const signatureImg = imageHtml(signature, 'signature-img');

  // Build Vitals HTML
  const vitalItems = [];
  if (vitals.bp) {
    const sBp = String(vitals.bp);
    vitalItems.push({ label: 'Blood Pressure', val: sBp.includes('mm') ? sBp : `${sBp} mmHg` });
  }
  if (vitals.pulse) {
    const sPulse = String(vitals.pulse);
    vitalItems.push({ label: 'Pulse / Heart Rate', val: sPulse.includes('bpm') ? sPulse : `${sPulse} bpm` });
  }
  if (vitals.temperature) {
    const sTemp = String(vitals.temperature);
    vitalItems.push({ label: 'Temperature', val: sTemp.includes('°') ? sTemp : `${sTemp} °F` });
  }
  if (vitals.weight) {
    const sWeight = String(vitals.weight);
    vitalItems.push({ label: 'Weight', val: sWeight.includes('kg') ? sWeight : `${sWeight} kg` });
  }
  if (vitals.sugar) {
    const sSugar = String(vitals.sugar);
    vitalItems.push({ label: 'Blood Sugar', val: sSugar.includes('mg') ? sSugar : `${sSugar} mg/dL` });
  }
  if (vitals.spo2) {
    const sSpo2 = String(vitals.spo2);
    vitalItems.push({ label: 'SpO2', val: sSpo2.includes('%') ? sSpo2 : `${sSpo2}%` });
  }

  const vitalsHtml = vitalItems.length > 0
    ? `
      <div class="vitals-bar">
        <div class="vitals-title">VITALS:</div>
        <div class="vitals-grid">
          ${vitalItems
            .map(
              (v) => `
              <div class="vital-badge">
                <span class="v-label">${escapeHtml(v.label)}:</span>
                <span class="v-value">${escapeHtml(v.val)}</span>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    `
    : '';

  // Build Medicines Table HTML
  const medicinesHtml = medicines.length > 0
    ? medicines
        .map((m, index) => {
          const prep = m.preparation ? `${m.preparation.toUpperCase()}.` : '';
          const name = m.name || 'Medicine';
          const strength = m.strength ? `<strong>${escapeHtml(m.strength)}</strong>` : '';
          const dosage = m.dosage || '1 unit';
          const frequency = m.frequency || '1-0-1 (BD)';
          const route = m.route || 'Oral';
          const direction = m.direction || 'After food';
          const duration = m.duration || '5 Days';
          const instructions = m.instructions || m.otherInstructions || '';

          return `
            <tr>
              <td class="col-num">${index + 1}</td>
              <td class="col-med">
                <div class="med-main">
                  ${prep ? `<span class="prep-tag">${escapeHtml(prep)}</span>` : ''}
                  <span class="med-name">${escapeHtml(name)}</span>
                  ${strength ? `<span class="med-strength">${strength}</span>` : ''}
                </div>
                ${route ? `<div class="med-sub">Route: <strong>${escapeHtml(route)}</strong></div>` : ''}
              </td>
              <td class="col-dose">
                <span class="dose-badge">${escapeHtml(dosage)}</span>
              </td>
              <td class="col-freq">
                <div class="freq-text">${escapeHtml(frequency)}</div>
                ${direction ? `<div class="direction-tag">${escapeHtml(direction)}</div>` : ''}
              </td>
              <td class="col-dur">
                <span class="dur-badge">${escapeHtml(duration)}</span>
              </td>
              <td class="col-inst">
                ${instructions ? `<div class="inst-text">${escapeHtml(instructions)}</div>` : '<span class="text-muted">—</span>'}
              </td>
            </tr>
          `;
        })
        .join('')
    : `
      <tr>
        <td colspan="6" class="no-meds">No medications prescribed.</td>
      </tr>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Medical Prescription - ${escapeHtml(patientName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .prescription-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 18px 24px;
      background: #ffffff;
      min-height: 270mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* HEADER */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #1d4ed8;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .clinic-cell {
      width: 55%;
      vertical-align: top;
      text-align: left;
    }
    .doctor-cell {
      width: 45%;
      vertical-align: top;
      text-align: right;
    }
    .clinic-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .clinic-logo {
      max-height: 50px;
      max-width: 65px;
      object-fit: contain;
    }
    .clinic-title {
      font-size: 20px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .clinic-meta {
      font-size: 9.5px;
      color: #475569;
      margin-top: 4px;
      line-height: 1.35;
    }
    .doctor-name {
      font-size: 19px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.3px;
    }
    .doctor-qual {
      font-size: 10.5px;
      font-weight: 700;
      color: #1d4ed8;
      margin-top: 2px;
    }
    .doctor-meta {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .doctor-reg {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 800;
      color: #1d4ed8;
      margin-top: 4px;
    }

    /* PATIENT DETAILS BAR */
    .patient-bar {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
    }
    .patient-table {
      width: 100%;
      border-collapse: collapse;
    }
    .patient-table td {
      vertical-align: middle;
      padding: 3px 6px;
    }
    .p-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .p-val {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 1px;
    }
    .p-id-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 800;
    }

    /* VITALS BAR */
    .vitals-bar {
      display: flex;
      align-items: center;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 7px;
      padding: 6px 12px;
      margin-bottom: 12px;
      gap: 12px;
    }
    .vitals-title {
      font-size: 9px;
      font-weight: 900;
      color: #166534;
      letter-spacing: 0.6px;
    }
    .vitals-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .vital-badge {
      font-size: 10px;
      color: #14532d;
    }
    .v-label {
      font-weight: 600;
      color: #166534;
    }
    .v-value {
      font-weight: 800;
      color: #052e16;
    }

    /* SYMPTOMS & DIAGNOSIS */
    .clinical-row {
      display: table;
      width: 100%;
      margin-bottom: 12px;
    }
    .clinical-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-right: 8px;
    }
    .clinical-col:last-child {
      padding-right: 0;
      padding-left: 8px;
    }
    .clinical-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      padding: 8px 12px;
      min-height: 48px;
    }
    .card-title {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #1d4ed8;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .card-content {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
    }

    /* RX BAR */
    .rx-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 14px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #0f172a;
    }
    .rx-symbol {
      font-size: 26px;
      font-weight: 900;
      font-family: "Times New Roman", serif;
      color: #1d4ed8;
      line-height: 1;
    }
    .rx-title-text {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-left: 8px;
    }
    .rx-count-badge {
      font-size: 9.5px;
      font-weight: 800;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid #bfdbfe;
    }

    /* MEDICINES TABLE */
    .rx-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .rx-table th {
      background: #1e293b;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      padding: 7px 8px;
      text-align: left;
    }
    .rx-table td {
      padding: 9px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      font-size: 10.5px;
    }
    .rx-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .col-num {
      width: 25px;
      text-align: center;
      font-weight: 900;
      color: #64748b;
    }
    .col-med {
      width: 32%;
    }
    .med-main {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
    .prep-tag {
      background: #e0e7ff;
      color: #3730a3;
      font-size: 8.5px;
      font-weight: 900;
      padding: 1px 4px;
      border-radius: 3px;
    }
    .med-name {
      font-size: 12px;
      font-weight: 900;
      color: #0f172a;
    }
    .med-strength {
      font-size: 11px;
      color: #1d4ed8;
    }
    .med-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
    }
    .col-dose {
      width: 13%;
    }
    .dose-badge {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
    }
    .col-freq {
      width: 20%;
    }
    .freq-text {
      font-weight: 800;
      color: #1d4ed8;
      font-size: 10.5px;
    }
    .direction-tag {
      font-size: 9px;
      font-weight: 700;
      color: #047857;
      background: #dcfce7;
      padding: 1px 5px;
      border-radius: 3px;
      margin-top: 3px;
      display: inline-block;
    }
    .col-dur {
      width: 12%;
    }
    .dur-badge {
      font-weight: 700;
      color: #334155;
    }
    .col-inst {
      width: 23%;
    }
    .inst-text {
      font-size: 9.5px;
      color: #475569;
      line-height: 1.35;
    }
    .no-meds {
      text-align: center;
      padding: 18px;
      color: #94a3b8;
      font-style: italic;
    }

    /* ADVICE & INSTRUCTIONS */
    .advice-section {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 9px 14px;
      margin-bottom: 14px;
    }
    .advice-title {
      font-size: 9.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #92400e;
      margin-bottom: 4px;
    }
    .advice-list {
      padding-left: 16px;
      font-size: 10.5px;
      color: #78350f;
    }
    .advice-list li {
      margin-bottom: 2px;
    }

    /* SIGNATURE & FOLLOW-UP */
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      padding-top: 10px;
    }
    .follow-up-cell {
      width: 60%;
      vertical-align: bottom;
      padding-bottom: 6px;
    }
    .follow-box {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 12px;
    }
    .follow-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }
    .follow-date {
      font-size: 11px;
      font-weight: 900;
      color: #1e293b;
      margin-top: 1px;
    }
    .signature-cell {
      width: 40%;
      vertical-align: bottom;
      text-align: right;
    }
    .signature-container {
      display: inline-block;
      text-align: center;
      min-width: 170px;
    }
    .signature-img {
      max-height: 50px;
      max-width: 150px;
      margin-bottom: 4px;
    }
    .signature-line {
      width: 100%;
      height: 1px;
      background: #334155;
      margin-bottom: 4px;
    }
    .sig-doctor {
      font-size: 11px;
      font-weight: 900;
      color: #0f172a;
    }
    .sig-reg {
      font-size: 9px;
      color: #64748b;
      margin-top: 1px;
    }

    /* LEGAL DISCLAIMER FOOTER */
    .legal-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 24px;
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    <div>
      <!-- HEADER -->
      <table class="header-table">
        <tr>
          <td class="clinic-cell">
            <div class="clinic-name-row">
              ${logoImg}
              <div>
                <div class="clinic-title">${escapeHtml(clinicName)}</div>
                ${clinicAddress ? `<div class="clinic-meta">📍 ${escapeHtml(clinicAddress)}</div>` : ''}
                ${phone ? `<div class="clinic-meta">📞 ${escapeHtml(phone)}${email ? ` • ✉️ ${escapeHtml(email)}` : ''}</div>` : ''}
              </div>
            </div>
          </td>
          <td class="doctor-cell">
            <div class="doctor-name">Dr. ${escapeHtml(doctorName)}</div>
            ${qualification || specialization ? `<div class="doctor-qual">${escapeHtml(qualification)}${specialization ? ` • ${escapeHtml(specialization)}` : ''}</div>` : ''}
            ${registrationNumber ? `<div class="doctor-reg">Reg. No: ${escapeHtml(registrationNumber)}</div>` : ''}
          </td>
        </tr>
      </table>

      <!-- PATIENT DETAILS BAR -->
      <div class="patient-bar">
        <table class="patient-table">
          <tr>
            <td style="width: 32%;">
              <div class="p-label">Patient Name</div>
              <div class="p-val">${escapeHtml(patientName)}</div>
            </td>
            <td style="width: 22%;">
              <div class="p-label">Age & Gender</div>
              <div class="p-val">${escapeHtml(age)} / ${escapeHtml(gender)}</div>
            </td>
            <td style="width: 24%;">
              <div class="p-label">Patient ID</div>
              <div class="p-val"><span class="p-id-tag">${escapeHtml(patientId)}</span></div>
            </td>
            <td style="width: 22%;">
              <div class="p-label">Prescription Date</div>
              <div class="p-val">🗓️ ${escapeHtml(date)}</div>
            </td>
          </tr>
          ${mobile !== '—' || address ? `
            <tr>
              <td colspan="2" style="padding-top: 6px;">
                <div class="p-label">Mobile Number</div>
                <div class="p-val">${escapeHtml(mobile)}</div>
              </td>
              <td colspan="2" style="padding-top: 6px;">
                <div class="p-label">Address</div>
                <div class="p-val">${escapeHtml(address || '—')}</div>
              </td>
            </tr>
          ` : ''}
        </table>
      </div>

      <!-- VITALS BAR -->
      ${vitalsHtml}

      <!-- SYMPTOMS & DIAGNOSIS -->
      ${(symptoms.length > 0 || diagnosis.length > 0) ? `
        <div class="clinical-row">
          <div class="clinical-col">
            <div class="clinical-card">
              <div class="card-title">Symptoms / Chief Complaints</div>
              <div class="card-content">${symptoms.length > 0 ? escapeHtml(symptoms.join(', ')) : '<span style="color:#94a3b8;">None recorded</span>'}</div>
            </div>
          </div>
          <div class="clinical-col">
            <div class="clinical-card">
              <div class="card-title">Provisional / Final Diagnosis</div>
              <div class="card-content" style="color: #1d4ed8;">${diagnosis.length > 0 ? escapeHtml(diagnosis.join(', ')) : '<span style="color:#94a3b8;">None recorded</span>'}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- RX HEADER -->
      <div class="rx-header-row">
        <div style="display: flex; align-items: baseline;">
          <span class="rx-symbol">℞</span>
          <span class="rx-title-text">Prescribed Medications</span>
        </div>
        <span class="rx-count-badge">${medicines.length} ${medicines.length === 1 ? 'Item' : 'Items'}</span>
      </div>

      <!-- MEDICINES TABLE -->
      <table class="rx-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine & Route</th>
            <th>Dose</th>
            <th>Frequency & Timing</th>
            <th>Duration</th>
            <th>Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${medicinesHtml}
        </tbody>
      </table>

      <!-- ADVICE -->
      ${advice.length > 0 ? `
        <div class="advice-section">
          <div class="advice-title">📋 General Advice & Special Instructions</div>
          <ul class="advice-list">
            ${advice.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    <!-- SIGNATURE & FOLLOW-UP -->
    <div>
      <table class="footer-table">
        <tr>
          <td class="follow-up-cell">
            <div class="follow-box">
              <div class="follow-label">Follow-Up Visit</div>
              <div class="follow-date">🗓️ ${escapeHtml(followUpDate)}</div>
            </div>
          </td>
          <td class="signature-cell">
            <div class="signature-container">
              ${signatureImg ? signatureImg : '<div class="signature-line"></div>'}
              <div class="sig-doctor">Dr. ${escapeHtml(doctorName)}</div>
              ${registrationNumber ? `<div class="sig-reg">Reg. No: ${escapeHtml(registrationNumber)}</div>` : ''}
            </div>
          </td>
        </tr>
      </table>

      <div class="legal-footer">
        Valid digital prescription generated via Veda Smart Digital Healthcare • AlphaAryX<br />
        This prescription is electronically signed by Dr. ${escapeHtml(doctorName)}. Keep all medicines out of reach of children.
      </div>
    </div>
  </div>
</body>
</html>`;
}