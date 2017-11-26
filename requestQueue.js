const {URL} = require('url')
const request = require('request')

let requests = []
let lastRequestTime = 0
let delay = null

function requestQueue(delayMs){

    this.requestsDebug = {}
    delay = delayMs || 500

    this.execute = () => {
        for(hostname in requests){
            while (requests[hostname].requests.length > 0) {
                let now = new Date().getTime()
                if ((requests[hostname].lastRequestTime+delay) <= now) {
                    let req = requests[hostname].requests.shift()
                    this.requestsDebug[hostname].push({time: now})
                    requests[hostname].lastRequestTime = now
                    return request(req.options, req.callback)
                }
            }
        }
    }

    this.add = (options, callback) => {       
        var requestObj = {
            options: options,
            callback: callback,
        }

        let urlObject = new URL(requestObj.options.url)
        hostname = urlObject.hostname

        if (!requests[hostname]){
            requests[hostname] = {
                lastRequestTime: new Date().getTime(),
                requests: []
            }
        }

        if (!this.requestsDebug[hostname]) {
            this.requestsDebug[hostname] = []
        }

        requests[hostname].requests.push(requestObj)
        return this.execute()
    }

    return this
}

module.exports = requestQueue