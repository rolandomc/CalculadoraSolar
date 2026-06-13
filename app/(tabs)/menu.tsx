import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const MenuItem = ({ icon, title, subtitle, onPress, theme }: any) => (
  <TouchableOpacity 
    style={[styles.menuItem, { backgroundColor: theme.card, borderBottomColor: theme.border }]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
      <Ionicons name={icon} size={24} color={theme.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
  </TouchableOpacity>
);

export default function MenuScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Más Opciones</Text>
        <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
          Gestiona tus herramientas y configuraciones
        </Text>
      </View>

      {/* SECCIÓN HERRAMIENTAS */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HERRAMIENTAS</Text>
        <View style={[styles.cardGroup, { borderColor: theme.border, backgroundColor: theme.card }]}>
          
          <MenuItem 
            theme={theme}
            icon="hardware-chip-outline" 
            title="Catálogo de Equipos" 
            subtitle="Paneles e Inversores"
            onPress={() => router.push('/catalog')} 
          />

          {/* Enlace añadido para tu calculadora de baterías */}
          <MenuItem 
            theme={theme}
            icon="battery-charging-outline" 
            title="Calculadora de Baterías" 
            subtitle="Dimensionamiento de almacenamiento"
            onPress={() => router.push('/batteries')} // Cambia a '/batteries' si ajustaste el nombre
          />
          
          <MenuItem 
            theme={theme}
            icon="folder-open-outline" 
            title="Historial de Cotizaciones" 
            subtitle="Tus propuestas guardadas"
            onPress={() => router.push('/history')} 
          />
          
        </View>
      </View>

      {/* SECCIÓN EMPRESA Y AJUSTES */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CUENTA Y PREFERENCIAS</Text>
        <View style={[styles.cardGroup, { borderColor: theme.border, backgroundColor: theme.card }]}>
          
          <MenuItem 
            theme={theme}
            icon="business-outline" 
            title="Perfil de Empresa" 
            subtitle="Logotipo, nombre y datos para PDFs"
            onPress={() => router.push('/profile')} 
          />
          
          <MenuItem 
            theme={theme}
            icon="settings-outline" 
            title="Configuración" 
            subtitle="Apariencia y ajustes de la app"
            onPress={() => router.push('/settings')} 
          />

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginLeft: 12, letterSpacing: 1 },
  cardGroup: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  subtitle: { fontSize: 12 }
});