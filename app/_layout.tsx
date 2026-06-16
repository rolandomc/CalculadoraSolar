import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PremiumProvider } from '../context/PremiumContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

function StackNavigator() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  // Flecha estandarizada para TODA la app
  const CustomBackButton = () => (
    <TouchableOpacity 
      onPress={() => router.back()} 
      style={{ marginLeft: Platform.OS === 'ios' ? 0 : 16, marginRight: 20, padding: 5 }}
    >
      <Ionicons name="arrow-back" size={26} color={theme.text} />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        headerLeft: ({ canGoBack }) => canGoBack ? <CustomBackButton /> : null,
        gestureEnabled: true,
        animation: 'slide_from_right', 
      }}
    >
      {/* Pestañas Principales */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Todas las opciones del Menú (ya están en la raíz) */}
      <Stack.Screen name="catalog" options={{ title: 'Catálogo de Equipos' }} />
      <Stack.Screen name="history" options={{ title: 'Mis Cotizaciones' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil de Empresa' }} />
      <Stack.Screen name="batteries" options={{ title: 'Cálculo de Baterías' }} />
      <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
      <Stack.Screen name="tools" options={{ title: 'Herramientas de Campo' }} />
      <Stack.Screen name="norms" options={{ title: 'Normativas (NOM)' }} />
      <Stack.Screen name="string-calculator" options={{ title: 'Cálculo de Strings' }} />
      
      {/* Modales */}
      <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="pdf-reader" options={{ title: 'Lector PDF', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <PremiumProvider>
        <StackNavigator />
      </PremiumProvider>
    </ThemeProvider>
  );
}