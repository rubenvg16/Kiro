import type { LevelDefinition } from '../types';
import { PATIO_LEVEL } from './PatioLevel';
import { FUTSAL_LEVEL } from './FutsalLevel';
import { HUERTO_LEVEL } from './HuertoLevel';
import { PARKOUR_LEVEL } from './ParkourLevel';
import { RELOJ_LEVEL } from './RelojLevel';
import { CRYO_LAB_LEVEL } from './CryoLabLevel';
import { FOG_GALLERY_LEVEL } from './FogGalleryLevel';
import { MIRROR_HALL_LEVEL } from './MirrorHallLevel';
import { WIND_TUNNEL_LEVEL } from './WindTunnelLevel';
import { ZERO_GRAVITY_LEVEL } from './ZeroGravityLevel';
import { GRAVITY_CHAMBER_LEVEL } from './GravityChamberLevel';
import { MAGNETIC_BASTION_LEVEL } from './MagneticBastionLevel';
import { QUANTUM_MIRROR_LEVEL } from './QuantumMirrorLevel';
import { TIME_PLATFORM_LEVEL } from './TimePlatformLevel';
import { SINGULARITY_VAULT_LEVEL } from './SingularityVaultLevel';

/**
 * Orden canónico de la campaña del juego Kiro (15 niveles en 3 Tiers).
 * Tier Explorador (1-5), Tier Investigador (6-10), Tier Maestro (11-15).
 */
export const LEVELS: LevelDefinition[] = [
  // --- TIER 1: EXPLORADOR ---
  PATIO_LEVEL,
  FUTSAL_LEVEL,
  HUERTO_LEVEL,
  PARKOUR_LEVEL,
  RELOJ_LEVEL,

  // --- TIER 2: INVESTIGADOR ---
  CRYO_LAB_LEVEL,
  FOG_GALLERY_LEVEL,
  MIRROR_HALL_LEVEL,
  WIND_TUNNEL_LEVEL,
  ZERO_GRAVITY_LEVEL,

  // --- TIER 3: MAESTRO ---
  GRAVITY_CHAMBER_LEVEL,
  MAGNETIC_BASTION_LEVEL,
  QUANTUM_MIRROR_LEVEL,
  TIME_PLATFORM_LEVEL,
  SINGULARITY_VAULT_LEVEL
];

export { PATIO_LEVEL } from './PatioLevel';
export { FUTSAL_LEVEL } from './FutsalLevel';
export { HUERTO_LEVEL } from './HuertoLevel';
export { PARKOUR_LEVEL } from './ParkourLevel';
export { RELOJ_LEVEL } from './RelojLevel';
export { CRYO_LAB_LEVEL } from './CryoLabLevel';
export { FOG_GALLERY_LEVEL } from './FogGalleryLevel';
export { MIRROR_HALL_LEVEL } from './MirrorHallLevel';
export { WIND_TUNNEL_LEVEL } from './WindTunnelLevel';
export { ZERO_GRAVITY_LEVEL } from './ZeroGravityLevel';
export { GRAVITY_CHAMBER_LEVEL } from './GravityChamberLevel';
export { MAGNETIC_BASTION_LEVEL } from './MagneticBastionLevel';
export { QUANTUM_MIRROR_LEVEL } from './QuantumMirrorLevel';
export { TIME_PLATFORM_LEVEL } from './TimePlatformLevel';
export { SINGULARITY_VAULT_LEVEL } from './SingularityVaultLevel';
