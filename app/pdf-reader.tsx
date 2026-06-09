import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function PdfReaderScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [consumoExtraido, setConsumoExtraido] = useState<string>('');
  const [periodoExtraido, setPeriodoExtraido] = useState<string>('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  
  // NUEVO: Estados para el modo de diagnóstico
  const [textoCrudo, setTextoCrudo] = useState<string>('');
  const [verDiagnostico, setVerDiagnostico] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      
      if (file.size && file.size > 1048576) {
        Alert.alert('Archivo muy pesado', 'El PDF supera el límite de 1MB. Intenta con uno más ligero.');
        return;
      }

      setFileName(file.name);
      procesarPDFConNube(file);
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const procesarPDFConNube = async (file: DocumentPicker.DocumentPickerAsset) => {
    setIsProcessing(true);
    setMostrarResultados(false);
    setConsumoExtraido('');
    setPeriodoExtraido('');
    setTextoCrudo('');

    try {
      const formData = new FormData();
      formData.append('apikey', 'helloworld'); 
      formData.append('language', 'spa');
      formData.append('isOverlayRequired', 'false');
      formData.append('filetype', 'PDF');
      formData.append('OCREngine', '2'); 

      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'application/pdf',
      } as any);

      const respuesta = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const datos = await respuesta.json();

      if (datos.IsErroredOnProcessing) {
        throw new Error(datos.ErrorMessage[0]);
      }

      if (!datos.ParsedResults || datos.ParsedResults.length === 0) {
        throw new Error('No se detectó texto en el documento.');
      }

      // Guardamos TODO el texto tal y como lo vio la IA
      const textoCompleto = datos.ParsedResults.map((p: any) => p.ParsedText).join('\n');
      setTextoCrudo(textoCompleto);
      
      analizarTextoCFE(textoCompleto);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error de Escaneo', error.message || 'Hubo un problema comunicándose con el servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const analizarTextoCFE = (textoRaw: string) => {
    const txt = textoRaw.toUpperCase();
    let consumo = '';

    // INTENTO 1: Formato en fila (Lectura actual - anterior - multiplicador - consumo)
    const lineaEnergiaMatch = txt.match(/ENERG[IÍ]A\s*\(KWH\)(.*)/);
    if (lineaEnergiaMatch && lineaEnergiaMatch[1]) {
      const numerosFila = lineaEnergiaMatch[1].match(/\d+/g);
      if (numerosFila && numerosFila.length > 0) {
        consumo = numerosFila[numerosFila.length - 1]; 
      }
    }

    // INTENTO 2: Buscar la palabra "Consumo" seguida de números en multilínea
    if (!consumo) {
      const consumoMatch = txt.match(/CONSUMO.*?\n.*?(\d{2,5})/m);
      if (consumoMatch && consumoMatch[1]) {
        consumo = consumoMatch[1];
      }
    }

    // INTENTO 3: Búsqueda cruda del kWh
    if (!consumo) {
      const fallbackMatch = txt.match(/([\d,]+)\s*KWH/);
      if (fallbackMatch && fallbackMatch[1]) {
        consumo = fallbackMatch[1].replace(',', '');
      }
    }

    const periodoMatch = txt.match(/\d{2}\s+[A-Z]{3}\s+\d{2,4}\s*[-A]\s*\d{2}\s+[A-Z]{3}\s+\d{2,4}/);

    setConsumoExtraido(consumo !== '' ? consumo : 'No detectado');
    setPeriodoExtraido(periodoMatch ? periodoMatch[0] : 'No detectado');
    setMostrarResultados(true);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      
      <Ionicons name="cloud-upload-outline" size={60} color={theme.primary} style={{ marginTop: 20, marginBottom: 10 }} />
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>Subir Recibo a la Nube</Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 }}>
        Nuestra IA leerá el PDF del recibo para extraer el consumo automáticamente (Máx 1MB).
      </Text>

      <TouchableOpacity 
        style={{ backgroundColor: theme.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}
        onPress={pickDocument}
        disabled={isProcessing}
      >
        <Ionicons name="document-attach" size={20} color="#000" style={{ marginRight: 10 }} />
        <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>
          {isProcessing ? "Analizando en la Nube..." : "Seleccionar PDF"}
        </Text>
      </TouchableOpacity>

      {isProcessing && (
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: 15 }}>Extrayendo datos con OCR...</Text>
        </View>
      )}

      {mostrarResultados && !isProcessing && (
        <View style={{ width: '100%', backgroundColor: theme.card, padding: 20, borderRadius: 12, borderColor: theme.border, borderWidth: 1, marginTop: 10 }}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
            Resultados del Escaneo
          </Text>
          
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 5 }}>Archivo escaneado:</Text>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500', marginBottom: 15 }}>{fileName}</Text>

          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 5 }}>Periodo Detectado:</Text>
          <TextInput 
            style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: theme.border }}
            value={periodoExtraido}
            onChangeText={setPeriodoExtraido}
          />

          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 5 }}>Consumo Total Detectado (kWh):</Text>
          <TextInput 
            style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 8, padding: 12, fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderWidth: 1, borderColor: theme.primary }}
            value={consumoExtraido}
            keyboardType="numeric"
            onChangeText={setConsumoExtraido}
          />

          {/* NUEVA SECCIÓN DE DIAGNÓSTICO PARA EL USUARIO */}
          <View style={{ borderTopWidth: 1, borderTopColor: theme.border, marginTop: 15, paddingTop: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: 'bold' }}>Modo Diagnóstico (Ver texto leído)</Text>
              <Switch 
                value={verDiagnostico} 
                onValueChange={setVerDiagnostico} 
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
            
            {verDiagnostico && (
              <View style={{ backgroundColor: '#000', padding: 10, borderRadius: 8, maxHeight: 200 }}>
                <ScrollView nestedScrollEnabled={true}>
                  <Text style={{ color: '#00FF00', fontFamily: 'monospace', fontSize: 10 }}>
                    {textoCrudo}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
          
        </View>
      )}

    </ScrollView>
  );
}