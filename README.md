# Kiro — Videojuego Educativo 3D Escolar

**Kiro** es un videojuego educativo 3D en web orientado a colegios e institutos españoles (Primaria, E.S.O. y Bachillerato). Permite a los alumnos personalizar su avatar escolar en 3D, exportar fotos de perfil en alta resolución para Google Classroom y Moodle Centros, explorar el patio del instituto, interactuar con profesores y figuras históricas universales (Santiago Ramón y Cajal, Cervantes, Pitágoras), y resolver enigmas curriculares y puzzles reales de matemáticas y ciencias con herramientas integradas (calculadora científica y pizarra digital de apuntes).

![Three.js](https://img.shields.io/badge/Three.js-0.170.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Vite](https://img.shields.io/badge/Vite-6.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 Características Principales

1. **Editor de Avatar 3D y Exportador de Foto de Carnet**:
   - Modelado modular low-poly con animación de respiración (idle).
   - Personalización en tiempo real de tono de piel, ropa, pantalones y accesorios (gafas, gorra, mochila escolar).
   - Generador instantáneo de instantáneas 2D en PNG de alta resolución (headshot) listas para subir a Google Classroom o Moodle.

2. **Entorno 3D del Instituto Español (I.E.S.)**:
   - Edificio central en ladrillo caravista con dos plantas de aulas, porche cubierto y letrero oficial.
   - Pista polideportiva azul y roja con porterías reglamentarias de fútbol sala y balonmano.
   - Cantina escolar con toldo de recreo, huerto de ciencias con bancales de cultivo, aparcabicicletas y bancos de patio.

3. **Personajes Escolares y Figuras Históricas**:
   - **Santiago Ramón y Cajal** (Nobel 1906): Enigma de conexión de sinapsis y polarización neuronal.
   - **Miguel de Cervantes**: Códice criptográfico con rueda de descifrado César de *Don Quijote*.
   - **Pitágoras de Samos**: Desafío de la balanza algebraica interactiva con física de balanceo.
   - **Personal del Centro**: Don Manuel (Matemáticas), Doña Carmen (Lengua), Paco (Conserje) y Marcos (Compañero de clase).

4. **Herramientas de Trabajo Integradas**:
   - **Calculadora Científica Escolar**: Raíces cuadradas, potencias, constantes y operaciones completas.
   - **Pizarra Digital de Apuntes**: Cuadrícula milimetrada interactiva con lápiz, colores y borrador para hacer esquemas y cuentas a mano.

5. **Currículo Educativo Español (LOMLOE)**:
   - Selector dinámico de curso: 5º y 6º de Primaria, 1º a 4º de E.S.O., y 1º de Bachillerato.
   - Contenidos oficiales de Matemáticas, Lengua y Literatura, Ciencias Naturales, Geografía e Historia, Física y Química, y Filosofía.
   - Cuestionarios interactivos con explicaciones pedagógicas detalladas inmediatas.

6. **Físicas y Exploración**:
   - Locomoción completa con salto de física real (gravedad calculada), carrera/sprint y colisiones con edificios.
   - 4 Reliquias de Oro secretas escondidas en puntos elevados del mapa que requieren exploración y parkour.
   - 8 Rangos de Maestría y Álbum de Medallas del centro.

---

## 🚀 Instalación y Puesta en Marcha

### Requisitos Previos
- [Node.js](https://nodejs.org/) v18 o superior
- Gestor de paquetes npm

### Pasos
```bash
# 1. Clonar o acceder al directorio del proyecto
cd school-avatar-3d

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 📦 Arquitectura del Código

```
src/
├── avatar/              # Modelo modular 3D del avatar y servicio de instantáneas PNG
├── core/                # SceneManager, iluminación de estudio, cámara y render loop
├── curriculum/          # Banco de datos LOMLOE y servicio de cursos escolares
├── gamification/        # Gestor de progreso, niveles, monedas y puente con Classroom/Moodle
├── puzzles/             # Motor de enigmas interactivos (Balanza, Cifrado César, Sinapsis)
├── storage/             # Persistencia local en el navegador
├── tools/               # Calculadora científica y pizarra digital interactiva
├── world/               # Entorno del IES, controlador de jugador con físicas, NPCs y reliquias
├── main.ts              # Punto de entrada y orquestador del ciclo de vida
└── style.css            # Estilos modernos y responsive adaptados a tablets y pizarras digitales
```

---

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.
