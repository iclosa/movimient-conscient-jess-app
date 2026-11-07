# Moviment Conscient by Jess · App (Expo + React Native)

App para iPhone y Android del centro de yoga de Vallirana. Todos los datos salen del backend Laravel (`/api/v1`).

## Pantallas
Resumen · Reservar · Vídeos · Perfil · Més (mindfulness, salida del sol, respiración, temporizador de meditación, diario de gratitud). Catalán por defecto, castellano como segunda lengua; claro/oscuro.

## Arrancar
```bash
npm install
cp .env.example .env     # EXPO_PUBLIC_API_BASE_URL=https://moviment-conscient-backend.ddev.site
npx expo start
```
- **Móvil real:** instala Expo Go y escanea el QR (no hace falta Xcode ni Android Studio).
- **Simulador iOS:** `i` en la terminal. **Emulador Android:** `a`; allí el backend local es `http://10.0.2.2:<puerto>`.

## Comprobaciones
```bash
npm run typecheck
npm test                                   # tests unitarios
LIVE_API_URL=http://127.0.0.1:8000 npx jest -c jest.live.config.js   # contra el backend real
```
