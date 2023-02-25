import axios, { AxiosInstance, AxiosResponse, Method } from 'axios'
import qs from 'qs'
import { ray } from 'node-ray'
import { PowerSchoolResponse } from './PowerSchoolResponse.js'

export class PowerSchoolRequestConfig {
  endpoint: string
  method: Method
  table: string
  data: object = {}
  params: object = {}
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
  private requestConfig: PowerSchoolRequestConfig = new PowerSchoolRequestConfig

  constructor(url: string, clientId: string, clientSecret: string) {
    this.url = url
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.client = axios.create({
      baseURL: url,
    })
  }

  public setConfig(config: PowerSchoolRequestConfig = new PowerSchoolRequestConfig): this {
    this.requestConfig = config

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

    this.setConfig()
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

  /**
   * Excludes the projection parameter from the request.
   * Some requests will error when present.
   *
   * @returns {this}
   */
  public excludeProjection(): this {
    this.requestConfig.includeProjection = false

    return this
  }

  /**
   * @alias excludeProjection
   */
  public withoutProjection(): this {
    return this.excludeProjection()
  }

  /**
   * Sets the endpoint for the request.
   *
   * @param endpoint The url path to which to send the request
   * @returns {this}
   */
  public setEndpoint(endpoint: string): this {
    this.requestConfig.endpoint = endpoint
    this.requestConfig.pageKey = endpoint.split('/').pop()

    return this.excludeProjection()
  }

  /**
   * @alias setEndpoint
   */
  public toEndpoint(endpoint: string): this {
    return this.setEndpoint(endpoint)
  }

  /**
   * @alias setEndpoint
   */
  public to(endpoint: string): this {
    return this.setEndpoint(endpoint)
  }

  /**
   * @alias setEndpoint
   */
  public endpoint(endpoint: string): this {
    return this.setEndpoint(endpoint)
  }

  /**
   * Sets the data that should be sent with the request.
   * For GET requests, it will set query parameters.
   * For POST and PUT/PATCH, it will be the json body.
   *
   * @param data The data to send with the request. The values will be cast as string
   * @returns {this}
   */
  public setData(data: object): this {
    this.requestConfig.data = data

    return this
  }

  /**
   * @alias setData
   */
  public withData(data: object): this {
    return this.setData(data)
  }

  /**
   * @alias setData
   */
  public with(data: object): this {
    return this.setData(data)
  }

  /**
   * Sets the url's query string parameters
   *
   * @param queryParams The query params that should be added as a query string to the request url
   * @returns {this}
   */
  public withQueryParams(queryParams: string|object): this {
    this.requestConfig.params = typeof queryParams === 'string'
      ? qs.parse(queryParams)
      : queryParams

    return this
  }

  /**
   * @alias withQueryParams
   */
  public query(queryParams: string|object): this {
    return this.withQueryParams(queryParams)
  }

  /**
   * Adds an entry to the query string.
   *
   * @param key The key of the param to set
   * @param value The value of the parameter
   * @returns {this}
   */
  public addQueryParam(key: string, value: any): this {
    this.requestConfig.params[key] = value

    return this
  }

  /**
   *
   * @param key The key of the data object to set
   * @param value The value for the key. Will be appriopriately cast as a string.
   * @returns {this}
   */
  public setDataItem(key: string, value: any): this {
    this.requestConfig.data[key] = value

    return this
  }

  /**
   * Sets the HTTP verb for the request: GET, POST, PUT, PATCH, DELETE
   *
   * @param method The HTTP verb to use for the request
   * @returns {this}
   */
  public setMethod(method: Method): this {
    this.requestConfig.method = method

    return this
  }

  /**
   * @alias setMethod
   */
  public method(method: Method): this {
    return this.setMethod(method)
  }

  /**
   * Sets the name of the PowerQuery. If request data is included,
   * the request will be sent.
   *
   * @param name The name of the PowerQuery. Can exclude endpoint prefix (/ws/schema/query)
   * @param data The data to include with the request. Including data will send the request automatically.
   * @returns {this|PowerSchoolResponse}
   */
  public setNamedQuery(name: string, data: object = {}): this|PowerSchoolResponse {
    this.setEndpoint(name.startsWith('/') ? name : `/ws/schema/query/${name}`)
    this.requestConfig.pageKey = 'record'

    if (Object.keys(data).length > 0) {
      return this
    }

    return this.setMethod('post')
  }

  /**
   * @alias setNamedQuery
   */
  public namedQuery(name: string, data: object = {}): this|PowerSchoolResponse {
    return this.setNamedQuery(name, data)
  }

  /**
   * @alias setNamedQuery
   */
  public powerQuery(name: string, data: object = {}): this|PowerSchoolResponse {
    return this.setNamedQuery(name, data)
  }

  /**
   * @alias setNamedQuery
   */
  public pq(name: string, data: object = {}): this|PowerSchoolResponse {
    return this.setNamedQuery(name, data)
  }

  /**
   * Sets the q query string paramter.
   *
   * @param expression The query expression
   * @returns {this}
   */
  public q(expression: string): this {
    return this.addQueryParam('q', expression)
  }

  /**
   * @alias q
   */
  public queryExpression(expression: string): this {
    return this.q(expression)
  }

  /**
   * Adds an ad-hoc filter expression, meant to be used for PowerQueries
   *
   * @param expression
   * @returns {this}
   */
  public adHocFilter(expression: string): this {
    return this.addQueryParam('$q', expression)
  }

  /**
   * @alias adHocFilter
   */
  public filter(expression: string): this {
    return this.adHocFilter(expression)
  }

  /**
   * Adds a value to the projection query string parameter.
   *
   * @param projection An array or string of fields to add to the projection.
   * @returns {this}
   */
  public projection(projection: string|string[]): this {
    const converted: string = typeof projection === 'string'
      ? projection
      : projection.join(',')

    return this.addQueryParam('projection', converted)
  }

  /**
   * @alias projection
   */
  public withProjection(projection: string|string[]): this {
    return this.projection(projection)
  }

  /**
   * Sets the query parameter for page.
   *
   * @param page The page number to use in the request
   * @returns {this}
   */
  public page(page: number): this {
    return this.addQueryParam('page', page)
  }

  /**
   * Casts certain data types to a way that PowerSchool
   * will accept without returning an error.
   *
   * @param data The request data that needs to be converted.
   * @returns {object}
   */
  public castValuesToString(data: object): object {
    const output = {}

    for (const key in data) {
      let value = data[key]

      if (typeof value === 'object') {
        output[key] = this.castValuesToString(value)
        continue
      }

      if (typeof value === 'boolean') {
        value = value ? '1' : '0'
      }

      if (value === null || typeof value === 'undefined') {
        value = ''
      }

      output[key] = value.toString()
    }

    return output
  }
}
