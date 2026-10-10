import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';

/**
 * On a signed-in role's root screen, Android hardware Back asks before
 * leaving the app instead of navigating anywhere (never into public screens).
 * Has no effect when there is a screen to go back to.
 */
export function useConfirmExitAtRoot() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (navigation.canGoBack()) return false;
        Alert.alert('Exit the app?', undefined, [
          { text: 'Stay', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => sub.remove();
    }, [navigation])
  );
}
