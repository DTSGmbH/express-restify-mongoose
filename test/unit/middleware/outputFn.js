'use strict'

import { assert, spy } from 'sinon'
import outputFn from '../../../src/middleware/outputFn'

describe('outputFn', () => {
  let res = {
    sendStatus: function() {},
    status: function() {
      return this
    },
    json: function() {},
    send: function() {}
  }

  let sendStatus = spy(res, 'sendStatus')
  let status = spy(res, 'status')
  let json = spy(res, 'json')
  let send = spy(res, 'send')

  afterEach(() => {
    sendStatus.resetHistory()
    status.resetHistory()
    json.resetHistory()
    send.resetHistory()
  })

  describe('express', () => {
    it('sends status code and message', () => {
      outputFn(true)(
        {
          erm: {
            statusCode: 200
          }
        },
        res
      )

      assert.calledOnce(sendStatus)
      assert.calledWithExactly(sendStatus, 200)
      assert.notCalled(status)
      assert.notCalled(json)
      assert.notCalled(send)
    })

    it('sends data and status code', () => {
      let req = {
        erm: {
          statusCode: 201,
          result: {
            name: 'Bob'
          }
        }
      }

      outputFn(true)(req, res)

      assert.calledOnce(status)
      assert.calledWithExactly(status, 201)
      assert.calledOnce(json)
      assert.calledWithExactly(json, {
        name: 'Bob'
      })
      assert.notCalled(sendStatus)
      assert.notCalled(send)
    })
  })

  describe('restify', () => {
    it('sends status code', () => {
      outputFn(false)(
        {
          erm: {
            statusCode: 200
          }
        },
        res
      )

      assert.calledOnce(send)
      assert.calledWithExactly(send, 200, undefined)
      assert.notCalled(sendStatus)
      assert.notCalled(status)
      assert.notCalled(json)
    })

    it('sends data and status code', () => {
      let req = {
        erm: {
          statusCode: 201,
          result: {
            name: 'Bob'
          }
        }
      }

      outputFn(false)(req, res)

      assert.calledOnce(send)
      assert.calledWithExactly(send, 201, {
        name: 'Bob'
      })
      assert.notCalled(sendStatus)
      assert.notCalled(status)
      assert.notCalled(json)
    })
  })
})
