import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, FadeIn, colors } from './UI';

const chartMeta = [
  { key: 'patientsDaily', title: 'Daily', subtitle: 'Last 7 days', format: 'day', tone: '#1769FF' },
  { key: 'patientsWeekly', title: 'Weekly', subtitle: 'Last 4 weeks', format: 'week', tone: '#17A98F' },
  { key: 'patientsMonthly', title: 'Monthly', subtitle: 'Last 12 months', format: 'month', tone: '#8B5CF6' },
  { key: 'patientsYearly', title: 'Yearly', subtitle: 'Last 5 years', format: 'year', tone: '#E58B35' },
];

const labelFor = (value, format) => {
  const date = new Date(value);
  if (format === 'year') return String(date.getFullYear()).slice(-2);
  if (format === 'month') return date.toLocaleDateString('en', { month: 'short' });
  if (format === 'week') return `W${date.getDate()}`;
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

function MiniChart({ rows, title, subtitle, format, tone }) {
  if (!rows || !rows.length) return null;
  const max = Math.max(1, ...rows.map(row => row.count));
  const visibleRows = rows.slice(-8);
  return <View style={{ width: 210, minHeight: 190, padding: 16, marginRight: 10, borderRadius: 18, backgroundColor: '#F8FBFF', borderWidth: 1, borderColor: '#E6EEF7' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Text style={{ fontSize: 16, fontWeight: '900', color: colors.ink }}>{title}</Text><Text style={{ fontSize: 11, color: colors.muted, marginTop: 3 }}>{subtitle}</Text></View><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: tone }} /></View>
    <View style={{ height: 96, marginTop: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#DCE6F0' }}>
      {visibleRows.map(row => <View key={row.date} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 2 }}><Text style={{ fontSize: 10, fontWeight: '900', color: colors.ink, marginBottom: 3 }}>{row.count}</Text><View style={{ width: 13, height: `${Math.max(7, (row.count / max) * 100)}%`, backgroundColor: tone, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} /><Text numberOfLines={1} style={{ fontSize: 8, color: colors.muted, marginTop: 6 }}>{labelFor(row.date, format)}</Text></View>)}
    </View>
  </View>;
}

export default function Analytics({ data, title }) {
  if (!data) return null;
  const metrics = [['PATIENTS', data.totalPatients, '#1769FF'], ['VISITS', data.totalVisits, '#17A98F'], ['TODAY', data.newPatientsToday, '#E58B35'], ['4 WEEKS', data.weekly ? data.weekly.patientCount : 0, '#8B5CF6']];
  return <FadeIn><Card accent><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><View><Text style={{ fontSize: 20, fontWeight: '900', color: colors.ink }}>{title || 'Practice analytics'}</Text><Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>Since doctor registration</Text></View><Text style={{ fontSize: 11, fontWeight: '900', color: colors.cyan }}>LIVE</Text></View><View style={{ flexDirection: 'row', marginTop: 18, marginBottom: 4 }}>{metrics.map(([label, value, tone]) => <View key={label} style={{ flex: 1, paddingRight: 7 }}><Text style={{ fontSize: 10, color: colors.muted, fontWeight: '800' }}>{label}</Text><Text style={{ fontSize: 23, fontWeight: '900', color: tone, marginTop: 2 }}>{value}</Text></View>)}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14, paddingRight: 4 }}>{chartMeta.map(chart => <MiniChart key={chart.key} rows={data[chart.key]} {...chart} />)}</ScrollView></Card></FadeIn>;
}
