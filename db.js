//inclue le module mysql
const mysql = require("mysql");
//notre configuration 
const config = require("./config.js");

//on se connecte à la bdd
var connection = mysql.createConnection(config.db); 

const db = {
    "closeConnection": function(){
        connection.destroy();
    },

    //récupère 50 films au hasard
    "getRandomMovies": function(){
        //retourne une Promise 
        return new Promise(function(resolve, reject){
            let sql = `SELECT id, imdbId, title 
            FROM movie 
            ORDER BY RAND()
            LIMIT 50`;
        
            connection.query(sql, function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                //on la resolve
                resolve(results);
            });
        });       
    },

    //récupère les films par mot-clef
    "searchMovies": function(keyword){
        //retourne une Promise 
        return new Promise(function(resolve, reject){
            //requête pour rechercher en fct du titre de film ou nom de l'acteur
            let sql = `
            SELECT DISTINCT movie.id, movie.imdbId, movie.title 
            FROM movie 
            JOIN movie_actor ON movie_actor.movieId = movie.id 
            JOIN people ON movie_actor.peopleId = people.id
            WHERE movie.title LIKE ? 
            OR people.name LIKE ?
            LIMIT 50`;
        
            //on ajoute des "jokers" à notre mot clef
            var kw = '%' + keyword + '%';

            //exécute la requête en remplacant les ?
            connection.query(sql, [kw,kw], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                //on la resolve
                resolve(results);
            });
        });       
    },

    //récupère un film en fonction de son identifiant
    "getMovieById": function(movieId){
        return new Promise(function(resolve, reject){
            var sql = `SELECT * FROM movie WHERE id = ?`; 
            connection.query(sql, [movieId], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                resolve(results[0]);
            });
        });
    },

    //récupère un film en fonction de son imdbId
    "getMovieByImdbId": function(movieId){
        return new Promise(function(resolve, reject){
            var sql = `SELECT * FROM movie WHERE imdbId = ?`; 
            connection.query(sql, [movieId], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }

                if (results.length < 1){
                    resolve(null);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    },

    //récupère les acteurs d'un film
    "getAllPeoples": function () {
        return new Promise(function (resolve, reject) {
            var sql = `
            SELECT * FROM people`;

            connection.query(sql, function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                resolve(results);
            });
        });
    },

    //récupère les acteurs d'un film
    "getMovieActors": function(movieId){
        return new Promise(function(resolve, reject){
            var sql = `
            SELECT people.name FROM people 
            JOIN movie_actor ON movie_actor.peopleId = people.id 
            WHERE movie_actor.movieId = ?`;

            connection.query(sql, [movieId], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                resolve(results);
            });
        });
    },

    //récupère les réalisateurs d'un film
    "getMovieDirectors": function(movieId){
        return new Promise(function(resolve, reject){
            var sql = `
            SELECT people.name FROM people 
            JOIN movie_director ON movie_director.peopleId = people.id 
            WHERE movie_director.movieId = ?`;

            connection.query(sql, [movieId], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                resolve(results);
            });
        });
    },

    //récupère les scénaristes d'un film
    "getMovieWriters": function(movieId){
        return new Promise(function(resolve, reject){
            var sql = `
            SELECT people.name FROM people 
            JOIN movie_writer ON movie_writer.peopleId = people.id 
            WHERE movie_writer.movieId = ?`;

            connection.query(sql, [movieId], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                resolve(results);
            });
        });
    },

    //récupère les genres d'un film 
    "getMovieGenres": function(movieId){
        return new Promise(function(resolve, reject){
            var sql = `
            SELECT genre.name FROM genre 
            JOIN movie_genre ON movie_genre.genreId = genre.id 
            WHERE movie_genre.movieId = ?`;

            connection.query(sql, [movieId], function (error, results) {
                if (error) {
                    //on rejette la promise
                    reject(error);
                }
                resolve(results);
            });
        });
    },

    "getPeopleByName": function(name){
        return new Promise(function (resolve, reject) {
            var sql = `SELECT * FROM people WHERE name = ?`;

            connection.query(sql, [name], function (error, results) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results)
                }
            })
        })
    },

    "insertPerson": function(name){
        return new Promise(function (resolve, reject) {
            var sql = `INSERT INTO people (id, name) VALUES (NULL,?)`;

            connection.query(sql, [name], function (error, results) {
                if (error) {
                    reject(error)
                }
                else {
                    person = {}
                    person.id = results.insertId                        
                    person.name = name
                    resolve(person)
                }
            })
        })
    },

    "insertMoviePeopleRelation": function (table, movieId, personId) {
        return new Promise(function (resolve, reject) {
            var sql = `INSERT INTO ${table} (movieId, peopleId) VALUES (?,?)`;
            connection.query(sql, [movieId, personId], function (error, results) {
                if (error) {
                    reject(error)
                }
                else {
                    resolve({movieId: movieId, peopleId: personId})
                }
            })
        })
    },

    "insertMovie": function (movie) {
        return new Promise(function(resolve, reject){
            var sql = `INSERT INTO movie 
            (id, imdbId, title, year, plot, rating, votes, runtime, trailerId, dateCreated, dateModified) 
            VALUES (NULL,?,?,?,?,?,?,?,?,NOW(),NOW())`;

            connection.query(sql, 
                [movie.imdbId, movie.title, movie.year, movie.plot, movie.rating, movie.votes, movie.runtime, movie.trailerId], function (error, results) {
                if (error) {
                    reject(error);
                }
                else {
                    //récupère l'id du film fraîchement ajouté en bdd
                    movie.id = results.insertId;

                    let p1 = db.insertMoviePeopleRelations(movie.id, movie.actors, "movie_actor")
                    let p2 = db.insertMoviePeopleRelations(movie.id, movie.directors, "movie_director")
                    let p3 = db.insertMoviePeopleRelations(movie.id, movie.writers, "movie_writer")
                    let p4 = db.insertMovieGenreRelations(movie.id, movie.genres)

                    Promise.all([p1,p2,p3,p4])
                    .then(() => {
                        resolve(movie)
                    })
                    .catch((error) => {
                        throw error
                    })
                }
            });
        });
    },

    "insertMoviePeopleRelations": function(movieId, persons, tableName){
        return new Promise((resolve, reject) => {
            persons.forEach((person) => {
                db.getPeopleByName(person)
                .then((result) => {
                    if (result.length >  0) {
                        db.insertMoviePeopleRelation(tableName, movieId, result[0].id)
                        .then(() => { 
                            resolve() 
                        })
                        .catch((error) =>  {
                            throw error
                        })
                    }
                    else {
                        db.insertPerson(person)
                        .then((person) => {
                            db.insertMoviePeopleRelation(tableName, movieId, person.id)
                            .then(() => {
                                resolve()
                            })
                            .catch((error) => {
                                throw error
                            })
                        })
                        .catch((error) => {
                            reject(error)
                        })
                    }
                })
                .catch((error) => {
                    reject(error)
                })
            })
        })
    },

    "insertMovieGenreRelations": function (movieId, genres) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM genre', function (error, results) {
                if (error) {
                    reject(error)
                }
                let sqlValues = []
                genres.forEach((genreName) => {
                    let genreId = null
                    results.forEach((genreFromDb) => {
                        if (genreFromDb.name == genreName){
                            genreId = genreFromDb.id
                        }
                    })
                    sqlValues.push(`(${movieId}, ${genreId})`)
                })

                sqlValuesString = sqlValues.join(',')

                connection.query(`INSERT INTO movie_genre VALUES ${sqlValuesString}`, function(error, results){
                    if (error) {
                        reject(error)
                    }
                    resolve(true)
                })
            })
        })
    },

    "saveChatMessage": function(data){
        var sql = `INSERT INTO chat_message (username, message, dateSent) 
        VALUES (?,?,?)`;

        connection.query(sql, [data.username, data.message, data.mysqlDate], function(error, results){
            if (error){
                throw error;
            }
            console.log("message sauvegardé en bdd !");      
        });
    },
};

//rend cette variable disponible
module.exports = db;