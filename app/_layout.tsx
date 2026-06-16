import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

export default function TabLayout() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: true, 
        headerStyle: { 
          backgroundColor: theme.card, 
          elevation: 0, 
          shadowOpacity: 0, 
          borderBottomWidth: 1, 
          borderBottomColor: theme.border 
        },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          elevation: 0, 
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calculadora Solar',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="quoter"
        options={{
          title: 'Cotizador de Sistemas',
          tabBarLabel: 'Cotizar',
          tabBarIcon: ({ color }) => <Ionicons name="calculator-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú de Opciones',
          tabBarLabel: 'Menú',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}