import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth } from '@/firebaseconfig';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createCustomer } from '@/services/api';

export default function SignupDetails() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [networthGoal, setNetworthGoal] = useState('');
  const [networthGoalDate, setNetworthGoalDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || !name || !networthGoal) {
      return Alert.alert('Please fill in all fields');
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await createCustomer(name, networthGoal, networthGoalDate);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Account</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Net Worth Goal ($)"
          placeholderTextColor="#888"
          value={networthGoal}
          onChangeText={setNetworthGoal}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Goal Date (MM-DD-YYYY)"
          placeholderTextColor="#888"
          value={networthGoalDate}
          onChangeText={setNetworthGoalDate}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#2E6F40" style={{ marginTop: 16 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 20, paddingTop: 60 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16, color: '#2E6F40' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  input: {
    marginBottom: 12, height: 50, borderWidth: 1, borderColor: '#e0e0e0',
    borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fafafa', color: '#000',
  },
  button: { marginTop: 10, backgroundColor: '#2E6F40', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
