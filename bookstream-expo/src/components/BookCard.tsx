import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../domain/models/Book';

interface Props {
  book: Book;
  onPress: () => void;
}

import { getLangCode } from '../services/utils';
import { SOURCE_MAP } from '../services/utils';

const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

function BookCard({ book, onPress }: Props) {
  const langBadge = getLangCode(book.language);
  
  // Pegamos as cores aqui
  const sourceInfo = getSourceInfo(book.source);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>Sem capa</Text>
        </View>
      )}
      
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        
        <Text style={styles.author} numberOfLines={1}>
          {book.author || 'Autor desconhecido'} 
        </Text>
        
        <View style={styles.metaContainer}>
          {book.year && (
            <Text style={styles.year}>{book.year}</Text>
          )}
          
          {/* Badge de Idioma */}
          {langBadge && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.lang}>{langBadge}</Text>
            </>
          )}
        </View>

        {/* === CORREÇÃO 2: Badge de Fonte Colorida === */}
        <View style={styles.badgesRow}>
            <View style={[styles.sourceBadge, { backgroundColor: sourceInfo.color }]}>
                <Text style={[styles.sourceText, { color: sourceInfo.text }]}>
                    {sourceInfo.label}
                </Text>
            </View>
        </View>

      </View>
    </TouchableOpacity>
  );
}

export default memo(BookCard);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF', // Garante fundo branco
  },
  cover: {
    width: 55, // Levemente ajustado
    height: 85,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 10,
    color: '#757575',
  },
  info: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'flex-start', // Alinha ao topo
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  year: {
    fontSize: 12,
    color: '#888',
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 8,
    color: '#CCC',
  },
  lang: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  // Estilos novos para o Badge da Fonte
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12, // Borda redonda estilo "chip"
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});