import React, { useMemo } from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Card, colors } from './UI';

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
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function PaymentSummaryCard({
  doctor,
  onHistory,
  compact = false,
}) {
  const history = useMemo(() => {
    return [...(doctor?.paymentHistory || [])].sort(
      (a, b) =>
        new Date(b?.paidAt || 0) -
        new Date(a?.paidAt || 0)
    );
  }, [doctor?.paymentHistory]);

  const totalPaid = useMemo(() => {
    return history.reduce(
      (total, record) =>
        total + Number(record?.amount || 0),
      0
    );
  }, [history]);

  const totalPayments = history.length;

  const paymentStatus = String(
    doctor?.paymentStatus || 'pending'
  ).toLowerCase();

  const isPaid = paymentStatus === 'paid';

  const nextPaymentDate = doctor?.nextPaymentDate;
  const lastPaymentDate =
    doctor?.lastPaymentDate || history[0]?.paidAt;

  let daysRemaining = null;

  if (nextPaymentDate) {
    const due = new Date(nextPaymentDate);

    if (!Number.isNaN(due.getTime())) {
      daysRemaining = Math.max(
        0,
        Math.ceil(
          (due.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      );
    }
  }

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              BILLING & PAYMENTS
            </Text>

            <Text style={styles.title}>
              Payment records
            </Text>

            <Text style={styles.subtitle}>
              Complete payment history and current billing status
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isPaid
                ? styles.statusPaid
                : styles.statusPending,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isPaid
                  ? styles.dotPaid
                  : styles.dotPending,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                isPaid
                  ? styles.textPaid
                  : styles.textPending,
              ]}
            >
              {isPaid ? 'PAID' : 'UNPAID'}
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryItem
            label="TOTAL PAID"
            value={formatMoney(totalPaid)}
            valueStyle={styles.greenValue}
          />

          <SummaryItem
            label="PAYMENTS"
            value={String(totalPayments)}
          />

          <SummaryItem
            label="LAST PAYMENT"
            value={formatDate(lastPaymentDate)}
          />

          <SummaryItem
            label="NEXT PAYMENT"
            value={formatDate(nextPaymentDate)}
          />
        </View>

        {isPaid && nextPaymentDate ? (
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
            <View style={styles.remainingNumberBox}>
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

              <Text style={styles.remainingDays}>
                DAYS
              </Text>
            </View>

            <View style={styles.remainingContent}>
              <Text style={styles.remainingTitle}>
                {daysRemaining === 0
                  ? 'Payment due'
                  : daysRemaining <= 7
                  ? 'Payment due soon'
                  : 'Payment active'}
              </Text>

              <Text style={styles.remainingDescription}>
                Next payment is due on{' '}
                <Text style={styles.bold}>
                  {formatDate(nextPaymentDate)}
                </Text>
              </Text>
            </View>
          </View>
        ) : null}

        {!compact ? (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyEyebrow}>
                  TRANSACTION LEDGER
                </Text>

                <Text style={styles.historyTitle}>
                  Payment history
                </Text>
              </View>

              {onHistory ? (
                <Pressable
                  onPress={onHistory}
                  style={({ pressed }) => [
                    styles.viewAllButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.viewAllText}>
                    View all
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyIcon}>₹</Text>

                <Text style={styles.emptyTitle}>
                  No payment records
                </Text>

                <Text style={styles.emptyText}>
                  No completed payment has been recorded for this account yet.
                </Text>
              </View>
            ) : (
              history.slice(0, 5).map((record, index) => (
                <PaymentRecord
                  key={
                    record?._id ||
                    `${record?.paidAt}-${index}`
                  }
                  record={record}
                  index={index}
                />
              ))
            )}

            {history.length > 5 && onHistory ? (
              <Pressable
                onPress={onHistory}
                style={styles.moreButton}
              >
                <Text style={styles.moreText}>
                  View {history.length - 5} more payment
                  {history.length - 5 === 1 ? '' : 's'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  valueStyle,
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>

      <Text
        style={[styles.summaryValue, valueStyle]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function PaymentRecord({ record, index }) {
  const amount = Number(record?.amount || 0);
  const months = Number(record?.monthsPaid || 1);

  return (
    <View style={styles.record}>
      <View style={styles.recordIndex}>
        <Text style={styles.recordIndexText}>
          {index + 1}
        </Text>
      </View>

      <View style={styles.recordMain}>
        <View style={styles.recordTop}>
          <Text style={styles.recordAmount}>
            {formatMoney(amount)}
          </Text>

          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAID</Text>
          </View>
        </View>

        <View style={styles.recordDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              PAYMENT DATE
            </Text>
            <Text style={styles.detailValue}>
              {formatDate(record?.paidAt)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              COVERAGE
            </Text>
            <Text style={styles.detailValue}>
              {months} {months === 1 ? 'month' : 'months'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              NEXT DUE
            </Text>
            <Text style={styles.detailValue}>
              {formatDate(record?.nextPaymentDate)}
            </Text>
          </View>
        </View>

        {record?.transactionId ? (
          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>
              TRANSACTION
            </Text>
            <Text
              style={styles.transactionValue}
              numberOfLines={1}
            >
              {record.transactionId}
            </Text>
          </View>
        ) : null}

        {record?.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>NOTE</Text>
            <Text style={styles.noteText}>
              {record.note}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, paddingRight: 10 },
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 5,
  },
  dotPaid: { backgroundColor: '#10B981' },
  dotPending: { backgroundColor: '#F59E0B' },
  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  textPaid: { color: '#047857' },
  textPending: { color: '#C2410C' },
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
  greenValue: { color: '#087A66' },
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
  remainingWarningText: { color: '#EA580C' },
  remainingDays: {
    marginTop: -1,
    color: '#64748B',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  remainingContent: { flex: 1 },
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
  bold: { fontWeight: '900', color: colors.ink },
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
  recordMain: { flex: 1, minWidth: 0 },
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
  pressed: { opacity: 0.7 },
});
