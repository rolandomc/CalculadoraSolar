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

  // Flecha estandarizada para TODA la app (elimina el texto "(tabs)" en iOS)
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
        // Forzamos el uso de nuestra flecha personalizada si hay a dónde volver
        headerLeft: ({ canGoBack }) => canGoBack ? <CustomBackButton /> : null,
        // Obliga a que el gesto de deslizar para volver esté activo
        gestureEnabled: true,
        // Orientación de la animación nativa
        animation: 'slide_from_right', 
      }}
    >
      {/* 1. Las Pestañas Inferiores (La barra inferior) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 2. Todas las pantallas secundarias (Navegación Fluida con Swipe) */}
      {/* Nota: Asegúrate de haber movido estos archivos a la carpeta 'app/' */}
      <Stack.Screen name="catalog" options={{ title: 'Catálogo de Equipos' }} />
      <Stack.Screen name="history" options={{ title: 'Mis Cotizaciones' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil de Empresa' }} />
      <Stack.Screen name="batteries" options={{ title: 'Cálculo de Baterías' }} />
      <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
      <Stack.Screen name="tools" options={{ title: 'Herramientas de Campo' }} />
      <Stack.Screen name="norms" options={{ title: 'Normativas (NOM)' }} />
      <Stack.Screen name="string-calculator" options={{ title: 'Cálculo de Strings' }} />
      
      {/* 3. Modales que se abren de abajo hacia arriba */}
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