import { View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { useSession } from '@/session';
import { useStrings, useTheme } from '@/theme';
import { Space } from '@/theme/tokens';
import { Button, LogoLockup, SoftShapes, Txt } from '@/ui';

export function SplashScreen() {
  const { status, restore } = useSession();
  const s = useStrings();
  const c = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface100 }}>
      <SoftShapes>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.s5 }}>
          <LogoLockup size={64} />
          <View style={{ height: Space.s6 }} />
          {status === 'offline' ? (
            <>
              <Txt variant="bodyLarge" center>{s('error_network')}</Txt>
              <Button variant="outlined" label={s('retry')} onPress={() => void restore()} style={{ marginTop: Space.s4 }} />
            </>
          ) : (
            <ActivityIndicator size="large" color={c.violeta} />
          )}
        </View>
      </SoftShapes>
    </View>
  );
}
