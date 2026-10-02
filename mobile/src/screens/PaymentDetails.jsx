import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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

  const [
    submittingPayment,
    setSubmittingPayment,
  ] = useState(false);

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState('');

  const [
    paymentMonths,
    setPaymentMonths,
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
  ] = useState('');

  const [
    showPaymentForm,
    setShowPaymentForm,
  ] = useState(false);


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

  const pendingPayment =
    details?.pendingPayment || null;

  const pendingPaymentStatus =
    String(
      pendingPayment?.status || ''
    ).toLowerCase();

  const hasPendingPayment =
    pendingPaymentStatus === 'pending';

  const hasRejectedPayment =
    pendingPaymentStatus === 'rejected';


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
  } else if (hasPendingPayment) {
    paymentLabel =
      'VERIFICATION PENDING';
  }


  /* =====================================================
     PICK PAYMENT SCREENSHOT
  ===================================================== */

  const choosePaymentProof = async () => {

    try {

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        !permission.granted
      ) {

        Alert.alert(
          'Permission required',
          'Please allow photo library access to attach your payment screenshot.'
        );

        return;
      }


      const result =
        await ImagePicker.launchImageLibraryAsync({

          mediaTypes:
            ['images'],

          allowsEditing: true,

          quality: 0.8,

          base64: false,

        });


      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }


      const asset =
        result.assets[0];


      const manipulated =
        await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            {
              resize: {
                width: Math.min(
                  asset.width || 1200,
                  1200
                ),
              },
            },
          ],
          {
            compress: 0.72,
            format:
              ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );


      if (
        !manipulated.base64
      ) {

        Alert.alert(
          'Screenshot error',
          'Unable to prepare the selected screenshot.'
        );

        return;
      }


      const data =
        `data:image/jpeg;base64,${manipulated.base64}`;


      setPaymentProof({
        data,
        contentType: 'image/jpeg',
        fileName:
          'payment-proof.jpg',
      });

      setProofPreview(
        manipulated.uri
      );

    } catch (error) {

      console.error(
        'PAYMENT PROOF PICK ERROR:',
        error
      );

      Alert.alert(
        'Screenshot error',
        'Unable to select the payment screenshot.'
      );

    }

  };


  /* =====================================================
     REMOVE SCREENSHOT
  ===================================================== */

  const removePaymentProof = () => {

    setPaymentProof(null);
    setProofPreview('');

  };


  /* =====================================================
     OPEN PAYMENT FORM
  ===================================================== */

  const openPaymentForm = () => {

    if (hasPendingPayment) {
      return;
    }

    if (isPaid && !hasRejectedPayment) {

      Alert.alert(
        'Payment already verified',
        'Your current payment has already been verified by the administrator.'
      );

      return;
    }

    setShowPaymentForm(true);

  };


  /* =====================================================
     SUBMIT PAYMENT
  ===================================================== */

  const submitPayment = async () => {

    const amount =
      Number(
        String(paymentAmount)
          .replace(/,/g, '')
          .trim()
      );

    const months =
      Number(
        String(paymentMonths)
          .trim()
      );

    const transactionId =
      paymentTransactionId.trim();

    const note =
      paymentNote.trim();


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      Alert.alert(
        'Amount required',
        'Please enter a valid payment amount.'
      );

      return;
    }


    if (
      !Number.isInteger(months) ||
      months < 1 ||
      months > 24
    ) {

      Alert.alert(
        'Invalid months',
        'Please enter a number of months between 1 and 24.'
      );

      return;
    }


    if (!transactionId) {

      Alert.alert(
        'Transaction ID required',
        'Please enter your UTR or transaction ID.'
      );

      return;
    }


    if (
      transactionId.length > 120
    ) {

      Alert.alert(
        'Transaction ID too long',
        'Transaction ID must be 120 characters or less.'
      );

      return;
    }


    if (
      note.length > 500
    ) {

      Alert.alert(
        'Note too long',
        'Payment note must be 500 characters or less.'
      );

      return;
    }


    if (!paymentProof?.data) {

      Alert.alert(
        'Screenshot required',
        'Please attach your payment screenshot.'
      );

      return;
    }


    try {

      setSubmittingPayment(true);


      const response =
        await api.post(
          '/auth/payment/submit',
          {
            amount,
            monthsPaid: months,
            transactionId,
            note,
            paymentProof: {
              data:
                paymentProof.data,
              contentType:
                paymentProof.contentType ||
                'image/jpeg',
              fileName:
                paymentProof.fileName ||
                'payment-proof.jpg',
            },
          }
        );


      console.log(
        'PAYMENT SUBMITTED:',
        response?.data
      );


      Alert.alert(
        'Payment submitted',
        'Your payment has been submitted successfully. The administrator will verify it shortly.',
        [
          {
            text: 'OK',
            onPress: async () => {

              setPaymentAmount('');
              setPaymentMonths('1');
              setPaymentTransactionId('');
              setPaymentNote('');
              setPaymentProof(null);
              setProofPreview('');
              setShowPaymentForm(false);

              await loadDetails({
                refresh: true,
              });

            },
          },
        ]
      );


    } catch (error) {

      console.error(
        'PAYMENT SUBMIT ERROR:',
        error?.response?.data ||
        error?.message ||
        error
      );


      const message =
        error?.response?.data?.message ||
        'Unable to submit payment right now. Please try again.';


      Alert.alert(
        'Payment submission failed',
        message
      );

    } finally {

      setSubmittingPayment(false);

    }

  };


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
                        : hasPendingPayment
                          ? styles.pendingVerificationValue
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
                DOCTOR PAYMENT ACTION
            ================================================= */}

            <SectionTitle
              eyebrow="MAKE A PAYMENT"
              title="Payment submission"
            />


            {hasPendingPayment ? (

              <View
                style={
                  styles.pendingPaymentCard
                }
              >

                <View
                  style={
                    styles.pendingPaymentIcon
                  }
                >
                  <Text
                    style={
                      styles.pendingPaymentIconText
                    }
                  >
                    ⏳
                  </Text>
                </View>


                <View
                  style={
                    styles.pendingPaymentContent
                  }
                >

                  <Text
                    style={
                      styles.pendingPaymentTitle
                    }
                  >
                    Payment Verification Pending
                  </Text>


                  <Text
                    style={
                      styles.pendingPaymentText
                    }
                  >
                    Your payment has been submitted and is waiting for administrator verification.
                  </Text>


                  <View
                    style={
                      styles.pendingMetaGrid
                    }
                  >

                    <PendingMeta
                      label="AMOUNT"
                      value={
                        formatMoney(
                          pendingPayment?.amount
                        )
                      }
                    />

                    <PendingMeta
                      label="COVERAGE"
                      value={
                        `${pendingPayment?.monthsPaid || 1} ${
                          Number(
                            pendingPayment?.monthsPaid || 1
                          ) === 1
                            ? 'month'
                            : 'months'
                        }`
                      }
                    />

                    <PendingMeta
                      label="TRANSACTION"
                      value={
                        pendingPayment?.transactionId ||
                        '—'
                      }
                    />

                    <PendingMeta
                      label="SUBMITTED"
                      value={
                        formatDate(
                          pendingPayment?.submittedAt
                        )
                      }
                    />

                  </View>

                </View>

              </View>

            ) : hasRejectedPayment ? (

              <View
                style={
                  styles.rejectedPaymentCard
                }
              >

                <View
                  style={
                    styles.rejectedPaymentTop
                  }
                >

                  <View
                    style={
                      styles.rejectedIcon
                    }
                  >
                    <Text
                      style={
                        styles.rejectedIconText
                      }
                    >
                      !
                    </Text>
                  </View>


                  <View
                    style={
                      styles.rejectedContent
                    }
                  >

                    <Text
                      style={
                        styles.rejectedTitle
                      }
                    >
                      Payment Rejected
                    </Text>


                    <Text
                      style={
                        styles.rejectedText
                      }
                    >
                      The administrator rejected your previous payment submission. Please review the note and submit again.
                    </Text>

                  </View>

                </View>


                {pendingPayment?.adminNote ? (

                  <View
                    style={
                      styles.adminNoteBox
                    }
                  >

                    <Text
                      style={
                        styles.adminNoteLabel
                      }
                    >
                      ADMIN NOTE
                    </Text>


                    <Text
                      style={
                        styles.adminNoteText
                      }
                    >
                      {pendingPayment.adminNote}
                    </Text>

                  </View>

                ) : null}


                <Pressable
                  onPress={() => {
                    setPaymentAmount(
                      pendingPayment?.amount
                        ? String(
                            pendingPayment.amount
                          )
                        : ''
                    );

                    setPaymentMonths(
                      pendingPayment?.monthsPaid
                        ? String(
                            pendingPayment.monthsPaid
                          )
                        : '1'
                    );

                    setPaymentTransactionId(
                      pendingPayment?.transactionId ||
                      ''
                    );

                    setPaymentNote(
                      pendingPayment?.note ||
                      ''
                    );

                    setPaymentProof(null);
                    setProofPreview('');
                    setShowPaymentForm(true);
                  }}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed &&
                      styles.primaryButtonPressed,
                  ]}
                >

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Submit Payment Again
                  </Text>

                </Pressable>

              </View>

            ) : (

              <View
                style={
                  styles.makePaymentCard
                }
              >

                <View
                  style={
                    styles.makePaymentIcon
                  }
                >
                  <Text
                    style={
                      styles.makePaymentIconText
                    }
                  >
                    ₹
                  </Text>
                </View>


                <View
                  style={
                    styles.makePaymentContent
                  }
                >

                  <Text
                    style={
                      styles.makePaymentTitle
                    }
                  >
                    {isPaid
                      ? 'Submit another payment'
                      : 'Complete your payment'}
                  </Text>


                  <Text
                    style={
                      styles.makePaymentText
                    }
                  >
                    Add your payment amount, UTR or transaction ID and screenshot. The payment will be verified by the administrator before your billing record is updated.
                  </Text>


                  <Pressable
                    onPress={openPaymentForm}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed &&
                        styles.primaryButtonPressed,
                    ]}
                  >

                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      {isPaid
                        ? 'Make Payment'
                        : 'Pay & Submit Proof'}
                    </Text>

                  </Pressable>

                </View>

              </View>

            )}


            {/* =================================================
                PAYMENT FORM
            ================================================= */}

            {showPaymentForm &&
            !hasPendingPayment ? (

              <Card>

                <View
                  style={
                    styles.paymentForm
                  }
                >

                  <View
                    style={
                      styles.formHeader
                    }
                  >

                    <View>
                      <Text
                        style={
                          styles.formEyebrow
                        }
                      >
                        PAYMENT SUBMISSION
                      </Text>

                      <Text
                        style={
                          styles.formTitle
                        }
                      >
                        Payment details
                      </Text>
                    </View>


                    <Pressable
                      onPress={() =>
                        setShowPaymentForm(false)
                      }
                      style={
                        styles.closeFormButton
                      }
                    >
                      <Text
                        style={
                          styles.closeFormText
                        }
                      >
                        ×
                      </Text>
                    </Pressable>

                  </View>


                  <View
                    style={[
                      styles.formGrid,
                      isTablet &&
                        styles.formGridTablet,
                    ]}
                  >

                    <FormField
                      label="AMOUNT"
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChangeText={
                        setPaymentAmount
                      }
                      keyboardType="numeric"
                    />


                    <FormField
                      label="MONTHS"
                      placeholder="1"
                      value={paymentMonths}
                      onChangeText={
                        setPaymentMonths
                      }
                      keyboardType="numeric"
                    />

                  </View>


                  <FormField
                    label="UTR / TRANSACTION ID"
                    placeholder="Enter UTR or transaction ID"
                    value={
                      paymentTransactionId
                    }
                    onChangeText={
                      setPaymentTransactionId
                    }
                    autoCapitalize="characters"
                  />


                  <FormField
                    label="NOTE (OPTIONAL)"
                    placeholder="Add payment note"
                    value={
                      paymentNote
                    }
                    onChangeText={
                      setPaymentNote
                    }
                    multiline
                    numberOfLines={3}
                  />


                  {/* SCREENSHOT */}

                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    PAYMENT SCREENSHOT
                  </Text>


                  {proofPreview ? (

                    <View
                      style={
                        styles.proofPreviewBox
                      }
                    >

                      <Image
                        source={{
                          uri:
                            proofPreview,
                        }}
                        style={
                          styles.proofImage
                        }
                        resizeMode="cover"
                      />


                      <View
                        style={
                          styles.proofActions
                        }
                      >

                        <Text
                          style={
                            styles.proofAttachedText
                          }
                        >
                          Screenshot attached
                        </Text>


                        <Pressable
                          onPress={
                            removePaymentProof
                          }
                          style={
                            styles.removeProofButton
                          }
                        >

                          <Text
                            style={
                              styles.removeProofText
                            }
                          >
                            Remove
                          </Text>

                        </Pressable>

                      </View>

                    </View>

                  ) : (

                    <Pressable
                      onPress={
                        choosePaymentProof
                      }
                      style={({ pressed }) => [
                        styles.uploadBox,
                        pressed &&
                          styles.uploadBoxPressed,
                      ]}
                    >

                      <View
                        style={
                          styles.uploadIcon
                        }
                      >
                        <Text
                          style={
                            styles.uploadIconText
                          }
                        >
                          +
                        </Text>
                      </View>


                      <Text
                        style={
                          styles.uploadTitle
                        }
                      >
                        Attach payment screenshot
                      </Text>


                      <Text
                        style={
                          styles.uploadText
                        }
                      >
                        JPG, PNG or WEBP screenshot
                      </Text>

                    </Pressable>

                  )}


                  <View
                    style={
                      styles.formSecurity
                    }
                  >

                    <Text
                      style={
                        styles.formSecurityIcon
                      }
                    >
                      ✓
                    </Text>


                    <Text
                      style={
                        styles.formSecurityText
                      }
                    >
                      Your payment is only marked verified after administrator approval.
                    </Text>

                  </View>


                  <Pressable
                    onPress={
                      submitPayment
                    }
                    disabled={
                      submittingPayment
                    }
                    style={({ pressed }) => [
                      styles.submitPaymentButton,
                      submittingPayment &&
                        styles.submitPaymentDisabled,
                      pressed &&
                        !submittingPayment &&
                        styles.primaryButtonPressed,
                    ]}
                  >

                    {submittingPayment ? (

                      <ActivityIndicator
                        color="#FFFFFF"
                        size="small"
                      />

                    ) : (

                      <Text
                        style={
                          styles.submitPaymentText
                        }
                      >
                        Submit Payment for Verification
                      </Text>

                    )}

                  </Pressable>

                </View>

              </Card>

            ) : null}


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
                  hasPendingPayment
                    ? 'Verification Pending'
                    : isPaid
                      ? 'Paid / Verified'
                      : formatStatus(
                          paymentStatus
                        )
                }
                tone={
                  isPaid
                    ? 'success'
                    : hasPendingPayment
                      ? 'info'
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
                    once a payment is verified.
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
   FORM FIELD
===================================================== */

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline,
  numberOfLines,
  autoCapitalize,
}) {

  return (
    <View
      style={
        styles.formField
      }
    >

      <Text
        style={
          styles.formLabel
        }
      >
        {label}
      </Text>


      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={
          keyboardType || 'default'
        }
        multiline={Boolean(multiline)}
        numberOfLines={
          numberOfLines || 1
        }
        autoCapitalize={
          autoCapitalize || 'sentences'
        }
        style={[
          styles.input,
          multiline &&
            styles.textArea,
        ]}
      />

    </View>
  );
}


/* =====================================================
   PENDING META
===================================================== */

function PendingMeta({
  label,
  value,
}) {

  return (
    <View
      style={
        styles.pendingMeta
      }
    >

      <Text
        style={
          styles.pendingMetaLabel
        }
      >
        {label}
      </Text>


      <Text
        style={
          styles.pendingMetaValue
        }
        numberOfLines={2}
      >
        {value}
      </Text>

    </View>
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

  return (
    <View
      style={[
        styles.infoBlock,
        tone === 'success' &&
          styles.infoSuccess,
        tone === 'warning' &&
          styles.infoWarning,
        tone === 'info' &&
          styles.infoInfo,
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
          tone === 'info' &&
            styles.infoValueInfo,
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
   MONEY FORMAT
===================================================== */

function formatMoney(value) {

  const amount =
    Number(value || 0);

  return `₹${amount.toLocaleString(
    'en-IN'
  )}`;
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

  scrollContent: {
    paddingBottom: 8,
  },

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

  pendingVerificationValue: {
    color: '#60A5FA',
  },

  metricDivider: {
    width: 1,
    height: 29,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 14,
  },

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

  /* PAYMENT ACTION */

  makePaymentCard: {
    flexDirection: 'row',
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#D9E8FF',
    borderRadius: 19,
    padding: 14,
    marginBottom: 17,
  },

  makePaymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E4EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  makePaymentIconText: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '900',
  },

  makePaymentContent: {
    flex: 1,
    minWidth: 0,
  },

  makePaymentTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  makePaymentText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.blue,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginTop: 11,
  },

  primaryButtonPressed: {
    opacity: 0.68,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },

  pendingPaymentCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 19,
    padding: 14,
    marginBottom: 17,
  },

  pendingPaymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  pendingPaymentIconText: {
    fontSize: 17,
  },

  pendingPaymentContent: {
    flex: 1,
    minWidth: 0,
  },

  pendingPaymentTitle: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '900',
  },

  pendingPaymentText: {
    color: '#526B89',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  pendingMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginHorizontal: -4,
  },

  pendingMeta: {
    minWidth: 105,
    flex: 1,
    paddingHorizontal: 4,
    marginBottom: 6,
  },

  pendingMetaLabel: {
    color: '#7890AA',
    fontSize: 6.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  pendingMetaValue: {
    color: '#1E3A5F',
    fontSize: 8.5,
    fontWeight: '900',
    marginTop: 3,
  },

  rejectedPaymentCard: {
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 19,
    padding: 14,
    marginBottom: 17,
  },

  rejectedPaymentTop: {
    flexDirection: 'row',
  },

  rejectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  rejectedIconText: {
    color: '#E11D48',
    fontSize: 18,
    fontWeight: '900',
  },

  rejectedContent: {
    flex: 1,
    minWidth: 0,
  },

  rejectedTitle: {
    color: '#9F1239',
    fontSize: 13,
    fontWeight: '900',
  },

  rejectedText: {
    color: '#7F5260',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  adminNoteBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5D0D7',
    borderRadius: 11,
    padding: 10,
    marginTop: 11,
  },

  adminNoteLabel: {
    color: '#9F1239',
    fontSize: 6.5,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  adminNoteText: {
    color: '#4C2632',
    fontSize: 9,
    lineHeight: 15,
    marginTop: 4,
  },

  /* FORM */

  paymentForm: {
    paddingBottom: 2,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  formEyebrow: {
    color: colors.blue,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  formTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },

  closeFormButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeFormText: {
    color: '#64748B',
    fontSize: 21,
    lineHeight: 21,
  },

  formGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },

  formGridTablet: {
    marginHorizontal: -5,
  },

  formGridTablet: {
    flexDirection: 'row',
  },

  formField: {
    flex: 1,
    minWidth: 0,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  formLabel: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  input: {
    minHeight: 43,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DCE6F0',
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },

  textArea: {
    minHeight: 75,
    textAlignVertical: 'top',
  },

  uploadBox: {
    minHeight: 125,
    borderWidth: 1,
    borderColor: '#BDD2F2',
    borderStyle: 'dashed',
    backgroundColor: '#F8FBFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 13,
    marginBottom: 12,
  },

  uploadBoxPressed: {
    opacity: 0.65,
  },

  uploadIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  uploadIconText: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: '700',
  },

  uploadTitle: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },

  uploadText: {
    color: colors.muted,
    fontSize: 7.5,
    marginTop: 3,
  },

  proofPreviewBox: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE6F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },

  proofImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#E2E8F0',
  },

  proofActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
  },

  proofAttachedText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '900',
  },

  removeProofButton: {
    backgroundColor: '#FFF1F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  removeProofText: {
    color: '#E11D48',
    fontSize: 7,
    fontWeight: '900',
  },

  formSecurity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#D7F4E8',
    borderRadius: 11,
    padding: 9,
    marginBottom: 11,
  },

  formSecurityIcon: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '900',
    marginRight: 7,
  },

  formSecurityText: {
    flex: 1,
    color: '#4D7C65',
    fontSize: 7.5,
    lineHeight: 13,
  },

  submitPaymentButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  submitPaymentDisabled: {
    opacity: 0.65,
  },

  submitPaymentText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  /* INFO */

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

  infoSuccess: {},
  infoWarning: {},
  infoInfo: {},

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

  infoValueInfo: {
    color: '#2563EB',
  },

  /* TIMELINE */

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

  /* REQUEST */

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

  /* HISTORY */

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

  /* SECURITY */

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