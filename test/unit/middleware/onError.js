'use strict'

import { assert, spy } from 'sinon'
import onError from '../../../src/middleware/onError'

describe('onError', () => {
  const req = {
    erm: {
      statusCode: 500
    }
  }

  let res = {
    setHeader: () => {},
    status: function() {
      return this
    },
    send: () => {}
  }

  let setHeader = spy(res, 'setHeader')
  let status = spy(res, 'status')
  let send = spy(res, 'send')
  let next = spy()

  afterEach(() => {
    setHeader.resetHistory()
    status.resetHistory()
    send.resetHistory()
    next.resetHistory()
  })

  it('with express', () => {
    onError(true)(new Error('An error occurred'), req, res, next)

    assert.calledOnce(setHeader)
    assert.calledWithExactly(setHeader, 'Content-Type', 'application/json')
    assert.calledOnce(status)
    assert.calledWithExactly(status, 500)
    assert.calledOnce(send)
    assert.calledWithExactly(send, {
      message: 'An error occurred',
      name: 'Error'
    })
    assert.notCalled(next)
  })

  it('with restify', () => {
    onError(false)(new Error('An error occurred'), req, res, next)

    assert.calledOnce(setHeader)
    assert.calledWithExactly(setHeader, 'Content-Type', 'application/json')
    assert.notCalled(status)
    assert.calledOnce(send)
    assert.calledWithExactly(send, 500, {
      message: 'An error occurred',
      name: 'Error'
    })
    assert.notCalled(next)
  })
})
