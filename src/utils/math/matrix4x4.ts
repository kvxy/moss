import { Vector3 } from './vector';

export class Matrix4x4 {
  public static readonly BYTE_SIZE = 16 * 4;

  public data: Float32Array;
  public offset: number;

  /**
   * @param data Buffer or array to copy into internal data. If a buffer is supplied, it will be reused internally.
   * @param offset The matrix's data offset, in elements of a float32 array, into given buffer / array.
   */
  constructor(data?: ArrayLike<number> | ArrayBufferLike, offset: number = 0) {
    if (data) {
      if ('length' in data && data.length < 16) throw new Error('Supplied array is not at least length 16!');
      if ('byteLength' in data && data.byteLength < Matrix4x4.BYTE_SIZE) throw new Error(`Supplied buffer does not have at least ${Matrix4x4.BYTE_SIZE} bytes!`);
      this.data = new Float32Array(data);
    } else {
      this.data = new Float32Array(16);
      this.makeIdentity();
    }
    this.offset = offset;
  }

  /** Turns matrix into an identity matrix. */
  public makeIdentity() {
    this.data.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ], this.offset);
  }

  /**
   * Turns matrix into a perspective projection matrix.
   * @param fov Field of view of projection matrix.
   * @param aspect Aspect ratio of projection matrix.
   * @param near Z-near.
   * @param far Z-far.
   */
  public makePerspective(fov: number, aspect: number, near: number, far: number) {
    const fy = 1 / Math.tan(fov * 0.5),
          fx = fy / aspect,
          nf = 1 / (near - far),
          a  = (near + far) * nf,
          b  = 2 * near * far * nf;
    this.data.set([
      fx, 0,  0,  0,
      0,  fy, 0,  0,
      0,  0,  a, -1,
      0,  0,  b,  0
    ], this.offset);
  }

  /* public makeOrthogonal() {
    throw new Error('Unimplemented');
  } */

  /**
   * Translates the matrix.
   * @param x X translation.
   * @param y Y translation.
   * @param z Z translation.
   */
  public translate(x: number, y: number, z: number): void;
  /**
   * Translate the matrix.
   * @param translation The translation vector.
   */
  public translate(translation: Vector3): void;
  public translate(x: number | Vector3, y: number = 1, z: number = 1) {
    if (typeof x === 'object') {
      z = x.z;
      y = x.y;
      x = x.x;
    }
    const d = this.data,
          o = this.offset;
    d[12 + o] += x * d[0 + o] + y * d[4 + o] + z * d[8 + o];
    d[13 + o] += x * d[1 + o] + y * d[5 + o] + z * d[9 + o];
    d[14 + o] += x * d[2 + o] + y * d[6 + o] + z * d[10 + o];
    d[15 + o] += x * d[3 + o] + y * d[7 + o] + z * d[11 + o];
  }

  /**
   * Scales the matrix.
   * @param x X scale.
   * @param y Y scale.
   * @param z Z scale.
   */
  public scale(x: number, y: number, z: number): void;
  /**
   * Scales the matrix.
   * @param translation The scaling vector.
   */
  public scale(translation: Vector3): void;
  public scale(x: number | Vector3, y: number = 1, z: number = 1) {
    if (typeof x === 'object') {
      z = x.z;
      y = x.y;
      x = x.x;
    }
    const d = this.data,
          o = this.offset;
    d[0 + o] *= x;
    d[1 + o] *= x;
    d[2 + o] *= x;
    d[3 + o] *= x;
    d[4 + o] *= y;
    d[5 + o] *= y;
    d[6 + o] *= y;
    d[7 + o] *= y;
    d[8 + o] *= z;
    d[9 + o] *= z;
    d[10 + o] *= z;
    d[11 + o] *= z;
  }

  /**
   * Rotates the matrix around the X axis.
   * @param theta Angle of rotation in radians.
   */
  public rotateX(theta: number) {
    const d = this.data,
          o = this.offset,
          s = Math.sin(theta),
          c = Math.cos(theta),
          d4 = d[4 + o], d5 = d[5 + o], d6 = d[6 + o],   d7 = d[7 + o],
          d8 = d[8 + o], d9 = d[9 + o], d10 = d[10 + o], d11 = d[11 + o];
    d[4 + o]  =  c * d4 + s * d8;
    d[5 + o]  =  c * d5 + s * d9;
    d[6 + o]  =  c * d6 + s * d10;
    d[7 + o]  =  c * d7 + s * d11;
    d[8 + o]  = -s * d4 + c * d8;
    d[9 + o]  = -s * d5 + c * d9;
    d[10 + o] = -s * d6 + c * d10;
    d[11 + o] = -s * d7 + c * d11;
  }

  /**
   * Rotates the matrix around the Y axis.
   * @param theta Angle of rotation in radians.
   */
  public rotateY(theta: number) {
    const d = this.data,
          o = this.offset,
          s = Math.sin(theta),
          c = Math.cos(theta),
          d0 = d[0 + o], d1 = d[1 + o], d2 = d[2 + o],   d3 = d[3 + o],
		      d8 = d[8 + o], d9 = d[9 + o], d10 = d[10 + o], d11 = d[11 + o];
    d[0 + o]  =  c * d0 + s * d8;
    d[1 + o]  =  c * d1 + s * d9;
    d[2 + o]  =  c * d2 + s * d10;
    d[3 + o]  =  c * d3 + s * d11;
    d[8 + o]  = -s * d0 + c * d8;
    d[9 + o]  = -s * d1 + c * d9;
    d[10 + o] = -s * d2 + c * d10;
    d[11 + o] = -s * d3 + c * d11;
  }

  /**
   * Rotates the matrix around the Z axis.
   * @param theta Angle of rotation in radians.
   */
  public rotateZ(theta: number) {
    const d = this.data,
          o = this.offset,
          s = Math.sin(theta),
          c = Math.cos(theta),
          a0 = d[0 + o], a1 = d[1 + o], a2 = d[2 + o],   a3 = d[3 + o],
          d4 = d[4 + o], d5 = d[5 + o], d6 = d[6 + o],   d7 = d[7 + o];
    d[0 + o] =  c * a0 + s * d4;
    d[1 + o] =  c * a1 + s * d5;
    d[2 + o] =  c * a2 + s * d6;
    d[3 + o] =  c * a3 + s * d7;
    d[4 + o] = -s * a0 + c * d4;
    d[5 + o] = -s * a1 + c * d5;
    d[6 + o] = -s * a2 + c * d6;
    d[7 + o] = -s * a3 + c * d7;
  }

  public rotate(vector: Vector3) {
    if (vector.x !== 0) {
      this.rotateX(vector.x);
    }
    if (vector.y !== 0) {
      this.rotateY(vector.y);
    }
    if (vector.z !== 0) {
      this.rotateZ(vector.z);
    }
  }
}