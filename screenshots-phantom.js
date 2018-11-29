"use strict";
console.log('');

phantom.onError = function(msg, trace) {
	var msgStack = ['PHANTOM ERROR: ' + msg];
	if (trace && trace.length) {
			msgStack.push('TRACE:');
			trace.forEach(function(t) {
		  	msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
		});
	}
	console.log(msgStack.join('\n'));
	phantom.exit(1);
};

var webPage = require('webpage');
var fs = require('fs');
var system = require('system');

var site = system.args[1];
var content = fs.read('sites/'+site+'.json');
var config = JSON.parse(content);
var profiles_list = config.profiles_list;
var profiles = Object.keys(profiles_list.profiles);
var date = getDate();
console.log("Date : "+date);

// On doit faire une boucle sur open qui est asynchrone.
// Donc on utilise une fonction à la fin de laquelle on trouve le open, et à la fin du callback, l'appel suivant de la fonction.
// L'incrémentation des trois boucles se fait donc manuellement
function clic(i_profil, i_viewport, i_page) {
	var page = webPage.create();

	//On définit le profil actif et on crée le cookie
	profiles_list.active_profile = profiles[i_profil];

	page.viewportSize = {
		width	: config.viewports[i_viewport][0],
		height	: config.viewports[i_viewport][1]
	};

	// page.onConsoleMessage = function(msg, lineNum, sourceId) {
	// 	console.log('CONSOLE: ' + msg);
	// };

	setCookie(phantom);

	page.open(config.site+"/"+config.pages[i_page][1], function(status) {

		//insertion manuelle du tag... ça se compliquera plus tard.
		if (config.destination == 'clarins')
			page.evaluate(insertionTag);

		//Le timeout est là pour s'assurer que la page est bien modifiée par Facil'iti avant de faire le screenshot
		setTimeout(function() {

			//affichage_var_FACIL_ITI();
			//displayFacilitiCookies(phantom);

			takeScreenshot();

			//Incrémentation des boucles 
			i_page++;
			if (i_page == config.pages.length) {
				i_viewport++;
				i_page = 0;
			}
			if (i_viewport == config.viewports.length) {
				i_profil++;
				i_viewport = 0;
			}
			if (i_profil == profiles.length) {
				phantom.exit();
			}
			clic(i_profil,i_viewport,i_page);

		},2000);
	});

	function affichage_var_FACIL_ITI() {
		var funky = function() {
			var retour = '';
			for (var i in FACIL_ITI) {
				retour += i+'\n';
				retour += FACIL_ITI[i]+'\n\n';
			}
			return retour;
		};
		var insert = page.evaluate(funky);
		console.log(insert);
	}

	var insertionTag = function() {
		var node = document.createElement("SCRIPT");
		node.type = 'text/javascript';
		node.appendChild(document.createTextNode("(function(w, d, s, f) {w[f] = w[f] || {conf: function () { (w[f].data = w[f].data || []).push(arguments);}};var l = d.createElement(s), e = d.getElementsByTagName(s)[0];l.async = 1; l.src = 'https://ws.facil-iti.com/tag/faciliti-tag.min.js'; e.parentNode.insertBefore(l, e);}(window, document, 'script', 'FACIL_ITI'));FACIL_ITI.conf('userId', '490dc3f7-2fd1-11e7-9dd1-000c298ed446');"));
		document.getElementsByTagName("body")[0].appendChild(node);
	}

	function setDestination() {
		var dest = 	config.destination+"/"+
			config.pages[i_page][0]+"/"+
			profiles[i_profil]+"/"+
			config.viewports[i_viewport][0]+"-"+
			config.viewports[i_viewport][1]+"/"+
			date+".png";
		return dest;
	}

	function takeScreenshot() {
		var destination = setDestination();
		page.render("screenshots/"+destination);

		console.log("i_profil: "+i_profil+" | i_viewport: "+i_viewport+" | i_page: "+i_page+" |\t"+destination);
	}

	//prend en paramètre page ou phantom, selon les circonstances
	function displayAllCookies(elem) {
		for (var i in elem.cookies) {
			var display = elem.cookies[i].name;
			while (display.length < 40)
				display+=" ";
			display += elem.cookies[i].domain;
			while (display.length < 80)
				display +=" ";
			display += elem.cookies[i].path;

			console.log("\t#"+i+"\t"+display);
		}
	}

	function displayFacilitiCookies(elem) {
		//affiche uniquement les cookies du domaine Facil'iti
		for (var i in elem.cookies) {
			if (elem.cookies[i].domain.indexOf('facil-iti') !== -1) {
				var display = elem.cookies[i].name;
				while (display.length < 40)
					display+=" ";
				display += elem.cookies[i].domain;
				while (display.length < 80)
					display +=" ";
				display += elem.cookies[i].path;

				console.log("\t#"+i+"\t"+display);
			}
		}
	}
}

clic(0,0,0);

function setCookie(elem) {
	phantom.clearCookies();
	elem.addCookie({
		'name'		: 'FACIL_ITI_LS',
		'value' 	: btoa(encodeURIComponent(JSON.stringify(profiles_list))),
		'domain'	: 'ws.facil-iti.com',
		'path'		: '/',
		'expires'	: (new Date()).getTime() + (1000*60*60*24)
	});
}

function getDate() {
	//Formatage date yyyymmdd_hhmmss
	var d = new Date();

	var current_date = ''+d.getFullYear()+
	((d.getMonth()+1) >= 10 ? d.getMonth()+1 : "0"+(d.getMonth()+1))+
	(d.getDate() >= 10 ? d.getDate() : "0"+d.getDate())+
	(d.getHours() >= 10 ? d.getHours() : "0"+d.getHours())+
	(d.getMinutes() >= 10 ? d.getMinutes() : "0"+d.getMinutes())+
	(d.getSeconds() >= 10 ? d.getSeconds() : "0"+d.getSeconds());

	return current_date;
}