const request = require("request-promise")

class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject)=> {
      this.reject = reject
      this.resolve = resolve
    })
  }
}

const MAX_REQUEST_CONCURRENCE = 5
let concurrence = 0
let penddingRequests = []

const makeRequest = function(options) {
  if (concurrence < MAX_REQUEST_CONCURRENCE) {
    concurrence++

    return request(options).then(function(resp) {
      concurrence--

      if (penddingRequests.length) {
        deferredRequest = penddingRequests.pop()

        deferredRequest()
      }

      return resp
    })
  }

  let dfd = new Deferred

  penddingRequests.push(
      () => {
        makeRequest(options)
          .then(
            (resp) => {
              dfd.resolve(resp)
            },
            (resp) => {
              dfd.resolve(resp)
            }
          )
      }
  )

  return dfd.promise
}

module.exports = makeRequest
