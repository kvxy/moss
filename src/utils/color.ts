export class Color {
  public r: number;
  public g: number;
  public b: number;
  public a: number;

  constructor(r: number = 255, g: number = 255, b: number = 255, a: number = 1.0) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}