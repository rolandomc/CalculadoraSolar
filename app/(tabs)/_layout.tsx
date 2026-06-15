import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  // Este botón fuerza a la pestaña a volver exactamente a la pantalla "Menú"
  const VolverAlMenu = () => (
    <TouchableOpacity 
      onPress={() => router.push('/menu')} 
      style={{ marginLeft: 16, padding: 5 }}
    >
      <Ionicons name="arrow-back" size={26} color={theme.text} />
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true, 
        headerStyle: { backgroundColor: theme.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: theme.border },
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
      {/* ==========================================
          LOS ÚNICOS 3 ICONOS VISIBLES
          ========================================== */}
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

      {/* ==========================================
          PANTALLAS OCULTAS DEL MENÚ (Con la flecha inyectada)
          ========================================== */}
      <Tabs.Screen 
        name="catalog" 
        options={{ href: null, title: 'Catálogo de Equipos', headerLeft: () => <VolverAlMenu /> }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ href: null, title: 'Mis Cotizaciones', headerLeft: () => <VolverAlMenu /> }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ href: null, title: 'Perfil de Empresa', headerLeft: () => <VolverAlMenu /> }} 
      />
      <Tabs.Screen 
        name="batteries" 
        options={{ href: null, title: 'Cálculo de Baterías', headerLeft: () => <VolverAlMenu /> }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ href: null, title: 'Configuración', headerLeft: () => <VolverAlMenu /> }} 
      />
    </Tabs>
  );
}