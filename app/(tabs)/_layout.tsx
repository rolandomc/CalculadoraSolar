import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          elevation: 0, 
          // Eliminamos los padding y height manuales para que no se empuje hacia abajo
        },
      }}
    >
      {/* ==========================================
          LOS ÚNICOS 3 ICONOS VISIBLES
          ========================================== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="quoter"
        options={{
          title: 'Cotizar',
          tabBarIcon: ({ color }) => <Ionicons name="calculator-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />,
        }}
      />

      {/* ==========================================
          PANTALLAS OCULTAS (href: null)
          Aquí bloqueamos los triángulos de advertencia
          ========================================== */}
      <Tabs.Screen
        name="catalog"
        options={{
          href: null,
          headerShown: true,
          title: 'Catálogo de Equipos',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          href: null,
          headerShown: true,
          title: 'Historial de Cotizaciones',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerShown: true,
          title: 'Perfil de Empresa',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          headerShown: true,
          title: 'Configuración',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
        }}
      />

      {/* FIX: Bloqueo del archivo baterries / beterries */}
      <Tabs.Screen
        name="beterries" // Nota: Si tu archivo se llama "batteries", cambia este nombre a "batteries"
        options={{
          href: null,
          headerShown: true,
          title: 'Baterías',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
        }}
      />
    </Tabs>
  );
}