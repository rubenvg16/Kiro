export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';
export type PhaseType = 'mechanical' | 'quiz';

export interface MechanicalPhaseContent {
  mechanic: 'platforming' | 'balance' | 'cipher' | 'sequence' | 'maze';
  obstacleCount: number;
  title?: string;
  description?: string;
  target?: any;
  interactiveData?: Record<string, any>;
}

export interface QuizPhaseContent {
  question: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  subject: string;
  difficulty: PuzzleDifficulty;
}

export interface PuzzlePhase {
  type: PhaseType;
  parTimeSeconds: number;
  content: MechanicalPhaseContent | QuizPhaseContent;
}

export interface HybridChallenge {
  id: string;
  title: string;
  phases: PuzzlePhase[]; // min 2 mechanical + 2 quiz, alternating
  difficulty: PuzzleDifficulty;
  parTimeSeconds: number;
  subject?: string;
  relicRewardId?: string;
  description?: string;
}

export interface PuzzleSession {
  challengeId: string;
  phaseIndex: number;
  startTime: number;
  phaseStartTime: number;
  baseScore: number;
  xpPotential: number;
  coinPotential: number;
  wrongAnswersCount: number;
  isPerfect: boolean;
  totalTimeElapsed: number;
  goldMedalAwarded: boolean;
}
