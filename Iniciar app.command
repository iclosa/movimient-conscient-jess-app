#!/bin/bash
# Doble clic para arrancar la app: instala dependencias si hace falta y abre Expo.
cd "$(dirname "$0")" || exit 1
if [ ! -d node_modules ] || [ package.json -nt node_modules/.package-lock.json ]; then
  echo "Instal·lant dependències..."
  npm install || { echo "Ha fallat npm install"; read -n 1 -s -r -p "Prem una tecla per tancar"; exit 1; }
fi
echo "Arrencant Expo (escaneja el QR amb Expo Go)..."
npx expo start -c
