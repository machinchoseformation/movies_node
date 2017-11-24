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

var movies = [];

request(startUrl, (error, response, body) => {
    
    let $ = cheerio.load(body)
   
    let items = $(".lister-list .lister-item");

    items.each((i, el) => {
        var movie = {}

        //title
        movie.title = $(el).find(".col-title a").text()

        //detailUrl
        let detailUrlTemp = url.parse($(el).find(".col-title a").attr("href")).pathname
        movie.detailUrl = url.resolve(rootUrl, detailUrlTemp)
        console.log(movie.detailUrl)

        //imdbId
        //extrait depuis l'URL avec une regexp
        let imdbIdArrayTemp = /(tt\d{7})/.exec(movie.detailUrl)
        movie.imdbId = imdbIdArrayTemp[1]

        movies.push(movie)
    })

    movies.forEach((movie) => {
        //on regarde si le film est déjà présent en bdd
        db.getMovieByImdbId(movie.imdbId)
        .then((result) => {
            if (result != null){
                return false
            }
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

                //youtube !
                let apiCall = youtubeApiUrl.replace('{MOVIE_TITLE}', encodeURIComponent(movie.title))
                request(apiCall, function (error, response, body) {
                    let json = JSON.parse(body)
                    movie.trailerId = json.items[0].id.videoId

                    db.insertMovie(movie)
                        .then((result) => {
                            console.log(result)
                        })
                        .catch((reason) => {
                            console.log(reason)
                        })
                })
            })
        })
    })
})
