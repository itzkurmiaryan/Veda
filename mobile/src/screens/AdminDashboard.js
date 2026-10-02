import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useFocusEffect,
} from '@react-navigation/native';

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
  Image,
  Modal,
  Platform,
  Pressable,
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
} from '../components/UI';

import VedaAlertModal from '../components/VedaAlertModal';

import {
  AccessRequestCard,
  DoctorDirectoryRow,
  EmptyState,
  KpiCard,
  MetaBox,
  NotificationRow,
  PaymentEntryModal,
  PaymentHistoryModal,
  RequestCard,
  calculateLocalDays,
  formatLocalDate,
  isDateDue,
  isPaymentRequestCoolingDown,
} from './AdminDashboardComponents';

import styles from './AdminDashboardStyles';

import { useAuth } from '../context/AuthContext';

export default function AdminDashboard({
  navigation,
}) {
  const {
    doctor,
    logout,
    startAction,
    stopAction,
    actionLoading,
  } = useAuth();

  const [requests, setRequests] =
    useState([]);

  const [doctors, setDoctors] =
    useState([]);

  const [overview, setOverview] =
    useState(null);

  const [notifications, setNotifications] =
    useState([]);

  const [accessRequests, setAccessRequests] =
    useState([]);

  const [
    selectedDoctorGroup,
    setSelectedDoctorGroup,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [deleteDoctorId, setDeleteDoctorId] =
    useState(null);

  const [
    deletingDoctorId,
    setDeletingDoctorId,
  ] = useState(null);

  const [deleteError, setDeleteError] =
    useState('');

  const [
    paymentProofPreview,
    setPaymentProofPreview,
  ] = useState(null);

  const [
    paymentProofLoading,
    setPaymentProofLoading,
  ] = useState(false);

  const [
    paymentEntryDoctor,
    setPaymentEntryDoctor,
  ] = useState(null);

  const [
    paymentHistoryDoctor,
    setPaymentHistoryDoctor,
  ] = useState(null);

  const [paymentAmount, setPaymentAmount] =
    useState('');

  const [paymentMode, setPaymentMode] =
    useState(null);

  const [paymentNote, setPaymentNote] =
    useState('');

  const [
    paymentTransactionId,
    setPaymentTransactionId,
  ] = useState('');

  const [
    paymentMonthsPaid,
    setPaymentMonthsPaid,
  ] = useState('1');

  const [paymentProof, setPaymentProof] =
    useState(null);

  /* ================================================================
     VEDA ALERT
  ================================================================= */

  const [vedaAlert, setVedaAlert] =
    useState({
      visible: false,
      type: 'info',
      title: '',
      message: '',
      primaryText: 'Done',
      secondaryText: '',
      onPrimary: null,
      onSecondary: null,
    });

  const showVedaAlert = useCallback(
    ({
      type = 'info',
      title = 'Veda',
      message = '',
      primaryText = 'Done',
      secondaryText = '',
      onPrimary = null,
      onSecondary = null,
    }) => {
      setVedaAlert({
        visible: true,
        type,
        title,
        message,
        primaryText,
        secondaryText,
        onPrimary,
        onSecondary,
      });
    },
    []
  );

  const closeVedaAlert = useCallback(
    () => {
      setVedaAlert((current) => ({
        ...current,
        visible: false,
        onPrimary: null,
        onSecondary: null,
      }));
    },
    []
  );

  /* ================================================================
     DATE REFRESH
  ================================================================= */

  const [todayKey, setTodayKey] =
    useState(() => {
      const now = new Date();

      return [
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
      ].join('-');
    });

  /* ================================================================
     HELPERS
  ================================================================= */

  const unwrap = (
    response,
    fallback = []
  ) => {
    const value =
      response?.data?.data;

    if (Array.isArray(value)) {
      return value;
    }

    if (
      value &&
      typeof value === 'object'
    ) {
      return value;
    }

    if (
      Array.isArray(
        response?.data
      )
    ) {
      return response.data;
    }

    return fallback;
  };

  const getAccessActive = (
    doctorItem
  ) => {
    if (!doctorItem) {
      return false;
    }

    if (
      typeof doctorItem.accessActive ===
      'boolean'
    ) {
      return doctorItem.accessActive;
    }

    if (
      typeof doctorItem.active ===
      'boolean'
    ) {
      return doctorItem.active;
    }

    return true;
  };

  /* ================================================================
     PAYMENT DATE HELPERS
  ================================================================= */

  const getPaymentEndDate = (
    doctorItem
  ) => {
    if (!doctorItem) {
      return null;
    }

    if (doctorItem.nextPaymentDate) {
      const date = new Date(
        doctorItem.nextPaymentDate
      );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return date;
      }
    }

    const history = Array.isArray(
      doctorItem.paymentHistory
    )
      ? doctorItem.paymentHistory
      : [];

    if (history.length > 0) {
      const sortedHistory = [
        ...history,
      ].sort((a, b) => {
        const dateA = new Date(
          a?.nextPaymentDate ||
            a?.paidAt ||
            a?.createdAt ||
            0
        );

        const dateB = new Date(
          b?.nextPaymentDate ||
            b?.paidAt ||
            b?.createdAt ||
            0
        );

        return (
          dateB.getTime() -
          dateA.getTime()
        );
      });

      const latest =
        sortedHistory[0];

      const historyDate =
        latest?.nextPaymentDate;

      if (historyDate) {
        const date = new Date(
          historyDate
        );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          return date;
        }
      }
    }

    return null;
  };

  const isPaymentDateExpired = (
    doctorItem
  ) => {
    const paymentEndDate =
      getPaymentEndDate(
        doctorItem
      );

    if (!paymentEndDate) {
      return false;
    }

    const today = new Date();

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOnly = new Date(
      paymentEndDate.getFullYear(),
      paymentEndDate.getMonth(),
      paymentEndDate.getDate()
    );

    return todayOnly > endOnly;
  };

  const hasVerifiedPayment = (
    doctorItem
  ) => {
    if (!doctorItem) {
      return false;
    }

    const history = Array.isArray(
      doctorItem.paymentHistory
    )
      ? doctorItem.paymentHistory
      : [];

    return history.length > 0;
  };

  const hasPendingPaymentVerification =
    (doctorItem) => {
      return (
        doctorItem?.pendingPayment
          ?.status === 'pending'
      );
    };

  const hasRejectedPayment = (
    doctorItem
  ) => {
    return (
      doctorItem?.pendingPayment
        ?.status === 'rejected'
    );
  };

  const getEffectivePaymentStatus = (
    doctorItem
  ) => {
    if (!doctorItem) {
      return 'unpaid';
    }

    if (
      hasPendingPaymentVerification(
        doctorItem
      )
    ) {
      return 'verifying';
    }

    if (
      hasRejectedPayment(
        doctorItem
      )
    ) {
      return 'rejected';
    }

    const paymentEndDate =
      getPaymentEndDate(
        doctorItem
      );

    if (paymentEndDate) {
      if (
        isPaymentDateExpired(
          doctorItem
        )
      ) {
        return 'expired';
      }

      return 'paid';
    }

    if (
      hasVerifiedPayment(
        doctorItem
      )
    ) {
      return doctorItem.paymentStatus ===
        'paid'
        ? 'paid'
        : 'unpaid';
    }

    if (
      doctorItem.paymentStatus ===
      'paid'
    ) {
      return 'paid';
    }

    return 'unpaid';
  };

  const getPaymentStatus = (
    doctorItem
  ) => {
    return getEffectivePaymentStatus(
      doctorItem
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);

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
  };

  const calculateDaysUsed = (
    doctorItem
  ) => {
    if (
      typeof doctorItem?.daysUsed ===
      'number'
    ) {
      return doctorItem.daysUsed;
    }

    const start =
      doctorItem?.accessStartDate ||
      doctorItem?.registrationDate ||
      doctorItem?.createdAt;

    if (!start) {
      return 0;
    }

    const startDate = new Date(
      start
    );

    if (
      Number.isNaN(
        startDate.getTime()
      )
    ) {
      return 0;
    }

    const difference =
      new Date().getTime() -
      startDate.getTime();

    return Math.max(
      0,
      Math.floor(
        difference /
          (1000 *
            60 *
            60 *
            24)
      )
    );
  };

  const isPaymentDue = (
    doctorItem
  ) => {
    if (!doctorItem) {
      return false;
    }

    const status =
      getEffectivePaymentStatus(
        doctorItem
      );

    if (
      status === 'verifying'
    ) {
      return false;
    }

    if (
      status === 'paid'
    ) {
      return false;
    }

    if (
      status === 'expired' ||
      status === 'rejected'
    ) {
      return true;
    }

    if (
      doctorItem.paymentReminderRequested ===
      true
    ) {
      return true;
    }

    return false;
  };

  const getDisplayDoctor = (
    doctorItem
  ) => {
    const effectiveStatus =
      getEffectivePaymentStatus(
        doctorItem
      );

    const paymentEndDate =
      getPaymentEndDate(
        doctorItem
      );

    return {
      ...doctorItem,

      effectivePaymentStatus:
        effectiveStatus,

      effectivePaymentEndDate:
        paymentEndDate
          ? paymentEndDate.toISOString()
          : null,

      paymentDisplayStatus:
        effectiveStatus,

      paymentDisplayLabel:
        effectiveStatus === 'paid'
          ? 'PAID / ACTIVE'
          : effectiveStatus ===
              'expired'
            ? 'PAYMENT DUE'
            : effectiveStatus ===
                'verifying'
              ? 'VERIFYING'
              : effectiveStatus ===
                  'rejected'
                ? 'PAYMENT REJECTED'
                : 'UNPAID',
    };
  };

  const displayDoctors =
    doctors.map(
      getDisplayDoctor
    );

  /* ================================================================
     AUTOMATIC DATE REFRESH
  ================================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        const now = new Date();

        setTodayKey(
          [
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes(),
          ].join('-')
        );
      }, 60 * 1000);

    return () =>
      clearInterval(interval);
  }, []);

  void todayKey;

  /* ================================================================
     LOAD ADMIN DASHBOARD
  ================================================================= */

  const load = useCallback(
    async () => {
      try {
        setLoading(true);

        const results =
          await Promise.allSettled([
            api.get(
              '/admin/requests'
            ),
            api.get(
              '/admin/doctors'
            ),
            api.get(
              '/analytics/overview'
            ),
            api.get(
              '/admin/notifications'
            ),
            api.get(
              '/admin/access-requests'
            ),
          ]);

        const [
          requestsResult,
          doctorsResult,
          overviewResult,
          notificationsResult,
          accessRequestsResult,
        ] = results;

        if (
          requestsResult.status ===
          'fulfilled'
        ) {
          setRequests(
            unwrap(
              requestsResult.value,
              []
            )
          );
        } else {
          console.error(
            'REQUESTS ERROR:',
            requestsResult.reason
          );
        }

        if (
          doctorsResult.status ===
          'fulfilled'
        ) {
          const serverDoctors =
            unwrap(
              doctorsResult.value,
              []
            );

          setDoctors(
            Array.isArray(
              serverDoctors
            )
              ? serverDoctors
              : []
          );
        } else {
          console.error(
            'DOCTORS ERROR:',
            doctorsResult.reason
          );
        }

        if (
          overviewResult.status ===
          'fulfilled'
        ) {
          setOverview(
            unwrap(
              overviewResult.value,
              null
            )
          );
        } else {
          setOverview(null);
        }

        if (
          notificationsResult.status ===
          'fulfilled'
        ) {
          const serverNotifications =
            unwrap(
              notificationsResult.value,
              []
            );

          setNotifications(
            Array.isArray(
              serverNotifications
            )
              ? serverNotifications
              : []
          );
        } else {
          console.error(
            'NOTIFICATIONS ERROR:',
            notificationsResult.reason
          );
        }

        if (
          accessRequestsResult.status ===
          'fulfilled'
        ) {
          const serverAccessRequests =
            unwrap(
              accessRequestsResult.value,
              []
            );

          setAccessRequests(
            Array.isArray(
              serverAccessRequests
            )
              ? serverAccessRequests
              : []
          );
        } else {
          console.error(
            'ACCESS REQUESTS ERROR:',
            accessRequestsResult.reason
          );
        }
      } catch (error) {
        console.error(
          'ADMIN DASHBOARD ERROR:',
          error
        );

        showVedaAlert({
          type: 'error',
          title:
            'Unable to load dashboard',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Something went wrong while loading the admin dashboard.',
          primaryText: 'Close',
        });
      } finally {
        setLoading(false);
      }
    },
    [showVedaAlert]
  );

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const refreshAccessRequests =
        async () => {
          try {
            const response =
              await api.get(
                '/admin/access-requests'
              );

            if (mounted) {
              const requests =
                response?.data?.data;

              setAccessRequests(
                Array.isArray(
                  requests
                )
                  ? requests
                  : []
              );
            }
          } catch (error) {
            if (mounted) {
              console.error(
                'ACCESS REQUESTS REFRESH ERROR:',
                error?.response
                  ?.data ||
                  error?.message ||
                  error
              );
            }
          }
        };

      refreshAccessRequests();

      const interval =
        setInterval(
          refreshAccessRequests,
          30 * 1000
        );

      return () => {
        mounted = false;
        clearInterval(
          interval
        );
      };
    }, [])
  );

  /* ================================================================
     APPROVE / REJECT REGISTRATION
  ================================================================= */

  const act = async (
    path,
    type
  ) => {
    if (actionLoading) {
      return;
    }

    const messages = {
      approve: [
        'Approving doctor...',
        'Creating the doctor workspace.',
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
        'Updating the latest information.'
      );

      await load();

      showVedaAlert({
        type:
          type === 'approve'
            ? 'success'
            : 'info',
        title:
          type === 'approve'
            ? 'Doctor approved'
            : 'Request rejected',
        message:
          type === 'approve'
            ? 'The doctor registration has been approved and the workspace is now available.'
            : 'The doctor registration request has been rejected successfully.',
        primaryText: 'Done',
      });
    } catch (error) {
      showVedaAlert({
        type: 'error',
        title: 'Action failed',
        message:
          error.response?.data
            ?.message ||
          error.message ||
          'Unable to complete this action.',
        primaryText: 'Close',
      });
    } finally {
      stopAction();
    }
  };

  /* ================================================================
     REMOVE / RESTORE ACCESS
  ================================================================= */

  const access = async (
    doctorItem
  ) => {
    if (
      actionLoading ||
      !doctorItem?._id
    ) {
      return;
    }

    const currentlyActive =
      getAccessActive(
        doctorItem
      );

    const removing =
      currentlyActive;

    try {
      startAction(
        removing
          ? 'Removing doctor access...'
          : 'Restoring doctor access...',
        removing
          ? 'Clinical records will remain preserved.'
          : 'Restoring access to the doctor workspace.'
      );

      await api.patch(
        `/admin/doctors/${doctorItem._id}/access`,
        {
          active:
            !currentlyActive,
        }
      );

      setDoctors(
        (currentDoctors) =>
          currentDoctors.map(
            (item) =>
              item._id ===
              doctorItem._id
                ? {
                    ...item,
                    active:
                      !currentlyActive,
                    accessActive:
                      !currentlyActive,
                  }
                : item
          )
      );

      startAction(
        'Refreshing doctor directory...',
        'Updating the latest access status.'
      );

      await load();

      showVedaAlert({
        type: 'success',
        title: removing
          ? 'Access removed'
          : 'Access restored',
        message: removing
          ? `${doctorItem.name || 'Doctor'} no longer has access to the Veda workspace. Clinical records remain preserved.`
          : `${doctorItem.name || 'Doctor'} can now access the Veda workspace again.`,
        primaryText: 'Done',
      });
    } catch (error) {
      showVedaAlert({
        type: 'error',
        title: 'Access update failed',
        message:
          error.response?.data
            ?.message ||
          error.message ||
          'Unable to update doctor access.',
        primaryText: 'Close',
      });
    } finally {
      stopAction();
    }
  };

  /* ================================================================
     PAYMENT REQUEST
  ================================================================= */

  const requestPayment =
    async (doctorItem) => {
      if (
        actionLoading ||
        !doctorItem?._id
      ) {
        return;
      }

      try {
        startAction(
          'Sending payment reminder...',
          'Creating a payment reminder for the doctor.'
        );

        const response =
          await api.post(
            `/admin/doctors/${doctorItem._id}/payment-request`
          );

        const updatedDoctor =
          response?.data?.data ||
          response?.data?.doctor ||
          null;

        setDoctors(
          (currentDoctors) =>
            currentDoctors.map(
              (item) => {
                if (
                  item._id !==
                  doctorItem._id
                ) {
                  return item;
                }

                return {
                  ...item,

                  ...(updatedDoctor ||
                    {}),

                  paymentStatus:
                    updatedDoctor?.paymentStatus ||
                    item.paymentStatus ||
                    'pending',

                  paymentReminderRequested:
                    true,

                  paymentReminderAt:
                    updatedDoctor?.paymentReminderAt ||
                    new Date().toISOString(),
                };
              }
            )
        );

        startAction(
          'Payment reminder sent...',
          'Refreshing the latest payment status.'
        );

        await load();

        showVedaAlert({
          type: 'success',
          title: 'Payment reminder sent',
          message: `${doctorItem.name || 'Doctor'} has been notified that a payment is due.`,
          primaryText: 'Done',
        });
      } catch (error) {
        console.error(
          'PAYMENT REQUEST ERROR:',
          error
        );

        showVedaAlert({
          type: 'error',
          title:
            'Payment request failed',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Unable to send the payment request.',
          primaryText: 'Close',
        });
      } finally {
        stopAction();
      }
    };

  /* ================================================================
     PAYMENT UPDATE HELPERS
  ================================================================= */

  const updateAccessRequestPayment =
    (
      doctorId,
      updatedDoctor
    ) => {
      setAccessRequests(
        (currentRequests) =>
          currentRequests.map(
            (request) => {
              const requestDoctor =
                request.doctorId;

              const requestDoctorId =
                requestDoctor?._id ||
                requestDoctor;

              if (
                String(
                  requestDoctorId
                ) !==
                String(doctorId)
              ) {
                return request;
              }

              return {
                ...request,

                doctorId: {
                  ...(typeof requestDoctor ===
                  'object'
                    ? requestDoctor
                    : {}),

                  ...(updatedDoctor ||
                    {}),

                  paymentStatus:
                    updatedDoctor?.paymentStatus ||
                    'paid',

                  paymentReminderRequested:
                    updatedDoctor?.paymentReminderRequested ===
                    true,

                  paymentReminderAt:
                    updatedDoctor?.paymentReminderAt ||
                    null,
                },
              };
            }
          )
      );
    };

  const markPaymentPaid = (
    doctorItem
  ) => {
    if (
      actionLoading ||
      !doctorItem?._id
    ) {
      return;
    }

    setPaymentAmount('');
    setPaymentMode(null);
    setPaymentNote('');
    setPaymentTransactionId('');
    setPaymentMonthsPaid('1');
    setPaymentProof(null);
    setPaymentEntryDoctor(
      doctorItem
    );
  };

  /* ================================================================
     PAYMENT PROOF PICKER
  ================================================================= */

  const choosePaymentProof =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          showVedaAlert({
            type: 'warning',
            title:
              'Photo access needed',
            message:
              'Allow photo access to attach a payment screenshot to the payment record.',
            primaryText: 'Okay',
          });

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.45,
            }
          );

        if (result.canceled) {
          return;
        }

        const image =
          result.assets?.[0];

        if (!image?.uri) {
          throw new Error(
            'Please select a valid payment screenshot.'
          );
        }

        const resizeAction =
          image.width >=
          image.height
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
          await ImageManipulator.manipulateAsync(
            image.uri,
            [resizeAction],
            {
              compress: 0.4,
              format:
                ImageManipulator
                  .SaveFormat
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
            'Screenshot is too large. Please choose a smaller image.'
          );
        }

        setPaymentProof({
          data:
            compressed.base64,
          contentType:
            'image/jpeg',
          fileName:
            image.fileName ||
            'payment-proof.jpg',
          uri:
            compressed.uri,
        });
      } catch (error) {
        showVedaAlert({
          type: 'error',
          title:
            'Unable to select screenshot',
          message:
            error.message ||
            'Unable to select the payment screenshot.',
          primaryText: 'Close',
        });
      }
    };

  /* ================================================================
     MARK PAYMENT PAID
  ================================================================= */

  const submitPaymentPaid =
    async () => {
      const doctorItem =
        paymentEntryDoctor;

      const amount =
        Number(paymentAmount);

      const monthsPaid =
        Number(
          paymentMonthsPaid
        );

      if (
        !doctorItem?._id ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !Number.isInteger(
          monthsPaid
        ) ||
        monthsPaid < 1 ||
        monthsPaid > 24
      ) {
        showVedaAlert({
          type: 'warning',
          title:
            'Payment details required',
          message:
            'Please enter a valid payment amount and choose between 1 and 24 months.',
          primaryText: 'Okay',
        });

        return;
      }

      try {
        startAction(
          'Updating payment...',
          'Saving payment details securely.'
        );

        const response =
          await api.patch(
            `/admin/doctors/${doctorItem._id}/payment`,
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

        const updatedDoctor =
          response?.data?.data ||
          response?.data?.doctor ||
          null;

        const previousHistoryCount =
          doctorItem
            .paymentHistory
            ?.length || 0;

        if (
          updatedDoctor?.paymentStatus !==
            'paid' ||
          (updatedDoctor
            ?.paymentHistory
            ?.length || 0) <=
            previousHistoryCount
        ) {
          throw new Error(
            'The server did not confirm the payment and save its record.'
          );
        }

        setDoctors(
          (currentDoctors) =>
            currentDoctors.map(
              (item) =>
                item._id ===
                doctorItem._id
                  ? {
                      ...item,
                      ...updatedDoctor,
                      paymentStatus:
                        updatedDoctor?.paymentStatus ||
                        'paid',
                      paymentReminderRequested:
                        false,
                      paymentReminderAt:
                        null,
                    }
                  : item
            )
        );

        updateAccessRequestPayment(
          doctorItem._id,
          updatedDoctor
        );

        setPaymentEntryDoctor(
          null
        );

        showVedaAlert({
          type: 'success',
          title: 'Payment recorded',
          message: `${doctorItem.name || 'Doctor'}'s payment of ₹${amount.toLocaleString('en-IN')} for ${monthsPaid} month(s) has been recorded and verified successfully.`,
          primaryText: 'Done',
        });
      } catch (error) {
        console.error(
          'MARK PAYMENT PAID ERROR:',
          error
        );

        showVedaAlert({
          type: 'error',
          title:
            'Payment update failed',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Unable to update payment.',
          primaryText: 'Close',
        });
      } finally {
        stopAction();
      }
    };

  const submitPaymentUnpaid =
    async () => {
      const doctorItem =
        paymentEntryDoctor;

      if (!doctorItem?._id) {
        return;
      }

      try {
        startAction(
          'Updating payment status...',
          'Keeping this payment marked as unpaid.'
        );

        const response =
          await api.patch(
            `/admin/doctors/${doctorItem._id}/payment`,
            {
              status: 'unpaid',
            }
          );

        const updatedDoctor =
          response?.data?.data ||
          response?.data?.doctor ||
          null;

        if (
          updatedDoctor?.paymentStatus !==
          'pending'
        ) {
          throw new Error(
            'The server did not confirm unpaid status.'
          );
        }

        setDoctors(
          (currentDoctors) =>
            currentDoctors.map(
              (item) =>
                item._id ===
                doctorItem._id
                  ? {
                      ...item,
                      ...updatedDoctor,
                    }
                  : item
            )
        );

        updateAccessRequestPayment(
          doctorItem._id,
          updatedDoctor
        );

        setPaymentEntryDoctor(
          null
        );

        showVedaAlert({
          type: 'warning',
          title: 'Payment remains unpaid',
          message: `${doctorItem.name || 'Doctor'} remains marked as unpaid. The payment record has not been verified.`,
          primaryText: 'Okay',
        });
      } catch (error) {
        showVedaAlert({
          type: 'error',
          title:
            'Payment update failed',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Unable to update payment status.',
          primaryText: 'Close',
        });
      } finally {
        stopAction();
      }
    };

  /* ================================================================
     ACCESS REQUEST APPROVE / REJECT
  ================================================================= */

  const handleAccessRequest =
    async (
      request,
      action
    ) => {
      if (
        actionLoading ||
        !request?._id
      ) {
        return;
      }

      const isApprove =
        action === 'approve';

      try {
        startAction(
          isApprove
            ? 'Approving access request...'
            : 'Rejecting access request...',
          isApprove
            ? 'Restoring the doctor workspace.'
            : 'Updating the doctor access request.'
        );

        await api.post(
          `/admin/access-requests/${request._id}/${action}`
        );

        startAction(
          'Refreshing access requests...',
          'Updating the latest administrator information.'
        );

        await load();

        showVedaAlert({
          type: isApprove
            ? 'success'
            : 'info',
          title: isApprove
            ? 'Access request approved'
            : 'Access request rejected',
          message: isApprove
            ? 'The doctor can now continue using the Veda workspace.'
            : 'The doctor access request has been rejected successfully.',
          primaryText: 'Done',
        });
      } catch (error) {
        showVedaAlert({
          type: 'error',
          title:
            'Access request failed',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Unable to process access request.',
          primaryText: 'Close',
        });
      } finally {
        stopAction();
      }
    };

  /* ================================================================
     PAYMENT PROOF
  ================================================================= */

  const viewPaymentProof =
    async (request) => {
      if (!request?._id) {
        return;
      }

      try {
        setPaymentProofLoading(
          true
        );

        const response =
          await api.get(
            `/admin/access-requests/${request._id}/payment-proof`
          );

        const proof =
          response?.data?.data;

        if (!proof?.data) {
          throw new Error(
            'Payment screenshot is unavailable.'
          );
        }

        setPaymentProofPreview({
          uri: `data:${proof.contentType};base64,${proof.data}`,
          fileName:
            proof.fileName ||
            'Payment screenshot',
          doctorName:
            request.doctorId
              ?.name ||
            'Doctor',
        });
      } catch (error) {
        showVedaAlert({
          type: 'error',
          title:
            'Unable to open screenshot',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Please try again.',
          primaryText: 'Close',
        });
      } finally {
        setPaymentProofLoading(
          false
        );
      }
    };

  const viewPaymentHistoryProof =
    async (
      doctorItem,
      record
    ) => {
      if (
        !doctorItem?._id ||
        !record?._id
      ) {
        return;
      }

      try {
        setPaymentProofLoading(
          true
        );

        const response =
          await api.get(
            `/admin/doctors/${doctorItem._id}/payments/${record._id}/proof`
          );

        const proof =
          response?.data?.data;

        if (!proof?.data) {
          throw new Error(
            'Payment screenshot is unavailable.'
          );
        }

        setPaymentProofPreview({
          uri: `data:${proof.contentType};base64,${proof.data}`,
          fileName:
            proof.fileName ||
            'Payment screenshot',
          doctorName:
            doctorItem.name ||
            'Doctor',
        });
      } catch (error) {
        showVedaAlert({
          type: 'error',
          title:
            'Unable to open screenshot',
          message:
            error.response?.data
              ?.message ||
            error.message ||
            'Unable to open screenshot.',
          primaryText: 'Close',
        });
      } finally {
        setPaymentProofLoading(
          false
        );
      }
    };

  /* ================================================================
     DELETE NOTIFICATION
  ================================================================= */

  const deleteNotification = (
    notification
  ) => {
    if (!notification?._id) {
      return;
    }

    const confirmDelete =
      async () => {
        try {
          await api.delete(
            `/admin/notifications/${notification._id}`
          );

          setNotifications(
            (current) =>
              current.filter(
                (item) =>
                  item._id !==
                  notification._id
              )
          );

          showVedaAlert({
            type: 'success',
            title:
              'Notification deleted',
            message:
              'The notification has been removed from the admin dashboard.',
            primaryText: 'Done',
          });
        } catch (error) {
          showVedaAlert({
            type: 'error',
            title: 'Delete failed',
            message:
              error.response?.data
                ?.message ||
              error.message ||
              'Unable to delete notification.',
            primaryText: 'Close',
          });
        }
      };

    showVedaAlert({
      type: 'danger',
      title:
        'Delete notification?',
      message:
        'This notification will be permanently removed from the admin dashboard.',
      primaryText: 'Delete',
      secondaryText: 'Cancel',
      onPrimary:
        confirmDelete,
    });
  };

  /* ================================================================
     DELETE DOCTOR
  ================================================================= */

  const openDeleteConfirmation =
    (doctorItem) => {
      if (actionLoading) {
        return;
      }

      setDeleteError('');

      setDeleteDoctorId(
        doctorItem._id
      );

      showVedaAlert({
        type: 'danger',
        title: 'Delete doctor?',
        message: `${doctorItem.name || 'This doctor'} and related account records will be permanently removed. This action cannot be undone.`,
        primaryText: 'Delete doctor',
        secondaryText: 'Cancel',
        onPrimary: () =>
          deleteDoctor(
            doctorItem
          ),
      });
    };

  const cancelDelete = () => {
    if (deletingDoctorId) {
      return;
    }

    setDeleteDoctorId(null);
    setDeleteError('');
  };

  const deleteDoctor =
    async (doctorItem) => {
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
          'Permanently removing the doctor and related records.'
        );

        await api.delete(
          `/admin/doctors/${doctorItem._id}`
        );

        setDeleteDoctorId(null);

        setDoctors(
          (currentDoctors) =>
            currentDoctors.filter(
              (item) =>
                item._id !==
                doctorItem._id
            )
        );

        startAction(
          'Doctor deleted...',
          'Refreshing the admin dashboard.'
        );

        await load();

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              450
            )
        );

        showVedaAlert({
          type: 'success',
          title: 'Doctor deleted',
          message: `${doctorItem.name || 'The doctor'} and the related records have been permanently removed.`,
          primaryText: 'Done',
        });
      } catch (error) {
        const message =
          error.response?.data
            ?.message ||
          error.message ||
          'Unable to delete doctor.';

        setDeleteError(
          message
        );

        showVedaAlert({
          type: 'error',
          title:
            'Unable to delete doctor',
          message,
          primaryText: 'Close',
        });
      } finally {
        setDeletingDoctorId(
          null
        );

        stopAction();
      }
    };

  /* ================================================================
     OPEN DOCTOR DASHBOARD
  ================================================================= */

  const openDoctorDashboard =
    (doctorItem) => {
      if (
        actionLoading ||
        !doctorItem?._id
      ) {
        return;
      }

      navigation.navigate(
        'AdminDoctorDashboard',
        {
          doctor:
            doctorItem,
        }
      );
    };

  const adminName =
    doctor?.name
      ?.split(' ')[0] ||
    'Admin';

  /* ================================================================
     COUNTERS
  ================================================================= */

  const pendingPaymentDoctors =
    displayDoctors.filter(
      (item) =>
        isPaymentDue(item)
    );

  const pendingAccessRequests =
    accessRequests.filter(
      (item) =>
        !item.status ||
        item.status ===
          'pending'
    );

  const activeDoctors =
    displayDoctors.filter(
      getAccessActive
    );

  const accessRequestDoctorIds =
    new Set(
      pendingAccessRequests.map(
        (request) => {
          const requestDoctor =
            request.doctorId;

          return String(
            requestDoctor?._id ||
              requestDoctor ||
              ''
          );
        }
      )
    );

  const doctorGroups = {
    all: displayDoctors,

    active:
      activeDoctors,

    paymentsDue:
      pendingPaymentDoctors,

    accessRequests:
      displayDoctors.filter(
        (item) =>
          accessRequestDoctorIds.has(
            String(item._id)
          )
      ),
  };

  const doctorGroupLabels = {
    all: 'Registered doctors',
    active: 'Doctors with access',
    paymentsDue: 'Payments due',
    accessRequests:
      'Doctors requesting access',
  };

  const selectedGroupDoctors =
    selectedDoctorGroup
      ? doctorGroups[
          selectedDoctorGroup
        ] || []
      : [];

  /* ================================================================
     DASHBOARD
  ================================================================= */

  return (
    <Screen scroll>
      <FadeIn>

        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerText
            }
          >
            <View
              style={
                styles.adminLabel
              }
            >
              <View
                style={
                  styles.adminDot
                }
              />

              <Text
                style={
                  styles.adminLabelText
                }
              >
                VEDA ADMIN
              </Text>
            </View>

            <Text
              style={
                styles.title
              }
            >
              Dashboard
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Welcome back, {adminName}.
              Manage your healthcare
              network from one place.
            </Text>
          </View>

          <View
            style={
              styles.avatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {adminName
                ?.charAt(0)
                ?.toUpperCase() ||
                'A'}
            </Text>
          </View>
        </View>

        {loading ? (
          <Loading
            text="Loading admin dashboard..."
          />
        ) : (
          <>

            {/* =====================================================
                NOTIFICATIONS
            ===================================================== */}

            {(notifications.length > 0 ||
              pendingPaymentDoctors.length > 0 ||
              pendingAccessRequests.length > 0) && (
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
                      ATTENTION
                    </Text>

                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Notifications
                    </Text>
                  </View>

                  <View
                    style={
                      styles.alertBadge
                    }
                  >
                    <Text
                      style={
                        styles.alertBadgeText
                      }
                    >
                      {
                        notifications.length +
                        pendingPaymentDoctors.length +
                        pendingAccessRequests.length
                      }
                    </Text>
                  </View>
                </View>

                <Card>
                  {pendingPaymentDoctors
                    .slice(0, 5)
                    .map(
                      (item) => {
                        const paymentEndDate =
                          getPaymentEndDate(
                            item
                          );

                        return (
                          <NotificationRow
                            key={`payment-${item._id}`}
                            type="payment"
                            title="Payment due"
                            text={
                              paymentEndDate
                                ? `${item.name || 'Doctor'} payment was valid till ${formatDate(paymentEndDate)} and is now due.`
                                : `${item.name || 'Doctor'} has a payment due.`
                            }
                          />
                        );
                      }
                    )}

                  {pendingAccessRequests
                    .slice(0, 5)
                    .map(
                      (item) => (
                        <NotificationRow
                          key={`access-${item._id}`}
                          type="access"
                          title="Doctor access requested"
                          text={`${item.name || item.email || 'Doctor'} is requesting access.`}
                        />
                      )
                    )}

                  {notifications
                    .slice(0, 5)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <NotificationRow
                          key={
                            item._id ||
                            `notification-${index}`
                          }
                          type={
                            item.type?.startsWith(
                              'payment_'
                            )
                              ? 'payment'
                              : item.type ===
                                  'access_request'
                                ? 'access'
                                : 'info'
                          }
                          title={
                            item.title ||
                            item.message ||
                            'Veda notification'
                          }
                          text={
                            item.message ||
                            item.description ||
                            'New administrator notification.'
                          }
                          createdAt={
                            item.createdAt
                          }
                          onDelete={() =>
                            deleteNotification(
                              item
                            )
                          }
                        />
                      )
                    )}
                </Card>
              </>
            )}

            {/* =====================================================
                OVERVIEW
            ===================================================== */}

            <View
              style={
                styles.sectionTop
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  OVERVIEW
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Practice overview
                </Text>
              </View>
            </View>

            {/* =====================================================
                KPI
            ===================================================== */}

            <View
              style={
                styles.kpiGrid
              }
            >
              <KpiCard
                number={
                  overview?.totalDoctors ||
                  doctors.length ||
                  0
                }
                label="Total doctors"
                smallLabel="REGISTERED"
                type="blue"
                onPress={() =>
                  setSelectedDoctorGroup(
                    'all'
                  )
                }
              />

              <KpiCard
                number={
                  overview?.activeDoctors ??
                  displayDoctors.filter(
                    (item) =>
                      getAccessActive(
                        item
                      )
                  ).length
                }
                label="Active doctors"
                smallLabel="WITH ACCESS"
                type="green"
                onPress={() =>
                  setSelectedDoctorGroup(
                    'active'
                  )
                }
              />

              <KpiCard
                number={
                  pendingPaymentDoctors.length
                }
                label="Payment due"
                smallLabel="AWAITING PAYMENT"
                type="orange"
                onPress={() =>
                  setSelectedDoctorGroup(
                    'paymentsDue'
                  )
                }
              />

              <KpiCard
                number={
                  pendingAccessRequests.length
                }
                label="Access requests"
                smallLabel="REQUIRES REVIEW"
                type="purple"
                onPress={() =>
                  setSelectedDoctorGroup(
                    'accessRequests'
                  )
                }
              />
            </View>

            {selectedDoctorGroup ? (
              <View
                style={
                  styles.doctorTargetList
                }
              >
                <View
                  style={
                    styles.doctorTargetHeader
                  }
                >
                  <Text
                    style={
                      styles.doctorTargetTitle
                    }
                  >
                    {
                      doctorGroupLabels[
                        selectedDoctorGroup
                      ]
                    }
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close doctor list"
                    onPress={() =>
                      setSelectedDoctorGroup(
                        null
                      )
                    }
                  >
                    <Text
                      style={
                        styles.doctorTargetClose
                      }
                    >
                      ×
                    </Text>
                  </Pressable>
                </View>

                {selectedGroupDoctors.length ? (
                  selectedGroupDoctors.map(
                    (item) => (
                      <Pressable
                        key={
                          item._id
                        }
                        accessibilityRole="button"
                        onPress={() =>
                          openDoctorDashboard(
                            item
                          )
                        }
                        style={
                          styles.doctorTargetRow
                        }
                      >
                        <View
                          style={
                            styles.doctorTargetIdentity
                          }
                        >
                          <Text
                            style={
                              styles.doctorTargetName
                            }
                          >
                            {
                              item.name ||
                              'Doctor'
                            }
                          </Text>

                          <Text
                            style={
                              styles.doctorTargetEmail
                            }
                          >
                            {
                              item.email ||
                              ''
                            }
                          </Text>

                          {item.effectivePaymentEndDate ? (
                            <Text
                              style={
                                styles.doctorTargetEmail
                              }
                            >
                              {item.effectivePaymentStatus ===
                              'paid'
                                ? `Paid till ${formatDate(item.effectivePaymentEndDate)}`
                                : item.effectivePaymentStatus ===
                                    'expired'
                                  ? `Expired on ${formatDate(item.effectivePaymentEndDate)}`
                                  : ''}
                            </Text>
                          ) : null}
                        </View>

                        <Text
                          style={
                            styles.doctorTargetArrow
                          }
                        >
                          ›
                        </Text>
                      </Pressable>
                    )
                  )
                ) : (
                  <Text
                    style={
                      styles.doctorTargetEmpty
                    }
                  >
                    No doctors in this group.
                  </Text>
                )}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate(
                  'AdminRevenue'
                )
              }
              style={
                styles.revenueLink
              }
            >
              <View
                style={
                  styles.revenueLinkText
                }
              >
                <Text
                  style={
                    styles.revenueLinkTitle
                  }
                >
                  Revenue dashboard
                </Text>

                <Text
                  style={
                    styles.revenueLinkSubtitle
                  }
                >
                  Monthly totals and payment records
                </Text>
              </View>

              <Text
                style={
                  styles.revenueLinkArrow
                }
              >
                ›
              </Text>
            </Pressable>

            {/* =====================================================
                REGISTRATION APPROVALS
            ===================================================== */}

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
                  ACTION REQUIRED
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Doctor approvals
                </Text>
              </View>

              <View
                style={
                  styles.numberBadge
                }
              >
                <Text
                  style={
                    styles.numberBadgeText
                  }
                >
                  {requests.length}
                </Text>
              </View>
            </View>

            <Card>
              {requests.length === 0 ? (
                <EmptyState
                  title="No pending approvals"
                  text="All doctor registration requests have been reviewed."
                  success
                />
              ) : (
                requests.map(
                  (
                    request,
                    index
                  ) => (
                    <RequestCard
                      key={
                        request._id
                      }
                      request={
                        request
                      }
                      index={
                        index
                      }
                      total={
                        requests.length
                      }
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

            {/* =====================================================
                DOCTOR DIRECTORY
            ===================================================== */}

            <View
              style={[
                styles.sectionHeader,
                styles.doctorSectionHeader,
              ]}
            >
              <View>
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  MANAGEMENT
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Doctor directory
                </Text>
              </View>

              <Text
                style={
                  styles.doctorCount
                }
              >
                {doctors.length} doctors
              </Text>
            </View>

            <Card>
              {displayDoctors.length === 0 ? (
                <EmptyState
                  title="No doctors registered"
                  text="Approved doctors will appear here."
                />
              ) : (
                displayDoctors.map(
                  (doctorItem) => (
                    <DoctorDirectoryRow
                      key={
                        doctorItem._id
                      }
                      doctor={
                        doctorItem
                      }
                      onPress={() =>
                        openDoctorDashboard(
                          doctorItem
                        )
                      }
                    />
                  )
                )
              )}
            </Card>

            {/* =====================================================
                ADMIN INFO
            ===================================================== */}

            <View
              style={
                styles.adminInfo
              }
            >
              <View
                style={
                  styles.infoIcon
                }
              >
                <Text
                  style={
                    styles.infoIconText
                  }
                >
                  i
                </Text>
              </View>

              <View
                style={
                  styles.infoContent
                }
              >
                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  Administrator workspace
                </Text>

                <Text
                  style={
                    styles.infoText
                  }
                >
                  Payment verification and access
                  control are separate. Removing
                  access does not delete the doctor's
                  account or clinical records.
                </Text>
              </View>
            </View>

          </>
        )}

        {/* SIGN OUT */}

        <View
          style={
            styles.signOut
          }
        >
          <Button
            title="Sign out"
            secondary
            onPress={
              logout
            }
          />
        </View>

      </FadeIn>

      {/* ==========================================================
          PAYMENT PROOF MODAL
      ========================================================== */}

      <Modal
        visible={
          paymentProofLoading ||
          Boolean(
            paymentProofPreview
          )
        }
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPaymentProofPreview(
            null
          );

          setPaymentProofLoading(
            false
          );
        }}
      >
        <View
          style={
            styles.proofOverlay
          }
        >
          <View
            style={
              styles.proofModal
            }
          >
            <View
              style={
                styles.proofHeader
              }
            >
              <View
                style={
                  styles.proofHeaderText
                }
              >
                <Text
                  style={
                    styles.proofEyebrow
                  }
                >
                  PAYMENT REVIEW
                </Text>

                <Text
                  style={
                    styles.proofTitle
                  }
                >
                  {
                    paymentProofPreview
                      ?.doctorName ||
                    'Loading screenshot'
                  }
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close payment screenshot"
                onPress={() =>
                  setPaymentProofPreview(
                    null
                  )
                }
                style={
                  styles.proofClose
                }
              >
                <Text
                  style={
                    styles.proofCloseText
                  }
                >
                  ×
                </Text>
              </Pressable>
            </View>

            {paymentProofPreview ? (
              <Image
                source={{
                  uri:
                    paymentProofPreview.uri,
                }}
                resizeMode="contain"
                style={
                  styles.proofImage
                }
              />
            ) : (
              <Loading
                text="Loading payment screenshot..."
              />
            )}

            {paymentProofPreview?.fileName ? (
              <Text
                numberOfLines={1}
                style={
                  styles.proofFileName
                }
              >
                {
                  paymentProofPreview.fileName
                }
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ==========================================================
          PAYMENT ENTRY
      ========================================================== */}

      <PaymentEntryModal
        visible={Boolean(
          paymentEntryDoctor
        )}
        doctor={
          paymentEntryDoctor
        }
        mode={
          paymentMode
        }
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
          setPaymentProof(
            null
          )
        }
        onCancel={() =>
          setPaymentEntryDoctor(
            null
          )
        }
        onSubmit={
          submitPaymentPaid
        }
        onMarkUnpaid={
          submitPaymentUnpaid
        }
      />

      {/* ==========================================================
          PAYMENT HISTORY
      ========================================================== */}

      <PaymentHistoryModal
        doctor={
          paymentHistoryDoctor
        }
        onClose={() =>
          setPaymentHistoryDoctor(
            null
          )
        }
        onViewProof={(
          record
        ) =>
          viewPaymentHistoryProof(
            paymentHistoryDoctor,
            record
          )
        }
      />

      {/* ==========================================================
          VEDA PREMIUM ALERT
      ========================================================== */}

      <VedaAlertModal
        visible={
          vedaAlert.visible
        }
        type={
          vedaAlert.type
        }
        title={
          vedaAlert.title
        }
        message={
          vedaAlert.message
        }
        primaryText={
          vedaAlert.primaryText
        }
        secondaryText={
          vedaAlert.secondaryText
        }
        onPrimary={
          vedaAlert.onPrimary
        }
        onSecondary={
          vedaAlert.onSecondary
        }
        onClose={
          closeVedaAlert
        }
      />

    </Screen>
  );
}