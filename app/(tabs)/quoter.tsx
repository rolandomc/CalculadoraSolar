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

const InputField = ({ label, value, onChange, placeholder, unit = '', theme }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, fontWeight: '500' }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        style={{ flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text }}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={unit === '' ? "default" : "decimal-pad"}
        value={value}
        onChangeText={onChange}
      />
      {unit !== '' && <Text style={{ marginLeft: 8, color: theme.textSecondary, fontWeight: '600', minWidth: 40 }}>{unit}</Text>}
    </View>
  </View>
);

export default function CotizadorScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [editId, setEditId] = useState<string | null>(null);

  const [clienteInfo, setClienteInfo] = useState({ nombre: '', domicilio: '', medidor: '' });
  
  // Estados para los equipos seleccionados desde el catálogo
  const [panelSeleccionado, setPanelSeleccionado] = useState<{nombre: string, pMax: number} | null>(null);
  const [inversorSeleccionado, setInversorSeleccionado] = useState<{nombre: string} | null>(null);

  const [cotizacion, setCotizacion] = useState({
    potenciaKWp: 5, numPaneles: 10, precioPanel: 2500, precioInversor: 15000,
    metrosCable: 50, precioCable: 25, precioEstructura: 3000,
    protecciones: 2000, tramites: 1500, gananciaPercent: 20,
  });

  const [resultado, setResultado] = useState<any>(null);
  const [tarifaElectricia, setTarifaElectricia] = useState('3.8');

  useFocusEffect(
    useCallback(() => {
      const cargarDatosExternos = async () => {
        try {
          // 1. Carga desde OCR
          const scanned = await AsyncStorage.getItem('@scanned_cfe');
          if (scanned) {
            const data = JSON.parse(scanned);
            setClienteInfo({ nombre: data.nombre || '', domicilio: data.domicilio || '', medidor: data.medidor || '' });
            if (data.tarifa) setTarifaElectricia(data.tarifa);
            await AsyncStorage.removeItem('@scanned_cfe');
          }

          // 2. Carga desde Edición
          const editData = await AsyncStorage.getItem('@cotizacion_editar');
          if (editData) {
            const item = JSON.parse(editData);
            setEditId(item.id);
            setClienteInfo(item.clienteInfo || { nombre: '', domicilio: '', medidor: '' });
            setCotizacion(item.cotizacion);
            setTarifaElectricia(item.tarifaElectricia.toString());
            setResultado(item.resultado);
            setPanelSeleccionado(item.panelSeleccionado || null);
            setInversorSeleccionado(item.inversorSeleccionado || null);
            await AsyncStorage.removeItem('@cotizacion_editar');
          }

          // 3. Carga desde Catálogo
          const seleccionCat = await AsyncStorage.getItem('@seleccion_cotizador');
          if (seleccionCat) {
            const { tipo, item } = JSON.parse(seleccionCat);
            if (tipo === 'paneles') {
              setPanelSeleccionado({ nombre: item.nombre, pMax: item.pMax });
              // Auto-calcula la potencia en base a los paneles actuales y el nuevo equipo
              setCotizacion(prev => ({ ...prev, potenciaKWp: (prev.numPaneles * item.pMax) / 1000 }));
            } else if (tipo === 'inversores') {
              setInversorSeleccionado({ nombre: item.nombre });
            }
            await AsyncStorage.removeItem('@seleccion_cotizador');
          }

        } catch (e) {
          console.error("Error cargando datos", e);
        }
      };
      cargarDatosExternos();
    }, [])
  );

  const formatMXN = (valor: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(valor);

  const calcularCotizacion = () => {
    const tarifa = parseFloat(tarifaElectricia);
    if (isNaN(tarifa) || tarifa <= 0) return Alert.alert('Error', 'Ingresa una tarifa válida');

    const costoPanel = (cotizacion.numPaneles || 0) * (cotizacion.precioPanel || 0);
    const subtotal = costoPanel + (cotizacion.precioInversor||0) + ((cotizacion.metrosCable||0) * (cotizacion.precioCable||0)) + (cotizacion.precioEstructura||0) + (cotizacion.protecciones||0) + (cotizacion.tramites||0);
    const ganancia = (subtotal * (cotizacion.gananciaPercent||0)) / 100;
    const precioFinal = subtotal + ganancia;

    const produccionMensual = (cotizacion.potenciaKWp||0) * 5 * 30; 
    const ahorroAnual = (produccionMensual * tarifa) * 12;

    setResultado({
      costoPanel, costoInversor: cotizacion.precioInversor, costoCable: cotizacion.metrosCable * cotizacion.precioCable, 
      costoEstructura: cotizacion.precioEstructura, costoProtecciones: cotizacion.protecciones, costoTramites: cotizacion.tramites,
      subtotal, ganancia, precioFinal, tarifaAsumida: tarifa, ahorroMensual: produccionMensual * tarifa, ahorroAnual, 
      tiempoRecuperacion: precioFinal / ahorroAnual,
    });
  };

  const guardarCotizacion = async () => {
    if (!resultado) return Alert.alert('Error', 'Primero calcula');
    try {
      const nueva = {
        id: editId || Date.now().toString(),
        fecha: new Date().toLocaleDateString('es-MX'),
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        clienteInfo, cotizacion, resultado, tarifaElectricia,
        panelSeleccionado, inversorSeleccionado // Guardamos las marcas elegidas
      };
      const data = await AsyncStorage.getItem('@historial_cotizaciones');
      const historial = data ? JSON.parse(data) : [];
      if (editId) {
        const i = historial.findIndex((item: any) => item.id === editId);
        if (i !== -1) historial[i] = nueva;
      } else { historial.unshift(nueva); setEditId(nueva.id); }
      await AsyncStorage.setItem('@historial_cotizaciones', JSON.stringify(historial));
      Alert.alert('Éxito', editId ? 'Cotización actualizada' : 'Cotización guardada');
    } catch (e) { Alert.alert('Error', 'No se pudo guardar'); }
  };

  const exportarPDF = async () => {
    if (!resultado) return Alert.alert('Error', 'Calcula la cotización primero');
    try {
      let perfilEmpresa = { nombre: 'Propuesta de Sistema Fotovoltaico', telefono: '', email: '', web: '', cedula: '', logo: '' };
      const stored = await AsyncStorage.getItem('@empresa_perfil');
      if (stored) {
        const p = JSON.parse(stored);
        perfilEmpresa = { ...perfilEmpresa, ...p };
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
              .roi-val { font-size: 18px; font-weight: bold; color: #10B981; display: block; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <table style="width: 100%; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 20px; border-collapse: collapse; margin-top: 0;">
                <tr>
                  <td style="width: 40%; border: none; text-align: left; padding: 0;">
                    ${perfilEmpresa.logo ? `<img src="${perfilEmpresa.logo}" style="max-width: 200px; max-height: 90px; object-fit: contain;" />` : ''}
                  </td>
                  <td style="width: 60%; border: none; text-align: right; padding: 0;">
                    <h1 style="color: #10B981; margin: 0 0 5px 0; font-size: 24px;">${perfilEmpresa.nombre}</h1>
                    ${perfilEmpresa.telefono ? `<p style="margin: 0; color: #666; font-size: 14px;">Tel: ${perfilEmpresa.telefono}</p>` : ''}
                    ${perfilEmpresa.email ? `<p style="margin: 0; color: #666; font-size: 14px;">Email: ${perfilEmpresa.email}</p>` : ''}
                    ${perfilEmpresa.web ? `<p style="margin: 0; color: #666; font-size: 12px;">Web: ${perfilEmpresa.web}</p>` : ''}
                    ${perfilEmpresa.cedula ? `<p style="margin: 0; color: #666; font-size: 12px;">Reg. Prof: ${perfilEmpresa.cedula}</p>` : ''}
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
                  <tr><th>Concepto</th><th class="text-center">Cantidad</th><th class="text-right">Precio Unitario</th><th class="text-right">Total</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${panelSeleccionado ? `Panel Solar: ${panelSeleccionado.nombre}` : 'Módulos Solares Fotovoltaicos'}</td>
                    <td class="text-center">${cotizacion.numPaneles} pzas</td>
                    <td class="text-right">$${(cotizacion.precioPanel||0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoPanel).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>${inversorSeleccionado ? `Inversor: ${inversorSeleccionado.nombre}` : 'Inversor de Corriente'}</td>
                    <td class="text-center">1 pza</td>
                    <td class="text-right">$${(cotizacion.precioInversor||0).toLocaleString()}</td>
                    <td class="text-right">$${Math.round(resultado.costoInversor).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Cableado Fotovoltaico</td><td class="text-center">${cotizacion.metrosCable} mts</td><td class="text-right">$${(cotizacion.precioCable||0).toLocaleString()}</td><td class="text-right">$${Math.round(resultado.costoCable).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Estructura de Montaje</td><td class="text-center">1 lote</td><td class="text-right">$${(cotizacion.precioEstructura||0).toLocaleString()}</td><td class="text-right">$${Math.round(resultado.costoEstructura).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Protecciones Eléctricas</td><td class="text-center">1 lote</td><td class="text-right">$${(cotizacion.protecciones||0).toLocaleString()}</td><td class="text-right">$${Math.round(resultado.costoProtecciones).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Gestión y Trámites CFE</td><td class="text-center">1 serv</td><td class="text-right">$${(cotizacion.tramites||0).toLocaleString()}</td><td class="text-right">$${Math.round(resultado.costoTramites).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div class="summary-box">
                <div class="summary-row"><span>Subtotal Equipos:</span><span>$${Math.round(resultado.subtotal).toLocaleString()}</span></div>
                <div class="summary-row"><span>Utilidad Operativa:</span><span>$${Math.round(resultado.ganancia).toLocaleString()}</span></div>
                <div class="summary-total"><span>INVERSIÓN TOTAL:</span><span>$${Math.round(resultado.precioFinal).toLocaleString()} MXN</span></div>
              </div>
              <div class="clear"></div>
            </div>

            <div class="roi-box">
              <h2 style="margin-top:0;">Análisis de Retorno de Inversión (ROI)</h2>
              <div class="roi-grid">
                <div>Ahorro Mensual<span class="roi-val">$${Math.round(resultado.ahorroMensual).toLocaleString()}</span></div>
                <div>Ahorro Anual<span class="roi-val">$${Math.round(resultado.ahorroAnual).toLocaleString()}</span></div>
                <div>Recuperación<span class="roi-val">${resultado.tiempoRecuperacion.toFixed(1)} años</span></div>
              </div>
            </div>
            <p style="text-align:center; font-size:11px; color:#999; margin-top:40px;">* Cotización estimada sujeta a inspección física.</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartir Propuesta' });
    } catch (e) { Alert.alert('Error', 'No se pudo generar el documento PDF.'); }
  };

  return (
    <>
      {!isPremium ? (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={64} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10 }}>Cotizador Premium</Text>
            <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 }} onPress={() => router.push('/paywall')}>
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Desbloquear Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{editId ? 'Editando Cotización' : 'Nueva Cotización'}</Text>
            {editId && <TouchableOpacity onPress={() => setEditId(null)}><Text style={{ color: theme.primary, fontWeight: 'bold' }}>Limpiar</Text></TouchableOpacity>}
          </View>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}><Ionicons name="person-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} /><Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Datos del Cliente</Text></View>
            <InputField theme={theme} label="Nombre Completo" value={clienteInfo.nombre} onChange={(v: string) => setClienteInfo({ ...clienteInfo, nombre: v })} />
            <InputField theme={theme} label="Domicilio" value={clienteInfo.domicilio} onChange={(v: string) => setClienteInfo({ ...clienteInfo, domicilio: v })} />
            <InputField theme={theme} label="No. de Medidor" value={clienteInfo.medidor} onChange={(v: string) => setClienteInfo({ ...clienteInfo, medidor: v })} />
          </View>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}><Ionicons name="calculator-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} /><Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Sistema y Eléctrica</Text></View>
            <InputField theme={theme} label="Tarifa Eléctrica Asumida" value={tarifaElectricia} onChange={setTarifaElectricia} unit="MXN/kWh" />
            
            <InputField 
              theme={theme} 
              label="Potencia del Sistema" 
              value={(cotizacion.potenciaKWp || 0).toString()} 
              onChange={(v: string) => {
                const manualKwp = parseFloat(v) || 0;
                setCotizacion({ ...cotizacion, potenciaKWp: manualKwp });
                setPanelSeleccionado(null); // Si escribe manual, quitamos la etiqueta de auto-calculado
              }} 
              unit="kWp" 
            />
            
            {panelSeleccionado && (
              <Text style={{ fontSize: 12, color: theme.primary, marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={12}/> Auto-calculado: {cotizacion.numPaneles} paneles x {panelSeleccionado.pMax}W
              </Text>
            )}
          </View>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="hardware-chip-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} /><Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Componentes</Text></View>
              <TouchableOpacity onPress={() => router.push('/catalog')}>
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>+ Ver Catálogo</Text>
              </TouchableOpacity>
            </View>

            {/* Fichas visuales si hay equipos seleccionados */}
            {panelSeleccionado && (
               <View style={{ backgroundColor: theme.primary + '15', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                 <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Panel Seleccionado: {panelSeleccionado.nombre}</Text>
               </View>
            )}
            
            {inversorSeleccionado && (
               <View style={{ backgroundColor: theme.primary + '15', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                 <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>Inversor Seleccionado: {inversorSeleccionado.nombre}</Text>
               </View>
            )}

            <InputField theme={theme} label="Cantidad de Paneles" value={(cotizacion.numPaneles || 0).toString()} 
              onChange={(v: string) => {
                const num = parseInt(v) || 0;
                setCotizacion({ ...cotizacion, numPaneles: num, potenciaKWp: panelSeleccionado ? (num * panelSeleccionado.pMax) / 1000 : cotizacion.potenciaKWp });
              }} unit="pzas" />
            <InputField theme={theme} label="Precio Unitario por Panel" value={(cotizacion.precioPanel || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioPanel: parseFloat(v) || 0 })} unit="MXN/pza" />
            <InputField theme={theme} label="Precio Inversor Completo" value={(cotizacion.precioInversor || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioInversor: parseFloat(v) || 0 })} unit="MXN" />
            <InputField theme={theme} label="Metros de Cable" value={(cotizacion.metrosCable || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, metrosCable: parseFloat(v) || 0 })} unit="mts" />
            <InputField theme={theme} label="Precio de Cable por Metro" value={(cotizacion.precioCable || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioCable: parseFloat(v) || 0 })} unit="MXN/mt" />
            <InputField theme={theme} label="Costo de Estructura" value={(cotizacion.precioEstructura || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, precioEstructura: parseFloat(v) || 0 })} unit="MXN" />
            <InputField theme={theme} label="Costo de Protecciones" value={(cotizacion.protecciones || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, protecciones: parseFloat(v) || 0 })} unit="MXN" />
            <InputField theme={theme} label="Costo Trámites CFE" value={(cotizacion.tramites || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, tramites: parseFloat(v) || 0 })} unit="MXN" />
          </View>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}><Ionicons name="trending-up-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} /><Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>Utilidad</Text></View>
            <InputField theme={theme} label="Margen de Ganancia" value={(cotizacion.gananciaPercent || 0).toString()} onChange={(v: string) => setCotizacion({ ...cotizacion, gananciaPercent: parseFloat(v) || 0 })} unit="%" />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center' }} onPress={calcularCotizacion}><Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Calcular</Text></TouchableOpacity>
            {resultado && (
              <>
                <TouchableOpacity style={{ flex: 1, backgroundColor: theme.card, padding: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }} onPress={guardarCotizacion}>
                  <Ionicons name="save-outline" size={20} color={theme.text} style={{ marginRight: 8 }} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>{editId ? 'Actualizar' : 'Guardar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', padding: 16, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={exportarPDF}>
                  <Ionicons name="document-text-outline" size={20} color="#000" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {resultado && (
            <View>
              <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Desglose de Costos</Text>
                <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8 }}>
                  <View style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ color: theme.text, fontWeight: '600' }}>Subtotal Equipos</Text><Text style={{ color: theme.text, fontWeight: '700' }}>{formatMXN(resultado.subtotal)}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}><Text style={{ color: theme.primary, fontWeight: '600' }}>Ganancia ({cotizacion.gananciaPercent}%)</Text><Text style={{ color: theme.primary, fontWeight: '700' }}>{formatMXN(resultado.ganancia)}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.primary + '15', padding: 10, borderRadius: 6 }}><Text style={{ color: theme.primary, fontWeight: '700' }}>PRECIO FINAL</Text><Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>{formatMXN(resultado.precioFinal)}</Text></View>
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