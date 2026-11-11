import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/session';

/** Datos de solo lectura del backend. Se piden de nuevo al abrir la pantalla o al invalidar. */
export const useHome = () => { const { repo } = useSession(); return useQuery({ queryKey: ['home'], queryFn: () => repo.home() }); };
export const useEvents = () => { const { repo } = useSession(); return useQuery({ queryKey: ['events'], queryFn: () => repo.events() }); };
export const useSettings = () => { const { repo } = useSession(); return useQuery({ queryKey: ['settings'], queryFn: () => repo.settings(), staleTime: 5 * 60_000 }); };
export const useActivities = () => { const { repo } = useSession(); return useQuery({ queryKey: ['activities'], queryFn: () => repo.activities() }); };
export const useSessions = (from: Date, to: Date) => {
  const { repo } = useSession();
  return useQuery({ queryKey: ['sessions', from.toDateString(), to.toDateString()], queryFn: () => repo.sessions(from, to) });
};
export const useBookings = (scope: string) => { const { repo } = useSession(); return useQuery({ queryKey: ['bookings', scope], queryFn: () => repo.bookings(scope) }); };
export const usePassCatalogue = () => { const { repo } = useSession(); return useQuery({ queryKey: ['passes'], queryFn: () => repo.passCatalogue() }); };
export const useMyPasses = () => { const { repo } = useSession(); return useQuery({ queryKey: ['my-passes'], queryFn: () => repo.myPasses() }); };
export const useStreak = () => { const { repo } = useSession(); return useQuery({ queryKey: ['streak'], queryFn: () => repo.streak() }); };
export const useVideos = () => { const { repo } = useSession(); return useQuery({ queryKey: ['videos'], queryFn: () => repo.videos() }); };
export const useVideo = (id: number) => { const { repo } = useSession(); return useQuery({ queryKey: ['video', id], queryFn: () => repo.video(id) }); };
export const useWellness = () => { const { repo } = useSession(); return useQuery({ queryKey: ['wellness'], queryFn: () => repo.wellness() }); };
export const useSun = () => { const { repo } = useSession(); return useQuery({ queryKey: ['sun'], queryFn: () => repo.sunrise(7) }); };
export const useGratitude = () => { const { repo } = useSession(); return useQuery({ queryKey: ['gratitude'], queryFn: () => repo.gratitude() }); };
export const useAnnouncements = () => { const { repo } = useSession(); return useQuery({ queryKey: ['announcements'], queryFn: () => repo.announcements() }); };

export const usePromotions = () => { const { repo } = useSession(); return useQuery({ queryKey: ['promotions'], queryFn: () => repo.promotions() }); };
