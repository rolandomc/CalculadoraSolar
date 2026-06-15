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
        // Forzamos que se use nuestra flecha sin texto
        headerLeft: ({ canGoBack }) => canGoBack ? <CustomBackButton /> : null,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Pantallas del Stack Principal */}
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