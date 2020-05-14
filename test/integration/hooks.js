'use strict'

import { deepEqual, equal, ok } from 'assert'
import { post } from 'request'
import * as erm from '../../src/express-restify-mongoose'
import dbSetup from './setup'

export default function(createFn, setup, dismantle) {
  const db = dbSetup()

  let testPort = 30023
  let testUrl = `http://localhost:${testPort}`

  describe('Mongoose hooks', () => {
    let app = createFn()
    let server

    beforeEach(done => {
      setup(err => {
        if (err) {
          return done(err)
        }

        erm.serve(app, db.models.Hook, {
          restify: app.isRestify
        })

        server = app.listen(testPort, done)
      })
    })

    afterEach(done => {
      dismantle(app, server, done)
    })

    it('POST /Hook 201', done => {
      post(
        {
          url: `${testUrl}/api/v1/Hook`,
          json: {
            preSaveError: false,
            postSaveError: false
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 201)
          ok(body._id)
          equal(body.preSaveError, false)
          equal(body.postSaveError, false)
          done()
        }
      )
    })

    it('POST /Hook 400', done => {
      post(
        {
          url: `${testUrl}/api/v1/Hook`,
          json: {
            preSaveError: true,
            postSaveError: false
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 400)
          deepEqual(body, {
            name: 'Error',
            message: 'AsyncPreSaveError'
          })
          done()
        }
      )
    })

    it('POST /Hook 400', done => {
      post(
        {
          url: `${testUrl}/api/v1/Hook`,
          json: {
            preSaveError: false,
            postSaveError: true
          }
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 400)
          deepEqual(body, {
            name: 'Error',
            message: 'AsyncPostSaveError'
          })
          done()
        }
      )
    })
  })
}
