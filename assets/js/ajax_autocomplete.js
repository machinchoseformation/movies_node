//chaque fois qu'on relâche une touche du clavier
$("#search_form input").on("keyup", function(){
    //on vide les suggestions avant d'en mettre de nouvelles
    $("#autocomplete_results").empty();

    //on récupère la valeur de l'input
    var kw = $(this).val();
    //on déclenche la requête que si plus de 1 caractère
    if (kw.length < 2){
        return false;
    }
    //requête ajax
    $.ajax({
        url: '/api/ajax_search/', //à cette url...
        data: {
            'kw': kw //avec ces paramètres d'URL
        },
    })
    //lorsque la requête est terminée, ce callback est appelé
    .done(function(response){
        //pour chaque suggestion reçu...
        for(var i = 0; i < response.length; i++){
            if (i == 10){
                break;
            }
            //on crée un lien...
            var link = '<a href="/detail/'+response[i].id+'">'+response[i].title+'</a>';
            //...qu'on ajoute dans la div prévue à cet effet
            $("#autocomplete_results").append(link);
        }
    });
});