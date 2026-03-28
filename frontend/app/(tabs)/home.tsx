import { StyleSheet, TouchableOpacity, Text, View, ScrollView, TextInput } from 'react-native';
import { auth } from '@/firebaseconfig';
import { router } from 'expo-router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getCustomer, getFinancials, saveFinancials } from '@/services/api';

export default function TabOneScreen() {
  const [customer, setCustomer] = useState<any>(null);
  const [investments, setInvestments] = useState('');
  const [savings, setSavings] = useState('');
  const [liabilities, setLiabilities] = useState('');

  const networth = (parseFloat(investments || '0') + parseFloat(savings || '0')) - parseFloat(liabilities || '0');
  const goalPercent = customer ? Math.round((networth / parseFloat(customer.networth_goal)) * 100) : 0;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace('/' as any);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    getCustomer()
      .then(data => {
        console.log('customer data:', JSON.stringify(data));
        setCustomer(data);
      })
      .catch(err => console.error(err));

    getFinancials()
      .then(data => {
        setInvestments(String(data.investments));
        setSavings(String(data.savings));
        setLiabilities(String(data.liabilities));
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = async () => {
    try {
      await saveFinancials(
        parseFloat(investments || '0'),
        parseFloat(savings || '0'),
        parseFloat(liabilities || '0')
      );
      console.log('saved!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.networthCard}>
        <Text style={styles.networthLabel}>Current Net Worth</Text>
        <Text style={styles.networthValue}>${networth.toLocaleString()}</Text>
        <Text style={styles.goalText}>{goalPercent}% of your ${parseFloat(customer?.networth_goal || '0').toLocaleString()} goal</Text>
      </View>

      <Text style={styles.sectionTitle}>Update Financials</Text>

      <Text style={styles.label}>Investments</Text>
      <TextInput
        style={styles.input}
        value={investments}
        onChangeText={setInvestments}
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.label}>Savings</Text>
      <TextInput
        style={styles.input}
        value={savings}
        onChangeText={setSavings}
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.label}>Liabilities</Text>
      <TextInput
        style={styles.input}
        value={liabilities}
        onChangeText={setLiabilities}
        keyboardType="numeric"
        placeholder="0"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut(auth)}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  networthCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  networthLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  networthValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  goalText: {
    fontSize: 14,
    color: '#444',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#4f46e5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signOutButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  signOutText: {
    color: '#e53e3e',
    fontSize: 16,
  }
});