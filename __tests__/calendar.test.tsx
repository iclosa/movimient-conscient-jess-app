import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { MonthCalendar } from '@/features/reservar/MonthCalendar';
import { PrefsProvider } from '@/theme';

test('el calendario mensual se renderiza con clases, días vacíos y selección', async () => {
  const month = new Date(2026, 10, 1);
  const session: any = {
    id: 1, title: 'Hatha', startsAt: new Date(2026, 10, 12, 18), endsAt: new Date(2026, 10, 12, 19), isPast: false, capacity: 10,
    spotsLeft: 3, state: 'open', priceCents: null, activity: { color: '#2BB5AE' }, instructor: null, room: null, myBookings: [{ id: 9 }],
  };
  const onSelect = jest.fn();
  let r: any;
  await act(async () => {
    r = TestRenderer.create(
      <PrefsProvider><MonthCalendar month={month} onMonthChange={() => {}} sessions={[session]} selected={new Date(2026, 10, 12)} onSelect={onSelect} /></PrefsProvider>,
    );
  });
  const json = JSON.stringify(r.toJSON());
  expect(json).toContain('Novembre');
  expect(json).toContain('"children":["30"]');
  const day12 = r.root.findAll((n: any) => n.props.accessibilityState?.selected === true && typeof n.props.onPress === 'function');
  expect(day12.length).toBeGreaterThan(0);
});
