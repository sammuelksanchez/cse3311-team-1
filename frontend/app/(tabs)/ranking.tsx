import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getRankings } from '@/services/api';
import { useFocusEffect } from 'expo-router';

export default function RankingScreen() {
  const [rankings, setRankings] = useState<any[]>([]);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  function getCurrentMonth() {
    return MONTHS[new Date().getMonth()];
  }

  useFocusEffect(
    useCallback(() => {
      getRankings()
        .then(data => setRankings(data))
        .catch(err => console.error(err));
    }, [])
  );

  return (
    <View style={[styles.container]} >
      <Text style={styles.title}> {getCurrentMonth()} Rankings </Text>
      <FlatList
        data={rankings}
        keyExtractor={(item: any, index: number) => index.toString()}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.goal}>{item.goal_percent}%</Text>
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
    backgroundColor: "#f8f9fa",
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
