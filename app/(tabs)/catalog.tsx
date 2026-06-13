import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import baseDatos from '../../data/catalogo.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function CatalogScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [tab, setTab] = useState<'paneles' | 'inversores'>('paneles');
  const [search, setSearch] = useState('');
  const [comparando, setComparando] = useState<any[]>([]);
  const [modalComparar, setModalComparar] = useState(false);

  // Filtro en tiempo real
  const datosActivos = tab === 'paneles' ? baseDatos.paneles : baseDatos.inversores;
  const equiposFiltrados = datosActivos.filter((item: any) => 
    item.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const toggleComparar = (item: any) => {
    if (comparando.find(c => c.id === item.id)) {
      setComparando(comparando.filter(c => c.id !== item.id));
    } else if (comparando.length < 2) {
      setComparando([...comparando, item]);
    }
  };

  const seleccionarParaCotizador = async (item: any) => {
    try {
      await AsyncStorage.setItem('@seleccion_cotizador', JSON.stringify({
        tipo: tab,
        item: item
      }));
      Alert.alert('Equipo Seleccionado', `Se enviará el ${item.nombre} al cotizador.`);
      router.push('/quoter');
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el equipo.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Catálogo de Equipos</Text>
      
      {/* Pestañas (Tabs) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, { borderBottomColor: tab === 'paneles' ? theme.primary : 'transparent' }]} 
          onPress={() => { setTab('paneles'); setComparando([]); setSearch(''); }}
        >
          <Text style={{ color: theme.text, fontWeight: tab === 'paneles' ? 'bold' : 'normal' }}>Paneles Solares</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, { borderBottomColor: tab === 'inversores' ? theme.primary : 'transparent' }]} 
          onPress={() => { setTab('inversores'); setComparando([]); setSearch(''); }}
        >
          <Text style={{ color: theme.text, fontWeight: tab === 'inversores' ? 'bold' : 'normal' }}>Inversores</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={[styles.search, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
        placeholder={`Buscar ${tab}...`}
        placeholderTextColor={theme.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={equiposFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1, marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{item.nombre}</Text>
              {tab === 'paneles' ? (
                <Text style={{ color: theme.textSecondary }}>Potencia: {item.pMax} W | Voc: {item.voc}V</Text>
              ) : (
                <Text style={{ color: theme.textSecondary }}>Capacidad: {item.potenciaCA} kW</Text>
              )}
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={() => toggleComparar(item)} 
                style={[styles.btnAccion, { backgroundColor: comparando.find(c => c.id === item.id) ? theme.primary + '50' : theme.inputBg, borderColor: theme.border }]}
              >
                <Ionicons name="git-compare-outline" size={16} color={theme.text} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 12, color: theme.text, fontWeight: '600' }}>
                  {comparando.find(c => c.id === item.id) ? 'Seleccionado' : 'Comparar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => seleccionarParaCotizador(item)} 
                style={[styles.btnAccion, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#000" style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 12, color: '#000', fontWeight: 'bold' }}>Usar en Cotizador</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {comparando.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalComparar(true)}>
          <Ionicons name="git-compare" size={20} color="#000" style={{ marginRight: 8 }} />
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Comparar ({comparando.length}/2)</Text>
        </TouchableOpacity>
      )}

      {/* MODAL DE COMPARACIÓN */}
      <Modal visible={modalComparar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Comparativa Técnica</Text>
              <TouchableOpacity onPress={() => setModalComparar(false)}><Ionicons name="close-circle" size={28} color={theme.textSecondary} /></TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {comparando.map(c => (
                <View key={c.id} style={{ flex: 1, padding: 10, borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginHorizontal: 5, backgroundColor: theme.background }}>
                  <Text style={{ fontWeight: 'bold', color: theme.primary, marginBottom: 10, fontSize: 16 }}>{c.nombre}</Text>
                  {tab === 'paneles' ? (
                    <>
                      <Text style={{ color: theme.text, marginBottom: 5 }}>⚡ <Text style={{fontWeight:'bold'}}>{c.pMax} W</Text> (Potencia)</Text>
                      <Text style={{ color: theme.textSecondary, marginBottom: 5 }}>Voc: {c.voc} V</Text>
                      <Text style={{ color: theme.textSecondary }}>Isc: {c.isc} A</Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ color: theme.text, marginBottom: 5 }}>⚡ <Text style={{fontWeight:'bold'}}>{c.potenciaCA} kW</Text> (Salida CA)</Text>
                    </>
                  )}
                </View>
              ))}
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 10 },
  tabsContainer: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderBottomWidth: 2 },
  search: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  card: { padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  btnAccion: { flex: 1, flexDirection: 'row', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, elevation: 5, flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: '50%', borderWidth: 1 }
});