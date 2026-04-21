import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getNetworthHistory, getInvestmentHistory } from '@/services/api';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTHS_SHORT: Record<string, string> = {
January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec'
};

type MonthData = {
month: string;
investments: number;
savings: number;
liabilities: number;
networth: number;
};

type InvData = {
month: string;
total: number;
};

export default function HistoryScreen() {
const [history, setHistory] = useState<MonthData[]>([]);
const [invHistory, setInvHistory] = useState<InvData[]>([]);

useFocusEffect(
useCallback(() => {
getNetworthHistory().then(setHistory).catch(console.error);
getInvestmentHistory().then(setInvHistory).catch(console.error);
}, [])
);

const maxValue = Math.max(...history.map(h => h.investments + h.savings + h.liabilities), 1);
const chartHeight = 220;
const barWidth = 44;
const barGap = 16;
const chartWidth = Math.max(SCREEN_WIDTH - 40, history.length * (barWidth + barGap));

// Line chart config
const lineChartHeight = 180;
const lineChartPadding = { top: 16, bottom: 24, left: 30, right: 16 };
const pointSpacing = 60;
const lineChartWidth = Math.max(
SCREEN_WIDTH - 40,
invHistory.length * pointSpacing + lineChartPadding.left + lineChartPadding.right
);
const maxInv = Math.max(...invHistory.map(d => d.total), 1);

const getX = (i: number) => lineChartPadding.left + 20 + i * pointSpacing;
const getY = (val: number) => lineChartPadding.top + (1 - val / maxInv) * (lineChartHeight - lineChartPadding.top - lineChartPadding.bottom);

const points = invHistory.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');

return (
<View style={styles.container}>
<ScrollView showsVerticalScrollIndicator={false}>

{/* Net Worth Bar Chart */}
<Text style={styles.title}>Net Worth History</Text>
<View style={styles.legend}>
{[['#68BA7F', 'Investments'], ['#2E6F40', 'Savings'], ['#253D2C', 'Liabilities']].map(([color, label]) => (
<View key={label} style={styles.legendItem}>
<View style={[styles.legendDot, { backgroundColor: color }]} />
<Text style={styles.legendText}>{label}</Text>
</View>
))}
</View>

{history.length === 0 ? (
<Text style={styles.empty}>No data yet. Add financials on the Home tab.</Text>
) : (
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
<View style={{ width: chartWidth, paddingHorizontal: 10 }}>
<View style={{ flexDirection: 'row' }}>
<View style={{ height: chartHeight, justifyContent: 'space-between', marginRight: 8, alignItems: 'flex-end' }}>
{[...Array(5)].map((_, i) => (
<Text key={i} style={styles.yLabel}>
${((maxValue * (4 - i)) / 4 / 1000).toFixed(0)}k
</Text>
))}
</View>
<View style={{ flex: 1, height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', gap: barGap }}>
{history.map((item) => {
const invH = (item.investments / maxValue) * chartHeight;
const savH = (item.savings / maxValue) * chartHeight;
const libH = (item.liabilities / maxValue) * chartHeight;
return (
<View key={item.month} style={{ alignItems: 'center' }}>
<View style={{ width: barWidth, height: chartHeight, justifyContent: 'flex-end' }}>
<View style={{ width: barWidth, height: libH, backgroundColor: '#253D2C', borderRadius: 2 }} />
<View style={{ width: barWidth, height: savH, backgroundColor: '#2E6F40' }} />
<View style={{ width: barWidth, height: invH, backgroundColor: '#68BA7F', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
</View>
</View>
);
})}
</View>
</View>
<View style={{ flexDirection: 'row', marginLeft: 48, marginTop: 6, gap: barGap }}>
{history.map((item) => (
<Text key={item.month} style={[styles.xLabel, { width: barWidth }]}>
{MONTHS_SHORT[item.month]}
</Text>
))}
</View>
</View>
</ScrollView>
)}

{/* Investment Line Chart */}
<Text style={[styles.title, { marginTop: 32 }]}>Investment Growth</Text>

{invHistory.length === 0 ? (
<Text style={styles.empty}>No investment data yet.</Text>
) : (
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
<Svg width={lineChartWidth} height={lineChartHeight}>
{/* Y axis grid lines and labels */}
{[...Array(5)].map((_, i) => {
const val = (maxInv * (4 - i)) / 4;
const y = getY(val);
return (
<View key={i}>
<Line
x1={lineChartPadding.left} y1={y}
x2={lineChartWidth - lineChartPadding.right} y2={y}
stroke="#eee" strokeWidth="1"
/>
<SvgText
x={lineChartPadding.left - 6} y={y + 4}
fontSize="10" fill="#aaa" textAnchor="end"
>
{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
</SvgText>
</View>
);
})}

{/* Line */}
<Polyline
points={points}
fill="none"
stroke="#2E6F40"
strokeWidth="2.5"
strokeLinejoin="round"
strokeLinecap="round"
/>

{/* Dots and labels */}
{invHistory.map((d, i) => (
<View key={d.month}>
<Circle
cx={getX(i)} cy={getY(d.total)}
r="4" fill="#fff" stroke="#2E6F40" strokeWidth="2.5"
/>
<SvgText
x={getX(i)} y={lineChartHeight - 4}
fontSize="10" fill="#aaa" textAnchor="middle"
>
{MONTHS_SHORT[d.month]}
</SvgText>
</View>
))}
</Svg>
</ScrollView>
)}

</ScrollView>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f8f9fa' },
title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1a1a1a' },
legend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
legendDot: { width: 10, height: 10, borderRadius: 5 },
legendText: { fontSize: 13, color: '#666' },
yLabel: { fontSize: 11, color: '#aaa' },
xLabel: { fontSize: 11, color: '#aaa', textAlign: 'center' },
empty: { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
