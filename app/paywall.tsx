import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePremium } from '../context/PremiumContext';

export default function PaywallScreen() {
  const router = useRouter();
  const { activarPremium } = usePremium(); // Traemos el interruptor

  const simularCompra = () => {
    activarPremium(); // Encendemos el modo Premium
    alert("¡Pago exitoso! Funciones de instalador desbloqueadas.");
    router.back(); // Regresamos a la pantalla anterior
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desbloquea el Nivel Experto</Text>
      
      <View style={styles.featuresList}>
        <Text style={styles.feature}>🚀 Conexión con API NASA POWER</Text>
        <Text style={styles.feature}>⚡ Cálculo de Protecciones CC/CA</Text>
        <Text style={styles.feature}>📜 Cumplimiento NOM-001</Text>
        <Text style={styles.feature}>🛠️ Selección de Inversores y Paneles</Text>
      </View>

      <TouchableOpacity style={styles.buyButton} onPress={simularCompra}>
        <Text style={styles.buyButtonText}>Comprar Premium - $499 MXN/año</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>Quizás más tarde</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1F2937', padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FCD34D', textAlign: 'center', marginBottom: 40 },
  featuresList: { backgroundColor: '#374151', padding: 20, borderRadius: 12, marginBottom: 40 },
  feature: { fontSize: 18, color: '#FFFFFF', marginBottom: 15 },
  buyButton: { backgroundColor: '#10B981', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  buyButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { padding: 15, alignItems: 'center' },
  cancelButtonText: { color: '#9CA3AF', fontSize: 16 }
});