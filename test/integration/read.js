'use strict'

import { deepEqual, equal, ok } from 'assert'
import mongoose from 'mongoose'
import { get } from 'request'
import * as erm from '../../src/express-restify-mongoose'
import dbSetup from './setup'

export default function(createFn, setup, dismantle) {
  const db = dbSetup()

  const testPort = 30023
  const testUrl = `http://localhost:${testPort}`
  const invalidId = 'invalid-id'
  const randomId = mongoose.Types.ObjectId().toHexString()

  describe('Read documents', () => {
    let app = createFn()
    let server
    let customers

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

        db.models.Product.create({
          name: 'Bobsleigh'
        })
          .then(createdProduct => {
            return db.models.Customer.create([
              {
                name: 'Bob',
                age: 12,
                favorites: {
                  animal: 'Boar',
                  color: 'Black',
                  purchase: {
                    item: createdProduct._id,
                    number: 1
                  }
                },
                coordinates: [45.2667, 72.15]
              },
              {
                name: 'John',
                age: 24,
                favorites: {
                  animal: 'Jaguar',
                  color: 'Jade',
                  purchase: {
                    item: createdProduct._id,
                    number: 2
                  }
                }
              },
              {
                name: 'Mike',
                age: 36,
                favorites: {
                  animal: 'Medusa',
                  color: 'Maroon',
                  purchase: {
                    item: createdProduct._id,
                    number: 3
                  }
                }
              }
            ])
          })
          .then(createdCustomers => {
            customers = createdCustomers

            return db.models.Invoice.create([
              {
                customer: customers[0]._id,
                amount: 100,
                receipt: 'A'
              },
              {
                customer: customers[1]._id,
                amount: 200,
                receipt: 'B'
              },
              {
                customer: customers[2]._id,
                amount: 300,
                receipt: 'C'
              }
            ])
          })
          .then(createdInvoices => {
            server = app.listen(testPort, done)
          })
          .catch(done)
      })
    })

    afterEach(done => {
      dismantle(app, server, done)
    })

    it('GET /Customer 200', done => {
      get(
        {
          url: `${testUrl}/api/v1/Customer`,
          json: true
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 200)
          equal(body.length, 3)
          done()
        }
      )
    })

    it('GET /Customer/:id 200 - created id', done => {
      get(
        {
          url: `${testUrl}/api/v1/Customer/${customers[0]._id}`,
          json: true
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 200)
          equal(body.name, 'Bob')
          done()
        }
      )
    })

    it('GET /Customer/:id 404 - invalid id', done => {
      get(
        {
          url: `${testUrl}/api/v1/Customer/${invalidId}`,
          json: true
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 404)
          done()
        }
      )
    })

    it('GET /Customer/:id 404 - random id', done => {
      get(
        {
          url: `${testUrl}/api/v1/Customer/${randomId}`,
          json: true
        },
        (err, res, body) => {
          ok(!err)
          equal(res.statusCode, 404)
          done()
        }
      )
    })

    describe('ignore unknown parameters', () => {
      it('GET /Customer?foo=bar 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              foo: 'bar'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            done()
          }
        )
      })
    })

    describe('limit', () => {
      it('GET /Customer?limit=1 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              limit: 1
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            done()
          }
        )
      })

      it('GET /Customer?limit=foo 400 - evaluates to NaN', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              limit: 'foo'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 400)
            deepEqual(body, {
              name: 'Error',
              message: 'invalid_limit_value'
            })
            done()
          }
        )
      })
    })

    describe('skip', () => {
      it('GET /Customer?skip=1 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              skip: 1
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 2)
            done()
          }
        )
      })

      it('GET /Customer?skip=foo 400 - evaluates to NaN', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              skip: 'foo'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 400)
            deepEqual(body, {
              name: 'Error',
              message: 'invalid_skip_value'
            })
            done()
          }
        )
      })
    })

    describe('sort', () => {
      it('GET /Customer?sort=name 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              sort: 'name'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            equal(body[0].name, 'Bob')
            equal(body[1].name, 'John')
            equal(body[2].name, 'Mike')
            done()
          }
        )
      })

      it('GET /Customer?sort=-name 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              sort: '-name'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            equal(body[0].name, 'Mike')
            equal(body[1].name, 'John')
            equal(body[2].name, 'Bob')
            done()
          }
        )
      })

      it('GET /Customer?sort={"name":1} 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              sort: {
                name: 1
              }
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            equal(body[0].name, 'Bob')
            equal(body[1].name, 'John')
            equal(body[2].name, 'Mike')
            done()
          }
        )
      })

      it('GET /Customer?sort={"name":-1} 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              sort: {
                name: -1
              }
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            equal(body[0].name, 'Mike')
            equal(body[1].name, 'John')
            equal(body[2].name, 'Bob')
            done()
          }
        )
      })
    })

    describe('query', () => {
      it('GET /Customer?query={} 200 - empty object', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              query: JSON.stringify({})
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            done()
          }
        )
      })

      it('GET /Customer?query={"$near": { "$geometry": { "coordinates": [45.2667, 72.1500] } }} 200 - coordinates', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              query: JSON.stringify({
                coordinates: {
                  $near: {
                    $geometry: {
                      type: 'Point',
                      coordinates: [45.2667, 72.15]
                    },
                    $maxDistance: 1000
                  }
                }
              })
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            done()
          }
        )
      })

      it('GET /Customer?query=invalidJson 400 - invalid json', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              query: 'invalidJson'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 400)
            deepEqual(body, {
              name: 'Error',
              message: 'invalid_json_query'
            })
            done()
          }
        )
      })

      describe('string', () => {
        it('GET /Customer?query={"name":"John"} 200 - exact match', done => {
          get(
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
              equal(res.statusCode, 200)
              equal(body.length, 1)
              equal(body[0].name, 'John')
              done()
            }
          )
        })

        it('GET /Customer?query={"favorites.animal":"Jaguar"} 200 - exact match (nested property)', done => {
          get(
            {
              url: `${testUrl}/api/v1/Customer`,
              qs: {
                query: JSON.stringify({
                  'favorites.animal': 'Jaguar'
                })
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 1)
              equal(body[0].favorites.animal, 'Jaguar')
              done()
            }
          )
        })

        it('GET /Customer?query={"name":{"$regex":"^J"}} 200 - name starting with', done => {
          get(
            {
              url: `${testUrl}/api/v1/Customer`,
              qs: {
                query: JSON.stringify({
                  name: { $regex: '^J' }
                })
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 1)
              ok(body[0].name[0] === 'J')
              done()
            }
          )
        })

        it('GET /Customer?query={"name":["Bob","John"]}&sort=name 200 - in', done => {
          get(
            {
              url: `${testUrl}/api/v1/Customer`,
              qs: {
                query: JSON.stringify({
                  name: ['Bob', 'John']
                }),
                sort: 'name'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 2)
              equal(body[0].name, 'Bob')
              equal(body[1].name, 'John')
              done()
            }
          )
        })
      })

      describe('number', () => {
        it('GET /Customer?query={"age":"24"} 200 - exact match', done => {
          get(
            {
              url: `${testUrl}/api/v1/Customer`,
              qs: {
                query: JSON.stringify({
                  age: 24
                })
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 1)
              equal(body[0].age, 24)
              done()
            }
          )
        })

        it('GET /Customer?query={"age":["12","24"]}&sort=age 200 - in', done => {
          get(
            {
              url: `${testUrl}/api/v1/Customer`,
              qs: {
                query: JSON.stringify({
                  age: ['12', '24']
                }),
                sort: 'age'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 2)
              equal(body[0].age, 12)
              equal(body[1].age, 24)
              done()
            }
          )
        })
      })
    })

    describe('select', () => {
      it('GET /Customer?select=["name"] 200 - only include', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              select: ['name']
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(item => {
              equal(Object.keys(item).length, 2)
              ok(item._id)
              ok(item.name)
            })
            done()
          }
        )
      })

      it('GET /Customer?select=name 200 - only include', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              select: 'name'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(item => {
              equal(Object.keys(item).length, 2)
              ok(item._id)
              ok(item.name)
            })
            done()
          }
        )
      })

      it('GET /Customer?select=favorites.animal 200 - only include (nested field)', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              select: 'favorites.animal'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(item => {
              equal(Object.keys(item).length, 2)
              ok(item._id)
              ok(item.favorites)
              ok(item.favorites.animal)
              ok(item.favorites.color === undefined)
            })
            done()
          }
        )
      })

      it('GET /Customer?select=-name 200 - exclude name', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              select: '-name'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(item => {
              ok(item.name === undefined)
            })
            done()
          }
        )
      })

      it('GET /Customer?select={"name":1} 200 - only include name', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              select: JSON.stringify({
                name: 1
              })
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(item => {
              equal(Object.keys(item).length, 2)
              ok(item._id)
              ok(item.name)
            })
            done()
          }
        )
      })

      it('GET /Customer?select={"name":0} 200 - exclude name', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              select: JSON.stringify({
                name: 0
              })
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(item => {
              ok(item.name === undefined)
            })
            done()
          }
        )
      })
    })

    describe('populate', () => {
      it('GET /Invoice?populate=customer 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(invoice => {
              ok(invoice.customer)
              ok(invoice.customer._id)
              ok(invoice.customer.name)
              ok(invoice.customer.age)
            })
            done()
          }
        )
      })

      it('GET /Invoice?populate={path:"customer"} 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice`,
            qs: {
              populate: JSON.stringify({
                path: 'customer'
              })
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(invoice => {
              ok(invoice.customer)
              ok(invoice.customer._id)
              ok(invoice.customer.name)
              ok(invoice.customer.age)
            })
            done()
          }
        )
      })

      it('GET /Invoice?populate=[{path:"customer"}] 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice`,
            qs: {
              populate: JSON.stringify([
                {
                  path: 'customer'
                }
              ])
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(invoice => {
              ok(invoice.customer)
              ok(invoice.customer._id)
              ok(invoice.customer.name)
              ok(invoice.customer.age)
            })
            done()
          }
        )
      })

      it('GET /Customer?populate=favorites.purchase.item 200 - nested field', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              populate: 'favorites.purchase.item'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(customer => {
              ok(customer.favorites.purchase)
              ok(customer.favorites.purchase.item)
              ok(customer.favorites.purchase.item._id)
              ok(customer.favorites.purchase.item.name)
              ok(customer.favorites.purchase.number)
            })
            done()
          }
        )
      })

      it('GET /Invoice?populate=customer.account 200 - ignore deep populate', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice`,
            qs: {
              populate: 'customer.account'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            body.forEach(invoice => {
              ok(invoice.customer)
              equal(typeof invoice.customer, 'string')
            })
            done()
          }
        )
      })

      it('GET /Invoice?populate=evilCustomer 200 - ignore unknown field', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice`,
            qs: {
              populate: 'evilCustomer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            done()
          }
        )
      })

      describe('with select', () => {
        it('GET Invoices?populate=customer&select=amount 200 - only include amount and customer document', done => {
          get(
            {
              url: `${testUrl}/api/v1/Invoice`,
              qs: {
                populate: 'customer',
                select: 'amount'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 3)
              body.forEach(invoice => {
                ok(invoice.amount)
                ok(invoice.customer)
                ok(invoice.customer._id)
                ok(invoice.customer.name)
                ok(invoice.customer.age)
                equal(invoice.receipt, undefined)
              })
              done()
            }
          )
        })

        it('GET Invoices?populate=customer&select=amount,customer.name 200 - only include amount and customer name', done => {
          get(
            {
              url: `${testUrl}/api/v1/Invoice`,
              qs: {
                populate: 'customer',
                select: 'amount,customer.name'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 3)
              body.forEach(invoice => {
                ok(invoice.amount)
                ok(invoice.customer)
                ok(invoice.customer._id)
                ok(invoice.customer.name)
                equal(invoice.customer.age, undefined)
                equal(invoice.receipt, undefined)
              })
              done()
            }
          )
        })

        it('GET Invoices?populate=customer&select=customer.name 200 - include all invoice fields, but only include customer name', done => {
          get(
            {
              url: `${testUrl}/api/v1/Invoice`,
              qs: {
                populate: 'customer',
                select: 'customer.name'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 3)
              body.forEach(invoice => {
                ok(invoice.amount)
                ok(invoice.receipt)
                ok(invoice.customer)
                ok(invoice.customer._id)
                ok(invoice.customer.name)
                equal(invoice.customer.age, undefined)
              })
              done()
            }
          )
        })

        it('GET Invoices?populate=customer&select=-customer.name 200 - include all invoice and fields, but exclude customer name', done => {
          get(
            {
              url: `${testUrl}/api/v1/Invoice`,
              qs: {
                populate: 'customer',
                select: '-customer.name'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 3)
              body.forEach(invoice => {
                ok(invoice.amount)
                ok(invoice.receipt)
                ok(invoice.customer)
                ok(invoice.customer._id)
                ok(invoice.customer.age)
                equal(invoice.customer.name, undefined)
              })
              done()
            }
          )
        })

        it('GET Invoices?populate=customer&select=amount,-customer.-id,customer.name 200 - only include amount and customer name and exclude customer _id', done => {
          get(
            {
              url: `${testUrl}/api/v1/Invoice`,
              qs: {
                populate: 'customer',
                select: 'amount,-customer._id,customer.name'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 3)
              body.forEach(invoice => {
                ok(invoice.amount)
                ok(invoice.customer)
                ok(invoice.customer.name)
                equal(invoice.receipt, undefined)
                equal(invoice.customer._id, undefined)
                equal(invoice.customer.age, undefined)
              })
              done()
            }
          )
        })

        it('GET Invoices?populate=customer&select=customer.name,customer.age 200 - only include customer name and age', done => {
          get(
            {
              url: `${testUrl}/api/v1/Invoice`,
              qs: {
                populate: 'customer',
                select: 'customer.name,customer.age'
              },
              json: true
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.length, 3)
              body.forEach(invoice => {
                ok(invoice.amount)
                ok(invoice.receipt)
                ok(invoice.customer)
                ok(invoice.customer._id)
                ok(invoice.customer.name)
                ok(invoice.customer.age)
              })
              done()
            }
          )
        })
      })
    })

    describe('distinct', () => {
      it('GET /Customer?distinct=name 200 - array of unique names', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'name'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 3)
            equal(body[0], 'Bob')
            equal(body[1], 'John')
            equal(body[2], 'Mike')
            done()
          }
        )
      })
    })

    describe('count', () => {
      it('GET /Customer/count 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/count`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.count, 3)
            done()
          }
        )
      })

      it('GET /Customer/count 200 - ignores sort', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/count`,
            qs: {
              sort: {
                _id: 1
              }
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.count, 3)
            done()
          }
        )
      })
    })

    describe('shallow', () => {
      it('GET /Customer/:id/shallow 200 - created id', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customers[0]._id}/shallow`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            done()
          }
        )
      })

      it('GET /Customer/:id/shallow 404 - invalid id', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${invalidId}/shallow`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 404)
            done()
          }
        )
      })

      it('GET /Customer/:id/shallow 404 - random id', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${randomId}/shallow`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 404)
            done()
          }
        )
      })
    })
  })
}
