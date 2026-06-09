import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  
  const { isDark } = useTheme();

  return (
    <View style={{ width: '100%', maxWidth: 400, marginTop: 30, backgroundColor: isDark ? '#064E3B' : '#ECFDF5', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#34D399', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, color: isDark ? '#34D399' : '#065F46', fontWeight: 'bold' }}>Resultado del Dimensionamiento:</Text>
      <Text style={{ fontSize: 24, color: isDark ? '#FFFFFF' : '#047857', marginTop: 10, fontWeight: 'bold', textAlign: 'center' }}>{resultadoPaneles} Paneles de {panelSeleccionadoPMax}W</Text>
      <Text style={{ fontSize: 16, color: isDark ? '#6EE7B7' : '#059669', marginTop: 8, fontWeight: '500', marginBottom: 10 }}>Potencia Instalada: {potenciaInstalada.toFixed(2)} kWp</Text>
      
      {isPremium && proteccionCC !== null && proteccionCA !== null && (
        <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#6EE7B7', width: '100%' }}>
          <Text style={{ fontSize: 16, color: isDark ? '#34D399' : '#047857', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Normativa NOM-001-SEDE-2012:</Text>
          
          <View style={{ backgroundColor: isDark ? '#022C22' : '#D1FAE5', padding: 10, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: isDark ? '#6EE7B7' : '#065F46', fontWeight: 'bold' }}>Lado CC (Paneles):</Text>
            <Text style={{ fontSize: 15, color: isDark ? '#FFFFFF' : '#047857', fontWeight: '600', marginTop: 4 }}>Fusible: {proteccionCC}A  |  Cable: {calibreCC}</Text>
          </View>

          <View style={{ backgroundColor: isDark ? '#022C22' : '#D1FAE5', padding: 10, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: isDark ? '#6EE7B7' : '#065F46', fontWeight: 'bold' }}>Lado CA (Inversor):</Text>
            <Text style={{ fontSize: 15, color: isDark ? '#FFFFFF' : '#047857', fontWeight: '600', marginTop: 4 }}>Pastilla: {proteccionCA}A  |  Cable: {calibreCA}</Text>
          </View>
        </View>
      )}
    </View>
  );
}