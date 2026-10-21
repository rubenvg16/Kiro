import type { LevelDefinition } from '../types';
import { PATIO_LEVEL } from './PatioLevel';
import { FUTSAL_LEVEL } from './FutsalLevel';
import { HUERTO_LEVEL } from './HuertoLevel';
import { PARKOUR_LEVEL } from './ParkourLevel';
import { RELOJ_LEVEL } from './RelojLevel';

/** Orden de la campaña: cada nivel desbloquea al siguiente. */
export const LEVELS: LevelDefinition[] = [
  PATIO_LEVEL,
  FUTSAL_LEVEL,
  HUERTO_LEVEL,
  PARKOUR_LEVEL,
  RELOJ_LEVEL,
];

export { PATIO_LEVEL } from './PatioLevel';
export { FUTSAL_LEVEL } from './FutsalLevel';
export { HUERTO_LEVEL } from './HuertoLevel';
export { PARKOUR_LEVEL } from './ParkourLevel';
export { RELOJ_LEVEL } from './RelojLevel';
