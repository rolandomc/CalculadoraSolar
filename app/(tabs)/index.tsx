import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Picker } from '@react-native-picker/picker';
import baseDatos from '../../data/catalogo.json';
import { calcularDimensionamiento } from '../../utils/calculosFotovoltaicos';
import TarjetaResultados from '../../components/TarjetaResultados';

export default function AppGratis() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [consumoTotal, setConsumoTotal] = useState('');
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('100');

  const [ubicacion, setUbicacion] = useState<{ lat: number; lon: number } | null>(null);
  const [hspNasa, setHspNasa] = useState<number | null>(null);
  const [anguloNasa, setAnguloNasa] = useState<number | null>(null);
  const [cargandoNasa, setCargandoNasa] = useState(false);

  const [panelSeleccionado, setPanelSeleccionado] = useState(baseDatos.paneles[0]);
  const [inversorSeleccionado, setInversorSeleccionado] = useState(baseDatos.inversores[2]);

  const [resultadoPaneles, setResultadoPaneles] = useState<number | null>(null);
  const [potenciaInstalada, setPotenciaInstalada] = useState<number | null>(null);
  const [proteccionCC, setProteccionCC] = useState<number | null>(null);
  const [proteccionCA, setProteccionCA] = useState<number | null>(null);
  const [calibreCC, setCalibreCC] = useState<string | null>(null);
  const [calibreCA, setCalibreCA] = useState<string | null>(null);

  const obtenerDatosNasa = async () => {
    setCargandoNasa(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso de ubicación.');
        setCargandoNasa(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setUbicacion({ lat, lon });

      const urlNasa = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;

      const respuesta = await fetch(urlNasa);
      const datosNasa = await respuesta.json();

      const hspAnual = datosNasa.properties.parameter.ALLSKY_SFC_SW_DWN.ANN;

      setHspNasa(hspAnual);
      setAnguloNasa(Math.round(lat));
      
      alert("Datos obtenidos: HSP anual " + hspAnual);
    } catch (error) {
      alert("Error conectando con NASA.");
    } finally {
      setCargandoNasa(false);
    }
  };

  const calcularSistema = () => {
    const consumo = parseFloat(consumoTotal);
    const porcentaje = parseFloat(porcentajeAhorro);

    if (!isNaN(consumo) && !isNaN(porcentaje)) {
      const hsp = isPremium && hspNasa ? hspNasa : 5.0;
      
      const resultados = calcularDimensionamiento(
        consumo,
        porcentaje,
        hsp,
        isPremium,
        panelSeleccionado,
        inversorSeleccionado
      );

      setResultadoPaneles(resultados.paneles);
      setPotenciaInstalada(resultados.potenciaKWp);
      setProteccionCC(resultados.proteccionCC);
      setCalibreCC(resultados.calibreCC);
      setProteccionCA(resultados.proteccionCA);
      setCalibreCA(resultados.calibreCA);

    } else {
      alert("Por favor, ingresa valores numéricos válidos.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center', paddingBottom: 60 }}>
        
        {!isPremium && (
          <TouchableOpacity style={{ backgroundColor: '#FCD34D', padding: 12, borderRadius: 8, marginBottom: 20, alignItems: 'center', width: '100%', maxWidth: 400 }} onPress={() => router.push('/paywall')}>
            <Text style={{ color: '#92400E', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>⭐ Eres instalador? Desbloquea cálculo avanzado</Text>
          </TouchableOpacity>
        )}

        {/* ZONA PREMIUM */}
        {isPremium && (
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: theme.card, padding: 20, borderRadius: 12, marginBottom: 20, borderColor: theme.border, borderWidth: 1 }}>
            <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: 18, marginBottom: 15, textAlign: 'center' }}>🛠️ Opciones de Instalador</Text>
            
            <TouchableOpacity style={{ backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center' }} onPress={obtenerDatosNasa}>
              {cargandoNasa ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>🛰️ Obtener Radiación (NASA)</Text>
              )}
            </TouchableOpacity>

            {ubicacion && hspNasa && anguloNasa !== null && (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10, fontSize: 14 }}>
                Lat: {ubicacion.lat.toFixed(2)} | Lon: {ubicacion.lon.toFixed(2)} {"\n"}
                HSP Local: {hspNasa} kWh/m²/día {"\n"}
                Inclinación Óptima: {anguloNasa}°
              </Text>
            )}

            <View style={{ marginTop: 15, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 5 }}>Selecciona el Módulo:</Text>
              <View style={{ backgroundColor: theme.inputBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }}>
                <Picker
                  selectedValue={panelSeleccionado.id}
                  onValueChange={(itemValue) => {
                    const panel = baseDatos.paneles.find(p => p.id === itemValue);
                    if(panel) setPanelSeleccionado(panel); 
                  }}
                  style={{ width: '100%', ...(Platform.OS === 'android' && { height: 50 }), color: theme.text }}
                  itemStyle={{ height: 120, fontSize: 16, color: theme.text }}
                  dropdownIconColor={theme.text}
                >
                  {baseDatos.paneles.map(panel => (
                    <Picker.Item key={panel.id} label={panel.nombre} value={panel.id} />
                  ))}
                </Picker>
              </View>

              <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 5 }}>Selecciona el Inversor:</Text>
              <View style={{ backgroundColor: theme.inputBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }}>
                <Picker
                  selectedValue={inversorSeleccionado.id}
                  onValueChange={(itemValue) => {
                    const inversor = baseDatos.inversores.find(i => i.id === itemValue);
                    if(inversor) setInversorSeleccionado(inversor); 
                  }}
                  style={{ width: '100%', ...(Platform.OS === 'android' && { height: 50 }), color: theme.text }}
                  itemStyle={{ height: 120, fontSize: 16, color: theme.text }}
                  dropdownIconColor={theme.text}
                >
                  {baseDatos.inversores.map(inversor => (
                    <Picker.Item key={inversor.id} label={inversor.nombre} value={inversor.id} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        )}
        
        {/* ZONA BÁSICA */}
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: theme.card, padding: 20, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Consumo en kWh (Ej. último bimestre):</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} 
            placeholder="Ej. 1200" 
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric" 
            value={consumoTotal} 
            onChangeText={setConsumoTotal} 
          />

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Porcentaje de ahorro (%):</Text>
          <TextInput 
            style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} 
            placeholder="Ej. 100" 
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric" 
            value={porcentajeAhorro} 
            onChangeText={setPorcentajeAhorro} 
          />

          <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 }} onPress={calcularSistema}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>Calcular Sistema</Text>
          </TouchableOpacity>
        </View>

        {resultadoPaneles !== null && potenciaInstalada !== null && (
          <TarjetaResultados 
            isPremium={isPremium}
            resultadoPaneles={resultadoPaneles}
            potenciaInstalada={potenciaInstalada}
            panelSeleccionadoPMax={panelSeleccionado.pMax}
            proteccionCC={proteccionCC}
            calibreCC={calibreCC}
            proteccionCA={proteccionCA}
            calibreCA={calibreCA}
          />
        )}
      </ScrollView>
    </View>
  );
}