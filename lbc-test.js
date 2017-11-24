//permet de faire des requêtes HTTP à des urls
const request = require('request')

//permet d'extraire le contenu du HTML
const cheerio = require('cheerio')

startUrl = 'https://www.leboncoin.fr/ameublement/1343088114.htm';

request(startUrl, (error, response, body) => {

    let $ = cheerio.load(body)

    let descr = $('.properties_description .value').text()
    console.log(descr)

});