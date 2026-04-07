import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard, Switch } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebaseconfig';
import { getCustomer, updateCustomer } from '@/services/api';

export default function Profile() {
const [networthGoal, setNetworthGoal] = useState('');
const [name, setName] = useState('');
const [inRankings, setInRankings] = useState(true);
const [loading, setLoading] = useState(false);

useFocusEffect(
useCallback(() => {
getCustomer()
.then(data => {
setNetworthGoal(String(data.networth_goal));
setName(data.name);
setInRankings(data.in_rankings !== false);
})
.catch(err => console.error(err));
}, [])
);

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (user) => {
if (!user) router.replace('/' as any);
});
return unsubscribe;
}, []);

const handleSaveGoal = async () => {
Keyboard.dismiss();
setLoading(true);
try {
await updateCustomer({ networth_goal: networthGoal });
Alert.alert('Saved!', 'Net worth goal updated.');
} catch (err) {
Alert.alert('Error', 'Failed to save goal.');
} finally {
setLoading(false);
}
};

const handleSaveName = async () => {
Keyboard.dismiss();
setLoading(true);
try {
await updateCustomer({ name });
Alert.alert('Saved!', 'Name updated.');
} catch (err) {
Alert.alert('Error', 'Failed to save name.');
} finally {
setLoading(false);
}
};

const handleToggleRankings = async (value: boolean) => {
setInRankings(value);
try {
await updateCustomer({ in_rankings: value });
} catch (err) {
console.error(err);
}
};

return (
<View style={styles.container}>
<Text style={styles.title}>Profile</Text>

{/* Name */}
<Text style={styles.label}>Name</Text>
<View style={styles.row}>
<TextInput
style={[styles.input, { flex: 1 }]}
value={name}
onChangeText={setName}
placeholder="Your name"
/>
<TouchableOpacity style={styles.saveInline} onPress={handleSaveName} disabled={loading}>
<Text style={styles.saveInlineText}>Save</Text>
</TouchableOpacity>
</View>

{/* Net Worth Goal */}
<Text style={styles.label}>Net Worth Goal</Text>
<View style={styles.row}>
<TextInput
style={[styles.input, { flex: 1 }]}
value={networthGoal}
onChangeText={setNetworthGoal}
keyboardType="numeric"
placeholder="Enter your goal"
/>
<TouchableOpacity style={styles.saveInline} onPress={handleSaveGoal} disabled={loading}>
<Text style={styles.saveInlineText}>Save</Text>
</TouchableOpacity>
</View>

{/* Rankings Toggle */}
<View style={styles.toggleRow}>
<Text style={styles.toggleLabel}>Show in Rankings</Text>
<Switch
value={inRankings}
onValueChange={handleToggleRankings}
trackColor={{ false: '#ddd', true: '#2E6F40' }}
thumbColor="#fff"
/>
</View>

{/* Sign Out */}
<TouchableOpacity style={styles.signOutButton} onPress={() => signOut(auth)}>
<Text style={styles.signOutText}>Sign Out</Text>
</TouchableOpacity>
</View>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
padding: 20,
paddingTop: 60,
backgroundColor: '#f8f9fa',
},
title: {
fontSize: 24,
fontWeight: 'bold',
marginBottom: 30,
},
label: {
fontSize: 14,
color: '#444',
marginBottom: 4,
},
row: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
marginBottom: 20,
},
input: {
height: 50,
borderWidth: 1,
borderRadius: 8,
padding: 10,
backgroundColor: '#fff',
borderColor: '#ddd',
},
saveInline: {
backgroundColor: '#2E6F40',
paddingHorizontal: 16,
height: 50,
borderRadius: 8,
justifyContent: 'center',
alignItems: 'center',
},
saveInlineText: {
color: '#fff',
fontWeight: 'bold',
fontSize: 15,
},
toggleRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingVertical: 16,
borderTopWidth: 1,
borderBottomWidth: 1,
borderColor: '#2E6F40',
marginBottom: 20,
},
toggleLabel: {
fontSize: 16,
color: '#444',
},
signOutButton: {
padding: 16,
alignItems: 'center',
position: 'absolute',
bottom: 40,
left: 20,
right: 20,
},
signOutText: {
color: '#e53e3e',
fontSize: 16,
},
});