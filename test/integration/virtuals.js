'use strict'

import { equal, ok } from 'assert'
import { get } from 'request'
import * as erm from '../../src/express-restify-mongoose'
import dbSetup from './setup'

export default function(createFn, setup, dismantle) {
  const db = dbSetup()
  const testPort = 30023
  const testUrl = `http://localhost:${testPort}`

  describe('virtuals', () => {
    describe('lean: true', () => {
      let app = createFn()
      let server

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.Customer, {
            lean: true,
            restify: app.isRestify
          })

          db.models.Customer.create({
            name: 'Bob'
          })
            .then(createdCustomers => {
              server = app.listen(testPort, done)
            })
            .catch(done)
        })
      })

      afterEach(done => {
        dismantle(app, server, done)
      })

      it('GET /Customer 200 - unavailable', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0].info, undefined)
            done()
          }
        )
      })
    })

    describe('lean: false', () => {
      let app = createFn()
      let server

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.Customer, {
            lean: false,
            restify: app.isRestify
          })

          db.models.Customer.create({
            name: 'Bob'
          })
            .then(createdCustomers => {
              server = app.listen(testPort, done)
            })
            .catch(done)
        })
      })

      afterEach(done => {
        dismantle(app, server, done)
      })

      it('GET /Customer 200 - available', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0].info, 'Bob is awesome')
            done()
          }
        )
      })
    })

    describe('readPreference: secondary', () => {
      let app = createFn()
      let server

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.Customer, {
            readPreference: 'secondary',
            restify: app.isRestify
          })

          db.models.Customer.create({
            name: 'Bob'
          })
            .then(createdCustomers => {
              server = app.listen(testPort, done)
            })
            .catch(done)
        })
      })

      afterEach(done => {
        dismantle(app, server, done)
      })

      it('GET /Customer 200 - available', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            done()
          }
        )
      })
    })
  })
}
