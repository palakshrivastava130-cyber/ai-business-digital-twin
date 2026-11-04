import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import type { SimulationResponse } from '../lib/types';

interface ScenarioCompareProps {
  result: SimulationResponse;
}

interface MetricRow {
  label: string;
  baseline: number;
  scenario: number;
  formatFn: (v: number) => string;
}

function formatCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function formatPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

function formatNumber(v: number): string {
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function BarRow({ label, baseline, scenario, formatFn }: MetricRow) {
  const max = Math.max(Math.abs(baseline), Math.abs(scenario), 1);
  const baselineWidth = Math.abs(baseline) / max;
  const scenarioWidth = Math.abs(scenario) / max;
  const isImprovement = scenario >= baseline;
  const delta = baseline !== 0 ? ((scenario - baseline) / Math.abs(baseline)) * 100 : 0;

  return (
    <View style={styles.barRow}>
      <View style={styles.barRowHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <View style={[styles.deltaBadge, isImprovement ? styles.deltaBadgeGreen : styles.deltaBadgeRed]}>
          <Text style={[styles.deltaText, { color: isImprovement ? '#34d399' : '#f87171' }]}>
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Baseline bar */}
      <View style={styles.barTrack}>
        <View style={styles.barLeft}>
          <View style={[styles.bar, styles.barBaseline, { flex: baselineWidth }]} />
          <View style={{ flex: 1 - baselineWidth }} />
        </View>
        <Text style={styles.barValue}>{formatFn(baseline)}</Text>
      </View>
      <Text style={styles.barLegend}>Baseline</Text>

      {/* Scenario bar */}
      <View style={styles.barTrack}>
        <View style={styles.barLeft}>
          <View style={[styles.bar, isImprovement ? styles.barGreen : styles.barRed, { flex: scenarioWidth }]} />
          <View style={{ flex: 1 - scenarioWidth }} />
        </View>
        <Text style={styles.barValue}>{formatFn(scenario)}</Text>
      </View>
      <Text style={styles.barLegend}>Scenario</Text>
    </View>
  );
}

export default function ScenarioCompare({ result }: ScenarioCompareProps) {
  const { baseline, scenario, deltas } = result;

  const metrics: MetricRow[] = [
    { label: 'Revenue', baseline: baseline.predicted_revenue, scenario: scenario.predicted_revenue, formatFn: formatCurrency },
    { label: 'Inventory', baseline: baseline.predicted_inventory, scenario: scenario.predicted_inventory, formatFn: formatNumber },
    { label: 'Profit Margin', baseline: baseline.predicted_profit_margin, scenario: scenario.predicted_profit_margin, formatFn: formatPercent },
    { label: 'Churn Probability', baseline: baseline.predicted_churn_probability, scenario: scenario.predicted_churn_probability, formatFn: formatPercent },
  ];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <BarChart3 size={18} color="#60a5fa" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Baseline vs Scenario</Text>
          <Text style={styles.subtitle}>{result.scenario_name}</Text>
        </View>
      </View>

      {/* Metric bars */}
      {metrics.map((m) => (
        <BarRow key={m.label} {...m} />
      ))}

      {/* Delta chips */}
      <View style={styles.chips}>
        {Object.entries(deltas).map(([key, value]) => (
          <View
            key={key}
            style={[
              styles.chip,
              value > 0 ? styles.chipGreen : value < 0 ? styles.chipRed : styles.chipNeutral,
            ]}
          >
            <Text style={[
              styles.chipText,
              { color: value > 0 ? '#34d399' : value < 0 ? '#f87171' : '#94a3b8' }
            ]}>
              {key.replace(/_change_pct/g, '').replace(/_/g, ' ')}: {value > 0 ? '+' : ''}{value.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  barRow: {
    marginBottom: 14,
  },
  barRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  deltaBadgeGreen: { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' },
  deltaBadgeRed: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.2)' },
  deltaText: { fontSize: 11, fontWeight: '700' },
  barTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
    marginBottom: 2,
  },
  barLeft: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  bar: {
    borderRadius: 4,
    height: '100%',
  },
  barBaseline: { backgroundColor: '#64748b' },
  barGreen: { backgroundColor: '#34d399' },
  barRed: { backgroundColor: '#f87171' },
  barValue: {
    fontSize: 11,
    color: '#94a3b8',
    minWidth: 56,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  barLegend: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 4,
    marginTop: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipGreen: { backgroundColor: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)' },
  chipRed: { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' },
  chipNeutral: { backgroundColor: 'rgba(148,163,184,0.08)', borderColor: 'rgba(148,163,184,0.2)' },
  chipText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
