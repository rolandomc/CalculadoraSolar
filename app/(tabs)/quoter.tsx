import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

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
  const router = useRouter();
  const { isPremium } = usePremium();
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

  const exportarPDF = async () => {
    if (!resultado) {
      Alert.alert('Error', 'Primero calcula la cotización');
      return;
    }

    try {
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial; margin: 20px; color: #333; line-height: 1.6; }
              h1 { color: #10B981; text-align: center; margin-bottom: 5px; }
              .fecha { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
              .section { margin-top: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .section h2 { color: #10B981; margin: 0 0 12px 0; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 8px; border-bottom: 1px solid #eee; }
              .label { font-weight: bold; width: 60%; }
              .value { text-align: right; width: 40%; }
              .highlight { background-color: #E8F5E9; }
              .total { background-color: #10B981; color: white; font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
            </style>
          </head>
          <body>
            <h1>Cotización de Sistema Solar</h1>
            <p class="fecha">Generado: ${new Date().toLocaleDateString('es-MX')}</p>

            <div class="section">
              <h2>📊 Sistema</h2>
              <table>
                <tr>
                  <td class="label">Potencia:</td>
                  <td class="value">${cotizacion.potenciaKWp} kWp</td>
                </tr>
                <tr>
                  <td class="label">Tarifa Electricidad:</td>
                  <td class="value">$${tarifaElectricia} MXN/kWh</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>💰 Desglose de Costos</h2>
              <table>
                <tr>
                  <td class="label">Paneles:</td>
                  <td class="value">$${Math.round(resultado.costoPanel).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Inversor:</td>
                  <td class="value">$${Math.round(resultado.costoInversor).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Cable:</td>
                  <td class="value">$${Math.round(resultado.costoCable).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Estructura:</td>
                  <td class="value">$${Math.round(resultado.costoEstructura).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Protecciones:</td>
                  <td class="value">$${Math.round(resultado.costoProtecciones).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Trámites CFE:</td>
                  <td class="value">$${Math.round(resultado.costoTramites).toLocaleString()}</td>
                </tr>
                <tr class="highlight">
                  <td class="label">Subtotal:</td>
                  <td class="value">$${Math.round(resultado.subtotal).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Ganancia (${cotizacion.gananciaPercent}%):</td>
                  <td class="value">$${Math.round(resultado.ganancia).toLocaleString()}</td>
                </tr>
                <tr class="total">
                  <td class="label">PRECIO FINAL:</td>
                  <td class="value">$${Math.round(resultado.precioFinal).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>📈 Análisis ROI</h2>
              <table>
                <tr>
                  <td class="label">Ahorro Mensual:</td>
                  <td class="value">$${Math.round(resultado.ahorroMensual).toLocaleString()}</td>
                </tr>
                <tr>
                  <td class="label">Ahorro Anual:</td>
                  <td class="value">$${Math.round(resultado.ahorroAnual).toLocaleString()}</td>
                </tr>
                <tr class="highlight">
                  <td class="label">Tiempo de Recuperación:</td>
                  <td class="value">${resultado.tiempoRecuperacion.toFixed(1)} años</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p>Cotización generada por Calculadora Solar</p>
              <p>Valores estimados. Consultar con proveedor para precios actualizados.</p>
            </div>
          </body>
        </html>
      `;

      const fileName = `Cotizacion_${cotizacion.potenciaKWp}kWp_${Date.now()}.html`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, htmlContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/html',
          dialogTitle: 'Compartir Cotización',
          UTI: 'public.html',
        });
      } else {
        Alert.alert('Éxito', `Cotización guardada en: ${fileName}`);
      }
    } catch (error: any) {
      console.error('Error exportando:', error);
      Alert.alert('Error', error?.message || 'No se pudo exportar la cotización');
    }
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
    <>
      {!isPremium ? (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={64} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' }}>
              Cotizador Premium
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: 'center',
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Desbloquea el cotizador profesional para crear presupuestos personalizados con ganancia automática y exportación a PDF.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 14,
                paddingHorizontal: 28,
                borderRadius: 8,
              }}
              onPress={() => router.push('/paywall')}
            >
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Desbloquear Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
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

          {/* Botones */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.primary,
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={calcularCotizacion}
            >
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Calcular</Text>
            </TouchableOpacity>

            {resultado && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                onPress={exportarPDF}
              >
                <Ionicons name="download-outline" size={20} color="#000" style={{ marginRight: 8 }} />
                <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Exportar</Text>
              </TouchableOpacity>
            )}
          </View>

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
      )}
    </>
  );
}
