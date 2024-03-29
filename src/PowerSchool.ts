import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import * as qs from 'qs'
import { PowerSchoolResponse } from './PowerSchoolResponse.js'

export class PowerSchoolRequestConfig {
  endpoint: string
  method: Method = 'get'
  table: string
  data: object = {}
  params: object = {}
  id: number
  includeProjection: boolean = false
  pageKey: string
}

export class PowerSchool {
  url: string
  clientId: string
  clientSecret: string
  private token: string
  protected client: AxiosInstance
  protected requestConfig: PowerSchoolRequestConfig = new PowerSchoolRequestConfig

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
    const endpoint: string = table.startsWith('/ws/schema/table')
      ? table
      : `/ws/schema/table/${table}`
    this.requestConfig.pageKey = 'record'

    return this.setEndpoint(endpoint)
      .includeProjection()
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

    return this.setEndpoint(this.requestConfig.endpoint + `/${id}`)
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

  public includeProjection(): this {
    this.requestConfig.includeProjection = true

    return this
  }

  /**
   * Sets the endpoint for the request.
   *
   * @param endpoint The url path to which to send the request
   * @returns {this}
   */
  public setEndpoint(endpoint: string): this {
    this.requestConfig.endpoint = this.sanitizeEndpoint(endpoint)
    const parts = endpoint.split('/')
    const tail = parts.pop()

    if (!isNaN(Number(tail))) {
      this.requestConfig.id = Number(tail)
    }

    if (this.requestConfig.endpoint.includes('/table/')) {
      this.requestConfig.table = this.requestConfig.id
        ? parts[parts.length - 2]
        : tail

      return this.includeProjection()
    }

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
   * Sets an entry on the data object
   *
   * @param key The key of the data object to set
   * @param value The value for the key. Will be appriopriately cast as a string.
   * @returns {this}
   */
  public setDataItem(key: string, value: any): this {
    this.requestConfig.data[key] = this.castValueToString(value)

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
   * @param data The data to include with the request.
   * @returns {this|PowerSchoolResponse}
   */
  public setNamedQuery(name: string, data: object = {}): this {
    const endpoint: string = name.startsWith('/ws/schema/query')
      ? name
      : `/ws/schema/query/${name}`
    this.setEndpoint(endpoint.replace(/\/{2,}/g, '/'))
    this.requestConfig.pageKey = 'record'

    if (Object.keys(data).length > 0) {
      this.setData(data)
    }

    return this.setMethod('post')
  }

  /**
   * @alias setNamedQuery
   */
  public namedQuery(name: string, data: object = {}): this {
    return this.setNamedQuery(name, data)
  }

  /**
   * @alias setNamedQuery
   */
  public powerQuery(name: string, data: object = {}): this {
    return this.setNamedQuery(name, data)
  }

  /**
   * @alias setNamedQuery
   */
  public pq(name: string, data: object = {}): this {
    return this.setNamedQuery(name, data)
  }

  /**
   * Sets the q query string paramter.
   *
   * @param expression The query expression
   * @returns {this}
   */
  public q(expression: string|string[]): this {
    const exp = Array.isArray(expression)
      ? expression.join(';')
      : expression

    return this.addQueryParam('q', exp)
  }

  /**
   * @alias q
   */
  public queryExpression(expression: string|string[]): this {
    return this.q(expression)
  }

  /**
   * Adds an ad-hoc filter expression,
   * meant to be used for PowerQueries
   *
   * @param expression
   * @returns {this}
   */
  public adHocFilter(expression: string|string[]): this {
    const exp = Array.isArray(expression)
      ? expression.join(';')
      : expression

    return this.addQueryParam('$q', exp)
  }

  /**
   * @alias adHocFilter
   */
  public filter(expression: string|string[]): this {
    return this.adHocFilter(expression)
  }

  /**
   * Adds a value to the projection query string parameter.
   *
   * @param projection An array or string of fields to add to the projection.
   * @returns {this}
   */
  public projection(projection: string|string[] = '*'): this {
    return this.addQueryParam('projection', this.castValueToString(projection))
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
   * Set the size of the results.
   *
   * @param size The size of the results that should be returned
   * @returns {this}
   */
  public pageSize(size: number): this {
    return this.addQueryParam('pagesize', size)
  }

  /**
   * Sets the sort query parameter value.
   *
   * @param columns The columns on which to sort the results
   * @param descending Whether the order should be descending
   * @returns {this}
   */
  public sort(columns: string|string[], descending: boolean = false): this {
    return this.addQueryParam('sort', this.castValueToString(columns))
      .addQueryParam('sortdescending', descending ? 'true' : 'false')
  }

  /**
   * Sets the sort query parameter value.
   *
   * @param expression The order expression
   * @returns {this}
   */
  public adHocOrder(expression: string): this {
    return this.addQueryParam('order', expression)
  }

  /**
   * @alias adHocOrder
   */
  public order(expression: string): this {
    return this.adHocOrder(expression)
  }

  /**
   * Sets the count query parameter value.
   * This will include the total number of records
   * for the query in the response
   *
   * @returns {this}
   */
  public includeCount(): this {
    return this.addQueryParam('count', 'true')
  }

  /**
   * Sets the data version and application name.
   *
   * @param version The version of the data
   * @param applicationName The application name that is checking against the version
   * @returns {this}
   */
  public dataVersion(version: number, applicationName: string): this {
    return this.setDataItem('$dataversion', version)
      .setDataItem('$dataversion_applicationname', applicationName)
  }

  /**
   * @alias dataVersion
   */
  public withDataVersion(applicationName: string, version: number): this {
    return this.dataVersion(version, applicationName)
  }

  /**
   * Sets the expansions to include in the request.
   *
   * @param expansions The expansions to be included.
   * @returns {this}
   */
  public expansions(expansions: string|string[]): this {
    return this.addQueryParam('expansions', this.castValueToString(expansions))
  }

  /**
   * @alias expansions
   */
  public withExpansions(expansions: string|string[]): this {
    return this.expansions(expansions)
  }

  /**
   * @alias expansions
   */
  public withExpansion(expansion: string): this {
    return this.expansions(expansion)
  }

  /**
   * Sets the extensions to include in the request.
   *
   * @param extensions The extensions ot include in the request.
   * @returns {this}
   */
  public extensions(extensions: string|string[]): this {
    return this.addQueryParam('extensions', this.castValueToString(extensions))
  }

  /**
   * @alias extensions
   */
  public withExtensions(extensions: string|string[]): this {
    return this.extensions(extensions)
  }

  /**
   * @alias extensions
   */
  public withExtension(extension: string): this {
    return this.extensions(extension)
  }

  /**
   * Retrieves the changes after a given version
   *
   * @param applicationName The name used when creating the subscription
   * @param version The last version that was received
   * @returns Promise<PowerSchoolResponse>
   */
  public getDataSubscriptionChanges(applicationName: string, version: number): Promise<PowerSchoolResponse> {
    return this.setConfig()
      .get(`/ws/dataversion/${applicationName}/${version}`)
  }

  // --------------------------------------------------------------------------
  // Sending requests
  // --------------------------------------------------------------------------

  /**
   * Retrieves the count for the set endpoint.
   *
   * @returns {Promise<PowerSchoolResponse>}
   */
  public count(): Promise<PowerSchoolResponse> {
    this.requestConfig.endpoint += `/count`
    this.requestConfig.includeProjection = false

    return this.get()
  }

  /**
   * Sends a get request with the ability to include an endpoint.
   *
   * @param endpoint Optionally include the endpoint
   * @returns {Promise<PowerSchoolResponse>}
   */
  public get(endpoint: string = null): Promise<PowerSchoolResponse> {
    if (endpoint) {
      this.endpoint(endpoint)
    }

    return this.setMethod('get')
      .send()
  }

  /**
   * Sends a post request to an endpoint with some data.
   *
   * @param endpoint The endpoint to which to send the request. Optional.
   * @param data Data to send with the request. Optional.
   * @returns {Promise<PowerSchoolResponse>}
   */
  public post(endpoint: string = null, data: object = null): Promise<PowerSchoolResponse> {
    return this.setMethod('post')
      .sendSugar(endpoint, data)
  }

  /**
   * Sends a put request to an endpoint with some data.
   *
   * @param endpoint The endpoint to which to send the request. Optional.
   * @param data Data to send with the request. Optional.
   * @returns {Promise<PowerSchoolResponse>}
   */
  public put(endpoint: string = null, data: object = null): Promise<PowerSchoolResponse> {
    return this.setMethod('put')
      .sendSugar(endpoint, data)
  }

  /**
   * Sends a path request to an endpoint with some data.
   *
   * @param endpoint The endpoint to which to send the request. Optional.
   * @param data Data to send with the request. Optional.
   * @returns {Promise<PowerSchoolResponse>}
   */
  public patch(endpoint: string = null, data: object = null): Promise<PowerSchoolResponse> {
    return this.setMethod('patch')
      .sendSugar(endpoint, data)
  }

  /**
   * Sends a delete request with the ability to include an endpoint.
   *
   * @param endpoint Optionally include the endpoint
   * @returns {Promise<PowerSchoolResponse>}
   */
  public delete(endpoint: string = null): Promise<PowerSchoolResponse> {
    if (endpoint) {
      this.endpoint(endpoint)
    }

    return this.setMethod('delete')
      .send()
  }

  /**
   * Sugar for setting the endpoint and data before sending a request.
   *
   * @param endpoint The endpoint to which to send the request. Optional.
   * @param data Data to send with the request. Optional.
   * @returns {Promise<PowerSchoolResponse>}
   */
  protected sendSugar(endpoint: string = null, data: object = null): Promise<PowerSchoolResponse> {
    if (endpoint !== null) {
      this.setEndpoint(endpoint)
    }

    if (data !== null) {
      this.setData(data)
    }

    return this.send()
  }

  /**
   * Sends the request to PowerSchool.
   *
   * @returns {Promise<PowerSchoolResponse>}
   */
  public async send(): Promise<PowerSchoolResponse> {
    const res = await this.client.request(this.getAxiosRequestConfig())

    return new PowerSchoolResponse(res.data)
  }

  /**
   * Converts the internal request config
   * to an Axios request config object.
   *
   * @returns {AxiosRequestConfig}
   */
  public getAxiosRequestConfig(): AxiosRequestConfig {
    return {
      url: this.sanitizeEndpoint(this.requestConfig.endpoint),
      method: this.requestConfig.method,
      headers: {
        'Authorization': `Bearer: ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      params: this.buildParams(),
      data: this.requestConfig.data,
    }
  }

  /**
   * Builds the query parameters for Axios
   *
   * @returns {object}
   */
  public buildParams(): object {
    return {
      ...(this.requestConfig.includeProjection ? { projection: '*' } : {}),
      ...(this.requestConfig.method.toLowerCase() === 'get' ? { ...this.requestConfig.data } : {}),
      ...this.requestConfig.params,
    }
  }

  public sanitizeEndpoint(endpoint: string): string {
    const sanitized = endpoint.replace(/\/{2,}/g, '/')

    if (sanitized.endsWith('/')) {
      return sanitized.slice(0, -1)
    }

    return sanitized
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

      if (typeof value === 'object' && !Array.isArray(value)) {
        output[key] = this.castValuesToString(value)
        continue
      }

      output[key] = this.castValueToString(value)
    }

    return output
  }

  public castValueToString(value: any): string {
    if (typeof value === 'boolean') {
      return value ? '1' : '0'
    }

    if (value === null || typeof value === 'undefined') {
      return ''
    }

    if (Array.isArray(value)) {
      return value.join(',')
    }

    return String(value)
  }
}
