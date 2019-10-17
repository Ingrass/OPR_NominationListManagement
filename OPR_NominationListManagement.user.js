// ==UserScript==
// @name        OPR_NominationListManagement
// @namespace   asldufhiu32hr9283hf83123
// @include     https://wayfarer.nianticlabs.com/nominations*
// @author      @lokpro
// @updateURL https://github.com/Ingrass/OPR_NominationListManagement/raw/master/OPR_NominationListManagement.user.js
// @downloadURL https://github.com/Ingrass/OPR_NominationListManagement/raw/master/OPR_NominationListManagement.user.js
// @version     0.1
// @grant       none
// ==/UserScript==

/*
v0.1 17/10/2019
added hyperlinks to watermeter
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
		var BASEURL = "http://brainstorming.azurewebsites.net/watermeter.html";

		var divs = document.querySelectorAll( "#nom-table .nomination" );

		var hashIds = [];
		
		for( var i=0; i<divs.length; i++ ){
			var hashId = "#"+ imgUrlToHashId( divs[i].querySelector("img").src );
			
			if( divs[i].querySelectorAll(".customButtonArea").length >0 ){
				continue;
			}
			divs[i].innerHTML = "<div class='customButtonArea'>"
				//+"<a class='customButton button' target='watermeter0' href='"+BASEURL+hashId+"'>水表</a> \
				+"<button class='customButton button' onclick='window.open(\""+BASEURL+hashId+"\", \"watermeter0\"); event.stopPropagation();'>水表</button>"
				+"</div>" + divs[i].innerHTML;
		}
	}, 1000 );
}

var interval = setInterval( function(){
	// wait for var available
	try {
		window.nomCtrl = angular.element( document.querySelector("[ng-controller='NominationsController as nomCtrl']") ).scope().nomCtrl;
		//var x = nomCtrl.nomList.length;
		var x = nomCtrl.datasource.get;
	} catch (e) {
		return;
	}
	// OK
	clearInterval( interval );
	//var scrollController = nomCtrl.scrollController;

	nomCtrl.reload2 = nomCtrl.datasource.get;
	nomCtrl.datasource.get = function() {
	  var tReturn = nomCtrl.reload2.apply( nomCtrl.reload2, arguments);
		document.title = document.querySelectorAll( "#nom-table .nomination" ).length;
	  modifyDisplayList();
	  return tReturn;
	};

}, 100 );
