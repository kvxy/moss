// 16 byte id
export class ID {
  public static readonly VERSION: number = 1;

  // 4 bytes: low time
  // 4 bytes: version (1) + random sequence (3)
  // 4 bytes: random sequence
  // 4 bytes: random sequence
  private data: Uint32Array = new Uint32Array(4);

  constructor(data?: Uint32Array) {
    if (data && data?.length !== 4) throw new Error('Given ID data is not of length 4.');
    this.data = data ?? this.generate();
  }

  public generate(): Uint32Array {
    this.data[0] = Date.now() & 0xffffffff;
    this.data[1] = (ID.VERSION << 24) + (Math.floor(Math.random() * 0x00ffffff));
    this.data[2] = Math.floor(Math.random() * 0xffffffff);
    this.data[3] = Math.floor(Math.random() * 0xffffffff);
    return this.data;
  }

  public toString(): string {
    return [...this.data].map(number => number.toString(16).padStart(8, '0')).join('-');
  }
}