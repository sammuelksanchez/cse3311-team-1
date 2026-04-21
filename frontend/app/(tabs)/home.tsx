import { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ScrollView, TextInput, Modal, Platform, Dimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from 'react-native-svg';
import { getCustomer, getFinancials, saveFinancials, getInvestmentItems, getLiabilityItems } from '@/services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getCurrentMonth() {
  return MONTHS[new Date().getMonth()];
}

function getMonthsUpToCurrent() {
  return MONTHS.slice(0, new Date().getMonth() + 1);
}

const DONUT_SIZE = 120;
const STROKE = 14;
const RADIUS = (DONUT_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TabOneScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [investments, setInvestments] = useState('');
  const [savings, setSavings] = useState('');
  const [liabilities, setLiabilities] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  const months = getMonthsUpToCurrent();
  const networth = (parseFloat(investments || '0') + parseFloat(savings || '0')) - parseFloat(liabilities || '0');
  const goalPercent = customer ? Math.min(Math.round((networth / parseFloat(customer.networth_goal)) * 100), 100) : 0;
  const strokeDashoffset = CIRCUMFERENCE - (goalPercent / 100) * CIRCUMFERENCE;

  useFocusEffect(useCallback(() => {
    getCustomer().then(setCustomer).catch(console.error);
  }, []));

  useFocusEffect(useCallback(() => {
    getFinancials(selectedMonth).then(data => setSavings(data.savings)).catch(console.error);
    getInvestmentItems(selectedMonth).then(items => {
      const total = items.reduce((sum: number, i: any) => sum + parseFloat(i.amount || '0'), 0);
      setInvestments(String(total));
    }).catch(console.error);
    getLiabilityItems(selectedMonth).then(items => {
      const total = items.reduce((sum: number, i: any) => sum + parseFloat(i.amount || '0'), 0);
      setLiabilities(String(total));
    }).catch(console.error);
  }, [selectedMonth]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{selectedMonth} Net Worth</Text>
          <View style={styles.heroContent}>
            <View style={styles.donutContainer}>
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                <Circle
                  cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={RADIUS}
                  fill="none" stroke="#E8E8E8" strokeWidth={STROKE}
                />
                <Circle
                  cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={RADIUS}
                  fill="none" stroke="#2E6F40" strokeWidth={STROKE}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}
                />
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutPercent}>{goalPercent}%</Text>
                <Text style={styles.donutSub}>of goal</Text>
              </View>
            </View>
            <View style={styles.heroNumbers}>
              <Text style={styles.networthValue}>${networth.toLocaleString()}</Text>
              <Text style={styles.goalText}>goal ${parseFloat(customer?.networth_goal || '0').toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Month Selector */}
        <TouchableOpacity style={styles.monthSelector} onPress={() => setShowMonthPicker(!showMonthPicker)}>
          <Text style={styles.monthSelectorText}>{selectedMonth} overview</Text>
          <Text style={styles.monthChevron}>▾</Text>
        </TouchableOpacity>

        {showMonthPicker && (
          <View style={styles.monthDropdown}>
            {months.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.monthOption, m === selectedMonth && styles.monthOptionSelected]}
                onPress={() => { setSelectedMonth(m); setShowMonthPicker(false); }}
              >
                <Text style={[styles.monthOptionText, m === selectedMonth && styles.monthOptionTextSelected]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard} onPress={() => router.push(`/investments?month=${selectedMonth}` as any)}>
            <Text style={styles.gridLabel}>Investments</Text>
            <Text style={styles.gridValue}>${parseFloat(investments || '0').toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => setShowSavingsModal(true)}>
            <Text style={styles.gridLabel}>Savings</Text>
            <Text style={styles.gridValue}>${parseFloat(savings || '0').toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.gridCard, styles.liabilitiesCard]} onPress={() => router.push(`/liabilities?month=${selectedMonth}` as any)}>
          <Text style={styles.gridLabel}>Liabilities</Text>
          <Text style={[styles.gridValue, styles.liabilityValue]}>${parseFloat(liabilities || '0').toLocaleString()}</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={showSavingsModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSavingsModal(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Savings</Text>
            <TextInput
              style={styles.input}
              value={savings}
              onChangeText={setSavings}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor="#999"
              autoFocus
            />
            <TouchableOpacity style={styles.primaryButton} onPress={() => {
              saveFinancials(investments, savings, liabilities, selectedMonth).catch(console.error);
              setShowSavingsModal(false);
            }}>
              <Text style={styles.primaryButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  scrollContent: { paddingBottom: 32 },

  heroCard: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 24,
    paddingBottom: 28,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  heroLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  donutContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    inset: 0,
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPercent: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  donutSub: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  heroNumbers: { flex: 1 },
  networthValue: { fontSize: 32, fontWeight: '600', color: '#1a1a1a', lineHeight: 36 },
  goalText: { fontSize: 13, color: '#999', marginTop: 6 },

  monthSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  monthSelectorText: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  monthChevron: { fontSize: 13, color: '#2E6F40', fontWeight: '600' },

  monthDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  monthOption: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  monthOptionSelected: { backgroundColor: '#f0f7f2' },
  monthOptionText: { fontSize: 15, color: '#333' },
  monthOptionTextSelected: { color: '#2E6F40', fontWeight: '500' },

  grid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  liabilitiesCard: {
    flex: 0,
    marginHorizontal: 16,
  },
  gridLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  gridValue: { fontSize: 20, fontWeight: '500', color: '#2E6F40' },
  liabilityValue: { color: '#C0392B' },

  input: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginVertical: 14,
    borderWidth: 0.5,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#1a1a1a',
  },
  primaryButton: {
    backgroundColor: '#2E6F40',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '500', color: '#1a1a1a', textAlign: 'center' },
});