import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { usePremium } from '../../context/PremiumContext';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const InputField = ({ label, value, onChange, placeholder, theme, keyboardType = 'default' }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4, fontWeight: '500' }}>{label}</Text>
    <TextInput
      style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text }}
      placeholder={placeholder} placeholderTextColor={theme.textSecondary} keyboardType={keyboardType} value={value} onChangeText={onChange}
    />
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [perfil, setPerfil] = useState({
    nombre: '',
    telefono: '',
    email: '',
    logo: ''
  });

  useEffect(() => {
    if (isPremium) cargarPerfil();
  }, [isPremium]);

  const cargarPerfil = async () => {
    try {
      const guardado = await AsyncStorage.getItem('@empresa_perfil');
      if (guardado) setPerfil(JSON.parse(guardado));
    } catch (e) { console.error(e); }
  };

  const seleccionarLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9], // Aspecto rectangular tipo logo
      quality: 0.5,
      base64: true, // Necesario para inyectarlo en el HTML del PDF
    });

    if (!result.canceled && result.assets[0].base64) {
      const uriBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPerfil({ ...perfil, logo: uriBase64 });
    }
  };

  const guardarPerfil = async () => {
    try {
      await AsyncStorage.setItem('@empresa_perfil', JSON.stringify(perfil));
      Alert.alert('Éxito', 'Los datos de tu empresa se actualizaron. Ahora aparecerán en tus propuestas PDF.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la información.');
    }
  };

  return (
    <>
      {!isPremium ? (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="lock-closed" size={64} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' }}>Personalización Premium</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Desbloquea la capacidad de colocar el logotipo de tu empresa y tus datos de contacto en todas las propuestas generadas en PDF.
            </Text>
            <TouchableOpacity style={{ backgroundColor: theme.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 }} onPress={() => router.push('/paywall')}>
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Desbloquear Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Perfil de Empresa</Text>

          <View style={{ backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 16, borderColor: theme.border, borderWidth: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Logotipo para PDF</Text>
            
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {perfil.logo ? (
                <Image source={{ uri: perfil.logo }} style={{ width: 200, height: 100, resizeMode: 'contain', marginBottom: 10 }} />
              ) : (
                <View style={{ width: 200, height: 100, backgroundColor: theme.inputBg, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' }}>
                  <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 5 }}>Sin logo</Text>
                </View>
              )}
              <TouchableOpacity style={{ backgroundColor: theme.inputBg, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.border }} onPress={seleccionarLogo}>
                <Text style={{ color: theme.text, fontWeight: '600' }}>{perfil.logo ? 'Cambiar Logotipo' : 'Subir Logotipo'}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 15 }} />

            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 }}>Datos de Contacto</Text>
            <InputField theme={theme} label="Nombre de la Empresa" value={perfil.nombre} onChange={(v: string) => setPerfil({ ...perfil, nombre: v })} placeholder="Ej. Soluciones Solares S.A." />
            <InputField theme={theme} label="Teléfono de Contacto" value={perfil.telefono} onChange={(v: string) => setPerfil({ ...perfil, telefono: v })} placeholder="Ej. 555-123-4567" keyboardType="phone-pad" />
            <InputField theme={theme} label="Correo Electrónico" value={perfil.email} onChange={(v: string) => setPerfil({ ...perfil, email: v })} placeholder="Ej. ventas@empresa.com" keyboardType="email-address" />
          </View>

          <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 8, alignItems: 'center' }} onPress={guardarPerfil}>
            <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Guardar Configuración</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </>
  );
}