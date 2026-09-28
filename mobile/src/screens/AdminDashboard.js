import React, { useEffect, useState } from 'react';

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../api/api';

import {
  Button,
  Card,
  FadeIn,
  Loading,
  Screen,
  colors,
} from '../components/UI';

import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({ navigation }) {
  const {
    doctor,
    logout,
    startAction,
    stopAction,
    actionLoading,
  } = useAuth();

  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [overview, setOverview] = useState(null);

  const [loading, setLoading] = useState(true);

  const [deleteDoctorId, setDeleteDoctorId] = useState(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  /* =========================================
     LOAD ADMIN DASHBOARD
  ========================================= */

  const load = async () => {
    try {
      setLoading(true);

      const [
        requestsResponse,
        doctorsResponse,
        overviewResponse,
      ] = await Promise.all([
        api.get('/admin/requests'),
        api.get('/admin/doctors'),
        api.get('/analytics/overview'),
      ]);

      setRequests(
        requestsResponse?.data?.data || []
      );

      setDoctors(
        doctorsResponse?.data?.data || []
      );

      setOverview(
        overviewResponse?.data?.data || null
      );
    } catch (error) {
      console.error(
        'ADMIN DASHBOARD ERROR:',
        error
      );

      Alert.alert(
        'Unable to load dashboard',
        error.response?.data?.message ||
          error.message ||
          'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================
     APPROVE / REJECT REQUEST
  ========================================= */

  const act = async (path, type) => {
    if (actionLoading) {
      return;
    }

    const messages = {
      approve: [
        'Approving doctor...',
        'Updating the doctor access request.',
      ],

      reject: [
        'Rejecting request...',
        'Updating the pending request.',
      ],
    };

    const selected =
      messages[type] || [
        'Updating request...',
        'Please wait while Veda processes this action.',
      ];

    try {
      startAction(
        selected[0],
        selected[1]
      );

      await api.post(path);

      startAction(
        'Refreshing admin dashboard...',
        'Updating the latest network information.'
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Action failed',
        error.response?.data?.message ||
          error.message ||
          'Unable to complete this action.'
      );
    } finally {
      stopAction();
    }
  };

  /* =========================================
     ACCESS CONTROL
  ========================================= */

  const access = async (doctorItem) => {
    if (
      actionLoading ||
      !doctorItem?._id
    ) {
      return;
    }

    const removing = doctorItem.active;

    try {
      startAction(
        removing
          ? 'Removing doctor access...'
          : 'Restoring doctor access...',

        removing
          ? 'Updating secure access permissions.'
          : 'Restoring access to the doctor workspace.'
      );

      await api.patch(
        `/admin/doctors/${doctorItem._id}/access`,
        {
          active: !doctorItem.active,
        }
      );

      startAction(
        'Refreshing doctor directory...',
        'Updating the latest access status.'
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Action failed',
        error.response?.data?.message ||
          error.message ||
          'Unable to update access.'
      );
    } finally {
      stopAction();
    }
  };

  /* =========================================
     DELETE CONFIRMATION
  ========================================= */

  const openDeleteConfirmation = (
    doctorItem
  ) => {
    if (actionLoading) {
      return;
    }

    setDeleteError('');
    setDeleteDoctorId(
      doctorItem._id
    );
  };

  const cancelDelete = () => {
    if (deletingDoctorId) {
      return;
    }

    setDeleteDoctorId(null);
    setDeleteError('');
  };

  const deleteDoctor = async (
    doctorItem
  ) => {
    if (
      !doctorItem?._id ||
      deletingDoctorId ||
      actionLoading
    ) {
      return;
    }

    try {
      setDeletingDoctorId(
        doctorItem._id
      );

      setDeleteError('');

      startAction(
        'Deleting doctor...',
        'Removing the doctor and related clinical records.'
      );

      await api.delete(
        `/admin/doctors/${doctorItem._id}`
      );

      setDeleteDoctorId(null);

      startAction(
        'Doctor deleted successfully...',
        'Refreshing the admin dashboard.'
      );

      await load();

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 450)
      );
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          'Unable to delete doctor.'
      );
    } finally {
      setDeletingDoctorId(null);
      stopAction();
    }
  };

  const adminName =
    doctor?.name?.split(' ')[0] ||
    'Admin';

  /* =========================================
     OPEN DOCTOR ANALYTICS
     
     IMPORTANT:
     Doctor card now opens:
     AdminDoctorDashboard

     It does NOT directly open:
     AdminDoctorEdit
  ========================================= */

  const openDoctorDashboard = (
    doctorItem
  ) => {
    if (
      actionLoading ||
      !doctorItem?._id
    ) {
      return;
    }

    navigation.navigate(
      'AdminDoctorDashboard',
      {
        doctor: doctorItem,
      }
    );
  };

  /* =========================================
     DASHBOARD
  ========================================= */

  return (
    <Screen scroll>
      <FadeIn>

        {/* =====================================
            HEADER
        ===================================== */}

        <View style={styles.header}>

          <View style={styles.headerText}>

            <View style={styles.adminLabel}>

              <View
                style={styles.adminDot}
              />

              <Text
                style={styles.adminLabelText}
              >
                VEDA ADMIN
              </Text>

            </View>

            <Text style={styles.title}>
              Dashboard
            </Text>

            <Text style={styles.subtitle}>
              Welcome back, {adminName}. Manage
              your healthcare network from one place.
            </Text>

          </View>

          <View style={styles.avatar}>

            <Text style={styles.avatarText}>
              {adminName
                ?.charAt(0)
                ?.toUpperCase() || 'A'}
            </Text>

          </View>

        </View>

        {/* =====================================
            SYSTEM STATUS
        ===================================== */}

        <View style={styles.systemBar}>

          <View style={styles.systemLeft}>

            <View
              style={styles.onlineDot}
            />

            <Text
              style={styles.systemText}
            >
              Veda system operational
            </Text>

          </View>

          <Text
            style={styles.secureText}
          >
            SECURE
          </Text>

        </View>

        {loading ? (

          <Loading
            text="Loading admin dashboard..."
          />

        ) : (

          <>

            {/* =================================
                KPI HEADER
            ================================= */}

            <View style={styles.sectionTop}>

              <View>

                <Text
                  style={styles.sectionEyebrow}
                >
                  OVERVIEW
                </Text>

                <Text
                  style={styles.sectionTitle}
                >
                  Network performance
                </Text>

              </View>

              <View
                style={styles.liveBadge}
              >

                <View
                  style={styles.liveDot}
                />

                <Text
                  style={styles.liveText}
                >
                  LIVE
                </Text>

              </View>

            </View>

            {/* =================================
                KPI CARDS
            ================================= */}

            <View style={styles.kpiGrid}>

              <KpiCard
                number={
                  overview?.totalDoctors || 0
                }
                label="Total doctors"
                smallLabel="REGISTERED"
                type="blue"
              />

              <KpiCard
                number={
                  overview?.activeDoctors || 0
                }
                label="Active doctors"
                smallLabel="WITH ACCESS"
                type="green"
              />

              <KpiCard
                number={
                  overview?.pendingRequests || 0
                }
                label="Pending requests"
                smallLabel="REQUIRES REVIEW"
                type="orange"
              />

              <KpiCard
                number={
                  overview?.totalPatients || 0
                }
                label="Total patients"
                smallLabel="ACROSS NETWORK"
                type="purple"
              />

            </View>

            {/* =================================
                SECONDARY STATS
            ================================= */}

            <View
              style={styles.secondaryRow}
            >

              <MiniStat
                label="Access removed"
                value={
                  overview?.inactiveDoctors || 0
                }
              />

              <MiniStat
                label="Total visits"
                value={
                  overview?.totalVisits || 0
                }
              />

            </View>

            {/* =================================
                APPROVAL SECTION
            ================================= */}

            <View
              style={styles.sectionHeader}
            >

              <View>

                <Text
                  style={styles.sectionEyebrow}
                >
                  ACTION REQUIRED
                </Text>

                <Text
                  style={styles.sectionTitle}
                >
                  Doctor approvals
                </Text>

              </View>

              <View
                style={styles.numberBadge}
              >

                <Text
                  style={styles.numberBadgeText}
                >
                  {requests.length}
                </Text>

              </View>

            </View>

            <Card>

              {requests.length === 0 ? (

                <EmptyState
                  title="No pending approvals"
                  text="All doctor access requests have been reviewed."
                  success
                />

              ) : (

                requests.map(
                  (request, index) => (

                    <RequestCard
                      key={request._id}
                      request={request}
                      index={index}
                      total={requests.length}
                      actionLoading={
                        actionLoading
                      }
                      onApprove={() =>
                        act(
                          `/admin/requests/${request._id}/approve`,
                          'approve'
                        )
                      }
                      onReject={() =>
                        act(
                          `/admin/requests/${request._id}/reject`,
                          'reject'
                        )
                      }
                    />

                  )
                )

              )}

            </Card>

            {/* =================================
                DOCTOR MANAGEMENT
            ================================= */}

            <View
              style={[
                styles.sectionHeader,
                styles.doctorSectionHeader,
              ]}
            >

              <View>

                <Text
                  style={styles.sectionEyebrow}
                >
                  MANAGEMENT
                </Text>

                <Text
                  style={styles.sectionTitle}
                >
                  Doctor directory
                </Text>

              </View>

              <Text
                style={styles.doctorCount}
              >
                {doctors.length} doctors
              </Text>

            </View>

            <Card>

              {doctors.length === 0 ? (

                <EmptyState
                  title="No doctors registered"
                  text="Approved doctors will appear here."
                />

              ) : (

                doctors.map(
                  (doctorItem, index) => {

                    const isConfirming =
                      deleteDoctorId ===
                      doctorItem._id;

                    const isDeleting =
                      deletingDoctorId ===
                      doctorItem._id;

                    return (
                      <DoctorCard
                        key={doctorItem._id}
                        doctorItem={doctorItem}
                        index={index}
                        total={doctors.length}
                        actionLoading={
                          actionLoading
                        }
                        isConfirming={
                          isConfirming
                        }
                        isDeleting={
                          isDeleting
                        }
                        deleteError={
                          deleteError
                        }

                        /*
                          IMPORTANT:
                          Analytics & Profile
                          opens AdminDoctorDashboard
                        */
                        onView={() =>
                          openDoctorDashboard(
                            doctorItem
                          )
                        }

                        onAccess={() =>
                          access(
                            doctorItem
                          )
                        }

                        onDelete={() =>
                          openDeleteConfirmation(
                            doctorItem
                          )
                        }

                        onCancelDelete={
                          cancelDelete
                        }

                        onConfirmDelete={() =>
                          deleteDoctor(
                            doctorItem
                          )
                        }
                      />
                    );
                  }
                )

              )}

            </Card>

            {/* =================================
                ADMIN INFO
            ================================= */}

            <View
              style={styles.adminInfo}
            >

              <View
                style={styles.infoIcon}
              >

                <Text
                  style={styles.infoIconText}
                >
                  i
                </Text>

              </View>

              <View
                style={styles.infoContent}
              >

                <Text
                  style={styles.infoTitle}
                >
                  Administrator workspace
                </Text>

                <Text
                  style={styles.infoText}
                >
                  Use this console to review doctors,
                  control access and monitor your
                  healthcare network.
                </Text>

              </View>

            </View>

          </>
        )}

        {/* =====================================
            SIGN OUT
        ===================================== */}

        <View
          style={styles.signOut}
        >

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


/* ============================================
   KPI CARD
============================================ */

function KpiCard({
  number,
  label,
  smallLabel,
  type,
}) {
  let iconBackground = '#EAF3FF';
  let iconColor = '#3478C8';

  if (type === 'green') {
    iconBackground = '#E8F8F1';
    iconColor = '#1D9A70';
  }

  if (type === 'orange') {
    iconBackground = '#FFF4DF';
    iconColor = '#C48622';
  }

  if (type === 'purple') {
    iconBackground = '#F0EBFF';
    iconColor = '#7557C8';
  }

  return (
    <View style={styles.kpiCard}>

      <View
        style={[
          styles.kpiIcon,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >

        <Text
          style={[
            styles.kpiIconText,
            {
              color: iconColor,
            },
          ]}
        >
          {type === 'green'
            ? '✓'
            : type === 'orange'
            ? '!'
            : type === 'purple'
            ? 'PT'
            : 'DR'}
        </Text>

      </View>

      <Text
        style={styles.kpiNumber}
      >
        {number}
      </Text>

      <Text
        style={styles.kpiLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.kpiSmallLabel}
      >
        {smallLabel}
      </Text>

    </View>
  );
}


/* ============================================
   MINI STAT
============================================ */

function MiniStat({
  label,
  value,
}) {
  return (
    <View style={styles.miniStat}>

      <Text
        style={styles.miniValue}
      >
        {value}
      </Text>

      <Text
        style={styles.miniLabel}
      >
        {label}
      </Text>

    </View>
  );
}


/* ============================================
   REQUEST CARD
============================================ */

function RequestCard({
  request,
  index,
  total,
  actionLoading,
  onApprove,
  onReject,
}) {
  const initial =
    request?.name
      ?.charAt(0)
      ?.toUpperCase() || 'D';

  return (
    <View
      style={[
        styles.requestItem,
        index === total - 1 &&
          styles.noBorder,
      ]}
    >

      <View
        style={styles.requestHeader}
      >

        <View
          style={styles.requestAvatar}
        >

          <Text
            style={styles.requestAvatarText}
          >
            {initial}
          </Text>

        </View>

        <View
          style={styles.requestDetails}
        >

          <Text
            style={styles.requestName}
            numberOfLines={1}
          >
            {request.name || 'Doctor'}
          </Text>

          <Text
            style={styles.requestEmail}
            numberOfLines={1}
          >
            {request.email || 'No email'}
          </Text>

        </View>

        <View
          style={styles.pendingBadge}
        >

          <Text
            style={styles.pendingText}
          >
            PENDING
          </Text>

        </View>

      </View>

      <View
        style={styles.specialization}
      >

        <Text
          style={styles.specializationLabel}
        >
          SPECIALIZATION
        </Text>

        <Text
          style={styles.specializationValue}
        >
          {request.specialization ||
            'Doctor'}
        </Text>

      </View>

      <View
        style={styles.requestButtons}
      >

        <View style={styles.buttonHalf}>

          <Button
            title="Approve"
            onPress={onApprove}
            disabled={actionLoading}
          />

        </View>

        <View style={styles.buttonHalf}>

          <Button
            title="Reject"
            danger
            onPress={onReject}
            disabled={actionLoading}
          />

        </View>

      </View>

    </View>
  );
}


/* ============================================
   DOCTOR CARD
============================================ */

function DoctorCard({
  doctorItem,
  index,
  total,
  actionLoading,
  isConfirming,
  isDeleting,
  deleteError,
  onView,
  onAccess,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const initial =
    doctorItem?.name
      ?.charAt(0)
      ?.toUpperCase() || 'D';

  return (
    <View
      style={[
        styles.doctorItem,
        index === total - 1 &&
          !isConfirming &&
          styles.noBorder,
      ]}
    >

      {/* DOCTOR HEADER */}

      <View
        style={styles.doctorHeader}
      >

        <View
          style={styles.doctorAvatar}
        >

          <Text
            style={styles.doctorAvatarText}
          >
            {initial}
          </Text>

        </View>

        <View
          style={styles.doctorDetails}
        >

          <Text
            style={styles.doctorName}
            numberOfLines={1}
          >
            {doctorItem.name ||
              'Doctor'}
          </Text>

          <Text
            style={styles.doctorEmail}
            numberOfLines={1}
          >
            {doctorItem.email ||
              'No email'}
          </Text>

        </View>

        <View
          style={[
            styles.statusBadge,
            doctorItem.active
              ? styles.activeBadge
              : styles.removedBadge,
          ]}
        >

          <View
            style={[
              styles.statusDot,
              doctorItem.active
                ? styles.activeDot
                : styles.removedDot,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              doctorItem.active
                ? styles.activeText
                : styles.removedText,
            ]}
          >
            {doctorItem.active
              ? 'ACTIVE'
              : 'REMOVED'}
          </Text>

        </View>

      </View>

      {/* =================================
          ANALYTICS & PROFILE
          
          NOW OPENS:
          AdminDoctorDashboard
      ================================= */}

      <Pressable
        onPress={onView}
        disabled={actionLoading}
        style={({ pressed }) => [
          styles.analyticsButton,
          pressed &&
            styles.pressed,
        ]}
      >

        <View
          style={styles.analyticsIcon}
        >

          <Text
            style={styles.analyticsIconText}
          >
            ↗
          </Text>

        </View>

        <View
          style={styles.analyticsText}
        >

          <Text
            style={styles.analyticsTitle}
          >
            Analytics & profile
          </Text>

          <Text
            style={styles.analyticsSubtitle}
          >
            View activity and edit doctor profile
          </Text>

        </View>

        <Text
          style={styles.arrow}
        >
          ›
        </Text>

      </Pressable>

      {/* =================================
          ACTIONS
      ================================= */}

      {!isConfirming ? (

        <View
          style={styles.doctorActions}
        >

          <View
            style={styles.actionButton}
          >

            <Button
              title={
                doctorItem.active
                  ? 'Remove access'
                  : 'Restore access'
              }
              secondary
              onPress={onAccess}
              disabled={actionLoading}
            />

          </View>

          <View
            style={styles.actionButton}
          >

            <Button
              title="Delete"
              danger
              onPress={onDelete}
              disabled={actionLoading}
            />

          </View>

        </View>

      ) : (

        /* DELETE CONFIRMATION */

        <View
          style={styles.deleteBox}
        >

          <View
            style={styles.deleteHeader}
          >

            <View
              style={styles.warningIcon}
            >

              <Text
                style={styles.warningText}
              >
                !
              </Text>

            </View>

            <View
              style={styles.deleteHeaderText}
            >

              <Text
                style={styles.deleteTitle}
              >
                Delete doctor?
              </Text>

              <Text
                style={styles.deleteSubtitle}
              >
                This action is permanent.
              </Text>

            </View>

          </View>

          <Text
            style={styles.deleteDescription}
          >
            The doctor, associated patients,
            visits and prescriptions will be
            permanently removed.
          </Text>

          <View
            style={styles.deleteActions}
          >

            <View
              style={styles.actionButton}
            >

              <Button
                title="Cancel"
                secondary
                disabled={
                  isDeleting ||
                  actionLoading
                }
                onPress={onCancelDelete}
              />

            </View>

            <View
              style={styles.actionButton}
            >

              <Button
                title={
                  isDeleting
                    ? 'Deleting...'
                    : 'Delete permanently'
                }
                danger
                disabled={
                  isDeleting ||
                  actionLoading
                }
                onPress={
                  onConfirmDelete
                }
              />

            </View>

          </View>

          {isDeleting ? (

            <Text
              style={styles.deleteProgress}
            >
              Removing doctor and related
              records...
            </Text>

          ) : null}

          {deleteError ? (

            <Text
              style={styles.deleteError}
            >
              {deleteError}
            </Text>

          ) : null}

        </View>

      )}

    </View>
  );
}


/* ============================================
   EMPTY STATE
============================================ */

function EmptyState({
  title,
  text,
  success,
}) {
  return (
    <View
      style={styles.emptyState}
    >

      <View
        style={[
          styles.emptyIcon,
          success &&
            styles.emptyIconSuccess,
        ]}
      >

        <Text
          style={[
            styles.emptyIconText,
            success &&
              styles.emptyIconTextSuccess,
          ]}
        >
          {success ? '✓' : '—'}
        </Text>

      </View>

      <Text
        style={styles.emptyTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.emptyText}
      >
        {text}
      </Text>

    </View>
  );
}


/* ============================================
   STYLES
============================================ */

const styles = StyleSheet.create({

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 15,
  },

  adminLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EAF7FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 9,
  },

  adminDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cyan,
    marginRight: 7,
  },

  adminLabelText: {
    color: colors.cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: colors.ink,
  },

  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 5,
    maxWidth: 400,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#102A38',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  /* SYSTEM BAR */

  systemBar: {
    minHeight: 43,
    borderWidth: 1,
    borderColor: '#E5ECEF',
    backgroundColor: '#F8FBFC',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    marginBottom: 23,
  },

  systemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#20B486',
    marginRight: 8,
  },

  systemText: {
    color: '#63747E',
    fontSize: 10.5,
    fontWeight: '700',
  },

  secureText: {
    color: '#1C9B73',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /* SECTION */

  sectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 11,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 11,
  },

  doctorSectionHeader: {
    marginTop: 27,
  },

  sectionEyebrow: {
    color: colors.cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 2,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#20B486',
    marginRight: 5,
  },

  liveText: {
    color: '#198C68',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  /* KPI */

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },

  kpiCard: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6EDF1',
    padding: 14,
    minHeight: 128,
    elevation: 1,
  },

  kpiIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  kpiIconText: {
    fontSize: 9,
    fontWeight: '900',
  },

  kpiNumber: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },

  kpiLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  kpiSmallLabel: {
    color: '#98A5AD',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  /* MINI STATS */

  secondaryRow: {
    flexDirection: 'row',
    marginTop: 1,
  },

  miniStat: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E7EDF1',
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 13,
    marginHorizontal: 4,
  },

  miniValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },

  miniLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },

  /* BADGE */

  numberBadge: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: '#FFF4DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },

  numberBadgeText: {
    color: '#B87816',
    fontSize: 11,
    fontWeight: '900',
  },

  doctorCount: {
    color: colors.muted,
    fontSize: 9.5,
    fontWeight: '800',
    marginBottom: 3,
  },

  /* REQUEST */

  requestItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F5',
  },

  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  requestAvatar: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EAF7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  requestAvatarText: {
    color: colors.cyan,
    fontSize: 15,
    fontWeight: '900',
  },

  requestDetails: {
    flex: 1,
    minWidth: 0,
  },

  requestName: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: '900',
  },

  requestEmail: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },

  pendingBadge: {
    backgroundColor: '#FFF4DF',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 6,
  },

  pendingText: {
    color: '#B87816',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  specialization: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 12,
  },

  specializationLabel: {
    color: '#98A5AD',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  specializationValue: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },

  requestButtons: {
    flexDirection: 'row',
    marginTop: 11,
  },

  buttonHalf: {
    flex: 1,
    marginHorizontal: 4,
  },

  /* DOCTOR */

  doctorItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F5',
  },

  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#102A38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  doctorAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  doctorDetails: {
    flex: 1,
    minWidth: 0,
  },

  doctorName: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: '900',
  },

  doctorEmail: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginLeft: 5,
  },

  activeBadge: {
    backgroundColor: '#E8F8F1',
  },

  removedBadge: {
    backgroundColor: '#F1F3F5',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: '#20A77A',
  },

  removedDot: {
    backgroundColor: '#87939A',
  },

  statusText: {
    fontSize: 6.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  activeText: {
    color: '#188A67',
  },

  removedText: {
    color: '#6D777D',
  },

  /* ANALYTICS BUTTON */

  analyticsButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FAFC',
    borderWidth: 1,
    borderColor: '#E2ECF0',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 13,
  },

  analyticsIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: '#E7F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  analyticsIconText: {
    color: colors.cyan,
    fontSize: 16,
    fontWeight: '900',
  },

  analyticsText: {
    flex: 1,
  },

  analyticsTitle: {
    color: colors.ink,
    fontSize: 11.5,
    fontWeight: '900',
  },

  analyticsSubtitle: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
  },

  arrow: {
    color: colors.cyan,
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 7,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* DOCTOR ACTIONS */

  doctorActions: {
    flexDirection: 'row',
    marginTop: 9,
  },

  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },

  /* DELETE */

  deleteBox: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#F1D0D5',
    borderRadius: 15,
    padding: 13,
    marginTop: 10,
  },

  deleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  warningIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#FCE7EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  warningText: {
    color: colors.danger,
    fontSize: 17,
    fontWeight: '900',
  },

  deleteHeaderText: {
    flex: 1,
  },

  deleteTitle: {
    color: '#8E2633',
    fontSize: 12.5,
    fontWeight: '900',
  },

  deleteSubtitle: {
    color: '#A56B73',
    fontSize: 9.5,
    marginTop: 2,
  },

  deleteDescription: {
    color: '#6D5055',
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 10,
  },

  deleteActions: {
    flexDirection: 'row',
    marginTop: 10,
  },

  deleteProgress: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
  },

  deleteError: {
    color: colors.danger,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },

  /* EMPTY */

  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#F1F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  emptyIconSuccess: {
    backgroundColor: '#E8F8F1',
  },

  emptyIconText: {
    color: '#9AA6AD',
    fontSize: 16,
    fontWeight: '900',
  },

  emptyIconTextSuccess: {
    color: '#20A77A',
  },

  emptyTitle: {
    color: colors.ink,
    fontSize: 13.5,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: colors.muted,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },

  /* ADMIN INFO */

  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FAFC',
    borderWidth: 1,
    borderColor: '#E4EDF1',
    borderRadius: 15,
    padding: 13,
    marginTop: 20,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#E7F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  infoIconText: {
    color: colors.cyan,
    fontSize: 16,
    fontWeight: '900',
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },

  infoText: {
    color: colors.muted,
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 2,
  },

  /* SIGN OUT */

  signOut: {
    marginTop: 22,
    marginBottom: 8,
  },

  /* COMMON */

  noBorder: {
    borderBottomWidth: 0,
  },

});