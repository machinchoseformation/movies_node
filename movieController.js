//inclue la connexion à la bdd, et les requêtes SQL
const db = require("./db.js");

//crée un objet ressemblant à une classe
const movieController = {
    
    //appelée par la requête ajax d'autocomplétion
    ajaxSearch: function(req, res){
        //si on a un mot-clef dans l'URL à rechercher...
        keyword = req.query.kw
        var p = db.searchMovies(keyword);
        
        p
        //lorsque la promise est "resolved"...
        .then(function(results){
            //on affiche le fichier index en lui passant les films
            res.json(results);
        })
        //si ça a planté, on affiche l'erreur dans la console
        .catch(function(error){
            console.error(error);
        });
    },
    //méthode pour la page d'accueil
    homePage: function(req, res){
        
        //si on a un mot-clef dans l'URL à rechercher...
        if (req.query.kw){
            keyword = req.query.kw
            var p = db.searchMovies(keyword);
        }
        else {
            //on récupère 50 films au hasard
            //cette fonction nous retourne une Promise
            var p = db.getRandomMovies();
        }

        p
        //lorsque la promise est "resolved"...
        .then(function(results){
            //on affiche le fichier index en lui passant les films
            res.render("index.html", {"movies": results});
        })
        //si ça a planté, on affiche l'erreur dans la console
        .catch(function(error){
            console.error(error);
        });
    },
    //méthode pour la page de détail d'un film
    detailPage: function(req, res){
        //on récupère le paramètre d'id du film intégré à l'URL
        let movieId = req.params.movieId;  
        
        //on appelle nos 5 fonctions qui créent des promises
        var p1 = db.getMovieById(movieId);
        var p2 = db.getMovieActors(movieId);
        var p3 = db.getMovieDirectors(movieId);
        var p4 = db.getMovieGenres(movieId);
        var p5 = db.getMovieWriters(movieId);        

        //lorsque les 5 promises sont "resolved" (finies avec succès)
        Promise.all([p1,p2,p3,p4,p5]).then(function(values){
            //on affiche detail.html en lui passant les valeurs issues des 5 requêtes
            res.render("detail.html", {
                "movie": values[0], 
                "actors": values[1],
                "genres": values[2],
                "directors": values[3],
                "writers": values[4],
            });
        });
        
        /*
        //pyramid of doom 
        //à éviter !!
        db.getMovieById(movieId, function(movie){
            db.getMovieActors(movieId, function(actors){
                db.getMovieDirectors(movieId, function(directors){
                    db.getMovieGenres(movieId, function(genres){
                        res.render("detail.html", {
                            "movie": movie, 
                            "actors": actors,
                            "genres": genres,
                            "directors": directors,
                        });
                    });
                });
            });
        });
        */
    }
}

//on exporte notre variable pour la rendre disponible dans les autres fichiers
module.exports = movieController;