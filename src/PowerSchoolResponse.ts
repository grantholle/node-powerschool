export class PowerSchoolResponse {
  public rawData: object

  constructor(data: object) {
    this.rawData = data
  }

  *[Symbol.iterator](): IterableIterator<object> {
    for (const entry in this.rawData) {
      yield this.rawData[entry];
    }
  }
}
