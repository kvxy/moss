import { Camera } from '../camera/camera';
import { PerspectiveCamera } from '../camera/perspective-camera';
import { Mesh } from '../objects/mesh';
import { Object3D } from '../objects/object3d';

export class Scene {
  public static readonly bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'Scene Bind Group Layout',
    entries: [{
      binding: 0, // camera matrices
      visibility: GPUShaderStage.VERTEX,
      buffer: {}
    }]
  };

  public device?: GPUDevice;
  public bindGroup?: GPUBindGroup;

  public objects: Map<string, Object3D> = new Map();
  public meshes: Set<Mesh> = new Set();

  public camera: Camera = new PerspectiveCamera();

  constructor() {  }

  public addObject(object: Object3D) {
    this.objects.set(object.id.toString(), object);
    if (object instanceof Mesh) {
      this.meshes.add(object);
    }
  }

  public deleteObject(object: Object3D) {
    const id = object.id.toString();
    if (!this.objects.has(id)) return console.warn(`Object ${object.label} is not in the scene.`);
    this.objects.delete(id);
    if (object instanceof Mesh) {
      this.meshes.delete(object);
    }
  }

  public setCamera(camera: Camera) {
    if (this.camera !== camera) this.camera.destroy();
    this.camera = camera;
  }

  /** 
   * Sets the device of geometry, done automatically on render.
   * @param device The GPUDevice to bind. */
  public bindDevice(device: GPUDevice) {
    if (this.device !== undefined && this.device !== device) throw new Error('GPUDevice already binded.');
    this.device = device;
  }

  /**
   * Creates a new bind group for this scene.
   * @returns The created bind group;
   */
  public createBindGroup(): GPUBindGroup {
    const device = this.device;
    if (!device) throw new Error(`Scene has no GPUDevice binded.`);

    this.bindGroup = device.createBindGroup({
      label: 'Rasterizer Bind Group',
      layout: device.createBindGroupLayout(Scene.bindGroupLayoutDescriptor),
      entries: [{
        binding: 0,
        resource: { buffer: this.camera.createBuffer(device) }
      }]
    });
    return this.bindGroup;
  }
}