const url = require('url')
const request = require('request')

let requests = []

let lastRequestTime = 0

let delay = null


function requestQueue(delayMs){

    this.requestsDebug = []

    delay = delayMs || 500

    this.execute = () => {
        while (requests.length > 0) {
            let now = new Date().getTime()
            if ((lastRequestTime+delay) <= now) {
                let req = requests.shift()
                this.requestsDebug.push({ time: now})
                lastRequestTime = now
                return request(req.options, req.callback)

            }
        }
    }

    this.add = (options, callback) => {       
        var requestObj = {
            options: options,
            callback: callback,
        }

        requests.push(requestObj)

        return this.execute()
    }

    return this
}

module.exports = requestQueue