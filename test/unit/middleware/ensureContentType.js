'use strict'

import { equal } from 'assert'
import { assert as _assert, match, spy } from 'sinon'
import ensureContentType from '../../../src/middleware/ensureContentType'

describe('ensureContentType', () => {
  let onError = spy()
  let next = spy()

  afterEach(() => {
    onError.resetHistory()
    next.resetHistory()
  })

  it('calls next with an error (missing_content_type)', () => {
    let req = {
      erm: {},
      headers: {},
      params: {}
    }

    ensureContentType({ onError })(req, {}, next)

    _assert.calledOnce(onError)
    _assert.calledWithExactly(onError, match.instanceOf(Error) /*new Error('missing_content_type')*/, req, {}, next)
    _assert.notCalled(next)
    equal(req.access, undefined)
  })

  it('calls next with an error (invalid_content_type)', () => {
    let req = {
      erm: {},
      headers: {
        'content-type': 'invalid/type'
      },
      params: {}
    }

    ensureContentType({ onError })(req, {}, next)

    _assert.calledOnce(onError)
    _assert.calledWithExactly(onError, match.instanceOf(Error) /*new Error('invalid_content_type')*/, req, {}, next)
    _assert.notCalled(next)
    equal(req.access, undefined)
  })

  it('calls next', () => {
    let req = {
      headers: {
        'content-type': 'application/json'
      },
      params: {}
    }

    ensureContentType({ onError })(req, {}, next)

    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
  })
})
