import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
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
  Card,
  Screen,
  colors,
} from '../components/UI';


/* =====================================================
   PAYMENT DETAILS
===================================================== */

export default function PaymentDetails({ navigation }) {

  const {
    doctor,
  } = useAuth();

  const {
    width,
  } = useWindowDimensions();

  const isSmall =
    width < 380;

  const isTablet =
    width >= 620;


  /* =====================================================
     STATE
  ===================================================== */

  const [
    details,
    setDetails,
  ] = useState(
    doctor || null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');


  /* =====================================================
     LOAD DETAILS
  ===================================================== */

  const loadDetails = useCallback(
    async ({
      refresh = false,
    } = {}) => {

      try {

        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage('');


        const response =
          await api.get('/auth/me');


        const data =
          response?.data || {};


        const currentDoctor =
          data?.doctor ||
          data?.data?.doctor ||
          data?.user ||
          data?.data ||
          null;


        if (currentDoctor) {

          setDetails(
            currentDoctor
          );

        } else if (doctor) {

          setDetails(
            doctor
          );

        }

      } catch (error) {

        console.error(
          'PAYMENT DETAILS LOAD ERROR:',
          error?.response?.data ||
          error?.message ||
          error
        );


        if (!details && !doctor) {

          setErrorMessage(
            'Unable to load payment and access details right now.'
          );

        }

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    [
      doctor,
      details,
    ]
  );


  /* =====================================================
     REFRESH WHEN SCREEN OPENS
  ===================================================== */

  useFocusEffect(
    useCallback(() => {

      loadDetails();

    }, [
      loadDetails,
    ])
  );


  /* =====================================================
     DATA
  ===================================================== */

  const paymentStatus =
    String(
      details?.paymentStatus ||
      'pending'
    ).toLowerCase();


  const isPaid =
    paymentStatus === 'paid';


  const isActive =
    details?.active !== false;


  const paymentHistory =
    Array.isArray(
      details?.paymentHistory
    )
      ? details.paymentHistory
      : [];


  const registrationDate =
    details?.registrationDate ||
    details?.createdAt;


  const accessStartDate =
    details?.accessStartDate ||
    registrationDate;


  const lastPaymentDate =
    details?.lastPaymentDate;


  const nextPaymentDate =
    details?.nextPaymentDate;


  const accessRequestStatus =
    String(
      details?.accessRequestStatus ||
      ''
    ).toLowerCase();


  const accessRemovalReason =
    details?.accessRemovalReason ||
    '';


  let accessLabel =
    'ACCESS ACTIVE';


  if (!isActive) {
    accessLabel =
      'ACCESS INACTIVE';
  }


  let paymentLabel =
    'PAYMENT PENDING';


  if (isPaid) {
    paymentLabel =
      'PAYMENT VERIFIED';
  }


  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = () => {

    loadDetails({
      refresh: true,
    });

  };


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <Screen scroll>

      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.blue}
            colors={[colors.blue]}
          />
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <View
          style={[
            styles.pageHeader,
            isTablet &&
              styles.pageHeaderTablet,
          ]}
        >

          <View
            style={
              styles.pageHeaderText
            }
          >

            <Text
              style={
                styles.pageEyebrow
              }
            >
              ACCOUNT • BILLING
            </Text>


            <Text
              style={[
                styles.pageTitle,
                isSmall &&
                  styles.pageTitleSmall,
              ]}
            >
              Payment & Access
            </Text>


            <Text
              style={
                styles.pageSubtitle
              }
            >
              Manage your Veda doctor access,
              payment status and billing history.
            </Text>

          </View>


          <Pressable
            onPress={() =>
              navigation.goBack()
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.backButtonPressed,
            ]}
          >

            <Text
              style={
                styles.backButtonArrow
              }
            >
              ‹
            </Text>


            <Text
              style={
                styles.backButtonText
              }
            >
              Back
            </Text>

          </Pressable>

        </View>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && !details ? (

          <View
            style={
              styles.loadingState
            }
          >

            <ActivityIndicator
              size="large"
              color={colors.blue}
            />


            <Text
              style={
                styles.loadingTitle
              }
            >
              Loading account details
            </Text>


            <Text
              style={
                styles.loadingText
              }
            >
              Fetching your latest Veda
              payment and access information.
            </Text>

          </View>

        ) : null}


        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage ? (

          <Card>

            <View
              style={
                styles.errorBox
              }
            >

              <View
                style={
                  styles.errorIcon
                }
              >

                <Text
                  style={
                    styles.errorIconText
                  }
                >
                  !
                </Text>

              </View>


              <Text
                style={
                  styles.errorTitle
                }
              >
                Something went wrong
              </Text>


              <Text
                style={
                  styles.errorText
                }
              >
                {errorMessage}
              </Text>


              <Pressable
                onPress={() =>
                  loadDetails()
                }
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed &&
                    styles.retryPressed,
                ]}
              >

                <Text
                  style={
                    styles.retryText
                  }
                >
                  Try again
                </Text>

              </Pressable>

            </View>

          </Card>

        ) : null}


        {/* =================================================
            MAIN ACCOUNT STATUS
        ================================================= */}

        {details ? (

          <View>

            <View
              style={[
                styles.statusCard,
                isActive
                  ? styles.statusCardActive
                  : styles.statusCardInactive,
              ]}
            >

              <View
                style={
                  styles.statusGlow
                }
              />


              <View
                style={
                  styles.statusTop
                }
              >

                <View
                  style={
                    styles.statusIcon
                  }
                >

                  <Text
                    style={
                      styles.statusIconText
                    }
                  >
                    ₹
                  </Text>

                </View>


                <View
                  style={
                    styles.statusTopText
                  }
                >

                  <Text
                    style={
                      styles.statusEyebrow
                    }
                  >
                    VEDA DOCTOR ACCESS
                  </Text>


                  <Text
                    style={
                      styles.statusTitle
                    }
                  >
                    {isActive
                      ? 'Your access is active'
                      : 'Your access is inactive'}
                  </Text>

                </View>


                <View
                  style={[
                    styles.statusBadge,
                    isActive
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive,
                  ]}
                >

                  <View
                    style={[
                      styles.statusDot,
                      isActive
                        ? styles.statusDotActive
                        : styles.statusDotInactive,
                    ]}
                  />


                  <Text
                    style={[
                      styles.statusBadgeText,
                      isActive
                        ? styles.statusBadgeTextActive
                        : styles.statusBadgeTextInactive,
                    ]}
                  >
                    {accessLabel}
                  </Text>

                </View>

              </View>


              <View
                style={
                  styles.statusDivider
                }
              />


              <View
                style={
                  styles.statusBottom
                }
              >

                <View
                  style={
                    styles.statusMetric
                  }
                >

                  <Text
                    style={
                      styles.statusMetricLabel
                    }
                  >
                    PAYMENT
                  </Text>


                  <Text
                    style={[
                      styles.statusMetricValue,
                      isPaid
                        ? styles.paidValue
                        : styles.pendingValue,
                    ]}
                  >
                    {paymentLabel}
                  </Text>

                </View>


                <View
                  style={
                    styles.metricDivider
                  }
                />


                <View
                  style={
                    styles.statusMetric
                  }
                >

                  <Text
                    style={
                      styles.statusMetricLabel
                    }
                  >
                    NEXT PAYMENT
                  </Text>


                  <Text
                    style={
                      styles.statusMetricValue
                    }
                  >
                    {formatDate(
                      nextPaymentDate
                    )}
                  </Text>

                </View>

              </View>

            </View>


            {/* =================================================
                PAYMENT OVERVIEW
            ================================================= */}

            <SectionTitle
              eyebrow="PAYMENT OVERVIEW"
              title="Billing information"
            />


            <View
              style={[
                styles.infoGrid,
                isTablet &&
                  styles.infoGridTablet,
              ]}
            >

              <InfoBlock
                label="Payment status"
                value={
                  isPaid
                    ? 'Paid / Verified'
                    : formatStatus(
                        paymentStatus
                      )
                }
                tone={
                  isPaid
                    ? 'success'
                    : 'warning'
                }
              />


              <InfoBlock
                label="Last payment"
                value={
                  formatDate(
                    lastPaymentDate
                  )
                }
              />


              <InfoBlock
                label="Next payment"
                value={
                  formatDate(
                    nextPaymentDate
                  )
                }
              />


              <InfoBlock
                label="Access period"
                value="Doctor Access"
              />

            </View>


            {/* =================================================
                ACCESS PERIOD
            ================================================= */}

            <SectionTitle
              eyebrow="ACCESS PERIOD"
              title="Access timeline"
            />


            <Card>

              <TimelineItem
                number="01"
                title="Registration"
                date={
                  formatDate(
                    registrationDate
                  )
                }
                description="Doctor account registered with Veda."
                completed
              />


              <TimelineItem
                number="02"
                title="Access started"
                date={
                  formatDate(
                    accessStartDate
                  )
                }
                description="Veda doctor access became available."
                completed={
                  Boolean(
                    accessStartDate
                  )
                }
              />


              <TimelineItem
                number="03"
                title="Next billing"
                date={
                  formatDate(
                    nextPaymentDate
                  )
                }
                description={
                  nextPaymentDate
                    ? 'Next payment date for continued access.'
                    : 'Next payment date has not been recorded yet.'
                }
                completed={false}
                last
              />

            </Card>


            {/* =================================================
                ACCESS REQUEST
            ================================================= */}

            {accessRequestStatus ? (

              <View>

                <SectionTitle
                  eyebrow="ACCESS REQUEST"
                  title="Request status"
                />


                <Card>

                  <View
                    style={
                      styles.requestRow
                    }
                  >

                    <View
                      style={
                        styles.requestIcon
                      }
                    >

                      <Text
                        style={
                          styles.requestIconText
                        }
                      >
                        ↗
                      </Text>

                    </View>


                    <View
                      style={
                        styles.requestContent
                      }
                    >

                      <Text
                        style={
                          styles.requestTitle
                        }
                      >
                        Access request
                      </Text>


                      <Text
                        style={
                          styles.requestDescription
                        }
                      >
                        Current request status
                      </Text>

                    </View>


                    <View
                      style={[
                        styles.requestBadge,
                        getRequestStatusStyle(
                          accessRequestStatus
                        ),
                      ]}
                    >

                      <Text
                        style={[
                          styles.requestBadgeText,
                          getRequestStatusTextStyle(
                            accessRequestStatus
                          ),
                        ]}
                      >
                        {formatStatus(
                          accessRequestStatus
                        )}
                      </Text>

                    </View>

                  </View>


                  {accessRemovalReason ? (

                    <View
                      style={
                        styles.reasonBox
                      }
                    >

                      <Text
                        style={
                          styles.reasonLabel
                        }
                      >
                        ACCESS NOTE
                      </Text>


                      <Text
                        style={
                          styles.reasonText
                        }
                      >
                        {accessRemovalReason}
                      </Text>

                    </View>

                  ) : null}

                </Card>

              </View>

            ) : null}


            {/* =================================================
                PAYMENT HISTORY
            ================================================= */}

            <SectionTitle
              eyebrow="PAYMENT HISTORY"
              title="Previous payments"
            />


            {paymentHistory.length === 0 ? (

              <Card>

                <View
                  style={
                    styles.emptyHistory
                  }
                >

                  <View
                    style={
                      styles.emptyHistoryIcon
                    }
                  >

                    <Text
                      style={
                        styles.emptyHistoryIconText
                      }
                    >
                      ₹
                    </Text>

                  </View>


                  <Text
                    style={
                      styles.emptyHistoryTitle
                    }
                  >
                    No payment history
                  </Text>


                  <Text
                    style={
                      styles.emptyHistoryText
                    }
                  >
                    Payment records will appear here
                    once a payment is recorded.
                  </Text>

                </View>

              </Card>

            ) : (

              <Card>

                {paymentHistory.map(
                  (payment, index) => (

                    <PaymentHistoryItem
                      key={
                        payment?._id ||
                        payment?.transactionId ||
                        index
                      }
                      payment={
                        payment
                      }
                      index={
                        index
                      }
                      total={
                        paymentHistory.length
                      }
                    />

                  )
                )}

              </Card>

            )}


            {/* =================================================
                SECURITY NOTE
            ================================================= */}

            <View
              style={
                styles.securityCard
              }
            >

              <View
                style={
                  styles.securityIcon
                }
              >

                <Text
                  style={
                    styles.securityIconText
                  }
                >
                  ✓
                </Text>

              </View>


              <View
                style={
                  styles.securityContent
                }
              >

                <Text
                  style={
                    styles.securityTitle
                  }
                >
                  Secure Veda account
                </Text>


                <Text
                  style={
                    styles.securityText
                  }
                >
                  Your account access and payment
                  information are connected to your
                  authenticated Veda doctor account.
                </Text>

              </View>

            </View>


            {/* =================================================
                REFRESH ACTION
            ================================================= */}

            <Pressable
              onPress={handleRefresh}
              disabled={refreshing}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed &&
                  styles.refreshButtonPressed,
              ]}
            >

              <Text
                style={
                  styles.refreshButtonText
                }
              >
                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh payment details ↻'}
              </Text>

            </Pressable>

          </View>

        ) : null}

      </ScrollView>

    </Screen>
  );
}


/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({
  eyebrow,
  title,
}) {

  return (
    <View
      style={
        styles.sectionHeader
      }
    >

      <Text
        style={
          styles.sectionEyebrow
        }
      >
        {eyebrow}
      </Text>


      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

    </View>
  );
}


/* =====================================================
   INFO BLOCK
===================================================== */

function InfoBlock({
  label,
  value,
  tone,
}) {

  const toneStyle =
    tone === 'success'
      ? styles.infoSuccess
      : tone === 'warning'
        ? styles.infoWarning
        : null;


  return (
    <View
      style={[
        styles.infoBlock,
        toneStyle,
      ]}
    >

      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>


      <Text
        style={[
          styles.infoValue,
          tone === 'success' &&
            styles.infoValueSuccess,
          tone === 'warning' &&
            styles.infoValueWarning,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>

    </View>
  );
}


/* =====================================================
   TIMELINE ITEM
===================================================== */

function TimelineItem({
  number,
  title,
  date,
  description,
  completed,
  last,
}) {

  return (
    <View
      style={[
        styles.timelineItem,
        last &&
          styles.timelineLast,
      ]}
    >

      <View
        style={
          styles.timelineLeft
        }
      >

        <View
          style={[
            styles.timelineNumber,
            completed &&
              styles.timelineNumberCompleted,
          ]}
        >

          <Text
            style={[
              styles.timelineNumberText,
              completed &&
                styles.timelineNumberTextCompleted,
            ]}
          >
            {completed
              ? '✓'
              : number}
          </Text>

        </View>


        {!last ? (

          <View
            style={[
              styles.timelineLine,
              completed &&
                styles.timelineLineCompleted,
            ]}
          />

        ) : null}

      </View>


      <View
        style={
          styles.timelineContent
        }
      >

        <View
          style={
            styles.timelineTitleRow
          }
        >

          <Text
            style={
              styles.timelineTitle
            }
          >
            {title}
          </Text>


          <Text
            style={
              styles.timelineDate
            }
          >
            {date}
          </Text>

        </View>


        <Text
          style={
            styles.timelineDescription
          }
        >
          {description}
        </Text>

      </View>

    </View>
  );
}


/* =====================================================
   PAYMENT HISTORY ITEM
===================================================== */

function PaymentHistoryItem({
  payment,
  index,
  total,
}) {

  const transactionId =
    payment?.transactionId ||
    payment?._id ||
    '—';


  const amount =
    payment?.amount !== undefined &&
    payment?.amount !== null
      ? `₹${Number(
          payment.amount
        ).toLocaleString('en-IN')}`
      : 'Amount not recorded';


  const paidAt =
    formatDate(
      payment?.paidAt ||
      payment?.paymentDate ||
      payment?.createdAt
    );


  const monthsPaid =
    payment?.monthsPaid;


  const nextDate =
    payment?.nextPaymentDate;


  return (
    <View
      style={[
        styles.historyItem,
        index === total - 1 &&
          styles.historyLast,
      ]}
    >

      <View
        style={
          styles.historyIcon
        }
      >

        <Text
          style={
            styles.historyIconText
          }
        >
          ₹
        </Text>

      </View>


      <View
        style={
          styles.historyContent
        }
      >

        <View
          style={
            styles.historyTopRow
          }
        >

          <Text
            style={
              styles.historyAmount
            }
          >
            {amount}
          </Text>


          <View
            style={
              styles.verifiedBadge
            }
          >

            <View
              style={
                styles.verifiedDot
              }
            />


            <Text
              style={
                styles.verifiedText
              }
            >
              VERIFIED
            </Text>

          </View>

        </View>


        <Text
          style={
            styles.historyDate
          }
        >
          Paid on {paidAt}
        </Text>


        <View
          style={
            styles.historyMetaRow
          }
        >

          <Text
            style={
              styles.historyMeta
            }
            numberOfLines={1}
          >
            Transaction: {transactionId}
          </Text>

        </View>


        {monthsPaid ? (

          <Text
            style={
              styles.historyMeta
            }
          >
            Access period: {monthsPaid} month
            {Number(monthsPaid) === 1
              ? ''
              : 's'}
          </Text>

        ) : null}


        {nextDate ? (

          <Text
            style={
              styles.historyNext
            }
          >
            Next payment: {formatDate(
              nextDate
            )}
          </Text>

        ) : null}


        {payment?.note ? (

          <Text
            style={
              styles.historyNote
            }
          >
            {payment.note}
          </Text>

        ) : null}

      </View>

    </View>
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
   STATUS FORMAT
===================================================== */

function formatStatus(value) {

  if (!value) {
    return '—';
  }


  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}


/* =====================================================
   REQUEST STATUS STYLE
===================================================== */

function getRequestStatusStyle(
  status
) {

  if (
    status === 'approved' ||
    status === 'accepted' ||
    status === 'active'
  ) {
    return styles.requestApproved;
  }


  if (
    status === 'rejected' ||
    status === 'denied' ||
    status === 'expired'
  ) {
    return styles.requestRejected;
  }


  return styles.requestPending;
}


/* =====================================================
   REQUEST STATUS TEXT STYLE
===================================================== */

function getRequestStatusTextStyle(
  status
) {

  if (
    status === 'approved' ||
    status === 'accepted' ||
    status === 'active'
  ) {
    return styles.requestApprovedText;
  }


  if (
    status === 'rejected' ||
    status === 'denied' ||
    status === 'expired'
  ) {
    return styles.requestRejectedText;
  }


  return styles.requestPendingText;
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  /* ===================================================
     SCROLL
  =================================================== */

  scrollContent: {
    paddingBottom: 8,
  },


  /* ===================================================
     PAGE HEADER
  =================================================== */

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  pageHeaderTablet: {
    paddingHorizontal: 2,
  },

  pageHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
  },

  pageEyebrow: {
    color: colors.blue,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 5,
  },

  pageTitle: {
    color: colors.ink,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  pageTitleSmall: {
    fontSize: 25,
    lineHeight: 30,
  },

  pageSubtitle: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 430,
  },

  backButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  backButtonPressed: {
    opacity: 0.65,
  },

  backButtonArrow: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 23,
    fontWeight: '500',
    marginRight: 4,
    marginTop: -2,
  },

  backButtonText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },


  /* ===================================================
     LOADING
  =================================================== */

  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
  },

  loadingTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 13,
  },

  loadingText: {
    color: colors.muted,
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 5,
  },


  /* ===================================================
     ERROR
  =================================================== */

  errorBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  errorIconText: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: '900',
  },

  errorTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  errorText: {
    color: colors.muted,
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 5,
  },

  retryButton: {
    backgroundColor: '#EEF5FF',
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginTop: 13,
  },

  retryPressed: {
    opacity: 0.65,
  },

  retryText: {
    color: colors.blue,
    fontSize: 10,
    fontWeight: '900',
  },


  /* ===================================================
     STATUS CARD
  =================================================== */

  statusCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    padding: 18,
    marginBottom: 27,
    borderWidth: 1,
  },

  statusCardActive: {
    backgroundColor: '#0A1D2D',
    borderColor: '#18384E',
  },

  statusCardInactive: {
    backgroundColor: '#2A1820',
    borderColor: '#4C2933',
  },

  statusGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: '#1D4ED8',
    opacity: 0.16,
    right: -65,
    top: -85,
  },

  statusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  statusIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  statusIconText: {
    color: '#69AFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  statusTopText: {
    flex: 1,
    minWidth: 0,
  },

  statusEyebrow: {
    color: '#78A8CC',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  statusTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginLeft: 7,
  },

  statusBadgeActive: {
    backgroundColor: 'rgba(16,185,129,0.13)',
  },

  statusBadgeInactive: {
    backgroundColor: 'rgba(244,63,94,0.13)',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 10,
    marginRight: 5,
  },

  statusDotActive: {
    backgroundColor: '#10B981',
  },

  statusDotInactive: {
    backgroundColor: '#FB7185',
  },

  statusBadgeText: {
    fontSize: 6.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  statusBadgeTextActive: {
    color: '#6EE7B7',
  },

  statusBadgeTextInactive: {
    color: '#FDA4AF',
  },

  statusDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginVertical: 17,
  },

  statusBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusMetric: {
    flex: 1,
    minWidth: 0,
  },

  statusMetricLabel: {
    color: '#6F879D',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  statusMetricValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  paidValue: {
    color: '#6EE7B7',
  },

  pendingValue: {
    color: '#FBBF24',
  },

  metricDivider: {
    width: 1,
    height: 29,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 14,
  },


  /* ===================================================
     SECTION
  =================================================== */

  sectionHeader: {
    marginTop: 1,
    marginBottom: 12,
  },

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


  /* ===================================================
     INFO GRID
  =================================================== */

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 14,
  },

  infoGridTablet: {
    marginHorizontal: -5,
  },

  infoBlock: {
    width: '50%',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },

  infoSuccess: {
    // intentionally subtle; keeps common card design
  },

  infoWarning: {
    // intentionally subtle; keeps common card design
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  infoValue: {
    color: colors.ink,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '900',
  },

  infoValueSuccess: {
    color: '#059669',
  },

  infoValueWarning: {
    color: '#D97706',
  },


  /* ===================================================
     TIMELINE
  =================================================== */

  timelineItem: {
    flexDirection: 'row',
    minHeight: 73,
  },

  timelineLast: {
    minHeight: 52,
  },

  timelineLeft: {
    width: 34,
    alignItems: 'center',
  },

  timelineNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineNumberCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },

  timelineNumberText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '900',
  },

  timelineNumberTextCompleted: {
    color: '#059669',
    fontSize: 12,
  },

  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },

  timelineLineCompleted: {
    backgroundColor: '#BBF7D0',
  },

  timelineContent: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 10,
    paddingBottom: 15,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  timelineTitle: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: '900',
    flex: 1,
  },

  timelineDate: {
    color: colors.blue,
    fontSize: 8.5,
    fontWeight: '800',
  },

  timelineDescription: {
    color: colors.muted,
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 4,
  },


  /* ===================================================
     REQUEST
  =================================================== */

  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  requestIconText: {
    color: colors.blue,
    fontSize: 17,
    fontWeight: '900',
  },

  requestContent: {
    flex: 1,
    minWidth: 0,
  },

  requestTitle: {
    color: colors.ink,
    fontSize: 12.5,
    fontWeight: '900',
  },

  requestDescription: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 3,
  },

  requestBadge: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 8,
  },

  requestApproved: {
    backgroundColor: '#ECFDF5',
  },

  requestRejected: {
    backgroundColor: '#FFF1F2',
  },

  requestPending: {
    backgroundColor: '#FFF7ED',
  },

  requestBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  requestApprovedText: {
    color: '#059669',
  },

  requestRejectedText: {
    color: '#E11D48',
  },

  requestPendingText: {
    color: '#D97706',
  },

  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 11,
    marginTop: 13,
    borderWidth: 1,
    borderColor: '#E8EEF5',
  },

  reasonLabel: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  reasonText: {
    color: colors.ink,
    fontSize: 10,
    lineHeight: 16,
  },


  /* ===================================================
     PAYMENT HISTORY
  =================================================== */

  historyItem: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F8',
  },

  historyLast: {
    borderBottomWidth: 0,
  },

  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#DFEBF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  historyIconText: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: '900',
  },

  historyContent: {
    flex: 1,
    minWidth: 0,
  },

  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  historyAmount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  verifiedDot: {
    width: 4,
    height: 4,
    borderRadius: 10,
    backgroundColor: '#10B981',
    marginRight: 4,
  },

  verifiedText: {
    color: '#059669',
    fontSize: 6.5,
    fontWeight: '900',
  },

  historyDate: {
    color: colors.muted,
    fontSize: 9.5,
    marginTop: 3,
  },

  historyMetaRow: {
    marginTop: 5,
  },

  historyMeta: {
    color: '#94A3B8',
    fontSize: 8.5,
    lineHeight: 14,
  },

  historyNext: {
    color: colors.blue,
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 3,
  },

  historyNote: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },


  /* ===================================================
     EMPTY HISTORY
  =================================================== */

  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 13,
  },

  emptyHistoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  emptyHistoryIconText: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '900',
  },

  emptyHistoryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  emptyHistoryText: {
    color: colors.muted,
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: 'center',
    maxWidth: 270,
    marginTop: 4,
  },


  /* ===================================================
     SECURITY
  =================================================== */

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#D7F4E8',
    borderRadius: 18,
    padding: 13,
    marginTop: 2,
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  securityIconText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '900',
  },

  securityContent: {
    flex: 1,
    minWidth: 0,
  },

  securityTitle: {
    color: '#166534',
    fontSize: 10.5,
    fontWeight: '900',
  },

  securityText: {
    color: '#4D7C65',
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },


  /* ===================================================
     REFRESH
  =================================================== */

  refreshButton: {
    alignSelf: 'center',
    backgroundColor: '#EEF5FF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 14,
    marginBottom: 3,
  },

  refreshButtonPressed: {
    opacity: 0.6,
  },

  refreshButtonText: {
    color: colors.blue,
    fontSize: 9,
    fontWeight: '900',
  },

});