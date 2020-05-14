'use strict'

import { deepEqual, equal } from 'assert'
import { Filter } from '../../src/resource_filter'
import setup from '../integration/setup'

describe('resourceFilter', () => {
  describe('getExcluded', () => {
    const filter = new Filter({})

    describe('private', () => {
      it('returns empty array', () => {
        let excluded = filter.getExcluded({
          access: 'private'
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 0)
      })
    })

    describe('protected', () => {
      it('returns empty array', () => {
        let excluded = filter.getExcluded({
          access: 'protected',
          filteredKeys: {}
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 0)
      })

      it('returns empty array', () => {
        let excluded = filter.getExcluded({
          access: 'protected'
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 0)
      })

      it('returns array of private fields', () => {
        let excluded = filter.getExcluded({
          access: 'protected',
          filteredKeys: {
            private: ['foo'],
            protected: ['bar']
          }
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 1)
        deepEqual(excluded, ['foo'])
      })

      it('returns array of private fields', () => {
        let excluded = filter.getExcluded({
          access: 'protected',
          modelName: 'FooModel',
          excludedMap: {
            FooModel: {
              private: ['foo'],
              protected: ['bar']
            }
          }
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 1)
        deepEqual(excluded, ['foo'])
      })
    })

    describe('public', () => {
      it('returns empty array', () => {
        let excluded = filter.getExcluded({
          access: 'public',
          filteredKeys: {}
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 0)
      })

      it('returns empty array', () => {
        let excluded = filter.getExcluded({
          access: 'public'
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 0)
      })

      it('returns array of private and protected fields', () => {
        let excluded = filter.getExcluded({
          access: 'public',
          filteredKeys: {
            private: ['foo'],
            protected: ['bar']
          }
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 2)
        deepEqual(excluded, ['foo', 'bar'])
      })

      it('returns array of private and protected fields', () => {
        let excluded = filter.getExcluded({
          access: 'public',
          modelName: 'FooModel',
          excludedMap: {
            FooModel: {
              private: ['foo'],
              protected: ['bar']
            }
          }
        })

        equal(Array.isArray(excluded), true)
        equal(excluded.length, 2)
        deepEqual(excluded, ['foo', 'bar'])
      })
    })
  })

  describe('filterItem', () => {
    let filter = new Filter({})

    it('does nothing', () => {
      let item = filter.filterItem()

      equal(item, undefined)
    })

    it('removes excluded keys from a document', () => {
      let doc = {
        foo: {
          bar: {
            baz: '3.14'
          }
        }
      }

      filter.filterItem(doc, ['foo'])

      deepEqual(doc, {})
    })

    it('removes excluded keys from a document', () => {
      let doc = {
        foo: {
          bar: {
            baz: '3.14'
          }
        }
      }

      filter.filterItem(doc, ['foo.bar.baz'])

      deepEqual(doc, {
        foo: {
          bar: {}
        }
      })
    })

    it('removes excluded keys from an array of document', () => {
      let docs = [
        {
          foo: {
            bar: {
              baz: '3.14'
            }
          }
        },
        {
          foo: {
            bar: {
              baz: 'pi'
            }
          }
        }
      ]

      filter.filterItem(docs, ['foo.bar.baz'])

      deepEqual(docs, [
        {
          foo: {
            bar: {}
          }
        },
        {
          foo: {
            bar: {}
          }
        }
      ])
    })
  })

  describe('filterPopulatedItem', () => {
    const db = setup()

    db.initialize({
      connect: false
    })

    let invoiceFilter = new Filter({
      model: db.models.Invoice
    })

    let customerFilter = new Filter({
      model: db.models.Customer,
      filteredKeys: {
        private: ['name']
      }
    })

    let productFilter = new Filter({
      model: db.models.Product,
      filteredKeys: {
        private: ['name']
      }
    })

    it('does nothing', () => {
      let item = invoiceFilter.filterPopulatedItem(null, {
        populate: []
      })

      equal(item, null)
    })

    it('removes keys in populated document', () => {
      let invoice = {
        customer: {
          name: 'John'
        },
        amount: '42'
      }

      invoiceFilter.filterPopulatedItem(invoice, {
        populate: [
          {
            path: 'customer'
          }
        ],
        excludedMap: {
          Customer: customerFilter.filteredKeys
        }
      })

      deepEqual(invoice, {
        customer: {},
        amount: '42'
      })
    })

    it('removes keys in array with populated document', () => {
      let invoices = [
        {
          customer: {
            name: 'John'
          },
          amount: '42'
        },
        {
          customer: {
            name: 'Bob'
          },
          amount: '3.14'
        }
      ]

      invoiceFilter.filterPopulatedItem(invoices, {
        populate: [
          {
            path: 'customer'
          }
        ],
        excludedMap: {
          Customer: customerFilter.filteredKeys
        }
      })

      deepEqual(invoices, [
        {
          customer: {},
          amount: '42'
        },
        {
          customer: {},
          amount: '3.14'
        }
      ])
    })

    it('ignores undefined path', () => {
      let invoice = {
        amount: '42'
      }

      invoiceFilter.filterPopulatedItem(invoice, {
        populate: [
          {
            path: 'customer'
          }
        ],
        excludedMap: {
          Customer: customerFilter.filteredKeys
        }
      })

      deepEqual(invoice, {
        amount: '42'
      })
    })

    it('skip when populate path is undefined', () => {
      let invoice = {
        customer: {
          name: 'John'
        },
        amount: '42'
      }

      invoiceFilter.filterPopulatedItem(invoice, {
        populate: [{}],
        excludedMap: {
          Customer: customerFilter.filteredKeys
        }
      })

      deepEqual(invoice, {
        customer: {
          name: 'John'
        },
        amount: '42'
      })
    })

    it('removes keys in populated document array', () => {
      let invoice = {
        products: [
          {
            name: 'Squirt Gun'
          },
          {
            name: 'Water Balloons'
          }
        ],
        amount: '42'
      }

      invoiceFilter.filterPopulatedItem(invoice, {
        populate: [
          {
            path: 'products'
          }
        ],
        excludedMap: {
          Product: productFilter.filteredKeys
        }
      })

      deepEqual(invoice, {
        products: [{}, {}],
        amount: '42'
      })
    })

    it('removes keys in populated document in array', () => {
      let customer = {
        name: 'John',
        purchases: [
          {
            item: {
              name: 'Squirt Gun'
            }
          }
        ]
      }

      customerFilter.filterPopulatedItem(customer, {
        populate: [
          {
            path: 'purchases.item'
          }
        ],
        excludedMap: {
          Product: productFilter.filteredKeys
        }
      })

      deepEqual(customer, {
        name: 'John',
        purchases: [
          {
            item: {}
          }
        ]
      })
    })
  })
})
