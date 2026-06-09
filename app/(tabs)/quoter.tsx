import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface CotizacionComponentes {
  potenciaKWp: number;
  precioPanel: number; // total o por W
  precioInversor: number; // total o por W
  metrosCable: number;
  precioCable: number; // por metro
  precioEstructura: number; // total
  protecciones: number; // total (fusibles, breaker, etc)
  tramites: number; // total
  gananciaPercent: number; // porcentaje
}

interface ResultadoCotizacion {
  costoPanel: number;
  costoInversor: number;
  costoCable: number;
  costoEstructura: number;
  costoProtecciones: number;
  costoTramites: number;
  subtotal: number;
  ganancia: number;
  precioFinal: number;
  tarifaAsumida: number;
  ahorroMensual: number;
  ahorroAnual: number;
  tiempoRecuperacion: number;
}

export default function CotizadorScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [cotizacion, setCotizacion] = useState<CotizacionComponentes>({
    potenciaKWp: 5,
    precioPanel: 2500,
    precioInversor: 15000,
    metrosCable: 50,
    precioCable: 25,
    precioEstructura: 3000,
    protecciones: 2000,
    tramites: 1500,
    gananciaPercent: 20,
  });

  const [resultado, setResultado] = useState<ResultadoCotizacion | null>(null);
  const [tarifaElectricia, setTarifaElectricia] = useState('3.8');

  const formatMXN = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const calcularCotizacion = () => {
    const tarifa = parseFloat(tarifaElectricia);
    if (isNaN(tarifa) || tarifa <= 0) {
      Alert.alert('Error', 'Ingresa una tarifa válida');
      return;
    }

    // Calcular costos
    const costoPanel = cotizacion.precioPanel * cotizacion.potenciaKWp;
    const costoInversor = cotizacion.precioInversor;
    const costoCable = cotizacion.metrosCable * cotizacion.precioCable;
    const costoEstructura = cotizacion.precioEstructura;
    const costoProtecciones = cotizacion.protecciones;
    const costoTramites = cotizacion.tramites;

    const subtotal = costoPanel + costoInversor + costoCable + costoEstructura + costoProtecciones + costoTramites;
    const ganancia = (subtotal * cotizacion.gananciaPercent) / 100;
    const precioFinal = subtotal + ganancia;

    // Calcular ROI
    const hsp = 5; // horas de sol pico promedio
    const diasMes = 30;
    const produccionMensual = cotizacion.potenciaKWp * hsp * diasMes; // kWh
    const ahorroMensual = produccionMensual * tarifa;
    const ahorroAnual = ahorroMensual * 12;
    const tiempoRecuperacion = precioFinal / ahorroAnual;

    setResultado({
      costoPanel,
      costoInversor,
      costoCable,
      costoEstructura,
      costoProtecciones,
      costoTramites,
      subtotal,
      ganancia,
      precioFinal,
      tarifaAsumida: tarifa,
      ahorroMensual,
      ahorroAnual,
      tiempoRecuperacion,
    });
  };

  const InputField = ({ label, value, onChange, placeholder, unit = '' }: any) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, fontWeight: '500' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            backgroundColor: theme.inputBg,
            color: theme.text,
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChange}
        />
        {unit && (
          <Text style={{ marginLeft: 8, color: theme.textSecondary, fontWeight: '600', minWidth: 40 }}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
    >
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>
        Cotizador Manual
      </Text>

      {/* Sistema */}
      <View
        style={{
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="calculator-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Sistema</Text>
        </View>
        <InputField
          label="Potencia del Sistema"
          value={cotizacion.potenciaKWp.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, potenciaKWp: parseFloat(v) || 0 })}
          placeholder="5"
          unit="kWp"
        />
      </View>

      {/* Componentes */}
      <View
        style={{
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="hardware-chip-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Componentes</Text>
        </View>

        <InputField
          label="Precio Panel"
          value={cotizacion.precioPanel.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, precioPanel: parseFloat(v) || 0 })}
          placeholder="2500"
          unit="MXN/kWp"
        />

        <InputField
          label="Precio Inversor"
          value={cotizacion.precioInversor.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, precioInversor: parseFloat(v) || 0 })}
          placeholder="15000"
          unit="MXN"
        />

        <InputField
          label="Metros de Cable"
          value={cotizacion.metrosCable.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, metrosCable: parseFloat(v) || 0 })}
          placeholder="50"
          unit="m"
        />

        <InputField
          label="Precio Cable"
          value={cotizacion.precioCable.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, precioCable: parseFloat(v) || 0 })}
          placeholder="25"
          unit="MXN/m"
        />

        <InputField
          label="Estructura"
          value={cotizacion.precioEstructura.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, precioEstructura: parseFloat(v) || 0 })}
          placeholder="3000"
          unit="MXN"
        />

        <InputField
          label="Protecciones (fusibles, breaker, etc)"
          value={cotizacion.protecciones.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, protecciones: parseFloat(v) || 0 })}
          placeholder="2000"
          unit="MXN"
        />

        <InputField
          label="Trámites CFE"
          value={cotizacion.tramites.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, tramites: parseFloat(v) || 0 })}
          placeholder="1500"
          unit="MXN"
        />
      </View>

      {/* Ganancia */}
      <View
        style={{
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="trending-up-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Ganancia</Text>
        </View>

        <InputField
          label="Ganancia"
          value={cotizacion.gananciaPercent.toString()}
          onChange={(v: string) => setCotizacion({ ...cotizacion, gananciaPercent: parseFloat(v) || 0 })}
          placeholder="20"
          unit="%"
        />
      </View>

      {/* Tarifa Electricidad */}
      <View
        style={{
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="flash-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Tarifa de Electricidad</Text>
        </View>

        <InputField
          label="Tarifa"
          value={tarifaElectricia}
          onChange={setTarifaElectricia}
          placeholder="3.8"
          unit="MXN/kWh"
        />
      </View>

      {/* Botón Calcular */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.primary,
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 16,
        }}
        onPress={calcularCotizacion}
      >
        <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Calcular Cotización</Text>
      </TouchableOpacity>

      {/* Resultados */}
      {resultado && (
        <View>
          {/* Desglose de Costos */}
          <View
            style={{
              backgroundColor: theme.card,
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
              Desglose de Costos
            </Text>

            <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Paneles</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoPanel)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Inversor</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoInversor)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Cable</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoCable)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Estructura</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoEstructura)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Protecciones</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoProtecciones)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: theme.textSecondary }}>Trámites</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoTramites)}</Text>
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontWeight: '600' }}>Subtotal</Text>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{formatMXN(resultado.subtotal)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.primary, fontWeight: '600' }}>Ganancia ({cotizacion.gananciaPercent}%)</Text>
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>{formatMXN(resultado.ganancia)}</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    backgroundColor: theme.primary + '15',
                    padding: 10,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>PRECIO FINAL</Text>
                  <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>
                    {formatMXN(resultado.precioFinal)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ROI */}
          <View
            style={{
              backgroundColor: theme.card,
              padding: 16,
              borderRadius: 12,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
              ROI Estimado
            </Text>

            <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Ahorro Mensual</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.ahorroMensual)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: theme.textSecondary }}>Ahorro Anual</Text>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.ahorroAnual)}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  backgroundColor: theme.primary + '15',
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: '700' }}>Tiempo de Recuperación</Text>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  {resultado.tiempoRecuperacion.toFixed(1)} años
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
