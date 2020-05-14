'use strict'

import { equal, throws } from 'assert'
import { assert as _assert, spy } from 'sinon'
import access from '../../../src/middleware/access'

describe('access', () => {
  let next = spy()

  afterEach(() => {
    next.resetHistory()
  })

  describe('returns (sync)', () => {
    it('adds access field to req', () => {
      let req = {}

      access({
        access: () => {
          return 'private'
        }
      })(req, {}, next)

      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      equal(req.access, 'private')
    })

    it('throws an exception with unsupported parameter', () => {
      let req = {}

      throws(() => {
        access({
          access: () => {
            return 'foo'
          }
        })(req, {}, next)
      }, 'Unsupported access, must be "public", "private" or "protected"')

      _assert.notCalled(next)
      equal(req.access, undefined)
    })
  })

  describe('yields (async)', () => {
    it('adds access field to req', () => {
      let req = {}

      access({
        access: (req, cb) => {
          return cb(null, 'private')
        }
      })(req, {}, next)

      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      equal(req.access, 'private')
    })

    it('calls onError', () => {
      let req = {
        erm: {},
        params: {}
      }
      let onError = spy()
      let err = new Error('Something bad happened')

      access({
        access: (req, cb) => {
          return cb(err, 'private')
        },
        onError: onError
      })(req, {}, next)

      _assert.calledOnce(onError)
      _assert.calledWithExactly(onError, err, req, {}, next)
      _assert.notCalled(next)
      equal(req.access, undefined)
    })

    it('throws an exception with unsupported parameter', () => {
      let req = {}

      throws(() => {
        access({
          access: (req, cb) => {
            return cb(null, 'foo')
          }
        })(req, {}, next)
      }, 'Unsupported access, must be "public", "private" or "protected"')

      _assert.notCalled(next)
      equal(req.access, undefined)
    })
  })
})
