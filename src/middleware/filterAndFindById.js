'use strict'

import { STATUS_CODES } from 'http'

export default function(model, options) {
  const errorHandler = require('../errorHandler').default(options)

  return function(req, res, next) {
    const contextModel = (req.erm && req.erm.model) || model

    if (!req.params.id) {
      return next()
    }

    options.contextFilter(contextModel, req, filteredContext => {
      filteredContext
        .findOne()
        .and({
          [options.idProperty]: req.params.id
        })
        .lean(false)
        .read(options.readPreference || 'p')
        .exec()
        .then(doc => {
          if (!doc) {
            return errorHandler(req, res, next)(new Error(STATUS_CODES[404]))
          }

          req.erm.document = doc

          next()
        }, errorHandler(req, res, next))
    })
  }
}
