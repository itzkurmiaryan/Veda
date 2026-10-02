import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/UI';
import styles from './AdminDashboardStyles';

export function KpiCard({
  number,
  label,
  smallLabel,
  type,
  onPress,
}) {
  let iconBackground = '#EAF3FF';
  let iconColor = '#3478C8';
  let icon = 'DR';

  if (type === 'green') {
    iconBackground = '#E8F8F1';
    iconColor = '#1D9A70';
    icon = '✓';
  }

  if (type === 'orange') {
    iconBackground = '#FFF4DF';
    iconColor = '#C48622';
    icon = '!';
  }

  if (type === 'purple') {
    iconBackground = '#F0EBFF';
    iconColor = '#7557C8';
    icon = 'PT';
  }

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.kpiCard,
        onPress && styles.kpiCardClickable,
        pressed && onPress && styles.pressed,
      ]}
    >
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
          {icon}
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
    </Pressable>
  );
}

export function DoctorDirectoryRow({
  doctor,
  onPress,
}) {
  const name = doctor?.name || 'Doctor';
  const active =
    doctor?.accessActive !== false &&
    doctor?.active !== false;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.directoryRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.directoryAvatar}>
        <Text style={styles.directoryAvatarText}>
          {name.trim().charAt(0).toUpperCase() || 'D'}
        </Text>
      </View>
      <View style={styles.directoryIdentity}>
        <Text style={styles.directoryName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.directoryEmail} numberOfLines={1}>
          {doctor?.email || 'No email'}
        </Text>
      </View>
      <View style={styles.directoryStatuses}>
        <Text
          style={[
            styles.directoryStatus,
            active
              ? styles.directoryStatusActive
              : styles.directoryStatusInactive,
          ]}
        >
          {active ? 'ACTIVE' : 'DISABLED'}
        </Text>
        <Text
          style={[
            styles.directoryPayment,
            doctor?.paymentStatus === 'paid'
              ? styles.directoryPaymentPaid
              : styles.directoryPaymentDue,
          ]}
        >
          {doctor?.paymentStatus === 'paid' ? 'PAID' : 'DUE'}
        </Text>
      </View>
      <Text style={styles.doctorTargetArrow}>›</Text>
    </Pressable>
  );
}

/* ================================================================
   NOTIFICATION
================================================================ */

export function NotificationRow({
  type,
  title,
  text,
  createdAt,
  onDelete,
}) {
  const payment =
    type === 'payment';

  const access =
    type === 'access';

  return (
    <View
      style={
        styles.notificationRow
      }
    >
      <View
        style={[
          styles.notificationIcon,
          payment
            ? styles.notificationPayment
            : access
              ? styles.notificationAccess
              : styles.notificationInfo,
        ]}
      >
        <Text
          style={[
            styles.notificationIconText,
            payment
              ? styles.notificationPaymentText
              : access
                ? styles.notificationAccessText
                : styles.notificationInfoText,
          ]}
        >
          {payment
            ? '₹'
            : access
              ? '!'
              : 'i'}
        </Text>
      </View>

      <View
        style={
          styles.notificationContent
        }
      >
        <Text
          style={
            styles.notificationTitle
          }
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text
          style={
            styles.notificationText
          }
          numberOfLines={3}
        >
          {text}
        </Text>

        {createdAt ? (
          <Text style={styles.notificationDate}>
            {formatLocalDate(createdAt)}
          </Text>
        ) : null}
      </View>

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
          onPress={onDelete}
          hitSlop={8}
          style={styles.notificationDelete}
        >
          <Text style={styles.notificationDeleteText}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ================================================================
   ACCESS REQUEST CARD
================================================================ */

export function AccessRequestCard({
  request,
  index,
  total,
  actionLoading,
  onApprove,
  onReject,
  onViewProof,
  onMarkPaid,
}) {
  const doctor =
    request?.doctorId || {};

  const initial =
    doctor?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    doctor?.email
      ?.charAt(0)
      ?.toUpperCase() ||
    'D';

  const status =
    request?.status ||
    'pending';

  return (
    <View
      style={[
        styles.accessRequestItem,
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
            style={
              styles.requestAvatarText
            }
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
            {doctor?.name ||
              'Doctor'}
          </Text>

          <Text
            style={styles.requestEmail}
            numberOfLines={1}
          >
            {doctor?.email ||
              'No email'}
          </Text>
        </View>

        <View
          style={
            styles.accessPendingBadge
          }
        >
          <Text
            style={
              styles.accessPendingText
            }
          >
            {String(
              status
            ).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text
        style={styles.accessRequestText}
      >
        {request?.message ||
          'Doctor has requested access to the Veda workspace.'}
      </Text>

      {request?.paymentProof?.available ? (
        <View style={styles.paymentProofActions}>
          <Pressable
            onPress={onViewProof}
            disabled={actionLoading}
            style={({ pressed }) => [
              styles.proofViewButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.proofViewIcon}>▧</Text>
            <Text style={styles.proofViewText}>
              View payment screenshot
            </Text>
          </Pressable>

          {doctor?.paymentStatus !== 'paid' && (
            <View style={styles.proofPaidButton}>
              <Button
                title="Mark payment paid"
                onPress={onMarkPaid}
                disabled={actionLoading}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.proofMissing}>
          <Text style={styles.proofMissingText}>
            No payment screenshot attached
          </Text>
        </View>
      )}

      <View
        style={
          styles.requestButtons
        }
      >
        <View
          style={styles.buttonHalf}
        >
          <Button
            title="Approve"
            onPress={onApprove}
            disabled={
              actionLoading ||
              status !==
                'pending'
            }
          />
        </View>

        <View
          style={styles.buttonHalf}
        >
          <Button
            title="Reject"
            danger
            onPress={onReject}
            disabled={
              actionLoading ||
              status !==
                'pending'
            }
          />
        </View>
      </View>
    </View>
  );
}

/* ================================================================
   REGISTRATION REQUEST
================================================================ */

export function RequestCard({
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
      ?.toUpperCase() ||
    'D';

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
            style={
              styles.requestAvatarText
            }
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
            {request?.name ||
              'Doctor'}
          </Text>

          <Text
            style={styles.requestEmail}
            numberOfLines={1}
          >
            {request?.email ||
              'No email'}
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
          style={
            styles.specializationLabel
          }
        >
          SPECIALIZATION
        </Text>

        <Text
          style={
            styles.specializationValue
          }
        >
          {request?.specialization ||
            'Doctor'}
        </Text>
      </View>

      <View
        style={styles.requestButtons}
      >
        <View
          style={styles.buttonHalf}
        >
          <Button
            title="Approve"
            onPress={onApprove}
            disabled={
              actionLoading
            }
          />
        </View>

        <View
          style={styles.buttonHalf}
        >
          <Button
            title="Reject"
            danger
            onPress={onReject}
            disabled={
              actionLoading
            }
          />
        </View>
      </View>
    </View>
  );
}

/* ================================================================
   DOCTOR CARD
================================================================ */

export function DoctorCard({
  doctorItem,
  showManagementActions = false,
  accessRequest,
  index,
  total,
  actionLoading,
  isConfirming,
  isDeleting,
  deleteError,
  onView,
  onAccess,
  onPaymentRequest,
  onPaymentPaid,
  onViewPaymentHistory,
  onViewPaymentProof,
  onMarkRequestPaid,
  onApproveAccessRequest,
  onDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const initial =
    doctorItem?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    'D';

  const active =
    typeof doctorItem?.accessActive ===
    'boolean'
      ? doctorItem.accessActive
      : doctorItem?.active !== false;

  const paymentStatus =
    doctorItem?.paymentStatus ||
    'pending';

  const daysUsed =
    typeof doctorItem?.daysUsed ===
    'number'
      ? doctorItem.daysUsed
      : calculateLocalDays(
          doctorItem
        );

  const startDate =
    doctorItem?.accessStartDate ||
    doctorItem?.registrationDate ||
    doctorItem?.createdAt;

  const nextPaymentDate =
    doctorItem?.nextPaymentDate;

  const paymentRequested =
    doctorItem?.paymentReminderRequested ===
    true;

  const paymentRequestCoolingDown =
    isPaymentRequestCoolingDown(
      doctorItem
    );

  const paymentDue =
    paymentStatus !== 'paid' &&
    (
      paymentRequested ||
      isDateDue(nextPaymentDate)
    );

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
            style={
              styles.doctorAvatarText
            }
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
            {doctorItem?.name ||
              'Doctor'}
          </Text>

          <Text
            style={styles.doctorEmail}
            numberOfLines={1}
          >
            {doctorItem?.email ||
              'No email'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            active
              ? styles.activeBadge
              : styles.removedBadge,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              active
                ? styles.activeDot
                : styles.removedDot,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              active
                ? styles.activeText
                : styles.removedText,
            ]}
          >
            {active
              ? 'ACTIVE'
              : 'REMOVED'}
          </Text>
        </View>
      </View>

      {/* ACCESS / PAYMENT SUMMARY */}

      <View
        style={styles.doctorMetaGrid}
      >
        <MetaBox
          label="ACCESS START"
          value={
            formatLocalDate(
              startDate
            )
          }
        />

        <MetaBox
          label="DAYS USED"
          value={`${daysUsed} days`}
        />

        <MetaBox
          label="PAYMENT"
          value={
            paymentStatus ===
            'paid'
              ? 'PAID'
              : paymentDue
                ? 'DUE'
                : 'PENDING'
          }
          valueStyle={
            paymentStatus === 'paid'
              ? styles.paidValue
              : paymentDue
                ? styles.dueValue
                : styles.pendingValue
          }
        />

        <MetaBox
          label="NEXT PAYMENT"
          value={
            nextPaymentDate
              ? formatLocalDate(
                  nextPaymentDate
                )
              : 'Not set'
          }
        />
      </View>

      {showManagementActions &&
        doctorItem.paymentHistory?.length > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={onViewPaymentHistory}
          style={styles.paymentHistoryLink}
        >
          <Text style={styles.paymentHistoryLinkText}>
            Payment history ({doctorItem.paymentHistory.length})
          </Text>
        </Pressable>
      )}

      {/* PAYMENT REQUESTED / DUE */}

      {showManagementActions && paymentDue && (
        <View
          style={
            styles.paymentDueBox
          }
        >
          <View
            style={
              styles.paymentDueIcon
            }
          >
            <Text
              style={
                styles.paymentDueIconText
              }
            >
              ₹
            </Text>
          </View>

          <View
            style={
              styles.paymentDueContent
            }
          >
            <Text
              style={
                styles.paymentDueTitle
              }
            >
              {paymentRequested
                ? 'Payment request sent'
                : 'Payment verification required'}
            </Text>

            <Text
              style={
                styles.paymentDueText
              }
            >
              {paymentRequested
                ? 'The doctor has been notified that monthly payment verification is required.'
                : 'Verify payment before restoring or continuing the doctor access.'}
            </Text>
          </View>
        </View>
      )}

      {showManagementActions && accessRequest && (
        <View style={styles.profileRequestBox}>
          <View style={styles.profileRequestHeader}>
            <View style={styles.profileRequestDot} />
            <Text style={styles.profileRequestTitle}>
              ACCESS REQUEST PENDING
            </Text>
          </View>
          <Text style={styles.profileRequestMessage}>
            {accessRequest.message ||
              'This doctor has requested access.'}
          </Text>
          {accessRequest.paymentProof?.available ? (
            <Pressable
              onPress={onViewPaymentProof}
              disabled={actionLoading}
              style={({ pressed }) => [
                styles.profileProofButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.profileProofText}>
                View attached payment screenshot  →
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.profileProofMissing}>
              No payment screenshot attached
            </Text>
          )}
          <View style={styles.profileRequestActions}>
            <View style={styles.profileRequestAction}>
              <Button
                title={
                  paymentStatus === 'paid'
                    ? 'Change payment status'
                    : 'Mark paid'
                }
                secondary={paymentStatus === 'paid'}
                onPress={onMarkRequestPaid}
                disabled={actionLoading}
              />
            </View>
            <View style={styles.profileRequestAction}>
              <Button
                title="Approve access"
                onPress={onApproveAccessRequest}
                disabled={actionLoading}
              />
            </View>
          </View>
        </View>
      )}

      {/* ANALYTICS */}

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
            style={
              styles.analyticsIconText
            }
          >
            ↗
          </Text>
        </View>

        <View
          style={styles.analyticsText}
        >
          <Text
            style={
              styles.analyticsTitle
            }
          >
            Analytics & profile
          </Text>

          <Text
            style={
              styles.analyticsSubtitle
            }
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

      {/* PAYMENT ACTIONS */}

      {showManagementActions && !isConfirming && (
        <View
          style={
            styles.paymentActions
          }
        >
          <View
            style={styles.actionButton}
          >
            <Button
              title={
                paymentStatus ===
                'paid'
                  ? 'Paid'
                  : paymentRequestCoolingDown
                    ? 'Request sent'
                    : paymentRequested
                      ? 'Request again'
                    : 'Payment request'
              }
              secondary={
                paymentStatus ===
                'paid'
              }
              onPress={
                paymentStatus ===
                'paid' ||
                paymentRequestCoolingDown
                  ? undefined
                  : onPaymentRequest
              }
              disabled={
                actionLoading ||
                paymentStatus ===
                  'paid' ||
                paymentRequestCoolingDown
              }
            />
          </View>

          <View
            style={styles.actionButton}
          >
            <Button
              title={
                paymentStatus === 'paid'
                  ? 'Manage payment'
                  : 'Mark paid'
              }
              onPress={
                onPaymentPaid
              }
              disabled={
                actionLoading
              }
            />
          </View>
        </View>
      )}

      {/* ACCESS / DELETE */}

      {showManagementActions && (
        !isConfirming ? (
        <View
          style={
            styles.doctorActions
          }
        >
          <View
            style={styles.actionButton}
          >
            <Button
              title={
                active
                  ? 'Remove access'
                  : 'Restore access'
              }
              secondary
              onPress={onAccess}
              disabled={
                actionLoading
              }
            />
          </View>

          <View
            style={styles.actionButton}
          >
            <Button
              title="Delete"
              danger
              onPress={onDelete}
              disabled={
                actionLoading
              }
            />
          </View>
        </View>
        ) : (
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
                style={
                  styles.warningText
                }
              >
                !
              </Text>
            </View>

            <View
              style={
                styles.deleteHeaderText
              }
            >
              <Text
                style={styles.deleteTitle}
              >
                Delete doctor?
              </Text>

              <Text
                style={
                  styles.deleteSubtitle
                }
              >
                This action is permanent.
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.deleteDescription
            }
          >
            The doctor, associated patients,
            visits and prescriptions will be
            permanently removed.
          </Text>

          <View
            style={
              styles.deleteActions
            }
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
                onPress={
                  onCancelDelete
                }
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
              style={
                styles.deleteProgress
              }
            >
              Removing doctor and related
              records...
            </Text>
          ) : null}

          {deleteError ? (
            <Text
              style={
                styles.deleteError
              }
            >
              {deleteError}
            </Text>
          ) : null}
        </View>
        )
      )}
    </View>
  );
}

export function PaymentEntryModal({
  visible,
  doctor,
  amount,
  note,
  mode,
  transactionId,
  monthsPaid,
  paymentProof,
  busy,
  onModeChange,
  onAmountChange,
  onNoteChange,
  onTransactionIdChange,
  onMonthsPaidChange,
  onPickProof,
  onRemoveProof,
  onCancel,
  onSubmit,
  onMarkUnpaid,
}) {
  const validAmount =
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0;
  const validMonthsPaid =
    Number.isInteger(Number(monthsPaid)) &&
    Number(monthsPaid) >= 1 &&
    Number(monthsPaid) <= 24;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.proofOverlay}>
        <View style={styles.proofModal}>
          <View style={styles.proofHeader}>
            <View style={styles.proofHeaderText}>
              <Text style={styles.proofEyebrow}>
                PAYMENT RECORD
              </Text>
              <Text style={styles.proofTitle}>
                {doctor?.name || 'Record payment'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close payment form"
              onPress={onCancel}
              style={styles.proofClose}
            >
              <Text style={styles.proofCloseText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.paymentFormScroll}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.paymentModeRow}>
            {[
              ['paid', 'Paid'],
              ['unpaid', 'Unpaid'],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === value }}
                onPress={() => onModeChange(value)}
                style={[
                  styles.paymentModeButton,
                  mode === value && styles.paymentModeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.paymentModeText,
                    mode === value && styles.paymentModeTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'paid' ? (
            <>
              <Text style={styles.paymentFormLabel}>
                AMOUNT RECEIVED (INR)
              </Text>
              <TextInput
                accessibilityLabel="Payment amount in rupees"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={onAmountChange}
                placeholder="e.g. 1500"
                style={styles.paymentInput}
              />

              <Text style={styles.paymentFormLabel}>
                MONTHS PAID
              </Text>
              <TextInput
                accessibilityLabel="Months paid"
                keyboardType="number-pad"
                value={monthsPaid}
                onChangeText={onMonthsPaidChange}
                maxLength={2}
                placeholder="1"
                style={styles.paymentInput}
              />

              <Text style={styles.paymentFormLabel}>
                TRANSACTION ID (OPTIONAL)
              </Text>
              <TextInput
                accessibilityLabel="Transaction ID"
                value={transactionId}
                onChangeText={onTransactionIdChange}
                maxLength={120}
                placeholder="Enter transaction reference"
                style={styles.paymentInput}
              />

              <Text style={styles.paymentFormLabel}>
                ADMIN NOTE (OPTIONAL)
              </Text>
              <TextInput
                accessibilityLabel="Payment note"
                value={note}
                onChangeText={onNoteChange}
                placeholder="Method or other details"
                multiline
                maxLength={500}
                style={[
                  styles.paymentInput,
                  styles.paymentNoteInput,
                ]}
              />

              <Pressable
                accessibilityRole="button"
                onPress={onPickProof}
                disabled={busy}
                style={styles.paymentProofPicker}
              >
                <Text style={styles.paymentProofPickerText}>
                  {paymentProof ? 'Replace screenshot' : 'Attach screenshot (optional)'}
                </Text>
              </Pressable>

              {paymentProof ? (
                <View style={styles.paymentProofPreview}>
                  <Image
                    source={{ uri: paymentProof.uri }}
                    resizeMode="cover"
                    style={styles.paymentProofThumbnail}
                  />
                  <Text style={styles.paymentProofName} numberOfLines={1}>
                    {paymentProof.fileName}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove screenshot"
                    onPress={onRemoveProof}
                  >
                    <Text style={styles.paymentProofRemove}>Remove</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : mode === 'unpaid' ? (
            <Text style={styles.paymentUnpaidMessage}>
              No payment record will be added. The doctor will remain unpaid.
            </Text>
          ) : (
            <Text style={styles.paymentUnpaidMessage}>
              Choose Paid to enter payment details or Unpaid to keep the balance due.
            </Text>
          )}
          </ScrollView>

          <View style={styles.paymentEntryActions}>
            <View style={styles.paymentEntryAction}>
              <Button
                title={mode === 'unpaid' ? 'Cancel' : 'Close'}
                secondary
                onPress={onCancel}
                disabled={busy}
              />
            </View>
            <View style={styles.paymentEntryAction}>
              <Button
                title={
                  busy
                    ? 'Saving...'
                    : mode === 'unpaid'
                      ? 'Confirm unpaid'
                      : 'Record payment'
                }
                onPress={mode === 'unpaid' ? onMarkUnpaid : onSubmit}
                disabled={
                  busy ||
                  (mode === 'paid' &&
                    (!validAmount || !validMonthsPaid)) ||
                  !mode
                }
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function PaymentHistoryModal({
  doctor,
  onClose,
  onViewProof,
  onDeleteRecord,
}) {
  const history = [
    ...(doctor?.paymentHistory || []),
  ].reverse();

  return (
    <Modal
      visible={Boolean(doctor)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.proofOverlay}>
        <View style={styles.proofModal}>
          <View style={styles.proofHeader}>
            <View style={styles.proofHeaderText}>
              <Text style={styles.proofEyebrow}>
                PAYMENT HISTORY
              </Text>
              <Text style={styles.proofTitle}>
                {doctor?.name || 'Doctor'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close payment history"
              onPress={onClose}
              style={styles.proofClose}
            >
              <Text style={styles.proofCloseText}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.paymentHistoryList}>
            {history.map((record, index) => (
              <View
                key={record._id || `${record.paidAt}-${index}`}
                style={styles.paymentHistoryRow}
              >
                <Text style={styles.paymentHistoryAmount}>
                  ₹{Number(record.amount).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.paymentHistoryDate}>
                  Paid {formatLocalDate(record.paidAt)}
                  {'  ·  '}{record.monthsPaid || 1} month(s)
                  {'  ·  '}Next due {formatLocalDate(record.nextPaymentDate)}
                </Text>
                {record.transactionId ? (
                  <Text style={styles.paymentHistoryDate}>
                    Transaction: {record.transactionId}
                  </Text>
                ) : null}
                {record.note ? (
                  <Text style={styles.paymentHistoryNote}>
                    {record.note}
                  </Text>
                ) : null}
                {record.paymentProof?.available ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onViewProof(record)}
                  >
                    <Text style={styles.paymentHistoryLinkText}>
                      View payment screenshot
                    </Text>
                  </Pressable>
                ) : null}
                {onDeleteRecord ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onDeleteRecord(record)}
                    style={styles.paymentHistoryLink}
                  >
                    <Text style={styles.paymentProofRemove}>
                      Delete payment record
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================================
   META BOX
================================================================ */

export function MetaBox({
  label,
  value,
  valueStyle,
}) {
  return (
    <View
      style={styles.metaBox}
    >
      <Text
        style={styles.metaLabel}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metaValue,
          valueStyle,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/* ================================================================
   EMPTY STATE
================================================================ */

export function EmptyState({
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
          {success
            ? '✓'
            : '—'}
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

/* ================================================================
   DATE HELPERS
================================================================ */

export function formatLocalDate(
  value
) {
  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(value);

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
}

export function isDateDue(
  value
) {
  if (!value) {
    return false;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  return date <= new Date();
}

export function isPaymentRequestCoolingDown(
  doctorItem
) {
  if (
    doctorItem?.paymentReminderRequested !==
      true ||
    !doctorItem.paymentReminderAt
  ) {
    return false;
  }

  const requestedAt =
    new Date(
      doctorItem.paymentReminderAt
    ).getTime();

  return (
    Number.isFinite(requestedAt) &&
    Date.now() - requestedAt <
      24 * 60 * 60 * 1000
  );
}

export function calculateLocalDays(
  doctorItem
) {
  const start =
    doctorItem?.accessStartDate ||
    doctorItem?.registrationDate ||
    doctorItem?.createdAt;

  if (!start) {
    return 0;
  }

  const date =
    new Date(start);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 0;
  }

  const difference =
    new Date().getTime() -
    date.getTime();

  return Math.max(
    0,
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    )
  );
}

/* ================================================================
   STYLES
================================================================ */

