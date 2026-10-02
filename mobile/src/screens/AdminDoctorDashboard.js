import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  Platform,
  StyleSheet,
  Text,
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
  colors,
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
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
          <Text style={styles.statIconText}>{icon}</Text>
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

function ProfileRow({ label, value }) {
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
      ? Math.max((patients / maxValue) * 100, patients > 0 ? 4 : 0)
      : 0;

  const visitWidth =
    maxValue > 0
      ? Math.max((visits / maxValue) * 100, visits > 0 ? 4 : 0)
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
              { width: `${patientWidth}%` },
            ]}
          />
        </View>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.visitBar,
              { width: `${visitWidth}%` },
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

function EmptyState({ text }) {
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
   MAIN SCREEN
========================================================= */

export default function AdminDoctorDashboard({
  navigation,
  route,
}) {
  const { doctor: selectedDoctor } = route.params || {};

  const {
    startAction,
    stopAction,
    actionLoading,
  } = useAuth();

  const [doctor, setDoctor] = useState(
    selectedDoctor || null
  );
  const [accessRequest, setAccessRequest] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [paymentEntryOpen, setPaymentEntryOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMonthsPaid, setPaymentMonthsPaid] = useState('1');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  const doctorId =
    selectedDoctor?._id ||
    selectedDoctor?.id;


  /* =======================================================
     LOAD DOCTOR ANALYTICS
  ======================================================= */

  const loadDoctorAnalytics = useCallback(
    async () => {
      if (!doctorId) {
        setError('Doctor information is missing.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        setLoading(true);

        const [response, doctorResponse, accessResponse] =
          await Promise.all([
            api.get(
              `/analytics/doctors/${doctorId}`
            ),
            api.get(
              `/admin/doctors/${doctorId}`
            ),
            api.get('/admin/access-requests'),
          ]);

        const payload = response?.data;

        if (!payload?.success) {
          throw new Error(
            payload?.message ||
            'Unable to load doctor analytics'
          );
        }

        setDoctor(
          doctorResponse?.data?.data ||
          payload.doctor ||
          selectedDoctor ||
          null
        );

        const requests =
          accessResponse?.data?.data || [];
        setAccessRequest(
          requests.find((request) => {
            const requestDoctorId =
              typeof request.doctorId === 'object'
                ? request.doctorId?._id
                : request.doctorId;
            return String(requestDoctorId) === String(doctorId);
          }) || null
        );

        setAnalytics(
          payload.data ||
          null
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
      visits: visits[index]?.count || 0,
    }));
  }, [analytics]);


  const maxDailyValue = useMemo(() => {
    const values = dailyData.flatMap(
      (item) => [
        Number(item.patients || 0),
        Number(item.visits || 0),
      ]
    );

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
      visits: visits[index]?.count || 0,
    }));
  }, [analytics]);


  const maxMonthlyValue = useMemo(() => {
    const values = monthlyData.flatMap(
      (item) => [
        Number(item.patients || 0),
        Number(item.visits || 0),
      ]
    );

    return Math.max(
      ...values,
      1
    );
  }, [monthlyData]);

  const showPaymentMessage = (title, message) => {
    if (Platform.OS === 'web') {
      globalThis.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

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
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Allow photo access to attach a screenshot.');
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.45,
        });
      if (result.canceled) return;

      const image = result.assets?.[0];
      if (!image?.uri) {
        throw new Error('Select a valid screenshot.');
      }

      const resizeAction =
        image.width >= image.height
          ? { resize: { width: 1000 } }
          : { resize: { height: 1000 } };
      const compressed =
        await ImageManipulator.manipulateAsync(
          image.uri,
          [resizeAction],
          {
            compress: 0.4,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

      if (
        !compressed.base64 ||
        compressed.base64.length > 1400000
      ) {
        throw new Error('Screenshot is too large. Choose a smaller image.');
      }

      setPaymentProof({
        data: compressed.base64,
        contentType: 'image/jpeg',
        fileName: image.fileName || 'payment-proof.jpg',
        uri: compressed.uri,
      });
    } catch (requestError) {
      showPaymentMessage(
        'Unable to select screenshot',
        requestError.message || 'Please try another image.'
      );
    }
  };

  const submitPaidPayment = async () => {
    const amount = Number(paymentAmount);
    const monthsPaid = Number(paymentMonthsPaid);
    if (
      !doctor?._id ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isInteger(monthsPaid) ||
      monthsPaid < 1 ||
      monthsPaid > 24
    ) {
      return;
    }

    try {
      startAction('Saving payment...', 'Recording the doctor payment details.');
      const response = await api.patch(
        `/admin/doctors/${doctor._id}/payment`,
        {
          status: 'paid',
          amount,
          monthsPaid,
          transactionId: paymentTransactionId.trim(),
          note: paymentNote.trim(),
          paymentProof: paymentProof
            ? {
                data: paymentProof.data,
                contentType: paymentProof.contentType,
                fileName: paymentProof.fileName,
              }
            : null,
        }
      );
      const updated = response?.data?.data;
      if (
        updated?.paymentStatus !== 'paid' ||
        (updated?.paymentHistory?.length || 0) <=
          (doctor.paymentHistory?.length || 0)
      ) {
        throw new Error('The server did not confirm the payment record.');
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
      startAction('Updating payment...', 'Keeping the doctor marked unpaid.');
      const response = await api.patch(
        `/admin/doctors/${doctor._id}/payment`,
        { status: 'unpaid' }
      );
      const updated = response?.data?.data;
      if (updated?.paymentStatus !== 'pending') {
        throw new Error('The server did not confirm unpaid status.');
      }
      setDoctor(updated);
      setPaymentEntryOpen(false);
      showPaymentMessage('Payment unpaid', 'No payment record was added.');
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

  const openPaymentProof = async (record) => {
    if (!doctor?._id || !record?._id) return;
    try {
      startAction('Loading screenshot...', 'Fetching the saved payment proof.');
      const response = await api.get(
        `/admin/doctors/${doctor._id}/payments/${record._id}/proof`
      );
      const proof = response?.data?.data;
      if (!proof?.data) throw new Error('Screenshot is unavailable.');
      setProofPreview({
        uri: `data:${proof.contentType};base64,${proof.data}`,
        fileName: proof.fileName,
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

  const deletePaymentRecord = (record) => {
    if (!doctor?._id || !record?._id) return;

    const removeRecord = async () => {
      try {
        startAction('Deleting payment record...', 'Updating payment history.');
        const response = await api.delete(
          `/admin/doctors/${doctor._id}/payments/${record._id}`
        );
        if (response?.data?.data) {
          setDoctor(response.data.data);
        }
      } catch (requestError) {
        showPaymentMessage(
          'Unable to delete payment',
          requestError.response?.data?.message ||
            requestError.message ||
            'Please try again.'
        );
      } finally {
        stopAction();
      }
    };

    const message =
      'Delete this payment record? Revenue and current payment status will be recalculated.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm(message)) removeRecord();
      return;
    }

    Alert.alert('Delete payment record?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: removeRecord },
    ]);
  };

  const reviewAccessRequest = async (action) => {
    if (!accessRequest?._id) return;
    try {
      startAction(
        action === 'approve'
          ? 'Approving access request...'
          : 'Rejecting access request...',
        'Updating this doctor’s access request.'
      );
      const response = await api.post(
        `/admin/access-requests/${accessRequest._id}/${action}`
      );
      setAccessRequest(null);
      const updatedDoctor = response?.data?.data;
      if (updatedDoctor?._id === doctor?._id) {
        setDoctor(updatedDoctor);
      }
      showPaymentMessage(
        action === 'approve'
          ? 'Access approved'
          : 'Access request rejected',
        doctor?.name || 'Doctor access request updated.'
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

  const viewAccessRequestProof = async () => {
    if (!accessRequest?._id) return;
    try {
      startAction('Loading screenshot...', 'Fetching the attached proof.');
      const response = await api.get(
        `/admin/access-requests/${accessRequest._id}/payment-proof`
      );
      const proof = response?.data?.data;
      if (!proof?.data) throw new Error('Screenshot is unavailable.');
      setProofPreview({
        uri: `data:${proof.contentType};base64,${proof.data}`,
        fileName: proof.fileName || 'Payment screenshot',
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

  const handleDelete = () => {
    if (!doctor?._id) return;

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
          onPress: async () => {
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
                    onPress: () =>
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

  const handleAccessToggle = async () => {
    if (!doctor?._id) return;

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
            active: nextActive,
          }
        );

      const updated =
        response?.data?.data;

      if (updated) {
        setDoctor(updated);
      } else {
        setDoctor((current) => ({
          ...current,
          active: nextActive,
        }));
      }

      stopAction();
    } catch (err) {
      stopAction();

      Alert.alert(
        'Action Failed',
        err?.response?.data?.message ||
        'Unable to update doctor access.'
      );
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
            onPress={loadDoctorAnalytics}
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


  const active =
    doctor.active !== false;

  const totalPatients =
    analytics?.totalPatients || 0;

  const totalVisits =
    analytics?.totalVisits || 0;

  const newPatientsToday =
    analytics?.newPatientsToday || 0;

  const weeklyPatients =
    analytics?.weekly?.patientCount || 0;

  const weeklyVisits =
    analytics?.weekly?.visitCount || 0;


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
              pressed && styles.pressed,
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
                    uri: doctor.clinicLogo,
                  }}
                  style={styles.doctorImage}
                />
              ) : (
                <View style={styles.doctorInitials}>
                  <Text style={styles.doctorInitialsText}>
                    {getInitials(doctor.name)}
                  </Text>
                </View>
              )}

              <View style={styles.identityText}>
                <Text style={styles.doctorName}>
                  {doctor.name || 'Doctor'}
                </Text>

                <Text style={styles.doctorSpecialization}>
                  {doctor.specialization ||
                    'Medical Professional'}
                </Text>

                <Text style={styles.doctorEmail}>
                  {doctor.email || 'No email'}
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


          <View style={styles.heroDivider} />


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
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.editButtonIcon}>
                ✎
              </Text>

              <Text style={styles.editButtonText}>
                Edit Doctor Profile
              </Text>
            </Pressable>

            <Pressable
              onPress={handleAccessToggle}
              disabled={actionLoading}
              style={({ pressed }) => [
                styles.accessButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.accessButtonText}>
                {active
                  ? 'Disable Access'
                  : 'Restore Access'}
              </Text>
            </Pressable>

          </View>

        </Card>

        <View style={styles.detailTabs}>
          {[
            ['overview', 'Overview'],
            ['billing', 'Billing'],
            ['profile', 'Profile'],
          ].map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: detailTab === value }}
              onPress={() => setDetailTab(value)}
              style={[
                styles.detailTab,
                detailTab === value && styles.detailTabSelected,
              ]}
            >
              <Text
                style={[
                  styles.detailTabText,
                  detailTab === value && styles.detailTabTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {detailTab === 'billing' ? (
          <>
        {accessRequest ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>
                  ACCESS CONTROL
                </Text>
                <Text style={styles.sectionTitle}>
                  Pending access request
                </Text>
              </View>
            </View>

            <Card style={styles.accessRequestPanel}>
              <Text style={styles.accessRequestMessage}>
                {accessRequest.message ||
                  'This doctor requested access to the workspace.'}
              </Text>

              {accessRequest.paymentProof?.available ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={viewAccessRequestProof}
                  style={styles.accessProofButton}
                >
                  <Text style={styles.accessProofText}>
                    View attached payment screenshot
                  </Text>
                </Pressable>
              ) : null}

              <View style={styles.paymentControls}>
                <View style={styles.paymentControl}>
                  <Button
                    title="Reject request"
                    danger
                    onPress={() => reviewAccessRequest('reject')}
                    disabled={actionLoading}
                  />
                </View>
                <View style={styles.paymentControl}>
                  <Button
                    title="Approve access"
                    onPress={() => reviewAccessRequest('approve')}
                    disabled={actionLoading}
                  />
                </View>
              </View>
            </Card>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              BILLING
            </Text>
            <Text style={styles.sectionTitle}>
              Payment management
            </Text>
          </View>
        </View>

        <PaymentSummaryCard
          doctor={doctor}
          onHistory={() => setPaymentHistoryOpen(true)}
        />

        <View style={styles.adminPaymentActions}>
          <Button
            title={
              doctor.paymentStatus === 'paid'
                ? 'Change payment status'
                : 'Mark paid / unpaid'
            }
            onPress={openPaymentEntry}
            disabled={actionLoading}
          />
        </View>

          </>
        ) : null}

        {/* =================================================
            OVERVIEW
        ================================================= */}

        {detailTab === 'overview' ? (
          <>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>
              CLINICAL OVERVIEW
            </Text>

            <Text style={styles.sectionTitle}>
              Practice performance
            </Text>
          </View>
        </View>


        <View style={styles.statsGrid}>

          <StatCard
            icon="P"
            label="Total Patients"
            value={totalPatients}
            subtitle="Patients registered"
          />

          <StatCard
            icon="V"
            label="Total Visits"
            value={totalVisits}
            subtitle="Clinical visits"
          />

          <StatCard
            icon="+"
            label="New Today"
            value={newPatientsToday}
            subtitle="Patients added today"
          />

          <StatCard
            icon="7"
            label="Last 28 Days"
            value={weeklyPatients}
            subtitle={`${formatNumber(
              weeklyVisits
            )} visits in same period`}
          />

        </View>


        {/* =================================================
            28 DAY SNAPSHOT
        ================================================= */}

        <Card style={styles.snapshotCard}>

          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardEyebrow}>
                RECENT ACTIVITY
              </Text>

              <Text style={styles.cardTitle}>
                Last 28 days
              </Text>
            </View>

            <View style={styles.snapshotBadge}>
              <Text style={styles.snapshotBadgeText}>
                {formatNumber(
                  weeklyVisits
                )}{' '}
                visits
              </Text>
            </View>
          </View>


          <View style={styles.snapshotNumbers}>

            <View style={styles.snapshotNumberBlock}>
              <Text style={styles.snapshotNumber}>
                {formatNumber(
                  weeklyPatients
                )}
              </Text>

              <Text style={styles.snapshotLabel}>
                Patients
              </Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotNumberBlock}>
              <Text style={styles.snapshotNumber}>
                {formatNumber(
                  weeklyVisits
                )}
              </Text>

              <Text style={styles.snapshotLabel}>
                Visits
              </Text>
            </View>

            <View style={styles.snapshotDivider} />

            <View style={styles.snapshotNumberBlock}>
              <Text style={styles.snapshotNumber}>
                {totalPatients > 0
                  ? (
                      totalVisits /
                      totalPatients
                    ).toFixed(1)
                  : '0.0'}
              </Text>

              <Text style={styles.snapshotLabel}>
                Visits / patient
              </Text>
            </View>

          </View>

        </Card>


        {/* =================================================
            DAILY ANALYTICS
        ================================================= */}

        <Card style={styles.analyticsCard}>

          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardEyebrow}>
                DAILY ACTIVITY
              </Text>

              <Text style={styles.cardTitle}>
                Patient & visit activity
              </Text>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    styles.patientLegend,
                  ]}
                />

                <Text style={styles.legendText}>
                  Patients
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    styles.visitLegend,
                  ]}
                />

                <Text style={styles.legendText}>
                  Visits
                </Text>
              </View>
            </View>
          </View>


          {dailyData.length > 0 ? (
            <View style={styles.chart}>
              {dailyData.map(
                (item, index) => (
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
            <EmptyState text="Daily activity will appear here once clinical activity is recorded." />
          )}

        </Card>


        {/* =================================================
            MONTHLY ANALYTICS
        ================================================= */}

        <Card style={styles.analyticsCard}>

          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardEyebrow}>
                MONTHLY TREND
              </Text>

              <Text style={styles.cardTitle}>
                Practice activity
              </Text>
            </View>
          </View>


          {monthlyData.length > 0 ? (
            <View style={styles.chart}>
              {monthlyData.map(
                (item, index) => (
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
            <EmptyState text="Monthly analytics will appear after the doctor has enough activity data." />
          )}

        </Card>


        {/* =================================================
            DOCTOR PROFILE
        ================================================= */}

          </>
        ) : null}

        {detailTab === 'profile' ? (
          <>

        <Card style={styles.profileCard}>

          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardEyebrow}>
                ACCOUNT INFORMATION
              </Text>

              <Text style={styles.cardTitle}>
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
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.smallEditText}>
                Edit
              </Text>
            </Pressable>
          </View>


          <View style={styles.profileGrid}>

            <ProfileRow
              label="Full name"
              value={doctor.name}
            />

            <ProfileRow
              label="Email"
              value={doctor.email}
            />

            <ProfileRow
              label="Phone"
              value={doctor.phone}
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


        {/* =================================================
            ADMIN ACTIONS
        ================================================= */}

        <Card style={styles.dangerCard}>

          <Text style={styles.dangerEyebrow}>
            ADMINISTRATIVE ACTION
          </Text>

          <Text style={styles.dangerTitle}>
            Remove doctor
          </Text>

          <Text style={styles.dangerDescription}>
            Permanently deletes this doctor and all
            patients, visits and prescriptions associated
            with the account.
          </Text>

          <Pressable
            onPress={handleDelete}
            disabled={actionLoading}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.deleteButtonText}>
              Permanently Delete Doctor
            </Text>
          </Pressable>

        </Card>

          </>
        ) : null}

        <View style={styles.bottomSpace} />

      </FadeIn>

      <PaymentEntryModal
        visible={paymentEntryOpen}
        doctor={doctor}
        mode={paymentMode}
        onModeChange={setPaymentMode}
        amount={paymentAmount}
        note={paymentNote}
        transactionId={paymentTransactionId}
        monthsPaid={paymentMonthsPaid}
        paymentProof={paymentProof}
        busy={actionLoading}
        onAmountChange={setPaymentAmount}
        onNoteChange={setPaymentNote}
        onTransactionIdChange={setPaymentTransactionId}
        onMonthsPaidChange={setPaymentMonthsPaid}
        onPickProof={choosePaymentProof}
        onRemoveProof={() => setPaymentProof(null)}
        onCancel={() => setPaymentEntryOpen(false)}
        onSubmit={submitPaidPayment}
        onMarkUnpaid={submitUnpaidStatus}
      />

      <PaymentHistoryModal
        doctor={paymentHistoryOpen ? doctor : null}
        onClose={() => setPaymentHistoryOpen(false)}
        onViewProof={openPaymentProof}
        onDeleteRecord={deletePaymentRecord}
      />

      <Modal
        visible={Boolean(proofPreview)}
        transparent
        animationType="fade"
        onRequestClose={() => setProofPreview(null)}
      >
        <Pressable
          style={adminStyles.proofOverlay}
          onPress={() => setProofPreview(null)}
        >
          <View style={adminStyles.proofModal}>
            <Text style={adminStyles.proofTitle}>
              {proofPreview?.fileName || 'Payment screenshot'}
            </Text>
            {proofPreview ? (
              <Image
                source={{ uri: proofPreview.uri }}
                resizeMode="contain"
                style={adminStyles.proofImage}
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

  paymentPanel: {
    marginBottom: 4,
  },

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

  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  paymentDueSummary: {
    alignItems: 'flex-end',
  },

  paymentSummaryLabel: {
    color: '#8B98A8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  paymentSummaryValue: {
    color: '#34445A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
  },

  paymentSummaryPaid: {
    color: '#16815E',
  },

  paymentSummaryDue: {
    color: '#B76C12',
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

  snapshotCard: {
    marginTop: 10,
    padding: 18,
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

  cardTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    color: '#14233B',
  },

  snapshotCard: {
    marginTop: 10,
    padding: 19,
    backgroundColor: '#14233B',
    borderRadius: 16,
  },

  snapshotCard: {
    marginTop: 10,
    padding: 19,
    backgroundColor: '#14233B',
    borderRadius: 16,
  },

  snapshotCard: {
    marginTop: 10,
    padding: 19,
    backgroundColor: '#14233B',
    borderRadius: 16,
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

  bottomSpace: {
    height: 30,
  },

  pressed: {
    opacity: 0.72,
  },
});