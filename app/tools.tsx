import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ToolsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  // 3 Pestañas: Inclinómetro, Brújula y Documentos (Normas/Lector)
  const [activeTab, setActiveTab] = useState<'inclinometer' | 'compass' | 'docs'>('inclinometer');
  
  // Estados para sensores
  const [tilt, setTilt] = useState(0);
  const [heading, setHeading] = useState(0);
  
  const [accelSubscription, setAccelSubscription] = useState<any>(null);
  const [magSubscription, setMagSubscription] = useState<any>(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Magnetometer.setUpdateInterval(100);

    if (activeTab === 'inclinometer') {
      iniciarInclinometro();
    } else if (activeTab === 'compass') {
      iniciarBrujula();
    } else {
      detenerSensores();
    }

    return () => detenerSensores();
  }, [activeTab]);

  const iniciarInclinometro = () => {
    detenerSensores();
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const pitch = Math.atan2(-y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
      setTilt(Math.round(pitch));
    });
    setAccelSubscription(sub);
  };

  const iniciarBrujula = () => {
    detenerSensores();
    const sub = Magnetometer.addListener(({ x, y, z }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      angle = Math.round(angle - 90);
      if (angle < 0) angle += 360;
      setHeading(Math.round(angle));
    });
    setMagSubscription(sub);
  };

  const detenerSensores = () => {
    if (accelSubscription) accelSubscription.remove();
    if (magSubscription) magSubscription.remove();
    setAccelSubscription(null);
    setMagSubscription(null);
  };

  const getDirectionText = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'Norte';
    if (deg >= 22.5 && deg < 67.5) return 'Noreste';
    if (deg >= 67.5 && deg < 112.5) return 'Este';
    if (deg >= 112.5 && deg < 157.5) return 'Sureste';
    if (deg >= 157.5 && deg < 202.5) return 'Sur (Óptimo)';
    if (deg >= 202.5 && deg < 247.5) return 'Suroeste';
    if (deg >= 247.5 && deg < 292.5) return 'Oeste';
    if (deg >= 292.5 && deg < 337.5) return 'Noroeste';
    return '';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Selector de Herramientas (3 Pestañas) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: activeTab === 'inclinometer' ? theme.primary : theme.inputBg, borderColor: theme.border }]} 
          onPress={() => setActiveTab('inclinometer')}
        >
          <Ionicons name="hardware-chip-outline" size={18} color={activeTab === 'inclinometer' ? '#000' : theme.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: activeTab === 'compass' ? theme.primary : theme.inputBg, borderColor: theme.border }]} 
          onPress={() => setActiveTab('compass')}
        >
          <Ionicons name="compass-outline" size={18} color={activeTab === 'compass' ? '#000' : theme.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, { backgroundColor: activeTab === 'docs' ? theme.primary : theme.inputBg, borderColor: theme.border }]} 
          onPress={() => setActiveTab('docs')}
        >
          <Ionicons name="document-text-outline" size={18} color={activeTab === 'docs' ? '#000' : theme.text} />
        </TouchableOpacity>
      </View>

      {/* VISTA 1: INCLINÓMETRO */}
      {activeTab === 'inclinometer' && (
        <View style={styles.toolArea}>
          <Text style={[styles.title, { color: theme.text }]}>Ángulo del Techo</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Coloca el celular plano sobre la superficie del techo apuntando hacia arriba.</Text>

          <View style={[styles.displayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.visualizerContainer}>
              <View style={[styles.referenceLine, { backgroundColor: theme.border }]} />
              <View style={[styles.tiltLine, { backgroundColor: theme.primary, transform: [{ rotate: `${-tilt}deg` }] }]} />
            </View>

            <Text style={[styles.degreeText, { color: theme.primary }]}>{Math.abs(tilt)}°</Text>
            
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                {Math.abs(tilt) < 10 ? 'Techo Plano\n(Requiere estructura angular)' : 'Techo Inclinado'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* VISTA 2: BRÚJULA */}
      {activeTab === 'compass' && (
        <View style={styles.toolArea}>
          <Text style={[styles.title, { color: theme.text }]}>Orientación Solar</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>En el hemisferio norte, los paneles deben orientarse hacia el SUR (180°).</Text>

          <View style={[styles.displayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.compassContainer}>
              <View style={[styles.compassDial, { borderColor: theme.border, transform: [{ rotate: `${-heading}deg` }] }]}>
                <Text style={[styles.compassPoint, styles.pointN, { color: theme.text }]}>N</Text>
                <Text style={[styles.compassPoint, styles.pointE, { color: theme.text }]}>E</Text>
                <Text style={[styles.compassPoint, styles.pointW, { color: theme.text }]}>O</Text>
                <Text style={[styles.compassPoint, styles.pointS, { color: theme.primary, fontWeight: '900', fontSize: 28 }]}>S</Text>
              </View>
              <Ionicons name="caret-up" size={40} color="#ef4444" style={styles.compassArrow} />
            </View>

            <Text style={[styles.degreeText, { color: theme.text, marginTop: 30 }]}>{heading}°</Text>
            <Text style={{ color: heading >= 150 && heading <= 210 ? theme.primary : theme.textSecondary, fontWeight: 'bold', fontSize: 20 }}>
              {getDirectionText(heading)}
            </Text>

            {heading >= 160 && heading <= 200 && (
              <View style={{ backgroundColor: theme.primary + '20', padding: 10, borderRadius: 8, marginTop: 15 }}>
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>✅ Orientación Perfecta</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* VISTA 3: NORMAS Y LECTOR DE RECIBOS */}
      {activeTab === 'docs' && (
        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: theme.text }]}>Normas y Recibos</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Accede a la documentación técnica y herramientas de lectura PDF.</Text>

          {/* Botón a Normativas */}
          <TouchableOpacity 
            style={[styles.docCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => router.push('/norms')}
          >
            <Ionicons name="book" size={32} color={theme.primary} />
            <View style={styles.docText}>
              <Text style={[styles.docTitle, { color: theme.text }]}>Normativas (NOM)</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Consultar NOM-001-SEDE-2012 y manuales eléctricos.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Botón a Lector de Recibos CFE (Pestaña Inicio) */}
          <TouchableOpacity 
            style={[styles.docCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => router.push('/')}
          >
            <Ionicons name="flash" size={32} color="#F59E0B" />
            <View style={styles.docText}>
              <Text style={[styles.docTitle, { color: theme.text }]}>Lector de Recibos CFE</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Ir al escáner OCR inteligente para auto-rellenar cotizaciones.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Botón a Visor PDF independiente */}
          <TouchableOpacity 
            style={[styles.docCard, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={() => router.push('/pdf-reader')}
          >
            <Ionicons name="folder-open" size={32} color="#2563EB" />
            <View style={styles.docText}>
              <Text style={[styles.docTitle, { color: theme.text }]}>Visor de PDF Local</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Abre cualquier documento o ficha técnica desde tu celular.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

        </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  toolArea: { flex: 1, alignItems: 'center', width: '100%' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  displayCard: { width: '100%', padding: 30, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  
  // Inclinómetro
  visualizerContainer: { width: width * 0.6, height: width * 0.6, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  referenceLine: { position: 'absolute', width: '100%', height: 2, borderStyle: 'dashed', borderWidth: 1 },
  tiltLine: { width: '100%', height: 6, borderRadius: 3 },
  degreeText: { fontSize: 64, fontWeight: '900', letterSpacing: -2 },

  // Brújula
  compassContainer: { width: width * 0.6, height: width * 0.6, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  compassDial: { width: '100%', height: '100%', borderRadius: 999, borderWidth: 4, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  compassPoint: { position: 'absolute', fontSize: 20, fontWeight: 'bold' },
  pointN: { top: 10 },
  pointS: { bottom: 10 },
  pointE: { right: 15 },
  pointW: { left: 15 },
  compassArrow: { position: 'absolute', top: -25 },

  // Documentos
  docCard: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  docText: { marginLeft: 15, flex: 1 },
  docTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 }
});