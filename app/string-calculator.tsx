import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import baseDatos from '../data/catalogo.json';
import inversoresDatos from '../data/growatt.json';

export default function StringCalculator() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [panel, setPanel] = useState<any>(null);
  const [inversor, setInversor] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoSeleccion, setTipoSeleccion] = useState<'panel' | 'inversor'>('panel');
  const [resultado, setResultado] = useState<any>(null);

  const calcular = () => {
    if (!panel || !inversor) return;
    
    // El factor 1.25 es el margen por temperatura fría (NOM/NEC)
    const voc = panel.voc || 48; 
    const vMax = inversor.vMax || 500;
    const maxPaneles = Math.floor(vMax / (voc * 1.25));
    
    setResultado({ maxPaneles, vMax, voltSeguro: voc * 1.25 });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Cálculo de Strings</Text>

      <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => { setTipoSeleccion('panel'); setModalVisible(true); }}>
        <Text style={{ color: theme.textSecondary }}>Panel: {panel ? panel.nombre : 'Seleccionar Panel...'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => { setTipoSeleccion('inversor'); setModalVisible(true); }}>
        <Text style={{ color: theme.textSecondary }}>Inversor: {inversor ? inversor.nombre : 'Seleccionar Inversor...'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={calcular}>
        <Text style={{ fontWeight: 'bold' }}>Calcular Serie Segura</Text>
      </TouchableOpacity>

      {resultado && (
        <View style={[styles.result, { backgroundColor: resultado.maxPaneles > 0 ? '#10B98120' : '#EF444420' }]}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.text }}>Máximo: {resultado.maxPaneles} paneles en serie</Text>
          <Text style={{ color: theme.textSecondary }}>Voltaje máximo inversor: {resultado.vMax}V</Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, padding: 20, backgroundColor: theme.background }}>
          <Text style={{ fontSize: 20, marginBottom: 20, color: theme.text }}>Selecciona {tipoSeleccion}</Text>
          <FlatList
            data={tipoSeleccion === 'panel' ? baseDatos.paneles : inversoresDatos.inversores}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => {
                tipoSeleccion === 'panel' ? setPanel(item) : setInversor(item);
                setModalVisible(false);
              }}>
                <Text style={{ color: theme.text }}>{item.nombre}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 20, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ccc' },
  btn: { padding: 15, borderRadius: 8, alignItems: 'center' },
  result: { padding: 20, borderRadius: 12, marginTop: 20 },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' }
});