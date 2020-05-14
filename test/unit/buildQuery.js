'use strict'

import { equal } from 'assert'
import { assert as _assert, spy } from 'sinon'
import buildQuery from '../../src/buildQuery'

describe('buildQuery', () => {
  let query = {
    where: spy(),
    skip: spy(),
    limit: spy(),
    sort: spy(),
    select: spy(),
    populate: spy(),
    distinct: spy()
  }

  afterEach(() => {
    for (let key in query) {
      query[key].resetHistory()
    }
  })

  it('does not call any methods and returns a query object', () => {
    return buildQuery({})(query).then(result => {
      for (let key in query) {
        _assert.notCalled(query[key])
      }

      equal(result, query)
    })
  })

  describe('query', () => {
    it('calls where and returns a query object', () => {
      let queryOptions = {
        query: 'foo'
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.where)
        _assert.calledWithExactly(query.where, queryOptions.query)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.limit)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.select)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })
  })

  describe('skip', () => {
    it('calls skip and returns a query object', () => {
      let queryOptions = {
        skip: '1'
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.skip)
        _assert.calledWithExactly(query.skip, queryOptions.skip)
        _assert.notCalled(query.where)
        _assert.notCalled(query.limit)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.select)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })
  })

  describe('limit', () => {
    it('calls limit and returns a query object', () => {
      let queryOptions = {
        limit: '1'
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.limit)
        _assert.calledWithExactly(query.limit, queryOptions.limit)
        _assert.notCalled(query.where)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.select)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })

    it('calls limit and returns a query object', () => {
      let options = {
        limit: 1
      }

      let queryOptions = {
        limit: '2'
      }

      return buildQuery(options)(query, queryOptions).then(result => {
        _assert.calledOnce(query.limit)
        _assert.calledWithExactly(query.limit, options.limit)
        _assert.notCalled(query.where)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.select)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })

    it('does not call limit on count endpoint and returns a query object', () => {
      let queryOptions = {
        limit: '2'
      }

      query.op = 'count'

      return buildQuery({})(query, queryOptions).then(result => {
        delete query.op

        for (let key in query) {
          _assert.notCalled(query[key])
        }

        equal(result, query)
      })
    })

    it('does not call limit on count endpoint and returns a query object', () => {
      let options = {
        limit: 1
      }

      let queryOptions = {
        limit: '2'
      }

      query.op = 'count'

      return buildQuery(options)(query, queryOptions).then(result => {
        delete query.op

        for (let key in query) {
          _assert.notCalled(query[key])
        }

        equal(result, query)
      })
    })

    it('does not call limit on queries that have a distinct option set and returns the query object', () => {
      let options = {
        limit: 1
      }

      let queryOptions = {
        distinct: 'name'
      }

      return buildQuery(options)(query, queryOptions).then(result => {
        for (let key in query) {
          if (key === 'distinct') continue
          _assert.notCalled(query[key])
        }
        _assert.called(query.distinct)

        equal(result, query)
      })
    })
  })

  describe('sort', () => {
    it('calls sort and returns a query object', () => {
      let queryOptions = {
        sort: 'foo'
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.sort)
        _assert.calledWithExactly(query.sort, queryOptions.sort)
        _assert.notCalled(query.where)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.limit)
        _assert.notCalled(query.select)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })
  })

  describe('select', () => {
    it('accepts an object', () => {
      let queryOptions = {
        select: {
          foo: 1,
          bar: 0
        }
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.select)
        _assert.calledWithExactly(query.select, {
          foo: 1,
          bar: 0
        })
        _assert.notCalled(query.where)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.limit)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })
  })

  describe('populate', () => {
    it('accepts an object wrapped in an array to populate a path', () => {
      let queryOptions = {
        populate: [
          {
            path: 'foo.bar',
            select: 'baz',
            match: { qux: 'quux' },
            options: { sort: 'baz' }
          }
        ]
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.populate)
        _assert.calledWithExactly(query.populate, [
          {
            path: 'foo.bar',
            select: 'baz',
            match: { qux: 'quux' },
            options: { sort: 'baz' }
          }
        ])
        _assert.notCalled(query.where)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.limit)
        _assert.notCalled(query.select)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.distinct)
        equal(result, query)
      })
    })
  })

  describe('distinct', () => {
    it('calls distinct and returns a query object', () => {
      let queryOptions = {
        distinct: 'foo'
      }

      return buildQuery({})(query, queryOptions).then(result => {
        _assert.calledOnce(query.distinct)
        _assert.calledWithExactly(query.distinct, 'foo')
        _assert.notCalled(query.where)
        _assert.notCalled(query.skip)
        _assert.notCalled(query.limit)
        _assert.notCalled(query.sort)
        _assert.notCalled(query.populate)
        _assert.notCalled(query.select)
        equal(result, query)
      })
    })
  })
})
