import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import type { TimeSeriesPoint } from '../lib/types';

interface CustomerMetricsProps {
  data: TimeSeriesPoint[];
  isLoading: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function CustomerMetrics({ data, isLoading }: CustomerMetricsProps) {
  if (isLoading || !data || data.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonChart} />
      </View>
    );
  }

  // Sample 6 points for the bar chart
  const sample = data.length > 6
    ? data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).slice(0, 6)
    : data;

  const labels = sample.map((d) => {
    const date = new Date(d.date);
    return `${date.toLocaleString('default', { month: 'short' })}`;
  });

  // Latest stats
  const latest = data[data.length - 1];
  const avgChurn = data.reduce((acc, d) => acc + d.churn_rate, 0) / data.length;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Customer Metrics</Text>

      {/* Stat badges */}
      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Current Customers</Text>
          <Text style={[styles.statValue, { color: '#a78bfa' }]}>
            {latest?.customer_count?.toLocaleString() ?? '—'}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg Churn Rate</Text>
          <Text style={[styles.statValue, { color: '#fb923c' }]}>
            {(avgChurn * 100).toFixed(2)}%
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg CAC</Text>
          <Text style={[styles.statValue, { color: '#34d399' }]}>
            ${data.reduce((a, d) => a + (d as any).customer_acquisition_cost, 0) / data.length > 0
              ? (data.reduce((a, d) => a + (d as any).customer_acquisition_cost, 0) / data.length).toFixed(0)
              : '—'}
          </Text>
        </View>
      </View>

      {/* Customer count bar chart */}
      <Text style={styles.chartLabel}>Customer Count (Monthly)</Text>
      <BarChart
        data={{
          labels,
          datasets: [{ data: sample.map((d) => d.customer_count) }],
        }}
        width={SCREEN_WIDTH - 48}
        height={160}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#0d1424',
          backgroundGradientTo: '#0d1424',
          decimalPlaces: 0,
          color: () => '#a78bfa',
          labelColor: () => '#64748b',
          propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.05)' },
          barRadius: 4,
        }}
        style={styles.chart}
        showValuesOnTopOfBars={false}
        withInnerLines
        flatColor
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 3,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartLabel: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  skeletonTitle: {
    height: 16,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonChart: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
  },
});
