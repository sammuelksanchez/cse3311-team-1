import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getRankings } from '@/services/api';
import { useFocusEffect } from 'expo-router';

export default function RankingScreen() {
  const [rankings, setRankings] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRankings()
        .then(data => setRankings(data))
        .catch(err => console.error(err));
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: 'lightgray' }]} >
      <Text style={styles.title}>Rankings</Text>
      <FlatList
        data={rankings}
        keyExtractor={(item) => item.customerID}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.goal}>${item.networth.toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
  },
  name: {
    flex: 1,
    fontSize: 16,
  },
  goal: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});