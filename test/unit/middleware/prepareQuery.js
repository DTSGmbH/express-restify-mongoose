'use strict'

import { deepEqual } from 'assert'
import { assert as _assert, match as _match, spy } from 'sinon'
import prepareQuery from '../../../src/middleware/prepareQuery'

describe('prepareQuery', () => {
  let options = {
    onError: spy(),
    allowRegex: true
  }

  let next = spy()

  afterEach(() => {
    options.onError.resetHistory()
    options.allowRegex = true
    next.resetHistory()
  })

  describe('jsonQueryParser', () => {
    it('converts $regex to undefined', () => {
      let req = {
        query: {
          query: '{"foo":{"$regex":"bar"}}'
        }
      }

      options.allowRegex = false

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        query: {
          foo: {}
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('converts [] to $in', () => {
      let req = {
        query: {
          query: '{"foo":["bar"]}'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        query: {
          foo: { $in: ['bar'] }
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })
  })

  it('calls next when query is empty', () => {
    prepareQuery(options)({}, {}, next)

    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('ignores keys that are not whitelisted and calls next', () => {
    let req = {
      query: {
        foo: 'bar'
      }
    }

    prepareQuery(options)(req, {}, next)

    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls next when query key is valid json', () => {
    let req = {
      query: {
        query: '{"foo":"bar"}'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, {
      query: JSON.parse(req.query.query)
    })
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls onError when query key is invalid json', () => {
    let req = {
      erm: {},
      params: {},
      query: {
        query: 'not json'
      }
    }

    prepareQuery(options)(req, {}, next)

    _assert.calledOnce(options.onError)
    _assert.calledWithExactly(options.onError, _match.instanceOf(Error) /*new Error('invalid_json_query')*/, req, {}, next)
    _assert.notCalled(next)
  })

  it('calls next when sort key is valid json', () => {
    let req = {
      query: {
        sort: '{"foo":"bar"}'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, {
      sort: JSON.parse(req.query.sort)
    })
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls next when sort key is a string', () => {
    let req = {
      query: {
        sort: 'foo'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, req.query)
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls next when skip key is a string', () => {
    let req = {
      query: {
        skip: '1'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, req.query)
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls next when limit key is a string', () => {
    let req = {
      query: {
        limit: '1'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, req.query)
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls next when distinct key is a string', () => {
    let req = {
      query: {
        distinct: 'foo'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, req.query)
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  it('calls next when populate key is a string', () => {
    let req = {
      query: {
        populate: 'foo'
      }
    }

    prepareQuery(options)(req, {}, next)

    deepEqual(req.erm.query, {
      populate: [
        {
          path: 'foo'
        }
      ]
    })
    _assert.calledOnce(next)
    _assert.calledWithExactly(next)
    _assert.notCalled(options.onError)
  })

  describe('select', () => {
    it('parses a string to include fields', () => {
      let req = {
        query: {
          select: 'foo'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        select: {
          foo: 1
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('parses a string to exclude fields', () => {
      let req = {
        query: {
          select: '-foo'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        select: {
          foo: 0
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('parses a comma separated list of fields to include', () => {
      let req = {
        query: {
          select: 'foo,bar'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        select: {
          foo: 1,
          bar: 1
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('parses a comma separated list of fields to exclude', () => {
      let req = {
        query: {
          select: '-foo,-bar'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        select: {
          foo: 0,
          bar: 0
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('parses a comma separated list of nested fields', () => {
      let req = {
        query: {
          select: 'foo.bar,baz.qux.quux'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        select: {
          'foo.bar': 1,
          'baz.qux.quux': 1
        }
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })
  })

  describe('populate', () => {
    it('parses a string to populate a path', () => {
      let req = {
        query: {
          populate: 'foo'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        populate: [
          {
            path: 'foo'
          }
        ]
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('parses a string to populate multiple paths', () => {
      let req = {
        query: {
          populate: 'foo,bar'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        populate: [
          {
            path: 'foo'
          },
          {
            path: 'bar'
          }
        ]
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('accepts an object to populate a path', () => {
      let req = {
        query: {
          populate: {
            path: 'foo.bar',
            select: 'baz',
            match: { qux: 'quux' },
            options: { sort: 'baz' }
          }
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        populate: [
          {
            path: 'foo.bar',
            select: 'baz',
            match: { qux: 'quux' },
            options: { sort: 'baz' }
          }
        ]
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })

    it('parses a string to populate and select fields', () => {
      let req = {
        query: {
          populate: 'foo',
          select: 'foo.bar,foo.baz'
        }
      }

      prepareQuery(options)(req, {}, next)

      deepEqual(req.erm.query, {
        populate: [
          {
            path: 'foo',
            select: 'bar baz'
          }
        ]
      })
      _assert.calledOnce(next)
      _assert.calledWithExactly(next)
      _assert.notCalled(options.onError)
    })
  })
})
