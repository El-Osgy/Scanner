var BlinkDiff = require('blink-diff');

var diff = new BlinkDiff({
	imageAPath: process.argv[2],
	imageBPath: process.argv[3],
	imageOutputPath: process.argv[4],
	imageOutputLimit: BlinkDiff.OUTPUT_DIFFERENT,
	threshold: 0
});

diff.run(function(error, result) {
	if (error) {
		console.log('BLINK-DIFF : Erreur comparaison');
		process.exit(1);
	} else {
		console.log(diff.hasPassed(result.code) ? 'Comparaison reussie' : 'Comparaison echouee : '+process.argv[4]);
	}
});