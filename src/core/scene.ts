import { Camera } from '../camera/camera';
import { PerspectiveCamera } from '../camera/perspective-camera';
import { Mesh } from '../objects/mesh';

export class Scene {
  public device?: GPUDevice;
  public meshes: Map<string, Mesh> = new Map();
  public camera: Camera = new PerspectiveCamera();

  constructor() {}

  public addMesh(mesh: Mesh) {
    this.meshes.set(mesh.id.toString(), mesh);
  }

  public setCamera(camera: Camera) {
    if (this.camera !== camera) this.camera.destroy();
    this.camera = camera;
  }
}