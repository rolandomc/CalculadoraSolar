import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Configuración</Text>
      
      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: theme.card }]} 
        onPress={toggleTheme}
      >
        <Text style={{ color: theme.text }}>Modo Oscuro</Text>
        <Ionicons name={isDark ? "toggle" : "toggle-outline"} size={30} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 12, alignItems: 'center' }
});