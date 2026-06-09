import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function ToolsScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20 }}>
      
      {/* Tarjeta de Herramienta 1 */}
      <TouchableOpacity style={{ backgroundColor: theme.card, padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderColor: theme.border, borderWidth: 1 }}>
        <Ionicons name="document-text-outline" size={30} color={theme.primary} style={{ marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Lector de Recibo</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>Extraer historial desde PDF</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      {/* Tarjeta de Herramienta 2 */}
      <TouchableOpacity style={{ backgroundColor: theme.card, padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderColor: theme.border, borderWidth: 1 }}>
        <Ionicons name="compass-outline" size={30} color={theme.primary} style={{ marginRight: 15 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Brújula de Inclinación</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>Alinear módulos correctamente</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

    </ScrollView>
  );
}