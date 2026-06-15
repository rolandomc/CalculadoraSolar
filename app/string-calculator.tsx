import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, FlatList, SafeAreaView } from 'react-native';
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

  const abrirSelector = (tipo: 'panel' | 'inversor') => {
    setTipoSeleccion(tipo);
    setModalVisible(true);
  };

  const calcular = () => {
    if (!panel || !inversor) return;
    
    // Asumimos 48V y 500V por defecto si el JSON no tiene el dato, para evitar errores
    const voc = panel.voc || 48; 
    const vMax = inversor.vMax || 500;
    
    // Factor 1.25x por temperatura fría (NOM/NEC)
    const maxPaneles = Math.floor(vMax / (voc * 1.25));
    
    setResultado({ 
      maxPaneles, 
      vMax, 
      voc, 
      voltSeguro: Math.round(voc * 1.25 * 10) / 10 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={styles.header}>
          <Ionicons name="pulse" size={32} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>Validación de Strings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Evita quemar el inversor por sobrevoltaje calculando la cadena máxima permitida.
          </Text>
        </View>

        {/* TARJETA DEL PANEL */}
        <TouchableOpacity 
          style={[styles.selectorCard, { backgroundColor: theme.card, borderColor: panel ? theme.primary : theme.border }]} 
          onPress={() => abrirSelector('panel')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="apps-outline" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Panel Solar</Text>
            <Text style={[styles.cardValue, { color: panel ? theme.text : theme.textSecondary }]}>
              {panel ? panel.nombre : 'Toca para seleccionar...'}
            </Text>
            {panel && <Text style={{ color: theme.primary, fontSize: 12, marginTop: 4 }}>Voc: {panel.voc || 48}V</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* TARJETA DEL INVERSOR */}
        <TouchableOpacity 
          style={[styles.selectorCard, { backgroundColor: theme.card, borderColor: inversor ? theme.primary : theme.border }]} 
          onPress={() => abrirSelector('inversor')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="hardware-chip-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Inversor</Text>
            <Text style={[styles.cardValue, { color: inversor ? theme.text : theme.textSecondary }]}>
              {inversor ? inversor.nombre : 'Toca para seleccionar...'}
            </Text>
            {inversor && <Text style={{ color: '#3B82F6', fontSize: 12, marginTop: 4 }}>Vmax: {inversor.vMax || 500}V</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* BOTÓN CALCULAR */}
        <TouchableOpacity 
          style={[styles.calcButton, { backgroundColor: (panel && inversor) ? theme.primary : theme.border }]} 
          onPress={calcular}
          disabled={!panel || !inversor}
        >
          <Ionicons name="calculator" size={20} color={(panel && inversor) ? '#000' : theme.textSecondary} style={{ marginRight: 8 }} />
          <Text style={[styles.calcButtonText, { color: (panel && inversor) ? '#000' : theme.textSecondary }]}>
            Evaluar Compatibilidad
          </Text>
        </TouchableOpacity>

        {/* TARJETA DE RESULTADO */}
        {resultado && (
          <View style={[styles.resultContainer, { backgroundColor: resultado.maxPaneles > 0 ? theme.primary + '15' : '#EF444415', borderColor: resultado.maxPaneles > 0 ? theme.primary : '#EF4444' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name={resultado.maxPaneles > 0 ? "checkmark-circle" : "warning"} size={28} color={resultado.maxPaneles > 0 ? theme.primary : '#EF4444'} />
              <Text style={[styles.resultTitle, { color: resultado.maxPaneles > 0 ? theme.primary : '#EF4444', marginLeft: 10 }]}>
                {resultado.maxPaneles > 0 ? 'Conexión Segura' : 'Incompatibilidad'}
              </Text>
            </View>
            
            <Text style={[styles.resultMainValue, { color: theme.text }]}>
              Máx. <Text style={{ fontWeight: '900', color: resultado.maxPaneles > 0 ? theme.primary : '#EF4444' }}>{resultado.maxPaneles}</Text> paneles en serie
            </Text>

            <View style={styles.resultDetailsBox}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 5 }}>
                • Límite del inversor: <Text style={{ fontWeight: 'bold', color: theme.text }}>{resultado.vMax}V</Text>
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 5 }}>
                • Voc del panel (frío extremo): <Text style={{ fontWeight: 'bold', color: theme.text }}>{resultado.voltSeguro}V</Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE SELECCIÓN MEJORADO */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Selecciona {tipoSeleccion === 'panel' ? 'un Panel' : 'un Inversor'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            contentContainerStyle={{ padding: 20 }}
            data={tipoSeleccion === 'panel' ? baseDatos.paneles : inversoresDatos.inversores}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.border }]} 
                onPress={() => {
                  tipoSeleccion === 'panel' ? setPanel(item) : setInversor(item);
                  setModalVisible(false);
                  setResultado(null); // Borramos el resultado anterior si cambia un equipo
                }}
              >
                <View style={[styles.iconBoxSmall, { backgroundColor: tipoSeleccion === 'panel' ? theme.primary + '20' : '#3B82F620' }]}>
                  <Ionicons name={tipoSeleccion === 'panel' ? "apps" : "hardware-chip"} size={20} color={tipoSeleccion === 'panel' ? theme.primary : '#3B82F6'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listName, { color: theme.text }]}>{item.nombre}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {tipoSeleccion === 'panel' ? `Potencia: ${item.pMax}W | Voc: ${item.voc || 48}V` : `Potencia: ${item.potenciaCA || item.potencia}W | Vmax: ${item.vMax || 500}V`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 30, alignItems: 'center', marginTop: 10 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 10, marginBottom: 5 },
  subtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  
  selectorCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  cardValue: { fontSize: 16, fontWeight: '600' },
  
  calcButton: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  calcButtonText: { fontSize: 16, fontWeight: 'bold' },
  
  resultContainer: { padding: 24, borderRadius: 16, marginTop: 30, borderWidth: 1 },
  resultTitle: { fontSize: 18, fontWeight: 'bold' },
  resultMainValue: { fontSize: 22, marginTop: 10, marginBottom: 15 },
  resultDetailsBox: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.2)' },
  
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 5 },
  
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  iconBoxSmall: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  listName: { fontSize: 16, fontWeight: 'bold' }
});