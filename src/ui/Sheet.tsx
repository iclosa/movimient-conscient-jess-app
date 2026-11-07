import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Radii, Space } from '@/theme/tokens';
import { ToastView } from './Feedback';

/** Hoja inferior modal (equivale a showModalBottomSheet). */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="×" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.surface100,
            borderTopLeftRadius: Radii.lg,
            borderTopRightRadius: Radii.lg,
            maxHeight: '90%',
          }}
        >
          <View style={{ alignItems: 'center', paddingVertical: Space.s3 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.line }} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: Space.s5, paddingBottom: Space.s5 + insets.bottom }}
          >
            {children}
          </ScrollView>
        </View>
        <ToastView />
      </KeyboardAvoidingView>
    </Modal>
  );
}
