// ==UserScript==
// @name        OPR_NominationListManagement
// @namespace   asldufhiu32hr9283hf83123
// @include     https://wayfarer.nianticlabs.com/nominations*
// @author      @lokpro
// @updateURL https://github.com/Ingrass/OPR_NominationListManagement/raw/master/OPR_NominationListManagement.user.js
// @downloadURL https://github.com/Ingrass/OPR_NominationListManagement/raw/master/OPR_NominationListManagement.user.js
// @version     0.4.3
// @grant       none
// ==/UserScript==

/*
v0.4.3 9/Jan/2020
- custom view - added viewport for mobile devices

v0.4.2 9/Jan/2020
- custom view - added styles for WITHDRAWN

v0.4.1 8/Jan/2020
- compress head menu buttons to one row

v0.4 8/Jan/2020
- custom view - added colors and styles

v0.3.4 8/Jan/2020
- custom view - added "upgrade next" categroy

v0.3.3 7/Jan/2020
- rewritten code structure, no functional changes

v0.3.3 2/Jan/2020
- custom view - added "ALL" category

v0.3.2 27/12/2019
- 更動頭頂2 buttons位置以免蓋住系統的buttons

v0.3.1 28/10/2019
- custom view - added date ;分類瀏覽 加個日期

v0.3 28/10/2019
- 加入功能: 用分類的方式瀏覽；做了個框架，功能待加

v0.2 27/10/2019
- 加入功能: 把數據轉成 table，可copy到excel

v0.1 17/10/2019
- added hyperlinks to watermeter
*/

/* to-do
- 可選取
- 展示在一個map上
- 批量查水表
- 持續改善 ui
歡迎加入開發
*/

window.NLM = {}; // main page
NLM.CUSTOM = {}; // custom view
NLM.css = {};

NLM.imgUrlToHashId = function( imgUrl ){
	return imgUrl.replace( /=.{1,10}$|[^a-zA-Z0-9]/g, '' ).slice(- 10).toLowerCase();
}

NLM.appendCSS = function( css, toNode ){
	var style = document.createElement("style");
	style.type = "text/css";
	style.appendChild( document.createTextNode(css) );
	toNode.appendChild( style );
};
NLM.appendViewport = function( content, toNode ){
	var node=document.createElement('meta');
	node.name = "viewport";
	node.content = content;
	toNode.appendChild(node);
};

NLM.css.main = " \
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

NLM.BUTTONS = [
{ onclick:"NLM.exportTable();", text:"Export Table" },
{ onclick:"NLM.openCustomView();", text:"Custom View (Beta)" },
];

NLM.addButton = function( obj ){
	NLM.headButtonsContainer.innerHTML +=
		"<button class='HeadCustomButton button' onclick='"+obj.onclick+"'>"+obj.text+"</button>";
};

NLM.modifyDisplayList = function(){
	setTimeout( function(){
		var BASEURL = "https://brainstorming.azurewebsites.net/watermeter.html";

		var divs = document.querySelectorAll( "#nom-table .nomination" );

		var hashIds = [];
		
		for( var i=0; i<divs.length; i++ ){
			var hashId = "#"+ NLM.imgUrlToHashId( divs[i].querySelector("img").src );
			
			if( divs[i].querySelectorAll(".customButtonArea").length >0 ){
				continue;
			}
			divs[i].innerHTML = "<div class='customButtonArea'>"
				+"<button class='customButton button' onclick='window.open(\""+BASEURL+hashId+"\", \"watermeter0\"); event.stopPropagation();'>水表</button>"
				+"</div>" + divs[i].innerHTML;
		}
	}, 1000 );
}

//===================================

NLM.css.exportTable = " \
table{ \
table-layout: fixed; \
} \
td, th { \
	border 1px solid black; \
	max-width: 300px; \
	overflow: ellipsis; \
} \
";

NLM.exportTable_COLUMNS = [
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

NLM.exportTable = function(){
	var COLUMNS = NLM.exportTable_COLUMNS;
	
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
	
	var w = window.open();
	w.document.title = nomCtrl.length;
	w.document.body.appendChild( table );
	
	NLM.appendCSS( NLM.css.exportTable, w.document.body );
};

//===================================

NLM.CUSTOM.categoriseNomList = function( nomList ){
	var d = {
		ALL:[],
		status:{},
		upgraded:{
			true:[],
			false:[],
			next:[],
		},
	};

	for( var iNom=0; iNom<nomList.length; iNom++ ){
		var nom = nomList[iNom];
		
		d.ALL.push( nom );
		
		d.status[nom.status] = d.status[nom.status] || [];
		d.status[nom.status].push( nom );

		d.upgraded[nom.upgraded].push( nom );
		
		if( nom.nextUpgrade ){
			d.upgraded.next.push( nom );
		}
	}

	// === sort all by "day"
	for( var iL1 in d ){
		if( Array.isArray( d[iL1] ) ){
			d[iL1].sort( function(a,b){ a.day<b.day?1:-1 } );
		}else{
			for( var iL2 in d[iL1] ){
				d[iL1][iL2].sort( function(a,b){ a.day<b.day?1:-1 } );
			}
		}
	}

	return d;
}

NLM.CUSTOM.Class_CustomView = function(){
	this.win = window.open();
	this.win.customView = this;
	
	this.data = NLM.CUSTOM.categoriseNomList( nomCtrl.nomList );
	
	this.createMenu();
	this.displayContainer = new NLM.CUSTOM.Class_DisplayContainer( this );
	
	NLM.appendViewport(
		"width=560, initial-scale=1, user-scalable=yes"
		, this.win.document.head );
	
	NLM.appendCSS(
		NLM.css.customView + " " + NLM.css.nomBoxCategories
		, this.win.document.body );
	
	return this;
};

NLM.CUSTOM.Class_CustomView.prototype.createMenu = function(){
	var document = this.win.document;
	var data = this.data;

	var node = document.createElement("div");
	this.menuNode = node;

	for( var iL1 in data ){
		var level1Container = document.createElement("div");
		node.appendChild( level1Container );
		level1Container.className = "menu L1 container";

		var level1Button = document.createElement("div");
		level1Container.appendChild( level1Button );
		level1Button.className = "menu L1 button";
		
		
		if( Array.isArray( data[iL1] ) ){
			// for "ALL"
			level1Button.setAttribute('onclick', "customView.displayContainer.showNomList('"+iL1+"')");
			level1Button.innerText = iL1 + " (" + data[iL1].length + ")";
			
		}else{
			level1Button.innerText = iL1;
			
			var level2Container = document.createElement("div");
			level1Container.appendChild( level2Container );
			level2Container.className = "menu L2 container";

			for( var iL2 in data[iL1] ){
				var level2Button = document.createElement("div");
				level2Container.appendChild( level2Button );
				level2Button.className = "menu L2 button";
				level2Button.innerText = iL2 + " (" + data[iL1][iL2].length + ")";
				level2Button.setAttribute('onclick', "customView.displayContainer.showNomList('"+iL1+"','"+iL2+"')");
			}
		}
	}
	
	document.body.appendChild( node );
};

NLM.CUSTOM.Class_DisplayContainer = function( customView ){
	this.customView = customView;
	var document = customView.win.document;
	
	var node = this.node = document.createElement("div");
	node.className = "displayContainer";
	document.body.appendChild( node );
	
	customView.displayContainer = this;
	
	return this;
};

NLM.CUSTOM.Class_DisplayContainer.prototype.showNomList = function( key1, key2=null ){
	var document = this.customView.win.document;
	
	var displayContainer = document.querySelector(".displayContainer");
	displayContainer.innerHTML = '';
	var list = this.customView.data[key1];
	if( key2 !== null ){
		list = list[key2];
	}
	for (var iNom=0; iNom<list.length; iNom++ ) {
		var nom = list[iNom];
		this.showNomination( nom );
	}
};

NLM.CUSTOM.Class_DisplayContainer.prototype.showNomination = function( nom ){
	var document = this.customView.win.document;
	
	var classNames = [ "nomBox" ];
	classNames.push( "status-" + nom.status );
	if( nom.upgraded ) classNames.push( "upgraded" );
	if( nom.nextUpgrade ) classNames.push( "nextUpgrade" );
	
	var nomBox = document.createElement("div");
	this.node.appendChild( nomBox );
	nomBox.className = classNames.join(" ");
	nomBox.id = NLM.imgUrlToHashId( nom.imageUrl );

	var img = document.createElement("img");
	nomBox.appendChild( img );
	img.src = nom.imageUrl + "=s80";

	var title = document.createElement("div");
	nomBox.appendChild( title );
	title.innerText = nom.title;

	var date = document.createElement("div");
	nomBox.appendChild( date );
	date.innerText = nom.day;
	
	var button_watermeter = document.createElement("a");
	nomBox.appendChild( button_watermeter );
	button_watermeter.innerText = "水表";
	button_watermeter.className = "button";
	button_watermeter.href = "https://brainstorming.azurewebsites.net/watermeter.html#" + nomBox.id;
	button_watermeter.setAttribute('target', 'watermeter0');
};

NLM.css.customView = " \
* { \
	box-sizing: border-box; \
} \
body{ \
	background-color: #001212; \
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
	display: inline-block; \
} \
.button:hover{ \
	background-color: #5BC5C5;\
	border-color: #226767; \
} \
.menu.button{ \
	margin: 2px; \
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
	border-radius: 5px; \
	min-height: 100px; \
	width: 100px; \
	padding: 2px; \
	margin: 3px; \
	vertical-align: top; \
	text-align: center; \
} \
.nomBox .button{ \
padding: 3px; \
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

NLM.css.nomBoxCategories = " \
.nomBox.status-NOMINATED { \
	border-color: #AAAAAA; \
} \
.nomBox.status-VOTING { \
	border-color: #DCDC00; \
	border-width: 2px; \
} \
.nomBox.status-ACCEPTED { \
	border-color: #59E759; \
	border-style: dashed; \
	border-width: 2px; \
} \
.nomBox.status-REJECTED { \
	border-color: #F75959; \
	border-style: dashed; \
} \
.nomBox.status-DUPLICATE { \
	border-color: #FFBE00; \
	border-style: dashed; \
} \
.nomBox.upgraded:after { \
	content : url('https://wayfarer.nianticlabs.com/img/lightning-20px.png'); \
} \
.nomBox.nextUpgrade:after { \
	content : url('https://wayfarer.nianticlabs.com/img/lightning-20px.png'); \
	border: 2px dotted #d752ff;\
	border-radius: 99px; \
	display: inline-block; \
} \
.nomBox.status-WITHDRAWN { \
	border-color: #F75959; \
	background-image: repeating-linear-gradient(45deg, #ff000033 5px, transparent 5px, transparent 10px, #ff000033 10px, #ff000033 15px); \
} \
";

NLM.openCustomView = function(){
	NLM.CUSTOM.customView = 
		new NLM.CUSTOM.Class_CustomView();
};

//===================================

NLM.init = function(){
	nomCtrl.reload2 = nomCtrl.datasource.get;
	nomCtrl.datasource.get = function() {
	  var tReturn = nomCtrl.reload2.apply( nomCtrl.reload2, arguments);
	  NLM.modifyDisplayList();
	  return tReturn;
	};
	
	NLM.appendCSS( NLM.css.main, document.body );
	
	// add head buttons
	var h = NLM.headButtonsContainer = document.createElement("div");
	document.querySelector(".nomination-header").appendChild( h );
	
	for( var i=0; NLM.BUTTONS.length; i++ ){
		NLM.addButton( NLM.BUTTONS[i] );
	}
};

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
	NLM.init();
	
}, 100 );
