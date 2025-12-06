import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const THEME = {
  background: '#FAF9F6', // Creme
  textDark: '#2C2C2C',
  textLight: '#666666',
  accent: '#C77D63',      // Terracota
  white: '#FFFFFF',
};

export default function WelcomeScreen({ navigation }: any) {
  
  function handleStart() {
    navigation.replace('MainTabs');
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1000&auto=format&fit=crop' }} 
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.textGroup}>
            <Text style={styles.tagline}>SUA BIBLIOTECA DE BOLSO</Text>
            <Text style={styles.title}>BookStream</Text>
            <Text style={styles.description}>
              Descubra clássicos, explore novos mundos e organize sua leitura. 
              Tudo gratuito, tudo offline.
            </Text>
        </View>

        <TouchableOpacity 
            style={styles.button} 
            onPress={handleStart}
            activeOpacity={0.8}
        >
            <Text style={styles.buttonText}>Começar a Ler</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  
  // Imagem
  imageContainer: {
    flex: 0.6, 
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 44, 44, 0.1)', 
  },

  // Conteúdo Branco Arredondado
  contentContainer: {
    flex: 0.4, 
    backgroundColor: THEME.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, 
    padding: 30,
    justifyContent: 'space-between',
    paddingBottom: 50,
    // Sombra para destacar do fundo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  // Textos
  textGroup: {
    marginTop: 10,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: THEME.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Fonte serifada
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: THEME.textLight,
    lineHeight: 24,
  },

  // Botão
  button: {
    backgroundColor: THEME.accent,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});