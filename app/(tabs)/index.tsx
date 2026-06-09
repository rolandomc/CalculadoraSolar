import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location'; 
import { usePremium } from '../../context/PremiumContext';
import { Picker } from '@react-native-picker/picker';
import baseDatos from '../../data/catalogo.json';
import { calcularDimensionamiento } from '../../utils/calculosFotovoltaicos';
import TarjetaResultados from '../../components/TarjetaResultados';
import { Colors } from '../../constants/Colors';

// --- BASE DE DATOS LOCAL (Catálogo) ---
export default function AppGratis() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [irradianciaMax, setIrradianciaMax] = useState<number | null>(null);

  // Estados Base
  const [consumoTotal, setConsumoTotal] = useState('');
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('100');
  
  // Estados Premium
  const [ubicacion, setUbicacion] = useState<{ lat: number; lon: number } | null>(null);
  const [hspNasa, setHspNasa] = useState<number | null>(null);
  const [anguloNasa, setAnguloNasa] = useState<number | null>(null); // <-- NUEVO ESTADO
  const [cargandoNasa, setCargandoNasa] = useState(false);
  
  // AHORA LEEN DESDE EL JSON:
  const [panelSeleccionado, setPanelSeleccionado] = useState(baseDatos.paneles[0]); 
  const [inversorSeleccionado, setInversorSeleccionado] = useState(baseDatos.inversores[2]);

  // Estados de Resultados
  const [resultadoPaneles, setResultadoPaneles] = useState<number | null>(null);
  const [potenciaInstalada, setPotenciaInstalada] = useState<number | null>(null);
  
  // Estados de Protecciones y Conductores (NOM-001)
  const [proteccionCC, setProteccionCC] = useState<number | null>(null);
  const [proteccionCA, setProteccionCA] = useState<number | null>(null);
  const [calibreCC, setCalibreCC] = useState<string | null>(null);
  const [calibreCA, setCalibreCA] = useState<string | null>(null);

  // --- MOTOR PREMIUM: GPS Y NASA ---
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

      // Solo pedimos el HSP, que es lo que realmente necesitamos para el cálculo de potencia
      const urlNasa = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;

      const respuesta = await fetch(urlNasa);
      const datosNasa = await respuesta.json();

      const hspAnual = datosNasa.properties.parameter.ALLSKY_SFC_SW_DWN.ANN;

      setHspNasa(hspAnual);
      // Calculamos el ángulo óptimo basado en la latitud:
      setAnguloNasa(Math.round(lat)); 
      
      alert("Datos obtenidos: HSP anual " + hspAnual);
    } catch (error) {
      alert("Error conectando con NASA.");
    } finally {
      setCargandoNasa(false);
    }
  };

  // --- MOTOR DE CÁLCULO (Ahora delegando el trabajo pesado) ---
  const calcularSistema = () => {
    const consumo = parseFloat(consumoTotal);
    const porcentaje = parseFloat(porcentajeAhorro);

    if (!isNaN(consumo) && !isNaN(porcentaje)) {
      const hsp = isPremium && hspNasa ? hspNasa : 5.0; 
      
      // Llamamos a nuestra máquina matemática
      const resultados = calcularDimensionamiento(
        consumo,
        porcentaje,
        hsp,
        isPremium,
        panelSeleccionado,
        inversorSeleccionado
      );

      // Actualizamos todos los estados de la pantalla con un solo golpe
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        {isPremium ? "Calculadora Pro (Instalador)" : "Calculadora Solar Básica"}
      </Text>

      {!isPremium && (
        <TouchableOpacity style={styles.upgradeBanner} onPress={() => router.push('/paywall')}>
          <Text style={styles.upgradeText}>⭐ Eres instalador? Desbloquea cálculo avanzado y API NASA</Text>
        </TouchableOpacity>
      )}

      {/* --- ZONA PREMIUM --- */}
      {isPremium && (
        <View style={styles.premiumSection}>
          <Text style={styles.premiumTitle}>🛠️ Opciones de Instalador</Text>
          
          <TouchableOpacity style={styles.nasaButton} onPress={obtenerDatosNasa}>
            {cargandoNasa ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.nasaButtonText}>🛰️ Obtener Radiación (NASA POWER)</Text>
            )}
          </TouchableOpacity>

          {ubicacion && hspNasa && anguloNasa !== null && (
            <Text style={styles.nasaData}>
              Lat: {ubicacion.lat.toFixed(2)} | Lon: {ubicacion.lon.toFixed(2)} {"\n"}
              HSP Local: {hspNasa} kWh/m²/día {"\n"}
              Inclinación Óptima sugerida: {anguloNasa}°
            </Text>
          )}

          <View style={styles.hardwareSelectors}>
            <Text style={styles.hardwareLabel}>Selecciona el Módulo:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={panelSeleccionado.id}
                onValueChange={(itemValue) => {
                  const panel = baseDatos.paneles.find(p => p.id === itemValue);
                  if(panel) setPanelSeleccionado(panel); 
                }}
                style={styles.picker}
                itemStyle={{ height: 120, fontSize: 16, color: '#1F2937' }}
              >
                {baseDatos.paneles.map(panel => (
                  <Picker.Item key={panel.id} label={panel.nombre} value={panel.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.hardwareLabel}>Selecciona el Inversor:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={inversorSeleccionado.id}
                onValueChange={(itemValue) => {
                  const inversor = baseDatos.inversores.find(i => i.id === itemValue);
                  if(inversor) setInversorSeleccionado(inversor); 
                }}
                style={styles.picker}
                itemStyle={{ height: 120, fontSize: 16, color: '#1F2937' }}
              >
                {baseDatos.inversores.map(inversor => (
                  <Picker.Item key={inversor.id} label={inversor.nombre} value={inversor.id} />
                ))}
              </Picker>
            </View>
          </View>
          
          <Text style={styles.hardwareText}>Módulo: {panelSeleccionado.nombre}</Text>
          <Text style={styles.hardwareText}>Inversor: {inversorSeleccionado.nombre}</Text>
        </View>
      )}
      
      <View style={styles.card}>
        <Text style={styles.label}>Consumo en kWh (Ej. último bimestre):</Text>
        <TextInput style={styles.input} placeholder="Ej. 1200" keyboardType="numeric" value={consumoTotal} onChangeText={setConsumoTotal} />

        <Text style={styles.label}>Porcentaje de ahorro (%):</Text>
        <TextInput style={styles.input} placeholder="Ej. 100" keyboardType="numeric" value={porcentajeAhorro} onChangeText={setPorcentajeAhorro} />

        <TouchableOpacity style={styles.button} onPress={calcularSistema}>
          <Text style={styles.buttonText}>Calcular Sistema</Text>
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
  );
}
// Y aquí devolvemos los estilos que NO se fueron a la tarjeta
const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#121212', // Fondo oscuro real
    padding: 20, 
    paddingTop: 40,
    alignItems: 'center', // Centra horizontalmente los elementos
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FFFFFF', // ¡Asegúrate de que sea blanco!
    marginBottom: 20, 
    textAlign: 'center' 
  },
  card: { 
    width: '100%', // Asegura que no se desborde
    maxWidth: 400, // Máximo ancho para que no se vea deforme en pantallas grandes
    backgroundColor: '#1E1E1E', 
    padding: 20, 
    borderRadius: 16,
    shadowColor: '#000',
    elevation: 5
  },
  label: { 
    fontSize: 16, 
    color: '#E5E7EB', // Gris claro para que sea legible
    marginBottom: 8 
  },
  // ... resto de tus estilos
});