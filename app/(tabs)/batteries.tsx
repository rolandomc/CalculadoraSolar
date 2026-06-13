import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const InputField = ({ label, value, onChange, placeholder, unit = '', theme, keyboardType = 'decimal-pad' }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, fontWeight: '500' }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        style={{ flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text }}
        placeholder={placeholder} placeholderTextColor={theme.textSecondary} keyboardType={keyboardType} value={value} onChangeText={onChange}
      />
      {unit !== '' && <Text style={{ marginLeft: 8, color: theme.textSecondary, fontWeight: '600', minWidth: 40 }}>{unit}</Text>}
    </View>
  </View>
);

export default function BatteriesScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [inputs, setInputs] = useState({
    consumoDiarioKwh: '5',
    diasAutonomia: '1',
    dod: '80', 
    voltajeSistema: '48', 
    voltajeBateria: '12', 
    capacidadBateriaAh: '200'
  });

  const [resultado, setResultado] = useState<any>(null);

  // Auto-rellenar consumo si escaneó un recibo recientemente
  useFocusEffect(
    useCallback(() => {
      const cargarDatos = async () => {
        try {
          const consumoExtraido = await AsyncStorage.getItem('@scanned_baterias');
          if (consumoExtraido) {
            setInputs(prev => ({ ...prev, consumoDiarioKwh: consumoExtraido }));
          }
        } catch (e) { console.error(e); }
      };
      cargarDatos();
    }, [])
  );

  const calcularBanco = () => {
    const consumoWh = parseFloat(inputs.consumoDiarioKwh) * 1000;
    const dias = parseFloat(inputs.diasAutonomia);
    const dodPercent = parseFloat(inputs.dod) / 100;
    const vSistema = parseFloat(inputs.voltajeSistema);
    const vBateria = parseFloat(inputs.voltajeBateria);
    const ahBateria = parseFloat(inputs.capacidadBateriaAh);

    if ([consumoWh, dias, dodPercent, vSistema, vBateria, ahBateria].some(isNaN) || dodPercent <= 0) {
      Alert.alert('Error', 'Verifica que todos los campos sean números válidos mayores a 0.');
      return;
    }

    if (vSistema % vBateria !== 0) {
      Alert.alert('Advertencia', 'El voltaje del sistema debería ser múltiplo del voltaje de la batería.');
    }

    const energiaRequerida = consumoWh * dias;
    const energiaBanco = energiaRequerida / dodPercent;
    const capacidadTotalAh = energiaBanco / vSistema;
    const bateriasEnSerie = Math.ceil(vSistema / vBateria);
    const bateriasEnParalelo = Math.max(1, Math.ceil(capacidadTotalAh / ahBateria)); 
    const totalBaterias = bateriasEnSerie * bateriasEnParalelo;

    setResultado({
      energiaRequeridaWh: energiaRequerida,
      energiaBancoWh: energiaBanco,
      capacidadTotalAh: capacidadTotalAh,
      bateriasEnSerie,
      bateriasEnParalelo,
      totalBaterias
    });
  };

  const seleccionarTipoBateria = (tipo: 'Litio' | 'Plomo') => {
    if (tipo === 'Litio') {
      setInputs({ ...inputs, dod: '80', voltajeBateria: '48', capacidadBateriaAh: '100', voltajeSistema: '48' });
    } else {
      setInputs({ ...inputs, dod: '50', voltajeBateria: '12', capacidadBateriaAh: '200', voltajeSistema: '48' });
    }
  };

  const mostrarAyudaAutonomia = () => {
    Alert.alert(
      "Días de Autonomía (Días sin sol)",
      "Es el tiempo que las baterías mantendrán la carga sin recibir luz solar.\n\n• 1 a 2 días: Ideal para zonas soleadas o sistemas Híbridos (donde CFE sigue respaldando).\n• 3 a 5 días: Recomendado para cabañas remotas o sistemas 100% aislados (Off-Grid)."
    );
  };

  return (
    <>
      {!isPremium ? (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={64} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' }}>Calculadora Off-Grid</Text>
            <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 }} onPress={() => router.push('/paywall')}>
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Desbloquear Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Cálculo de Baterías</Text>

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8, fontWeight: '600' }}>Configuración Rápida:</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: inputs.dod === '80' ? theme.primary : theme.inputBg, borderColor: theme.border }]} onPress={() => seleccionarTipoBateria('Litio')}>
              <Text style={{ color: inputs.dod === '80' ? '#000' : theme.text, fontWeight: 'bold' }}>🔋 Rack Litio (48V)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { backgroundColor: inputs.dod === '50' ? theme.primary : theme.inputBg, borderColor: theme.border }]} onPress={() => seleccionarTipoBateria('Plomo')}>
              <Text style={{ color: inputs.dod === '50' ? '#000' : theme.text, fontWeight: 'bold' }}>🪫 Gel / AGM (12V)</Text>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="moon-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Necesidades del Cliente</Text>
              </View>
              <TouchableOpacity onPress={mostrarAyudaAutonomia}>
                <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <InputField theme={theme} label="Consumo Diario Promedio (Auto-completado por PDF)" value={inputs.consumoDiarioKwh} onChange={(v: string) => setInputs({ ...inputs, consumoDiarioKwh: v })} placeholder="5" unit="kWh/día" />
            <InputField theme={theme} label="Días de Autonomía (Ver info)" value={inputs.diasAutonomia} onChange={(v: string) => setInputs({ ...inputs, diasAutonomia: v })} placeholder="1" unit="Días" />
          </View>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="construct-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Parámetros Técnicos</Text>
            </View>
            <InputField theme={theme} label="Voltaje del Inversor (Sistema)" value={inputs.voltajeSistema} onChange={(v: string) => setInputs({ ...inputs, voltajeSistema: v })} placeholder="48" unit="V" />
            <InputField theme={theme} label="Profundidad de Descarga (DoD%)" value={inputs.dod} onChange={(v: string) => setInputs({ ...inputs, dod: v })} placeholder="80" unit="%" />
            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />
            <InputField theme={theme} label="Voltaje por Batería individual" value={inputs.voltajeBateria} onChange={(v: string) => setInputs({ ...inputs, voltajeBateria: v })} placeholder="12" unit="V" />
            <InputField theme={theme} label="Capacidad por Batería individual" value={inputs.capacidadBateriaAh} onChange={(v: string) => setInputs({ ...inputs, capacidadBateriaAh: v })} placeholder="200" unit="Ah" />
          </View>

          <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 }} onPress={calcularBanco}>
            <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Calcular Banco de Baterías</Text>
          </TouchableOpacity>

          {resultado && (
            <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 16, textAlign: 'center' }}>Recomendación de Diseño</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Energía Real Requerida (Wh)</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{Math.round(resultado.energiaBancoWh).toLocaleString()} Wh</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: theme.textSecondary }}>Capacidad Total del Banco</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{Math.round(resultado.capacidadTotalAh).toLocaleString()} Ah @ {inputs.voltajeSistema}V</Text>
              </View>

              <View style={{ backgroundColor: theme.inputBg, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: theme.text, fontSize: 14, marginBottom: 4 }}>Arreglo Físico:</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>• <Text style={{fontWeight:'bold', color: theme.text}}>{resultado.bateriasEnSerie}</Text> baterías en Serie.</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>• <Text style={{fontWeight:'bold', color: theme.text}}>{resultado.bateriasEnParalelo}</Text> series conectadas en Paralelo.</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.primary + '20', padding: 15, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>TOTAL DE BATERÍAS</Text>
                <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 24 }}>{resultado.totalBaterias} <Text style={{fontSize: 14, fontWeight: '600'}}>pzas</Text></Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  quickBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }
});