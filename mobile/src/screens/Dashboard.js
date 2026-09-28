import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

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

export default function Dashboard({
  navigation,
}) {
  const {
    doctor,
    logout,
  } = useAuth();

  const {
    width,
  } = useWindowDimensions();

  const isSmall =
    width < 380;

  const isTablet =
    width >= 620;

  const [patients, setPatients] =
    useState([]);

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  /* =====================================================
     ANIMATIONS
  ===================================================== */

  const fadeAnim =
    useRef(new Animated.Value(0)).current;

  const floatAnim =
    useRef(new Animated.Value(0)).current;

  const pulseAnim =
    useRef(new Animated.Value(1)).current;

  const rotateAnim =
    useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(
        Easing.cubic
      ),
      useNativeDriver: true,
    }).start();

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(
            Easing.ease
          ),
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(
            Easing.ease
          ),
          useNativeDriver: true,
        }),
      ])
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1700,
          easing: Easing.inOut(
            Easing.ease
          ),
          useNativeDriver: true,
        }),

        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(
            Easing.ease
          ),
          useNativeDriver: true,
        }),
      ])
    );

    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
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
     LOAD
  ===================================================== */

  const load = async () => {
    try {
      setLoading(true);

      const [
        patientsResponse,
        analyticsResponse,
      ] = await Promise.all([
        api.get('/patients'),
        api.get(
          '/analytics/doctor/me'
        ),
      ]);

      setPatients(
        patientsResponse?.data?.data || []
      );

      setAnalytics(
        analyticsResponse?.data?.data || null
      );
    } catch (error) {
      console.error(
        'DASHBOARD LOAD ERROR:',
        error
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []);


  /* =====================================================
     DATA
  ===================================================== */

  const firstName =
    doctor?.name
      ?.trim()
      ?.split(' ')[0] ||
    'Doctor';

  const doctorName =
    doctor?.name ||
    'Doctor';

  const totalPatients =
    patients.length;

  const recentPatients =
    patients.slice(0, 5);

  const floatY =
    floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -7],
    });

  const rotation =
    rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [
        '0deg',
        '360deg',
      ],
    });


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


          {/* Doctor initial */}

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
            PREMIUM CLINICAL CARD
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
              value="24/7"
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


        {loading ? (

          <View style={styles.loadingContainer}>
            <Loading
              text="Loading practice data..."
            />
          </View>

        ) : (

          <Analytics
            data={analytics}
            title="Practice pulse"
          />

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
                    patient._id ||
                    patient.patientId ||
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
                        id:
                          patient._id,
                      }
                    )
                  }
                />
              )
            )

          )}

        </Card>


        {/* =================================================
            PROFESSIONAL FOOT NOTE
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

    </Screen>
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
  const scale =
    useRef(
      new Animated.Value(1)
    ).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.975,
      speed: 30,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 25,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
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

        <View style={styles.actionTextArea}>

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

      <View style={styles.patientAvatar}>

        <Text style={styles.patientInitial}>
          {initial}
        </Text>

      </View>


      <View style={styles.patientDetails}>

        <Text
          style={styles.patientName}
          numberOfLines={1}
        >
          {patient?.name ||
            'Unnamed patient'}
        </Text>

        <View style={styles.patientMetaRow}>

          <Text style={styles.patientMeta}>
            {patient?.age || '—'} yrs
          </Text>

          <View style={styles.metaBullet} />

          <Text style={styles.patientMeta}>
            {patient?.gender || '—'}
          </Text>

          {patient?.patientId ? (
            <>
              <View style={styles.metaBullet} />

              <Text
                style={styles.patientId}
                numberOfLines={1}
              >
                {patient.patientId}
              </Text>
            </>
          ) : null}

        </View>

      </View>


      <View style={styles.patientOpen}>

        <Text style={styles.patientOpenArrow}>
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
    <View style={styles.emptyPatient}>

      <View style={styles.emptyIcon}>

        <Text style={styles.emptyIconText}>
          ＋
        </Text>

      </View>

      <Text style={styles.emptyTitle}>
        No patient records yet
      </Text>

      <Text style={styles.emptyText}>
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
        <Text style={styles.emptyButtonText}>
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
     CLINIC CARD
  =================================================== */

  clinicCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#091827',
    borderRadius: 28,
    minHeight: 278,
    marginBottom: 27,
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
     LOADING
  =================================================== */

  loadingContainer: {
    minHeight: 110,
    justifyContent: 'center',
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
     EMPTY PATIENT
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
     PROFESSIONAL CARD
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