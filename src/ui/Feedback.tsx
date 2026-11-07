import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { Strings } from '@/i18n';
import { useStrings, useTheme } from '@/theme';
import { Radii, Space } from '@/theme/tokens';
import { Button } from './Button';
import { Txt } from './Text';

export function errorText(error: unknown, s: Strings): string {
  return error instanceof ApiError ? error.message : s('error_generic');
}

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}

interface FeedbackValue {
  toast: (message: string) => void;
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  message: string | null;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const c = useTheme();

  const toast = useCallback((m: string) => {
    setMessage(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3500);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })),
    [],
  );
  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm, message }), [toast, confirm, message]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastView />
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => close(false)}>
        <View style={styles.scrim}>
          <View style={[styles.dialog, { backgroundColor: c.surface100 }]} accessibilityViewIsModal>
            <Txt variant="titleMedium">{dialog?.title}</Txt>
            {dialog?.body ? <Txt variant="body" style={{ marginTop: Space.s2 }}>{dialog.body}</Txt> : null}
            <View style={styles.actions}>
              <Button variant="text" compact label={dialog?.cancelLabel ?? ''} onPress={() => close(false)} />
              <Button
                compact
                label={dialog?.confirmLabel ?? ''}
                color={dialog?.destructive ? c.error : undefined}
                onColor={dialog?.destructive ? '#FFFFFF' : undefined}
                onPress={() => close(true)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

/** Aviso breve en la parte inferior. Se pinta también dentro de las hojas (Modal). */
export function ToastView() {
  const ctx = useContext(FeedbackContext);
  const c = useTheme();
  const insets = useSafeAreaInsets();
  if (!ctx?.message) return null;
  return (
    <View pointerEvents="none" style={[styles.toastWrap, { bottom: insets.bottom + Space.s5 }]}>
      <View style={[styles.toast, { backgroundColor: c.ink }]} accessibilityLiveRegion="polite">
        <Txt variant="body" color={c.surface100}>{ctx.message}</Txt>
      </View>
    </View>
  );
}

export function useFeedback() {
  const v = useContext(FeedbackContext);
  if (!v) throw new Error('FeedbackProvider ausente');
  return v;
}

/** Atajo: pregunta de confirmación con textos de la app. */
export function useConfirm() {
  const { confirm } = useFeedback();
  return confirm;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: Space.s5 },
  dialog: { borderRadius: Radii.lg, padding: Space.s5 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: Space.s4, gap: Space.s2 },
  toastWrap: { position: 'absolute', left: Space.s4, right: Space.s4, alignItems: 'center' },
  toast: { borderRadius: Radii.md, paddingHorizontal: Space.s4, paddingVertical: Space.s3, maxWidth: 520 },
});

export { useStrings };
