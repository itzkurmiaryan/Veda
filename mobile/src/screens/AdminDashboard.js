import React, {
  useCallback,
  useEffect,
  useMemo,
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
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
  NotificationRow,
  PaymentEntryModal,
  PaymentHistoryModal,
  RequestCard,
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

  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [overview, setOverview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);

  const [selectedDoctorGroup, setSelectedDoctorGroup] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [deleteDoctorId, setDeleteDoctorId] =
    useState(null);

  const [deletingDoctorId, setDeletingDoctorId] =
    useState(null);

  const [deleteError, setDeleteError] =
    useState('');

  const [paymentProofPreview, setPaymentProofPreview] =
    useState(null);

  const [paymentProofLoading, setPaymentProofLoading] =
    useState(false);

  const [paymentEntryDoctor, setPaymentEntryDoctor] =
    useState(null);

  const [paymentHistoryDoctor, setPaymentHistoryDoctor] =
    useState(null);

  const [paymentAmount, setPaymentAmount] =
    useState('');

  const [paymentMode, setPaymentMode] =
    useState(null);

  const [paymentNote, setPaymentNote] =
    useState('');

  const [paymentTransactionId, setPaymentTransactionId] =
    useState('');

  const [paymentMonthsPaid, setPaymentMonthsPaid] =
    useState('1');

  const [paymentProof, setPaymentProof] =
    useState(null);

  /* ================================================================
     CUSTOM NOTIFICATION STATE
  ================================================================= */

  const [
    notificationComposerVisible,
    setNotificationComposerVisible,
  ] = useState(false);

  const [
    notificationTitle,
    setNotificationTitle,
  ] = useState('');

  const [
    notificationMessage,
    setNotificationMessage,
  ] = useState('');

  const [
    notificationPhoto,
    setNotificationPhoto,
  ] = useState(null);

  const [
    notificationRecipientMode,
    setNotificationRecipientMode,
  ] = useState('all');

  const [
    selectedNotificationDoctors,
    setSelectedNotificationDoctors,
  ] = useState([]);

  const [
    notificationSending,
    setNotificationSending,
  ] = useState(false);

  const [
    notificationDoctorSearch,
    setNotificationDoctorSearch,
  ] = useState('');

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
     PAYMENT HELPERS
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

  const formatDate = (
    value
  ) => {
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
     LOAD DASHBOARD
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

      const refresh = async () => {
        try {
          const [
            notificationsResponse,
            accessResponse,
          ] = await Promise.all([
            api.get(
              '/admin/notifications'
            ),
            api.get(
              '/admin/access-requests'
            ),
          ]);

          if (!mounted) {
            return;
          }

          const notificationData =
            notificationsResponse
              ?.data?.data;

          const accessData =
            accessResponse
              ?.data?.data;

          setNotifications(
            Array.isArray(
              notificationData
            )
              ? notificationData
              : []
          );

          setAccessRequests(
            Array.isArray(
              accessData
            )
              ? accessData
              : []
          );
        } catch (error) {
          if (mounted) {
            console.error(
              'ADMIN REFRESH ERROR:',
              error?.response
                ?.data ||
                error?.message ||
                error
            );
          }
        }
      };

      refresh();

      const interval =
        setInterval(
          refresh,
          30 * 1000
        );

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [])
  );

  /* ================================================================
     CUSTOM NOTIFICATION HELPERS
  ================================================================= */

  const filteredNotificationDoctors =
    useMemo(() => {
      const query =
        notificationDoctorSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return displayDoctors;
      }

      return displayDoctors.filter(
        (item) =>
          item.name
            ?.toLowerCase()
            .includes(query) ||
          item.email
            ?.toLowerCase()
            .includes(query)
      );
    }, [
      displayDoctors,
      notificationDoctorSearch,
    ]);

  const selectedDoctorsCount =
    selectedNotificationDoctors.length;

  const notificationRecipientText =
    notificationRecipientMode === 'all'
      ? `All ${displayDoctors.length} doctors`
      : notificationRecipientMode ===
          'single'
        ? selectedDoctorsCount === 1
          ? displayDoctors.find(
              (item) =>
                String(item._id) ===
                String(
                  selectedNotificationDoctors[0]
                )
            )?.name ||
            'Select doctor'
          : 'Select one doctor'
        : `${selectedDoctorsCount} doctor(s) selected`;

  const resetNotificationComposer =
    () => {
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationPhoto(null);
      setNotificationRecipientMode(
        'all'
      );
      setSelectedNotificationDoctors(
        []
      );
      setNotificationDoctorSearch('');
    };

  const closeNotificationComposer =
    () => {
      if (notificationSending) {
        return;
      }

      setNotificationComposerVisible(
        false
      );

      resetNotificationComposer();
    };

  const toggleNotificationDoctor =
    (doctorId) => {
      const id = String(
        doctorId
      );

      if (
        notificationRecipientMode ===
        'single'
      ) {
        setSelectedNotificationDoctors(
          [id]
        );

        return;
      }

      setSelectedNotificationDoctors(
        (current) => {
          const exists =
            current.some(
              (item) =>
                String(item) === id
            );

          if (exists) {
            return current.filter(
              (item) =>
                String(item) !== id
            );
          }

          return [
            ...current,
            id,
          ];
        }
      );
    };

  const selectAllNotificationDoctors =
    () => {
      setSelectedNotificationDoctors(
        displayDoctors.map(
          (item) =>
            String(item._id)
        )
      );
    };

  const clearNotificationDoctors =
    () => {
      setSelectedNotificationDoctors(
        []
      );
    };

  const chooseNotificationPhoto =
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
              'Allow photo access to attach a photo to the notification.',
            primaryText: 'Okay',
          });

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.5,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const image =
          result.assets?.[0];

        if (!image?.uri) {
          throw new Error(
            'Please select a valid image.'
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
              compress: 0.45,
              format:
                ImageManipulator
                  .SaveFormat
                  .JPEG,
              base64: true,
            }
          );

        if (
          !compressed.base64
        ) {
          throw new Error(
            'Unable to process the selected image.'
          );
        }

        if (
          compressed.base64.length >
          1400000
        ) {
          throw new Error(
            'Image is too large. Please choose a smaller image.'
          );
        }

        setNotificationPhoto({
          data:
            compressed.base64,
          contentType:
            'image/jpeg',
          fileName:
            image.fileName ||
            'notification.jpg',
          uri:
            compressed.uri ||
            image.uri,
        });
      } catch (error) {
        showVedaAlert({
          type: 'error',
          title:
            'Unable to attach image',
          message:
            error.message ||
            'Unable to select the notification image.',
          primaryText: 'Close',
        });
      }
    };

const sendCustomNotification = async () => {
  if (notificationSending) {
    return;
  }

  const title = notificationTitle.trim();
  const message = notificationMessage.trim();

  if (!title) {
    showVedaAlert({
      type: 'warning',
      title: 'Notification title required',
      message: 'Please enter a title for the notification.',
      primaryText: 'Okay',
    });

    return;
  }

  if (!message) {
    showVedaAlert({
      type: 'warning',
      title: 'Notification message required',
      message: 'Please enter a message for the doctors.',
      primaryText: 'Okay',
    });

    return;
  }

  if (displayDoctors.length === 0) {
    showVedaAlert({
      type: 'warning',
      title: 'No doctors available',
      message:
        'There are no registered doctors available to receive this notification.',
      primaryText: 'Okay',
    });

    return;
  }

  if (
    notificationRecipientMode !== 'all' &&
    selectedNotificationDoctors.length === 0
  ) {
    showVedaAlert({
      type: 'warning',
      title: 'Select recipient',
      message:
        'Please select at least one doctor before sending the notification.',
      primaryText: 'Okay',
    });

    return;
  }

  if (
    notificationRecipientMode === 'single' &&
    selectedNotificationDoctors.length !== 1
  ) {
    showVedaAlert({
      type: 'warning',
      title: 'Select one doctor',
      message:
        'Single doctor mode requires exactly one doctor.',
      primaryText: 'Okay',
    });

    return;
  }

  try {
    setNotificationSending(true);

    startAction(
      'Sending notification...',
      'Delivering the notification securely to the selected doctors.'
    );

    const isAllDoctors =
      notificationRecipientMode === 'all';

    const payload = {
      title,
      message,

      // Backend compatibility
      sendToAll: isAllDoctors,

      // Keep this for frontend/reference compatibility
      recipientMode: notificationRecipientMode,

      // Only send IDs when not sending to everyone
      doctorIds: isAllDoctors
        ? []
        : selectedNotificationDoctors,

      photo: notificationPhoto
        ? {
            data: notificationPhoto.data,
            contentType: notificationPhoto.contentType,
            fileName: notificationPhoto.fileName,
          }
        : null,
    };

    console.log('📢 SENDING CUSTOM NOTIFICATION');
    console.log('RECIPIENT MODE:', notificationRecipientMode);
    console.log('SEND TO ALL:', isAllDoctors);
    console.log(
      'DOCTOR IDS:',
      payload.doctorIds
    );

    const response = await api.post(
      '/admin/notifications/send',
      payload
    );

    console.log(
      '✅ CUSTOM NOTIFICATION RESPONSE:',
      response?.data
    );

    const sentCount =
      response?.data?.sentCount ??
      response?.data?.data?.length ??
      0;

    setNotificationComposerVisible(false);

    resetNotificationComposer();

    await load();

    showVedaAlert({
      type: 'success',
      title: 'Notification sent',
      message:
        sentCount > 0
          ? `Notification successfully sent to ${sentCount} doctor${
              sentCount === 1 ? '' : 's'
            }.`
          : 'The notification has been sent successfully.',
      primaryText: 'Done',
    });
  } catch (error) {
    console.error(
      'CUSTOM NOTIFICATION ERROR:',
      error?.response?.data || error
    );

    showVedaAlert({
      type: 'error',
      title: 'Notification failed',
      message:
        error.response?.data?.message ||
        error.message ||
        'Unable to send notification.',
      primaryText: 'Close',
    });
  } finally {
    setNotificationSending(false);
    stopAction();
  }
};
  /* ================================================================
     REGISTRATION APPROVAL
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
     ACCESS
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
        title:
          'Access update failed',
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
    async (
      doctorItem
    ) => {
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
                  paymentReminderRequested:
                    true,
                  paymentReminderAt:
                    updatedDoctor?.paymentReminderAt ||
                    new Date().toISOString(),
                };
              }
            )
        );

        await load();

        showVedaAlert({
          type: 'success',
          title:
            'Payment reminder sent',
          message: `${doctorItem.name || 'Doctor'} has been notified that a payment is due.`,
          primaryText: 'Done',
        });
      } catch (error) {
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
     PAYMENT HELPERS
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
              'Allow photo access to attach a payment screenshot.',
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

        if (
          result.canceled
        ) {
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
     PAYMENT PAID
  ================================================================= */

  const submitPaymentPaid =
    async () => {
      const doctorItem =
        paymentEntryDoctor;

      const amount =
        Number(
          paymentAmount
        );

      const monthsPaid =
        Number(
          paymentMonthsPaid
        );

      if (
        !doctorItem?._id ||
        !Number.isFinite(
          amount
        ) ||
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
          title:
            'Payment recorded',
          message: `${doctorItem.name || 'Doctor'}'s payment of ₹${amount.toLocaleString('en-IN')} for ${monthsPaid} month(s) has been recorded and verified successfully.`,
          primaryText: 'Done',
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
          title:
            'Payment remains unpaid',
          message: `${doctorItem.name || 'Doctor'} remains marked as unpaid.`,
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
     ACCESS REQUEST
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
    async (
      request
    ) => {
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

  const deleteNotification =
    (
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
              title:
                'Delete failed',
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
    (
      doctorItem
    ) => {
      if (actionLoading) {
        return;
      }

      setDeleteError('');

      setDeleteDoctorId(
        doctorItem._id
      );

      showVedaAlert({
        type: 'danger',
        title:
          'Delete doctor?',
        message: `${doctorItem.name || 'This doctor'} and related account records will be permanently removed. This action cannot be undone.`,
        primaryText:
          'Delete doctor',
        secondaryText:
          'Cancel',
        onPrimary: () =>
          deleteDoctor(
            doctorItem
          ),
      });
    };

  const deleteDoctor =
    async (
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
          'Permanently removing the doctor and related records.'
        );

        await api.delete(
          `/admin/doctors/${doctorItem._id}`
        );

        setDeleteDoctorId(
          null
        );

        setDoctors(
          (currentDoctors) =>
            currentDoctors.filter(
              (item) =>
                item._id !==
                doctorItem._id
            )
        );

        await load();

        showVedaAlert({
          type: 'success',
          title:
            'Doctor deleted',
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
     OPEN DOCTOR
  ================================================================= */

  const openDoctorDashboard =
    (
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
    all:
      displayDoctors,

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
    all:
      'Registered doctors',

    active:
      'Doctors with access',

    paymentsDue:
      'Payments due',

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
                NOTIFICATION CENTER
            ===================================================== */}

            <View
              style={{
                marginTop: 18,
                marginBottom: 18,
              }}
            >
              <View
                style={{
                  flexDirection:
                    'row',
                  alignItems:
                    'center',
                  justifyContent:
                    'space-between',
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text
                    style={
                      styles.sectionEyebrow
                    }
                  >
                    COMMUNICATION
                  </Text>

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Notification center
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setNotificationComposerVisible(
                      true
                    )
                  }
                  style={{
                    minHeight: 44,
                    paddingHorizontal:
                      16,
                    borderRadius: 14,
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    backgroundColor:
                      '#111827',
                  }}
                >
                  <Text
                    style={{
                      color:
                        '#ffffff',
                      fontSize: 13,
                      fontWeight:
                        '800',
                    }}
                  >
                    + Send notification
                  </Text>
                </Pressable>
              </View>

              {notifications.length >
              0 ? (
                <Card>
                  {notifications
                    .slice(0, 8)
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
              ) : (
                <Card>
                  <View
                    style={{
                      paddingVertical:
                        20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight:
                          '800',
                        color:
                          '#111827',
                      }}
                    >
                      No custom notifications
                    </Text>

                    <Text
                      style={{
                        marginTop: 5,
                        color:
                          '#6b7280',
                        fontSize: 13,
                        lineHeight:
                          19,
                      }}
                    >
                      Send announcements,
                      instructions,
                      updates or
                      important information
                      directly to doctors.
                    </Text>
                  </View>
                </Card>
              )}
            </View>

            {/* =====================================================
                ATTENTION
            ===================================================== */}

            {(pendingPaymentDoctors.length >
              0 ||
              pendingAccessRequests.length >
                0) && (
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
                      Action alerts
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

            {/* KPI */}

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
                  activeDoctors.length
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

            {/* GROUP LIST */}

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

            {/* REVENUE */}

            <Pressable
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
                  (
                    doctorItem
                  ) => (
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

            {/* ADMIN INFO */}

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
          CUSTOM NOTIFICATION COMPOSER
      ========================================================== */}

      <Modal
        visible={
          notificationComposerVisible
        }
        transparent
        animationType="slide"
        onRequestClose={
          closeNotificationComposer
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor:
              'rgba(3, 7, 18, 0.72)',
            justifyContent:
              'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor:
                '#ffffff',
              borderTopLeftRadius:
                28,
              borderTopRightRadius:
                28,
              maxHeight:
                '94%',
              overflow:
                'hidden',
            }}
          >
            <View
              style={{
                paddingHorizontal:
                  20,
                paddingTop: 18,
                paddingBottom: 12,
                borderBottomWidth:
                  1,
                borderBottomColor:
                  '#eef0f4',
                flexDirection:
                  'row',
                alignItems:
                  'center',
                justifyContent:
                  'space-between',
              }}
            >
              <View
                style={{
                  flex: 1,
                  paddingRight:
                    12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight:
                      '900',
                    letterSpacing:
                      1.3,
                    color:
                      '#7c3aed',
                  }}
                >
                  VEDA COMMUNICATION
                </Text>

                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 23,
                    fontWeight:
                      '900',
                    color:
                      '#111827',
                  }}
                >
                  Send notification
                </Text>

                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    lineHeight:
                      19,
                    color:
                      '#6b7280',
                  }}
                >
                  Send an announcement directly
                  to selected doctors.
                </Text>
              </View>

              <Pressable
                onPress={
                  closeNotificationComposer
                }
                disabled={
                  notificationSending
                }
                style={{
                  width: 42,
                  height: 42,
                  borderRadius:
                    21,
                  backgroundColor:
                    '#f3f4f6',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 25,
                    lineHeight:
                      28,
                    color:
                      '#111827',
                  }}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: 20,
                paddingBottom:
                  34,
              }}
              showsVerticalScrollIndicator={
                false
              }
            >

              {/* TITLE */}

              <Text
                style={{
                  fontSize: 12,
                  fontWeight:
                    '900',
                  color:
                    '#374151',
                  marginBottom:
                    8,
                }}
              >
                TITLE
              </Text>

              <TextInput
                value={
                  notificationTitle
                }
                onChangeText={
                  setNotificationTitle
                }
                placeholder="e.g. Important Veda update"
                placeholderTextColor="#9ca3af"
                maxLength={120}
                editable={
                  !notificationSending
                }
                style={{
                  minHeight: 52,
                  borderWidth: 1,
                  borderColor:
                    '#e5e7eb',
                  borderRadius:
                    15,
                  paddingHorizontal:
                    15,
                  color:
                    '#111827',
                  fontSize: 15,
                  fontWeight:
                    '600',
                  backgroundColor:
                    '#fafafa',
                }}
              />

              {/* MESSAGE */}

              <Text
                style={{
                  marginTop: 18,
                  fontSize: 12,
                  fontWeight:
                    '900',
                  color:
                    '#374151',
                  marginBottom:
                    8,
                }}
              >
                MESSAGE
              </Text>

              <TextInput
                value={
                  notificationMessage
                }
                onChangeText={
                  setNotificationMessage
                }
                placeholder="Write the notification message..."
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={1000}
                textAlignVertical="top"
                editable={
                  !notificationSending
                }
                style={{
                  minHeight: 125,
                  borderWidth: 1,
                  borderColor:
                    '#e5e7eb',
                  borderRadius:
                    15,
                  paddingHorizontal:
                    15,
                  paddingTop:
                    14,
                  color:
                    '#111827',
                  fontSize: 15,
                  lineHeight:
                    21,
                  backgroundColor:
                    '#fafafa',
                }}
              />

              {/* RECIPIENT MODE */}

              <Text
                style={{
                  marginTop: 18,
                  fontSize: 12,
                  fontWeight:
                    '900',
                  color:
                    '#374151',
                  marginBottom:
                    10,
                }}
              >
                RECIPIENTS
              </Text>

              <View
                style={{
                  flexDirection:
                    'row',
                  gap: 8,
                }}
              >
                {[
                  ['all', 'All doctors'],
                  [
                    'single',
                    'Single doctor',
                  ],
                  [
                    'multiple',
                    'Multiple',
                  ],
                ].map(
                  (item) => {
                    const active =
                      notificationRecipientMode ===
                      item[0];

                    return (
                      <Pressable
                        key={
                          item[0]
                        }
                        onPress={() => {
                          setNotificationRecipientMode(
                            item[0]
                          );

                          if (
                            item[0] ===
                            'all'
                          ) {
                            setSelectedNotificationDoctors(
                              []
                            );
                          }

                          if (
                            item[0] ===
                            'single' &&
                            selectedNotificationDoctors.length >
                              1
                          ) {
                            setSelectedNotificationDoctors(
                              selectedNotificationDoctors.slice(
                                0,
                                1
                              )
                            );
                          }
                        }}
                        disabled={
                          notificationSending
                        }
                        style={{
                          flex: 1,
                          minHeight:
                            48,
                          borderRadius:
                            14,
                          borderWidth:
                            1,
                          borderColor:
                            active
                              ? '#7c3aed'
                              : '#e5e7eb',
                          backgroundColor:
                            active
                              ? '#f3e8ff'
                              : '#ffffff',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          paddingHorizontal:
                            5,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight:
                              '800',
                            color:
                              active
                                ? '#6d28d9'
                                : '#4b5563',
                            textAlign:
                              'center',
                          }}
                        >
                          {
                            item[1]
                          }
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {/* DOCTOR SELECTOR */}

              {notificationRecipientMode !==
              'all' ? (
                <View
                  style={{
                    marginTop:
                      14,
                    borderWidth:
                      1,
                    borderColor:
                      '#e5e7eb',
                    borderRadius:
                      18,
                    overflow:
                      'hidden',
                  }}
                >
                  <View
                    style={{
                      padding:
                        12,
                      backgroundColor:
                        '#fafafa',
                    }}
                  >
                    <TextInput
                      value={
                        notificationDoctorSearch
                      }
                      onChangeText={
                        setNotificationDoctorSearch
                      }
                      placeholder="Search doctor by name or email"
                      placeholderTextColor="#9ca3af"
                      editable={
                        !notificationSending
                      }
                      style={{
                        height:
                          44,
                        borderWidth:
                          1,
                        borderColor:
                          '#e5e7eb',
                        borderRadius:
                          12,
                        paddingHorizontal:
                          13,
                        backgroundColor:
                          '#ffffff',
                        color:
                          '#111827',
                        fontSize:
                          13,
                      }}
                    />

                    {notificationRecipientMode ===
                      'multiple' && (
                      <View
                        style={{
                          flexDirection:
                            'row',
                          justifyContent:
                            'space-between',
                          marginTop:
                            10,
                        }}
                      >
                        <Pressable
                          onPress={
                            selectAllNotificationDoctors
                          }
                        >
                          <Text
                            style={{
                              fontSize:
                                12,
                              fontWeight:
                                '800',
                              color:
                                '#7c3aed',
                            }}
                          >
                            Select all
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={
                            clearNotificationDoctors
                          }
                        >
                          <Text
                            style={{
                              fontSize:
                                12,
                              fontWeight:
                                '800',
                              color:
                                '#6b7280',
                            }}
                          >
                            Clear
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      maxHeight:
                        230,
                    }}
                  >
                    <ScrollView
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredNotificationDoctors.length ===
                      0 ? (
                        <View
                          style={{
                            padding:
                              18,
                          }}
                        >
                          <Text
                            style={{
                              color:
                                '#6b7280',
                              fontSize:
                                13,
                            }}
                          >
                            No doctors found.
                          </Text>
                        </View>
                      ) : (
                        filteredNotificationDoctors.map(
                          (
                            doctorItem
                          ) => {
                            const selected =
                              selectedNotificationDoctors.some(
                                (
                                  id
                                ) =>
                                  String(
                                    id
                                  ) ===
                                  String(
                                    doctorItem._id
                                  )
                              );

                            return (
                              <Pressable
                                key={
                                  doctorItem._id
                                }
                                onPress={() =>
                                  toggleNotificationDoctor(
                                    doctorItem._id
                                  )
                                }
                                disabled={
                                  notificationSending
                                }
                                style={{
                                  minHeight:
                                    64,
                                  paddingHorizontal:
                                    13,
                                  flexDirection:
                                    'row',
                                  alignItems:
                                    'center',
                                  borderBottomWidth:
                                    1,
                                  borderBottomColor:
                                    '#f0f1f3',
                                }}
                              >
                                <View
                                  style={{
                                    width:
                                      38,
                                    height:
                                      38,
                                    borderRadius:
                                      19,
                                    backgroundColor:
                                      selected
                                        ? '#ede9fe'
                                        : '#f3f4f6',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    marginRight:
                                      11,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize:
                                        14,
                                      fontWeight:
                                        '900',
                                      color:
                                        selected
                                          ? '#7c3aed'
                                          : '#4b5563',
                                    }}
                                  >
                                    {doctorItem.name
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      'D'}
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    flex:
                                      1,
                                  }}
                                >
                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={{
                                      fontSize:
                                        13,
                                      fontWeight:
                                        '800',
                                      color:
                                        '#111827',
                                    }}
                                  >
                                    {doctorItem.name ||
                                      'Doctor'}
                                  </Text>

                                  <Text
                                    numberOfLines={
                                      1
                                    }
                                    style={{
                                      marginTop:
                                        2,
                                      fontSize:
                                        11,
                                      color:
                                        '#6b7280',
                                    }}
                                  >
                                    {doctorItem.email ||
                                      ''}
                                  </Text>
                                </View>

                                <View
                                  style={{
                                    width:
                                      24,
                                    height:
                                      24,
                                    borderRadius:
                                      7,
                                    borderWidth:
                                      1.5,
                                    borderColor:
                                      selected
                                        ? '#7c3aed'
                                        : '#d1d5db',
                                    backgroundColor:
                                      selected
                                        ? '#7c3aed'
                                        : '#ffffff',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                  }}
                                >
                                  {selected && (
                                    <Text
                                      style={{
                                        color:
                                          '#ffffff',
                                        fontSize:
                                          15,
                                        fontWeight:
                                          '900',
                                      }}
                                    >
                                      ✓
                                    </Text>
                                  )}
                                </View>
                              </Pressable>
                            );
                          }
                        )
                      )}
                    </ScrollView>
                  </View>
                </View>
              ) : null}

              {/* RECIPIENT SUMMARY */}

              <View
                style={{
                  marginTop:
                    12,
                  padding:
                    13,
                  borderRadius:
                    14,
                  backgroundColor:
                    '#f5f3ff',
                  borderWidth:
                    1,
                  borderColor:
                    '#ede9fe',
                }}
              >
                <Text
                  style={{
                    fontSize:
                      11,
                    fontWeight:
                      '900',
                    color:
                      '#6d28d9',
                  }}
                >
                  RECIPIENT
                </Text>

                <Text
                  style={{
                    marginTop:
                      3,
                    fontSize:
                      13,
                    fontWeight:
                      '700',
                    color:
                      '#312e81',
                  }}
                >
                  {
                    notificationRecipientText
                  }
                </Text>
              </View>

              {/* PHOTO */}

              <Text
                style={{
                  marginTop:
                    18,
                  fontSize:
                    12,
                  fontWeight:
                    '900',
                  color:
                    '#374151',
                  marginBottom:
                    9,
                }}
              >
                ATTACHMENT
              </Text>

              {notificationPhoto ? (
                <View
                  style={{
                    borderRadius:
                      18,
                    borderWidth:
                      1,
                    borderColor:
                      '#e5e7eb',
                    overflow:
                      'hidden',
                  }}
                >
                  <Image
                    source={{
                      uri:
                        notificationPhoto.uri,
                    }}
                    resizeMode="cover"
                    style={{
                      width:
                        '100%',
                      height:
                        170,
                    }}
                  />

                  <View
                    style={{
                      padding:
                        12,
                      flexDirection:
                        'row',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                    }}
                  >
                    <Text
                      numberOfLines={
                        1
                      }
                      style={{
                        flex:
                          1,
                        fontSize:
                          12,
                        color:
                          '#4b5563',
                        fontWeight:
                          '600',
                        marginRight:
                          10,
                      }}
                    >
                      {
                        notificationPhoto.fileName
                      }
                    </Text>

                    <Pressable
                      onPress={() =>
                        setNotificationPhoto(
                          null
                        )
                      }
                    >
                      <Text
                        style={{
                          color:
                            '#dc2626',
                          fontSize:
                            12,
                          fontWeight:
                            '900',
                        }}
                      >
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={
                    chooseNotificationPhoto
                  }
                  disabled={
                    notificationSending
                  }
                  style={{
                    minHeight:
                      92,
                    borderRadius:
                      18,
                    borderWidth:
                      1.5,
                    borderStyle:
                      'dashed',
                    borderColor:
                      '#c4b5fd',
                    backgroundColor:
                      '#faf5ff',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize:
                        24,
                    }}
                  >
                    +
                  </Text>

                  <Text
                    style={{
                      marginTop:
                        3,
                      fontSize:
                        13,
                      fontWeight:
                        '800',
                      color:
                        '#6d28d9',
                    }}
                  >
                    Attach photo
                  </Text>

                  <Text
                    style={{
                      marginTop:
                        3,
                      fontSize:
                        11,
                      color:
                        '#8b5cf6',
                    }}
                  >
                    Optional
                  </Text>
                </Pressable>
              )}

              {/* SEND */}

              <Pressable
                onPress={
                  sendCustomNotification
                }
                disabled={
                  notificationSending
                }
                style={{
                  marginTop:
                    22,
                  minHeight:
                    56,
                  borderRadius:
                    17,
                  backgroundColor:
                    notificationSending
                      ? '#9ca3af'
                      : '#111827',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                }}
              >
                <Text
                  style={{
                    color:
                      '#ffffff',
                    fontSize:
                      14,
                    fontWeight:
                      '900',
                  }}
                >
                  {notificationSending
                    ? 'Sending notification...'
                    : 'Send notification'}
                </Text>
              </Pressable>

              <Pressable
                onPress={
                  closeNotificationComposer
                }
                disabled={
                  notificationSending
                }
                style={{
                  minHeight:
                    48,
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  marginTop:
                    5,
                }}
              >
                <Text
                  style={{
                    color:
                      '#6b7280',
                    fontSize:
                      13,
                    fontWeight:
                      '700',
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==========================================================
          PAYMENT PROOF
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
                  {paymentProofPreview
                    ?.doctorName ||
                    'Loading screenshot'}
                </Text>
              </View>

              <Pressable
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
          VEDA ALERT
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