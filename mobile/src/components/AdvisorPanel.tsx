import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bot, Sparkles, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react-native';
import type { LLMInsight } from '../lib/types';

interface AdvisorPanelProps {
  insights: LLMInsight | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const CONFIDENCE_COLORS = {
  Low: { text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  Medium: { text: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
  High: { text: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
};

export default function AdvisorPanel({ insights, isLoading, error, onRetry }: AdvisorPanelProps) {
  const confColors = insights
    ? CONFIDENCE_COLORS[insights.confidence] ?? CONFIDENCE_COLORS.Medium
    : null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Bot size={20} color="#c084fc" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>AI Business Advisor</Text>
          <View style={styles.subtitleRow}>
            <Sparkles size={10} color="#c084fc" />
            <Text style={styles.subtitle}>  Powered by Google Gemini</Text>
          </View>
        </View>
        {insights && confColors && (
          <View style={[styles.confBadge, { backgroundColor: confColors.bg, borderColor: confColors.border }]}>
            <Text style={[styles.confText, { color: confColors.text }]}>
              {insights.confidence}
            </Text>
          </View>
        )}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#c084fc" size="small" />
          <Text style={styles.loadingText}>Analyzing scenario with Gemini...</Text>
          <View style={styles.skeletonLines}>
            <View style={[styles.skeleton, { width: '90%' }]} />
            <View style={[styles.skeleton, { width: '75%' }]} />
            <View style={[styles.skeleton, { width: '60%' }]} />
          </View>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <RefreshCw size={12} color="#fca5a5" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!insights && !isLoading && !error && (
        <View style={styles.emptyState}>
          <Bot size={40} color="#1e293b" />
          <Text style={styles.emptyText}>Run a simulation to get AI-powered insights</Text>
        </View>
      )}

      {/* Insights */}
      {insights && !isLoading && (
        <View style={styles.insightsContainer}>
          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Executive Summary</Text>
            <Text style={styles.summaryText}>{insights.executive_summary}</Text>
          </View>

          {/* Risks */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <AlertTriangle size={12} color="#fb923c" />
              <Text style={[styles.sectionLabel, { marginLeft: 6 }]}>Key Risks</Text>
            </View>
            {insights.key_risks.map((risk, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.riskDot} />
                <Text style={styles.listText}>{risk}</Text>
              </View>
            ))}
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Lightbulb size={12} color="#34d399" />
              <Text style={[styles.sectionLabel, { marginLeft: 6 }]}>Recommendations</Text>
            </View>
            {insights.recommendations.map((rec, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.recIndex}>{i + 1}.</Text>
                <Text style={styles.listText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Rationale */}
          <View style={styles.rationaleBox}>
            <Text style={styles.rationaleText}>{insights.confidence_rationale}</Text>
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
    borderColor: 'rgba(192,132,252,0.15)',
    padding: 18,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(192,132,252,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#e2e8f0' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  subtitle: { fontSize: 11, color: '#64748b' },
  confBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  confText: { fontSize: 11, fontWeight: '700' },
  loadingContainer: { alignItems: 'center', paddingVertical: 16 },
  loadingText: { fontSize: 13, color: '#64748b', marginTop: 8, marginBottom: 12 },
  skeletonLines: { width: '100%', gap: 8 },
  skeleton: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6,
  },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 12,
    padding: 14,
  },
  errorText: { fontSize: 13, color: '#fca5a5' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  retryText: { fontSize: 12, color: '#fca5a5', textDecorationLine: 'underline', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 13, color: '#475569', marginTop: 12, textAlign: 'center' },
  insightsContainer: { gap: 16 },
  section: { gap: 8 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center' },
  sectionLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  summaryText: { fontSize: 13, color: '#cbd5e1', lineHeight: 20 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  riskDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f87171',
    marginTop: 5,
  },
  recIndex: { fontSize: 12, color: '#34d399', fontWeight: '700', width: 18 },
  listText: { fontSize: 12, color: '#94a3b8', lineHeight: 18, flex: 1 },
  rationaleBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  rationaleText: { fontSize: 11, color: '#475569', fontStyle: 'italic' },
});
