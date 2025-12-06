import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  deleteAsync,
  EncodingType,
  readAsStringAsync,
  StorageAccessFramework,
  writeAsStringAsync
} from 'expo-file-system/legacy';

const FOLDER_KEY = 'USER_BOOKS_FOLDER_URI';

export const storageService = {
    checkForDuplicate: async (filename: string) => {
        const folderUri = await storageService.getSavedFolder();
        if (!folderUri) return false;

        try {
        const files = await StorageAccessFramework.readDirectoryAsync(folderUri);
        
        return files.some(uri => {
            const decodedUri = decodeURIComponent(uri);
            return decodedUri.endsWith(`/${filename}`);
        });
        } catch (e) {
        console.error("Erro ao verificar duplicatas:", e);
        return false; 
        }
  },
  getSavedFolder: async () => {
    return await AsyncStorage.getItem(FOLDER_KEY);
  },

  selectFolder: async () => {
    try {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        await AsyncStorage.setItem(FOLDER_KEY, permissions.directoryUri);
        return permissions.directoryUri;
      }
      return null;
    } catch (e) {
      console.error("Erro ao selecionar pasta:", e);
      return null;
    }
  },

  saveToUserFolder: async (tempUri: string, filename: string, mimeType: string = 'application/pdf') => {
    const folderUri = await storageService.getSavedFolder();
    if (!folderUri) throw new Error('Pasta não definida');

    try {
      const fileString = await readAsStringAsync(tempUri, {
        encoding: EncodingType.Base64,
      });
      const newFileUri = await StorageAccessFramework.createFileAsync(
        folderUri,
        filename,
        mimeType
      );

      await writeAsStringAsync(newFileUri, fileString, {
        encoding: EncodingType.Base64,
      });

      return newFileUri; 
    } catch (e) {
      console.error("Erro ao salvar no SAF:", e);
      throw e;
    }
  },

  listFiles: async () => {
    const folderUri = await storageService.getSavedFolder();
    if (!folderUri) return [];

    try {
      return await StorageAccessFramework.readDirectoryAsync(folderUri);
    } catch (e) {
      await AsyncStorage.removeItem(FOLDER_KEY);
      return [];
    }
  },

  deleteFile: async (fileUri: string) => {
    await deleteAsync(fileUri);
  }
};