import * as THREE from 'three';
import type { ZoneId } from '../core/EventBus';

export interface ZoneUnlockCondition {
  type: 'quest' | 'level' | 'item';
  referenceId: string;
  displayHint: string;
}

export interface PointOfInterest {
  id: string;
  name: string;
  worldPosition: THREE.Vector3;
  type: 'npc' | 'puzzle' | 'collectible' | 'relic' | 'minigame' | 'secret';
}

export interface ZoneDefinition {
  id: ZoneId;
  displayName: string;
  description: string;
  ambientColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  spawnPoint: THREE.Vector3;
  adjacentZones: ZoneId[];
  unlockCondition?: ZoneUnlockCondition;
  pointsOfInterest: PointOfInterest[];
  ambientSoundId: string;
  musicTrackId: string;
}

export const ZONE_DEFINITIONS: Record<ZoneId, ZoneDefinition> = {
  patio_central: {
    id: 'patio_central',
    displayName: 'Patio Central',
    description: 'El corazón del IES, punto de encuentro y recreo de todos los alumnos.',
    ambientColor: 0xffe4b5,
    fogColor: 0x93c5fd,
    fogNear: 30,
    fogFar: 95,
    spawnPoint: new THREE.Vector3(0, 0, 0),
    adjacentZones: ['biblioteca', 'pista_deportiva', 'huerto_escolar', 'pasillo_historia'],
    ambientSoundId: 'ambient_outdoor',
    musicTrackId: 'music_patio',
    pointsOfInterest: [
      { id: 'poi_conserje_paco', name: 'Paco el Conserje', worldPosition: new THREE.Vector3(-4, 0, 2), type: 'npc' },
      { id: 'poi_don_manuel', name: 'Don Manuel (Matemáticas)', worldPosition: new THREE.Vector3(6, 0, -2), type: 'npc' },
      { id: 'poi_dona_carmen', name: 'Doña Carmen (Lengua)', worldPosition: new THREE.Vector3(2, 0, 8), type: 'npc' },
      { id: 'poi_fuente_central', name: 'Fuente del Patio', worldPosition: new THREE.Vector3(0, 0, 5), type: 'collectible' },
      { id: 'poi_tablon_anuncios', name: 'Tablón de Anuncios', worldPosition: new THREE.Vector3(-8, 0, -5), type: 'secret' }
    ]
  },

  biblioteca: {
    id: 'biblioteca',
    displayName: 'Biblioteca',
    description: 'Templo del saber, estanterías infinitas y enigmas literarios.',
    ambientColor: 0xfff8dc,
    fogColor: 0x8b7355,
    fogNear: 20,
    fogFar: 65,
    spawnPoint: new THREE.Vector3(-25, 0, 10),
    adjacentZones: ['patio_central', 'pasillo_historia'],
    ambientSoundId: 'ambient_library',
    musicTrackId: 'music_biblioteca',
    pointsOfInterest: [
      { id: 'poi_cervantes', name: 'Miguel de Cervantes', worldPosition: new THREE.Vector3(-25, 0, 15), type: 'npc' },
      { id: 'poi_puzzle_cifrado', name: 'Códice Criptográfico', worldPosition: new THREE.Vector3(-28, 0, 12), type: 'puzzle' },
      { id: 'poi_pergamino_dorado', name: 'Pergamino de Cervantes', worldPosition: new THREE.Vector3(-22, 0, 18), type: 'relic' },
      { id: 'poi_typing_desk', name: 'Mesa de Mecanografía', worldPosition: new THREE.Vector3(-20, 0, 10), type: 'minigame' }
    ]
  },

  laboratorio: {
    id: 'laboratorio',
    displayName: 'Laboratorio de Ciencias',
    description: 'Microscopios, matraces e investigación neuronal de vanguardia.',
    ambientColor: 0xe0f2fe,
    fogColor: 0x0284c7,
    fogNear: 20,
    fogFar: 70,
    spawnPoint: new THREE.Vector3(30, 0, 15),
    adjacentZones: ['pasillo_historia', 'sala_informatica'],
    unlockCondition: {
      type: 'level',
      referenceId: '2',
      displayHint: 'Alcanza el Nivel 2 de Estudiante para acceder al laboratorio.'
    },
    ambientSoundId: 'ambient_lab',
    musicTrackId: 'music_laboratorio',
    pointsOfInterest: [
      { id: 'poi_ramon_cajal', name: 'Santiago Ramón y Cajal', worldPosition: new THREE.Vector3(30, 0, 20), type: 'npc' },
      { id: 'poi_puzzle_sinapsis', name: 'Conexión de Sinapsis', worldPosition: new THREE.Vector3(32, 0, 18), type: 'puzzle' },
      { id: 'poi_microscopio_oro', name: 'Microscopio de Cajal', worldPosition: new THREE.Vector3(28, 0, 22), type: 'relic' }
    ]
  },

  pista_deportiva: {
    id: 'pista_deportiva',
    displayName: 'Pista Deportiva',
    description: 'Canchas reglamentarias de fútbol sala, baloncesto y atletismo.',
    ambientColor: 0xfee2e2,
    fogColor: 0xef4444,
    fogNear: 25,
    fogFar: 85,
    spawnPoint: new THREE.Vector3(15, 0, -30),
    adjacentZones: ['patio_central'],
    ambientSoundId: 'ambient_sports',
    musicTrackId: 'music_deporte',
    pointsOfInterest: [
      { id: 'poi_marcos_companero', name: 'Marcos el Capitán', worldPosition: new THREE.Vector3(15, 0, -25), type: 'npc' },
      { id: 'poi_porteria_futsal', name: 'Portería de Futsal', worldPosition: new THREE.Vector3(15, 0, -40), type: 'minigame' },
      { id: 'poi_canasta_mate', name: 'Canasta de Baloncesto Matemático', worldPosition: new THREE.Vector3(25, 0, -30), type: 'puzzle' }
    ]
  },

  huerto_escolar: {
    id: 'huerto_escolar',
    displayName: 'Huerto Escolar',
    description: 'Bancales de cultivo biológico, compost y biodiversidad botánica.',
    ambientColor: 0xdcfce7,
    fogColor: 0x16a34a,
    fogNear: 20,
    fogFar: 75,
    spawnPoint: new THREE.Vector3(-20, 0, -25),
    adjacentZones: ['patio_central'],
    ambientSoundId: 'ambient_garden',
    musicTrackId: 'music_huerto',
    pointsOfInterest: [
      { id: 'poi_bancal_tomates', name: 'Bancal de Botánica', worldPosition: new THREE.Vector3(-22, 0, -22), type: 'collectible' },
      { id: 'poi_compostador', name: 'Compostador de Ciencias', worldPosition: new THREE.Vector3(-18, 0, -28), type: 'puzzle' },
      { id: 'poi_relic_semilla', name: 'Semilla Ancestral', worldPosition: new THREE.Vector3(-24, 0, -30), type: 'relic' }
    ]
  },

  sala_informatica: {
    id: 'sala_informatica',
    displayName: 'Sala de Informática',
    description: 'Terminales de programación, lógica computacional y algoritmos.',
    ambientColor: 0xf1f5f9,
    fogColor: 0x334155,
    fogNear: 15,
    fogFar: 60,
    spawnPoint: new THREE.Vector3(20, 0, 35),
    adjacentZones: ['laboratorio', 'pasillo_historia'],
    unlockCondition: {
      type: 'level',
      referenceId: '3',
      displayHint: 'Alcanza el Nivel 3 de Estudiante para desbloquear el aula de informática.'
    },
    ambientSoundId: 'ambient_computers',
    musicTrackId: 'music_informatica',
    pointsOfInterest: [
      { id: 'poi_terminal_ada', name: 'Terminal Ada Lovelace', worldPosition: new THREE.Vector3(22, 0, 36), type: 'puzzle' },
      { id: 'poi_laberinto_minigame', name: 'Simulador de Algoritmos', worldPosition: new THREE.Vector3(18, 0, 38), type: 'minigame' }
    ]
  },

  pasillo_historia: {
    id: 'pasillo_historia',
    displayName: 'Pasillo de Historia',
    description: 'Galería conmemorativa con bustos y mosaicos de civilizaciones antiguas.',
    ambientColor: 0xfef3c7,
    fogColor: 0xd97706,
    fogNear: 25,
    fogFar: 80,
    spawnPoint: new THREE.Vector3(0, 0, 20),
    adjacentZones: ['patio_central', 'biblioteca', 'laboratorio', 'sala_informatica', 'tejado_secreto'],
    ambientSoundId: 'ambient_corridor',
    musicTrackId: 'music_historia',
    pointsOfInterest: [
      { id: 'poi_pitagoras', name: 'Pitágoras de Samos', worldPosition: new THREE.Vector3(2, 0, 25), type: 'npc' },
      { id: 'poi_balanza_algebra', name: 'Balanza de Ecuaciones', worldPosition: new THREE.Vector3(-2, 0, 25), type: 'puzzle' },
      { id: 'poi_mosaico_romano', name: 'Mosaico de Hispania', worldPosition: new THREE.Vector3(0, 0, 30), type: 'collectible' }
    ]
  },

  tejado_secreto: {
    id: 'tejado_secreto',
    displayName: 'Tejado Secreto',
    description: 'Vista panorámica de todo el instituto, reservada para grandes exploradores.',
    ambientColor: 0xede9fe,
    fogColor: 0x7c3aed,
    fogNear: 35,
    fogFar: 120,
    spawnPoint: new THREE.Vector3(0, 15, 0),
    adjacentZones: ['pasillo_historia'],
    unlockCondition: {
      type: 'quest',
      referenceId: 'main_quest_10',
      displayHint: 'Completa el capítulo 10 del Gran Certamen para subir al tejado.'
    },
    ambientSoundId: 'ambient_wind',
    musicTrackId: 'music_tejado',
    pointsOfInterest: [
      { id: 'poi_telescopio', name: 'Telescopio de Astronomía', worldPosition: new THREE.Vector3(0, 15, 5), type: 'secret' },
      { id: 'poi_relic_corona', name: 'Corona del Saber', worldPosition: new THREE.Vector3(0, 15, -5), type: 'relic' }
    ]
  }
};
