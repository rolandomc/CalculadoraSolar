import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. COMPONENTE INPUT FUERA DE LA FUNCIÓN PRINCIPAL (Para que no se cierre el teclado)
const InputField = ({ label, value, onChange, placeholder, unit = '', theme }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, fontWeight: '500' }}>
      {label}
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        style={{
          flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 8,
          padding: 10, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text,
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={unit === '' ? "default" : "decimal-pad"}
        value={value}
        onChangeText={onChange}
      />
      {unit !== '' && (
        <Text style={{ marginLeft: 8, color: theme.textSecondary, fontWeight: '600', minWidth: 40 }}>
          {unit}
        </Text>
      )}
    </View>
  </View>
);

interface CotizacionComponentes {
  potenciaKWp: number;
  numPaneles: number;
  precioPanel: number;
  precioInversor: number;
  metrosCable: number;
  precioCable: number;
  precioEstructura: number;
  protecciones: number;
  tramites: number;
  gananciaPercent: number;
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

  const [editId, setEditId] = useState<string | null>(null);

  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    domicilio: '',
    medidor: ''
  });

  const [cotizacion, setCotizacion] = useState<CotizacionComponentes>({
    potenciaKWp: 5,
    numPaneles: 10,
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

  // Cargar datos (del OCR o de Edición) al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      const cargarDatosExternos = async () => {
        try {
          // Revisar si escaneamos un recibo
          const scanned = await AsyncStorage.getItem('@scanned_cfe');
          if (scanned) {
            const data = JSON.parse(scanned);
            setClienteInfo({
              nombre: data.nombre || '',
              domicilio: data.domicilio || '',
              medidor: data.medidor || ''
            });
            if (data.tarifa) setTarifaElectricia(data.tarifa);
            await AsyncStorage.removeItem('@scanned_cfe');
          }

          // Revisar si venimos de "Editar" en el historial
          const editData = await AsyncStorage.getItem('@cotizacion_editar');
          if (editData) {
            const item = JSON.parse(editData);
            setEditId(item.id);
            setClienteInfo(item.clienteInfo || { nombre: '', domicilio: '', medidor: '' });
            setCotizacion(item.cotizacion);
            setTarifaElectricia(item.tarifaElectricia.toString());
            setResultado(item.resultado);
            await AsyncStorage.removeItem('@cotizacion_editar');
          }
        } catch (e) {
          console.error("Error cargando datos", e);
        }
      };
      cargarDatosExternos();
    }, [])
  );

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

    // Calcular costos multiplicando por cantidad
    const costoPanel = cotizacion.numPaneles * cotizacion.precioPanel;
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
      costoPanel, costoInversor, costoCable, costoEstructura, costoProtecciones, costoTramites,
      subtotal, ganancia, precioFinal, tarifaAsumida: tarifa, ahorroMensual, ahorroAnual, tiempoRecuperacion,
    });
  };

  const guardarCotizacion = async () => {
    if (!resultado) {
      Alert.alert('Error', 'Primero calcula la cotización');
      return;
    }
    try {
      const nuevaCotizacion = {
        id: editId || Date.now().toString(),
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        clienteInfo,
        cotizacion,
        resultado,
        tarifaElectricia
      };
      
      const cotizacionesGuardadas = await AsyncStorage.getItem('@historial_cotizaciones');
      const historial = cotizacionesGuardadas ? JSON.parse(cotizacionesGuardadas) : [];
      
      if (editId) {
        const index = historial.findIndex((item: any) => item.id === editId);
        if (index !== -1) {
          historial[index] = nuevaCotizacion;
        } else {
          historial.unshift(nuevaCotizacion);
        }
        Alert.alert('Actualizada', 'La cotización se ha actualizado en tu historial.');
      } else {
        historial.unshift(nuevaCotizacion);
        setEditId(nuevaCotizacion.id); 
        Alert.alert('Guardada', 'La cotización se ha guardado en tu historial.');
      }
      
      await AsyncStorage.setItem('@historial_cotizaciones', JSON.stringify(historial));
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la cotización');
    }
  };

  const exportarPDF = async () => {
    if (!resultado) {
      Alert.alert('Error', 'Primero calcula la cotización');
      return;
    }

    try {
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
                    <p class="fecha" style="margin: 5px 0 0 0;">Fecha: <strong>${new Date().toLocaleDateString('es-MX')}</strong></p>
                  </td>
                </tr>
              </table>
            </div>

            <div class="client-box">
              <h3>Datos del Cliente</h3>
              <p style="margin: 0;"><strong>Nombre:</strong> ${clienteInfo.nombre || 'No especificado'}</p>
              <p style="margin: 5px 0 0 0;"><strong>Domicilio:</strong> ${clienteInfo.domicilio || 'No especificado'}</p>
              <p style="margin: 5px 0 0 0;"><strong>No. de Medidor:</strong> ${clienteInfo.medidor || 'No especificado'}</p>
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
                    <td class="text-center">${cotizacion.numPaneles} pzas</td>
                    <td class="text-right">$${cotizacion.precioPanel.toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoPanel).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Inversor de Corriente</td>
                    <td class="text-center">1 pza</td>
                    <td class="text-right">$${cotizacion.precioInversor.toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoInversor).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Cableado Fotovoltaico</td>
                    <td class="text-center">${cotizacion.metrosCable} mts</td>
                    <td class="text-right">$${cotizacion.precioCable.toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoCable).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Estructura de Montaje</td>
                    <td class="text-center">1 lote</td>
                    <td class="text-right">$${cotizacion.precioEstructura.toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoEstructura).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Protecciones Eléctricas</td>
                    <td class="text-center">1 lote</td>
                    <td class="text-right">$${cotizacion.protecciones.toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoProtecciones).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Gestión y Trámites CFE</td>
                    <td class="text-center">1 serv</td>
                    <td class="text-right">$${cotizacion.tramites.toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoTramites).toLocaleString()}</td>
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartir Propuesta' });
      } else {
        Alert.alert('Éxito', 'PDF generado correctamente.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo generar el documento PDF.');
    }
  };

  return (
    <>
      {!isPremium ? (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={64} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' }}>Cotizador Premium</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Desbloquea el cotizador profesional para crear presupuestos personalizados con ganancia automática y exportación a PDF.
            </Text>
            <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 }} onPress={() => router.push('/paywall')}>
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Desbloquear Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>
              {editId ? 'Editando Cotización' : 'Nueva Cotización'}
            </Text>
            {editId && (
              <TouchableOpacity onPress={() => setEditId(null)}>
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Datos del Cliente */}
          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="person-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Datos del Cliente</Text>
            </View>
            <InputField theme={theme} label="Nombre Completo" value={clienteInfo.nombre} onChange={(v: string) => setClienteInfo({ ...clienteInfo, nombre: v })} placeholder="Juan Pérez" />
            <InputField theme={theme} label="Domicilio" value={clienteInfo.domicilio} onChange={(v: string) => setClienteInfo({ ...clienteInfo, domicilio: v })} placeholder="Calle Falsa 123" />
            <InputField theme={theme} label="No. de Medidor" value={clienteInfo.medidor} onChange={(v: string) => setClienteInfo({ ...clienteInfo, medidor: v })} placeholder="A12345678" />
          </View>

          {/* Sistema */}
          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="calculator-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Sistema y Eléctrica</Text>
            </View>
            <InputField theme={theme} label="Tarifa Eléctrica Asumida" value={tarifaElectricia} onChange={setTarifaElectricia} placeholder="3.8" unit="MXN/kWh" />
            <InputField theme={theme} label="Potencia del Sistema" value={cotizacion.potenciaKWp.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, potenciaKWp: parseFloat(v) || 0 })} placeholder="5" unit="kWp" />
          </View>

          {/* Componentes */}
          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="hardware-chip-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Componentes</Text>
            </View>
            
            <InputField theme={theme} label="Cantidad de Paneles" value={cotizacion.numPaneles.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, numPaneles: parseInt(v) || 0 })} placeholder="10" unit="pzas" />
            <InputField theme={theme} label="Precio Unitario por Panel" value={cotizacion.precioPanel.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioPanel: parseFloat(v) || 0 })} placeholder="2500" unit="MXN/pza" />
            
            <InputField theme={theme} label="Precio Inversor Completo" value={cotizacion.precioInversor.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioInversor: parseFloat(v) || 0 })} placeholder="15000" unit="MXN" />
            
            <InputField theme={theme} label="Metros de Cable" value={cotizacion.metrosCable.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, metrosCable: parseFloat(v) || 0 })} placeholder="50" unit="mts" />
            <InputField theme={theme} label="Precio de Cable por Metro" value={cotizacion.precioCable.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioCable: parseFloat(v) || 0 })} placeholder="25" unit="MXN/mt" />
            
            <InputField theme={theme} label="Costo de Estructura" value={cotizacion.precioEstructura.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioEstructura: parseFloat(v) || 0 })} placeholder="3000" unit="MXN" />
            <InputField theme={theme} label="Costo de Protecciones" value={cotizacion.protecciones.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, protecciones: parseFloat(v) || 0 })} placeholder="2000" unit="MXN" />
            <InputField theme={theme} label="Costo Trámites CFE" value={cotizacion.tramites.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, tramites: parseFloat(v) || 0 })} placeholder="1500" unit="MXN" />
          </View>

          {/* Ganancia */}
          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="trending-up-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Utilidad</Text>
            </View>
            <InputField theme={theme} label="Margen de Ganancia" value={cotizacion.gananciaPercent.toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, gananciaPercent: parseFloat(v) || 0 })} placeholder="20" unit="%" />
          </View>

          {/* Botones */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center' }} onPress={calcularCotizacion}>
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Calcular</Text>
            </TouchableOpacity>

            {resultado && (
              <>
                <TouchableOpacity style={{ flex: 1, backgroundColor: theme.card, padding: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }} onPress={guardarCotizacion}>
                  <Ionicons name="save-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>{editId ? 'Actualizar' : 'Guardar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={exportarPDF}>
                  <Ionicons name="document-text-outline" size={20} color="#000" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ==================================================== */}
          {/* RESULTADOS ORIGINALES RESTAURADOS EN LA INTERFAZ UI  */}
          {/* ==================================================== */}
          {resultado && (
            <View>
              {/* Desglose de Costos */}
              <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Desglose de Costos</Text>
                <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.textSecondary }}>Paneles ({cotizacion.numPaneles} pzas)</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoPanel)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.textSecondary }}>Inversor</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.costoInversor)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.textSecondary }}>Cable ({cotizacion.metrosCable} mts)</Text>
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
                      <Text style={{ color: theme.text, fontWeight: '600' }}>Subtotal Equipos</Text>
                      <Text style={{ color: theme.text, fontWeight: '700' }}>{formatMXN(resultado.subtotal)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: theme.primary, fontWeight: '600' }}>Ganancia ({cotizacion.gananciaPercent}%)</Text>
                      <Text style={{ color: theme.primary, fontWeight: '700' }}>{formatMXN(resultado.ganancia)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.primary + '15', padding: 10, borderRadius: 6 }}>
                      <Text style={{ color: theme.primary, fontWeight: '700' }}>PRECIO FINAL</Text>
                      <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>{formatMXN(resultado.precioFinal)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ROI Estimado */}
              <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Análisis ROI Estimado</Text>
                <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.textSecondary }}>Ahorro Mensual</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.ahorroMensual)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: theme.textSecondary }}>Ahorro Anual</Text>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>{formatMXN(resultado.ahorroAnual)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.primary + '15', padding: 10, borderRadius: 6 }}>
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>Tiempo de Recuperación</Text>
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>{resultado.tiempoRecuperacion.toFixed(1)} años</Text>
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