import { createAudioPlayer, AudioPlayer } from 'expo-audio';

/**
 * Campana de meditación (sonido incluido en la app). Si el dispositivo no puede
 * reproducirlo, falla en silencio: la práctica no depende del sonido.
 */
export class Bell {
  private player: AudioPlayer | null = null;

  async ring() {
    try {
      if (!this.player) this.player = createAudioPlayer(require('../../../assets/audio/campana.wav'));
      await this.player.seekTo(0);
      this.player.play();
    } catch {
      // Sin audio disponible.
    }
  }

  dispose() {
    try { this.player?.remove(); } catch { /* nada */ }
    this.player = null;
  }
}
