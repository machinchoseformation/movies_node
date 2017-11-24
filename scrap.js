//permet de faire des requêtes HTTP à des urls
const request = require('request')

//permet d'extraire le contenu du HTML
const cheerio = require('cheerio')

//permet de recréer des urls absolues facilement
const url = require('url')

const config = require('./config.js')

//url de base d'imdb
const rootUrl = "http://akas.imdb.com/";

//url de la liste des films à scraper
const startUrl = "http://akas.imdb.com/search/title?num_votes=10000,&title_type=feature&user_rating=7.0,&view=simple"

//pour faire les requêtes à la bdd
const db = require('./db.js')

const youtubeApiUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q={MOVIE_TITLE}+trailer+official&type=video&videoEmbeddable=true&key="+config.youtube.apikey


function extractMoviesFromList(listUrl){

    let newMovies = [];

    return new Promise((resolve, reject) => {
        request(listUrl, (error, response, body) => {

            let $ = cheerio.load(body)

            let items = $(".lister-list .lister-item")

            let promises = []

            items.each((i, el) => {
                var movie = {}

                //title
                movie.title = $(el).find(".col-title a").text()

                //detailUrl
                let detailUrlTemp = url.parse($(el).find(".col-title a").attr("href")).pathname
                movie.detailUrl = url.resolve(rootUrl, detailUrlTemp)

                //imdbId
                //extrait depuis l'URL avec une regexp
                let imdbIdArrayTemp = /(tt\d{7})/.exec(movie.detailUrl)
                movie.imdbId = imdbIdArrayTemp[1]

                let promise = checkIfMovieExists(movie.imdbId)
                promises.push(promise)
                promise.then((movieExists) => {
                    if (!movieExists){
                        newMovies.push(movie)
                    }
                    else {
                        console.log("exists", movie.title)
                    }
                })
                .catch((error) => {
                    throw error
                })
            })

            Promise.all(promises)
            .then(() => {
                scrapDetailPages(newMovies)
            })
            .catch((error) => {
                throw error
            })
        })
    })
}

function checkIfMovieExists(imdbId){
    return new Promise((resolve, reject) => {
        db
        .getMovieByImdbId(imdbId)
        .then((result) => {
            if (result != null) {
                resolve(true)
            }
            else {
                resolve(false)
            }
        })
        .catch((error) => {
            reject(error)
        })
    })
}

function extractDataFromDetailPage(movie){
    console.log("getting details for " + movie.title)
    return new Promise((resolve, reject) => {
        request(movie.detailUrl, (error, response, body) => {
            let $ = cheerio.load(body)

            //runtime
            let runtimeTemp = $("time[itemprop='duration']").attr('datetime')
            movie.runtime = parseInt(runtimeTemp.replace(/[A-Z]/g, ''))

            //genres 
            movie.genres = []
            let genreEls = $("span[itemprop='genre']")
            genreEls.each(function (i, el) {
                movie.genres.push($(el).text())
            })

            //votes 
            let votesTemp = $('span[itemprop="ratingCount"]').text()
            movie.votes = parseInt(votesTemp.replace(/&nbsp;/gi, '').replace(',', ''))

            //year
            let yearTemp = $("#titleYear").text()
            movie.year = parseInt(yearTemp.replace(/\(|\)/g, '')) //enlève les parenthèses

            //plot
            movie.plot = $(".summary_text").text().trim()

            //rating
            movie.rating = parseFloat($('[itemprop="ratingValue"]').text().replace(",", "."))

            //actors
            movie.actors = []
            let actorEls = $(".plot_summary_wrapper span[itemprop='actors'] span[itemprop='name']")
            actorEls.each(function (i, el) {
                movie.actors.push($(el).text())
            })

            //directors
            movie.directors = []
            let directorEls = $(".plot_summary_wrapper span[itemprop='director'] span[itemprop='name']")
            directorEls.each(function (i, el) {
                movie.directors.push($(el).text())
            })

            //writers
            movie.writers = []
            let writerEls = $(".plot_summary_wrapper span[itemprop='creator'] span[itemprop='name']")
            writerEls.each(function (i, el) {
                movie.writers.push($(el).text())
            })

            resolve(movie)
        })
    })
}

function getYoutubeTrailerId(movie){
    return new Promise((resolve, reject) => {
        console.log("calling youtube for " + movie.title)

        let apiCall = youtubeApiUrl.replace('{MOVIE_TITLE}', encodeURIComponent(movie.title))
        request(apiCall, function (error, response, body) {
            let results = JSON.parse(body)
            if (results.items.length < 1){
                reject("no results")
            }
            else {
                movie.trailerId = results.items[0].id.videoId
                resolve(movie)
            }
        })
    })    
}

function saveMovies(movies){
    var promises = []

    movies.forEach((movie) => {
        let promise = db.insertMovie(movie)
        promises.push(promise)
        promise
        .then((movie) => {
            console.log("inserted! " + movie.title)
        })
        .catch((reason) => {
            console.log(reason)
        })
    })

    Promise.all(promises)
    .then(() => {
        db.closeConnection()
        console.log("the end")
    })
    .catch((error) => {
        throw error
    })
        
}

function scrapDetailPages(movies){
    let newMovies = []
    let promises = []
    movies.forEach((movie) => {
        let promise = new Promise((resolve, reject) => {
            let p1 = extractDataFromDetailPage(movie)
            let p2 = getYoutubeTrailerId(movie)

            Promise.all([p1, p2]).then((values) => {
                let movie = values[0] //on prend le premier, les 2 sont pareils
                newMovies.push(movie)
                resolve(movie)
            })
            .catch((error) => {
                reject(error)
            })
        })
        
        promises.push(promise)
    });

    Promise.all(promises)
    .then(() => {
        saveMovies(newMovies)
    })
    .catch((error) => {
        throw error
    })
}

extractMoviesFromList(startUrl)