import React, { memo } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../domain/models/Book';
import { getLangCode, SOURCE_MAP } from '../services/utils';

// Constantes de Layout (Necessárias para o tamanho do card)
const { width } = Dimensions.get('window');
const ITEM_SPACING = 8; 
const SCREEN_PADDING = 16;
const ITEM_WIDTH = (width - (SCREEN_PADDING * 2) - (ITEM_SPACING * 2)) / 3;

const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

interface Props {
  book: Book;
  onPress: () => void;
  isFavorite: boolean;
}

const GridBookItem = ({ book, onPress, isFavorite }: Props) => {
    const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
    
    const langBadge = getLangCode(book.language);
    const sourceInfo = getSourceInfo(book.source);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.gridItemContainer}>
            {/* 1. CAPA + OVERLAYS */}
            <View style={styles.gridImageWrapper}>
                {book.coverUrl ? (
                    <Image 
                        source={book.coverUrl} 
                        style={styles.gridImage}
                        placeholder={blurhash}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={[styles.gridImage, styles.placeholderContainer]}>
                        <Text style={styles.placeholderText}>{book.title.substring(0, 2)}</Text>
                    </View>
                )}
                
                {/* --- OVERLAYS SOBRE A CAPA --- */}

                {/* Badge da Fonte (Canto Superior Esquerdo) */}
                <View style={[styles.badgeBase, styles.badgeTopLeft, { backgroundColor: sourceInfo.color }]}>
                    <Text style={[styles.badgeText, { color: sourceInfo.text }]}>
                        {sourceInfo.label}
                    </Text>
                </View>

                {/* Badge de Idioma (Canto Superior Direito) */}
                {langBadge && (
                    <View style={[styles.badgeBase, styles.badgeTopRight]}>
                        <Text style={[styles.badgeText, { color: '#fff' }]}>{langBadge}</Text>
                    </View>
                )}

                {/* Ícone de Favorito (Canto Inferior Direito) */}
                {isFavorite && (
                    <View style={styles.gridHeartIcon}>
                        <Ionicons name="heart" size={12} color="#E57373" />
                    </View>
                )}
            </View>

            {/* 2. INFORMAÇÕES (Apenas Texto) */}
            <View style={styles.gridInfo}>
                <Text style={styles.gridTitle} numberOfLines={2}>
                    {book.title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default memo(GridBookItem);

const styles = StyleSheet.create({
  gridItemContainer: {
      width: ITEM_WIDTH,
      height: ITEM_WIDTH * 1.75, 
  },
  
  gridImageWrapper: {
      width: '100%',
      height: ITEM_WIDTH * 1.45, 
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#F0F0F0',
      marginBottom: 6,
      position: 'relative',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
  },
  gridImage: {
      width: '100%',
      height: '100%',
  },

  // === BADGES (OVERLAY) ===
  badgeBase: {
      position: 'absolute',
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: 4,
      zIndex: 10,
  },
  badgeTopLeft: {
      top: 4,
      left: 4,
  },
  badgeTopRight: {
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.6)',
  },
  badgeText: {
      fontSize: 8,
      fontWeight: '700',
      textTransform: 'uppercase',
  },

  // Ícone de Coração
  gridHeartIcon: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: 3,
      borderRadius: 10,
      zIndex: 10,
  },

  // === TEXTOS ABAIXO ===
  gridInfo: {
      paddingHorizontal: 2,
  },
  gridTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: '#262626',
      lineHeight: 14,
  },

  // Placeholder
  placeholderContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#E0E0E0',
  },
  placeholderText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#999',
  },
});