// ==UserScript==
// @name        OPR_NominationListManagement
// @namespace   asldufhiu32hr9283hf83123
// @include     https://wayfarer.nianticlabs.com/nominations*
// @author      @lokpro
// @updateURL https://github.com/Ingrass/OPR_NominationListManagement/raw/master/OPR_NominationListManagement.user.js
// @downloadURL https://github.com/Ingrass/OPR_NominationListManagement/raw/master/OPR_NominationListManagement.user.js
// @version     0.3.1
// @grant       none
// ==/UserScript==

/*
v0.3.1 28/10/2019
分類瀏覽 加個日期

v0.3 28/10/2019
加入功能: 用分類的方式瀏覽；做了個框架，功能待加

v0.2 27/10/2019
加入功能: 把數據轉成 table，可copy到excel

v0.1 17/10/2019
added hyperlinks to watermeter
*/

/* to-do
- 可選取
- 展示在一個map上
- 批量查水表
- 持續改善 ui
歡迎加入開發
*/

var css = " \
#nom-table { \
margin-left: 20%; \
} \
.nomination.card{ \
position: relative; \
overflow: visible; \
} \
.customButtonArea { \
position: absolute; \
top: 0; \
left: -25%; \
width: 25%; \
padding-right: 2px; \
} \
.customButton{ \
width: 100%; \
display: block; \
margin: 0; \
text-align: center; \
} \
.HeadCustomButton{ \
float:left \
} \
" ;

var node = document.createElement("style");
node.type = "text/css";
node.appendChild(document.createTextNode(css));
document.getElementsByTagName("head")[0]
	.appendChild(node);

function imgUrlToHashId( url ){
	return url.replace( /=.{1,10}$|[^a-zA-Z0-9]/g, '' ).slice(- 10).toLowerCase();
}

function modifyDisplayList(){
	setTimeout( function(){
		var BASEURL = "https://brainstorming.azurewebsites.net/watermeter.html";

		var divs = document.querySelectorAll( "#nom-table .nomination" );

		var hashIds = [];
		
		for( var i=0; i<divs.length; i++ ){
			var hashId = "#"+ imgUrlToHashId( divs[i].querySelector("img").src );
			
			if( divs[i].querySelectorAll(".customButtonArea").length >0 ){
				continue;
			}
			divs[i].innerHTML = "<div class='customButtonArea'>"
				+"<button class='customButton button' onclick='window.open(\""+BASEURL+hashId+"\", \"watermeter0\"); event.stopPropagation();'>水表</button>"
				+"</div>" + divs[i].innerHTML;
		}
	}, 1000 );
}

var interval = setInterval( function(){
	// wait for var available
	try {
		window.nomCtrl = angular.element( document.querySelector("[ng-controller='NominationsController as nomCtrl']") ).scope().nomCtrl;
		var x = nomCtrl.datasource.get;
	} catch (e) {
		return;
	}
	// OK
	clearInterval( interval );

	nomCtrl.reload2 = nomCtrl.datasource.get;
	nomCtrl.datasource.get = function() {
	  var tReturn = nomCtrl.reload2.apply( nomCtrl.reload2, arguments);
	  modifyDisplayList();
	  return tReturn;
	};
}, 100 );

window.myListAllNominations = function(){
	var COLUMNS = [
		//"order",
		"day",
		//"id",
		"imageUrl",
		"title",
		"description",
		"lat",
		"lng",
		"state",
		"city",
		"status",
		"upgraded",
		"nextUpgrade",
	];

	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	var tr = document.createElement('tr');
  for (var col= 0; col<COLUMNS.length; col++) {
		var th = document.createElement('th');
		th.appendChild( document.createTextNode( COLUMNS[col] ) );
		tr.appendChild(th);
	}
	thead.appendChild( tr );

	for( var iNom=0; iNom<nomCtrl.nomList.length; iNom++ ){
		var nom = nomCtrl.nomList[iNom];

		var tr = document.createElement('tr');
    for (var col= 0; col<COLUMNS.length; col++) {
			var td = document.createElement('td');
			td.appendChild( document.createTextNode( nom[ COLUMNS[col] ] ) );
			tr.appendChild(td);
		}
		tbody.appendChild( tr );
	}

	table.appendChild(thead);
	table.appendChild(tbody);

	var css = " \
table{ \
table-layout: fixed; \
} \
td, th { \
	border 1px solid black; \
	max-width: 300px; \
	overflow: ellipsis; \
} \
	";

	var style = document.createElement("style");
	style.type = "text/css";
	style.appendChild(document.createTextNode(css));

	var w = window.open();
	w.document.title = nomCtrl.length;
	w.document.body.appendChild( table );
	w.document.body.appendChild( style );
};

document.querySelector(".header-container").innerHTML +=
	"<button class='HeadCustomButton button' onclick='window.myListAllNominations();'>Export Table</button>";

//===================================

window.viewNominationsInCategories = function(){

	var w = window.open();
	w.document.title = nomCtrl.nomList.length;

	//=== parse nomList
	function categoriseNoList( nomList ){
		var d = {
			status:{},
			upgraded:{},
		};

		for( var iNom=0; iNom<nomList.length; iNom++ ){
			var nom = nomList[iNom];

			d.status[nom.status] = d.status[nom.status] || [];
			d.status[nom.status].push( nom );

			d.upgraded[nom.upgraded] = d.upgraded[nom.upgraded] || [];
			d.upgraded[nom.upgraded].push( nom );
		}

		// === sort all by "day"
		for( var iL1 in d ){
			for( var iL2 in d[iL1] ){
				d[iL1][iL2].sort( function(a,b){ a.day<b.day?1:-1 } );
			}
		}

		return d;
	}

	var d = categoriseNoList( nomCtrl.nomList );
	w.d = d;
	var root = document.createElement("div");

	//=== menu
	for( var iL1 in d ){
		var level1Container = document.createElement("div");
		root.appendChild( level1Container );
		level1Container.className = "menu L1 container";

		var level1Button = document.createElement("div");
		level1Container.appendChild( level1Button );
		level1Button.className = "menu L1 button";
		level1Button.innerText = iL1;
		
		var level2Container = document.createElement("div");
		level1Container.appendChild( level2Container );
		level2Container.className = "menu L2 container";

		for( var iL2 in d[iL1] ){
			var level2Button = document.createElement("div");
			level2Container.appendChild( level2Button );
			level2Button.className = "menu L2 button";
			level2Button.innerText = iL2 + " (" + d[iL1][iL2].length + ")";
			level2Button.setAttribute('onclick', "showList('"+iL1+"."+iL2+"', 0)");
		}
	}

	//=== list noms
	var displayContainer = document.createElement("div");
	root.appendChild( displayContainer );
	displayContainer.className = "displayContainer";

	w.showList = function( key, level ){
		var doc = w.document;
		var displayContainer = doc.querySelector(".displayContainer");
		displayContainer.innerHTML = '';
		var list = eval( "d."+key );
		for (var iNom=0; iNom<list.length; iNom++ ) {
			var nom = list[iNom];
			
			var nomBox = doc.createElement("div");
			displayContainer.appendChild( nomBox );
			nomBox.className = "nomBox";
			nomBox.id = imgUrlToHashId( nom.imageUrl );

			var img = doc.createElement("img");
			nomBox.appendChild( img );
			img.src = nom.imageUrl + "=s80";

			var title = doc.createElement("div");
			nomBox.appendChild( title );
			title.innerText = nom.title;

			var date = doc.createElement("div");
			nomBox.appendChild( date );
			date.innerText = nom.day;
			
			var button_watermeter = doc.createElement("a");
			nomBox.appendChild( button_watermeter );
			button_watermeter.innerText = "水表";
			button_watermeter.className = "button";
			button_watermeter.href = "https://brainstorming.azurewebsites.net/watermeter.html#" + nomBox.id;
			button_watermeter.setAttribute('target', 'watermeter0');
    }
	};

	var css = " \
body{ \
	background-color: #222222; \
} \
div.menu { \
	padding: 4px 7px; \
	display: inline-block; \
} \
.container{ \
	border: 1px solid #226767; \
} \
.menu.L1.container{ \
	margin-right: 20px; \
} \
.button{ \
	color: white; \
	background-color: #226767; \
	border: 3px solid #5BC5C5; \
	cursor: pointer; \
} \
.menu.button{ \
	margin: 3px; \
} \
.displayContainer{ \
	border: 1px solid #226767; \
	height: 80%; \
	margin-top: 5px; \
	overflow-y: scroll; \
} \
.nomBox{ \
	display: inline-block; \
	border: 1px solid #226767; \
	min-height: 100px; \
	width: 100px; \
	padding: 2px; \
	margin: 3px; \
	vertical-align: top; \
	text-align: center; \
} \
.nomBox img{ \
	max-width: 70%; \
	max-height: 50%; \
	min-width: 50%; \
} \
.nomBox *{ \
	margin: 3px; \
	color: white; \
} \
	";

	var style = document.createElement("style");
	style.type = "text/css";
	style.appendChild(document.createTextNode(css));

	w.document.body.appendChild( style );
	w.document.body.appendChild( root );
};

document.querySelector(".header-container").innerHTML +=
	"<button class='HeadCustomButton button' onclick='window.viewNominationsInCategories();'>View All (Beta)</button>";
