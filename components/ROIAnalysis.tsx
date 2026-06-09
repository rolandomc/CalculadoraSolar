import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { AnalisisROI } from '../utils/roiCalculos';

interface ROIAnalysisProps {
  roi: AnalisisROI;
}

export default function ROIAnalysis({ roi }: ROIAnalysisProps) {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const [expandedSection, setExpandedSection] = useState<string>('');

  const formatMXN = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatNumber = (valor: number, decimales: number = 1) => {
    return valor.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  };

  const toggleSection = (id: string) => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedSection(expandedSection === id ? '' : id);
  };

  const Section = ({ title, icon, id, children }: any) => (
    <TouchableOpacity
      onPress={() => toggleSection(id)}
      activeOpacity={0.7}
    >
      <View
        style={{
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 12,
          marginBottom: 12,
          borderColor: theme.border,
          borderWidth: 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name={icon} size={24} color={theme.primary} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>{title}</Text>
          </View>
          <Ionicons
            name={expandedSection === id ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.textSecondary}
          />
        </View>

        {expandedSection === id && <View style={{ marginTop: 16 }}>{children}</View>}
      </View>
    </TouchableOpacity>
  );

  const DetailRow = ({ label, value, highlight = false }: any) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
      <Text style={{ fontSize: 14, color: theme.textSecondary, flex: 1 }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: highlight ? '700' : '600',
          color: highlight ? theme.primary : theme.text,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );

  const yearsToRecovery = Math.ceil(roi.tiempoRecuperacion);
  const recoveryColor =
    yearsToRecovery <= 5
      ? '#10B981'
      : yearsToRecovery <= 8
        ? '#F59E0B'
        : '#EF4444';

  return (
    <ScrollView
      style={{ flex: 1, width: '100%', maxWidth: 400, alignSelf: 'center' }}
      contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Resumen rápido - Siempre visible */}
      <View
        style={{
          backgroundColor: theme.primary + '15',
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          marginHorizontal: 0,
          borderColor: theme.primary,
          borderWidth: 1,
          minHeight: 140,
          justifyContent: 'center',
        }}
      >
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
            Inversión Total
          </Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.primary }}>
            {formatMXN(roi.costoTotal)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
              Ahorro Mensual
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
              {formatMXN(roi.ahorroMensual)}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
              Recuperación
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: recoveryColor }}>
              {formatNumber(roi.tiempoRecuperacion, 1)} años
            </Text>
          </View>
        </View>
      </View>

      {/* Desglose de inversión */}
      <Section title="Desglose de Inversión" icon="wallet-outline" id="inversion">
        <DetailRow label="Paneles solares" value={formatMXN(roi.costoPaneles)} />
        <DetailRow label="Inversor" value={formatMXN(roi.costoInversor)} />
        <DetailRow label="Componentes (cables, protecciones)" value={formatMXN(roi.costoSOP)} />
        <DetailRow label="Instalación" value={formatMXN(roi.costoInstalacion)} />
        <DetailRow label="Permisos y trámites CFE" value={formatMXN(roi.costoPermiso)} />
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, marginTop: 10 }}>
          <DetailRow
            label="Total"
            value={formatMXN(roi.costoTotal)}
            highlight
          />
        </View>
      </Section>

      {/* Ahorro anual */}
      <Section title="Ahorro Estimado" icon="trending-up-outline" id="ahorro">
        <DetailRow label="Ahorro mensual" value={formatMXN(roi.ahorroMensual)} />
        <DetailRow label="Ahorro anual" value={formatMXN(roi.ahorroAnual)} />
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 10, marginVertical: 10 }}>
          <DetailRow label="Ahorro a 5 años" value={formatMXN(roi.ahorroA5Anios)} highlight />
          <DetailRow label="Ahorro a 10 años" value={formatMXN(roi.ahorroA10Anios)} highlight />
          <DetailRow
            label="Ahorro a 25 años"
            value={formatMXN(roi.ahorroA25Anios)}
            highlight
          />
        </View>
      </Section>

      {/* Métricas financieras */}
      <Section title="Métricas Financieras" icon="calculator-outline" id="metricas">
        <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <DetailRow
            label="Tiempo de recuperación"
            value={formatNumber(roi.tiempoRecuperacion, 1) + ' años'}
          />
          <Text
            style={{
              fontSize: 12,
              color: theme.textSecondary,
              marginTop: 8,
              fontStyle: 'italic',
            }}
          >
            {yearsToRecovery <= 5
              ? '✓ Muy buen tiempo de recuperación'
              : yearsToRecovery <= 8
                ? '⚠ Tiempo de recuperación aceptable'
                : '⚠ Tiempo de recuperación elevado'}
          </Text>
        </View>

        <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <DetailRow label="TIR a 25 años" value={formatNumber(roi.tir, 1) + '%'} />
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
            Tasa Interna de Retorno
          </Text>
        </View>

        <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
          <DetailRow label="VPN a 25 años" value={formatMXN(roi.vrn)} highlight />
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8, fontStyle: 'italic' }}>
            Valor Presente Neto (con descuento 5%)
          </Text>
        </View>
      </Section>

      {/* Impacto ambiental */}
      <Section title="Impacto Ambiental" icon="leaf-outline" id="ambiental">
        <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
          <DetailRow label="CO₂ evitado en 25 años" value={formatNumber(roi.co2Evitado / 1000, 1) + ' ton'} />
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8 }}>
            Equivalente a plantar{' '}
            <Text style={{ fontWeight: '600' }}>
              {formatNumber((roi.co2Evitado / 1000) * 15, 0)}
            </Text>{' '}
            árboles
          </Text>
        </View>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
