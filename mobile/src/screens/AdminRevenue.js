import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Button,
  Card,
  Screen,
  colors,
} from '../components/UI';

import { api } from '../api/api';

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) {
    return 'Not recorded';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMonth = ({ year, month }) =>
  new Date(year, month - 1, 1).toLocaleDateString(
    'en-IN',
    {
      month: 'short',
      year: 'numeric',
    }
  );

export default function AdminRevenue({ navigation }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);

  const loadRevenue = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(
        `/admin/revenue?page=${nextPage}`
      );
      setData(response?.data?.data || null);
      setPage(nextPage);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to load revenue records.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevenue(1);
  }, [loadRevenue]);

  const monthlyRevenue = data?.monthlyRevenue || [];
  const maxMonthAmount = Math.max(
    1,
    ...monthlyRevenue.map((item) => Number(item.amount) || 0)
  );
  const totalPages = Math.max(
    1,
    Math.ceil((data?.totalRecords || 0) / (data?.pageSize || 20))
  );

  const viewPaymentProof = async (record) => {
    if (!record?.doctorId || !record?._id) {
      return;
    }

    setProofLoading(true);
    try {
      const response = await api.get(
        `/admin/doctors/${record.doctorId}/payments/${record._id}/proof`
      );
      const proof = response?.data?.data;
      if (!proof?.data) {
        throw new Error('Payment screenshot not found.');
      }

      setPaymentProof({
        uri: `data:${proof.contentType};base64,${proof.data}`,
        doctorName: record.doctorName,
        fileName: proof.fileName,
      });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        'Unable to load screenshot.';
      if (globalThis.alert) {
        globalThis.alert(message);
      }
    } finally {
      setProofLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>ADMIN / FINANCE</Text>
          <Text style={styles.title}>Revenue</Text>
          <Text style={styles.subtitle}>
            Recorded payments across all doctors
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => loadRevenue(page)}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <Button
        title="Back to admin dashboard"
        secondary
        onPress={() => navigation.goBack()}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            secondary
            onPress={() => loadRevenue(page)}
          />
        </View>
      ) : null}

      {loading && !data ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.cyan} />
          <Text style={styles.loadingText}>Loading revenue...</Text>
        </View>
      ) : data ? (
        <>
          <View style={styles.summaryGrid}>
            <SummaryValue
              label="Total revenue"
              value={formatCurrency(data.totalRevenue)}
              detail="All recorded payments"
              emphasis
            />
            <SummaryValue
              label="Payments"
              value={data.paymentCount || 0}
              detail="Recorded transactions"
            />
            <SummaryValue
              label="Paying doctors"
              value={data.doctorCount || 0}
              detail="Doctors with payment history"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly revenue</Text>
            <Text style={styles.sectionMeta}>Last 12 active months</Text>
          </View>

          <Card>
            {monthlyRevenue.length ? (
              monthlyRevenue.map((item) => (
                <View
                  key={`${item._id.year}-${item._id.month}`}
                  style={styles.monthRow}
                >
                  <Text style={styles.monthLabel}>
                    {formatMonth(item._id)}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: `${Math.max(
                            2,
                            (Number(item.amount) / maxMonthAmount) * 100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.monthAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No payments have been recorded yet.
              </Text>
            )}
          </Card>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment records</Text>
            <Text style={styles.sectionMeta}>
              {data.totalRecords || 0} total
            </Text>
          </View>

          <Card>
            {data.records?.length ? (
              data.records.map((record, index) => (
                <View
                  key={record._id || `${record.paidAt}-${index}`}
                  style={[
                    styles.recordRow,
                    index === data.records.length - 1 &&
                      styles.lastRecordRow,
                  ]}
                >
                  <View style={styles.recordHeading}>
                    <View style={styles.recordDoctor}>
                      <Text style={styles.doctorName} numberOfLines={1}>
                        {record.doctorName || 'Doctor'}
                      </Text>
                      <Text style={styles.doctorEmail} numberOfLines={1}>
                        {record.doctorEmail || ''}
                      </Text>
                    </View>
                    <Text style={styles.recordAmount}>
                      {formatCurrency(record.amount)}
                    </Text>
                  </View>
                  <Text style={styles.recordDate}>
                    Paid {formatDate(record.paidAt)}
                    {'  ·  '}Next due {formatDate(record.nextPaymentDate)}
                  </Text>
                  <Text style={styles.recordDate}>
                    {record.monthsPaid || 1} month(s) covered
                    {record.transactionId
                      ? `  ·  Transaction ${record.transactionId}`
                      : ''}
                    {record.hasPaymentProof
                      ? '  ·  Screenshot attached'
                      : ''}
                  </Text>
                  {record.recordedByName ? (
                    <Text style={styles.recordDate}>
                      Recorded by {record.recordedByName}
                    </Text>
                  ) : null}
                  {record.hasPaymentProof ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => viewPaymentProof(record)}
                      style={styles.proofLink}
                    >
                      <Text style={styles.proofLinkText}>
                        View payment screenshot
                      </Text>
                    </Pressable>
                  ) : null}
                  {record.note ? (
                    <Text style={styles.recordNote}>{record.note}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No payment records on this page.
              </Text>
            )}
          </Card>

          {totalPages > 1 ? (
            <View style={styles.pagination}>
              <Button
                title="Previous"
                secondary
                disabled={loading || page <= 1}
                onPress={() => loadRevenue(page - 1)}
              />
              <Text style={styles.pageText}>
                {page} / {totalPages}
              </Text>
              <Button
                title="Next"
                secondary
                disabled={loading || page >= totalPages}
                onPress={() => loadRevenue(page + 1)}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <Modal
        visible={Boolean(paymentProof) || proofLoading}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentProof(null)}
      >
        <Pressable
          style={styles.proofOverlay}
          onPress={() => setPaymentProof(null)}
        >
          <View style={styles.proofModal}>
            <Text style={styles.proofTitle}>
              {paymentProof?.doctorName || 'Payment screenshot'}
            </Text>
            {paymentProof ? (
              <Image
                source={{ uri: paymentProof.uri }}
                resizeMode="contain"
                style={styles.proofImage}
              />
            ) : (
              <ActivityIndicator color={colors.cyan} />
            )}
            {paymentProof?.fileName ? (
              <Text style={styles.sectionMeta}>
                {paymentProof.fileName}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function SummaryValue({
  label,
  value,
  detail,
  emphasis,
}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          emphasis && styles.summaryValueEmphasis,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  heading: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#E7F6F3',
  },
  refreshText: {
    color: '#087A66',
    fontSize: 12,
    fontWeight: '800',
  },
  errorBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1C7CA',
    backgroundColor: '#FFF7F7',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: 10,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 18,
  },
  summaryItem: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 0,
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E9EC',
    borderRadius: 6,
    padding: 14,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 9,
  },
  summaryValueEmphasis: {
    color: '#087A66',
    fontSize: 26,
  },
  summaryDetail: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 10,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F2',
  },
  monthLabel: {
    width: 74,
    color: colors.muted,
    fontSize: 10,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8EFEE',
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  bar: {
    height: '100%',
    backgroundColor: '#11816B',
    borderRadius: 4,
  },
  monthAmount: {
    width: 90,
    textAlign: 'right',
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    paddingVertical: 14,
  },
  recordRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF0',
  },
  lastRecordRow: {
    borderBottomWidth: 0,
  },
  recordHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordDoctor: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  doctorName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  doctorEmail: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  recordAmount: {
    color: '#087A66',
    fontSize: 14,
    fontWeight: '900',
  },
  recordDate: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 6,
  },
  recordNote: {
    color: colors.ink,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  proofLink: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  proofLinkText: {
    color: '#087A66',
    fontSize: 10,
    fontWeight: '800',
  },
  proofOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  proofModal: {
    maxHeight: '90%',
    padding: 14,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  proofTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  proofImage: {
    width: '100%',
    height: 420,
    backgroundColor: '#F2F5F5',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },
  pageText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
});
