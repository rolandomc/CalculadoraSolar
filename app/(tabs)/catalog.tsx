import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import baseDatos from '../../data/catalogo.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function CatalogScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  
  const [tab, setTab] = useState<'paneles' | 'inversores'>('paneles');
  const [comparando, setComparando] = useState<any[]>([]);

  const toggleComparar = (item: any) => {
    if (comparando.find(c => c.id === item.id)) {
      setComparando(comparando.filter(c => c.id !== item.id));
    } else if (comparando.length < 2) {
      setComparando([...comparando, item]);
    }
  };

  const seleccionarParaCotizador = async (item: any) => {
    // Guardamos la selección para que el cotizador la detecte
    await AsyncStorage.setItem('@seleccion_cotizador', JSON.stringify({
      tipo: tab,
      item: item
    }));
    router.push('/quoter');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab('paneles')} style={[styles.tab, { borderBottomColor: tab === 'paneles' ? theme.primary : 'transparent' }]}>
          <Text style={{ color: theme.text }}>Paneles</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('inversores')} style={[styles.tab, { borderBottomColor: tab === 'inversores' ? theme.primary : 'transparent' }]}>
          <Text style={{ color: theme.text }}>Inversores</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tab === 'paneles' ? baseDatos.paneles : baseDatos.inversores}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.nombre}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => toggleComparar(item)} style={styles.btn}>
                <Text style={{ color: theme.primary }}>Comparar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seleccionarParaCotizador(item)} style={styles.btn}>
                <Text style={{ color: '#10B981' }}>Usar en Cotización</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderBottomWidth: 2 },
  card: { padding: 15, borderRadius: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', marginTop: 10 },
  btn: { marginRight: 15 }
});