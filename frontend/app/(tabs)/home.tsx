import { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { getCustomer, getFinancials, saveFinancials, getInvestmentItems, getLiabilityItems } from '@/services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getCurrentMonth() {
  return MONTHS[new Date().getMonth()];
}

function getMonthsUpToCurrent() {
  const currentMonthIndex = new Date().getMonth();
  return MONTHS.slice(0, currentMonthIndex + 1);
}

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
  const goalPercent = customer ? Math.round((networth / parseFloat(customer.networth_goal)) * 100) : 0;

  useFocusEffect(
    useCallback(() => {
      getCustomer().then(setCustomer).catch(console.error);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      getFinancials(selectedMonth).then(data => setSavings(data.savings)).catch(console.error);
      getInvestmentItems(selectedMonth).then(items => {
        const total = items.reduce((sum: number, i: any) => sum + parseFloat(i.amount || '0'), 0);
        setInvestments(String(total));
      }).catch(console.error);
      getLiabilityItems(selectedMonth).then(items => {
        const total = items.reduce((sum: number, i: any) => sum + parseFloat(i.amount || '0'), 0);
        setLiabilities(String(total));
      }).catch(console.error);
    }, [selectedMonth])
  );

  const handleSave = async () => {
    try {
      await saveFinancials(investments, savings, liabilities, selectedMonth);
      alert("Progress saved!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Net Worth Card */}
        <View style={styles.networthCard}>
          <Text style={styles.networthLabel}>{selectedMonth} Net Worth</Text>
          <Text style={styles.networthValue}>${networth.toLocaleString()}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(goalPercent, 100)}%` }]} />
          </View>
          <Text style={styles.goalText}>
            {goalPercent}% of ${parseFloat(customer?.networth_goal || '0').toLocaleString()} goal
          </Text>
        </View>

        {/* Month Selector */}
        <TouchableOpacity style={styles.monthSelector} onPress={() => setShowMonthPicker(!showMonthPicker)}>
          <Text style={styles.monthSelectorText}>{selectedMonth} Overview ▾</Text>
        </TouchableOpacity>

        {showMonthPicker && (
          <View style={styles.monthDropdown}>
            {months.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.monthOption, m === selectedMonth && styles.monthOptionSelected]}
                onPress={() => {
                  setSelectedMonth(m);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[styles.monthOptionText, m === selectedMonth && styles.monthOptionTextSelected]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action List */}
        <View style={styles.listSection}>
          <TouchableOpacity style={styles.itemButton} onPress={() => router.push(`/investments?month=${selectedMonth}` as any)}>
            <Text style={styles.itemButtonLabel}>Investments</Text>
            <Text style={styles.itemButtonValue}>${parseFloat(investments || '0').toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemButton} onPress={() => setShowSavingsModal(true)}>
            <Text style={styles.itemButtonLabel}>Savings</Text>
            <Text style={styles.itemButtonValue}>${parseFloat(savings || '0').toLocaleString()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemButton} onPress={() => router.push(`/liabilities?month=${selectedMonth}` as any)}>
            <Text style={styles.itemButtonLabel}>Liabilities</Text>
            <Text style={styles.itemButtonValue}>${parseFloat(liabilities || '0').toLocaleString()}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Reusable Modal with Clean Theme */}
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
              placeholderTextColor="#666"
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
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 20,
  },
  networthCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    // Soft shadow
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 }
    })
  },
  networthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  networthValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarBg: {
    height: 8,
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2E6F40',
  },
  goalText: {
    fontSize: 13,
    color: '#888',
    marginTop: 10,
  },
  monthSelector: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  monthSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E6F40',
  },
  monthDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  monthOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthOptionSelected: {
    backgroundColor: '#CFFFDC',
  },
  monthOptionText: {
    fontSize: 16,
    color: '#2E6F40',
  },
  monthOptionTextSelected: {
    color: '#2E6F40',
    fontWeight: 'bold',
  },
  listSection: {
    marginBottom: 20,
  },
  itemButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemButtonLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  itemButtonValue: {
    fontSize: 16,
    color: '#2E6F40',
    fontWeight: 'bold',
  },
  input: {
    height: 55,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#2E6F40",
    height: 55,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    // Shadow
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 5 }
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
});