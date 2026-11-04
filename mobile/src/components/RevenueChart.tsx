import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { TimeSeriesPoint } from '../lib/types';

interface RevenueChartProps {
  data: TimeSeriesPoint[];
  isLoading: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonChart} />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.emptyText}>No chart data available</Text>
      </View>
    );
  }

  // Sample up to 12 points for mobile readability
  const sample = data.length > 12
    ? data.filter((_, i) => i % Math.ceil(data.length / 12) === 0).slice(0, 12)
    : data;

  const labels = sample.map((d) => {
    const date = new Date(d.date);
    return `${date.toLocaleString('default', { month: 'short' })}`;
  });

  const revenueData = sample.map((d) => Math.round(d.revenue));
  const expenseData = sample.map((d) => Math.round(d.expenses));

  const chartData = {
    labels,
    datasets: [
      {
        data: revenueData,
        color: () => '#3b82f6',
        strokeWidth: 2,
      },
      {
        data: expenseData,
        color: () => '#f43f5e',
        strokeWidth: 2,
      },
    ],
    legend: ['Revenue', 'Expenses'],
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Revenue vs Expenses</Text>
      <Text style={styles.subtitle}>Monthly trend (sampled)</Text>
      <LineChart
        data={chartData}
        width={SCREEN_WIDTH - 48}
        height={200}
        withDots={false}
        withShadow={false}
        withScrollableDot={false}
        bezier
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: '#0d1424',
          backgroundGradientTo: '#0d1424',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
          labelColor: () => '#64748b',
          propsForDots: { r: '3' },
          propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.05)' },
        }}
        style={styles.chart}
        formatYLabel={(val) => {
          const n = Number(val);
          if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
          return `$${n}`;
        }}
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
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  loadingCard: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  skeletonTitle: {
    height: 16,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonChart: {
    height: 180,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
  },
});
