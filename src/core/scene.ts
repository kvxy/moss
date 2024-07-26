import { Camera } from '../camera/camera';
import { PerspectiveCamera } from '../camera/perspective-camera';
import { Mesh } from '../mesh/mesh';

export class Scene {
  public meshes: Map<string, Mesh> = new Map();
  public camera: Camera = new PerspectiveCamera();

  constructor() {}

  public addMesh(mesh: Mesh) {
    this.meshes.set(mesh.id, mesh);
  }

  public setCamera(camera: Camera) {
    if (this.camera !== camera) this.camera.destroy();
    this.camera = camera;
  }
}