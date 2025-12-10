import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  // Novos props para controlar os filtros
  onToggleFilters: () => void;
  filtersActive: boolean; // Para mudar a cor do ícone se tiver filtro selecionado
  onFocus?: () => void;
}

const THEME = {
  textDark: '#2C2C2C',
  placeholder: '#8e8e93',
  accent: '#C77D63', // Terracota
  inputBg: '#FFFFFF',
  borderColor: '#E0D6CC',
};

export default function SearchBar({ value, onChangeText, onSubmit, onToggleFilters, filtersActive, onFocus }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {/* Ícone de Lupa (Esquerda) */}
        <Ionicons name="search" size={20} color={THEME.placeholder} style={styles.searchIcon} />
        
        {/* Input (Meio - Flexível) */}
        <TextInput
          placeholder="Título, autor..."
          placeholderTextColor={THEME.placeholder}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          style={styles.input}
          onFocus={onFocus}
        />

        {/* Botão de Limpar Texto (Só aparece se tiver texto) */}
        {value.length > 0 && (
           <TouchableOpacity onPress={() => onChangeText('')} style={styles.iconBtn}>
             <Ionicons name="close-circle" size={18} color={THEME.placeholder} />
           </TouchableOpacity>
        )}

        {/* Divisor Vertical */}
        <View style={styles.divider} />

        {/* Botão de Filtros (Toggle) */}
        <TouchableOpacity onPress={onToggleFilters} style={styles.iconBtn}>
          <Ionicons 
            name={filtersActive ? "options" : "options-outline"} 
            size={22} 
            // Fica Terracota se tiver filtro ativo, senão cinza
            color={filtersActive ? THEME.accent : THEME.textDark} 
          />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 20,
    
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 16, // Mais arredondado
    borderWidth: 1,
    borderColor: THEME.borderColor,
    height: 54, // Um pouco mais alto para acomodar os botões
    paddingLeft: 12,
    paddingRight: 6,
    // Sombra
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.textDark,
    height: '100%',
  },
  iconBtn: {
    padding: 8,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  searchBtn: {
    backgroundColor: THEME.accent, // Botão Terracota
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  }
});