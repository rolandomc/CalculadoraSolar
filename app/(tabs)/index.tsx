import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import baseDatos from '../../data/catalogo.json';
import { calcularDimensionamiento } from '../../utils/calculosFotovoltaicos';
import TarjetaResultados from '../../components/TarjetaResultados';

export default function AppGratis() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  // --- ESTADOS DE LA CALCULADORA BÁSICA ---
  const [consumoTotal, setConsumoTotal] = useState('');
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('100');

  // --- ESTADOS PREMIUM: NASA ---
  const [ubicacion, setUbicacion] = useState<{ lat: number; lon: number } | null>(null);
  const [hspNasa, setHspNasa] = useState<number | null>(null);
  const [anguloNasa, setAnguloNasa] = useState<number | null>(null);
  const [cargandoNasa, setCargandoNasa] = useState(false);

  // --- ESTADOS PREMIUM: LECTOR CFE ---
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [historialDetalle, setHistorialDetalle] = useState<number[]>([]);
  const [tipoConsumoDetectado, setTipoConsumoDetectado] = useState<string>('');

  // --- ESTADOS PREMIUM: EQUIPOS Y MODALES DE DISEÑO ---
  const [panelSeleccionado, setPanelSeleccionado] = useState(baseDatos.paneles[0]);
  const [inversorSeleccionado, setInversorSeleccionado] = useState(baseDatos.inversores[2]);
  const [modalPanelesVisible, setModalPanelesVisible] = useState(false);
  const [modalInversoresVisible, setModalInversoresVisible] = useState(false);

  // --- ESTADOS DE RESULTADOS ---
  const [resultadoPaneles, setResultadoPaneles] = useState<number | null>(null);
  const [potenciaInstalada, setPotenciaInstalada] = useState<number | null>(null);
  const [proteccionCC, setProteccionCC] = useState<number | null>(null);
  const [proteccionCA, setProteccionCA] = useState<number | null>(null);
  const [calibreCC, setCalibreCC] = useState<string | null>(null);
  const [calibreCA, setCalibreCA] = useState<string | null>(null);

  // ==========================================
  // MOTOR 1: NASA POWER API
  // ==========================================
  const obtenerDatosNasa = async () => {
    setCargandoNasa(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se requiere permiso de ubicación.');
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
      Alert.alert("Éxito", "Datos climáticos obtenidos con éxito.");
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con la NASA.");
    } finally {
      setCargandoNasa(false);
    }
  };

  // ==========================================
  // MOTOR 2: LECTOR DE CFE PDF CON IA
  // ==========================================
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > 1048576) {
        Alert.alert('Archivo muy pesado', 'El PDF supera el límite de 1MB.');
        return;
      }
      setPdfFileName(file.name);
      procesarPDFConNube(file);
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const procesarPDFConNube = async (file: DocumentPicker.DocumentPickerAsset) => {
    setIsProcessingPdf(true);
    setHistorialDetalle([]);
    setTipoConsumoDetectado('');

    try {
      const formData = new FormData();
      formData.append('apikey', 'helloworld'); 
      formData.append('language', 'spa');
      formData.append('isOverlayRequired', 'false');
      formData.append('filetype', 'PDF');
      formData.append('OCREngine', '2'); 
      formData.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' } as any);

      const respuesta = await fetch('https://api.ocr.space/parse/image', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data' }, body: formData });
      const datos = await respuesta.json();

      if (datos.IsErroredOnProcessing) throw new Error(datos.ErrorMessage[0]);
      if (!datos.ParsedResults || datos.ParsedResults.length === 0) throw new Error('No se detectó texto en el documento.');

      const textoCompleto = datos.ParsedResults.map((p: any) => p.ParsedText).join('\n');
      analizarTextoCFE(textoCompleto);
    } catch (error: any) {
      Alert.alert('Error de Escaneo', error.message || 'Hubo un problema comunicándose con el servidor OCR.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const analizarTextoCFE = (textoRaw: string) => {
    const txtMayus = textoRaw.toUpperCase();
    let consumoExtraido = '';
    let tipo = '';

    const historialRegex = /kWh\s*\n((?:\d+\s*\n)+)/i; 
    const matchHistorial = textoRaw.match(historialRegex);
    
    if (matchHistorial && matchHistorial[1]) {
      const consumosHistorial = matchHistorial[1].trim().split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      if (consumosHistorial.length > 0) {
        const ultimos6 = consumosHistorial.slice(0, 6);
        setHistorialDetalle(ultimos6); 
        const sumaAnual = ultimos6.reduce((acc, val) => acc + val, 0);
        const promedioBimestral = Math.round(sumaAnual / ultimos6.length);
        consumoExtraido = promedioBimestral.toString();
        tipo = `Promedio de 1 año (${ultimos6.length} bimestres)`;
      }
    }

    if (!consumoExtraido) {
      const matchVertical = txtMayus.match(/TOTAL\s+PERIODO\s+([\d,]+)/);
      if (matchVertical && matchVertical[1]) {
        consumoExtraido = matchVertical[1].replace(/,/g, '');
        tipo = 'Solo periodo actual';
      }
    }

    if (!consumoExtraido) {
      const lineaEnergiaMatch = txtMayus.match(/ENERG[IÍ]A\s*\(KWH\)(.*)/);
      if (lineaEnergiaMatch && lineaEnergiaMatch[1]) {
        const numerosFila = lineaEnergiaMatch[1].match(/\d+/g);
        if (numerosFila && numerosFila.length > 0) {
          consumoExtraido = numerosFila[numerosFila.length - 1]; 
          tipo = 'Solo periodo actual';
        }
      }
    }

    if (consumoExtraido) {
      setConsumoTotal(consumoExtraido); 
      setTipoConsumoDetectado(tipo);
      Alert.alert("Extracción Exitosa", `Se auto-completó el consumo base con: ${consumoExtraido} kWh (${tipo})`);
    } else {
      Alert.alert("Advertencia", "La IA no logró detectar el consumo en este recibo.");
    }
  };

  // ==========================================
  // MOTOR 3: CÁLCULO FINAL
  // ==========================================
  const calcularSistema = () => {
    const consumo = parseFloat(consumoTotal);
    const porcentaje = parseFloat(porcentajeAhorro);

    if (!isNaN(consumo) && !isNaN(porcentaje)) {
      const hsp = isPremium && hspNasa ? hspNasa : 5.0;
      const resultados = calcularDimensionamiento(consumo, porcentaje, hsp, isPremium, panelSeleccionado, inversorSeleccionado);

      setResultadoPaneles(resultados.paneles);
      setPotenciaInstalada(resultados.potenciaKWp);
      setProteccionCC(resultados.proteccionCC);
      setCalibreCC(resultados.calibreCC);
      setProteccionCA(resultados.proteccionCA);
      setCalibreCA(resultados.calibreCA);
    } else {
      Alert.alert("Error", "Por favor, ingresa valores numéricos válidos en la sección de consumo.");
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
          <View style={{ width: '100%', maxWidth: 400, marginBottom: 20 }}>
            <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: 20, marginBottom: 15, textAlign: 'center' }}>🛠️ Módulos Pro</Text>
            
            {/* 1. MÓDULO NASA */}
            <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 15, borderColor: theme.border, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="earth" size={24} color="#2563EB" style={{ marginRight: 10 }} />
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Geolocalización NASA</Text>
              </View>
              {ubicacion && hspNasa ? (
                <View style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 8, marginBottom: 10 }}>
                   <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Lat: {ubicacion.lat.toFixed(2)} | Lon: {ubicacion.lon.toFixed(2)}</Text>
                   <Text style={{ color: theme.primary, fontWeight: 'bold', marginTop: 4 }}>HSP: {hspNasa} kWh/m²/día</Text>
                   <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>Inclinación recomendada: {anguloNasa}°</Text>
                </View>
              ) : null}
              <TouchableOpacity style={{ backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={obtenerDatosNasa}>
                {cargandoNasa ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>{hspNasa ? "Actualizar Ubicación" : "Obtener Radiación"}</Text>}
              </TouchableOpacity>
            </View>

            {/* 2. MÓDULO LECTOR CFE */}
            <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 15, borderColor: theme.border, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="document-text" size={24} color={theme.primary} style={{ marginRight: 10 }} />
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Auto-Lectura de CFE (IA)</Text>
              </View>
              {historialDetalle.length > 0 && (
                <View style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 8, marginBottom: 10 }}>
                   <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>Historial 1 Año Detectado:</Text>
                   <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {historialDetalle.map((val, index) => (
                      <Text key={index} style={{ color: theme.text, fontSize: 11, backgroundColor: theme.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: theme.border }}>{val}</Text>
                    ))}
                   </View>
                </View>
              )}
              <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={pickDocument} disabled={isProcessingPdf}>
                {isProcessingPdf ? <ActivityIndicator color="#000" /> : <><Ionicons name="cloud-upload" size={18} color="#000" style={{ marginRight: 8 }} /><Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>{pdfFileName ? "Cambiar Recibo PDF" : "Subir Recibo PDF"}</Text></>}
              </TouchableOpacity>
            </View>

            {/* 3. MÓDULO EQUIPOS (NUEVO DISEÑO MODERNO) */}
            <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Ionicons name="hardware-chip" size={24} color="#F59E0B" style={{ marginRight: 10 }} />
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Selección de Equipos</Text>
              </View>

              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>Módulo Fotovoltaico:</Text>
              <TouchableOpacity 
                style={{ backgroundColor: theme.inputBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}
                onPress={() => setModalPanelesVisible(true)}
              >
                <View>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }}>{panelSeleccionado.nombre}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Potencia: {panelSeleccionado.pMax}W</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>Inversor Central:</Text>
              <TouchableOpacity 
                style={{ backgroundColor: theme.inputBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                onPress={() => setModalInversoresVisible(true)}
              >
                <View>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }}>{inversorSeleccionado.nombre}</Text>
                  {/* Algunos inversores pueden tener potencia diferente, adaptamos si existe en tu JSON */}
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Seleccionado</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* ZONA BÁSICA */}
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: theme.card, padding: 20, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>Consumo Base (kWh):</Text>
            {tipoConsumoDetectado ? <Text style={{ fontSize: 10, color: theme.primary, fontWeight: 'bold' }}>{tipoConsumoDetectado}</Text> : null}
          </View>
          <TextInput style={{ borderWidth: 1, borderColor: tipoConsumoDetectado ? theme.primary : theme.border, borderRadius: 8, padding: 12, fontSize: 18, fontWeight: 'bold', backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} placeholder="Ej. 1200" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={consumoTotal} onChangeText={(text) => { setConsumoTotal(text); setTipoConsumoDetectado(''); }} />

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Porcentaje de ahorro a cubrir (%):</Text>
          <TextInput style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} placeholder="Ej. 100" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={porcentajeAhorro} onChangeText={setPorcentajeAhorro} />

          <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 5 }} onPress={calcularSistema}>
            <Text style={{ color: '#000', fontSize: 18, fontWeight: 'bold' }}>Calcular Dimensionamiento</Text>
          </TouchableOpacity>
        </View>

        {resultadoPaneles !== null && potenciaInstalada !== null && (
          <TarjetaResultados isPremium={isPremium} resultadoPaneles={resultadoPaneles} potenciaInstalada={potenciaInstalada} panelSeleccionadoPMax={panelSeleccionado.pMax} proteccionCC={proteccionCC} calibreCC={calibreCC} proteccionCA={proteccionCA} calibreCA={calibreCA} />
        )}
      </ScrollView>

      {/* ======================================= */}
      {/* MODAL BOTTOM SHEET: PANELES             */}
      {/* ======================================= */}
      <Modal visible={modalPanelesVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Módulo Fotovoltaico</Text>
              <TouchableOpacity onPress={() => setModalPanelesVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={baseDatos.paneles}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={{ backgroundColor: panelSeleccionado.id === item.id ? theme.inputBg : 'transparent', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: panelSeleccionado.id === item.id ? theme.primary : theme.border }}
                  onPress={() => { setPanelSeleccionado(item); setModalPanelesVisible(false); }}
                >
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.nombre}</Text>
                    <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>Potencia: {item.pMax}W</Text>
                  </View>
                  {panelSeleccionado.id === item.id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ======================================= */}
      {/* MODAL BOTTOM SHEET: INVERSORES          */}
      {/* ======================================= */}
      <Modal visible={modalInversoresVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Inversor Central</Text>
              <TouchableOpacity onPress={() => setModalInversoresVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList 
              data={baseDatos.inversores}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={{ backgroundColor: inversorSeleccionado.id === item.id ? theme.inputBg : 'transparent', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: inversorSeleccionado.id === item.id ? theme.primary : theme.border }}
                  onPress={() => { setInversorSeleccionado(item); setModalInversoresVisible(false); }}
                >
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.nombre}</Text>
                  </View>
                  {inversorSeleccionado.id === item.id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}