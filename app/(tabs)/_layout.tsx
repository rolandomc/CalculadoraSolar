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
        // ESTO SOLUCIONA QUE EL CONTENIDO SE VAYA HACIA ARRIBA
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
      {/* ==========================================
          LOS ÚNICOS 3 ICONOS VISIBLES
          ========================================== */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calculadora Solar', // Título arriba
          tabBarLabel: 'Inicio',      // Texto abajo en el icono
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
          PANTALLAS OCULTAS DE LA BARRA INFERIOR 
          ========================================== */}
      <Tabs.Screen name="catalog" options={{ href: null, title: 'Catálogo de Equipos' }} />
      <Tabs.Screen name="history" options={{ href: null, title: 'Mis Cotizaciones' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Perfil de Empresa' }} />
      <Tabs.Screen name="batteries" options={{ href: null, title: 'Cálculo de Baterías' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Configuración' }} />
      <Tabs.Screen name="string-calculator" options={{ href: null, title: 'Cálculo de Strings' }} />
    </Tabs>
  );
}