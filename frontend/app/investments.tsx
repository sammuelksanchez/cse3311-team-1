import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getInvestmentItems, saveInvestmentItem, deleteInvestmentItem } from '@/services/api';

type Item = {
  itemID: string;
  name: string;
  amount: string;
};

export default function InvestmentsPage() {
  const { month } = useLocalSearchParams<{ month: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    getInvestmentItems(month)
      .then(data => setItems(data.map((i: any) => ({
        itemID: i.ItemID || i.itemID,
        name: i.name,
        amount: i.amount
      }))))
      .catch(err => console.error(err));
  }, []);

  const handleAdd = async () => {
    if (!newName || !newAmount) return;
    Keyboard.dismiss();
    try {
      const result = await saveInvestmentItem({ name: newName, amount: newAmount, month });
      setItems(prev => [...prev, { itemID: result.itemID, name: newName, amount: newAmount }]);
      setNewName('');
      setNewAmount('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemID: string) => {
    Alert.alert('Delete', 'Remove this investment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteInvestmentItem(itemID);
            setItems(prev => prev.filter(i => i.itemID !== itemID));
          } catch (err) {
            console.error(err);
          }
        }
      }
    ]);
  };

  const handleEditAmount = async (item: Item, newAmt: string) => {
    const updated = { ...item, amount: newAmt };
    setItems(prev => prev.map(i => i.itemID === item.itemID ? updated : i));
    try {
      await saveInvestmentItem({ itemID: item.itemID, name: item.name, amount: newAmt, month });
    } catch (err) {
      console.error(err);
    }
  };

  const total = items.reduce((sum, i) => sum + parseFloat(i.amount || '0'), 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{month} Investments</Text>
        <Text style={styles.total}>Total: ${total.toLocaleString()}</Text>
  
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { flex: 2 }]}
            placeholder="Name"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput
            style={[styles.addInput, { flex: 1 }]}
            placeholder="Amount"
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
  
        <FlatList
          data={items}
          keyExtractor={item => item.itemID}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.itemName}>{item.name}</Text>
              <TextInput
                style={styles.amountInput}
                value={item.amount}
                onChangeText={val => handleEditAmount(item, val)}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={() => handleDelete(item.itemID)}>
                <Text style={styles.delete}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
  
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  total: { 
    fontSize: 16,
    color: '#2E6F40', 
    fontWeight: '600', 
    marginBottom: 20 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    gap: 10 
  },
  itemName: {
    flex: 2, 
    fontSize: 15 
  },
  amountInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 6, 
    padding: 6, 
    fontSize: 15 
  },
  delete: { 
    color: '#e53e3e', 
    fontSize: 18,
    paddingHorizontal: 6 
  },
  addRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 20,
    alignItems: 'center' 
  },
  addInput: {
    borderWidth: 1,
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 10, 
    fontSize: 15 
  },
  addButton: { 
    backgroundColor: '#2E6F40', 
    padding: 10, 
    borderRadius: 8 
  },
  addButtonText: {
    color: '#fff', 
    fontWeight: 'bold' 
  },
  doneButton: { 
    backgroundColor: '#2E6F40', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20 
  },
  doneButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});