export class Key {
  /**
   * A key is represented in string as {actorId}/{fractionalId}
   */
  actorId: string;
  fractionalId: number;
  static delimiter: string = "$";

  constructor(actorId: string, fractionalId: string) {
    this.actorId = actorId;
    this.fractionalId = parseFloat(fractionalId);
  }

  lessThan(key: Key): boolean {
    if (this.fractionalId < key.fractionalId) {
      return true;
    } else if (this.fractionalId > key.fractionalId) {
      return false;
    } else if (this.fractionalId === key.fractionalId) {
      return this.actorId < key.actorId;
    }
    return false;
  }

  greaterThan(key: Key): boolean {
    if (
      this.fractionalId > key.fractionalId &&
      this.fractionalId !== key.fractionalId
    ) {
      return true;
    } else if (
      this.fractionalId < key.fractionalId &&
      this.fractionalId !== key.fractionalId
    ) {
      return false;
    } else if (this.fractionalId === key.fractionalId) {
      return this.actorId > key.actorId;
    }
    return false;
  }

  greaterThanEqualTo(key: Key): boolean {
    if (
      this.fractionalId > key.fractionalId &&
      this.fractionalId !== key.fractionalId
    ) {
      return true;
    } else if (
      this.fractionalId < key.fractionalId &&
      this.fractionalId !== key.fractionalId
    ) {
      return false;
    } else if (this.fractionalId === key.fractionalId) {
      return this.actorId >= key.actorId;
    }
    return false;
  }

  static fromString(value: string) {
    const values = value.split(Key.delimiter);

    if (values.length === 2) {
      return new Key(values[0], values[1]);
    } else if (values.length === 1) {
      return new Key(values[0], "");
    } else {
      throw new Error("Unparseable key:" + value);
    }
  }

  static generateString(actorId: string, fractionalId: number) {
    return `${actorId}${Key.delimiter}${fractionalId}`;
  }

  static generateBetween(actorId: string, startId: string, endId: string) {
    const start: number = Key.fromString(startId).fractionalId;
    const end: number = Key.fromString(endId).fractionalId;

    const fractionalId = (start + end) / 2;

    return `${actorId}${Key.delimiter}/${fractionalId}`;
  }

  static isCrdtKey(key: string) {
    return key.includes(Key.delimiter);
  }
}
