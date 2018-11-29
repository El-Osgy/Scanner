const child_process = require('child_process');
const spawn = child_process.spawn;
const spawnSync = child_process.spawnSync;
var site = "";
const fs = require('fs');

async function main() {
	if (process.argv.length >= 3) {
		await appelPhantom();
		exploreScreenshots();
	}
	else
		nouveauSite();
}

main();




//Appel du script phantom qui prend tous les screenshots
async function appelPhantom() {
	site = process.argv[2];
	var args = ['./screenshots-phantom.js', site];
	var phantomExecutable = 'phantomjs';
	var options = {
		stdio: 'pipe'
	};

	var promise = new Promise(function(resolve, reject) {

		var child = spawn(phantomExecutable, args, options);

		child.stdout.on('data', function(data) {
			var textData = String.fromCharCode.apply(null, data);
			console.log(textData);
		});

		child.stderr.on('data', function(err) {
			var textErr = String.fromCharCode.apply(null, err);
			console.log(textErr);
		});

		child.on('close', function(code) {
			console.log('Sortie du script avec statut : ' + code+"\n");
			resolve();
		});
	});

	await promise;
}

//Si pas d'argument à l'appel de ce script, on propose de créer un nouveau site
//Cette fonction permet la saisie d'une URL et d'un nom de dossier, et crée le fichier JSON qui sera appelé par la suite
//Il est initialisé avec la liste de profils contenue dans le fichier config.json
function nouveauSite() {
	const readline = require('readline');
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	var configSite = {};

	rl.question('Vous allez saisir un nouveau site de test\nEntrez l\'URL du site : ', (answer) => {
		configSite.site = answer;
		rl.question('Saisissez le nom court de votre site (nom du dossier) : ', (answer) => {
			configSite.destination = answer;
			suiteConfig();
		});
	});

	function suiteConfig() {
		console.log("Ajout des viewports par défaut");
		configSite.viewports = [[1440,900],[768,750]];

		console.log("Ajout de la page d'accueil");
		configSite.pages = [["accueil",""]];

		console.log("Ajout des profils Facil'iti");
		var configDefault = JSON.parse(fs.readFileSync('./config.json'));
		configSite.profiles_list = configDefault.profiles_list;

		configJSON = JSON.stringify(configSite,null,'\t');
		fs.writeFileSync('sites/'+configSite.destination+'.json',configJSON);

		console.log("Fichier de config créé pour le site "+configSite.destination+"\nVous pouvez le modifier dans ./sites/"+configSite.destination+".json, et ajouter/supprimer des pages, viewports et profils");
		process.exit(0);
	}
}

//La fonction qui va parcourir tous les screenshots pour un site donné et faire quelque chose avec
//(Actuellement comparer chacun avec le précédent)
function exploreScreenshots() {
	//dans le dossier du site
	var dir_site = fs.readdirSync('./screenshots/'+site,{ withFileTypes : true });
	//dans chaque dossier page
	dir_site.forEach(i_page => {
		if (i_page.isDirectory()) {
			var dir_page = fs.readdirSync('./screenshots/'+site+'/'+i_page.name, {withFileTypes : true });
			//dans chaque dossier profil
			dir_page.forEach(i_profil => {
				if (i_profil.isDirectory()) {
					var dir_profil = fs.readdirSync('./screenshots/'+site+'/'+i_page.name+'/'+i_profil.name, {withFileTypes : true });
					//dans chaque dossier viewport
					dir_profil.forEach(i_viewport => {
						if (i_viewport.isDirectory()) {
							var dir_viewport = fs.readdirSync('./screenshots/'+site+'/'+i_page.name+'/'+i_profil.name+'/'+i_viewport.name, {withFileTypes : true });
							doSomething(i_page.name, i_profil.name, i_viewport.name, dir_viewport);
						}
					});
				}
			});
		}
	});

	function doSomething(i_page, i_profil, i_viewport, dir_viewport) {
		var chemin_complet = './screenshots/'+site+'/'+i_page+'/'+i_profil+'/'+i_viewport;
		console.log("Dossier "+chemin_complet);

		//On prend les deux screenshots les plus récents
		dernier = 0;
		avant_dernier = 0;
		dir_viewport.forEach(elem => {
			elem_chiffre = Number.parseInt(elem.name);
			if (elem_chiffre > dernier) {
				avant_dernier = dernier;
				dernier = elem_chiffre;
			}
		});


		if (avant_dernier != 0) { //On vérifie qu'il y en a bien deux
			console.log("\tComparaison : "+avant_dernier+" -> "+dernier);
			var dernier_img = chemin_complet+'/'+dernier+'.png';
			var avant_dernier_img = chemin_complet+'/'+avant_dernier+'.png';

			var destination_output = chemin_complet.replace(/\//g,"_")+dernier+".png";

			comparaisonImages(dernier_img,avant_dernier_img, destination_output);
		}
		else {
			console.log("\tUn seul item : pas de comparaison");
		}
	}
}

//Appelle le script de comparaison
function comparaisonImages(der_img, avant_der_img, destination) {
	var args = ['./compare-blinkdiff.js', der_img, avant_der_img, destination];
	var exec = 'node';
	var options = {
		stdio: 'pipe'
	};

	var child = spawnSync(exec, args, options);

	console.log("stdout : "+child.stdout);
	console.log('Sortie du script avec statut : ' + child.status+"\n");
}