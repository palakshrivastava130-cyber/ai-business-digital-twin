import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  Megaphone,
  DollarSign,
  Package,
  Users,
  Settings,
  FlaskConical,
  Rocket,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import type { SimulationRequest, SimulationResponse } from '../lib/types';

interface SimulationPanelProps {
  onSimulate: (req: SimulationRequest) => Promise<void>;
  isLoading: boolean;
  result: SimulationResponse | null;
}

interface SliderConfig {
  key: keyof SimulationRequest;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  Icon: LucideIcon;
  iconColor: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'marketing_spend_change', label: 'Marketing Budget', min: -50, max: 100, step: 5, unit: '%', Icon: Megaphone, iconColor: '#60a5fa' },
  { key: 'price_change', label: 'Product Price', min: -20, max: 30, step: 1, unit: '%', Icon: DollarSign, iconColor: '#34d399' },
  { key: 'inventory_change', label: 'Inventory Order Freq.', min: 0.5, max: 2.0, step: 0.1, unit: 'x', Icon: Package, iconColor: '#a78bfa' },
  { key: 'cac_change', label: 'Customer Acq. Spend', min: -50, max: 100, step: 5, unit: '%', Icon: Users, iconColor: '#fb923c' },
  { key: 'expense_change', label: 'Operating Expenses', min: -30, max: 50, step: 5, unit: '%', Icon: Settings, iconColor: '#f87171' },
];

const DEFAULT_PARAMS: SimulationRequest = {
  scenario_name: 'Custom Scenario',
  marketing_spend_change: 0,
  price_change: 0,
  inventory_change: 1.0,
  cac_change: 0,
  expense_change: 0,
};

function getDisplayValue(value: number, unit: string): string {
  if (unit === 'x') return `${value.toFixed(1)}x`;
  return `${value > 0 ? '+' : ''}${value}%`;
}

function getValueColor(value: number, unit: string): string {
  if (unit === 'x') return value > 1 ? '#34d399' : value < 1 ? '#fb923c' : '#64748b';
  return value > 0 ? '#34d399' : value < 0 ? '#f87171' : '#64748b';
}

export default function SimulationPanel({ onSimulate, isLoading, result }: SimulationPanelProps) {
  const [params, setParams] = useState<SimulationRequest>(DEFAULT_PARAMS);

  const handleReset = () => setParams(DEFAULT_PARAMS);

  const hasChanges = SLIDERS.some(({ key }) => {
    const v = params[key] as number;
    return key === 'inventory_change' ? v !== 1.0 : v !== 0;
  });

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <FlaskConical size={18} color="#60a5fa" />
          </View>
          <View>
            <Text style={styles.cardTitle}>What-If Simulation</Text>
            <Text style={styles.cardSubtitle}>Adjust parameters to explore scenarios</Text>
          </View>
        </View>
        {hasChanges && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <RotateCcw size={12} color="#94a3b8" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scenario name */}
      <TextInput
        style={styles.input}
        value={params.scenario_name}
        onChangeText={(v) => setParams((p) => ({ ...p, scenario_name: v }))}
        placeholder="Scenario name..."
        placeholderTextColor="#334155"
      />

      {/* Sliders */}
      {SLIDERS.map(({ key, label, min, max, step, unit, Icon, iconColor }) => {
        const value = params[key] as number;
        return (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <View style={styles.sliderLabel}>
                <Icon size={13} color={iconColor} />
                <Text style={styles.sliderLabelText}>{label}</Text>
              </View>
              <Text style={[styles.sliderValue, { color: getValueColor(value, unit) }]}>
                {getDisplayValue(value, unit)}
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={min}
              maximumValue={max}
              step={step}
              value={value}
              onValueChange={(v) => setParams((p) => ({ ...p, [key]: parseFloat(v.toFixed(1)) }))}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="rgba(255,255,255,0.1)"
              thumbTintColor="#3b82f6"
            />
          </View>
        );
      })}

      {/* Run button */}
      <TouchableOpacity
        style={[styles.runBtn, isLoading && styles.runBtnDisabled]}
        onPress={() => onSimulate(params)}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color="#93c5fd" />
            <Text style={styles.runBtnText}>Running...</Text>
          </>
        ) : (
          <>
            <Rocket size={16} color="#ffffff" />
            <Text style={styles.runBtnText}>Run Simulation</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Quick delta summary */}
      {result && (
        <View style={styles.deltasContainer}>
          <Text style={styles.deltasLabel}>Predicted Impact</Text>
          <View style={styles.deltasGrid}>
            {Object.entries(result.deltas).map(([key, value]) => (
              <View key={key} style={styles.deltaItem}>
                <Text style={styles.deltaKey}>
                  {key.replace(/_change_pct/g, '').replace(/_/g, ' ')}
                </Text>
                <Text style={[styles.deltaValue, { color: value > 0 ? '#34d399' : value < 0 ? '#f87171' : '#64748b' }]}>
                  {value > 0 ? '+' : ''}{value.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resetText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#e2e8f0',
    marginBottom: 16,
  },
  sliderRow: {
    marginBottom: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 32,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  runBtnDisabled: {
    backgroundColor: 'rgba(59,130,246,0.3)',
  },
  runBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  deltasContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  deltasLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  deltasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deltaItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  deltaKey: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  deltaValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});
