//inclue le framework express
const express = require("express");
//inclue notre moteur de templates, nunjucks
const nunjucks = require("nunjucks");

//crée un serveur HTTP avec express
const app = express();
//inclue notre contrôleur
const movieController = require("./movieController.js");

//nos fichiers statiques css, js, img, etc... se trouve dans le dossier assets
app.use(express.static('assets'));

//nos fichiers de vue se trouve dans le dossier views/
nunjucks.configure('views', {
    autoescape: true, //on active l'échappement automatique des caractères spéciaux
    express: app //on associe nunjucks à notre serveur express
});

//si on est sur la page d'accueil, on appelle la méthode homePage() de notre contrôleur
app.get("/", movieController.homePage); 
//si on est sur l'URL /detail/unIdDeFilm, on appelle detailPage()
app.get("/detail/:movieId", movieController.detailPage);
//utilisé par l'autocomplétion dans la recherche
//les requêtes ajax sont envoyées à cette URL
app.get("/api/ajax_search/", movieController.ajaxSearch)

//le serveur écoute sur le port 3000
app.listen(3000, function(){
    console.log("Express écoute à http://localhost:3000");
})