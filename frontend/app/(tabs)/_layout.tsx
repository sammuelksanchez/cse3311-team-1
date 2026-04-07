import { Tabs } from 'expo-router';
import React from 'react';
import {Platform} from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
const colorScheme = useColorScheme();

return (
<Tabs
screenOptions={{
// Change this to the blue used in your buttons
tabBarActiveTintColor: '#CFFFDC', 
headerShown: false,
tabBarButton: HapticTab,
tabBarStyle: {
backgroundColor: '#253D2C',
borderTopWidth: 1,
borderTopColor: '#eeeeee',
height: Platform.OS === 'ios' ? 88 : 60, // Gives the bottom bar more breathing room
},
tabBarLabelStyle: {
fontSize: 12,
fontWeight: '500',
}
}}>
<Tabs.Screen
name="home"
options={{
title: 'Home',
tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
}}
/>
<Tabs.Screen
name="history"
options={{
title: 'History',
tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" color={color} />,
}}
/>
<Tabs.Screen
name="ranking"
options={{
title: 'Ranking',
tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
}}
/>
<Tabs.Screen
name="profile" // Keep the filename 'profile.tsx'
options={{
title: 'Account', // Displayed label
tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
}}
/>
</Tabs>
);
}