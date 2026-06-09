import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 1. Definimos el "molde" o manual de instrucciones de lo que este componente necesita recibir
type TarjetaResultadosProps = {
  isPremium: boolean;
  resultadoPaneles: number;
  potenciaInstalada: number;
  panelSeleccionadoPMax: number;
  proteccionCC: number | null;
  calibreCC: string | null;
  proteccionCA: number | null;
  calibreCA: string | null;
};

// 2. Creamos la pieza visual usando esos datos
export default function TarjetaResultados({
  isPremium,
  resultadoPaneles,
  potenciaInstalada,
  panelSeleccionadoPMax,
  proteccionCC,
  calibreCC,
  proteccionCA,
  calibreCA,
}: TarjetaResultadosProps) {
  
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>Resultado del Dimensionamiento:</Text>
      <Text style={styles.resultText}>{resultadoPaneles} Paneles de {panelSeleccionadoPMax}W</Text>
      <Text style={styles.resultSubText}>Potencia Instalada: {potenciaInstalada.toFixed(2)} kWp</Text>
      
      {/* Resultados exclusivos de la versión Premium */}
      {isPremium && proteccionCC !== null && proteccionCA !== null && (
        <View style={styles.premiumResults}>
          <Text style={styles.premiumResultTitle}>Normativa NOM-001-SEDE-2012:</Text>
          
          <View style={styles.normativaRow}>
            <Text style={styles.normativaLabel}>Lado CC (Paneles):</Text>
            <Text style={styles.premiumResultText}>Fusible: {proteccionCC}A  |  Cable: {calibreCC}</Text>
          </View>

          <View style={styles.normativaRow}>
            <Text style={styles.normativaLabel}>Lado CA (Inversor):</Text>
            <Text style={styles.premiumResultText}>Pastilla: {proteccionCA}A  |  Cable: {calibreCA}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// 3. Trajimos todos los estilos verdes que estaban en el archivo principal
const styles = StyleSheet.create({
  resultCard: { 
    width: '100%',
    maxWidth: 400,
    marginTop: 30, 
    backgroundColor: '#1E293B', // Azul muy oscuro
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  resultTitle: { fontSize: 18, color: '#34D399', fontWeight: 'bold' },
  resultText: { fontSize: 24, color: '#FFFFFF', marginTop: 10, fontWeight: 'bold' },
  // ... aplica colores claros a todos los textos
});