import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { Button, Field } from '@/ui';
import { AuthScaffold, FormErrorBanner, fieldError, formMessage } from './authWidgets';

export function LoginScreen() {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [touched, setTouched] = useState(false);

  const emailInvalid = touched && !email.includes('@') ? s('validation_email') : undefined;
  const passInvalid = touched && password === '' ? s('validation_required') : undefined;

  const submit = async () => {
    setTouched(true);
    if (!email.includes('@') || password === '') return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold title={s('login_title')} subtitle={s('login_subtitle')}>
      {error ? <FormErrorBanner message={formMessage(error, s)} /> : null}
      <Field
        label={s('email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        error={emailInvalid ?? fieldError(error, 'email')}
      />
      <Field
        label={s('password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={obscure}
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={submit}
        error={passInvalid}
        right={
          <Pressable
            onPress={() => setObscure(!obscure)}
            accessibilityRole="button"
            accessibilityLabel={s(obscure ? 'show_password' : 'hide_password')}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={obscure ? 'eye-outline' : 'eye-off-outline'} size={22} color={c.inkMuted} />
          </Pressable>
        }
      />
      <Button label={s('login_action')} onPress={submit} loading={loading} />
      <Button variant="text" label={s('login_to_register')} onPress={() => router.replace('/registre')} />
    </AuthScaffold>
  );
}
