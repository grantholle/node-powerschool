import { PowerSchool } from '../src/main.js'
import * as dotenv from 'dotenv'

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
})
