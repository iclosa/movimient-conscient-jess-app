import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { Space } from '@/theme/tokens';
import { Button, Field, Txt } from '@/ui';
import { AuthScaffold, FormErrorBanner, fieldError, formMessage } from './authWidgets';

export function RegisterScreen() {
  const s = useStrings();
  const c = useTheme();
  const router = useRouter();
  const { register } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [touched, setTouched] = useState(false);

  const nameErr = touched && name.trim() === '' ? s('validation_required') : undefined;
  const emailErr = touched && !email.includes('@') ? s('validation_email') : undefined;
  const passErr = touched && password.length < 8 ? s('password_hint') : undefined;

  const submit = async () => {
    setTouched(true);
    if (name.trim() === '' || !email.includes('@') || password.length < 8) return;
    setLoading(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), marketingConsent: marketing });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold title={s('register_title')} subtitle={s('register_subtitle')}>
      {error ? <FormErrorBanner message={formMessage(error, s)} /> : null}
      <Field label={s('full_name')} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" textContentType="name" error={nameErr ?? fieldError(error, 'name')} />
      <Field label={s('email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" error={emailErr ?? fieldError(error, 'email')} />
      <Field label={s('phone_optional')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={fieldError(error, 'phone')} />
      <Field
        label={s('password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={obscure}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        helper={s('password_hint')}
        error={passErr ?? fieldError(error, 'password')}
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
      <Pressable
        onPress={() => setMarketing(!marketing)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marketing }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: Space.s3, minHeight: 48 }}
      >
        <View
          style={{
            width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: marketing ? c.violeta : c.inkMuted,
            backgroundColor: marketing ? c.violeta : 'transparent', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {marketing ? <Ionicons name="checkmark" size={16} color={c.onVioleta} /> : null}
        </View>
        <Txt variant="body" style={{ flex: 1 }}>{s('marketing_consent')}</Txt>
      </Pressable>
      <Button label={s('register_action')} onPress={submit} loading={loading} />
      <Button variant="text" label={s('register_to_login')} onPress={() => router.replace('/login')} />
    </AuthScaffold>
  );
}
