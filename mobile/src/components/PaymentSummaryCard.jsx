import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  Card,
  colors,
} from './UI';

import {
  api,
} from '../api/api';


/* =====================================================
   HELPERS
===================================================== */

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}


function formatMoney(value) {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString('en-IN')}`;
}


/* =====================================================
   NORMALIZE DOCTOR PAYMENT DATA
===================================================== */

function normalizeDoctor(source, fallback = null) {
  const data = source || {};
  const oldData = fallback || {};

  const paymentHistory = Array.isArray(data.paymentHistory)
    ? data.paymentHistory
    : Array.isArray(oldData.paymentHistory)
      ? oldData.paymentHistory
      : [];

  const sortedHistory = [...paymentHistory].sort(
    (a, b) =>
      new Date(b?.paidAt || 0).getTime() -
      new Date(a?.paidAt || 0).getTime()
  );

  const calculatedTotalPaid = sortedHistory.reduce(
    (total, payment) =>
      total + Number(payment?.amount || 0),
    0
  );

  return {
    ...oldData,
    ...data,

    _id:
      data?._id ||
      oldData?._id ||
      data?.id ||
      oldData?.id,

    id:
      data?.id ||
      oldData?.id ||
      data?._id ||
      oldData?._id,

    paymentStatus:
      data?.paymentStatus ??
      oldData?.paymentStatus ??
      'pending',

    paymentHistory: sortedHistory,

    lastPaymentDate:
      data?.lastPaymentDate ??
      oldData?.lastPaymentDate ??
      sortedHistory[0]?.paidAt ??
      null,

    nextPaymentDate:
      data?.nextPaymentDate ??
      oldData?.nextPaymentDate ??
      sortedHistory[0]?.nextPaymentDate ??
      null,

    pendingPayment:
      data?.pendingPayment ??
      oldData?.pendingPayment ??
      null,

    calculatedTotalPaid,
  };
}


/* =====================================================
   COMPONENT
===================================================== */

export default function PaymentSummaryCard({
  doctor,
  onHistory,
  onPress,
  compact = false,
}) {
  const navigation = useNavigation();


  /* =====================================================
     LOCAL DATA
  ===================================================== */

  const [
    freshDoctor,
    setFreshDoctor,
  ] = useState(
    doctor || null
  );

  const [
    requestingAccess,
    setRequestingAccess,
  ] = useState(false);

  const [
    accessRequestSent,
    setAccessRequestSent,
  ] = useState(false);

  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);


  /* =====================================================
     KEEP PROP DATA IN SYNC
  ===================================================== */

  useEffect(() => {
    if (doctor) {
      setFreshDoctor(
        normalizeDoctor(
          doctor,
          doctor
        )
      );
    }
  }, [doctor]);


  /* =====================================================
     LOAD FRESH DOCTOR
     
     IMPORTANT:
     Admin dashboard -> /admin/doctors/:id
     Doctor dashboard -> fallback /auth/me
  ===================================================== */

  const loadFreshDoctor = useCallback(
    async () => {
      const suppliedDoctor = doctor || null;

      const suppliedDoctorId =
        suppliedDoctor?._id ||
        suppliedDoctor?.id ||
        null;


      /* -------------------------------------------------
         FIRST:
         If we have a doctor ID, try admin doctor endpoint.

         This is the important fix for Admin Doctor Dashboard.
      ------------------------------------------------- */

      if (suppliedDoctorId) {
        try {
          const response = await api.get(
            `/admin/doctors/${suppliedDoctorId}`
          );

          const payload =
            response?.data || {};

          const adminDoctor =
            payload?.data ||
            payload?.doctor ||
            null;

          if (
            adminDoctor &&
            (
              String(
                adminDoctor?._id ||
                adminDoctor?.id ||
                ''
              ) ===
              String(suppliedDoctorId)
            )
          ) {
            const normalized =
              normalizeDoctor(
                adminDoctor,
                suppliedDoctor
              );

            setFreshDoctor(
              normalized
            );

            console.log(
              '💳 PAYMENT CARD ADMIN DOCTOR:',
              {
                doctorId:
                  normalized?._id,
                paymentStatus:
                  normalized?.paymentStatus,
                paymentHistoryCount:
                  normalized?.paymentHistory?.length || 0,
                totalPaid:
                  normalized?.calculatedTotalPaid || 0,
                lastPaymentDate:
                  normalized?.lastPaymentDate,
                nextPaymentDate:
                  normalized?.nextPaymentDate,
                hasPendingPayment:
                  Boolean(
                    normalized?.pendingPayment
                  ),
              }
            );

            return;
          }

        } catch (adminError) {
          /*
           * Expected on normal Doctor Dashboard because
           * /admin/doctors/:id requires admin authentication.
           *
           * We silently fall through to /auth/me.
           */
          console.log(
            'ADMIN DOCTOR PAYMENT FETCH FALLBACK:',
            adminError?.response?.status ||
            adminError?.message ||
            adminError
          );
        }
      }


      /* -------------------------------------------------
         FALLBACK:
         Normal Doctor Dashboard uses /auth/me.
      ------------------------------------------------- */

      try {
        const response =
          await api.get(
            '/auth/me'
          );

        const data =
          response?.data || {};

        const currentDoctor =
          data?.doctor ||
          data?.data?.doctor ||
          data?.user ||
          data?.data ||
          null;


        /*
         * Never replace the selected doctor with an
         * administrator account.
         */
        const looksLikeAdmin =
          String(
            currentDoctor?.role ||
            currentDoctor?.userRole ||
            ''
          ).toLowerCase() === 'admin';


        if (
          currentDoctor &&
          !looksLikeAdmin
        ) {
          const normalized =
            normalizeDoctor(
              currentDoctor,
              suppliedDoctor
            );

          setFreshDoctor(
            normalized
          );

          console.log(
            '💳 PAYMENT CARD DOCTOR:',
            {
              doctorId:
                normalized?._id,
              paymentStatus:
                normalized?.paymentStatus,
              paymentHistoryCount:
                normalized?.paymentHistory?.length || 0,
              totalPaid:
                normalized?.calculatedTotalPaid || 0,
            }
          );
        }

      } catch (error) {
        console.log(
          'PAYMENT CARD REFRESH ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );
      }
    },
    [doctor]
  );


  /* =====================================================
     LOAD NOTIFICATIONS
  ===================================================== */

  const loadNotifications =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              '/auth/notifications'
            );

          const data =
            response?.data || {};

          const list =
            Array.isArray(
              data?.notifications
            )
              ? data.notifications
              : Array.isArray(
                  data?.data
                )
                ? data.data
                : [];

          const unread =
            list.filter(
              item =>
                !item?.read
            ).length;

          setNotificationCount(
            unread
          );

        } catch (error) {
          console.log(
            'PAYMENT CARD NOTIFICATION ERROR:',
            error?.response?.data ||
            error?.message ||
            error
          );
        }
      },
      []
    );


  /* =====================================================
     REFRESH ON FOCUS
  ===================================================== */

  useFocusEffect(
    useCallback(() => {
      loadFreshDoctor();
      loadNotifications();
    }, [
      loadFreshDoctor,
      loadNotifications,
    ])
  );


  /* =====================================================
     USE LATEST DATA
  ===================================================== */

  const currentDoctor =
    freshDoctor ||
    doctor ||
    null;


  /* =====================================================
     PAYMENT HISTORY
     
     IMPORTANT:
     Only paymentHistory represents VERIFIED payments.
     pendingPayment is NOT included here.
  ===================================================== */

  const history =
    useMemo(() => {
      const source =
        Array.isArray(
          currentDoctor?.paymentHistory
        )
          ? currentDoctor.paymentHistory
          : [];

      return [...source].sort(
        (a, b) =>
          new Date(
            b?.paidAt || 0
          ).getTime() -
          new Date(
            a?.paidAt || 0
          ).getTime()
      );
    }, [
      currentDoctor?.paymentHistory,
    ]);


  /* =====================================================
     TOTAL PAID
  ===================================================== */

  const totalPaid =
    useMemo(() => {
      return history.reduce(
        (
          total,
          record
        ) =>
          total +
          Number(
            record?.amount || 0
          ),
        0
      );
    }, [
      history,
    ]);


  /* =====================================================
     PAYMENT COUNT
  ===================================================== */

  const totalPayments =
    history.length;


  /* =====================================================
     STATUS
  ===================================================== */

  const paymentStatus =
    String(
      currentDoctor?.paymentStatus ||
      ''
    ).toLowerCase();


  /*
   * A doctor is considered paid when there is
   * a verified payment history record.
   *
   * This prevents stale/mismatched paymentStatus
   * from hiding an already verified payment.
   */
  const hasVerifiedPayment =
    history.length > 0;


  const isPaid =
    paymentStatus === 'paid' ||
    hasVerifiedPayment;


  const pendingPayment =
    currentDoctor?.pendingPayment ||
    null;


  const pendingPaymentStatus =
    String(
      pendingPayment?.status ||
      ''
    ).toLowerCase();


  const hasPendingPayment =
    pendingPaymentStatus ===
    'pending';


  const hasRejectedPayment =
    pendingPaymentStatus ===
    'rejected';


  const isActive =
    currentDoctor?.active !== false;


  const accessRequestStatus =
    String(
      currentDoctor?.accessRequestStatus ||
      ''
    ).toLowerCase();


  const accessRequestPending =
    accessRequestStatus ===
    'pending';


  const nextPaymentDate =
    currentDoctor?.nextPaymentDate ||
    history[0]?.nextPaymentDate ||
    null;


  const lastPaymentDate =
    currentDoctor?.lastPaymentDate ||
    history[0]?.paidAt ||
    null;


  /* =====================================================
     DAYS REMAINING
  ===================================================== */

  let daysRemaining =
    null;


  if (nextPaymentDate) {
    const due =
      new Date(
        nextPaymentDate
      );

    if (
      !Number.isNaN(
        due.getTime()
      )
    ) {
      daysRemaining =
        Math.max(
          0,
          Math.ceil(
            (
              due.getTime() -
              Date.now()
            ) /
            (
              1000 *
              60 *
              60 *
              24
            )
          )
        );
    }
  }


  /* =====================================================
     PAYMENT DETAILS
  ===================================================== */

  const openPaymentDetails =
    () => {
      if (onPress) {
        onPress();
        return;
      }

      navigation.navigate(
        'PaymentDetails'
      );
    };


  /* =====================================================
     REQUEST ACCESS
  ===================================================== */

  const requestAccess =
    async () => {
      if (
        requestingAccess ||
        accessRequestPending
      ) {
        return;
      }

      try {
        setRequestingAccess(
          true
        );

        await api.post(
          '/auth/request-access-session',
          {
            message:
              'I would like to request access to my Veda doctor account.',
          }
        );

        setAccessRequestSent(
          true
        );

        await loadFreshDoctor();
        await loadNotifications();

        Alert.alert(
          'Request submitted',
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
          'Unable to send access request right now.';

        Alert.alert(
          'Request failed',
          message
        );

      } finally {
        setRequestingAccess(
          false
        );
      }
    };


  /* =====================================================
     ACCESS BUTTON LABEL
  ===================================================== */

  let accessButtonText =
    'Request Access';


  if (
    requestingAccess
  ) {
    accessButtonText =
      'Sending...';

  } else if (
    accessRequestPending ||
    accessRequestSent
  ) {
    accessButtonText =
      'Request Pending';
  }


  return (
    <Card>

      <View
        style={
          styles.container
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

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

            <Text
              style={
                styles.eyebrow
              }
            >
              BILLING & PAYMENTS
            </Text>


            <Text
              style={
                styles.title
              }
            >
              Payment records
            </Text>


            <Text
              style={
                styles.subtitle
              }
            >
              Complete payment history and current billing status
            </Text>

          </View>


          <View
            style={[
              styles.statusBadge,
              isPaid
                ? styles.statusPaid
                : hasPendingPayment
                  ? styles.statusVerification
                  : styles.statusPending,
            ]}
          >

            <View
              style={[
                styles.statusDot,
                isPaid
                  ? styles.dotPaid
                  : hasPendingPayment
                    ? styles.dotVerification
                    : styles.dotPending,
              ]}
            />


            <Text
              style={[
                styles.statusText,
                isPaid
                  ? styles.textPaid
                  : hasPendingPayment
                    ? styles.textVerification
                    : styles.textPending,
              ]}
            >
              {isPaid
                ? 'PAID'
                : hasPendingPayment
                  ? 'VERIFYING'
                  : 'UNPAID'}
            </Text>

          </View>

        </View>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <View
          style={
            styles.summaryGrid
          }
        >

          <SummaryItem
            label="TOTAL PAID"
            value={
              formatMoney(
                totalPaid
              )
            }
            valueStyle={
              styles.greenValue
            }
          />


          <SummaryItem
            label="PAYMENTS"
            value={
              String(
                totalPayments
              )
            }
          />


          <SummaryItem
            label="LAST PAYMENT"
            value={
              formatDate(
                lastPaymentDate
              )
            }
          />


          <SummaryItem
            label="NEXT PAYMENT"
            value={
              formatDate(
                nextPaymentDate
              )
            }
          />

        </View>


        {/* =================================================
            VERIFIED PAYMENT SUMMARY
        ================================================= */}

        {hasVerifiedPayment ? (

          <View
            style={
              styles.verifiedBox
            }
          >

            <View
              style={
                styles.verifiedIcon
              }
            >
              <Text
                style={
                  styles.verifiedIconText
                }
              >
                ✓
              </Text>
            </View>


            <View
              style={
                styles.verifiedContent
              }
            >

              <Text
                style={
                  styles.verifiedTitle
                }
              >
                Verified payment recorded
              </Text>


              <Text
                style={
                  styles.verifiedText
                }
              >
                {totalPayments}{' '}
                verified payment
                {totalPayments === 1
                  ? ''
                  : 's'}{' '}
                recorded with a total of{' '}
                {formatMoney(
                  totalPaid
                )}
                .
              </Text>

            </View>

          </View>

        ) : null}


        {/* =================================================
            PENDING PAYMENT
        ================================================= */}

        {hasPendingPayment ? (

          <View
            style={
              styles.pendingBox
            }
          >

            <View
              style={
                styles.pendingIcon
              }
            >
              <Text
                style={
                  styles.pendingIconText
                }
              >
                ⏳
              </Text>
            </View>


            <View
              style={
                styles.pendingContent
              }
            >

              <Text
                style={
                  styles.pendingTitle
                }
              >
                Payment verification pending
              </Text>


              <Text
                style={
                  styles.pendingText
                }
              >
                Your payment proof has been submitted and is waiting for administrator verification.
              </Text>


              <View
                style={
                  styles.pendingMeta
                }
              >

                <Text
                  style={
                    styles.pendingMetaText
                  }
                >
                  {formatMoney(
                    pendingPayment?.amount
                  )}
                </Text>


                <Text
                  style={
                    styles.pendingMetaText
                  }
                >
                  • {pendingPayment?.monthsPaid || 1}{' '}
                  {Number(
                    pendingPayment?.monthsPaid || 1
                  ) === 1
                    ? 'month'
                    : 'months'}
                </Text>

              </View>

            </View>

          </View>

        ) : null}


        {/* =================================================
            REJECTED PAYMENT
        ================================================= */}

        {hasRejectedPayment ? (

          <View
            style={
              styles.rejectedBox
            }
          >

            <Text
              style={
                styles.rejectedTitle
              }
            >
              Payment needs correction
            </Text>


            <Text
              style={
                styles.rejectedText
              }
            >
              Your previous payment submission was rejected. Open Payment Details to review the administrator note and submit again.
            </Text>

          </View>

        ) : null}


        {/* =================================================
            REMAINING DAYS
        ================================================= */}

        {isPaid &&
        nextPaymentDate ? (

          <View
            style={[
              styles.remainingBox,
              daysRemaining !== null &&
                daysRemaining <= 7 &&
                styles.remainingWarning,
              daysRemaining === 0 &&
                styles.remainingExpired,
            ]}
          >

            <View
              style={
                styles.remainingNumberBox
              }
            >

              <Text
                style={[
                  styles.remainingNumber,
                  daysRemaining !== null &&
                    daysRemaining <= 7 &&
                    styles.remainingWarningText,
                ]}
              >
                {daysRemaining ?? '—'}
              </Text>


              <Text
                style={
                  styles.remainingDays
                }
              >
                DAYS
              </Text>

            </View>


            <View
              style={
                styles.remainingContent
              }
            >

              <Text
                style={
                  styles.remainingTitle
                }
              >
                {daysRemaining === 0
                  ? 'Payment due'
                  : daysRemaining <= 7
                    ? 'Payment due soon'
                    : 'Payment active'}
              </Text>


              <Text
                style={
                  styles.remainingDescription
                }
              >
                Next payment is due on{' '}

                <Text
                  style={
                    styles.bold
                  }
                >
                  {formatDate(
                    nextPaymentDate
                  )}
                </Text>

              </Text>

            </View>

          </View>

        ) : null}


        {/* =================================================
            ACTIONS
        ================================================= */}

        <View
          style={
            styles.actionRow
          }
        >

          <Pressable
            onPress={
              openPaymentDetails
            }
            style={({ pressed }) => [
              styles.paymentButton,
              pressed &&
                styles.pressed,
            ]}
          >

            <Text
              style={
                styles.paymentButtonText
              }
            >
              {hasPendingPayment
                ? 'View Payment Status'
                : hasRejectedPayment
                  ? 'Fix Payment'
                  : 'Payment Details'}
            </Text>

          </Pressable>


          {!isActive ? (

            <Pressable
              onPress={
                requestAccess
              }
              disabled={
                requestingAccess ||
                accessRequestPending
              }
              style={({ pressed }) => [
                styles.accessButton,
                pressed &&
                  styles.pressed,
                (
                  requestingAccess ||
                  accessRequestPending
                ) &&
                  styles.accessButtonDisabled,
              ]}
            >

              {requestingAccess ? (

                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                />

              ) : (

                <Text
                  style={
                    styles.accessButtonText
                  }
                >
                  {accessButtonText}
                </Text>

              )}

            </Pressable>

          ) : null}

        </View>


        {/* =================================================
            NOTIFICATION INDICATOR
        ================================================= */}

        {notificationCount > 0 ? (

          <Pressable
            onPress={
              openPaymentDetails
            }
            style={
              styles.notificationHint
            }
          >

            <View
              style={
                styles.notificationDot
              }
            />

            <Text
              style={
                styles.notificationText
              }
            >
              You have {notificationCount}{' '}
              unread account notification
              {notificationCount === 1
                ? ''
                : 's'}.
            </Text>

          </Pressable>

        ) : null}


        {/* =================================================
            TRANSACTION LEDGER
        ================================================= */}

        {!compact ? (

          <View
            style={
              styles.historySection
            }
          >

            <View
              style={
                styles.historyHeader
              }
            >

              <View>

                <Text
                  style={
                    styles.historyEyebrow
                  }
                >
                  TRANSACTION LEDGER
                </Text>


                <Text
                  style={
                    styles.historyTitle
                  }
                >
                  Payment history
                </Text>

              </View>


              {onHistory ? (

                <Pressable
                  onPress={
                    onHistory
                  }
                  style={({ pressed }) => [
                    styles.viewAllButton,
                    pressed &&
                      styles.pressed,
                  ]}
                >

                  <Text
                    style={
                      styles.viewAllText
                    }
                  >
                    View all
                  </Text>

                </Pressable>

              ) : null}

            </View>


            {history.length === 0 ? (

              <View
                style={
                  styles.emptyHistory
                }
              >

                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  ₹
                </Text>


                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No payment records
                </Text>


                <Text
                  style={
                    styles.emptyText
                  }
                >
                  No completed payment has been recorded for this account yet.
                </Text>

              </View>

            ) : (

              history
                .slice(0, 5)
                .map(
                  (
                    record,
                    index
                  ) => (

                    <PaymentRecord
                      key={
                        record?._id ||
                        `${record?.paidAt}-${record?.amount}-${index}`
                      }
                      record={
                        record
                      }
                      index={
                        index
                      }
                    />

                  )
                )

            )}


            {history.length > 5 &&
            onHistory ? (

              <Pressable
                onPress={
                  onHistory
                }
                style={
                  styles.moreButton
                }
              >

                <Text
                  style={
                    styles.moreText
                  }
                >
                  View {history.length - 5} more payment
                  {history.length - 5 === 1
                    ? ''
                    : 's'}
                </Text>

              </Pressable>

            ) : null}

          </View>

        ) : null}

      </View>

    </Card>
  );
}


/* =====================================================
   SUMMARY ITEM
===================================================== */

function SummaryItem({
  label,
  value,
  valueStyle,
}) {
  return (
    <View
      style={
        styles.summaryItem
      }
    >

      <Text
        style={
          styles.summaryLabel
        }
      >
        {label}
      </Text>


      <Text
        style={[
          styles.summaryValue,
          valueStyle,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

    </View>
  );
}


/* =====================================================
   PAYMENT RECORD
===================================================== */

function PaymentRecord({
  record,
  index,
}) {
  const amount =
    Number(
      record?.amount || 0
    );

  const months =
    Number(
      record?.monthsPaid || 1
    );

  return (
    <View
      style={
        styles.record
      }
    >

      <View
        style={
          styles.recordIndex
        }
      >

        <Text
          style={
            styles.recordIndexText
          }
        >
          {index + 1}
        </Text>

      </View>


      <View
        style={
          styles.recordMain
        }
      >

        <View
          style={
            styles.recordTop
          }
        >

          <Text
            style={
              styles.recordAmount
            }
          >
            {formatMoney(
              amount
            )}
          </Text>


          <View
            style={
              styles.paidBadge
            }
          >

            <Text
              style={
                styles.paidBadgeText
              }
            >
              VERIFIED
            </Text>

          </View>

        </View>


        <View
          style={
            styles.recordDetails
          }
        >

          <View
            style={
              styles.detailItem
            }
          >

            <Text
              style={
                styles.detailLabel
              }
            >
              PAYMENT DATE
            </Text>


            <Text
              style={
                styles.detailValue
              }
            >
              {formatDate(
                record?.paidAt
              )}
            </Text>

          </View>


          <View
            style={
              styles.detailItem
            }
          >

            <Text
              style={
                styles.detailLabel
              }
            >
              COVERAGE
            </Text>


            <Text
              style={
                styles.detailValue
              }
            >
              {months}{' '}
              {months === 1
                ? 'month'
                : 'months'}
            </Text>

          </View>


          <View
            style={
              styles.detailItem
            }
          >

            <Text
              style={
                styles.detailLabel
              }
            >
              NEXT DUE
            </Text>


            <Text
              style={
                styles.detailValue
              }
            >
              {formatDate(
                record?.nextPaymentDate
              )}
            </Text>

          </View>

        </View>


        {record?.transactionId ? (

          <View
            style={
              styles.transactionRow
            }
          >

            <Text
              style={
                styles.transactionLabel
              }
            >
              TRANSACTION
            </Text>


            <Text
              style={
                styles.transactionValue
              }
              numberOfLines={1}
            >
              {record.transactionId}
            </Text>

          </View>

        ) : null}


        {record?.note ? (

          <View
            style={
              styles.noteBox
            }
          >

            <Text
              style={
                styles.noteLabel
              }
            >
              NOTE
            </Text>


            <Text
              style={
                styles.noteText
              }
            >
              {record.note}
            </Text>

          </View>

        ) : null}

      </View>

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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
    paddingRight: 10,
  },

  eyebrow: {
    color: colors.blue,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  title: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },

  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },

  statusPaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
  },

  statusPending: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },

  statusVerification: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 5,
  },

  dotPaid: {
    backgroundColor: '#10B981',
  },

  dotPending: {
    backgroundColor: '#F59E0B',
  },

  dotVerification: {
    backgroundColor: '#3B82F6',
  },

  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  textPaid: {
    color: '#047857',
  },

  textPending: {
    color: '#C2410C',
  },

  textVerification: {
    color: '#1D4ED8',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E7EDF3',
    borderRadius: 14,
    overflow: 'hidden',
  },

  summaryItem: {
    width: '50%',
    padding: 11,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E7EDF3',
    backgroundColor: '#FAFCFD',
  },

  summaryLabel: {
    color: '#94A3B8',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  summaryValue: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },

  greenValue: {
    color: '#087A66',
  },

  /* VERIFIED */

  verifiedBox: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  verifiedIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  verifiedIconText: {
    color: '#047857',
    fontSize: 18,
    fontWeight: '900',
  },

  verifiedContent: {
    flex: 1,
  },

  verifiedTitle: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '900',
  },

  verifiedText: {
    color: '#52746A',
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  /* PENDING */

  pendingBox: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  pendingIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  pendingIconText: {
    fontSize: 15,
  },

  pendingContent: {
    flex: 1,
  },

  pendingTitle: {
    color: '#1E40AF',
    fontSize: 10,
    fontWeight: '900',
  },

  pendingText: {
    color: '#526B89',
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  pendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  pendingMetaText: {
    color: '#2563EB',
    fontSize: 7.5,
    fontWeight: '900',
    marginRight: 5,
  },

  /* REJECTED */

  rejectedBox: {
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },

  rejectedTitle: {
    color: '#9F1239',
    fontSize: 10,
    fontWeight: '900',
  },

  rejectedText: {
    color: '#7F5260',
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },

  /* REMAINING */

  remainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  remainingWarning: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },

  remainingExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  remainingNumberBox: {
    width: 52,
    alignItems: 'center',
    marginRight: 9,
  },

  remainingNumber: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '900',
  },

  remainingWarningText: {
    color: '#EA580C',
  },

  remainingDays: {
    marginTop: -1,
    color: '#64748B',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  remainingContent: {
    flex: 1,
  },

  remainingTitle: {
    color: colors.ink,
    fontSize: 10.5,
    fontWeight: '900',
  },

  remainingDescription: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 8.5,
    lineHeight: 14,
  },

  bold: {
    fontWeight: '900',
    color: colors.ink,
  },

  /* ACTIONS */

  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
  },

  paymentButton: {
    backgroundColor: '#EEF5FF',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginRight: 7,
    marginBottom: 5,
  },

  paymentButtonText: {
    color: '#2563EB',
    fontSize: 8,
    fontWeight: '900',
  },

  accessButton: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  accessButtonDisabled: {
    opacity: 0.6,
  },

  accessButtonText: {
    color: '#2563EB',
    fontSize: 8,
    fontWeight: '900',
  },

  notificationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#E11D48',
    marginRight: 5,
  },

  notificationText: {
    color: '#64748B',
    fontSize: 7.5,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.7,
  },

  /* HISTORY */

  historySection: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E7EDF3',
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  historyEyebrow: {
    color: '#94A3B8',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  historyTitle: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  viewAllButton: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF5FF',
  },

  viewAllText: {
    color: '#2563EB',
    fontSize: 8,
    fontWeight: '900',
  },

  record: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F5',
  },

  recordIndex: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5FF',
    marginRight: 9,
  },

  recordIndexText: {
    color: '#2563EB',
    fontSize: 9,
    fontWeight: '900',
  },

  recordMain: {
    flex: 1,
    minWidth: 0,
  },

  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  recordAmount: {
    color: '#087A66',
    fontSize: 13,
    fontWeight: '900',
  },

  paidBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },

  paidBadgeText: {
    color: '#15803D',
    fontSize: 6.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },

  detailItem: {
    minWidth: 100,
    flex: 1,
    paddingHorizontal: 4,
    marginBottom: 5,
  },

  detailLabel: {
    color: '#A0ACB9',
    fontSize: 6.5,
    fontWeight: '900',
    letterSpacing: 0.45,
  },

  detailValue: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 8.5,
    fontWeight: '800',
  },

  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  transactionLabel: {
    color: '#A0ACB9',
    fontSize: 6.5,
    fontWeight: '900',
    marginRight: 6,
  },

  transactionValue: {
    flex: 1,
    color: '#475569',
    fontSize: 8,
    fontWeight: '700',
  },

  noteBox: {
    marginTop: 6,
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },

  noteLabel: {
    color: '#94A3B8',
    fontSize: 6.5,
    fontWeight: '900',
  },

  noteText: {
    marginTop: 2,
    color: '#475569',
    fontSize: 8,
    lineHeight: 13,
  },

  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },

  emptyIcon: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: '900',
  },

  emptyTitle: {
    marginTop: 5,
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },

  emptyText: {
    maxWidth: 270,
    marginTop: 3,
    color: colors.muted,
    fontSize: 8,
    lineHeight: 13,
    textAlign: 'center',
  },

  moreButton: {
    alignItems: 'center',
    paddingTop: 11,
  },

  moreText: {
    color: '#2563EB',
    fontSize: 8.5,
    fontWeight: '900',
  },

});