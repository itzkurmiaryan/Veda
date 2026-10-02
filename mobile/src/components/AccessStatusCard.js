import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

import {
  Button,
  Card,
  colors,
} from './UI';

import PaymentSummaryCard from './PaymentSummaryCard';


/* =====================================================
   ACCESS STATUS CARD
===================================================== */

export default function AccessStatusCard() {

  const {
    doctor,
    role,
  } = useAuth();


  /*
   * IMPORTANT:
   * AuthContext ka doctor object login ke time ka ho sakta hai.
   *
   * Isliye dashboard ke liye hum liveDoctor use karenge.
   * Ye /auth/me se latest database data lega.
   */

  const [liveDoctor, setLiveDoctor] =
    useState(doctor);


  const [requesting, setRequesting] =
    useState(false);


  const [now, setNow] =
    useState(Date.now());


  /* =====================================================
     KEEP LOCAL DATA IN SYNC WITH AUTH CONTEXT
  ===================================================== */

  useEffect(() => {

    if (doctor) {
      setLiveDoctor(doctor);
    }

  }, [doctor]);


  /* =====================================================
     FETCH LATEST DOCTOR DATA
     
     /auth/me already exists in server/routes/auth.js
  ===================================================== */

  const fetchLatestDoctor = useCallback(
    async () => {

      try {

        const response =
          await api.get('/auth/me');


        const data =
          response?.data;


        /*
         * /auth/me returns:
         *
         * {
         *   success: true,
         *   role: "doctor",
         *   user: {...doctor}
         * }
         */

        if (
          data?.role === 'doctor' &&
          data?.user
        ) {

          setLiveDoctor(data.user);


          /*
           * Also update local storage.
           * This makes the latest payment data available
           * after app restart.
           */

          try {

            await AsyncStorage.setItem(
              'rxvault_doctor',
              JSON.stringify(data.user)
            );

            await AsyncStorage.setItem(
              'rxvault_user',
              JSON.stringify(data.user)
            );

          } catch (storageError) {

            console.log(
              'DOCTOR STORAGE UPDATE ERROR:',
              storageError?.message
            );

          }

        }

      } catch (error) {

        console.log(
          'LATEST DOCTOR FETCH ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );

      }

    },
    []
  );


  /* =====================================================
     REFRESH WHEN DASHBOARD COMES INTO FOCUS
     
     Example:
     Admin changes payment ->
     Doctor opens dashboard again ->
     latest status immediately loads.
  ===================================================== */

  useFocusEffect(
    useCallback(() => {

      fetchLatestDoctor();

    }, [fetchLatestDoctor])
  );


  /* =====================================================
     AUTO REFRESH EVERY 10 SECONDS
     
     This means if admin changes:
     
     pending -> paid
     paid -> pending
     payment requested -> etc.
     
     Doctor dashboard will update automatically.
  ===================================================== */

  useEffect(() => {

    if (
      role === 'admin' ||
      !doctor
    ) {
      return;
    }


    const interval =
      setInterval(() => {

        fetchLatestDoctor();

      }, 10 * 1000);


    return () => {

      clearInterval(interval);

    };

  }, [
    role,
    doctor,
    fetchLatestDoctor,
  ]);


  /* =====================================================
     LIVE CLOCK
  ===================================================== */

  useEffect(() => {

    const timer =
      setInterval(() => {

        setNow(Date.now());

      }, 60 * 1000);


    return () => {

      clearInterval(timer);

    };

  }, []);


  /* =====================================================
     ADMIN DOES NOT NEED THIS CARD
  ===================================================== */

  if (
    role === 'admin' ||
    !liveDoctor
  ) {
    return null;
  }


  /* =====================================================
     BASIC DATA
  ===================================================== */

  const active =
    liveDoctor?.active !== false;


  const paymentStatus =
    String(
      liveDoctor?.paymentStatus || 'pending'
    ).toLowerCase();


  const paymentReminderRequested =
    liveDoctor?.paymentReminderRequested === true;


  const accessRequestStatus =
    String(
      liveDoctor?.accessRequestStatus || 'none'
    ).toLowerCase();

  const paymentHistory = [
    ...(liveDoctor?.paymentHistory || []),
  ].sort(
    (left, right) =>
      new Date(right.paidAt) -
      new Date(left.paidAt)
  );


  const registrationDate =
    liveDoctor?.registrationDate ||
    liveDoctor?.createdAt;


  const accessStartDate =
    liveDoctor?.accessStartDate ||
    registrationDate;


  const lastPaymentDate =
    liveDoctor?.lastPaymentDate;


  const nextPaymentDate =
    liveDoctor?.nextPaymentDate;


  const accessRemovalReason =
    liveDoctor?.accessRemovalReason;


  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (value) => {

    if (!value) {
      return '—';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '—';
    }


    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );

  };


  /* =====================================================
     PAYMENT DATE CALCULATION
  ===================================================== */

  let paymentDueDate = null;


  if (nextPaymentDate) {

    const date =
      new Date(nextPaymentDate);


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      paymentDueDate = date;

    }

  }


  const isExpired =
    paymentDueDate &&
    now >=
      paymentDueDate.getTime();


  const millisecondsRemaining =
    paymentDueDate
      ? paymentDueDate.getTime() - now
      : 0;


  const daysRemaining =
    paymentDueDate
      ? Math.max(
          0,
          Math.ceil(
            millisecondsRemaining /
            (1000 * 60 * 60 * 24)
          )
        )
      : null;


  /* =====================================================
     PAYMENT STATE
  ===================================================== */

  const isPaid =
    paymentStatus === 'paid';


  const paymentDueSoon =
    isPaid &&
    !isExpired &&
    daysRemaining !== null &&
    daysRemaining <= 7;


  /* =====================================================
     REQUEST STATE
  ===================================================== */

  const requestPending =
    accessRequestStatus === 'pending';


  const requestRejected =
    accessRequestStatus === 'rejected';


  /* =====================================================
     REQUEST ACCESS
     
     NOTE:
     Your backend /auth/request-access currently requires
     email + password. This section is left compatible
     with your existing UI.
  ===================================================== */

  const requestAccess = async () => {

    if (requesting) {
      return;
    }


    try {

      setRequesting(true);


      await api.post(
        '/auth/request-access',
        {
          email: liveDoctor?.email,

          message:
            'Doctor is requesting access to Veda.',
        }
      );


      /*
       * Refresh latest doctor data.
       */

      await fetchLatestDoctor();


      Alert.alert(
        'Request Sent',
        'Your access request has been sent to the administrator.'
      );


    } catch (error) {

      console.error(
        'ACCESS REQUEST ERROR:',
        error?.response?.data ||
        error?.message ||
        error
      );


      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Unable to send access request. Please try again.';


      Alert.alert(
        'Request Failed',
        message
      );


    } finally {

      setRequesting(false);

    }

  };


  /* =====================================================
     PAYMENT LABEL
  ===================================================== */

  let paymentLabel =
    'Payment pending';


  let paymentSubtitle =
    'Payment is awaiting confirmation.';


  if (isPaid) {

    paymentLabel =
      'Payment active';


    paymentSubtitle =
      'Your Veda payment has been confirmed.';

  }


  if (paymentReminderRequested) {

    paymentLabel =
      'Payment requested';


    paymentSubtitle =
      'Administrator has requested payment for your Veda access.';

  }


  if (isExpired) {

    paymentLabel =
      'Payment expired';


    paymentSubtitle =
      'Your payment period has expired. Please contact the administrator.';

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <Card>

      <View style={styles.container}>

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.headerText}>

            <Text style={styles.eyebrow}>
              ACCOUNT & ACCESS
            </Text>


            <Text style={styles.title}>
              Veda access status
            </Text>

          </View>


          <View
            style={[
              styles.statusPill,

              active && !isExpired
                ? styles.statusActive
                : styles.statusInactive,
            ]}
          >

            <View
              style={[
                styles.statusDot,

                active && !isExpired
                  ? styles.dotActive
                  : styles.dotInactive,
              ]}
            />


            <Text
              style={[
                styles.statusText,

                active && !isExpired
                  ? styles.textActive
                  : styles.textInactive,
              ]}
            >
              {active && !isExpired
                ? 'ACTIVE'
                : 'INACTIVE'}
            </Text>

          </View>

        </View>


        {/* PAYMENT MAIN BOX */}

        <View
          style={[
            styles.paymentBox,

            paymentReminderRequested &&
              styles.paymentRequestedBox,

            isPaid &&
            !isExpired &&
            !paymentReminderRequested &&
              styles.paymentPaidBox,

            isExpired &&
              styles.paymentExpiredBox,
          ]}
        >

          <View
            style={[
              styles.paymentIcon,

              paymentReminderRequested &&
                styles.paymentIconRequested,

              isPaid &&
              !isExpired &&
              !paymentReminderRequested &&
                styles.paymentIconPaid,

              isExpired &&
                styles.paymentIconExpired,
            ]}
          >

            <Text
              style={[
                styles.paymentIconText,

                paymentReminderRequested &&
                  styles.paymentIconTextRequested,

                isPaid &&
                !isExpired &&
                !paymentReminderRequested &&
                  styles.paymentIconTextPaid,

                isExpired &&
                  styles.paymentIconTextExpired,
              ]}
            >
              {isPaid && !isExpired
                ? '✓'
                : '₹'}
            </Text>

          </View>


          <View style={styles.paymentContent}>

            <Text style={styles.paymentTitle}>
              {paymentLabel}
            </Text>


            <Text style={styles.paymentSubtitle}>
              {paymentSubtitle}
            </Text>

          </View>


          <View
            style={[
              styles.paymentBadge,

              isPaid &&
              !isExpired &&
                styles.paidBadge,

              !isPaid &&
              !isExpired &&
                styles.pendingBadge,

              isExpired &&
                styles.expiredBadge,
            ]}
          >

            <Text
              style={[
                styles.paymentBadgeText,

                isPaid &&
                !isExpired &&
                  styles.paidText,

                !isPaid &&
                !isExpired &&
                  styles.pendingText,

                isExpired &&
                  styles.expiredText,
              ]}
            >
              {isPaid && !isExpired
                ? 'PAID'
                : isExpired
                ? 'EXPIRED'
                : 'DUE'}
            </Text>

          </View>

        </View>


        {/* PAYMENT REQUESTED */}

        {paymentReminderRequested && (

          <View style={styles.requestedBanner}>

            <View style={styles.warningIcon}>

              <Text style={styles.warningIconText}>
                !
              </Text>

            </View>


            <View style={styles.bannerContent}>

              <Text style={styles.bannerTitle}>
                Payment required
              </Text>


              <Text style={styles.bannerText}>
                The administrator has requested payment
                for your Veda subscription.
              </Text>

            </View>

          </View>

        )}


        {/* PAYMENT DATES */}

        <View style={styles.dateGrid}>

          <DateItem
            label="Access started"
            value={formatDate(accessStartDate)}
          />


          <DateItem
            label="Last payment"
            value={formatDate(lastPaymentDate)}
          />


          <DateItem
            label="Next payment"
            value={formatDate(nextPaymentDate)}
          />


          <DateItem
            label="Payment expiry"
            value={formatDate(nextPaymentDate)}
          />

        </View>

        <PaymentSummaryCard
          doctor={liveDoctor}
        />

        {/* REMAINING DAYS */}

        {isPaid && nextPaymentDate && (

          <View
            style={[
              styles.remainingBox,

              paymentDueSoon &&
                styles.remainingSoon,

              isExpired &&
                styles.remainingExpired,
            ]}
          >

            <Text
              style={[
                styles.remainingNumber,

                paymentDueSoon &&
                  styles.remainingNumberSoon,

                isExpired &&
                  styles.remainingNumberExpired,
              ]}
            >
              {isExpired
                ? '0'
                : String(daysRemaining)}
            </Text>


            <View style={styles.remainingContent}>

              <Text style={styles.remainingTitle}>

                {isExpired
                  ? 'Payment expired'
                  : paymentDueSoon
                  ? 'Payment due soon'
                  : 'Days remaining'}

              </Text>


              <Text style={styles.remainingText}>

                {isExpired
                  ? `Payment was due on ${formatDate(
                      nextPaymentDate
                    )}.`
                  : `Your next payment is due on ${formatDate(
                      nextPaymentDate
                    )}.`}

              </Text>

            </View>

          </View>

        )}


        {/* REMOVED ACCESS */}

        {!active && (

          <View style={styles.removedBox}>

            <Text style={styles.removedTitle}>
              Veda access unavailable
            </Text>


            <Text style={styles.removedText}>
              {accessRemovalReason ||
                'Your Veda access has been removed by the administrator.'}
            </Text>

            <Text style={styles.removedDetails}>
              You can still sign in and view existing records. Creating patients or changing prescriptions is disabled until access is restored.
            </Text>

          </View>

        )}


        {/* ACCESS REQUEST */}

        {!active && (

          <View style={styles.accessRequestArea}>

            {requestPending ? (

              <View style={styles.pendingRequest}>

                <View style={styles.pendingDot} />


                <Text style={styles.pendingText}>
                  Your access request is pending with the administrator.
                </Text>

              </View>

            ) : (

              <>

                {requestRejected && (

                  <Text style={styles.rejectedText}>
                    Your previous access request was rejected.
                    You can submit a new request.
                  </Text>

                )}


                <Button
                  title={
                    requesting
                      ? 'Sending request...'
                      : 'Request access'
                  }
                  onPress={requestAccess}
                  disabled={requesting}
                />

              </>

            )}

          </View>

        )}

      </View>

    </Card>
  );
}


/* =====================================================
   DATE ITEM
===================================================== */

function DateItem({
  label,
  value,
}) {

  return (
    <View style={styles.dateItem}>

      <Text style={styles.dateLabel}>
        {label}
      </Text>


      <Text
        style={styles.dateValue}
        numberOfLines={1}
      >
        {value}
      </Text>

    </View>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  container: {
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: colors.blue,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.25,
    marginBottom: 4,
  },

  title: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },

  statusActive: {
    backgroundColor: '#ECFDF5',
  },

  statusInactive: {
    backgroundColor: '#FEF2F2',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    marginRight: 5,
  },

  dotActive: {
    backgroundColor: '#10B981',
  },

  dotInactive: {
    backgroundColor: '#EF4444',
  },

  statusText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  textActive: {
    color: '#059669',
  },

  textInactive: {
    color: '#DC2626',
  },

  paymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 17,
    padding: 11,
    backgroundColor: '#F8FAFC',
    borderColor: '#E7EDF4',
  },

  paymentPaidBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },

  paymentRequestedBox: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },

  paymentExpiredBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  paymentIconPaid: {
    backgroundColor: '#DCFCE7',
  },

  paymentIconRequested: {
    backgroundColor: '#FFEDD5',
  },

  paymentIconExpired: {
    backgroundColor: '#FEE2E2',
  },

  paymentIconText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: '900',
  },

  paymentIconTextPaid: {
    color: '#15803D',
  },

  paymentIconTextRequested: {
    color: '#EA580C',
  },

  paymentIconTextExpired: {
    color: '#DC2626',
  },

  paymentContent: {
    flex: 1,
    minWidth: 0,
  },

  paymentTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },

  paymentSubtitle: {
    color: colors.muted,
    fontSize: 8.5,
    lineHeight: 13,
    marginTop: 3,
  },

  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 7,
  },

  paidBadge: {
    backgroundColor: '#DCFCE7',
  },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },

  expiredBadge: {
    backgroundColor: '#FEE2E2',
  },

  paymentBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  paidText: {
    color: '#15803D',
  },

  pendingText: {
    color: '#B45309',
  },

  expiredText: {
    color: '#B91C1C',
  },

  requestedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 15,
    padding: 11,
    marginTop: 10,
  },

  warningIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  warningIconText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '900',
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    color: '#9A3412',
    fontSize: 10.5,
    fontWeight: '900',
  },

  bannerText: {
    color: '#C2410C',
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },

  dateItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 10,
  },

  dateLabel: {
    color: '#94A3B8',
    fontSize: 7.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },

  dateValue: {
    color: colors.ink,
    fontSize: 10.5,
    fontWeight: '900',
    marginTop: 3,
  },

  historySection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E6EDF1',
  },

  historyHeading: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
  },

  historyRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F4',
  },

  historyMain: {
    minWidth: 0,
  },

  historyAmount: {
    color: '#087A66',
    fontSize: 12,
    fontWeight: '900',
  },

  historyMeta: {
    color: colors.muted,
    fontSize: 8.5,
    lineHeight: 13,
    marginTop: 3,
  },

  historyNote: {
    color: colors.ink,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  remainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 15,
    padding: 11,
    marginTop: 2,
  },

  remainingSoon: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },

  remainingExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  remainingNumber: {
    color: '#2563EB',
    fontSize: 24,
    fontWeight: '900',
    width: 52,
    textAlign: 'center',
  },

  remainingNumberSoon: {
    color: '#EA580C',
  },

  remainingNumberExpired: {
    color: '#DC2626',
  },

  remainingContent: {
    flex: 1,
    marginLeft: 5,
  },

  remainingTitle: {
    color: colors.ink,
    fontSize: 10.5,
    fontWeight: '900',
  },

  remainingText: {
    color: colors.muted,
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  removedBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 11,
    marginTop: 10,
  },

  removedTitle: {
    color: '#B91C1C',
    fontSize: 10.5,
    fontWeight: '900',
  },

  removedText: {
    color: '#991B1B',
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  removedDetails: {
    color: '#7F1D1D',
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 7,
  },

  accessRequestArea: {
    marginTop: 12,
  },

  pendingRequest: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 13,
    padding: 10,
  },

  pendingDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },

  pendingText: {
    flex: 1,
    color: '#1D4ED8',
    fontSize: 8.5,
    lineHeight: 14,
    fontWeight: '700',
  },

  rejectedText: {
    color: '#B45309',
    fontSize: 8.5,
    lineHeight: 14,
    marginBottom: 8,
  },

});