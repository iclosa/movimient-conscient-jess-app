import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { Strings } from '@/i18n';
import { usePrefs } from '@/theme';
import { Space, Radii, withAlpha } from '@/theme/tokens';
import { LogoLockup, SoftShapes, Txt } from '@/ui';

export function AuthScaffold({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { palette: c } = usePrefs();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface100 }}>
      <SoftShapes>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Space.s5 }} keyboardShouldPersistTaps="handled">
              <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>
                <LogoLockup size={48} />
                <Txt variant="headline" style={{ marginTop: Space.s8 }}>{title}</Txt>
                {subtitle ? <Txt variant="bodyLarge" muted style={{ marginTop: Space.s2 }}>{subtitle}</Txt> : null}
                <View style={{ marginTop: Space.s5, gap: Space.s4 }}>{children}</View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SoftShapes>
    </View>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  const { palette: c } = usePrefs();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: Space.s2, padding: Space.s3, borderRadius: Radii.md,
        borderWidth: 1, borderColor: c.error, backgroundColor: withAlpha(c.error, 0.1),
      }}
    >
      <Ionicons name="alert-circle-outline" size={20} color={c.error} />
      <Txt variant="body" color={c.error} style={{ flex: 1 }}>{message}</Txt>
    </View>
  );
}

export const fieldError = (error: unknown, field: string): string | undefined =>
  error instanceof ApiError ? error.firstError(field) : undefined;

export function formMessage(error: unknown, s: Strings): string {
  if (error instanceof ApiError) return Object.keys(error.fieldErrors).length === 0 ? error.message : s('form_check_fields');
  return s('error_generic');
}

export const hasFieldErrors = (error: unknown) => error instanceof ApiError && Object.keys(error.fieldErrors).length > 0;
