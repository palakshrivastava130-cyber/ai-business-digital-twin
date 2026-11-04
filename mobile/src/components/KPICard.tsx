import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface KPICardProps {
  title: string;
  value: number;
  format: 'currency' | 'percent' | 'number';
  icon: React.ReactNode;
  accentColor: string;
  subtitle?: string;
}

function formatValue(value: number, format: KPICardProps['format']): string {
  switch (format) {
    case 'currency':
      if (Math.abs(value) >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1_000) {
        return `$${(value / 1_000).toFixed(1)}K`;
      }
      return `$${value.toFixed(0)}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
      if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      return value.toFixed(0);
    default:
      return String(value);
  }
}

export default function KPICard({ title, value, format, icon, accentColor, subtitle }: KPICardProps) {
  return (
    <View style={[styles.card, { borderColor: `${accentColor}25` }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
        {icon}
      </View>
      <Text style={styles.value}>{formatValue(value, format)}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flex: 1,
    minWidth: '44%',
    margin: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
});
