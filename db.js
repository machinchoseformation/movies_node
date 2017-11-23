//inclue le module mysql
const mysql = require("mysql");
//notre configuration 
const config = require("./config.js");

//on se connecte à la bdd
var connection = mysql.createConnection(config.db);

const db = {
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

    "saveChatMessage": function(data){
        var sql = `INSERT INTO chat_message (username, message, dateSent) 
        VALUES (?,?,?)`;

        connection.query(sql, [data.username, data.message, data.mysqlDate], function(error, results){
            if (error){
                throw error;
            }
            console.log("message sauvegardé en bdd !");      
        });
    }
};

//rend cette variable disponible
module.exports = db;