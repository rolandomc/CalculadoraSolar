import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { PremiumProvider } from '../context/PremiumContext';
import { Colors } from '../constants/Colors';

// Componente interno para acceder al tema después de que el ThemeProvider lo provee
function StackNavigator() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      {/* 1. El grupo de pestañas inferior (Inicio, Cotizador, Menú) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 2. Las pantallas que antes estaban en el Drawer */}
      <Stack.Screen name="tools" options={{ title: 'Herramientas de Campo' }} />
      <Stack.Screen name="norms" options={{ title: 'Normativas (NOM)' }} />
      
      {/* 3. Pantallas modales */}
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