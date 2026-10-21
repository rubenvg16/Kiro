import * as THREE from 'three';

export class SnapshotService {
  /**
   * Genera un snapshot 2D en PNG de alta calidad enfocado en la cara del avatar
   * para usar como foto de perfil en Classroom / Moodle.
   */
  public static takeProfileSnapshot(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    originalCamera: THREE.PerspectiveCamera
  ): string {
    // 1. Guardar la configuración previa de la cámara y tamaño del renderer
    const prevPosition = originalCamera.position.clone();
    const prevQuaternion = originalCamera.quaternion.clone();
    const prevFov = originalCamera.fov;

    // 2. Colocar la cámara en primer plano (close-up para foto de carnet)
    originalCamera.position.set(0, 1.48, 1.1);
    originalCamera.lookAt(0, 1.45, 0);
    originalCamera.updateProjectionMatrix();

    // 3. Renderizar la toma de foto
    renderer.render(scene, originalCamera);

    // 4. Capturar el PNG
    const dataUrl = renderer.domElement.toDataURL('image/png');

    // 5. Restaurar la cámara a la vista del usuario (posición y orientación
    //    exactas: nada de mirar a un origen fijo, que dejaba la cámara
    //    descolocada hasta el siguiente lerp).
    originalCamera.position.copy(prevPosition);
    originalCamera.quaternion.copy(prevQuaternion);
    originalCamera.fov = prevFov;
    originalCamera.updateProjectionMatrix();
    renderer.render(scene, originalCamera);

    return dataUrl;
  }
}
