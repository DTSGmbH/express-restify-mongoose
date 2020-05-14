'use strict'

import { equal } from 'assert'
import CastError from 'mongoose/lib/error/cast'
import { assert as _assert, spy } from 'sinon'
import errorHandler from '../../src/errorHandler'

describe('errorHandler', () => {
  it('is a function', () => {
    equal(typeof errorHandler, 'function')
  })

  it('returns a function', () => {
    equal(typeof errorHandler(), 'function')
  })

  it('returns a function that returns a function', () => {
    equal(typeof errorHandler()(), 'function')
  })

  it('sets statusCode 400 and calls onError', () => {
    const options = {
      onError: spy()
    }

    const req = {
      erm: {},
      params: {}
    }

    const err = new Error('Something went wrong')

    errorHandler(options)(req)(err)

    _assert.calledOnce(options.onError)
    equal(req.erm.statusCode, 400)
  })

  it('sets statusCode 400 and calls onError', () => {
    const options = {
      onError: spy(),
      idProperty: '42'
    }

    const req = {
      erm: {},
      params: {
        id: '42'
      }
    }

    const err = new Error('Something went wrong')

    errorHandler(options)(req)(err)

    _assert.calledOnce(options.onError)
    equal(req.erm.statusCode, 400)
  })

  it('sets statusCode 404 and calls onError', () => {
    const options = {
      onError: spy(),
      idProperty: '_id'
    }

    const req = {
      erm: {},
      params: {
        id: '42'
      }
    }

    const err = new CastError('type', '42', '_id')

    errorHandler(options)(req)(err)

    _assert.calledOnce(options.onError)
    equal(req.erm.statusCode, 404)
  })
})
