export class PowerSchool {
  url: string
  clientId: string
  clientSecret: string

  constructor(url: string, clientId: string, clientSecret: string) {
    this.url = url
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  protected getToken() {

  }
}
