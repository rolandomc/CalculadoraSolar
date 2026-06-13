import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import baseDatos from '../../data/catalogo.json';
import { calcularDimensionamiento } from '../../utils/calculosFotovoltaicos';
import { calcularROI, AnalisisROI } from '../../utils/roiCalculos';
import TarjetaResultados from '../../components/TarjetaResultados';
import ROIAnalysis from '../../components/ROIAnalysis';

export default function AppGratis() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [consumoTotal, setConsumoTotal] = useState('');
  const [porcentajeAhorro, setPorcentajeAhorro] = useState('100');
  const [tarifaElectricia, setTarifaElectricia] = useState<number | null>(null);

  const [ubicacion, setUbicacion] = useState<{ lat: number; lon: number } | null>(null);
  const [hspNasa, setHspNasa] = useState<number | null>(null);
  const [anguloNasa, setAnguloNasa] = useState<number | null>(null);
  const [cargandoNasa, setCargandoNasa] = useState(false);

  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [historialDetalle, setHistorialDetalle] = useState<number[]>([]);
  const [tipoConsumoDetectado, setTipoConsumoDetectado] = useState<string>('');

  const [panelSeleccionado, setPanelSeleccionado] = useState(baseDatos.paneles[0]);
  const [modalPanelesVisible, setModalPanelesVisible] = useState(false);

  const [resultado, setResultado] = useState<any>(null);
  const [roiAnalisis, setROIAnalisis] = useState<AnalisisROI | null>(null);
  const [mostrarROI, setMostrarROI] = useState(false);

  const obtenerDatosNasa = async () => {
    setCargandoNasa(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Error', 'Permiso denegado.'); setCargandoNasa(false); return; }
      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude; const lon = location.coords.longitude;
      setUbicacion({ lat, lon });
      const urlNasa = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&format=JSON`;
      const respuesta = await fetch(urlNasa);
      const datosNasa = await respuesta.json();
      setHspNasa(datosNasa.properties.parameter.ALLSKY_SFC_SW_DWN.ANN);
      setAnguloNasa(Math.round(lat));
    } catch (error) { Alert.alert("Error", "Error con NASA."); } finally { setCargandoNasa(false); }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      if (result.assets[0].size && result.assets[0].size > 1048576) return Alert.alert('Error', 'PDF muy pesado.');
      setPdfFileName(result.assets[0].name);
      procesarPDFConNube(result.assets[0]);
    } catch (e) {}
  };

  const procesarPDFConNube = async (file: DocumentPicker.DocumentPickerAsset) => {
    setIsProcessingPdf(true); setHistorialDetalle([]); setTipoConsumoDetectado('');
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
      
      await analizarTextoCFE(datos.ParsedResults.map((p: any) => p.ParsedText).join('\n'));
    } catch (e: any) { 
      Alert.alert('Error', e.message); 
    } finally { 
      setIsProcessingPdf(false); 
    }
  };

  const analizarTextoCFE = async (textoRaw: string) => {
    const matchHistorial = textoRaw.match(/kWh\s*\n((?:\d+\s*\n)+)/i);
    let consumo = ''; let tipo = '';
    let consumoDiarioParaBaterias = '5'; // Valor por defecto

    if (matchHistorial && matchHistorial[1]) {
      const consumos = matchHistorial[1].trim().split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      if (consumos.length > 0) {
        const ultimos6 = consumos.slice(0, 6); 
        setHistorialDetalle(ultimos6);
        
        // Consumo bimestral promedio
        consumo = Math.round(ultimos6.reduce((a, b) => a + b, 0) / ultimos6.length).toString();
        tipo = `Promedio 1 año`;

        // Cálculo exacto de consumo diario para la calculadora de baterías (Suma anual / 365)
        const sumaAnual = ultimos6.reduce((a, b) => a + b, 0);
        consumoDiarioParaBaterias = (sumaAnual / 365).toFixed(2);
      }
    }

    const matchesTarifa = textoRaw.match(/(?:tarifa|precio\s*(?:unitario|kwh)|costo|importe|subtotal)[\s\n]*[$]?\s*([\d.]+)/gi);
    let tarifaExtraida = 0;

    if (matchesTarifa && matchesTarifa.length > 0) {
      const lineas = textoRaw.split('\n');
      const lineasConPrecio = lineas.filter(l => /\$\s*[\d.]+|[\d.]+\s*\$/.test(l) && l.length < 80);
      if (lineasConPrecio.length > 0) {
        for (const linea of lineasConPrecio) {
          const numeros = linea.match(/[\d.]+/g);
          if (numeros) {
            for (const num of numeros) {
              const valor = parseFloat(num);
              if (valor > 1 && valor < 15) { tarifaExtraida = valor; break; }
            }
            if (tarifaExtraida > 0) break;
          }
        }
      }
    }

    let nombre = '';
    let domicilio = '';
    let medidor = '';

    const lineas = textoRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const matchMedidor = textoRaw.match(/MEDIDOR[\s:.]*([A-Z0-9]+)/i);
    if (matchMedidor) medidor = matchMedidor[1].trim();

    const indexTotalPag = lineas.findIndex(l => l.toUpperCase().includes('TOTAL A PAGAR'));

    if (indexTotalPag !== -1 && indexTotalPag > 0) {
      nombre = lineas[indexTotalPag - 1];
      let lineasDomicilio = [];
      for (let i = indexTotalPag + 1; i < lineas.length; i++) {
        const linea = lineas[i];
        if (linea.toUpperCase().includes('NO. DE SERVICIO') || linea.toUpperCase().includes('RMU')) break;
        if (!linea.startsWith('$') && !linea.startsWith('(') && !linea.match(/^[\d,.]+$/)) lineasDomicilio.push(linea);
      }
      domicilio = lineasDomicilio.join(', ');
    } else {
      const lineasLimpias = lineas.filter(l => !l.toUpperCase().includes('COMISION FEDERAL') && !l.toUpperCase().includes('SUMINISTRADOR'));
      if (lineasLimpias.length >= 2) { nombre = lineasLimpias[0]; domicilio = lineasLimpias[1]; }
    }

    nombre = nombre.substring(0, 55);
    domicilio = domicilio.substring(0, 100);

    if (consumo) { setConsumoTotal(consumo); setTipoConsumoDetectado(tipo); }
    if (tarifaExtraida > 0) setTarifaElectricia(tarifaExtraida);

    try {
      // Se guarda para el Cotizador
      await AsyncStorage.setItem('@scanned_cfe', JSON.stringify({ nombre, domicilio, medidor, tarifa: tarifaExtraida > 0 ? tarifaExtraida.toString() : '3.8' }));
      // Se guarda específicamente el consumo diario para la sección de baterías
      await AsyncStorage.setItem('@scanned_baterias', consumoDiarioParaBaterias);
      
      Alert.alert('¡Recibo Escaneado!', 'Datos extraídos. El consumo diario se ha auto-rellenado en la Calculadora de Baterías.');
    } catch(e) {
      console.log('Error', e);
    }
  };

  const calcularSistema = () => {
    const consumo = parseFloat(consumoTotal);
    const porcentaje = parseFloat(porcentajeAhorro);
    if (!isNaN(consumo) && !isNaN(porcentaje)) {
      const res = calcularDimensionamiento(consumo, porcentaje, isPremium && hspNasa ? hspNasa : 5.0, isPremium, panelSeleccionado);
      setResultado(res);
      if (isPremium) {
        const roi = calcularROI(res.potenciaKWp, consumo, porcentaje, hspNasa || 5.0, tarifaElectricia || undefined);
        setROIAnalisis(roi);
      }
    } else { Alert.alert("Error", "Ingresa consumo válido."); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center', paddingBottom: 60 }}>
        {!isPremium && ( <TouchableOpacity style={{ backgroundColor: '#FCD34D', padding: 12, borderRadius: 8, marginBottom: 20, width: '100%' }} onPress={() => router.push('/paywall')}><Text style={{ color: '#92400E', fontWeight: 'bold', textAlign: 'center' }}>⭐ Desbloquea cálculo pro</Text></TouchableOpacity> )}

        {isPremium && (
          <View style={{ width: '100%', maxWidth: 400, marginBottom: 20 }}>
            <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 15, borderColor: theme.border, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}><Ionicons name="earth" size={24} color="#2563EB" style={{ marginRight: 10 }} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Geolocalización NASA</Text></View>
              {hspNasa && <View style={{ backgroundColor: theme.inputBg, padding: 10, borderRadius: 8, marginBottom: 10 }}><Text style={{ color: theme.primary, fontWeight: 'bold' }}>HSP: {hspNasa} kWh/m²/día</Text></View>}
              <TouchableOpacity style={{ backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={obtenerDatosNasa}>{cargandoNasa ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Obtener Radiación</Text>}</TouchableOpacity>
            </View>

            <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, marginBottom: 15, borderColor: theme.border, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}><Ionicons name="document-text" size={24} color={theme.primary} style={{ marginRight: 10 }} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Auto-Lectura de CFE</Text></View>
              <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={pickDocument} disabled={isProcessingPdf}>{isProcessingPdf ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: 'bold' }}>Subir PDF</Text>}</TouchableOpacity>
            </View>

            <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}><Ionicons name="hardware-chip" size={24} color="#F59E0B" style={{ marginRight: 10 }} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Selección de Módulo</Text></View>
              <TouchableOpacity style={{ backgroundColor: theme.inputBg, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={() => setModalPanelesVisible(true)}>
                <View><Text style={{ color: theme.text, fontSize: 16, fontWeight: '500' }}>{panelSeleccionado.nombre}</Text><Text style={{ color: theme.textSecondary, fontSize: 12 }}>Potencia: {panelSeleccionado.pMax}W</Text></View>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: theme.card, padding: 20, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Consumo Base Bimestral (kWh):</Text>
          <TextInput style={{ borderWidth: 1, borderColor: tipoConsumoDetectado ? theme.primary : theme.border, borderRadius: 8, padding: 12, fontSize: 18, fontWeight: 'bold', backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} placeholder="Ej. 1200" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={consumoTotal} onChangeText={(text) => { setConsumoTotal(text); setTipoConsumoDetectado(''); }} />

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Tarifa de Electricidad (MXN/kWh):</Text>
          <TextInput style={{ borderWidth: 1, borderColor: tarifaElectricia ? theme.primary : theme.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} placeholder="Ej. 4.5" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad" value={tarifaElectricia ? tarifaElectricia.toString() : ''} onChangeText={(text) => setTarifaElectricia(text ? parseFloat(text) : null)} />

          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>Porcentaje de ahorro a cubrir (%):</Text>
          <TextInput style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.inputBg, color: theme.text, marginBottom: 15 }} placeholder="Ej. 100" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={porcentajeAhorro} onChangeText={setPorcentajeAhorro} />

          <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 5 }} onPress={calcularSistema}>
            <Text style={{ color: '#000', fontSize: 18, fontWeight: 'bold' }}>Calcular y Sugerir Inversor</Text>
          </TouchableOpacity>
        </View>

        {resultado && (
          <View style={{ width: '100%', alignItems: 'center', minHeight: 600 }}>
            {isPremium && roiAnalisis && (
              <View style={{ width: '100%', maxWidth: 400, marginTop: 20, marginBottom: 16, backgroundColor: theme.card, borderRadius: 12, borderColor: theme.border, borderWidth: 1, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => setMostrarROI(false)} style={{ flex: 1, paddingVertical: 12, backgroundColor: !mostrarROI ? theme.primary : 'transparent', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: !mostrarROI ? '#000' : theme.text }}>Diseño Técnico</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMostrarROI(true)} style={{ flex: 1, paddingVertical: 12, backgroundColor: mostrarROI ? theme.primary : 'transparent', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: mostrarROI ? '#000' : theme.text }}>💰 ROI</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={{ width: '100%', maxWidth: 400, flex: 1, minHeight: 500 }}>
              {!mostrarROI ? (
                <TarjetaResultados isPremium={isPremium} resultado={resultado} panelSeleccionado={panelSeleccionado} />
              ) : (
                roiAnalisis && <ROIAnalysis roi={roiAnalisis} />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalPanelesVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Módulo Fotovoltaico</Text><TouchableOpacity onPress={() => setModalPanelesVisible(false)}><Ionicons name="close-circle" size={28} color={theme.textSecondary} /></TouchableOpacity></View>
            <FlatList data={baseDatos.paneles} keyExtractor={(item) => item.id} renderItem={({item}) => (
                <TouchableOpacity style={{ backgroundColor: panelSeleccionado.id === item.id ? theme.inputBg : 'transparent', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: panelSeleccionado.id === item.id ? theme.primary : theme.border }} onPress={() => { setPanelSeleccionado(item); setModalPanelesVisible(false); }}>
                  <View><Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.nombre}</Text><Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }}>Potencia: {item.pMax}W</Text></View>
                  {panelSeleccionado.id === item.id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                </TouchableOpacity>
              )} />
          </View>
        </View>
      </Modal>
    </View>
  );
}