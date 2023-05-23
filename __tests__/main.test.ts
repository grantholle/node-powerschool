import { PowerSchool } from '../src/main.js'
import * as dotenv from 'dotenv'
import { AxiosRequestConfig } from 'axios'

dotenv.config()

describe('PowerSchool class', () => {
  let timeoutSpy: jest.SpyInstance
  let ps: PowerSchool

  // Act before assertions
  beforeAll(async () => {
    // Read more about fake timers
    // http://facebook.github.io/jest/docs/en/timer-mocks.html#content
    // Jest 27 now uses "modern" implementation of fake timers
    // https://jestjs.io/blog/2021/05/25/jest-27#flipping-defaults
    // https://github.com/facebook/jest/pull/5171
    jest.useFakeTimers()
    timeoutSpy = jest.spyOn(global, 'setTimeout')

    ps = new PowerSchool(process.env.PS_URL, process.env.PS_CLIENT_ID, process.env.PS_CLIENT_SECRET)
    jest.runOnlyPendingTimers()
  })

  // Teardown (cleanup) after assertions
  afterAll(() => {
    timeoutSpy.mockRestore()
  })

  it('can instantiate an object', () => {
    expect(ps).toBeInstanceOf(PowerSchool)
  })

  it('can set auth token', async () => {
    await ps.retrieveToken()
    expect(ps.tokenSet()).toEqual(true)
  })

  describe('Building a request', () => {
    it('can detect slash on table request', () => {
      const config: AxiosRequestConfig = ps.table('/ws/schema/table/u_custom_table')
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('method', 'get')
      expect(config).toHaveProperty('url', '/ws/schema/table/u_custom_table')
      expect(config).toHaveProperty('headers.Authorization')
      expect(config).toHaveProperty('params.projection', '*')
    })

    it('can build an endpoint using ID helpers', () => {
      let config: AxiosRequestConfig = ps.to('/ws/schema/table/u_custom_table/')
        .forId(1)
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('url', '/ws/schema/table/u_custom_table/1')

      config = ps.to('/ws/schema/table/u_custom_table')
        .forId(2)
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('url', '/ws/schema/table/u_custom_table/2')
    })

    it('can build a query string from a string', () => {
      let config: AxiosRequestConfig = ps.to('/ws/schema/table/u_custom_table/')
        .query('param1=one&param2=two')
        .addQueryParam('param3', 'three')
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('params', {
        param1: 'one',
        param2: 'two',
        param3: 'three',
      })
    })

    it('can build a query with an object', () => {
      let config: AxiosRequestConfig = ps.to('/ws/schema/table/u_custom_table/')
        .query({
          param1: 'one',
          param2: 'two',
        })
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('params', {
        param1: 'one',
        param2: 'two',
      })
    })

    it('can build a query string from data when doing a get request', () => {
      let config: AxiosRequestConfig = ps.to('/ws/schema/table/u_custom_table/')
        .with({
          param1: 'one',
          param2: 'two',
        })
        .method('GET')
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('params', {
        param1: 'one',
        param2: 'two',
      })
    })

    it('can set the PowerQuery absolute endpoint without data', () => {
      let config: AxiosRequestConfig = ps.pq('/ws/schema/query/com.archboard.test')
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('method', 'post')
      expect(config).toHaveProperty('url', '/ws/schema/query/com.archboard.test')
    })

    it('can set the PowerQuery relative endpoint with data', () => {
      let config: AxiosRequestConfig = ps.pq('com.archboard.test', {
          param1: 'one',
          param2: 'two',
        })
        .getAxiosRequestConfig()

      expect(config).toHaveProperty('method', 'post')
      expect(config).toHaveProperty('url', '/ws/schema/query/com.archboard.test')
      expect(config).toHaveProperty('data', {
        param1: 'one',
        param2: 'two',
      })
    })
  })
})
