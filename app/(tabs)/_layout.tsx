import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useStrings, useTheme } from '@/theme';
import { fonts } from '@/theme/tokens';

type Icon = keyof typeof Ionicons.glyphMap;

const tab = (name: string, key: string, off: Icon, on: Icon) => ({ name, key, off, on });
const TABS = [
  tab('resum', 'tab_resum', 'home-outline', 'home'),
  tab('reservar', 'tab_reservar', 'calendar-outline', 'calendar'),
  tab('videos', 'tab_videos', 'play-circle-outline', 'play-circle'),
  tab('perfil', 'tab_perfil', 'person-outline', 'person'),
  tab('mes', 'tab_mes', 'ellipsis-horizontal', 'ellipsis-horizontal-circle'),
];

export default function TabsLayout() {
  const s = useStrings();
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.violeta,
        tabBarInactiveTintColor: c.inkMuted,
        tabBarStyle: { backgroundColor: c.surface200, borderTopColor: c.line },
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 12 },
        sceneStyle: { backgroundColor: c.surface100 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: s(t.key),
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? t.on : t.off} size={size} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
