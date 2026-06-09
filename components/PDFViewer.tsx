import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

interface PDFViewerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
}

export default function PDFViewer({ uri, title, onClose }: PDFViewerProps) {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const openPDF = async () => {
    try {
      await WebBrowser.openBrowserAsync(uri);
    } catch (error) {
      console.error('Error abriendo PDF:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.border
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, flex: 1 }}>
          {title}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="document-outline" size={64} color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 20, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          {title}
        </Text>
        <Text style={{ color: theme.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
          El PDF se abrirá en tu navegador predeterminado
        </Text>
        <TouchableOpacity
          onPress={openPDF}
          style={{
            marginTop: 24,
            backgroundColor: theme.primary,
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 8
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            Abrir PDF
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
