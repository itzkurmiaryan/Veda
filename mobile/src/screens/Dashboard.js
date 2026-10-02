import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  useAuth,
} from '../context/AuthContext';

import {
  api,
} from '../api/api';

import {
  Button,
  Card,
  FadeIn,
  Loading,
  Screen,
  colors,
} from '../components/UI';

import Analytics from '../components/Analytics';


/* =====================================================
   DASHBOARD
===================================================== */

export default function Dashboard({ navigation }) {

  const {
    doctor,
    logout,
  } = useAuth();

  const { width } = useWindowDimensions();

  const isSmall = width < 380;
  const isTablet = width >= 620;


  /* =====================================================
     STATE
  ===================================================== */

  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState([]);

  const [doctorData, setDoctorData] = useState(
    doctor || null
  );

  const [requestLoading, setRequestLoading] =
    useState(false);

  const [requestSent, setRequestSent] =
    useState(false);


  /* =====================================================
     KEEP LOCAL DOCTOR DATA IN SYNC
  ===================================================== */

  useEffect(() => {

    if (doctor) {
      setDoctorData(doctor);
    }

  }, [doctor]);


  /* =====================================================
     ANIMATIONS
  ===================================================== */

  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  const floatAnim = useRef(
    new Animated.Value(0)
  ).current;

  const pulseAnim = useRef(
    new Animated.Value(1)
  ).current;

  const rotateAnim = useRef(
    new Animated.Value(0)
  ).current;


  /* =====================================================
     INTRO ANIMATIONS
  ===================================================== */

  useEffect(() => {

    Animated.timing(
      fadeAnim,
      {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }
    ).start();


    const floating = Animated.loop(
      Animated.sequence([

        Animated.timing(
          floatAnim,
          {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          floatAnim,
          {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }
        ),

      ])
    );


    const pulse = Animated.loop(
      Animated.sequence([

        Animated.timing(
          pulseAnim,
          {
            toValue: 1.06,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          pulseAnim,
          {
            toValue: 1,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }
        ),

      ])
    );


    const rotation = Animated.loop(
      Animated.timing(
        rotateAnim,
        {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: true,
        }
      )
    );


    floating.start();
    pulse.start();
    rotation.start();


    return () => {

      floating.stop();
      pulse.stop();
      rotation.stop();

    };

  }, [
    fadeAnim,
    floatAnim,
    pulseAnim,
    rotateAnim,
  ]);


  /* =====================================================
     LOAD CURRENT DOCTOR
===================================================== */

  const loadDoctor = useCallback(
    async () => {

      try {

        const response =
          await api.get('/auth/me');

        const nextDoctor =
          response?.data?.doctor ||
          response?.data?.data?.doctor ||
          response?.data?.user ||
          response?.data?.data ||
          null;


        if (nextDoctor) {

          setDoctorData(nextDoctor);

          /*
            If backend says request is already pending,
            keep local request state synced.
          */
          if (
            String(
              nextDoctor?.accessRequestStatus || ''
            ).toLowerCase() === 'pending'
          ) {
            setRequestSent(true);
          } else {
            setRequestSent(false);
          }

        }

      } catch (error) {

        console.error(
          'DOCTOR DETAILS LOAD ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );

      }

    },
    []
  );


  /* =====================================================
     DASHBOARD DATA
  ===================================================== */

  const loadDashboard = useCallback(
    async () => {

      try {

        const [
          patientsResponse,
          analyticsResponse,
        ] = await Promise.all([

          api.get('/patients'),

          api.get('/analytics/doctor/me'),

        ]);


        const nextPatients =
          patientsResponse?.data?.data || [];


        const nextAnalytics =
          analyticsResponse?.data?.data || null;


        setPatients(nextPatients);

        setAnalytics(nextAnalytics);

      } catch (error) {

        console.error(
          'DASHBOARD LOAD ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );

      } finally {

        setLoading(false);

      }

    },
    []
  );


  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const loadNotifications = useCallback(
    async () => {

      try {

        const response =
          await api.get('/auth/notifications');


        const nextNotifications =
          Array.isArray(
            response?.data?.data
          )
            ? response.data.data
            : [];


        setNotifications(
          nextNotifications
        );

      } catch (error) {

        console.error(
          'DOCTOR NOTIFICATIONS ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );

      }

    },
    []
  );


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadDashboard();
    loadDoctor();
    loadNotifications();

  }, [
    loadDashboard,
    loadDoctor,
    loadNotifications,
  ]);


  /* =====================================================
     FOCUS REFRESH
  ===================================================== */

  useFocusEffect(
    useCallback(() => {

      let mounted = true;


      const refreshDashboard =
        async () => {

          try {

            const [
              patientsResponse,
              analyticsResponse,
              doctorResponse,
              notificationsResponse,
            ] = await Promise.all([

              api.get('/patients'),

              api.get('/analytics/doctor/me'),

              api.get('/auth/me'),

              api.get('/auth/notifications'),

            ]);


            if (!mounted) {
              return;
            }


            setPatients(
              patientsResponse?.data?.data || []
            );


            setAnalytics(
              analyticsResponse?.data?.data || null
            );


            const nextDoctor =
              doctorResponse?.data?.doctor ||
              doctorResponse?.data?.data?.doctor ||
              doctorResponse?.data?.user ||
              doctorResponse?.data?.data ||
              null;


            if (nextDoctor) {

              setDoctorData(
                nextDoctor
              );


              const requestStatus =
                String(
                  nextDoctor?.accessRequestStatus ||
                  ''
                ).toLowerCase();


              setRequestSent(
                requestStatus === 'pending'
              );

            }


            setNotifications(
              Array.isArray(
                notificationsResponse?.data?.data
              )
                ? notificationsResponse.data.data
                : []
            );


          } catch (error) {

            if (!mounted) {
              return;
            }


            console.error(
              'DASHBOARD REFRESH ERROR:',
              error?.response?.data ||
              error?.message ||
              error
            );

          } finally {

            if (mounted) {
              setLoading(false);
            }

          }

        };


      refreshDashboard();


      const notificationInterval =
        setInterval(
          loadNotifications,
          30 * 1000
        );


      return () => {

        mounted = false;

        clearInterval(
          notificationInterval
        );

      };

    }, [
      loadNotifications,
    ])
  );


  /* =====================================================
     ACCESS REQUEST
  ===================================================== */

  const submitAccessRequest =
    useCallback(
      async () => {

        if (requestLoading) {
          return;
        }


        const currentStatus =
          String(
            doctorData?.accessRequestStatus ||
            ''
          ).toLowerCase();


        if (currentStatus === 'pending') {

          setRequestSent(true);

          Alert.alert(
            'Request already sent',
            'Your access request is already pending with the administrator.'
          );

          return;

        }


        setRequestLoading(true);


        try {

          const response =
            await api.post(
              '/auth/request-access-session',
              {
                message:
                  'I want to request access to my Veda Doctor account.',
              }
            );


          const responseData =
            response?.data || {};


          /*
            Backend:
            {
              success,
              alreadyPending,
              message,
              status: 'pending'
            }
          */

          if (
            responseData?.status === 'pending' ||
            responseData?.alreadyPending
          ) {

            setRequestSent(true);


            setDoctorData(
              current => ({
                ...(current || {}),
                accessRequestStatus:
                  'pending',
              })
            );


            Alert.alert(
              'Request sent',
              responseData?.message ||
              'Your access request has been sent to the administrator.'
            );

          } else {

            Alert.alert(
              'Request sent',
              responseData?.message ||
              'Your access request has been submitted.'
            );

          }


          /*
            Refresh doctor information immediately
            so the UI reflects the backend state.
          */

          await loadDoctor();


          /*
            Refresh notifications because admin may
            receive / trigger notification-related state.
          */

          await loadNotifications();


        } catch (error) {

          console.error(
            'ACCESS REQUEST ERROR:',
            error?.response?.data ||
            error?.message ||
            error
          );


          const message =
            error?.response?.data?.message ||
            'Unable to send your access request right now. Please try again.';


          Alert.alert(
            'Request failed',
            message
          );

        } finally {

          setRequestLoading(false);

        }

      },
      [
        requestLoading,
        doctorData,
        loadDoctor,
        loadNotifications,
      ]
    );


  /* =====================================================
     DATA
  ===================================================== */

  const currentDoctor =
    doctorData || doctor || {};


  const firstName =
    currentDoctor?.name
      ?.trim()
      ?.split(' ')[0] ||
    'Doctor';


  const doctorName =
    currentDoctor?.name ||
    'Doctor';


  const totalPatients =
    patients.length;


  const recentPatients =
    patients.slice(0, 5);


  /*
    Access state
  */

  const isActive =
    currentDoctor?.active !== false;


  const accessRequestStatus =
    String(
      currentDoctor?.accessRequestStatus ||
      ''
    ).toLowerCase();


  const isRequestPending =
    requestSent ||
    accessRequestStatus === 'pending';


  /*
    Access request should be visible when:

    - doctor account is inactive
    - request isn't already pending
  */

  const shouldShowAccessRequest =
    !isActive &&
    !isRequestPending;


  /*
    Payment status
  */

  const paymentStatus =
    String(
      currentDoctor?.paymentStatus ||
      'pending'
    ).toLowerCase();


  const paymentReminderRequested =
    Boolean(
      currentDoctor?.paymentReminderRequested
    );


  const activeNotification =
    notifications[0] || null;


  /* =====================================================
     NOTIFICATION ACTIONS
  ===================================================== */

  const dismissNotification =
    async () => {

      if (!activeNotification) {
        return;
      }


      if (activeNotification._id) {

        try {

          await api.patch(
            `/auth/notifications/${activeNotification._id}/read`
          );

        } catch (error) {

          console.error(
            'NOTIFICATION READ ERROR:',
            error?.response?.data ||
            error?.message ||
            error
          );

        }

      }


      setNotifications(
        current =>
          current.slice(1)
      );

    };


  const deleteActiveNotification =
    async () => {

      if (!activeNotification?._id) {
        return;
      }


      try {

        await api.delete(
          `/auth/notifications/${activeNotification._id}`
        );


        setNotifications(
          current =>
            current.filter(
              item =>
                item._id !==
                activeNotification._id
            )
        );

      } catch (error) {

        console.error(
          'NOTIFICATION DELETE ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );

      }

    };


  /* =====================================================
     ANIMATION VALUES
  ===================================================== */

  const floatY =
    floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -7],
    });


  const rotation =
    rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <Screen scroll>

      <FadeIn>

        {/* =================================================
            TOP GREETING
        ================================================= */}

        <View style={styles.topArea}>

          <View style={styles.topLeft}>

            <View style={styles.helloRow}>

              <View style={styles.onlineDot} />

              <Text style={styles.helloLabel}>
                CLINICAL WORKSPACE
              </Text>

            </View>


            <Text
              style={[
                styles.greeting,
                isSmall &&
                styles.greetingSmall,
              ]}
            >
              Good morning,
            </Text>


            <Text
              style={[
                styles.doctorName,
                isSmall &&
                styles.doctorNameSmall,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Dr. {firstName}
            </Text>


            <Text style={styles.dateText}>
              Your practice overview is ready
              for today.
            </Text>

          </View>


          <Animated.View
            style={[
              styles.profileCircle,
              {
                transform: [
                  {
                    translateY: floatY,
                  },
                ],
              },
            ]}
          >

            <Text style={styles.profileInitial}>
              {doctorName
                ?.charAt(0)
                ?.toUpperCase() || 'D'}
            </Text>


            <View style={styles.profileOnline} />

          </Animated.View>

        </View>


        {/* =================================================
            VEDA HERO
        ================================================= */}

        <View style={styles.clinicCard}>

          <View style={styles.clinicGlow} />


          <Animated.View
            style={[
              styles.clinicRing,
              {
                transform: [
                  {
                    rotate: rotation,
                  },
                ],
              },
            ]}
          >

            <View style={styles.ringDot} />

          </Animated.View>


          <View style={styles.clinicCardContent}>

            <View style={styles.clinicBadge}>

              <Text style={styles.clinicBadgeIcon}>
                ✚
              </Text>

              <Text style={styles.clinicBadgeText}>
                VEDA • DOCTOR CONSOLE
              </Text>

            </View>


            <Text style={styles.clinicTitle}>
              Everything you need,
            </Text>


            <Text style={styles.clinicTitleAccent}>
              in one clinical space.
            </Text>


            <Text style={styles.clinicDescription}>
              Manage your patients, visits and
              prescriptions with a focused
              professional workspace.
            </Text>

          </View>


          <View style={styles.clinicBottom}>

            <ClinicalMiniStat
              value={String(totalPatients)}
              label="Patients"
            />


            <View style={styles.clinicDivider} />


            <ClinicalMiniStat
              value={
                isActive
                  ? '24/7'
                  : 'OFF'
              }
              label="Access"
            />


            <View style={styles.clinicDivider} />


            <ClinicalMiniStat
              value="✓"
              label="Secure"
            />

          </View>

        </View>


        {/* =================================================
            PAYMENT / ACCESS
        ================================================= */}

        <PaymentSummaryCard
          doctor={currentDoctor}
          onPress={() =>
            navigation.navigate(
              'PaymentDetails'
            )
          }
        />


        {/* =================================================
            ACCESS REQUEST
        ================================================= */}

        {shouldShowAccessRequest ? (

          <AccessRequestCard
            loading={requestLoading}
            onPress={submitAccessRequest}
          />

        ) : isRequestPending ? (

          <AccessPendingCard />

        ) : null}


        {/* =================================================
            PAYMENT REMINDER
        ================================================= */}

        {paymentReminderRequested &&
        paymentStatus !== 'paid' ? (

          <PaymentReminderCard
            onPress={() =>
              navigation.navigate(
                'PaymentDetails'
              )
            }
          />

        ) : null}


        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <SectionHeader
          eyebrow="CLINICAL ACTIONS"
          title="Quick access"
        />


        <View
          style={[
            styles.actionGrid,
            isTablet &&
            styles.actionGridTablet,
          ]}
        >

          <DoctorAction
            icon="＋"
            title="New Patient"
            description="Register a patient"
            primary
            onPress={() =>
              navigation.navigate(
                'AddPatient'
              )
            }
          />


          <DoctorAction
            icon="⌕"
            title="Find Patient"
            description="Open patient records"
            onPress={() =>
              navigation.navigate(
                'Patients'
              )
            }
          />

        </View>


        {/* =================================================
            ANALYTICS
        ================================================= */}

        <View style={styles.analyticsHeading}>

          <SectionHeader
            eyebrow="PRACTICE INSIGHTS"
            title="Today's overview"
          />


          <View style={styles.liveStatus}>

            <View style={styles.liveDot} />

            <Text style={styles.liveText}>
              LIVE
            </Text>

          </View>

        </View>


        {analytics ? (

          <Analytics
            data={analytics}
            title="Practice pulse"
          />

        ) : (

          <View style={styles.loadingContainer}>

            {loading ? (

              <Loading
                text="Loading practice data..."
              />

            ) : (

              <Card>

                <View style={styles.noAnalytics}>

                  <Text
                    style={
                      styles.noAnalyticsTitle
                    }
                  >
                    Practice analytics unavailable
                  </Text>

                  <Text
                    style={
                      styles.noAnalyticsText
                    }
                  >
                    We could not load your practice
                    analytics right now.
                  </Text>

                </View>

              </Card>

            )}

          </View>

        )}


        {/* =================================================
            RECENT PATIENTS
        ================================================= */}

        <View style={styles.patientHeading}>

          <SectionHeader
            eyebrow="PATIENT CARE"
            title="Recent patients"
          />


          {patients.length > 0 && (

            <Pressable
              onPress={() =>
                navigation.navigate(
                  'Patients'
                )
              }
              style={({ pressed }) => [
                styles.viewAll,
                pressed &&
                styles.pressed,
              ]}
            >

              <Text style={styles.viewAllText}>
                View all →
              </Text>

            </Pressable>

          )}

        </View>


        <Card>

          {patients.length === 0 ? (

            <EmptyPatients
              onPress={() =>
                navigation.navigate(
                  'AddPatient'
                )
              }
            />

          ) : (

            recentPatients.map(
              (patient, index) => (

                <PatientItem
                  key={
                    patient?._id ||
                    patient?.patientId ||
                    index
                  }
                  patient={patient}
                  index={index}
                  total={
                    recentPatients.length
                  }
                  onPress={() =>
                    navigation.navigate(
                      'PatientDetail',
                      {
                        id: patient?._id,
                      }
                    )
                  }
                />

              )
            )

          )}

        </Card>


        {/* =================================================
            PROFESSIONAL CARD
        ================================================= */}

        <View style={styles.proCard}>

          <View style={styles.proIcon}>

            <Text style={styles.proIconText}>
              ✓
            </Text>

          </View>


          <View style={styles.proContent}>

            <Text style={styles.proTitle}>
              Professional workspace
            </Text>


            <Text style={styles.proText}>
              Your clinical records stay connected
              to your secure Veda account.
            </Text>

          </View>


          <Text style={styles.proArrow}>
            →
          </Text>

        </View>


        {/* =================================================
            SIGN OUT
        ================================================= */}

        <View style={styles.signOut}>

          <Button
            title="Sign out"
            secondary
            onPress={logout}
          />

        </View>

      </FadeIn>


      {/* =================================================
          NOTIFICATION MODAL
      ================================================= */}

      <Modal
        visible={
          Boolean(activeNotification)
        }
        transparent
        animationType="fade"
        onRequestClose={
          dismissNotification
        }
      >

        <View
          style={
            styles.notificationOverlay
          }
        >

          <View
            style={
              styles.notificationModal
            }
          >

            <View
              style={
                styles.notificationTopRow
              }
            >

              <View
                style={
                  styles.notificationMark
                }
              >

                <Text
                  style={
                    styles.notificationMarkText
                  }
                >
                  {
                    activeNotification?.type ===
                    'payment_verified'
                      ? '✓'
                      : activeNotification?.type ===
                        'access_approved'
                        ? '✓'
                        : '₹'
                  }
                </Text>

              </View>


              <Text
                style={
                  styles.notificationEyebrow
                }
              >
                VEDA UPDATE
              </Text>

            </View>


            <Text
              style={
                styles.notificationTitle
              }
            >
              {
                activeNotification?.title ||
                'Notification'
              }
            </Text>


            <Text
              style={
                styles.notificationMessage
              }
            >
              {
                activeNotification?.message ||
                ''
              }
            </Text>


            <Pressable
              onPress={
                dismissNotification
              }
              style={({ pressed }) => [
                styles.notificationButton,
                pressed &&
                styles.notificationButtonPressed,
              ]}
            >

              <Text
                style={
                  styles.notificationButtonText
                }
              >
                Got it
              </Text>


              <Text
                style={
                  styles.notificationButtonArrow
                }
              >
                →
              </Text>

            </Pressable>


            <Pressable
              accessibilityRole="button"
              onPress={
                deleteActiveNotification
              }
              style={
                styles.notificationDeleteButton
              }
            >

              <Text
                style={
                  styles.notificationDeleteText
                }
              >
                Delete notification
              </Text>

            </Pressable>

          </View>

        </View>

      </Modal>

    </Screen>
  );
}


/* =====================================================
   PAYMENT SUMMARY CARD
===================================================== */

function PaymentSummaryCard({
  doctor,
  onPress,
}) {

  const paymentStatus =
    String(
      doctor?.paymentStatus ||
      'pending'
    ).toLowerCase();


  const isPaid =
    paymentStatus === 'paid';


  const isActive =
    doctor?.active !== false;


  const nextPaymentDate =
    formatDate(
      doctor?.nextPaymentDate
    );


  let statusLabel =
    'Payment pending';


  if (isPaid && isActive) {

    statusLabel =
      'Active';

  } else if (isPaid && !isActive) {

    statusLabel =
      'Access inactive';

  } else if (
    paymentStatus === 'failed'
  ) {

    statusLabel =
      'Payment failed';

  } else if (
    paymentStatus === 'cancelled'
  ) {

    statusLabel =
      'Payment cancelled';

  }


  const isPositive =
    isPaid && isActive;


  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.paymentCard,
        pressed &&
        styles.paymentPressed,
      ]}
    >

      <View style={styles.paymentLeft}>

        <View style={styles.paymentIconBox}>

          <Text style={styles.paymentIcon}>
            ₹
          </Text>

        </View>


        <View
          style={
            styles.paymentContent
          }
        >

          <View
            style={
              styles.paymentTitleRow
            }
          >

            <Text
              style={
                styles.paymentEyebrow
              }
            >
              SUBSCRIPTION & PAYMENT
            </Text>


            <View
              style={[
                styles.paymentStatusBadge,
                isPositive
                  ? styles.paymentActiveBadge
                  : styles.paymentPendingBadge,
              ]}
            >

              <View
                style={[
                  styles.paymentStatusDot,
                  isPositive
                    ? styles.paymentActiveDot
                    : styles.paymentPendingDot,
                ]}
              />


              <Text
                style={[
                  styles.paymentStatusText,
                  isPositive
                    ? styles.paymentActiveText
                    : styles.paymentPendingText,
                ]}
              >
                {statusLabel}
              </Text>

            </View>

          </View>


          <Text style={styles.paymentPlan}>
            Veda Doctor Access
          </Text>


          <Text style={styles.paymentValidity}>
            {nextPaymentDate !== '—'
              ? `Next payment • ${nextPaymentDate}`
              : 'View payment & access details'}
          </Text>

        </View>

      </View>


      <View style={styles.paymentArrowBox}>

        <Text style={styles.paymentArrow}>
          →
        </Text>

      </View>

    </Pressable>
  );
}


/* =====================================================
   ACCESS REQUEST CARD
===================================================== */

function AccessRequestCard({
  loading,
  onPress,
}) {

  return (
    <View style={styles.accessRequestCard}>

      <View style={styles.accessRequestTop}>

        <View style={styles.accessRequestIcon}>

          <Text style={styles.accessRequestIconText}>
            ↗
          </Text>

        </View>


        <View style={styles.accessRequestContent}>

          <Text style={styles.accessRequestEyebrow}>
            ACCESS REQUEST
          </Text>


          <Text style={styles.accessRequestTitle}>
            Your doctor access is inactive
          </Text>


          <Text style={styles.accessRequestText}>
            Send a request to the administrator
            to restore your Veda access.
          </Text>

        </View>

      </View>


      <Pressable
        disabled={loading}
        onPress={onPress}
        style={({ pressed }) => [
          styles.accessRequestButton,
          pressed &&
          styles.accessRequestButtonPressed,
          loading &&
          styles.accessRequestButtonDisabled,
        ]}
      >

        {loading ? (

          <View style={styles.requestLoadingRow}>

            <Animated.View
              style={styles.requestLoadingDot}
            />

            <Text
              style={
                styles.accessRequestButtonText
              }
            >
              Sending request...
            </Text>

          </View>

        ) : (

          <>
            <Text
              style={
                styles.accessRequestButtonText
              }
            >
              Request access
            </Text>

            <Text
              style={
                styles.accessRequestButtonArrow
              }
            >
              →
            </Text>
          </>

        )}

      </Pressable>

    </View>
  );
}


/* =====================================================
   ACCESS PENDING CARD
===================================================== */

function AccessPendingCard() {

  return (
    <View style={styles.pendingAccessCard}>

      <View style={styles.pendingAccessIcon}>

        <Text style={styles.pendingAccessIconText}>
          ✓
        </Text>

      </View>


      <View style={styles.pendingAccessContent}>

        <Text style={styles.pendingAccessEyebrow}>
          ACCESS REQUEST
        </Text>


        <Text style={styles.pendingAccessTitle}>
          Request pending
        </Text>


        <Text style={styles.pendingAccessText}>
          Your request has been sent to the
          administrator. You will be notified
          when it is reviewed.
        </Text>

      </View>

    </View>
  );
}


/* =====================================================
   PAYMENT REMINDER CARD
===================================================== */

function PaymentReminderCard({
  onPress,
}) {

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.paymentReminderCard,
        pressed &&
        styles.paymentReminderPressed,
      ]}
    >

      <View style={styles.paymentReminderIcon}>

        <Text style={styles.paymentReminderIconText}>
          ₹
        </Text>

      </View>


      <View style={styles.paymentReminderContent}>

        <Text style={styles.paymentReminderEyebrow}>
          PAYMENT REMINDER
        </Text>


        <Text style={styles.paymentReminderTitle}>
          Payment action required
        </Text>


        <Text style={styles.paymentReminderText}>
          Open your payment details to review
          your Veda access and payment status.
        </Text>

      </View>


      <View style={styles.paymentReminderArrow}>

        <Text style={styles.paymentReminderArrowText}>
          →
        </Text>

      </View>

    </Pressable>
  );
}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(value) {

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
}


/* =====================================================
   SECTION HEADER
===================================================== */

function SectionHeader({
  eyebrow,
  title,
}) {

  return (
    <View>

      <Text style={styles.sectionEyebrow}>
        {eyebrow}
      </Text>


      <Text style={styles.sectionTitle}>
        {title}
      </Text>

    </View>
  );
}


/* =====================================================
   MINI STAT
===================================================== */

function ClinicalMiniStat({
  value,
  label,
}) {

  return (
    <View style={styles.clinicalStat}>

      <Text style={styles.clinicalValue}>
        {value}
      </Text>


      <Text style={styles.clinicalLabel}>
        {label}
      </Text>

    </View>
  );
}


/* =====================================================
   DOCTOR ACTION
===================================================== */

function DoctorAction({
  icon,
  title,
  description,
  primary,
  onPress,
}) {

  const scale = useRef(
    new Animated.Value(1)
  ).current;


  const onPressIn = () => {

    Animated.spring(
      scale,
      {
        toValue: 0.975,
        speed: 30,
        bounciness: 4,
        useNativeDriver: true,
      }
    ).start();

  };


  const onPressOut = () => {

    Animated.spring(
      scale,
      {
        toValue: 1,
        speed: 25,
        bounciness: 5,
        useNativeDriver: true,
      }
    ).start();

  };


  return (
    <Animated.View
      style={[
        styles.actionWrapper,
        {
          transform: [
            {
              scale,
            },
          ],
        },
      ]}
    >

      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.doctorAction,
          primary &&
          styles.doctorActionPrimary,
        ]}
      >

        <View
          style={[
            styles.actionIcon,
            primary &&
            styles.actionIconPrimary,
          ]}
        >

          <Text
            style={[
              styles.actionIconText,
              primary &&
              styles.actionIconTextPrimary,
            ]}
          >
            {icon}
          </Text>

        </View>


        <View
          style={
            styles.actionTextArea
          }
        >

          <Text
            style={[
              styles.actionTitle,
              primary &&
              styles.actionTitlePrimary,
            ]}
          >
            {title}
          </Text>


          <Text
            style={[
              styles.actionDescription,
              primary &&
              styles.actionDescriptionPrimary,
            ]}
          >
            {description}
          </Text>

        </View>


        <View
          style={[
            styles.actionArrowBox,
            primary &&
            styles.actionArrowBoxPrimary,
          ]}
        >

          <Text
            style={[
              styles.actionArrow,
              primary &&
              styles.actionArrowPrimary,
            ]}
          >
            →
          </Text>

        </View>

      </Pressable>

    </Animated.View>
  );
}


/* =====================================================
   PATIENT ITEM
===================================================== */

function PatientItem({
  patient,
  index,
  total,
  onPress,
}) {

  const initial =
    patient?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    'P';


  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.patientItem,
        index === total - 1 &&
        styles.patientLast,
        pressed &&
        styles.pressed,
      ]}
    >

      <View
        style={
          styles.patientAvatar
        }
      >

        <Text
          style={
            styles.patientInitial
          }
        >
          {initial}
        </Text>

      </View>


      <View
        style={
          styles.patientDetails
        }
      >

        <Text
          style={
            styles.patientName
          }
          numberOfLines={1}
        >
          {patient?.name ||
            'Unnamed patient'}
        </Text>


        <View
          style={
            styles.patientMetaRow
          }
        >

          <Text
            style={
              styles.patientMeta
            }
          >
            {patient?.age || '—'} yrs
          </Text>


          <View
            style={
              styles.metaBullet
            }
          />


          <Text
            style={
              styles.patientMeta
            }
          >
            {patient?.gender || '—'}
          </Text>


          {patient?.patientId ? (

            <React.Fragment>

              <View
                style={
                  styles.metaBullet
                }
              />


              <Text
                style={
                  styles.patientId
                }
                numberOfLines={1}
              >
                {patient.patientId}
              </Text>

            </React.Fragment>

          ) : null}

        </View>

      </View>


      <View
        style={
          styles.patientOpen
        }
      >

        <Text
          style={
            styles.patientOpenArrow
          }
        >
          →
        </Text>

      </View>

    </Pressable>
  );
}


/* =====================================================
   EMPTY PATIENTS
===================================================== */

function EmptyPatients({
  onPress,
}) {

  return (
    <View
      style={
        styles.emptyPatient
      }
    >

      <View
        style={
          styles.emptyIcon
        }
      >

        <Text
          style={
            styles.emptyIconText
          }
        >
          ＋
        </Text>

      </View>


      <Text
        style={
          styles.emptyTitle
        }
      >
        No patient records yet
      </Text>


      <Text
        style={
          styles.emptyText
        }
      >
        Add your first patient to begin
        building their clinical record.
      </Text>


      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.emptyButton,
          pressed &&
          styles.pressed,
        ]}
      >

        <Text
          style={
            styles.emptyButtonText
          }
        >
          Add patient →
        </Text>

      </Pressable>

    </View>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  /* ===================================================
     NOTIFICATION
  =================================================== */

  notificationOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(5, 18, 30, 0.62)',
    justifyContent: 'center',
    padding: 24,
  },

  notificationModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2EAF0',
    shadowColor: '#071B2B',
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },

  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  notificationMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E4F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  notificationMarkText: {
    color: '#147A58',
    fontSize: 22,
    fontWeight: '900',
  },

  notificationEyebrow: {
    color: '#14805E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  notificationTitle: {
    color: '#102637',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    marginBottom: 9,
  },

  notificationMessage: {
    color: '#526676',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 23,
  },

  notificationButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#102C3C',
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  notificationButtonPressed: {
    opacity: 0.84,
  },

  notificationButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  notificationButtonArrow: {
    color: '#A9D8C5',
    fontSize: 20,
    fontWeight: '700',
  },

  notificationDeleteButton: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 3,
  },

  notificationDeleteText: {
    color: '#A62F3D',
    fontSize: 12,
    fontWeight: '700',
  },


  /* ===================================================
     TOP
  =================================================== */

  topArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingBottom: 22,
  },

  topLeft: {
    flex: 1,
    paddingRight: 14,
  },

  helloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    marginRight: 7,
  },

  helloLabel: {
    color: colors.blue,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1.25,
  },

  greeting: {
    color: colors.ink,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
  },

  greetingSmall: {
    fontSize: 26,
    lineHeight: 31,
  },

  doctorName: {
    color: colors.ink,
    fontSize: 37,
    lineHeight: 41,
    fontWeight: '900',
    letterSpacing: -1.4,
    marginTop: 1,
  },

  doctorNameSmall: {
    fontSize: 32,
    lineHeight: 36,
  },

  dateText: {
    color: colors.muted,
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 7,
  },

  profileCircle: {
    width: 61,
    height: 61,
    borderRadius: 21,
    backgroundColor: '#EAF3FF',
    borderWidth: 1,
    borderColor: '#D7E7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInitial: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: '900',
  },

  profileOnline: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },


  /* ===================================================
     HERO
  =================================================== */

  clinicCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#091827',
    borderRadius: 28,
    minHeight: 278,
    marginBottom: 20,
  },

  clinicGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 150,
    backgroundColor: '#1677FF',
    opacity: 0.22,
    right: -80,
    top: -85,
  },

  clinicRing: {
    position: 'absolute',
    width: 205,
    height: 205,
    borderRadius: 150,
    borderWidth: 1,
    borderColor:
      'rgba(125,190,255,0.15)',
    right: -55,
    top: -50,
  },

  ringDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#60A5FA',
    top: 20,
    left: 34,
  },

  clinicCardContent: {
    paddingHorizontal: 21,
    paddingTop: 22,
    paddingBottom: 17,
  },

  clinicBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.11)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
  },

  clinicBadgeIcon: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '900',
    marginRight: 6,
  },

  clinicBadgeText: {
    color: '#AFC7E3',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1,
  },

  clinicTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 22,
  },

  clinicTitleAccent: {
    color: '#69AFFF',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  clinicDescription: {
    color: '#9BAFC4',
    fontSize: 11.5,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 340,
  },

  clinicBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 66,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  clinicalStat: {
    flex: 1,
    alignItems: 'center',
  },

  clinicalValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  clinicalLabel: {
    color: '#6F849B',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 3,
  },

  clinicDivider: {
    width: 1,
    height: 27,
    backgroundColor:
      'rgba(255,255,255,0.10)',
  },


  /* ===================================================
     PAYMENT SUMMARY
  =================================================== */

  paymentCard: {
    minHeight: 84,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EAF2',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#0B1F33',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },

  paymentPressed: {
    opacity: 0.72,
  },

  paymentLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },

  paymentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#DFEBF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  paymentIcon: {
    color: colors.blue,
    fontSize: 19,
    fontWeight: '900',
  },

  paymentContent: {
    flex: 1,
    minWidth: 0,
  },

  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  paymentEyebrow: {
    color: colors.blue,
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.05,
  },

  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },

  paymentActiveBadge: {
    backgroundColor: '#ECFDF5',
  },

  paymentPendingBadge: {
    backgroundColor: '#FFF7ED',
  },

  paymentStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    marginRight: 4,
  },

  paymentActiveDot: {
    backgroundColor: '#10B981',
  },

  paymentPendingDot: {
    backgroundColor: '#F59E0B',
  },

  paymentStatusText: {
    fontSize: 7,
    fontWeight: '900',
  },

  paymentActiveText: {
    color: '#059669',
  },

  paymentPendingText: {
    color: '#D97706',
  },

  paymentPlan: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 5,
  },

  paymentValidity: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
  },

  paymentArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F6F8FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  paymentArrow: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '900',
  },


  /* ===================================================
     ACCESS REQUEST
  =================================================== */

  accessRequestCard: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: '#F6D7A6',
    borderRadius: 20,
    padding: 15,
    marginBottom: 14,
  },

  accessRequestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  accessRequestIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FFF0D5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  accessRequestIconText: {
    color: '#C77A08',
    fontSize: 22,
    fontWeight: '900',
  },

  accessRequestContent: {
    flex: 1,
  },

  accessRequestEyebrow: {
    color: '#B76A00',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  accessRequestTitle: {
    color: '#5A3B0B',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },

  accessRequestText: {
    color: '#866B45',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  accessRequestButton: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: '#102C3C',
    marginTop: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  accessRequestButtonPressed: {
    opacity: 0.8,
  },

  accessRequestButtonDisabled: {
    opacity: 0.6,
  },

  accessRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  accessRequestButtonArrow: {
    color: '#69AFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  requestLoadingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestLoadingDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#69AFFF',
    marginRight: 8,
  },


  /* ===================================================
     ACCESS PENDING
  =================================================== */

  pendingAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFFAF5',
    borderWidth: 1,
    borderColor: '#CBEBDD',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },

  pendingAccessIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#DDF6E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  pendingAccessIconText: {
    color: '#12915F',
    fontSize: 20,
    fontWeight: '900',
  },

  pendingAccessContent: {
    flex: 1,
  },

  pendingAccessEyebrow: {
    color: '#12835A',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  pendingAccessTitle: {
    color: '#174B37',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },

  pendingAccessText: {
    color: '#567968',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },


  /* ===================================================
     PAYMENT REMINDER
  =================================================== */

  paymentReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },

  paymentReminderPressed: {
    opacity: 0.72,
  },

  paymentReminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  paymentReminderIconText: {
    color: '#C2410C',
    fontSize: 18,
    fontWeight: '900',
  },

  paymentReminderContent: {
    flex: 1,
  },

  paymentReminderEyebrow: {
    color: '#C2410C',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1,
  },

  paymentReminderTitle: {
    color: '#7C2D12',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },

  paymentReminderText: {
    color: '#9A6A4B',
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 3,
  },

  paymentReminderArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFF0DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  paymentReminderArrowText: {
    color: '#C2410C',
    fontSize: 15,
    fontWeight: '900',
  },


  /* ===================================================
     SECTION
  =================================================== */

  sectionEyebrow: {
    color: colors.blue,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 4,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  analyticsHeading: {
    position: 'relative',
    marginTop: 2,
    marginBottom: 14,
  },

  patientHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 14,
  },

  liveStatus: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#10B981',
    marginRight: 5,
  },

  liveText: {
    color: '#059669',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },


  /* ===================================================
     ACTIONS
  =================================================== */

  actionGrid: {
    gap: 10,
    marginTop: 13,
    marginBottom: 26,
  },

  actionGridTablet: {
    flexDirection: 'row',
  },

  actionWrapper: {
    flex: 1,
  },

  doctorAction: {
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EAF2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  doctorActionPrimary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#EDF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  actionIconPrimary: {
    backgroundColor:
      'rgba(96,165,250,0.16)',
  },

  actionIconText: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: '800',
  },

  actionIconTextPrimary: {
    color: '#69AFFF',
  },

  actionTextArea: {
    flex: 1,
    minWidth: 0,
  },

  actionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  actionTitlePrimary: {
    color: '#FFFFFF',
  },

  actionDescription: {
    color: colors.muted,
    fontSize: 9.5,
    marginTop: 4,
  },

  actionDescriptionPrimary: {
    color: '#8FA2B8',
  },

  actionArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#F5F8FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  actionArrowBoxPrimary: {
    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  actionArrow: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '900',
  },

  actionArrowPrimary: {
    color: '#69AFFF',
  },


  /* ===================================================
     ANALYTICS
  =================================================== */

  loadingContainer: {
    minHeight: 110,
    justifyContent: 'center',
  },

  noAnalytics: {
    alignItems: 'center',
    paddingVertical: 22,
  },

  noAnalyticsTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  noAnalyticsText: {
    color: colors.muted,
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 280,
  },


  /* ===================================================
     PATIENTS
  =================================================== */

  viewAll: {
    backgroundColor: '#EEF5FF',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  viewAllText: {
    color: colors.blue,
    fontSize: 9.5,
    fontWeight: '900',
  },

  patientItem: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F8',
  },

  patientLast: {
    borderBottomWidth: 0,
  },

  patientAvatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#DFEBF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  patientInitial: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '900',
  },

  patientDetails: {
    flex: 1,
    minWidth: 0,
  },

  patientName: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: '900',
  },

  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    minWidth: 0,
  },

  patientMeta: {
    color: colors.muted,
    fontSize: 9.5,
  },

  patientId: {
    color: '#94A3B8',
    fontSize: 9.5,
    flexShrink: 1,
  },

  metaBullet: {
    width: 3,
    height: 3,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },

  patientOpen: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  patientOpenArrow: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '900',
  },


  /* ===================================================
     EMPTY
  =================================================== */

  emptyPatient: {
    alignItems: 'center',
    paddingVertical: 19,
  },

  emptyIcon: {
    width: 51,
    height: 51,
    borderRadius: 16,
    backgroundColor: '#EDF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  emptyIconText: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: '700',
  },

  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },

  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 10.5,
    lineHeight: 17,
    maxWidth: 280,
    marginTop: 5,
  },

  emptyButton: {
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },


  /* ===================================================
     PROFESSIONAL
  =================================================== */

  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6ECF3',
    borderRadius: 19,
    padding: 13,
    marginTop: 17,
  },

  proIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#E8F7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  proIconText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '900',
  },

  proContent: {
    flex: 1,
  },

  proTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },

  proText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  proArrow: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 7,
  },


  /* ===================================================
     SIGN OUT
  =================================================== */

  signOut: {
    marginTop: 17,
    paddingBottom: 20,
  },


  /* ===================================================
     GENERAL
  =================================================== */

  pressed: {
    opacity: 0.68,
  },

});