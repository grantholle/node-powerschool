import axios, { AxiosInstance, AxiosResponse, Method } from 'axios'
import { ray } from 'node-ray'
import { PowerSchoolResponse } from './PowerSchoolResponse.js'

export class PowerSchoolRequestConfig {
  endpoint: string
  method: Method
  table: string
  data: object
  id: number
  includeProjection: boolean
  pageKey: string
}

export class PowerSchool {
  url: string
  clientId: string
  clientSecret: string
  private token: string
  private client: AxiosInstance
  private requestConfig: PowerSchoolRequestConfig

  constructor(url: string, clientId: string, clientSecret: string) {
    this.url = url
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.client = axios.create({
      baseURL: url,
    })
    this.freshConfig()
  }

  public freshConfig(): this {
    this.requestConfig = new PowerSchoolRequestConfig()
    return this
  }

  public async makeRequest(url: string, method: Method, data: object): Promise<PowerSchoolResponse> {
    if (!this.tokenSet()) {
      await this.retrieveToken()
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

    this.freshConfig()
    return new PowerSchoolResponse(res.data)
  }

  public tokenSet(): boolean {
    return !!this.token
  }

  public setToken(token: string): this {
    this.token = token

    return this
  }

  public async retrieveToken(force: boolean = false): Promise<PowerSchool> {
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

    return this.setToken(res.data.access_token)
  }

  // --------------------------------------------------------------------------
  // Fluent functions
  // --------------------------------------------------------------------------

  /**
   * Sets the custom table for the request
   *
   * @param table The custom table name for which you wish to interact
   * @returns {this}
   */
  public setTable(table: string): this {
    this.requestConfig.table = table.split('/').pop()
    this.requestConfig.endpoint = table.startsWith('/')
      ? table
      : `/ws/schema/table/${table}`
    this.requestConfig.includeProjection = true
    this.requestConfig.pageKey = 'record'

    return this
  }

  /**
   * @alias setTable
   */
  public table(table: string): this {
    return this.setTable(table)
  }

  /**
   * @alias setTable
   */
  public forTable(table: string): this {
    return this.setTable(table)
  }

  /**
   * @alias setTable
   */
  public againstTable(table: string): this {
    return this.setTable(table)
  }

  /**
   * Fluently set the ID to be appended to the endpoint. The endpoint should be set first.
   *
   * @param id The id of the record you wish to query or modify
   * @returns {this}
   */
  public setId(id: number): this {
    this.requestConfig.id = id
    this.requestConfig.endpoint += `/${id}`

    return this
  }

  /**
   * @alias setId
   */
  public id(id: number): this {
    return this.setId(id)
  }

  /**
   * @alias setId
   */
  public forId(id: number): this {
    return this.setId(id)
  }
}
