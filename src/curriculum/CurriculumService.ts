import { SPANISH_CURRICULUM, CourseCurriculum, QuizQuestion, ExtraChallenge } from './SpanishCurriculumData';

const COURSE_STORAGE_KEY = 'edu_selected_course_v1';

export class CurriculumService {
  private static instance: CurriculumService;
  private currentCourseId: string;
  private listeners: Array<(course: CourseCurriculum) => void> = [];

  private constructor() {
    this.currentCourseId = this.loadCourseId();
  }

  public static getInstance(): CurriculumService {
    if (!CurriculumService.instance) {
      CurriculumService.instance = new CurriculumService();
    }
    return CurriculumService.instance;
  }

  private loadCourseId(): string {
    try {
      const saved = localStorage.getItem(COURSE_STORAGE_KEY);
      if (saved && SPANISH_CURRICULUM[saved]) {
        return saved;
      }
    } catch (e) {
      console.warn('Error al cargar curso:', e);
    }
    return '2eso'; // Por defecto 2º de ESO
  }

  public getCourse(): CourseCurriculum {
    return SPANISH_CURRICULUM[this.currentCourseId] || SPANISH_CURRICULUM['2eso'];
  }

  public setCourse(courseId: string): void {
    if (SPANISH_CURRICULUM[courseId]) {
      this.currentCourseId = courseId;
      try {
        localStorage.setItem(COURSE_STORAGE_KEY, courseId);
      } catch (e) {
        console.warn('Error al guardar curso:', e);
      }
      this.notifyListeners();
    }
  }

  public getAllCourses(): Array<{ id: string; name: string; stage: string }> {
    return Object.values(SPANISH_CURRICULUM).map(c => ({
      id: c.id,
      name: c.name,
      stage: c.stage
    }));
  }

  public getQuestions(): QuizQuestion[] {
    return this.getCourse().questions;
  }

  public getChallenges(): ExtraChallenge[] {
    return this.getCourse().challenges;
  }

  public subscribe(listener: (course: CourseCurriculum) => void): () => void {
    this.listeners.push(listener);
    listener(this.getCourse());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const course = this.getCourse();
    this.listeners.forEach(l => l(course));
  }
}
