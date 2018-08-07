export class Key {
  /**
   * A key is represented in string as {actorId}/{fractionalId}
   */
  fractionalId: number;
  static delimiter: string = "$";

  constructor(fractionalId: string) {
    this.fractionalId = parseFloat(fractionalId);
  }

  lessThan(key: Key): boolean {
    if (this.fractionalId < key.fractionalId) {
      return true;
    } else if (this.fractionalId > key.fractionalId) {
      return false;
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
    }
    return false;
  }

  static fromString(value: string) {
    const tokens = value.split(Key.delimiter);
    if (tokens.length === 2) {
      return new Key(tokens[1]);
    }
    throw new Error("Invalid token");
  }

  static generateString(fractionalId: number) {
    return `${fractionalId}`;
  }

  static generateBetween(startId: string, endId: string): Key {
    const start: number = Key.fromString(startId).fractionalId;
    const end: number = Key.fromString(endId).fractionalId;

    const fractionalId = (start + end) / 2;

    return new Key(fractionalId.toString());
  }

  static isCrdtKey(key: string) {
    return key.includes(Key.delimiter);
  }

  isEqual(compareKey: Key): boolean {
    return this.toString() === compareKey.toString();
  }

  toString() {
    return `${Key.delimiter}${this.fractionalId}`;
  }
}
