import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { usePremium } from '../../context/PremiumContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function HistoryScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isPremium } = usePremium();
  const theme = isDark ? Colors.dark : Colors.light;
  const [historial, setHistorial] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (isPremium) cargarHistorial();
    }, [isPremium])
  );

  const cargarHistorial = async () => {
    try {
      const data = await AsyncStorage.getItem('@historial_cotizaciones');
      if (data !== null) setHistorial(JSON.parse(data));
    } catch (error) {
      console.error('Error al cargar', error);
    }
  };

  const eliminarCotizacion = async (id: string) => {
    Alert.alert("Eliminar", "¿Seguro que deseas borrarla?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
          const nuevo = historial.filter(i => i.id !== id);
          await AsyncStorage.setItem('@historial_cotizaciones', JSON.stringify(nuevo));
          setHistorial(nuevo);
      }}
    ]);
  };

  const editarCotizacion = async (item: any) => {
    await AsyncStorage.setItem('@cotizacion_editar', JSON.stringify(item));
    router.push('/quoter');
  };

  const exportarPDFLocal = async (item: any) => {
    try {
      const { clienteInfo, cotizacion, resultado, tarifaElectricia } = item;
      const numPaneles = cotizacion.numPaneles || 0;

      // 1. Cargar el perfil de la empresa
      let perfilEmpresa = { nombre: 'Propuesta de Sistema Fotovoltaico', telefono: '', email: '', logo: '' };
      const stored = await AsyncStorage.getItem('@empresa_perfil');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.nombre) perfilEmpresa.nombre = parsed.nombre;
        perfilEmpresa.telefono = parsed.telefono || '';
        perfilEmpresa.email = parsed.email || '';
        perfilEmpresa.logo = parsed.logo || '';
      }
      
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
              .header { margin-bottom: 20px; }
              .fecha { color: #666; font-size: 13px; margin: 0; }
              
              .client-box { background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
              .client-box h3 { margin: 0 0 10px 0; color: #334155; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
              
              .section { margin-top: 20px; }
              h2 { color: #10B981; margin: 0 0 10px 0; font-size: 18px; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
              th { background-color: #10B981; color: white; padding: 10px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #eee; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              
              .summary-box { float: right; width: 50%; margin-top: 20px; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .summary-total { display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; color: #10B981; border-top: 2px solid #10B981; margin-top: 5px; }
              
              .clear { clear: both; }
              
              .roi-box { background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center; }
              .roi-grid { display: flex; justify-content: space-around; margin-top: 10px; }
              .roi-item { font-size: 14px; }
              .roi-val { font-size: 18px; font-weight: bold; color: #10B981; display: block; margin-top: 5px; }
            </style>
          </head>
          <body>
            
            <!-- ENCABEZADO PERSONALIZADO CON LOGO Y DATOS -->
            <div class="header">
              <table style="width: 100%; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 20px; border-collapse: collapse; margin-top: 0;">
                <tr>
                  <td style="width: 40%; border: none; text-align: left; vertical-align: middle; padding: 0;">
                    ${perfilEmpresa.logo ? `<img src="${perfilEmpresa.logo}" style="max-width: 200px; max-height: 90px; object-fit: contain;" />` : ''}
                  </td>
                  <td style="width: 60%; border: none; text-align: right; vertical-align: middle; padding: 0;">
                    <h1 style="color: #10B981; margin: 0 0 5px 0; font-size: 24px;">${perfilEmpresa.nombre}</h1>
                    ${perfilEmpresa.telefono ? `<p style="margin: 0; color: #666; font-size: 14px;">Tel: ${perfilEmpresa.telefono}</p>` : ''}
                    ${perfilEmpresa.email ? `<p style="margin: 0; color: #666; font-size: 14px;">Email: ${perfilEmpresa.email}</p>` : ''}
                    <p class="fecha" style="margin: 5px 0 0 0;">Fecha: <strong>${item.fecha}</strong></p>
                  </td>
                </tr>
              </table>
            </div>

            <div class="client-box">
              <h3>Datos del Cliente</h3>
              <p style="margin: 0;"><strong>Nombre:</strong> ${clienteInfo?.nombre || 'No especificado'}</p>
              <p style="margin: 5px 0 0 0;"><strong>Domicilio:</strong> ${clienteInfo?.domicilio || 'No especificado'}</p>
              <p style="margin: 5px 0 0 0;"><strong>No. de Medidor:</strong> ${clienteInfo?.medidor || 'No especificado'}</p>
            </div>

            <div class="section">
              <h2>Especificaciones Técnicas</h2>
              <p style="margin:0; font-size:14px;"><strong>Potencia Instalada:</strong> ${cotizacion.potenciaKWp} kWp</p>
              <p style="margin:5px 0 0 0; font-size:14px;"><strong>Tarifa Eléctrica Asumida:</strong> $${tarifaElectricia} MXN/kWh</p>
            </div>

            <div class="section">
              <h2>Desglose de Inversión</h2>
              <table>
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-right">Precio Unitario</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Módulos Solares Fotovoltaicos</td>
                    <td class="text-center">${numPaneles} pzas</td>
                    <td class="text-right">$${(cotizacion.precioPanel || 0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoPanel || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Inversor de Corriente</td>
                    <td class="text-center">1 pza</td>
                    <td class="text-right">$${(cotizacion.precioInversor || 0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoInversor || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Cableado Fotovoltaico</td>
                    <td class="text-center">${cotizacion.metrosCable || 0} mts</td>
                    <td class="text-right">$${(cotizacion.precioCable || 0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoCable || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Estructura de Montaje</td>
                    <td class="text-center">1 lote</td>
                    <td class="text-right">$${(cotizacion.precioEstructura || 0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoEstructura || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Protecciones Eléctricas</td>
                    <td class="text-center">1 lote</td>
                    <td class="text-right">$${(cotizacion.protecciones || 0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoProtecciones || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Gestión y Trámites CFE</td>
                    <td class="text-center">1 serv</td>
                    <td class="text-right">$${(cotizacion.tramites || 0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoTramites || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div class="summary-box">
                <div class="summary-row">
                  <span>Subtotal Equipos:</span>
                  <span>$${Math.round(resultado.subtotal).toLocaleString()}</span>
                </div>
                <div class="summary-row">
                  <span>Utilidad Operativa e Instalación:</span>
                  <span>$${Math.round(resultado.ganancia).toLocaleString()}</span>
                </div>
                <div class="summary-total">
                  <span>INVERSIÓN TOTAL:</span>
                  <span>$${Math.round(resultado.precioFinal).toLocaleString()} MXN</span>
                </div>
              </div>
              <div class="clear"></div>
            </div>

            <div class="roi-box">
              <h2 style="margin-top:0; text-align:center;">Análisis de Retorno de Inversión (ROI)</h2>
              <div class="roi-grid">
                <div class="roi-item">
                  Ahorro Mensual
                  <span class="roi-val">$${Math.round(resultado.ahorroMensual).toLocaleString()}</span>
                </div>
                <div class="roi-item">
                  Ahorro Anual
                  <span class="roi-val">$${Math.round(resultado.ahorroAnual).toLocaleString()}</span>
                </div>
                <div class="roi-item">
                  Tiempo de Recuperación
                  <span class="roi-val">${resultado.tiempoRecuperacion.toFixed(1)} años</span>
                </div>
              </div>
            </div>
            
            <p style="text-align:center; font-size:11px; color:#999; margin-top:40px;">* Esta cotización es un estimado y puede estar sujeta a cambios tras la inspección física del sitio.</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartir Cotización' });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el documento.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="person-circle-outline" size={24} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {item.clienteInfo?.nombre || `Sistema ${item.cotizacion.potenciaKWp} kWp`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => eliminarCotizacion(item.id)} style={{ padding: 5 }}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.date, { color: theme.textSecondary }]}>{item.fecha} a las {item.hora}</Text>

      <View style={styles.row}>
        <Text style={{ color: theme.textSecondary }}>Domicilio:</Text>
        <Text style={[styles.boldText, { color: theme.text }]} numberOfLines={1}>{item.clienteInfo?.domicilio || 'N/A'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={{ color: theme.textSecondary }}>Costo Total:</Text>
        <Text style={[styles.boldText, { color: theme.primary, fontSize: 16 }]}>
          ${Math.round(item.resultado.precioFinal).toLocaleString()} MXN
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.inputBg, borderColor: theme.border, borderWidth: 1 }]} onPress={() => editarCotizacion(item)}>
          <Ionicons name="pencil-outline" size={16} color={theme.text} style={{ marginRight: 5 }} />
          <Text style={{ color: theme.text, fontWeight: '600' }}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => exportarPDFLocal(item)}>
          <Ionicons name="document-text-outline" size={16} color="#000" style={{ marginRight: 5 }} />
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {!isPremium ? (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={64} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' }}>
              Historial Premium
            </Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Desbloquea esta función para guardar ilimitadamente tus proyectos y modificarlos en cualquier momento.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 }}
              onPress={() => router.push('/paywall')}
            >
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Desbloquear Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Mis Proyectos</Text>
          {historial.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aún no tienes cotizaciones guardadas.</Text>
            </View>
          ) : (
            <FlatList data={historial} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 20 }} />
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 10 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  date: { fontSize: 12, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' },
  boldText: { fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, fontSize: 16, textAlign: 'center' },
  actionBtn: { flex: 1, flexDirection: 'row', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});