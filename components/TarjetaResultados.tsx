import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function TarjetaResultados({ isPremium, resultado, panelSeleccionado }: any) {
  const { isDark } = useTheme();

  // Condicion visual para el ratio de sobredimensionamiento
  const ratio = resultado.ratioSobredimensionamiento;
  let colorRatio = '#34D399'; // Verde optimo
  if (ratio > 130) colorRatio = '#EF4444'; // Rojo (Peligro)
  else if (ratio < 95) colorRatio = '#FCD34D'; // Amarillo (Inversor sobrado)

  return (
    <View style={{ width: '100%', maxWidth: 400, marginTop: 30, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: themeBorderColor(isDark), shadowColor: '#000', elevation: 4 }}>
      <Text style={{ fontSize: 18, color: isDark ? '#FFFFFF' : '#000000', fontWeight: '800', textAlign: 'center', marginBottom: 15 }}>Diseño del Arreglo</Text>
      
      <View style={{ backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center' }}>
        <Text style={{ fontSize: 32, color: '#10B981', fontWeight: '900' }}>{resultado.paneles} Módulos</Text>
        <Text style={{ fontSize: 14, color: isDark ? '#A1A1AA' : '#52525B', marginTop: 4 }}>{panelSeleccionado.nombre}</Text>
        <Text style={{ fontSize: 16, color: isDark ? '#E4E4E7' : '#27272A', marginTop: 8, fontWeight: '600' }}>Generador DC: {resultado.potenciaKWp.toFixed(2)} kWp</Text>
      </View>

      {isPremium && resultado.inversorSugerido && (
        <>
          <View style={{ backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE', padding: 15, borderRadius: 12, marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="hardware-chip" size={20} color={isDark ? '#93C5FD' : '#1D4ED8'} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, color: isDark ? '#FFFFFF' : '#1E40AF', fontWeight: 'bold' }}>Inversor Sugerido</Text>
            </View>
            <Text style={{ fontSize: 18, color: isDark ? '#93C5FD' : '#1D4ED8', fontWeight: '700' }}>{resultado.inversorSugerido.nombre}</Text>
            <Text style={{ fontSize: 14, color: isDark ? '#BFDBFE' : '#3B82F6', marginTop: 4 }}>Capacidad AC: {resultado.inversorSugerido.potenciaCA} kW</Text>
            
            <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#3B82F6' : '#93C5FD', paddingTop: 10 }}>
               <Text style={{ fontSize: 13, color: isDark ? '#E0E7FF' : '#1E3A8A' }}>
                 Relación DC/AC: <Text style={{ color: colorRatio, fontWeight: 'bold' }}>{ratio.toFixed(1)}%</Text> 
                 {ratio > 100 && ratio <= 130 ? ' (Sobredimensionamiento Óptimo)' : ''}
               </Text>
            </View>
          </View>

          <View style={{ marginTop: 5, paddingTop: 15, borderTopWidth: 1, borderTopColor: isDark ? '#3F3F46' : '#E4E4E7' }}>
            <Text style={{ fontSize: 16, color: isDark ? '#FFFFFF' : '#000000', fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>NOM-001-SEDE-2012</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6', padding: 10, borderRadius: 8, marginRight: 5 }}>
                <Text style={{ fontSize: 12, color: isDark ? '#A1A1AA' : '#52525B', fontWeight: 'bold' }}>Lado CC</Text>
                <Text style={{ fontSize: 14, color: isDark ? '#FFFFFF' : '#000000', fontWeight: '600', marginTop: 4 }}>Fusible: {resultado.proteccionCC}A</Text>
                <Text style={{ fontSize: 13, color: isDark ? '#A1A1AA' : '#52525B' }}>Cable: {resultado.calibreCC}</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6', padding: 10, borderRadius: 8, marginLeft: 5 }}>
                <Text style={{ fontSize: 12, color: isDark ? '#A1A1AA' : '#52525B', fontWeight: 'bold' }}>Lado CA</Text>
                <Text style={{ fontSize: 14, color: isDark ? '#FFFFFF' : '#000000', fontWeight: '600', marginTop: 4 }}>Breaker: {resultado.proteccionCA}A</Text>
                <Text style={{ fontSize: 13, color: isDark ? '#A1A1AA' : '#52525B' }}>Cable: {resultado.calibreCA}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function themeBorderColor(isDark: boolean) {
  return isDark ? '#333333' : '#E5E7EB';
}