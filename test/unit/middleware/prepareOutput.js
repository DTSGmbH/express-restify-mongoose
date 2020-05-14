'use strict'

import { assert, spy } from 'sinon'
import prepareOutput from '../../../src/middleware/prepareOutput'

describe('prepareOutput', () => {
  let onError = spy()
  let outputFn = spy()
  let outputFnPromise = spy(() => {
    return Promise.resolve()
  })
  let postProcess = spy()
  let next = spy()

  afterEach(() => {
    onError.resetHistory()
    outputFn.resetHistory()
    outputFnPromise.resetHistory()
    next.resetHistory()
  })

  it('calls outputFn with default options and no post* middleware', () => {
    let req = {
      method: 'GET',
      erm: {}
    }

    let options = {
      onError: onError,
      outputFn: outputFn
    }

    prepareOutput(options)(req, {}, next)

    assert.calledOnce(outputFn)
    assert.calledWithExactly(outputFn, req, {})
    assert.notCalled(onError)
    assert.notCalled(next)
  })

  it('calls outputFn with default options and no post* middleware (async)', () => {
    let req = {
      method: 'GET',
      erm: {}
    }

    let options = {
      onError: onError,
      outputFn: outputFnPromise
    }

    prepareOutput(options)(req, {}, next)

    assert.calledOnce(outputFnPromise)
    assert.calledWithExactly(outputFnPromise, req, {})
    assert.notCalled(onError)
    assert.notCalled(next)
  })

  it('calls postProcess with default options and no post* middleware', () => {
    let req = {
      method: 'GET',
      erm: {}
    }

    let options = {
      onError: onError,
      outputFn: outputFn,
      postProcess: postProcess
    }

    prepareOutput(options)(req, {}, next)

    assert.calledOnce(outputFn)
    assert.calledWithExactly(outputFn, req, {})
    assert.calledOnce(postProcess)
    assert.calledWithExactly(postProcess, req, {})
    assert.notCalled(onError)
    assert.notCalled(next)
  })

  it('calls postProcess with default options and no post* middleware (async outputFn)', () => {
    let req = {
      method: 'GET',
      erm: {}
    }

    let options = {
      onError: onError,
      outputFn: outputFnPromise,
      postProcess: postProcess
    }

    prepareOutput(options)(req, {}, next)

    assert.calledOnce(outputFnPromise)
    assert.calledWithExactly(outputFnPromise, req, {})
    assert.calledOnce(postProcess)
    assert.calledWithExactly(postProcess, req, {})
    assert.notCalled(onError)
    assert.notCalled(next)
  })
})
