import axios, { AxiosInstance, AxiosResponse, Method } from 'axios'
import { ray } from 'node-ray'

export class PowerSchool {
  url: string
  clientId: string
  clientSecret: string
  private token: string
  private client: AxiosInstance

  constructor(url: string, clientId: string, clientSecret: string) {
    this.url = url
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.client = axios.create({
      baseURL: url,
    })
  }

  public async makeRequest(url: string, method: Method, data: object): Promise<any> {
    if (!this.tokenSet()) {
      await this.setToken()
    }

    const res: AxiosResponse = await this.client({
      url,
      method,
      data,
      headers: {
        'Authorization': `Bearer ${this.token}`,
      }
    })
    ray(res.data)

    return res.data
  }

  public tokenSet(): boolean {
    return !!this.token
  }

  public async setToken(force: boolean = false): Promise<PowerSchool> {
    if (this.tokenSet() && !force) {
      return this
    }

    const token: string = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

    const res: AxiosResponse = await this.client.post(`/oauth/access_token`, 'grant_type=client_credentials', {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': `application/json`,
        'Authorization': `Basic ${token}`,
      }
    })
    this.token = res.data.access_token

    return this
  }
}
