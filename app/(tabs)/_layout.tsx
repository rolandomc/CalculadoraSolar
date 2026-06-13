import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
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
        name="quoter"
        options={{
          title: 'Cotizador',
          tabBarIcon: ({color}) => <Ionicons name="document-text" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({color}) => <Ionicons name="time" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="batteries"
        options={{
          title: 'Baterías',
          tabBarIcon: ({color}) => <Ionicons name="battery-charging" size={24} color={color} />
        }}
      />
          <Tabs.Screen
        name="catalog"
        options={{
          title: 'Equipos',
          tabBarIcon: ({color}) => <Ionicons name="list" size={24} color={color} />
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({color}) => <Ionicons name="business" size={24} color={color} /> 
          }} />
    </Tabs>
  );
}