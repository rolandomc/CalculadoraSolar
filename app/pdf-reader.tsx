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
  const [tipoConsumo, setTipoConsumo] = useState<string>(''); // Para avisar si es Promedio o de 1 solo periodo
  const [mostrarResultados, setMostrarResultados] = useState(false);
  
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
    setTipoConsumo('');
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

      // Guardamos el texto original respetando mayúsculas y minúsculas para el historial
      const textoCompleto = datos.ParsedResults.map((p: any) => p.ParsedText).join('\n');
      setTextoCrudo(textoCompleto);
      
      console.log("\n\n========== INICIO DEL TEXTO DEL RECIBO CFE ==========\n");
      console.log(textoCompleto);
      console.log("\n=========== FIN DEL TEXTO DEL RECIBO CFE ============\n\n");

      analizarTextoCFE(textoCompleto);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error de Escaneo', error.message || 'Hubo un problema comunicándose con el servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const analizarTextoCFE = (textoRaw: string) => {
    const txtMayus = textoRaw.toUpperCase();
    let consumo = '';
    let tipo = '';

    // INTENTO 1 (LA FORMA PROFESIONAL): Buscar la tabla de "Consumo Histórico"
    // Buscamos la palabra "kWh" y atrapamos todos los números que estén debajo de ella
    const historialRegex = /kWh\s*\n((?:\d+\s*\n)+)/i; // Usamos textoRaw (sin mayúsculas forzadas) para no romper el formato
    const matchHistorial = textoRaw.match(historialRegex);
    
    if (matchHistorial && matchHistorial[1]) {
      // Separamos los números, ignorando letras
      const consumosHistorial = matchHistorial[1].trim().split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      
      if (consumosHistorial.length > 0) {
        // Tomamos máximo 6 bimestres (1 año de consumo)
        const ultimos6 = consumosHistorial.slice(0, 6);
        const sumaAnual = ultimos6.reduce((acc, val) => acc + val, 0);
        const promedioBimestral = Math.round(sumaAnual / ultimos6.length);
        
        consumo = promedioBimestral.toString();
        tipo = `Promedio de 1 año (${ultimos6.length} periodos)`;
      }
    }

    // INTENTO 2: Si no hay historial, sacamos el del mes actual (Respaldo)
    if (!consumo) {
      const matchVertical = txtMayus.match(/TOTAL\s+PERIODO\s+([\d,]+)/);
      if (matchVertical && matchVertical[1]) {
        consumo = matchVertical[1].replace(/,/g, '');
        tipo = 'Solo periodo actual (No recomendado)';
      }
    }

    // INTENTO 3: Respaldo horizontal
    if (!consumo) {
      const lineaEnergiaMatch = txtMayus.match(/ENERG[IÍ]A\s*\(KWH\)(.*)/);
      if (lineaEnergiaMatch && lineaEnergiaMatch[1]) {
        const numerosFila = lineaEnergiaMatch[1].match(/\d+/g);
        if (numerosFila && numerosFila.length > 0) {
          consumo = numerosFila[numerosFila.length - 1]; 
          tipo = 'Solo periodo actual (No recomendado)';
        }
      }
    }

    // Extraer periodo actual (para referencia del usuario)
    const periodoMatch = txtMayus.match(/\d{2}\s+[A-Z]{3}\s+\d{2,4}\s*[-A]\s*\d{2}\s+[A-Z]{3}\s+\d{2,4}/);

    setConsumoExtraido(consumo !== '' ? consumo : 'No detectado');
    setTipoConsumo(tipo !== '' ? tipo : 'Desconocido');
    setPeriodoExtraido(periodoMatch ? periodoMatch[0] : 'No detectado');
    setMostrarResultados(true);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      
      <Ionicons name="cloud-upload-outline" size={60} color={theme.primary} style={{ marginTop: 20, marginBottom: 10 }} />
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>Subir Recibo a la Nube</Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 }}>
        Nuestra IA leerá el historial del recibo para extraer el promedio anual y dimensionar correctamente.
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
          <Text style={{ color: theme.textSecondary, marginTop: 15 }}>Extrayendo historial con OCR...</Text>
        </View>
      )}

      {mostrarResultados && !isProcessing && (
        <View style={{ width: '100%', backgroundColor: theme.card, padding: 20, borderRadius: 12, borderColor: theme.border, borderWidth: 1, marginTop: 10 }}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
            Resultados del Escaneo
          </Text>
          
          <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 5 }}>Último periodo detectado:</Text>
          <TextInput 
            style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: theme.border }}
            value={periodoExtraido}
            onChangeText={setPeriodoExtraido}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Consumo a ingresar (kWh):</Text>
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}>{tipoConsumo}</Text>
          </View>
          
          <TextInput 
            style={{ backgroundColor: theme.inputBg, color: theme.text, borderRadius: 8, padding: 12, fontSize: 18, fontWeight: 'bold', marginBottom: 15, borderWidth: 1, borderColor: theme.primary }}
            value={consumoExtraido}
            keyboardType="numeric"
            onChangeText={setConsumoExtraido}
          />

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
                    Revisa la terminal de VS Code para copiar el texto completo fácilmente.
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