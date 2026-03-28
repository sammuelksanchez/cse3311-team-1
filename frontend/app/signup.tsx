import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { auth } from '@/firebaseconfig';
import { router } from 'expo-router';

export default function SignupDetails() {
  const [name, setName] = useState('');
  const [networthGoal, setNetworthGoal] = useState('');
  const [networthGoalDate, setNetworthGoalDate] = useState('');

  const handleSubmit = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch('http://127.0.0.1:8000/customer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          networth_goal: networthGoal,
          networth_goal_date: networthGoalDate
        })
      });

      if (!response.ok) throw new Error('Failed to create customer');

      router.replace('/(tabs)/home' as any);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Net Worth Goal"
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
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff',
    color: '#000',
  }
});