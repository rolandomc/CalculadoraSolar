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

  // Flecha personalizada para limpiar el texto "(tabs)" en iOS
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
        // Usamos nuestra flecha limpia en las herramientas
        headerLeft: ({ canGoBack }) => canGoBack ? <CustomBackButton /> : null,
        gestureEnabled: true,
      }}
    >
      {/* La carpeta de pestañas inferior */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* LAS PANTALLAS QUE SÍ ESTÁN EN TU CARPETA PRINCIPAL APP/ */}
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