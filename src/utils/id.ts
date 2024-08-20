// 16 byte id
export class ID {
  public static readonly VERSION: number = 1;

  // 4 bytes: low time
  // 4 bytes: version (1) + random sequence (3)
  // 4 bytes: random sequence
  // 4 bytes: random sequence
  private data: Uint32Array = new Uint32Array(4);
  private str?: string;

  constructor(data?: Uint32Array) {
    if (data && data?.length !== 4) throw new Error('Given ID data is not of length 4.');
    if (data) {
      this.data = new Uint32Array(data);
    } else {
      this.data[0] = Date.now() & 0xffffffff;
      this.data[1] = (ID.VERSION << 24) + (Math.floor(Math.random() * 0x00ffffff));
      this.data[2] = Math.floor(Math.random() * 0xffffffff);
      this.data[3] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  public toString(): string {
    if (this.str === undefined) this.str = [...this.data].map(number => number.toString(16).padStart(8, '0')).join('-');;
    return this.str;
  }
}