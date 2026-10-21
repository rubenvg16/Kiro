# Kiro — Videojuego Educativo 3D Escolar

**Kiro** es un videojuego educativo 3D en web orientado a colegios e institutos españoles (Primaria, E.S.O. y Bachillerato). Permite a los alumnos personalizar su avatar escolar en 3D, exportar fotos de perfil en alta resolución para Google Classroom y Moodle Centros, explorar el patio del instituto, interactuar con profesores y figuras históricas universales (Santiago Ramón y Cajal, Cervantes, Pitágoras), resolver enigmas curriculares y puzzles reales de matemáticas y ciencias con herramientas integradas (calculadora científica y pizarra digital de apuntes), y jugar una **campaña de 5 niveles** con objetivos de física, parkour y trabajo en equipo.

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
   - Cada elemento jugable tiene un **colisionador real** (cajas y esferas) sincronizado con su malla: nada de atravesar paredes.

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

6. **Físicas Realistas (motor propio)**:
   - Simulación de paso fijo (120 Hz) con gravedad real de 9,81 m/s², aceleración, fricción por superficie y restitución.
   - Movimiento con aceleración progresiva (no teletransporte de velocidad): 0→andar en 0,11 s y parada en 0,21 s.
   - Salto de altura variable, *coyote time* y búfer de salto de 0,12 s, subida de escalones de hasta 0,45 m y pendientes de hasta 52°.
   - Cuerpos dinámicos con masa, fricción, restitución y reposo por inactividad. El jugador los empuja con su propio cuerpo: la pelota sale disparada, la caja pesada frena al jugador y una reaparición ya no los lanza disparados.
   - Cámara en tercera persona con giro por arrastre, suavizado exponencial, acercamiento automático ante obstáculos y ninguna Posición dentro de una pared.

7. **Campaña de 5 Niveles**:
   - Objetivos con tres pilares: recoger fichas, alcanzar la meta y resolver objetivos físicos (introducir cuerpos en una portería).
   - Puntos de control, suelo de caída mortal en el parkour, estrellas por tiempo y desbloqueo progresivo de niveles.
   - Cada nivel está construido con una capa de datos pura (colisionadores) y una capa de construcción (mallas), de modo que la geometría jugable y la visible nunca se desincronizan.

8. **Progresión y Tienda de Accesorios**:
   - 8 Rangos de Maestría, monedas, álbum de reliquias y misiones del centro.
   - Las monedas tienen un destino real: tienda de accesorios (gafas 50, gorra 75, mochila 100) con compra única, equipamiento inmediato y bloqueo del accesorio mientras no esté comprado.

---

## 🎮 Cómo jugar

| Acción | Teclado y ratón | Táctil |
|---|---|---|
| Moverse | `W` `A` `S` `D` o flechas | Joystick en pantalla |
| Correr | `Shift` | Botón `#btn-touch-sprint` |
| Saltar | `Espacio` | Botón `#btn-touch-jump` |
| Girar cámara | Arrastrar con el ratón | — |
| Interactuar | `E` | Botón `#btn-interact` |
| Cambiar de modo | Pestañas superiores | Pestañas superiores |

El movimiento es **relativo a la cámara**: avanzar siempre aleja del avatar de la cámara, nunca lo acerca.

---

## 🚀 Instalación y Puesta en Marcha

### Requisitos Previos
- [Node.js](https://nodejs.org/) v18 o superior
- Gestor de paquetes npm

### Pasos
```bash
# 1. Clonar o acceder al directorio del proyecto
cd kiro

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev

# 4. Compilar para producción
npm run build
```

---

## 🗺️ Campaña de Niveles

| # | Nivel | Dificultad | Objetivo | Tiempo objetivo | Recompensa |
|---|---|---|---|---|---|
| 1 | Primer día en el patio | Fácil | 6 fichas + llegar a la meta | 60 s | 80 XP · 30 monedas |
| 2 | Fútbol sala: la portería | Media | 4 fichas + 2 cuerpos en la portería | 90 s | 120 XP · 50 monedas |
| 3 | Huerto de ciencias | Media | 6 fichas + meta en la plataforma | 110 s | 150 XP · 60 monedas |
| 4 | Parkour del porche | Difícil | 8 fichas + meta, con puntos de control | 120 s | 200 XP · 80 monedas |
| 5 | La torre del reloj | Difícil | 10 fichas + 1 cuerpo en la portería | 150 s | 260 XP · 100 monedas |

Estrellas: ★★★ por terminar en el 60 % del tiempo objetivo, ★★ dentro del tiempo objetivo, ★ por completar el nivel. El progreso (niveles desbloqueados, estrellas y mejores tiempos) se guarda en el navegador.

---

## 📦 Arquitectura del Código

```
src/
├── avatar/              # Modelo modular 3D del avatar y servicio de instantáneas PNG
├── core/                # SceneManager, iluminación, cámara, render loop y motor de físicas
│   └── physics/         # PhysicsWorld (paso fijo), CharacterController y comprobaciones
├── curriculum/          # Banco de datos LOMLOE y servicio de cursos escolares
├── gamification/        # Progreso, rangos, monedas, tienda, campaña y puente Classroom/Moodle
├── levels/              # Campaña: tipos, constructor de niveles y gestor de objetivos
│   └── levels/          # Definición de los 5 niveles (Patio, Fútbol sala, Huerto, Parkour, Torre)
├── puzzles/             # Motor de enigmas interactivos (Balanza, Cifrado César, Sinapsis)
├── storage/             # Persistencia local en el navegador
├── tools/               # Calculadora científica y pizarra digital interactiva
├── world/               # Entorno del IES, colisionadores, controlador de jugador, NPCs y reliquias
├── main.ts              # Punto de entrada y orquestador del ciclo de vida
└── style.css            # Estilos modernos y responsive adaptados a tablets y pizarras digitales
```

**Separación de responsabilidades clave**: `src/world/WorldColliders.ts` contiene los datos puros de los colisionadores del instituto; `WorldEnvironment.ts` importa esas constantes para construir las mallas. Un único cambio de posición afecta a lo visible y a lo colisionable.

---

## ✅ Verificación

El motor de físicas incluye un banco de pruebas *headless* (sin navegador ni dependencias adicionales) que se ejecuta con Node 18+:

```bash
node --experimental-strip-types src/core/physics/sanity.ts
```

Son **40 comprobaciones deterministas**: altura y corte del salto, frenada, subida de escalones, ausencia de túnel en muros de 16 cm, contactos con cuerpos dinámicos (dirección, masa, velocidad y reacción sobre el jugador), reposo y despertar de los cuerpos, paridad de la simulación a 20 y 60 fps, y seguridad de la cámara frente a la geometría.

La compilación de producción ejecuta además el comprobador de tipos en modo estricto:

```bash
npm run build   # tsc --strict && vite build
```

---

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.
