import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function PdfReaderScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<{ consumo: string; periodo: string } | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', // Solo permitimos PDFs
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // Si seleccionó un archivo
      const file = result.assets[0];
      setFileName(file.name);
      procesarPDF(file.uri);
      
    } catch (error) {
      alert('Error al seleccionar el archivo');
    }
  };

  const procesarPDF = (uri: string) => {
    setIsProcessing(true);
    setExtractedData(null);

    // SIMULACIÓN DE EXTRACCIÓN
    // En el futuro, aquí enviaremos el 'uri' a una API de escaneo
    setTimeout(() => {
      setIsProcessing(false);
      setExtractedData({
        consumo: '1250',
        periodo: '12 Ago 2023 - 12 Oct 2023'
      });
    }, 2500); // Finge que está pensando por 2.5 segundos
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      
      <Ionicons name="cloud-upload-outline" size={60} color={theme.primary} style={{ marginTop: 20, marginBottom: 10 }} />
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>Subir Recibo CFE</Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 }}>
        Selecciona el recibo en formato PDF desde tu celular para extraer automáticamente el consumo del último bimestre.
      </Text>

      <TouchableOpacity 
        style={{ backgroundColor: theme.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}
        onPress={pickDocument}
        disabled={isProcessing}
      >
        <Ionicons name="document-attach" size={20} color="#000" style={{ marginRight: 10 }} />
        <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>
          {isProcessing ? "Procesando..." : "Explorar Archivos"}
        </Text>
      </TouchableOpacity>

      {isProcessing && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.textSecondary, marginTop: 15 }}>Analizando tabla de consumos...</Text>
        </View>
      )}

      {/* Resultados Simulados */}
      {extractedData && !isProcessing && (
        <View style={{ width: '100%', backgroundColor: theme.card, padding: 20, borderRadius: 12, borderColor: theme.border, borderWidth: 1, marginTop: 10 }}>
          <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
            ¡Extracción Exitosa!
          </Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Archivo:</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }}>{fileName}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Periodo Facturado:</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: '500' }}>{extractedData.periodo}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, marginTop: 5 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Consumo Total:</Text>
            <Text style={{ color: theme.primary, fontSize: 18, fontWeight: 'bold' }}>{extractedData.consumo} kWh</Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}