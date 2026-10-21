import { AvatarConfig } from '../avatar/AvatarModel';

const STORAGE_KEY = 'edu_avatar_config_v1';

export class AvatarStorage {
  public static loadConfig(defaultConfig: AvatarConfig): AvatarConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('No se pudo cargar la configuración de localStorage:', e);
    }
    return defaultConfig;
  }

  public static saveConfig(config: AvatarConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }
}
