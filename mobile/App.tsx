/**
 * AI Business Digital Twin — Mobile App
 * Main scrollable dark-mode dashboard for Expo Go (SDK 54)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BarChart3,
  Package,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react-native';

import KPICard from './src/components/KPICard';
import RevenueChart from './src/components/RevenueChart';
import CustomerMetrics from './src/components/CustomerMetrics';
import SimulationPanel from './src/components/SimulationPanel';
import ScenarioCompare from './src/components/ScenarioCompare';
import AdvisorPanel from './src/components/AdvisorPanel';

import {
  checkHealth,
  fetchKPIs,
  fetchTimeSeries,
  runSimulation,
  getAdvisorInsights,
  API_BASE,
} from './src/lib/api';
import type {
  KPISummary,
  TimeSeriesPoint,
  SimulationRequest,
  SimulationResponse,
  LLMInsight,
} from './src/lib/types';

type ApiStatus = 'checking' | 'online' | 'offline';
type Tab = 'dashboard' | 'simulate' | 'advisor';

export default function App() {
  // ── State ──────────────────────────────────────────────────────────
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [insights, setInsights] = useState<LLMInsight | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // ── Data loading ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [kpiData, tsData] = await Promise.all([
        fetchKPIs(),
        fetchTimeSeries('monthly'),
      ]);
      setKpis(kpiData);
      setTimeSeries(tsData);
      setApiStatus('online');
    } catch (err: any) {
      console.error('Load data error:', err.message);
      setApiStatus('offline');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    checkHealth()
      .then(() => {
        setApiStatus('online');
        loadData();
      })
      .catch(() => {
        setApiStatus('offline');
        setIsLoadingData(false);
      });
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // ── Simulation ─────────────────────────────────────────────────────
  const handleSimulate = async (request: SimulationRequest) => {
    if (apiStatus === 'offline') {
      Alert.alert('API Offline', `Cannot connect to backend.\nMake sure the server is running at:\n${API_BASE}`);
      return;
    }
    setIsSimulating(true);
    setInsights(null);
    setInsightError(null);
    try {
      const result = await runSimulation(request);
      setSimulationResult(result);
      setActiveTab('advisor');
      // Auto-fetch insights
      fetchInsights(result);
    } catch (err: any) {
      Alert.alert('Simulation Error', err.message || 'Failed to run simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  // ── LLM Insights ───────────────────────────────────────────────────
  const fetchInsights = async (sim?: SimulationResponse) => {
    const target = sim ?? simulationResult;
    if (!target) return;
    setIsLoadingInsights(true);
    setInsightError(null);
    try {
      const result = await getAdvisorInsights(target);
      setInsights(result);
    } catch (err: any) {
      setInsightError(err.message || 'Failed to get insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />

      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>DT</Text>
          </View>
          <View>
            <Text style={styles.brandName}>Digital Twin</Text>
            <Text style={styles.brandTagline}>AI Decision Support</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          {apiStatus === 'online' ? (
            <Wifi size={12} color="#34d399" />
          ) : apiStatus === 'offline' ? (
            <WifiOff size={12} color="#f87171" />
          ) : (
            <Activity size={12} color="#fb923c" />
          )}
          <Text style={[
            styles.statusText,
            { color: apiStatus === 'online' ? '#34d399' : apiStatus === 'offline' ? '#f87171' : '#fb923c' }
          ]}>
            {apiStatus === 'online' ? 'Connected' : apiStatus === 'offline' ? 'Offline' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {/* ─── Tab bar ─────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {([
          { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
          { id: 'simulate', label: 'Simulate', Icon: Activity },
          { id: 'advisor', label: 'AI Advisor', Icon: Users },
        ] as const).map(({ id, label, Icon }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, activeTab === id && styles.tabActive]}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}
          >
            <Icon size={14} color={activeTab === id ? '#60a5fa' : '#475569'} />
            <Text style={[styles.tabText, activeTab === id && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── Offline banner ──────────────────────────────── */}
      {apiStatus === 'offline' && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#fca5a5" />
          <Text style={styles.offlineText}>
            Backend offline · {API_BASE}
          </Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.offlineRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Content ─────────────────────────────────────── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
            progressBackgroundColor="#0d1424"
          />
        }
      >
        {/* ── DASHBOARD TAB ─────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            <Text style={styles.sectionLabel}>Key Performance Indicators</Text>
            <View style={styles.kpiGrid}>
              <KPICard
                title="Total Revenue"
                value={kpis?.total_revenue ?? 0}
                format="currency"
                icon={<DollarSign size={16} color="#60a5fa" />}
                accentColor="#3b82f6"
              />
              <KPICard
                title="Total Expenses"
                value={kpis?.total_expenses ?? 0}
                format="currency"
                icon={<TrendingDown size={16} color="#f87171" />}
                accentColor="#ef4444"
              />
              <KPICard
                title="Profit Margin"
                value={kpis?.avg_profit_margin ?? 0}
                format="percent"
                icon={<TrendingUp size={16} color="#34d399" />}
                accentColor="#10b981"
              />
              <KPICard
                title="Customers"
                value={kpis?.total_customers ?? 0}
                format="number"
                icon={<Users size={16} color="#a78bfa" />}
                accentColor="#8b5cf6"
              />
              <KPICard
                title="Churn Rate"
                value={(kpis?.avg_churn_rate ?? 0) * 100}
                format="percent"
                icon={<Activity size={16} color="#fb923c" />}
                accentColor="#f97316"
              />
              <KPICard
                title="Avg Inventory"
                value={kpis?.avg_inventory_level ?? 0}
                format="number"
                icon={<Package size={16} color="#22d3ee" />}
                accentColor="#06b6d4"
              />
            </View>

            <Text style={styles.sectionLabel}>Business Analytics</Text>
            <RevenueChart data={timeSeries} isLoading={isLoadingData} />
            <CustomerMetrics data={timeSeries} isLoading={isLoadingData} />

            {kpis && (
              <View style={styles.footerCard}>
                <Text style={styles.footerText}>
                  {kpis.data_points} data points · {kpis.date_range_start} → {kpis.date_range_end}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── SIMULATE TAB ─────────────────────────────── */}
        {activeTab === 'simulate' && (
          <>
            <Text style={styles.sectionLabel}>What-If Simulation</Text>
            <SimulationPanel
              onSimulate={handleSimulate}
              isLoading={isSimulating}
              result={simulationResult}
            />
            {simulationResult && (
              <>
                <Text style={styles.sectionLabel}>Scenario Comparison</Text>
                <ScenarioCompare result={simulationResult} />
              </>
            )}
          </>
        )}

        {/* ── ADVISOR TAB ──────────────────────────────── */}
        {activeTab === 'advisor' && (
          <>
            <Text style={styles.sectionLabel}>AI Business Advisor</Text>
            {!simulationResult && (
              <View style={styles.advisorPrompt}>
                <Activity size={32} color="#334155" />
                <Text style={styles.advisorPromptText}>
                  Go to the Simulate tab, run a scenario, and AI insights will appear here automatically.
                </Text>
                <TouchableOpacity
                  style={styles.goSimulateBtn}
                  onPress={() => setActiveTab('simulate')}
                >
                  <Text style={styles.goSimulateBtnText}>Go to Simulate</Text>
                </TouchableOpacity>
              </View>
            )}
            <AdvisorPanel
              insights={insights}
              isLoading={isLoadingInsights}
              error={insightError}
              onRetry={() => fetchInsights()}
            />
            {simulationResult && (
              <>
                <Text style={styles.sectionLabel}>Scenario Details</Text>
                <ScenarioCompare result={simulationResult} />
              </>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const DARK = '#0a0e1a';
const CARD_BG = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.06)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: 'rgba(10,14,26,0.9)',
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandIconText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  brandName: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: 16,
  },
  brandTagline: {
    color: '#475569',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: CARD_BG,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginLeft: 4,
  },
  tabTextActive: {
    color: '#60a5fa',
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248,113,113,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  offlineText: {
    flex: 1,
    fontSize: 11,
    color: '#fca5a5',
    marginLeft: 4,
  },
  offlineRetry: {
    fontSize: 11,
    color: '#fca5a5',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 20,
  },
  footerCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 10,
    color: '#334155',
    textAlign: 'center',
  },
  advisorPrompt: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  advisorPromptText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  goSimulateBtn: {
    marginTop: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  goSimulateBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomSpacer: {
    height: 40,
  },
});
