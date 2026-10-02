import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../api/api';

import {
  Button,
  Card,
  FadeIn,
  Loading,
  Screen,
} from '../components/UI';

import PaymentSummaryCard from '../components/PaymentSummaryCard';

import { useAuth } from '../context/AuthContext';

import {
  PaymentEntryModal,
  PaymentHistoryModal,
} from './AdminDashboardComponents';

import adminStyles from './AdminDashboardStyles';


/* =========================================================
   HELPERS
========================================================= */

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value || 0));


const formatDate = (value) => {
  if (!value) return '—';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};


const formatDateTime = (value) => {
  if (!value) return '—';

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};


const getInitials = (name = 'Doctor') => {
  const parts = String(name).trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  subtitle,
  icon,
}) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={styles.statIcon}>
          <Text style={styles.statIconText}>
            {icon}
          </Text>
        </View>

        <Text style={styles.statLabel}>
          {label}
        </Text>
      </View>

      <Text style={styles.statValue}>
        {formatNumber(value)}
      </Text>

      <Text style={styles.statSubtitle}>
        {subtitle}
      </Text>
    </Card>
  );
}


/* =========================================================
   PROFILE ROW
========================================================= */

function ProfileRow({
  label,
  value,
}) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>
        {label}
      </Text>

      <Text style={styles.profileValue}>
        {value || 'Not provided'}
      </Text>
    </View>
  );
}


/* =========================================================
   ACTIVITY BAR
========================================================= */

function ActivityBar({
  label,
  patientCount,
  visitCount,
  maxValue,
}) {
  const patients = Number(patientCount || 0);
  const visits = Number(visitCount || 0);

  const patientWidth =
    maxValue > 0
      ? Math.max(
          (patients / maxValue) * 100,
          patients > 0 ? 4 : 0
        )
      : 0;

  const visitWidth =
    maxValue > 0
      ? Math.max(
          (visits / maxValue) * 100,
          visits > 0 ? 4 : 0
        )
      : 0;

  return (
    <View style={styles.activityRow}>
      <Text style={styles.activityLabel}>
        {label}
      </Text>

      <View style={styles.activityBars}>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.patientBar,
              {
                width: `${patientWidth}%`,
              },
            ]}
          />
        </View>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.visitBar,
              {
                width: `${visitWidth}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.activityNumbers}>
        <Text style={styles.patientNumber}>
          {patients}
        </Text>

        <Text style={styles.visitNumber}>
          {visits}
        </Text>
      </View>
    </View>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  text,
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>
        No activity yet
      </Text>

      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}


/* =========================================================
   PENDING PAYMENT CARD
========================================================= */

function PendingPaymentCard({
  pendingPayment,
  onViewProof,
  onVerify,
  onReject,
  busy,
}) {
  if (!pendingPayment) {
    return null;
  }

  const isPending =
    pendingPayment.status === 'pending';

  const isRejected =
    pendingPayment.status === 'rejected';

  return (
    <Card
      style={[
        styles.pendingPaymentCard,
        isRejected && styles.rejectedPaymentCard,
      ]}
    >
      {/* HEADER */}

      <View style={styles.pendingPaymentHeader}>
        <View style={styles.pendingPaymentTitleWrap}>
          <View
            style={[
              styles.pendingPaymentIcon,
              isRejected
                ? styles.rejectedIcon
                : styles.pendingIcon,
            ]}
          >
            <Text
              style={[
                styles.pendingPaymentIconText,
                isRejected
                  ? styles.rejectedIconText
                  : styles.pendingIconText,
              ]}
            >
              ₹
            </Text>
          </View>

          <View style={styles.pendingPaymentHeading}>
            <Text style={styles.pendingPaymentEyebrow}>
              {isRejected
                ? 'PAYMENT REJECTED'
                : 'PAYMENT VERIFICATION'}
            </Text>

            <Text style={styles.pendingPaymentTitle}>
              {isRejected
                ? 'Payment needs resubmission'
                : 'Doctor submitted a payment'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.pendingStatusBadge,
            isRejected
              ? styles.rejectedStatusBadge
              : styles.pendingStatusBadge,
          ]}
        >
          <Text
            style={[
              styles.pendingStatusText,
              isRejected
                ? styles.rejectedStatusText
                : styles.pendingStatusText,
            ]}
          >
            {isRejected
              ? 'REJECTED'
              : 'PENDING'}
          </Text>
        </View>
      </View>


      {/* PAYMENT AMOUNT */}

      <View style={styles.pendingAmountPanel}>
        <Text style={styles.pendingAmountLabel}>
          SUBMITTED AMOUNT
        </Text>

        <Text style={styles.pendingAmount}>
          ₹{formatNumber(pendingPayment.amount)}
        </Text>

        <Text style={styles.pendingAmountSubtext}>
          {Number(pendingPayment.monthsPaid || 0)}{' '}
          month
          {Number(pendingPayment.monthsPaid || 0) === 1
            ? ''
            : 's'}{' '}
          subscription
        </Text>
      </View>


      {/* DETAILS */}

      <View style={styles.pendingDetailsGrid}>

        <View style={styles.pendingDetailItem}>
          <Text style={styles.pendingDetailLabel}>
            TRANSACTION / UTR
          </Text>

          <Text
            style={styles.pendingDetailValue}
            selectable
          >
            {pendingPayment.transactionId ||
              'Not provided'}
          </Text>
        </View>


        <View style={styles.pendingDetailItem}>
          <Text style={styles.pendingDetailLabel}>
            SUBMITTED
          </Text>

          <Text style={styles.pendingDetailValue}>
            {formatDateTime(
              pendingPayment.submittedAt
            )}
          </Text>
        </View>


        <View style={styles.pendingDetailItem}>
          <Text style={styles.pendingDetailLabel}>
            MONTHS PAID
          </Text>

          <Text style={styles.pendingDetailValue}>
            {pendingPayment.monthsPaid || 0}
          </Text>
        </View>


        <View style={styles.pendingDetailItem}>
          <Text style={styles.pendingDetailLabel}>
            SCREENSHOT
          </Text>

          <Text
            style={[
              styles.pendingDetailValue,
              pendingPayment.paymentProof?.available
                ? styles.proofAvailableText
                : styles.proofMissingText,
            ]}
          >
            {pendingPayment.paymentProof?.available
              ? 'Attached'
              : 'Not attached'}
          </Text>
        </View>

      </View>


      {/* DOCTOR NOTE */}

      {pendingPayment.note ? (
        <View style={styles.doctorPaymentNote}>
          <Text style={styles.pendingDetailLabel}>
            DOCTOR NOTE
          </Text>

          <Text style={styles.doctorPaymentNoteText}>
            {pendingPayment.note}
          </Text>
        </View>
      ) : null}


      {/* ADMIN REJECTION NOTE */}

      {isRejected &&
      pendingPayment.adminNote ? (
        <View style={styles.adminRejectionNote}>
          <Text style={styles.adminRejectionLabel}>
            ADMIN NOTE
          </Text>

          <Text style={styles.adminRejectionText}>
            {pendingPayment.adminNote}
          </Text>

          {pendingPayment.reviewedAt ? (
            <Text style={styles.reviewedAtText}>
              Reviewed: {formatDateTime(
                pendingPayment.reviewedAt
              )}
            </Text>
          ) : null}
        </View>
      ) : null}


      {/* SCREENSHOT BUTTON */}

      {pendingPayment.paymentProof?.available ? (
        <Pressable
          onPress={onViewProof}
          disabled={busy}
          style={({ pressed }) => [
            styles.viewPendingProofButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.viewPendingProofIcon}>
            ▣
          </Text>

          <View style={styles.viewPendingProofTextWrap}>
            <Text style={styles.viewPendingProofTitle}>
              View Payment Screenshot
            </Text>

            <Text style={styles.viewPendingProofSubtext}>
              Open the screenshot submitted by the doctor
            </Text>
          </View>

          <Text style={styles.viewPendingProofArrow}>
            ›
          </Text>
        </Pressable>
      ) : null}


      {/* ACTIONS */}

      {isPending ? (
        <View style={styles.pendingPaymentActions}>

          <View style={styles.pendingActionHalf}>
            <Pressable
              onPress={onReject}
              disabled={busy}
              style={({ pressed }) => [
                styles.rejectPaymentButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.rejectPaymentButtonText}>
                Reject Payment
              </Text>
            </Pressable>
          </View>


          <View style={styles.pendingActionHalf}>
            <Pressable
              onPress={onVerify}
              disabled={busy}
              style={({ pressed }) => [
                styles.verifyPaymentButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.verifyPaymentButtonText}>
                Verify Payment
              </Text>
            </Pressable>
          </View>

        </View>
      ) : (
        <View style={styles.rejectedBottomInfo}>
          <Text style={styles.rejectedBottomText}>
            Doctor can submit a new payment after rejection.
          </Text>
        </View>
      )}

    </Card>
  );
}


/* =========================================================
   MAIN SCREEN
========================================================= */

export default function AdminDoctorDashboard({
  navigation,
  route,
}) {
  const {
    doctor: selectedDoctor,
  } = route.params || {};

  const {
    startAction,
    stopAction,
    actionLoading,
  } = useAuth();


  const [doctor, setDoctor] = useState(
    selectedDoctor || null
  );

  const [accessRequest, setAccessRequest] =
    useState(null);

  const [detailTab, setDetailTab] =
    useState('overview');

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');


  /* =======================================================
     MANUAL PAYMENT STATES
  ======================================================= */

  const [
    paymentEntryOpen,
    setPaymentEntryOpen,
  ] = useState(false);

  const [
    paymentHistoryOpen,
    setPaymentHistoryOpen,
  ] = useState(false);

  const [
    paymentMode,
    setPaymentMode,
  ] = useState(null);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState('');

  const [
    paymentMonthsPaid,
    setPaymentMonthsPaid,
  ] = useState('1');

  const [
    paymentTransactionId,
    setPaymentTransactionId,
  ] = useState('');

  const [
    paymentNote,
    setPaymentNote,
  ] = useState('');

  const [
    paymentProof,
    setPaymentProof,
  ] = useState(null);

  const [
    proofPreview,
    setProofPreview,
  ] = useState(null);


  /* =======================================================
     REJECTION MODAL
  ======================================================= */

  const [
    rejectPaymentOpen,
    setRejectPaymentOpen,
  ] = useState(false);

  const [
    rejectionNote,
    setRejectionNote,
  ] = useState('');


  const doctorId =
    selectedDoctor?._id ||
    selectedDoctor?.id;


  /* =======================================================
     LOAD DOCTOR ANALYTICS + DOCTOR
  ======================================================= */

  const loadDoctorAnalytics = useCallback(
    async () => {
      if (!doctorId) {
        setError(
          'Doctor information is missing.'
        );
        setLoading(false);
        return;
      }

      try {
        setError('');
        setLoading(true);

        const [
          response,
          doctorResponse,
          accessResponse,
        ] = await Promise.all([
          api.get(
            `/analytics/doctors/${doctorId}`
          ),

          api.get(
            `/admin/doctors/${doctorId}`
          ),

          api.get(
            '/admin/access-requests'
          ),
        ]);


        const payload =
          response?.data;


        if (!payload?.success) {
          throw new Error(
            payload?.message ||
              'Unable to load doctor analytics'
          );
        }


        const updatedDoctor =
          doctorResponse?.data?.data ||
          payload.doctor ||
          selectedDoctor ||
          null;


        setDoctor(updatedDoctor);


        const requests =
          accessResponse?.data?.data || [];


        setAccessRequest(
          requests.find((request) => {
            const requestDoctorId =
              typeof request.doctorId === 'object'
                ? request.doctorId?._id
                : request.doctorId;

            return (
              String(requestDoctorId) ===
              String(doctorId)
            );
          }) || null
        );


        setAnalytics(
          payload.data || null
        );

      } catch (err) {
        console.error(
          'DOCTOR ANALYTICS ERROR:',
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Unable to load doctor analytics.'
        );
      } finally {
        setLoading(false);
      }
    },
    [doctorId, selectedDoctor]
  );


  useEffect(() => {
    loadDoctorAnalytics();
  }, [loadDoctorAnalytics]);


  /* =======================================================
     ACTIVITY DATA
  ======================================================= */

  const dailyData = useMemo(() => {
    if (!analytics) return [];

    const patients =
      analytics.patientsDaily || [];

    const visits =
      analytics.visitsDaily || [];

    return patients.map((item, index) => ({
      date: item.date,
      patients: item.count || 0,
      visits:
        visits[index]?.count || 0,
    }));
  }, [analytics]);


  const maxDailyValue = useMemo(() => {
    const values =
      dailyData.flatMap((item) => [
        Number(item.patients || 0),
        Number(item.visits || 0),
      ]);

    return Math.max(
      ...values,
      1
    );
  }, [dailyData]);


  const monthlyData = useMemo(() => {
    if (!analytics) return [];

    const patients =
      analytics.patientsMonthly || [];

    const visits =
      analytics.visitsMonthly || [];

    return patients.map((item, index) => ({
      date: item.date,
      patients: item.count || 0,
      visits:
        visits[index]?.count || 0,
    }));
  }, [analytics]);


  const maxMonthlyValue = useMemo(() => {
    const values =
      monthlyData.flatMap((item) => [
        Number(item.patients || 0),
        Number(item.visits || 0),
      ]);

    return Math.max(
      ...values,
      1
    );
  }, [monthlyData]);


  /* =======================================================
     MESSAGE HELPER
  ======================================================= */

  const showPaymentMessage = (
    title,
    message
  ) => {
    if (Platform.OS === 'web') {
      globalThis.alert(
        `${title}\n\n${message}`
      );
    } else {
      Alert.alert(
        title,
        message
      );
    }
  };


  /* =======================================================
     MANUAL PAYMENT
  ======================================================= */

  const openPaymentEntry = () => {
    setPaymentMode(null);
    setPaymentAmount('');
    setPaymentMonthsPaid('1');
    setPaymentTransactionId('');
    setPaymentNote('');
    setPaymentProof(null);
    setPaymentEntryOpen(true);
  };


  const choosePaymentProof = async () => {
    try {
      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();


      if (!permission.granted) {
        throw new Error(
          'Allow photo access to attach a screenshot.'
        );
      }


      const result =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.45,
          });


      if (result.canceled) {
        return;
      }


      const image =
        result.assets?.[0];


      if (!image?.uri) {
        throw new Error(
          'Select a valid screenshot.'
        );
      }


      const resizeAction =
        image.width >= image.height
          ? {
              resize: {
                width: 1000,
              },
            }
          : {
              resize: {
                height: 1000,
              },
            };


      const compressed =
        await ImageManipulator
          .manipulateAsync(
            image.uri,
            [resizeAction],
            {
              compress: 0.4,
              format:
                ImageManipulator.SaveFormat
                  .JPEG,
              base64: true,
            }
          );


      if (
        !compressed.base64 ||
        compressed.base64.length >
          1400000
      ) {
        throw new Error(
          'Screenshot is too large. Choose a smaller image.'
        );
      }


      setPaymentProof({
        data: compressed.base64,
        contentType: 'image/jpeg',
        fileName:
          image.fileName ||
          'payment-proof.jpg',
        uri: compressed.uri,
      });

    } catch (requestError) {
      showPaymentMessage(
        'Unable to select screenshot',
        requestError.message ||
          'Please try another image.'
      );
    }
  };


  const submitPaidPayment = async () => {
    const amount =
      Number(paymentAmount);

    const monthsPaid =
      Number(paymentMonthsPaid);


    if (
      !doctor?._id ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(monthsPaid) ||
      monthsPaid < 1 ||
      monthsPaid > 24
    ) {
      showPaymentMessage(
        'Invalid payment',
        'Enter a valid amount and months paid between 1 and 24.'
      );
      return;
    }


    try {
      startAction(
        'Saving payment...',
        'Recording the doctor payment details.'
      );


      const response =
        await api.patch(
          `/admin/doctors/${doctor._id}/payment`,
          {
            status: 'paid',
            amount,
            monthsPaid,
            transactionId:
              paymentTransactionId.trim(),
            note:
              paymentNote.trim(),
            paymentProof:
              paymentProof
                ? {
                    data:
                      paymentProof.data,
                    contentType:
                      paymentProof.contentType,
                    fileName:
                      paymentProof.fileName,
                  }
                : null,
          }
        );


      const updated =
        response?.data?.data;


      if (
        updated?.paymentStatus !==
          'paid' ||
        (updated?.paymentHistory?.length || 0) <=
          (doctor.paymentHistory?.length || 0)
      ) {
        throw new Error(
          'The server did not confirm the payment record.'
        );
      }


      setDoctor(updated);
      setPaymentEntryOpen(false);


      showPaymentMessage(
        'Payment recorded',
        `₹${amount} recorded for ${monthsPaid} month(s).`
      );

    } catch (requestError) {
      showPaymentMessage(
        'Payment update failed',
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to save payment.'
      );
    } finally {
      stopAction();
    }
  };


  const submitUnpaidStatus = async () => {
    if (!doctor?._id) return;


    try {
      startAction(
        'Updating payment...',
        'Keeping the doctor marked unpaid.'
      );


      const response =
        await api.patch(
          `/admin/doctors/${doctor._id}/payment`,
          {
            status: 'unpaid',
          }
        );


      const updated =
        response?.data?.data;


      if (
        updated?.paymentStatus !==
        'pending'
      ) {
        throw new Error(
          'The server did not confirm unpaid status.'
        );
      }


      setDoctor(updated);
      setPaymentEntryOpen(false);


      showPaymentMessage(
        'Payment unpaid',
        'No payment record was added.'
      );

    } catch (requestError) {
      showPaymentMessage(
        'Payment update failed',
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to update payment.'
      );
    } finally {
      stopAction();
    }
  };


  /* =======================================================
     VERIFIED PAYMENT PROOF
  ======================================================= */

  const openPaymentProof = async (
    record
  ) => {
    if (
      !doctor?._id ||
      !record?._id
    ) {
      return;
    }


    try {
      startAction(
        'Loading screenshot...',
        'Fetching the saved payment proof.'
      );


      const response =
        await api.get(
          `/admin/doctors/${doctor._id}/payments/${record._id}/proof`
        );


      const proof =
        response?.data?.data;


      if (!proof?.data) {
        throw new Error(
          'Screenshot is unavailable.'
        );
      }


      setProofPreview({
        uri:
          `data:${proof.contentType};base64,${proof.data}`,
        fileName:
          proof.fileName,
      });

    } catch (requestError) {
      showPaymentMessage(
        'Unable to open screenshot',
        requestError.response?.data?.message ||
          requestError.message ||
          'Please try again.'
      );
    } finally {
      stopAction();
    }
  };


  /* =======================================================
     PENDING PAYMENT PROOF
  ======================================================= */

  const openPendingPaymentProof =
    async () => {
      if (!doctor?._id) {
        return;
      }


      try {
        startAction(
          'Loading screenshot...',
          'Fetching the doctor payment screenshot.'
        );


        const response =
          await api.get(
            `/admin/doctors/${doctor._id}/payment-pending-proof`
          );


        const proof =
          response?.data?.data;


        if (!proof?.data) {
          throw new Error(
            'Pending payment screenshot is unavailable.'
          );
        }


        setProofPreview({
          uri:
            `data:${proof.contentType || 'image/jpeg'};base64,${proof.data}`,
          fileName:
            proof.fileName ||
            'pending-payment.jpg',
        });

      } catch (requestError) {
        showPaymentMessage(
          'Unable to open screenshot',
          requestError.response?.data?.message ||
            requestError.message ||
            'Please try again.'
        );
      } finally {
        stopAction();
      }
    };


  /* =======================================================
     VERIFY PENDING PAYMENT
  ======================================================= */

  const verifyPendingPayment =
    async () => {
      if (
        !doctor?._id ||
        doctor.pendingPayment?.status !==
          'pending'
      ) {
        return;
      }


      const amount =
        Number(
          doctor.pendingPayment.amount || 0
        );

      const months =
        Number(
          doctor.pendingPayment.monthsPaid || 0
        );


      const verify = async () => {
        try {
          startAction(
            'Verifying payment...',
            'Adding the submitted payment to the doctor billing history.'
          );


          const response =
            await api.post(
              `/admin/doctors/${doctor._id}/payment/verify`,
              {}
            );


          const updated =
            response?.data?.data;


          if (!updated) {
            throw new Error(
              'Server did not return the updated doctor.'
            );
          }


          setDoctor(updated);


          showPaymentMessage(
            'Payment verified',
            `₹${formatNumber(amount)} for ${months} month(s) has been verified successfully.`
          );

        } catch (requestError) {
          showPaymentMessage(
            'Verification failed',
            requestError.response?.data?.message ||
              requestError.message ||
              'Unable to verify payment.'
          );
        } finally {
          stopAction();
        }
      };


      if (Platform.OS === 'web') {
        const confirmed =
          globalThis.confirm(
            `Verify ₹${formatNumber(amount)} payment for ${months} month(s)?\n\nThis will add the payment to the verified payment history.`
          );

        if (confirmed) {
          verify();
        }

        return;
      }


      Alert.alert(
        'Verify Payment?',
        `Verify ₹${formatNumber(amount)} for ${months} month(s)?\n\nThis payment will be added to the doctor's verified payment history.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Verify',
            onPress: verify,
          },
        ]
      );
    };


  /* =======================================================
     OPEN REJECTION
  ======================================================= */

  const openRejectPayment =
    () => {
      if (
        doctor?.pendingPayment?.status !==
        'pending'
      ) {
        return;
      }

      setRejectionNote('');
      setRejectPaymentOpen(true);
    };


  /* =======================================================
     REJECT PENDING PAYMENT
  ======================================================= */

  const rejectPendingPayment =
    async () => {
      if (
        !doctor?._id ||
        doctor.pendingPayment?.status !==
          'pending'
      ) {
        return;
      }


      const note =
        rejectionNote.trim();


      if (!note) {
        showPaymentMessage(
          'Admin note required',
          'Please enter a reason for rejecting this payment.'
        );
        return;
      }


      try {
        startAction(
          'Rejecting payment...',
          'Saving the rejection reason for the doctor.'
        );


        const response =
          await api.post(
            `/admin/doctors/${doctor._id}/payment/reject`,
            {
              adminNote: note,
            }
          );


        const updated =
          response?.data?.data;


        if (!updated) {
          throw new Error(
            'Server did not return the updated doctor.'
          );
        }


        setDoctor(updated);
        setRejectPaymentOpen(false);
        setRejectionNote('');


        showPaymentMessage(
          'Payment rejected',
          'The payment has been rejected and the doctor can resubmit it.'
        );

      } catch (requestError) {
        showPaymentMessage(
          'Rejection failed',
          requestError.response?.data?.message ||
            requestError.message ||
            'Unable to reject payment.'
        );
      } finally {
        stopAction();
      }
    };


  /* =======================================================
     DELETE PAYMENT RECORD
  ======================================================= */

  const deletePaymentRecord =
    (record) => {
      if (
        !doctor?._id ||
        !record?._id
      ) {
        return;
      }


      const removeRecord =
        async () => {
          try {
            startAction(
              'Deleting payment record...',
              'Updating payment history.'
            );


            const response =
              await api.delete(
                `/admin/doctors/${doctor._id}/payments/${record._id}`
              );


            if (
              response?.data?.data
            ) {
              setDoctor(
                response.data.data
              );
            }

          } catch (requestError) {
            showPaymentMessage(
              'Unable to delete payment',
              requestError.response?.data?.message ||
                requestError.message ||
                'Unable to delete payment.'
            );
          } finally {
            stopAction();
          }
        };


      const message =
        'Delete this payment record? Revenue and current payment status will be recalculated.';


      if (Platform.OS === 'web') {
        if (
          globalThis.confirm(
            message
          )
        ) {
          removeRecord();
        }

        return;
      }


      Alert.alert(
        'Delete payment record?',
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress:
              removeRecord,
          },
        ]
      );
    };


  /* =======================================================
     ACCESS REQUEST
  ======================================================= */

  const reviewAccessRequest =
    async (action) => {
      if (!accessRequest?._id) {
        return;
      }


      try {
        startAction(
          action === 'approve'
            ? 'Approving access request...'
            : 'Rejecting access request...',
          'Updating this doctor’s access request.'
        );


        const response =
          await api.post(
            `/admin/access-requests/${accessRequest._id}/${action}`
          );


        setAccessRequest(null);


        const updatedDoctor =
          response?.data?.data;


        if (
          updatedDoctor?._id ===
          doctor?._id
        ) {
          setDoctor(
            updatedDoctor
          );
        }


        showPaymentMessage(
          action === 'approve'
            ? 'Access approved'
            : 'Access request rejected',
          doctor?.name ||
            'Doctor access request updated.'
        );

      } catch (requestError) {
        showPaymentMessage(
          'Access request failed',
          requestError.response?.data?.message ||
            requestError.message ||
            'Unable to update access request.'
        );
      } finally {
        stopAction();
      }
    };


  /* =======================================================
     ACCESS REQUEST PROOF
  ======================================================= */

  const viewAccessRequestProof =
    async () => {
      if (!accessRequest?._id) {
        return;
      }


      try {
        startAction(
          'Loading screenshot...',
          'Fetching the attached proof.'
        );


        const response =
          await api.get(
            `/admin/access-requests/${accessRequest._id}/payment-proof`
          );


        const proof =
          response?.data?.data;


        if (!proof?.data) {
          throw new Error(
            'Screenshot is unavailable.'
          );
        }


        setProofPreview({
          uri:
            `data:${proof.contentType};base64,${proof.data}`,
          fileName:
            proof.fileName ||
            'Payment screenshot',
        });

      } catch (requestError) {
        showPaymentMessage(
          'Unable to open screenshot',
          requestError.response?.data?.message ||
            requestError.message ||
            'Please try again.'
        );
      } finally {
        stopAction();
      }
    };


  /* =======================================================
     DELETE DOCTOR
  ======================================================= */

  const handleDelete =
    () => {
      if (!doctor?._id) {
        return;
      }


      Alert.alert(
        'Delete Doctor',
        `Are you sure you want to permanently delete ${doctor.name || 'this doctor'}?\n\nAll patients and prescriptions belonging to this doctor will also be deleted.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },

          {
            text: 'Delete',
            style: 'destructive',

            onPress:
              async () => {
                try {
                  startAction(
                    'Deleting doctor...',
                    'Removing doctor and clinical records'
                  );


                  await api.delete(
                    `/admin/doctors/${doctor._id}`
                  );


                  stopAction();


                  Alert.alert(
                    'Doctor Deleted',
                    'Doctor and related clinical records were deleted successfully.',
                    [
                      {
                        text: 'OK',
                        onPress:
                          () =>
                            navigation.goBack(),
                      },
                    ]
                  );

                } catch (err) {
                  stopAction();


                  Alert.alert(
                    'Delete Failed',
                    err?.response?.data?.message ||
                      'Unable to delete doctor.'
                  );
                }
              },
          },
        ]
      );
    };


  /* =======================================================
     ACCESS TOGGLE
  ======================================================= */

  const handleAccessToggle =
    async () => {
      if (!doctor?._id) {
        return;
      }


      const nextActive =
        doctor.active === false;


      try {
        startAction(
          nextActive
            ? 'Restoring doctor access...'
            : 'Disabling doctor access...',
          'Updating account permissions'
        );


        const response =
          await api.patch(
            `/admin/doctors/${doctor._id}/access`,
            {
              active:
                nextActive,
            }
          );


        const updated =
          response?.data?.data;


        if (updated) {
          setDoctor(updated);
        } else {
          setDoctor(
            (current) => ({
              ...current,
              active:
                nextActive,
            })
          );
        }

      } catch (err) {
        Alert.alert(
          'Action Failed',
          err?.response?.data?.message ||
            'Unable to update doctor access.'
        );
      } finally {
        stopAction();
      }
    };


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <Screen scroll>
        <View style={styles.loadingContainer}>
          <Loading />

          <Text style={styles.loadingTitle}>
            Loading doctor analytics
          </Text>

          <Text style={styles.loadingText}>
            Preparing clinical performance data...
          </Text>
        </View>
      </Screen>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !doctor) {
    return (
      <Screen scroll>
        <View style={styles.errorContainer}>

          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>
              !
            </Text>
          </View>

          <Text style={styles.errorTitle}>
            Analytics unavailable
          </Text>

          <Text style={styles.errorText}>
            {error ||
              'Doctor information could not be loaded.'}
          </Text>

          <Button
            title="TRY AGAIN"
            onPress={
              loadDoctorAnalytics
            }
          />

          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backErrorButton}
          >
            <Text style={styles.backErrorText}>
              Back to Admin Dashboard
            </Text>
          </Pressable>

        </View>
      </Screen>
    );
  }


  /* =======================================================
     VALUES
  ======================================================= */

  const active =
    doctor.active !== false;


  const totalPatients =
    analytics?.totalPatients || 0;


  const totalVisits =
    analytics?.totalVisits || 0;


  const newPatientsToday =
    analytics?.newPatientsToday || 0;


  const weeklyPatients =
    analytics?.weekly?.patientCount ||
    0;


  const weeklyVisits =
    analytics?.weekly?.visitCount ||
    0;


  const pendingPayment =
    doctor.pendingPayment;


  const hasPendingPayment =
    pendingPayment?.status ===
    'pending';


  return (
    <Screen scroll>

      <FadeIn>

        {/* =================================================
            TOP BAR
        ================================================= */}

        <View style={styles.topBar}>

          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>

            <Text style={styles.backText}>
              Doctors
            </Text>
          </Pressable>


          <View style={styles.topTitleWrap}>

            <Text style={styles.topEyebrow}>
              VEDA ADMIN
            </Text>

            <Text style={styles.topTitle}>
              Doctor Analytics
            </Text>

          </View>


          <View style={styles.topSpacer} />

        </View>


        {/* =================================================
            DOCTOR HEADER
        ================================================= */}

        <Card style={styles.doctorHero}>

          <View style={styles.heroTop}>

            <View style={styles.doctorIdentity}>

              {doctor.clinicLogo ? (
                <Image
                  source={{
                    uri:
                      doctor.clinicLogo,
                  }}
                  style={
                    styles.doctorImage
                  }
                />
              ) : (
                <View
                  style={
                    styles.doctorInitials
                  }
                >
                  <Text
                    style={
                      styles.doctorInitialsText
                    }
                  >
                    {getInitials(
                      doctor.name
                    )}
                  </Text>
                </View>
              )}


              <View style={styles.identityText}>

                <Text
                  style={styles.doctorName}
                >
                  {doctor.name ||
                    'Doctor'}
                </Text>

                <Text
                  style={
                    styles.doctorSpecialization
                  }
                >
                  {doctor.specialization ||
                    'Medical Professional'}
                </Text>

                <Text
                  style={styles.doctorEmail}
                >
                  {doctor.email ||
                    'No email'}
                </Text>

              </View>

            </View>


            <View
              style={[
                styles.statusBadge,
                active
                  ? styles.activeBadge
                  : styles.inactiveBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  active
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  active
                    ? styles.activeText
                    : styles.inactiveText,
                ]}
              >
                {active
                  ? 'ACTIVE'
                  : 'DISABLED'}
              </Text>
            </View>

          </View>


          <View
            style={styles.heroDivider}
          />


          <View style={styles.heroMeta}>

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>
                QUALIFICATION
              </Text>

              <Text style={styles.metaValue}>
                {doctor.qualification ||
                  'Not provided'}
              </Text>
            </View>


            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>
                REGISTRATION
              </Text>

              <Text style={styles.metaValue}>
                {doctor.registrationNumber ||
                  'Not provided'}
              </Text>
            </View>


            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>
                JOINED
              </Text>

              <Text style={styles.metaValue}>
                {formatDate(
                  analytics?.joinedAt ||
                    doctor.createdAt
                )}
              </Text>
            </View>

          </View>


          <View style={styles.heroActions}>

            <Pressable
              onPress={() =>
                navigation.navigate(
                  'AdminDoctorEdit',
                  {
                    doctor,
                  }
                )
              }
              style={({ pressed }) => [
                styles.editButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.editButtonIcon
                }
              >
                ✎
              </Text>

              <Text
                style={
                  styles.editButtonText
                }
              >
                Edit Doctor Profile
              </Text>
            </Pressable>


            <Pressable
              onPress={
                handleAccessToggle
              }
              disabled={
                actionLoading
              }
              style={({ pressed }) => [
                styles.accessButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.accessButtonText
                }
              >
                {active
                  ? 'Disable Access'
                  : 'Restore Access'}
              </Text>
            </Pressable>

          </View>

        </Card>


        {/* =================================================
            TABS
        ================================================= */}

        <View
          style={styles.detailTabs}
        >
          {[
            ['overview', 'Overview'],
            ['billing', 'Billing'],
            ['profile', 'Profile'],
          ].map(
            ([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{
                  selected:
                    detailTab === value,
                }}
                onPress={() =>
                  setDetailTab(value)
                }
                style={[
                  styles.detailTab,
                  detailTab === value &&
                    styles.detailTabSelected,
                ]}
              >
                <Text
                  style={[
                    styles.detailTabText,
                    detailTab === value &&
                      styles.detailTabTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            )
          )}
        </View>


        {/* =================================================
            BILLING
        ================================================= */}

        {detailTab === 'billing' ? (
          <>

            {/* ACCESS REQUEST */}

            {accessRequest ? (
              <>
                <View
                  style={
                    styles.sectionHeader
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.sectionEyebrow
                      }
                    >
                      ACCESS CONTROL
                    </Text>

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Pending access request
                    </Text>
                  </View>
                </View>


                <Card
                  style={
                    styles.accessRequestPanel
                  }
                >
                  <Text
                    style={
                      styles.accessRequestMessage
                    }
                  >
                    {accessRequest.message ||
                      'This doctor requested access to the workspace.'}
                  </Text>


                  {accessRequest
                    .paymentProof
                    ?.available ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={
                        viewAccessRequestProof
                      }
                      style={
                        styles.accessProofButton
                      }
                    >
                      <Text
                        style={
                          styles.accessProofText
                        }
                      >
                        View attached payment screenshot
                      </Text>
                    </Pressable>
                  ) : null}


                  <View
                    style={
                      styles.paymentControls
                    }
                  >
                    <View
                      style={
                        styles.paymentControl
                      }
                    >
                      <Button
                        title="Reject request"
                        danger
                        onPress={() =>
                          reviewAccessRequest(
                            'reject'
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      />
                    </View>


                    <View
                      style={
                        styles.paymentControl
                      }
                    >
                      <Button
                        title="Approve access"
                        onPress={() =>
                          reviewAccessRequest(
                            'approve'
                          )
                        }
                        disabled={
                          actionLoading
                        }
                      />
                    </View>
                  </View>

                </Card>
              </>
            ) : null}


            {/* BILLING HEADER */}

            <View
              style={styles.sectionHeader}
            >
              <View>
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  BILLING
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Payment management
                </Text>
              </View>
            </View>


            {/* =================================================
                DOCTOR SUBMITTED PAYMENT
            ================================================= */}

            {pendingPayment ? (
              <PendingPaymentCard
                pendingPayment={
                  pendingPayment
                }
                onViewProof={
                  openPendingPaymentProof
                }
                onVerify={
                  verifyPendingPayment
                }
                onReject={
                  openRejectPayment
                }
                busy={
                  actionLoading
                }
              />
            ) : null}


            {!pendingPayment ? (
              <Card
                style={
                  styles.noPendingPaymentCard
                }
              >
                <View
                  style={
                    styles.noPendingIcon
                  }
                >
                  <Text
                    style={
                      styles.noPendingIconText
                    }
                  >
                    ✓
                  </Text>
                </View>

                <View
                  style={
                    styles.noPendingTextWrap
                  }
                >
                  <Text
                    style={
                      styles.noPendingTitle
                    }
                  >
                    No pending payment
                  </Text>

                  <Text
                    style={
                      styles.noPendingText
                    }
                  >
                    New doctor-submitted payments will appear here for verification.
                  </Text>
                </View>
              </Card>
            ) : null}


            {/* EXISTING BILLING SUMMARY */}

            <PaymentSummaryCard
              doctor={doctor}
              onHistory={() =>
                setPaymentHistoryOpen(
                  true
                )
              }
            />


            {/* MANUAL ADMIN PAYMENT */}

            <View
              style={
                styles.adminPaymentActions
              }
            >
              <Button
                title={
                  doctor.paymentStatus ===
                  'paid'
                    ? 'Change payment status'
                    : 'Mark paid / unpaid'
                }
                onPress={
                  openPaymentEntry
                }
                disabled={
                  actionLoading
                }
              />
            </View>

          </>
        ) : null}


        {/* =================================================
            OVERVIEW
        ================================================= */}

        {detailTab === 'overview' ? (
          <>

            <View
              style={styles.sectionHeader}
            >
              <View>
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  CLINICAL OVERVIEW
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Practice performance
                </Text>
              </View>
            </View>


            <View
              style={styles.statsGrid}
            >

              <StatCard
                icon="P"
                label="Total Patients"
                value={
                  totalPatients
                }
                subtitle="Patients registered"
              />


              <StatCard
                icon="V"
                label="Total Visits"
                value={
                  totalVisits
                }
                subtitle="Clinical visits"
              />


              <StatCard
                icon="+"
                label="New Today"
                value={
                  newPatientsToday
                }
                subtitle="Patients added today"
              />


              <StatCard
                icon="7"
                label="Last 28 Days"
                value={
                  weeklyPatients
                }
                subtitle={`${formatNumber(
                  weeklyVisits
                )} visits in same period`}
              />

            </View>


            {/* 28 DAY SNAPSHOT */}

            <Card
              style={
                styles.snapshotCard
              }
            >
              <View
                style={
                  styles.cardHeaderRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    RECENT ACTIVITY
                  </Text>

                  <Text
                    style={
                      styles.snapshotTitle
                    }
                  >
                    Last 28 days
                  </Text>
                </View>

                <View
                  style={
                    styles.snapshotBadge
                  }
                >
                  <Text
                    style={
                      styles.snapshotBadgeText
                    }
                  >
                    {formatNumber(
                      weeklyVisits
                    )}{' '}
                    visits
                  </Text>
                </View>
              </View>


              <View
                style={
                  styles.snapshotNumbers
                }
              >

                <View
                  style={
                    styles.snapshotNumberBlock
                  }
                >
                  <Text
                    style={
                      styles.snapshotNumber
                    }
                  >
                    {formatNumber(
                      weeklyPatients
                    )}
                  </Text>

                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Patients
                  </Text>
                </View>


                <View
                  style={
                    styles.snapshotDivider
                  }
                />


                <View
                  style={
                    styles.snapshotNumberBlock
                  }
                >
                  <Text
                    style={
                      styles.snapshotNumber
                    }
                  >
                    {formatNumber(
                      weeklyVisits
                    )}
                  </Text>

                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Visits
                  </Text>
                </View>


                <View
                  style={
                    styles.snapshotDivider
                  }
                />


                <View
                  style={
                    styles.snapshotNumberBlock
                  }
                >
                  <Text
                    style={
                      styles.snapshotNumber
                    }
                  >
                    {totalPatients > 0
                      ? (
                          totalVisits /
                          totalPatients
                        ).toFixed(1)
                      : '0.0'}
                  </Text>

                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Visits / patient
                  </Text>
                </View>

              </View>

            </Card>


            {/* DAILY ANALYTICS */}

            <Card
              style={
                styles.analyticsCard
              }
            >

              <View
                style={
                  styles.cardHeaderRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    DAILY ACTIVITY
                  </Text>

                  <Text
                    style={
                      styles.analyticsTitle
                    }
                  >
                    Patient & visit activity
                  </Text>
                </View>


                <View
                  style={styles.legend}
                >

                  <View
                    style={
                      styles.legendItem
                    }
                  >
                    <View
                      style={[
                        styles.legendDot,
                        styles.patientLegend,
                      ]}
                    />

                    <Text
                      style={
                        styles.legendText
                      }
                    >
                      Patients
                    </Text>
                  </View>


                  <View
                    style={
                      styles.legendItem
                    }
                  >
                    <View
                      style={[
                        styles.legendDot,
                        styles.visitLegend,
                      ]}
                    />

                    <Text
                      style={
                        styles.legendText
                      }
                    >
                      Visits
                    </Text>
                  </View>

                </View>
              </View>


              {dailyData.length > 0 ? (
                <View
                  style={styles.chart}
                >
                  {dailyData.map(
                    (
                      item,
                      index
                    ) => (
                      <ActivityBar
                        key={`${item.date}-${index}`}
                        label={formatDate(
                          item.date
                        )}
                        patientCount={
                          item.patients
                        }
                        visitCount={
                          item.visits
                        }
                        maxValue={
                          maxDailyValue
                        }
                      />
                    )
                  )}
                </View>
              ) : (
                <EmptyState
                  text="Daily activity will appear here once clinical activity is recorded."
                />
              )}

            </Card>


            {/* MONTHLY ANALYTICS */}

            <Card
              style={
                styles.analyticsCard
              }
            >

              <View
                style={
                  styles.cardHeaderRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    MONTHLY TREND
                  </Text>

                  <Text
                    style={
                      styles.analyticsTitle
                    }
                  >
                    Practice activity
                  </Text>
                </View>
              </View>


              {monthlyData.length > 0 ? (
                <View
                  style={styles.chart}
                >
                  {monthlyData.map(
                    (
                      item,
                      index
                    ) => (
                      <ActivityBar
                        key={`${item.date}-${index}`}
                        label={formatDate(
                          item.date
                        )}
                        patientCount={
                          item.patients
                        }
                        visitCount={
                          item.visits
                        }
                        maxValue={
                          maxMonthlyValue
                        }
                      />
                    )
                  )}
                </View>
              ) : (
                <EmptyState
                  text="Monthly analytics will appear after the doctor has enough activity data."
                />
              )}

            </Card>

          </>
        ) : null}


        {/* =================================================
            PROFILE
        ================================================= */}

        {detailTab === 'profile' ? (
          <>

            <Card
              style={
                styles.profileCard
              }
            >

              <View
                style={
                  styles.cardHeaderRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    ACCOUNT INFORMATION
                  </Text>

                  <Text
                    style={
                      styles.profileTitle
                    }
                  >
                    Doctor profile
                  </Text>
                </View>


                <Pressable
                  onPress={() =>
                    navigation.navigate(
                      'AdminDoctorEdit',
                      {
                        doctor,
                      }
                    )
                  }
                  style={({ pressed }) => [
                    styles.smallEditButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      styles.smallEditText
                    }
                  >
                    Edit
                  </Text>
                </Pressable>

              </View>


              <View
                style={
                  styles.profileGrid
                }
              >

                <ProfileRow
                  label="Full name"
                  value={
                    doctor.name
                  }
                />

                <ProfileRow
                  label="Email"
                  value={
                    doctor.email
                  }
                />

                <ProfileRow
                  label="Phone"
                  value={
                    doctor.phone
                  }
                />

                <ProfileRow
                  label="Specialization"
                  value={
                    doctor.specialization
                  }
                />

                <ProfileRow
                  label="Qualification"
                  value={
                    doctor.qualification
                  }
                />

                <ProfileRow
                  label="Registration number"
                  value={
                    doctor.registrationNumber
                  }
                />

                <ProfileRow
                  label="Clinic name"
                  value={
                    doctor.clinicName
                  }
                />

                <ProfileRow
                  label="Clinic address"
                  value={
                    doctor.clinicAddress
                  }
                />

              </View>

            </Card>


            {/* ADMIN ACTIONS */}

            <Card
              style={
                styles.dangerCard
              }
            >

              <Text
                style={
                  styles.dangerEyebrow
                }
              >
                ADMINISTRATIVE ACTION
              </Text>

              <Text
                style={
                  styles.dangerTitle
                }
              >
                Remove doctor
              </Text>

              <Text
                style={
                  styles.dangerDescription
                }
              >
                Permanently deletes this doctor and all
                patients, visits and prescriptions associated
                with the account.
              </Text>


              <Pressable
                onPress={
                  handleDelete
                }
                disabled={
                  actionLoading
                }
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.deleteButtonText
                  }
                >
                  Permanently Delete Doctor
                </Text>
              </Pressable>

            </Card>

          </>
        ) : null}


        <View
          style={
            styles.bottomSpace
          }
        />

      </FadeIn>


      {/* =================================================
          MANUAL PAYMENT MODAL
      ================================================= */}

      <PaymentEntryModal
        visible={
          paymentEntryOpen
        }
        doctor={doctor}
        mode={paymentMode}
        onModeChange={
          setPaymentMode
        }
        amount={
          paymentAmount
        }
        note={
          paymentNote
        }
        transactionId={
          paymentTransactionId
        }
        monthsPaid={
          paymentMonthsPaid
        }
        paymentProof={
          paymentProof
        }
        busy={
          actionLoading
        }
        onAmountChange={
          setPaymentAmount
        }
        onNoteChange={
          setPaymentNote
        }
        onTransactionIdChange={
          setPaymentTransactionId
        }
        onMonthsPaidChange={
          setPaymentMonthsPaid
        }
        onPickProof={
          choosePaymentProof
        }
        onRemoveProof={() =>
          setPaymentProof(null)
        }
        onCancel={() =>
          setPaymentEntryOpen(false)
        }
        onSubmit={
          submitPaidPayment
        }
        onMarkUnpaid={
          submitUnpaidStatus
        }
      />


      {/* =================================================
          PAYMENT HISTORY
      ================================================= */}

      <PaymentHistoryModal
        doctor={
          paymentHistoryOpen
            ? doctor
            : null
        }
        onClose={() =>
          setPaymentHistoryOpen(
            false
          )
        }
        onViewProof={
          openPaymentProof
        }
        onDeleteRecord={
          deletePaymentRecord
        }
      />


      {/* =================================================
          REJECT PAYMENT MODAL
      ================================================= */}

      <Modal
        visible={
          rejectPaymentOpen
        }
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!actionLoading) {
            setRejectPaymentOpen(
              false
            );
          }
        }}
      >
        <View
          style={
            styles.rejectModalOverlay
          }
        >

          <View
            style={
              styles.rejectModalCard
            }
          >

            <View
              style={
                styles.rejectModalIcon
              }
            >
              <Text
                style={
                  styles.rejectModalIconText
                }
              >
                !
              </Text>
            </View>


            <Text
              style={
                styles.rejectModalTitle
              }
            >
              Reject Payment
            </Text>


            <Text
              style={
                styles.rejectModalDescription
              }
            >
              Enter a clear reason so the doctor knows
              what needs to be corrected before resubmitting.
            </Text>


            <Text
              style={
                styles.rejectInputLabel
              }
            >
              ADMIN NOTE *
            </Text>


            <TextInput
              value={
                rejectionNote
              }
              onChangeText={
                setRejectionNote
              }
              placeholder="Example: UTR is not visible in the screenshot."
              placeholderTextColor="#9AA6B5"
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={
                !actionLoading
              }
              style={
                styles.rejectTextInput
              }
            />


            <Text
              style={
                styles.rejectCharacterCount
              }
            >
              {rejectionNote.length}/500
            </Text>


            <View
              style={
                styles.rejectModalActions
              }
            >

              <Pressable
                onPress={() =>
                  setRejectPaymentOpen(
                    false
                  )
                }
                disabled={
                  actionLoading
                }
                style={({ pressed }) => [
                  styles.rejectCancelButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.rejectCancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>


              <Pressable
                onPress={
                  rejectPendingPayment
                }
                disabled={
                  actionLoading
                }
                style={({ pressed }) => [
                  styles.rejectConfirmButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.rejectConfirmText
                  }
                >
                  Reject Payment
                </Text>
              </Pressable>

            </View>

          </View>

        </View>
      </Modal>


      {/* =================================================
          SCREENSHOT PREVIEW
      ================================================= */}

      <Modal
        visible={
          Boolean(proofPreview)
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setProofPreview(null)
        }
      >
        <Pressable
          style={
            adminStyles.proofOverlay
          }
          onPress={() =>
            setProofPreview(null)
          }
        >
          <View
            style={
              adminStyles.proofModal
            }
          >

            <Text
              style={
                adminStyles.proofTitle
              }
            >
              {proofPreview?.fileName ||
                'Payment screenshot'}
            </Text>


            {proofPreview ? (
              <Image
                source={{
                  uri:
                    proofPreview.uri,
                }}
                resizeMode="contain"
                style={
                  adminStyles.proofImage
                }
              />
            ) : null}

          </View>
        </Pressable>
      </Modal>

    </Screen>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  loadingContainer: {
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 19,
    fontWeight: '800',
    color: '#14233B',
  },

  loadingText: {
    marginTop: 7,
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },

  errorContainer: {
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEECEC',
    marginBottom: 18,
  },

  errorIconText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#D64545',
  },

  errorTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#14233B',
  },

  errorText: {
    marginTop: 8,
    marginBottom: 22,
    color: '#718096',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  backErrorButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  backErrorText: {
    color: '#147D82',
    fontWeight: '800',
    fontSize: 14,
  },

  topBar: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backButton: {
    minWidth: 82,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backArrow: {
    fontSize: 34,
    lineHeight: 34,
    color: '#14233B',
    marginRight: 5,
  },

  backText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#52637A',
  },

  topTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },

  topEyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: '900',
    color: '#147D82',
  },

  topTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '900',
    color: '#14233B',
  },

  topSpacer: {
    width: 82,
  },

  detailTabs: {
    flexDirection: 'row',
    padding: 4,
    marginVertical: 14,
    borderRadius: 8,
    backgroundColor: '#E9EFF0',
  },

  detailTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 6,
  },

  detailTabSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE7E8',
  },

  detailTabText: {
    color: '#63747E',
    fontSize: 11,
    fontWeight: '700',
  },

  detailTabTextSelected: {
    color: '#087A66',
    fontWeight: '900',
  },

  doctorHero: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAF2',
  },

  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  doctorIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },

  doctorImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8EEF5',
  },

  doctorInitials: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3F4',
    borderWidth: 1,
    borderColor: '#D2E7E8',
  },

  doctorInitialsText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#147D82',
  },

  identityText: {
    flex: 1,
    marginLeft: 14,
  },

  doctorName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14233B',
  },

  doctorSpecialization: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#147D82',
  },

  doctorEmail: {
    marginTop: 5,
    fontSize: 12,
    color: '#7A8798',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },

  activeBadge: {
    backgroundColor: '#ECF8F4',
    borderColor: '#CBEDE1',
  },

  inactiveBadge: {
    backgroundColor: '#FFF4F1',
    borderColor: '#F3D6CE',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  activeDot: {
    backgroundColor: '#1B9B72',
  },

  inactiveDot: {
    backgroundColor: '#D25A4A',
  },

  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  activeText: {
    color: '#16815E',
  },

  inactiveText: {
    color: '#B54C3D',
  },

  heroDivider: {
    height: 1,
    backgroundColor: '#E9EDF3',
    marginVertical: 18,
  },

  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  metaItem: {
    width: '33.33%',
    paddingRight: 12,
    marginBottom: 5,
  },

  metaLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#98A4B4',
  },

  metaValue: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '700',
    color: '#34445A',
  },

  heroActions: {
    flexDirection: 'row',
    marginTop: 18,
  },

  editButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#14233B',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
  },

  editButtonIcon: {
    color: '#FFFFFF',
    fontSize: 17,
    marginRight: 7,
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  accessButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginLeft: 9,
  },

  accessButtonText: {
    color: '#52637A',
    fontSize: 11,
    fontWeight: '900',
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 13,
  },

  sectionEyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: '900',
    color: '#147D82',
  },

  sectionTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '900',
    color: '#14233B',
  },


  /* =======================================================
     PENDING PAYMENT
  ======================================================= */

  pendingPaymentCard: {
    marginBottom: 12,
    padding: 18,
    backgroundColor: '#FFFBF2',
    borderWidth: 1,
    borderColor: '#F2DFB0',
  },

  rejectedPaymentCard: {
    backgroundColor: '#FFF8F7',
    borderColor: '#F0D2CD',
  },

  pendingPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  pendingPaymentTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: 10,
  },

  pendingPaymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  pendingIcon: {
    backgroundColor: '#FFF0C7',
  },

  rejectedIcon: {
    backgroundColor: '#FCE3DF',
  },

  pendingPaymentIconText: {
    fontSize: 17,
    fontWeight: '900',
  },

  pendingIconText: {
    color: '#A96A00',
  },

  rejectedIconText: {
    color: '#B44A3E',
  },

  pendingPaymentHeading: {
    flex: 1,
  },

  pendingPaymentEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: '900',
    color: '#A36B08',
  },

  pendingPaymentTitle: {
    marginTop: 4,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    color: '#26384F',
  },

  pendingStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  pendingStatusBadge: {
    backgroundColor: '#FFF1C9',
    borderColor: '#F1D88E',
  },

  rejectedStatusBadge: {
    backgroundColor: '#FCE7E3',
    borderColor: '#F0C9C2',
  },

  pendingStatusText: {
    color: '#996100',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  rejectedStatusText: {
    color: '#A9463A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  pendingAmountPanel: {
    marginTop: 17,
    padding: 16,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6CF',
  },

  pendingAmountLabel: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: '900',
    color: '#9B8C6A',
  },

  pendingAmount: {
    marginTop: 4,
    fontSize: 29,
    fontWeight: '900',
    color: '#14233B',
  },

  pendingAmountSubtext: {
    marginTop: 2,
    fontSize: 11,
    color: '#7D7565',
    fontWeight: '700',
  },

  pendingDetailsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  pendingDetailItem: {
    width: '50%',
    paddingRight: 10,
    marginBottom: 13,
  },

  pendingDetailLabel: {
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: '900',
    color: '#929BA8',
  },

  pendingDetailValue: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: '#34445A',
  },

  proofAvailableText: {
    color: '#16815E',
  },

  proofMissingText: {
    color: '#B54C3D',
  },

  doctorPaymentNote: {
    marginTop: 1,
    padding: 13,
    borderRadius: 11,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E6EAF0',
  },

  doctorPaymentNoteText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#52637A',
    fontWeight: '600',
  },

  adminRejectionNote: {
    marginTop: 12,
    padding: 13,
    borderRadius: 11,
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#F2D4CE',
  },

  adminRejectionLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '900',
    color: '#B34C40',
  },

  adminRejectionText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: '#74433C',
    fontWeight: '700',
  },

  reviewedAtText: {
    marginTop: 7,
    fontSize: 10,
    color: '#A77B74',
  },

  viewPendingProofButton: {
    marginTop: 13,
    minHeight: 57,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E8EE',
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewPendingProofIcon: {
    fontSize: 19,
    color: '#147D82',
    marginRight: 10,
  },

  viewPendingProofTextWrap: {
    flex: 1,
  },

  viewPendingProofTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#34445A',
  },

  viewPendingProofSubtext: {
    marginTop: 3,
    fontSize: 9,
    color: '#8995A4',
  },

  viewPendingProofArrow: {
    fontSize: 23,
    color: '#8A97A6',
    marginLeft: 7,
  },

  pendingPaymentActions: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginTop: 14,
  },

  pendingActionHalf: {
    flex: 1,
    marginHorizontal: 4,
  },

  rejectPaymentButton: {
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#F0CEC7',
    paddingHorizontal: 10,
  },

  rejectPaymentButtonText: {
    color: '#A94739',
    fontSize: 11,
    fontWeight: '900',
  },

  verifyPaymentButton: {
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16815E',
    borderWidth: 1,
    borderColor: '#16815E',
    paddingHorizontal: 10,
  },

  verifyPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  rejectedBottomInfo: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0DCD8',
  },

  rejectedBottomText: {
    fontSize: 10,
    color: '#956A63',
    fontWeight: '700',
    textAlign: 'center',
  },

  noPendingPaymentCard: {
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FCFA',
    borderWidth: 1,
    borderColor: '#DCEDE6',
  },

  noPendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F5EE',
  },

  noPendingIconText: {
    color: '#16815E',
    fontSize: 17,
    fontWeight: '900',
  },

  noPendingTextWrap: {
    flex: 1,
    marginLeft: 11,
  },

  noPendingTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#34445A',
  },

  noPendingText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: '#82908E',
  },


  /* =======================================================
     BILLING / ACCESS
  ======================================================= */

  adminPaymentActions: {
    marginTop: 10,
    marginBottom: 4,
  },

  accessRequestPanel: {
    marginBottom: 4,
  },

  accessRequestMessage: {
    color: '#52637A',
    fontSize: 12,
    lineHeight: 18,
  },

  accessProofButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 6,
  },

  accessProofText: {
    color: '#147D82',
    fontSize: 11,
    fontWeight: '800',
  },

  paymentControls: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginTop: 14,
  },

  paymentControl: {
    flex: 1,
    marginHorizontal: 4,
  },


  /* =======================================================
     STATS
  ======================================================= */

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48.4%',
    minHeight: 132,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },

  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF7F7',
  },

  statIconText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#147D82',
  },

  statLabel: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    fontWeight: '800',
    color: '#65758A',
  },

  statValue: {
    marginTop: 13,
    fontSize: 27,
    fontWeight: '900',
    color: '#14233B',
  },

  statSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: '#98A4B4',
  },


  /* =======================================================
     SNAPSHOT
  ======================================================= */

  snapshotCard: {
    marginTop: 10,
    padding: 19,
    backgroundColor: '#14233B',
    borderRadius: 16,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardEyebrow: {
    fontSize: 8,
    letterSpacing: 1.6,
    fontWeight: '900',
    color: '#8795A9',
  },

  snapshotTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  analyticsTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    color: '#14233B',
  },

  profileTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    color: '#14233B',
  },

  snapshotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#23354F',
  },

  snapshotBadgeText: {
    color: '#B9C8D9',
    fontSize: 10,
    fontWeight: '800',
  },

  snapshotNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },

  snapshotNumberBlock: {
    flex: 1,
  },

  snapshotNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  snapshotLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#9EACBE',
  },

  snapshotDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#33465F',
    marginHorizontal: 12,
  },


  /* =======================================================
     ANALYTICS
  ======================================================= */

  analyticsCard: {
    marginTop: 10,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 4,
  },

  patientLegend: {
    backgroundColor: '#147D82',
  },

  visitLegend: {
    backgroundColor: '#7C8DA3',
  },

  legendText: {
    fontSize: 9,
    color: '#718096',
    fontWeight: '700',
  },

  chart: {
    marginTop: 20,
  },

  activityRow: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  activityLabel: {
    width: 70,
    fontSize: 9,
    color: '#7B8899',
    fontWeight: '700',
  },

  activityBars: {
    flex: 1,
  },

  barTrack: {
    height: 7,
    borderRadius: 5,
    backgroundColor: '#EDF1F5',
    overflow: 'hidden',
    marginVertical: 2,
  },

  patientBar: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#147D82',
  },

  visitBar: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#7C8DA3',
  },

  activityNumbers: {
    width: 48,
    marginLeft: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  patientNumber: {
    fontSize: 9,
    fontWeight: '900',
    color: '#147D82',
  },

  visitNumber: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7C8DA3',
  },


  /* =======================================================
     PROFILE
  ======================================================= */

  profileCard: {
    marginTop: 10,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },

  smallEditButton: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EDF7F7',
  },

  smallEditText: {
    color: '#147D82',
    fontSize: 10,
    fontWeight: '900',
  },

  profileGrid: {
    marginTop: 14,
  },

  profileRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },

  profileLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: '#98A4B4',
    textTransform: 'uppercase',
  },

  profileValue: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#34445A',
    fontWeight: '700',
  },


  /* =======================================================
     DANGER
  ======================================================= */

  dangerCard: {
    marginTop: 10,
    padding: 18,
    backgroundColor: '#FFF9F8',
    borderWidth: 1,
    borderColor: '#F1DEDA',
  },

  dangerEyebrow: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: '900',
    color: '#C55A4A',
  },

  dangerTitle: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: '900',
    color: '#5E2E28',
  },

  dangerDescription: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: '#87645E',
  },

  deleteButton: {
    marginTop: 15,
    minHeight: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A94739',
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },


  /* =======================================================
     EMPTY
  ======================================================= */

  emptyState: {
    paddingVertical: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#52637A',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: '#98A4B4',
  },


  /* =======================================================
     REJECTION MODAL
  ======================================================= */

  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 35, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  rejectModalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  rejectModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCE7E3',
    marginBottom: 12,
  },

  rejectModalIconText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#A94739',
  },

  rejectModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14233B',
  },

  rejectModalDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#718096',
  },

  rejectInputLabel: {
    marginTop: 18,
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: '900',
    color: '#7D8998',
  },

  rejectTextInput: {
    marginTop: 7,
    minHeight: 110,
    maxHeight: 180,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DCE3EB',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#34445A',
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: '#FAFCFE',
  },

  rejectCharacterCount: {
    marginTop: 5,
    textAlign: 'right',
    fontSize: 9,
    color: '#9AA6B5',
  },

  rejectModalActions: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginTop: 18,
  },

  rejectCancelButton: {
    flex: 1,
    marginHorizontal: 4,
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F5F8',
    borderWidth: 1,
    borderColor: '#E0E6ED',
  },

  rejectCancelText: {
    color: '#52637A',
    fontSize: 11,
    fontWeight: '900',
  },

  rejectConfirmButton: {
    flex: 1,
    marginHorizontal: 4,
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A94739',
  },

  rejectConfirmText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },


  bottomSpace: {
    height: 30,
  },

  pressed: {
    opacity: 0.72,
  },

});