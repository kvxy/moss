import { Color } from '../utils/color';

export type MaterialDescriptor = {
  color?: Color,
  useVertexColor?: boolean,
  alpha?: number,
};

export class Material implements MaterialDescriptor {
  public color?: Color;
  public useVertexColor: boolean = false;
  public alpha?: number;
  // public texture?: 

  constructor(descriptor: MaterialDescriptor = {}) {
    for (let key in descriptor) {
      // @ts-ignore
      this[key] = descriptor[key];
    }
  }
}