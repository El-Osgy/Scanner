const compare = require("resemblejs").compare;
const fs = require("fs");

function getDiff() {
    const options = {
        output: {
            errorColor: {
                red: 255,
                green: 255,
                blue: 0
            },
            largeImageThreshold : 0,
            
        }
    };

    if (process.argv.length < 5) {
        console.log("Arguments manquants !\nVeuillez saisir l'adresse des deux images à comparer et une adresse de destination");
        return;
    }

    compare(process.argv[2],process.argv[3], options, function(err, data) {
        if (err) {
            console.log("An error!");
        } else {
            console.log(data.misMatchPercentage);
            fs.writeFileSync(process.argv[4],data.getBuffer());
        }
    });
}

getDiff();