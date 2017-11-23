var isSunny = true;

var p = new Promise(function(resolve, reject){
    if (isSunny){
        setTimeout(function(){
            resolve("il fait beAU");
        }, 2000);
    }
    else {
        reject('il pleut');
    }
});

var p2 = new Promise(function(resolve, reject){
    resolve("coucou p2");
});

Promise.all([p2,p])
.then(function(values){
    console.log(values[0]);
})
.catch(function(reason){
    console.log(reason);
});