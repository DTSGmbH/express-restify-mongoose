'use strict'

import { STATUS_CODES } from 'http'

export default function(options) {
  return function(req, res, next) {
    return function(err) {
      if (err.message === STATUS_CODES[404] || (req.params.id && err.path === options.idProperty && err.name === 'CastError')) {
        req.erm.statusCode = 404
      } else {
        req.erm.statusCode = req.erm.statusCode && req.erm.statusCode >= 400 ? req.erm.statusCode : 400
      }

      options.onError(err, req, res, next)
    }
  }
}
