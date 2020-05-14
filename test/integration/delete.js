'use strict'

import { equal, ok } from 'assert'
import mongoose from 'mongoose'
import { del } from 'request'
import * as erm from '../../src/express-restify-mongoose'
import dbSetup from './setup'

export default function(createFn, setup, dismantle) {
  const db = dbSetup()
  const testPort = 30023
  const testUrl = `http://localhost:${testPort}`
  const invalidId = 'invalid-id'
  const randomId = mongoose.Types.ObjectId().toHexString()

  describe('Delete documents', () => {
    describe('findOneAndRemove: true', () => {
      let app = createFn()
      let server
      let customer

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.Customer, {
            findOneAndRemove: true,
            restify: app.isRestify
          })

          db.models.Customer.create([
            {
              name: 'Bob'
            },
            {
              name: 'John'
            },
            {
              name: 'Mike'
            }
          ])
            .then(createdCustomers => {
              customer = createdCustomers[0]
              server = app.listen(testPort, done)
            })
            .catch(done)
        })
      })

      afterEach(done => {
        dismantle(app, server, done)
      })

      it('DELETE /Customer 204 - no id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 204)
            done()
          }
        )
      })

      it('DELETE /Customer/:id 204 - created id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 204)
            done()
          }
        )
      })

      it('DELETE /Customer/:id 404 - invalid id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer/${invalidId}`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 404)
            done()
          }
        )
      })

      it('DELETE /Customer/:id 404 - random id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer/${randomId}`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 404)
            done()
          }
        )
      })

      it('DELETE /Customer?query={"name":"John"} 200 - exact match', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              query: JSON.stringify({
                name: 'John'
              })
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 204)

            db.models.Customer.find({}, (err, customers) => {
              ok(!err)
              equal(customers.length, 2)
              customers.forEach(customer => {
                ok(customer.name !== 'John')
              })
              done()
            })
          }
        )
      })
    })

    describe('findOneAndRemove: false', () => {
      let app = createFn()
      let server
      let customer

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.Customer, {
            findOneAndRemove: false,
            restify: app.isRestify
          })

          db.models.Customer.create([
            {
              name: 'Bob'
            },
            {
              name: 'John'
            },
            {
              name: 'Mike'
            }
          ])
            .then(createdCustomers => {
              customer = createdCustomers[0]
              server = app.listen(testPort, done)
            })
            .catch(done)
        })
      })

      afterEach(done => {
        dismantle(app, server, done)
      })

      it('DELETE /Customer 204 - no id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 204)
            done()
          }
        )
      })

      it('DELETE /Customer/:id 204 - created id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 204)
            done()
          }
        )
      })

      it('DELETE /Customer/:id 404 - invalid id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer/${invalidId}`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 404)
            done()
          }
        )
      })

      it('DELETE /Customer/:id 404 - random id', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer/${randomId}`
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 404)
            done()
          }
        )
      })

      it('DELETE /Customer?query={"name":"John"} 200 - exact match', done => {
        del(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              query: JSON.stringify({
                name: 'John'
              })
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 204)

            db.models.Customer.find({}, (err, customers) => {
              ok(!err)
              equal(customers.length, 2)
              customers.forEach(customer => {
                ok(customer.name !== 'John')
              })
              done()
            })
          }
        )
      })
    })
  })
}
