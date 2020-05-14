'use strict'

import { deepEqual, equal, ok } from 'assert'
import mongoose from 'mongoose'
import { post } from 'request'
import * as erm from '../../src/express-restify-mongoose'
import dbSetup from './setup'

export default function(createFn, setup, dismantle) {
  const db = dbSetup()
  const testPort = 30023
  const testUrl = `http://localhost:${testPort}`
  const invalidId = 'invalid-id'
  const randomId = mongoose.Types.ObjectId().toHexString()

  describe('Create documents', () => {
    let app = createFn()
    let server
    let customer, product

    beforeEach(done => {
      setup(err => {
        if (err) {
          return done(err)
        }

        erm.serve(app, db.models.Customer, {
          restify: app.isRestify
        })

        erm.serve(app, db.models.Invoice, {
          restify: app.isRestify
        })

        erm.serve(app, db.models.Product, {
          restify: app.isRestify
        })

        db.models.Customer.create({
          name: 'Bob'
        })
          .then(createdCustomer => {
            customer = createdCustomer

            return db.models.Product.create({
              name: 'Bobsleigh'
            })
          })
          .then(createdProduct => {
            product = createdProduct
            server = app.listen(testPort, done)
          })
          .catch(done)
      })
    })

    afterEach(done => {
      dismantle(app, server, done)
    })

    it('POST /Customer 201', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: {
            name: 'John'
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.name, 'John')
          done()
        }
      )
    })

    it('POST /Customer 201 - generate _id (undefined)', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: {
            _id: undefined,
            name: 'John'
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.name, 'John')
          done()
        }
      )
    })

    it('POST /Customer 201 - generate _id (null)', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: {
            _id: null,
            name: 'John'
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.name, 'John')
          done()
        }
      )
    })

    it('POST /Customer 201 - use provided _id', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: {
            _id: randomId,
            name: 'John'
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          ok(body._id === randomId)
          equal(body.name, 'John')
          done()
        }
      )
    })

    it('POST /Customer 201 - ignore __v', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: {
            __v: '1',
            name: 'John'
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          ok(body.__v === 0)
          equal(body.name, 'John')
          done()
        }
      )
    })

    it('POST /Customer 201 - array', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: [
            {
              name: 'John'
            },
            {
              name: 'Mike'
            }
          ]
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(Array.isArray(body))
          ok(body.length, 2)
          ok(body[0]._id)
          equal(body[0].name, 'John')
          ok(body[1]._id)
          equal(body[1].name, 'Mike')
          done()
        }
      )
    })

    it('POST /Customer 400 - validation error', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: {}
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 400)
          equal(body.name, 'ValidationError')
          deepEqual(body, {
            name: 'ValidationError',
            message: 'Customer validation failed: name: Path `name` is required.',
            _message: 'Customer validation failed',
            errors: {
              name: {
                kind: 'required',
                message: 'Path `name` is required.',
                name: 'ValidatorError',
                path: 'name',
                properties: {
                  message: 'Path `name` is required.',
                  path: 'name',
                  type: 'required'
                }
              }
            }
          })
          done()
        }
      )
    })

    it('POST /Customer 400 - missing content type', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 400)
          deepEqual(JSON.parse(body), {
            name: 'Error',
            message: 'missing_content_type'
          })
          done()
        }
      )
    })

    it('POST /Customer 400 - invalid content type', done => {
      post(
        {
          url: `${testUrl}/api/v1/Customer`,
          formData: {}
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 400)
          deepEqual(JSON.parse(body), {
            name: 'Error',
            message: 'invalid_content_type'
          })
          done()
        }
      )
    })

    it('POST /Invoice 201 - referencing customer and product ids as strings', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: customer._id.toHexString(),
            products: product._id.toHexString(),
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.customer, customer._id)
          equal(body.amount, 42)
          done()
        }
      )
    })

    it('POST /Invoice 201 - referencing customer and products ids as strings', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: customer._id.toHexString(),
            products: [product._id.toHexString(), product._id.toHexString()],
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.customer, customer._id)
          equal(body.amount, 42)
          done()
        }
      )
    })

    it('POST /Invoice 201 - referencing customer and product ids', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: customer._id,
            products: product._id,
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.customer, customer._id)
          equal(body.amount, 42)
          done()
        }
      )
    })

    it('POST /Invoice 201 - referencing customer and products ids', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: customer._id,
            products: [product._id, product._id],
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.customer, customer._id)
          equal(body.amount, 42)
          done()
        }
      )
    })

    it('POST /Invoice 201 - referencing customer and product', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: customer,
            products: product,
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.customer, customer._id)
          equal(body.amount, 42)
          done()
        }
      )
    })

    it('POST /Invoice 201 - referencing customer and products', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: customer,
            products: [product, product],
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.customer, customer._id)
          equal(body.amount, 42)
          done()
        }
      )
    })

    it('POST /Invoice?populate=customer,products 201 - referencing customer and products', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          qs: {
            populate: 'customer,products'
          },
          json: {
            customer: customer,
            products: [product, product],
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.amount, 42)
          equal(body.customer._id, customer._id)
          equal(body.customer.name, customer.name)
          equal(body.products[0]._id, product._id.toHexString())
          equal(body.products[0].name, product.name)
          equal(body.products[1]._id, product._id.toHexString())
          equal(body.products[1].name, product.name)
          done()
        }
      )
    })

    it('POST /Invoice 400 - referencing invalid customer and products ids', done => {
      post(
        {
          url: `${testUrl}/api/v1/Invoice`,
          json: {
            customer: invalidId,
            products: [invalidId, invalidId],
            amount: 42
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 400)
          delete body.message
          deepEqual(body, {
            name: 'ValidationError',
            _message: 'Invoice validation failed',
            errors: {
              customer: {
                kind: 'ObjectID',
                message: 'Cast to ObjectID failed for value "invalid-id" at path "customer"',
                name: 'CastError',
                path: 'customer',
                stringValue: '"invalid-id"',
                value: 'invalid-id'
              },
              products: {
                kind: 'Array',
                message: 'Cast to Array failed for value "[ \'invalid-id\', \'invalid-id\' ]" at path "products"',
                name: 'CastError',
                path: 'products',
                stringValue: "\"[ 'invalid-id', 'invalid-id' ]\"",
                value: ['invalid-id', 'invalid-id']
              }
            }
          })
          done()
        }
      )
    })
  })
}
