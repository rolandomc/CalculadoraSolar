import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false, // Ocultamos el header nativo para que tu diseño luzca más limpio
      tabBarActiveTintColor: '#10B981', 
      tabBarStyle: { backgroundColor: '#121212', borderTopWidth: 0 } 
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Calcular', 
          tabBarIcon: ({color}) => <Ionicons name="calculator" size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="catalog" 
        options={{ 
          title: 'Equipos', 
          tabBarIcon: ({color}) => <Ionicons name="list" size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}