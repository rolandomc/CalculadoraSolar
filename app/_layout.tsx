import { Stack } from 'expo-router';
import { PremiumProvider } from '../context/PremiumContext';

export default function RootLayout() {
  return (
    <PremiumProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Cambiamos la ruta principal hacia la carpeta de tabs */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </PremiumProvider>
  );
}