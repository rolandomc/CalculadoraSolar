import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { PremiumProvider } from '../context/PremiumContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

function DrawerNavigator() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Drawer 
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        drawerStyle: { backgroundColor: theme.background },
        drawerActiveTintColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
      }}
    >
      <Drawer.Screen 
        name="(tabs)" 
        options={{ 
          drawerLabel: 'Calculadora', 
          title: 'Calculadora Solar',
          drawerIcon: ({ color }) => <Ionicons name="calculator" size={22} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="tools" 
        options={{ 
          drawerLabel: 'Herramientas', 
          title: 'Herramientas',
          drawerIcon: ({ color }) => <Ionicons name="hammer-outline" size={22} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="paywall" 
        options={{ drawerItemStyle: { display: 'none' } }} 
      />
    </Drawer>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PremiumProvider>
          <DrawerNavigator />
        </PremiumProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}