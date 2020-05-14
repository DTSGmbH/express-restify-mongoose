'use strict'

import { deepEqual, equal, ok } from 'assert'
import request, { get } from 'request'
import * as erm from '../../src/express-restify-mongoose'
import dbSetup from './setup'

export default function(createFn, setup, dismantle) {
  const db = dbSetup()

  const testPort = 30023
  const testUrl = `http://localhost:${testPort}`
  const updateMethods = ['PATCH', 'POST', 'PUT']

  describe('access', () => {
    describe('private - include private and protected fields', () => {
      let app = createFn()
      let server
      let product
      let customer
      let invoice
      let account
      let repeatCustomer
      let repeatCustomerInvoice

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.RepeatCustomer, {
            private: ['job'],
            protected: ['status'],
            access: () => {
              return 'private'
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Customer, {
            private: ['age', 'favorites.animal', 'favorites.purchase.number', 'purchases.number', 'privateDoes.notExist'],
            protected: ['comment', 'favorites.color', 'protectedDoes.notExist'],
            access: (req, done) => {
              done(null, 'private')
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Invoice, {
            private: ['amount'],
            protected: ['receipt'],
            access: () => {
              return 'private'
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Product, {
            private: ['department.code'],
            protected: ['price'],
            access: () => {
              return 'private'
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Account, {
            private: ['accountNumber'],
            protected: ['points'],
            access: () => {
              return 'private'
            },
            restify: app.isRestify
          })

          db.models.Product.create({
            name: 'Bobsleigh',
            price: 42,
            department: {
              code: 51
            }
          })
            .then(createdProduct => {
              product = createdProduct

              return db.models.Customer.create({
                name: 'Bob',
                age: 12,
                comment: 'Boo',
                favorites: {
                  animal: 'Boar',
                  color: 'Black',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                },
                purchases: [
                  {
                    item: product._id,
                    number: 2
                  }
                ],
                returns: [product._id]
              })
            })
            .then(createdCustomer => {
              customer = createdCustomer

              return db.models.Invoice.create({
                customer: customer._id,
                amount: 100,
                receipt: 'A'
              })
            })
            .then(createdInvoice => {
              invoice = createdInvoice

              return db.models.Account.create({
                accountNumber: '123XYZ',
                points: 244
              })
            })
            .then(createdAccount => {
              account = createdAccount

              return db.models.RepeatCustomer.create({
                account: account._id,
                name: 'Mike',
                visits: 24,
                status: 'Awesome',
                job: 'Hunter'
              })
            })
            .then(createdRepeatCustomer => {
              repeatCustomer = createdRepeatCustomer

              return db.models.Invoice.create({
                customer: repeatCustomer._id,
                amount: 200,
                receipt: 'B'
              })
            })
            .then(createdRepeatCustomerInvoice => {
              repeatCustomerInvoice = createdRepeatCustomerInvoice
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
            equal(body.length, 2)
            equal(body[0].name, 'Bob')
            equal(body[0].age, 12)
            equal(body[0].comment, 'Boo')
            equal(body[0].purchases.length, 1)
            deepEqual(body[0].favorites, {
              animal: 'Boar',
              color: 'Black',
              purchase: {
                item: product._id.toHexString(),
                number: 1
              }
            })
            done()
          }
        )
      })

      it('GET /Customer?distinct=age 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'age'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0], 12)
            done()
          }
        )
      })

      it('GET /Customer?distinct=comment 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'comment'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0], 'Boo')
            done()
          }
        )
      })

      it('GET /Customer/:id 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            equal(body.age, 12)
            equal(body.comment, 'Boo')
            equal(body.purchases.length, 1)
            deepEqual(body.favorites, {
              animal: 'Boar',
              color: 'Black',
              purchase: {
                item: product._id.toHexString(),
                number: 1
              }
            })
            done()
          }
        )
      })

      it('GET /Customer/:id?distinct=age 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              distinct: 'age'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0], 12)
            done()
          }
        )
      })

      it('GET /Customer/:id?distinct=comment 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              distinct: 'comment'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0], 'Boo')
            done()
          }
        )
      })

      it('GET /Customer?populate=favorites.purchase.item,purchases.item,returns 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              populate: 'favorites.purchase.item,purchases.item,returns'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 2)
            equal(body[0].name, 'Bob')
            equal(body[0].age, 12)
            equal(body[0].comment, 'Boo')
            deepEqual(body[0].favorites, {
              animal: 'Boar',
              color: 'Black',
              purchase: {
                item: {
                  __v: 0,
                  _id: product._id.toHexString(),
                  name: 'Bobsleigh',
                  price: 42,
                  department: {
                    code: 51
                  }
                },
                number: 1
              }
            })
            equal(body[0].purchases.length, 1)
            ok(body[0].purchases[0].item)
            equal(body[0].purchases[0].item._id, product._id.toHexString())
            equal(body[0].purchases[0].item.name, 'Bobsleigh')
            equal(body[0].purchases[0].item.price, 42)
            deepEqual(body[0].purchases[0].item.department, {
              code: 51
            })
            equal(body[0].purchases[0].number, 2)
            equal(body[0].returns.length, 1)
            equal(body[0].returns[0].name, 'Bobsleigh')
            equal(body[0].returns[0].price, 42)
            deepEqual(body[0].returns[0].department, {
              code: 51
            })
            done()
          }
        )
      })

      it('GET /Customer/:id?populate=favorites.purchase.item,purchases.item,returns 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              populate: 'favorites.purchase.item,purchases.item,returns'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            equal(body.age, 12)
            equal(body.comment, 'Boo')
            deepEqual(body.favorites, {
              animal: 'Boar',
              color: 'Black',
              purchase: {
                item: {
                  __v: 0,
                  _id: product._id.toHexString(),
                  name: 'Bobsleigh',
                  price: 42,
                  department: {
                    code: 51
                  }
                },
                number: 1
              }
            })
            equal(body.purchases.length, 1)
            ok(body.purchases[0].item)
            equal(body.purchases[0].item._id, product._id.toHexString())
            equal(body.purchases[0].item.name, 'Bobsleigh')
            equal(body.purchases[0].item.price, 42)
            deepEqual(body.purchases[0].item.department, {
              code: 51
            })
            equal(body.purchases[0].number, 2)
            equal(body.returns.length, 1)
            equal(body.returns[0].name, 'Bobsleigh')
            equal(body.returns[0].price, 42)
            deepEqual(body.returns[0].department, {
              code: 51
            })
            done()
          }
        )
      })

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
            equal(body.length, 2)
            ok(body[0].customer)
            equal(body[0].amount, 100)
            equal(body[0].receipt, 'A')
            equal(body[0].customer.name, 'Bob')
            equal(body[0].customer.age, 12)
            equal(body[0].customer.comment, 'Boo')
            equal(body[0].customer.purchases.length, 1)
            deepEqual(body[0].customer.favorites, {
              animal: 'Boar',
              color: 'Black',
              purchase: {
                item: product._id.toHexString(),
                number: 1
              }
            })
            done()
          }
        )
      })

      it('GET /Invoice/:id?populate=customer 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice/${invoice._id}`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.customer)
            equal(body.amount, 100)
            equal(body.receipt, 'A')
            equal(body.customer.name, 'Bob')
            equal(body.customer.age, 12)
            equal(body.customer.comment, 'Boo')
            equal(body.customer.purchases.length, 1)
            deepEqual(body.customer.favorites, {
              animal: 'Boar',
              color: 'Black',
              purchase: {
                item: product._id.toHexString(),
                number: 1
              }
            })
            done()
          }
        )
      })

      updateMethods.forEach(method => {
        it(`${method} /Customer/:id - saves all fields`, done => {
          request(
            {
              method,
              url: `${testUrl}/api/v1/Customer/${customer._id}`,
              json: {
                name: 'John',
                age: 24,
                comment: 'Jumbo',
                favorites: {
                  animal: 'Jaguar',
                  color: 'Jade',
                  purchase: {
                    number: 2
                  }
                }
              }
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.name, 'John')
              equal(body.age, 24)
              equal(body.comment, 'Jumbo')
              equal(body.purchases.length, 1)
              deepEqual(body.favorites, {
                animal: 'Jaguar',
                color: 'Jade',
                purchase: {
                  item: product._id.toHexString(),
                  number: 2
                }
              })
              done()
            }
          )
        })

        it(`${method} /Customer/:id - saves all fields (falsy values)`, done => {
          request(
            {
              method,
              url: `${testUrl}/api/v1/Customer/${customer._id}`,
              json: {
                age: 0,
                comment: '',
                favorites: {
                  animal: '',
                  color: '',
                  purchase: {
                    number: 0
                  }
                }
              }
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.name, 'Bob')
              equal(body.age, 0)
              equal(body.comment, '')
              equal(body.purchases.length, 1)
              deepEqual(body.favorites, {
                animal: '',
                color: '',
                purchase: {
                  item: product._id.toHexString(),
                  number: 0
                }
              })
              done()
            }
          )
        })
      })

      it('GET /RepeatCustomer 200 - discriminator', done => {
        get(
          {
            url: `${testUrl}/api/v1/RepeatCustomer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0].account, account._id.toHexString())
            equal(body[0].name, 'Mike')
            equal(body[0].visits, 24)
            equal(body[0].status, 'Awesome')
            equal(body[0].job, 'Hunter')
            done()
          }
        )
      })

      it('GET /RepeatCustomer/:id?populate=account 200 - populate discriminator field from base schema', done => {
        get(
          {
            url: `${testUrl}/api/v1/RepeatCustomer/${repeatCustomer._id}`,
            qs: {
              populate: 'account'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.account)
            equal(body.account._id, account._id.toHexString())
            equal(body.account.accountNumber, '123XYZ')
            equal(body.account.points, 244)
            equal(body.name, 'Mike')
            equal(body.visits, 24)
            equal(body.status, 'Awesome')
            equal(body.job, 'Hunter')
            done()
          }
        )
      })

      it('GET /Invoice/:id?populate=customer 200 - populated discriminator', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice/${repeatCustomerInvoice._id}`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.customer)
            equal(body.amount, 200)
            equal(body.receipt, 'B')
            equal(body.customer.name, 'Mike')
            equal(body.customer.visits, 24)
            equal(body.customer.status, 'Awesome')
            equal(body.customer.job, 'Hunter')
            done()
          }
        )
      })
    })

    describe('protected - exclude private fields and include protected fields', () => {
      let app = createFn()
      let server
      let product
      let customer
      let invoice
      let account
      let repeatCustomer
      let repeatCustomerInvoice

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.RepeatCustomer, {
            private: ['job'],
            protected: ['status'],
            access: () => {
              return 'protected'
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Customer, {
            private: ['age', 'favorites.animal', 'favorites.purchase.number', 'purchases.number', 'privateDoes.notExist'],
            protected: ['comment', 'favorites.color', 'protectedDoes.notExist'],
            access: (req, done) => {
              done(null, 'protected')
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Invoice, {
            private: ['amount'],
            protected: ['receipt'],
            access: () => {
              return 'protected'
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Product, {
            private: ['department.code'],
            protected: ['price'],
            access: () => {
              return 'protected'
            },
            restify: app.isRestify
          })

          erm.serve(app, db.models.Account, {
            private: ['accountNumber'],
            protected: ['points'],
            access: () => {
              return 'protected'
            },
            restify: app.isRestify
          })

          db.models.Product.create({
            name: 'Bobsleigh',
            price: 42,
            department: {
              code: 51
            }
          })
            .then(createdProduct => {
              product = createdProduct

              return db.models.Customer.create({
                name: 'Bob',
                age: 12,
                comment: 'Boo',
                favorites: {
                  animal: 'Boar',
                  color: 'Black',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                },
                purchases: [
                  {
                    item: product._id,
                    number: 2
                  }
                ],
                returns: [product._id]
              })
            })
            .then(createdCustomer => {
              customer = createdCustomer

              return db.models.Invoice.create({
                customer: customer._id,
                amount: 100,
                receipt: 'A'
              })
            })
            .then(createdInvoice => {
              invoice = createdInvoice

              return db.models.Account.create({
                accountNumber: '123XYZ',
                points: 244
              })
            })
            .then(createdAccount => {
              account = createdAccount

              return db.models.RepeatCustomer.create({
                account: account._id,
                name: 'Mike',
                visits: 24,
                status: 'Awesome',
                job: 'Hunter'
              })
            })
            .then(createdRepeatCustomer => {
              repeatCustomer = createdRepeatCustomer

              return db.models.Invoice.create({
                customer: repeatCustomer._id,
                amount: 200,
                receipt: 'B'
              })
            })
            .then(createdRepeatCustomerInvoice => {
              repeatCustomerInvoice = createdRepeatCustomerInvoice
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
            equal(body.length, 2)
            equal(body[0].name, 'Bob')
            equal(body[0].age, undefined)
            equal(body[0].comment, 'Boo')
            deepEqual(body[0].favorites, {
              color: 'Black',
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      it('GET /Customer?distinct=age 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'age'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 0)
            done()
          }
        )
      })

      it('GET /Customer?distinct=comment 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'comment'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0], 'Boo')
            done()
          }
        )
      })

      it('GET /Customer/:id 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            equal(body.age, undefined)
            equal(body.comment, 'Boo')
            deepEqual(body.favorites, {
              color: 'Black',
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      it('GET /Customer/:id?distinct=age 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              distinct: 'age'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 0)
            done()
          }
        )
      })

      it('GET /Customer/:id?distinct=comment 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              distinct: 'comment'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 1)
            equal(body[0], 'Boo')
            done()
          }
        )
      })

      it('GET /Customer?populate=favorites.purchase.item,purchases.item,returns 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              populate: 'favorites.purchase.item,purchases.item,returns'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 2)
            equal(body[0].name, 'Bob')
            equal(body[0].age, undefined)
            equal(body[0].comment, 'Boo')
            deepEqual(body[0].favorites, {
              color: 'Black',
              purchase: {
                item: {
                  __v: 0,
                  _id: product._id.toHexString(),
                  name: 'Bobsleigh',
                  price: 42,
                  department: {}
                }
              }
            })
            equal(body[0].purchases.length, 1)
            ok(body[0].purchases[0].item)
            equal(body[0].purchases[0].item._id, product._id.toHexString())
            equal(body[0].purchases[0].item.name, 'Bobsleigh')
            equal(body[0].purchases[0].item.price, 42)
            deepEqual(body[0].purchases[0].item.department, {})
            equal(body[0].purchases[0].number, undefined)
            equal(body[0].returns.length, 1)
            equal(body[0].returns[0].name, 'Bobsleigh')
            equal(body[0].returns[0].price, 42)
            deepEqual(body[0].returns[0].department, {})
            done()
          }
        )
      })

      it('GET /Customer/:id?populate=favorites.purchase.item,purchases.item,returns 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              populate: 'favorites.purchase.item,purchases.item,returns'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            equal(body.age, undefined)
            equal(body.comment, 'Boo')
            deepEqual(body.favorites, {
              color: 'Black',
              purchase: {
                item: {
                  __v: 0,
                  _id: product._id.toHexString(),
                  name: 'Bobsleigh',
                  price: 42,
                  department: {}
                }
              }
            })
            equal(body.purchases.length, 1)
            ok(body.purchases[0].item)
            equal(body.purchases[0].item._id, product._id.toHexString())
            equal(body.purchases[0].item.name, 'Bobsleigh')
            equal(body.purchases[0].item.price, 42)
            deepEqual(body.purchases[0].item.department, {})
            equal(body.purchases[0].number, undefined)
            equal(body.returns.length, 1)
            equal(body.returns[0].name, 'Bobsleigh')
            equal(body.returns[0].price, 42)
            deepEqual(body.returns[0].department, {})
            done()
          }
        )
      })

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
            equal(body.length, 2)
            ok(body[0].customer)
            equal(body[0].amount, undefined)
            equal(body[0].receipt, 'A')
            equal(body[0].customer.name, 'Bob')
            equal(body[0].customer.age, undefined)
            equal(body[0].customer.comment, 'Boo')
            deepEqual(body[0].customer.favorites, {
              color: 'Black',
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      it('GET /Invoice/:id?populate=customer 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice/${invoice._id}`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.customer)
            equal(body.amount, undefined)
            equal(body.receipt, 'A')
            equal(body.customer.name, 'Bob')
            equal(body.customer.age, undefined)
            equal(body.customer.comment, 'Boo')
            deepEqual(body.customer.favorites, {
              color: 'Black',
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      updateMethods.forEach(method => {
        it(`${method} /Customer/:id - saves protected and public fields`, done => {
          request(
            {
              method,
              url: `${testUrl}/api/v1/Customer/${customer._id}`,
              json: {
                name: 'John',
                age: 24,
                comment: 'Jumbo',
                favorites: {
                  animal: 'Jaguar',
                  color: 'Jade',
                  purchase: {
                    number: 2
                  }
                }
              }
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.name, 'John')
              equal(body.age, undefined)
              equal(body.comment, 'Jumbo')
              deepEqual(body.favorites, {
                color: 'Jade',
                purchase: {
                  item: product._id.toHexString()
                }
              })

              db.models.Customer.findById(customer._id, (err, customer) => {
                ok(!err)
                equal(customer.age, 12)
                deepEqual(customer.favorites.toObject(), {
                  animal: 'Boar',
                  color: 'Jade',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                })
                done()
              })
            }
          )
        })

        it(`${method} /Customer/:id - saves protected and public fields (falsy values)`, done => {
          request(
            {
              method,
              url: `${testUrl}/api/v1/Customer/${customer._id}`,
              json: {
                age: 0,
                comment: '',
                favorites: {
                  animal: '',
                  color: '',
                  purchase: {
                    number: 0
                  }
                }
              }
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.name, 'Bob')
              equal(body.age, undefined)
              equal(body.comment, '')
              deepEqual(body.favorites, {
                color: '',
                purchase: {
                  item: product._id.toHexString()
                }
              })

              db.models.Customer.findById(customer._id, (err, customer) => {
                ok(!err)
                equal(customer.age, 12)
                deepEqual(customer.favorites.toObject(), {
                  animal: 'Boar',
                  color: '',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                })
                done()
              })
            }
          )
        })
      })

      it('GET /RepeatCustomer 200 - discriminator', done => {
        get(
          {
            url: `${testUrl}/api/v1/RepeatCustomer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body[0].name, 'Mike')
            equal(body[0].visits, 24)
            equal(body[0].status, 'Awesome')
            equal(body[0].job, undefined)
            done()
          }
        )
      })

      it('GET /RepeatCustomer/:id?populate=account 200 - populate discriminator field from base schema', done => {
        get(
          {
            url: `${testUrl}/api/v1/RepeatCustomer/${repeatCustomer._id}`,
            qs: {
              populate: 'account'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.account)
            equal(body.account._id, account._id.toHexString())
            equal(body.account.accountNumber, undefined)
            equal(body.account.points, 244)
            equal(body.name, 'Mike')
            equal(body.visits, 24)
            equal(body.status, 'Awesome')
            equal(body.job, undefined)
            done()
          }
        )
      })

      it('GET /Invoice/:id?populate=customer 200 - populated discriminator', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice/${repeatCustomerInvoice._id}`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.customer)
            equal(body.amount, undefined)
            equal(body.receipt, 'B')
            equal(body.customer.name, 'Mike')
            equal(body.customer.visits, 24)
            equal(body.customer.status, 'Awesome')
            equal(body.customer.job, undefined)
            done()
          }
        )
      })
    })

    describe('public - exclude private and protected fields', () => {
      let app = createFn()
      let server
      let product
      let customer
      let invoice
      let account
      let repeatCustomer
      let repeatCustomerInvoice

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.RepeatCustomer, {
            private: ['job'],
            protected: ['status'],
            restify: app.isRestify
          })

          erm.serve(app, db.models.Customer, {
            private: ['age', 'favorites.animal', 'favorites.purchase.number', 'purchases.number', 'privateDoes.notExist'],
            protected: ['comment', 'favorites.color', 'protectedDoes.notExist'],
            restify: app.isRestify
          })

          erm.serve(app, db.models.Invoice, {
            private: ['amount'],
            protected: ['receipt'],
            restify: app.isRestify
          })

          erm.serve(app, db.models.Product, {
            private: ['department.code'],
            protected: ['price'],
            restify: app.isRestify
          })

          erm.serve(app, db.models.Account, {
            private: ['accountNumber'],
            protected: ['points'],
            restify: app.isRestify
          })

          db.models.Product.create({
            name: 'Bobsleigh',
            price: 42,
            department: {
              code: 51
            }
          })
            .then(createdProduct => {
              product = createdProduct

              return db.models.Customer.create({
                name: 'Bob',
                age: 12,
                comment: 'Boo',
                favorites: {
                  animal: 'Boar',
                  color: 'Black',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                },
                purchases: [
                  {
                    item: product._id,
                    number: 2
                  }
                ],
                returns: [product._id]
              })
            })
            .then(createdCustomer => {
              customer = createdCustomer

              return db.models.Invoice.create({
                customer: customer._id,
                amount: 100,
                receipt: 'A'
              })
            })
            .then(createdInvoice => {
              invoice = createdInvoice

              return db.models.Account.create({
                accountNumber: '123XYZ',
                points: 244
              })
            })
            .then(createdAccount => {
              account = createdAccount

              return db.models.RepeatCustomer.create({
                account: account._id,
                name: 'Mike',
                visits: 24,
                status: 'Awesome',
                job: 'Hunter'
              })
            })
            .then(createdRepeatCustomer => {
              repeatCustomer = createdRepeatCustomer

              return db.models.Invoice.create({
                customer: repeatCustomer._id,
                amount: 200,
                receipt: 'B'
              })
            })
            .then(createdRepeatCustomerInvoice => {
              repeatCustomerInvoice = createdRepeatCustomerInvoice
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
            equal(body.length, 2)
            equal(body[0].name, 'Bob')
            equal(body[0].age, undefined)
            equal(body[0].comment, undefined)
            equal(body[0].purchases.length, 1)
            deepEqual(body[0].favorites, {
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      it('GET /Customer?distinct=age 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'age'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 0)
            done()
          }
        )
      })

      it('GET /Customer?distinct=comment 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              distinct: 'comment'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 0)
            done()
          }
        )
      })

      it('GET /Customer/:id 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            equal(body.age, undefined)
            equal(body.comment, undefined)
            equal(body.purchases.length, 1)
            deepEqual(body.favorites, {
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      it('GET /Customer/:id?distinct=age 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              distinct: 'age'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 0)
            done()
          }
        )
      })

      it('GET /Customer/:id?distinct=comment 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              distinct: 'comment'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 0)
            done()
          }
        )
      })

      it('GET /Customer?populate=favorites.purchase.item,purchases.item,returns 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            qs: {
              populate: 'favorites.purchase.item,purchases.item,returns'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.length, 2)
            equal(body[0].name, 'Bob')
            equal(body[0].age, undefined)
            equal(body[0].comment, undefined)
            deepEqual(body[0].favorites, {
              purchase: {
                item: {
                  __v: 0,
                  _id: product._id.toHexString(),
                  name: 'Bobsleigh',
                  department: {}
                }
              }
            })
            equal(body[0].purchases.length, 1)
            ok(body[0].purchases[0].item)
            equal(body[0].purchases[0].item._id, product._id.toHexString())
            equal(body[0].purchases[0].item.name, 'Bobsleigh')
            equal(body[0].purchases[0].item.price, undefined)
            deepEqual(body[0].purchases[0].item.department, {})
            equal(body[0].purchases[0].number, undefined)
            equal(body[0].returns.length, 1)
            equal(body[0].returns[0].name, 'Bobsleigh')
            equal(body[0].returns[0].price, undefined)
            deepEqual(body[0].returns[0].department, {})
            done()
          }
        )
      })

      it('GET /Customer/:id?populate=favorites.purchase.item,purchases.item,returns 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer/${customer._id}`,
            qs: {
              populate: 'favorites.purchase.item,purchases.item,returns'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body.name, 'Bob')
            equal(body.age, undefined)
            equal(body.comment, undefined)
            deepEqual(body.favorites, {
              purchase: {
                item: {
                  __v: 0,
                  _id: product._id.toHexString(),
                  name: 'Bobsleigh',
                  department: {}
                }
              }
            })
            equal(body.purchases.length, 1)
            ok(body.purchases[0].item)
            equal(body.purchases[0].item._id, product._id.toHexString())
            equal(body.purchases[0].item.name, 'Bobsleigh')
            equal(body.purchases[0].item.price, undefined)
            deepEqual(body.purchases[0].item.department, {})
            equal(body.purchases[0].number, undefined)
            equal(body.returns.length, 1)
            equal(body.returns[0].name, 'Bobsleigh')
            equal(body.returns[0].price, undefined)
            deepEqual(body.returns[0].department, {})
            done()
          }
        )
      })

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
            equal(body.length, 2)
            ok(body[0].customer)
            equal(body[0].amount, undefined)
            equal(body[0].receipt, undefined)
            equal(body[0].customer.name, 'Bob')
            equal(body[0].customer.age, undefined)
            equal(body[0].customer.comment, undefined)
            deepEqual(body[0].customer.favorites, {
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      it('GET /Invoice/:id?populate=customer 200', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice/${invoice._id}`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.customer)
            equal(body.amount, undefined)
            equal(body.receipt, undefined)
            equal(body.customer.name, 'Bob')
            equal(body.customer.age, undefined)
            equal(body.customer.comment, undefined)
            deepEqual(body.customer.favorites, {
              purchase: {
                item: product._id.toHexString()
              }
            })
            done()
          }
        )
      })

      updateMethods.forEach(method => {
        it(`${method} /Customer/:id - saves public fields`, done => {
          request(
            {
              method,
              url: `${testUrl}/api/v1/Customer/${customer._id}`,
              json: {
                name: 'John',
                age: 24,
                comment: 'Jumbo',
                favorites: {
                  animal: 'Jaguar',
                  color: 'Jade',
                  purchase: {
                    number: 2
                  }
                }
              }
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.name, 'John')
              equal(body.age, undefined)
              equal(body.comment, undefined)
              deepEqual(body.favorites, {
                purchase: {
                  item: product._id.toHexString()
                }
              })

              db.models.Customer.findById(customer._id, (err, customer) => {
                ok(!err)
                equal(customer.age, 12)
                equal(customer.comment, 'Boo')
                deepEqual(customer.favorites.toObject(), {
                  animal: 'Boar',
                  color: 'Black',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                })
                done()
              })
            }
          )
        })

        it(`${method} /Customer/:id - saves public fields (falsy values)`, done => {
          request(
            {
              method,
              url: `${testUrl}/api/v1/Customer/${customer._id}`,
              json: {
                age: 0,
                comment: '',
                favorites: {
                  animal: '',
                  color: '',
                  purchase: {
                    number: 0
                  }
                }
              }
            },
            (err, res, body) => {
              ok(!err)
              equal(res.statusCode, 200)
              equal(body.name, 'Bob')
              equal(body.age, undefined)
              equal(body.comment, undefined)
              deepEqual(body.favorites, {
                purchase: {
                  item: product._id.toHexString()
                }
              })

              db.models.Customer.findById(customer._id, (err, customer) => {
                ok(!err)
                equal(customer.age, 12)
                equal(customer.comment, 'Boo')
                deepEqual(customer.favorites.toObject(), {
                  animal: 'Boar',
                  color: 'Black',
                  purchase: {
                    item: product._id,
                    number: 1
                  }
                })
                done()
              })
            }
          )
        })
      })

      it('GET /RepeatCustomer 200 - discriminator', done => {
        get(
          {
            url: `${testUrl}/api/v1/RepeatCustomer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            equal(body[0].name, 'Mike')
            equal(body[0].visits, 24)
            equal(body[0].status, undefined)
            equal(body[0].job, undefined)
            done()
          }
        )
      })

      it('GET /RepeatCustomer/:id?populate=account 200 - populate discriminator field from base schema', done => {
        get(
          {
            url: `${testUrl}/api/v1/RepeatCustomer/${repeatCustomer._id}`,
            qs: {
              populate: 'account'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.account)
            equal(body.account._id, account._id.toHexString())
            equal(body.account.accountNumber, undefined)
            equal(body.account.points, undefined)
            equal(body.name, 'Mike')
            equal(body.visits, 24)
            equal(body.status, undefined)
            equal(body.job, undefined)
            done()
          }
        )
      })

      it('GET /Invoice/:id?populate=customer 200 - populated discriminator', done => {
        get(
          {
            url: `${testUrl}/api/v1/Invoice/${repeatCustomerInvoice._id}`,
            qs: {
              populate: 'customer'
            },
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 200)
            ok(body.customer)
            equal(body.amount, undefined)
            equal(body.receipt, undefined)
            equal(body.customer.name, 'Mike')
            equal(body.customer.visits, 24)
            equal(body.customer.status, undefined)
            equal(body.customer.job, undefined)
            done()
          }
        )
      })
    })

    describe('yields an error', () => {
      let app = createFn()
      let server

      beforeEach(done => {
        setup(err => {
          if (err) {
            return done(err)
          }

          erm.serve(app, db.models.Customer, {
            access: (req, done) => {
              let err = new Error('Something went wrong')
              done(err)
            },
            restify: app.isRestify
          })

          server = app.listen(testPort, done)
        })
      })

      afterEach(done => {
        dismantle(app, server, done)
      })

      it('GET /Customer 500', done => {
        get(
          {
            url: `${testUrl}/api/v1/Customer`,
            json: true
          },
          (err, res, body) => {
            ok(!err)
            equal(res.statusCode, 400)
            deepEqual(body, {
              name: 'Error',
              message: 'Something went wrong'
            })
            done()
          }
        )
      })
    })
  })
}
