const mysql = require("mysql");
const config = require("./config.js");

var connection = mysql.createConnection(config.db);

const db = {
    "getRandomMovies": function(){
        return new Promise(function(resolve, reject){
            let sql = `SELECT id, imdbId, title 
            FROM movie 
            ORDER BY RAND()
            LIMIT 50`;
        
            connection.query(sql, function (error, results) {
                if (error) {
                    reject(error);
                }
                resolve(results);
            });
        });       
    },

    "getMovieById": function(movieId, callback){
        var sql = `SELECT * FROM movie WHERE id = ?`; 
        connection.query(sql, [movieId], function (error, results, fields) {
            if (error) throw error;
            callback(results[0]);
        });
    },

    "getMovieActors": function(movieId, callback){
        var sql = `
        SELECT people.name FROM people 
        JOIN movie_actor ON movie_actor.peopleId = people.id 
        WHERE movie_actor.movieId = ?`;

        connection.query(sql, [movieId], function (error, results, fields) {
            callback(results);
        });
    },

    "getMovieDirectors": function(movieId, callback){
        var sql = `
        SELECT people.name FROM people 
        JOIN movie_director ON movie_director.peopleId = people.id 
        WHERE movie_director.movieId = ?`;

        connection.query(sql, [movieId], function (error, results, fields) {
            callback(results);
        });
    },

    "getMovieGenres": function(movieId, callback){
        var sql = `
        SELECT genre.name FROM genre 
        JOIN movie_genre ON movie_genre.genreId = genre.id 
        WHERE movie_genre.movieId = ?`;

        connection.query(sql, [movieId], function (error, results, fields) {
            callback(results);
        });
    }
};

module.exports = db;