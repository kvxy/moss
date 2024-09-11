import { Camera } from './camera';

export class PerspectiveCamera extends Camera {
  private fov: number = Math.PI / 2;
  private aspect: number = 1;
  private near: number = 0;
  private far: number = 1000;
  
  constructor() {
    super();
  }

  public setPerspective(descriptor: { fov?: number, aspect?: number, near?: number, far?: number } = {}) {
    this.fov = descriptor.fov ?? this.fov;
    this.aspect = descriptor.aspect ?? this.aspect;
    this.near = descriptor.near ?? this.near;
    this.far = descriptor.far ?? this.far;
    this.projectionMatrix.makePerspective(this.fov, this.aspect, this.near, this.far);
    this.updateBuffer();
  }
}