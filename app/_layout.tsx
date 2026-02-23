import 'react-native-reanimated';
import "../global.css"; // 1. Siempre primero para NativeWind v4

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Captura errores lanzados por los componentes hijos
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Asegura que al recargar el modal se mantenga el botón de volver
  initialRouteName: '(tabs)',
};

// Evita que la splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Manejo de errores de carga de fuentes
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();

      // 3. Inicializamos el hardware de NFC al arrancar (TEMPORALMENTE COMENTADO)
      // NfcManager.start().catch((err) => {
      //   console.warn("NFC no disponible en este dispositivo", err);
      // });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Aquí defines tus rutas principales */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}