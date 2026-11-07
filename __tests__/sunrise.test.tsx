import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { parseSunInfo } from '@/api/models';
import { Content } from '@/features/mes/SunriseScreen';
import { createStrings } from '@/i18n';
import { PrefsProvider } from '@/theme';

const days = [0, 1, 2].map((i) => ({
  date: `2026-11-0${7 + i}`, first_light: `2026-11-0${7 + i}T07:02:03+01:00`, sunrise: `2026-11-0${7 + i}T07:31:04+01:00`,
  solar_noon: `2026-11-0${7 + i}T12:36:00+01:00`, sunset: `2026-11-0${7 + i}T17:40:56+01:00`, last_light: `2026-11-0${7 + i}T18:09:57+01:00`, daylight_minutes: 609,
}));

test('Content de salida del sol se renderiza de noche y de día', () => {
  const info = parseSunInfo({ location: 'Vallirana', latitude: 41.3, longitude: 1.9, timezone: 'Europe/Madrid', days });
  const item: any = { id: 1, type: 'sunrise', title: 'Sortida del sol', description: 'x', config: {} };
  for (const now of [new Date(2026, 10, 7, 22, 19), new Date(2026, 10, 7, 12, 0)]) {
    let r: any;
    act(() => { r = TestRenderer.create(<PrefsProvider><Content item={item} info={info} now={now} s={createStrings('ca')} /></PrefsProvider>); });
    expect(JSON.stringify(r.toJSON())).toContain('Pròxima sortida del sol');
  }
});
