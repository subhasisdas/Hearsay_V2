/*
 * Browser event handler
 * 
 * listener
 * {
		onDOMUpdate(hsBrowserHandler handler, String parent_id, String prev_sibling_id, Node xml_dom);
		onDOMDelete(hsBrowserHandler handler, String[] node_ids);
		onDOMInit(hsBrowserHandler handler, Node xml_dom);
		onDOMMove(hsBrowserHandler handler, String new_parent_id, String new_prev_sibling_id, String moved_node_id);
		onDOMAttrChange(hsBrowserHandler handler, String[] node_id, String[] attr, String[] values);
		onDOMAttrDelete(hsBrowserHandler handler, String[] node_id, String[] attr);
		onValueChange(hsBrowserHandler handler, String node_id, String value);
 * }
 * 
 * Implement this handler in the following order:
 * 1) Implement static part (init)
 * 2) Implement highlight
 * 3) Implement dynamic part (load/unload/pageshow) that can call onDOMInit (when whole page will be loaded)
 * 4) Implement dynamic part 2 (use mutation_summary): changes in 

 * 5) Implement frame support (Don't forget, that frames can be removed/created too, as any other document node)
 * 6) Implement value change event listener for input nodes.
 */

/*hsBrowserHandler*/ function hsCreateBrowserHandler(/*Browser*/br, /*Listener*/ listener)
{
	var nodeMap = {};	// map id -> node
	
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	function log(msg) {	consoleService.logStringMessage("browserhandler] "+msg);	}
	
	function initializeAndSendInitDOM(document) {
		log('Initializing for URL : ' + document.URL);
	}
	
	// TODO: add implementation.
	// use browser events to control load page process,
	// use mutation observer to control page mutations
	// add custom serializer to build custom XML tree.
	
	//TODO: document events such as pageShow, pageHide, onDOMContentLoaded
	
	var document = br.contentDocument;
	
	log('hsCreateBrowserHandler invoked with document status : ' + document.readyState);
	
	if(document.readyState == "complete" || document.readyState == "interactive")
	{
	log('document loading is now complete : ' + document.readyState);
		initializeAndSendInitDOM(document);
	}
	else
	{
		document.addEventListener('DOMContentLoaded',  function(event) {
			//Parse the page into an XML tree and invoke onDOMInit
			alert('DOMContentLoaded with state : ' + event.doc.readyState);
			log('DOMContentLoaded was raised');
		}, false);

		document.addEventListener('pageshow',  function(event) {
			//Parse the page into an XML tree and invoke onDOMInit
			log('pageshow event was raised with state : ' + event.doc.readyState);
		}, false);
	}
	
	document.addEventListener('pagehide',  function(event) {
		log('pagehide was raised');
	}, false);
	
	/*if(currentDocument.readyState == "loading")
	{
		
		var tabBrowser = gBrowser.getBrowserForTab(currentTab);
		currentDocument.addEventListener("load", function () {
		//Do not worry about sending to server yet
		var payloadNode = document.createElement("payload");
		var currentURL = currentDocument.URL;
		htmlTree(payloadNode, document.getElementsByTagName('HTML')[0].parentNode);
		sendInitDom(newTabId, currentURL, payloadNode);
		
	});
	}
	else
	{
		xmlDoc = document.implementation.createDocument('http://www.w3.org/1999/xhtml','HTML', null);
		var currentXMLNode = xmlDoc.getElementsByTagName("HTML")[0];
		currentXMLNode.setAttribute("node_id",0);
		map[0] = currentXMLNode;
		htmlTree(currentDocument.getElementsByTagName("HTML")[0], currentXMLNode);
		sendInitDom(newTabId, currentXMLNode);
	}*/
	
	
	var obj = {
		highlight: function(/*String[]*/ ids)
		{
			// Clear current highlightning, 
			// highlight new set of nodes
		},
		getNode: function(/*String*/ id)
		{
			// return Node or null if not found in nodeMap
		},
		getNodeId: function(/*Node*/node)
		{
			// return: node ID or null if not found
		},
		getURL: function()
		{
			// returns current URL
		},
		release: /*void*/ function()
		{
			// TODO: release listeners
		},
		getBrowser:function() { return br; }
	};
	return obj;
}
