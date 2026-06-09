import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import PDFViewer from '../components/PDFViewer';

interface Norm {
  title: string;
  description: string;
  date: string;
  pdfUrl: string;
}

export default function NormsScreen() {
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; title: string } | null>(null);
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const norms: Norm[] = [
    {
      title: 'NOM-001-SEDE-2012',
      description: 'Instalaciones eléctricas - Especificaciones de seguridad',
      date: 'Vigente',
      pdfUrl: 'https://www.gob.mx/cms/uploads/attachment/file/512096/NOM-001-SEDE-2012.pdf'
    },
    {
      title: 'NOM-024-STPS-2015',
      description: 'Sistemas de protección y dispositivos de seguridad en maquinaria',
      date: 'Vigente',
      pdfUrl: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5398848&fecha=09/09/2015'
    },
    {
      title: 'CONUEE-02',
      description: 'Eficiencia energética en sistemas fotovoltaicos',
      date: 'Vigente',
      pdfUrl: 'https://www.dof.gob.mx/nota_detalle.php?codigo=4899843&fecha=28/01/2009'
    },
    {
      title: 'NOM-008-ENER-2001',
      description: 'Eficiencia térmica de cubiertas y entrepisos',
      date: 'Vigente',
      pdfUrl: 'https://www.dof.gob.mx/nota_detalle.php?codigo=762450&fecha=27/03/2001'
    }
  ];

  if (selectedPdf) {
    return (
      <PDFViewer
        uri={selectedPdf.url}
        title={selectedPdf.title}
        onClose={() => setSelectedPdf(null)}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 20 }}>
        Normas Vigentes
      </Text>

      {norms.map((norm, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setSelectedPdf({ url: norm.pdfUrl, title: norm.title })}
          activeOpacity={0.7}
        >
          <View
            style={{
              backgroundColor: theme.card,
              padding: 16,
              borderRadius: 12,
              marginBottom: 15,
              borderColor: theme.border,
              borderWidth: 1
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={theme.primary}
                style={{ marginRight: 12, marginTop: 4 }}
              />
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>
                  {norm.title}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 18 }}>
                  {norm.description}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' }}>
                  <View
                    style={{
                      backgroundColor: theme.primary,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6
                    }}
                  >
                    <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>
                      {norm.date}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={{ justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <View
        style={{
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 12,
          marginTop: 10,
          borderColor: theme.border,
          borderWidth: 1
        }}
      >
        <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
          <Text style={{ fontWeight: '600' }}>Nota: </Text>
          Toca en cualquier norma para consultar el documento PDF. Esta información se proporciona como referencia. Verifica siempre con las autoridades competentes la normativa más reciente.
        </Text>
      </View>
    </ScrollView>
  );
}
