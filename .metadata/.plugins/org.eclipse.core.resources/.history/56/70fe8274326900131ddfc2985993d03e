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


/*hsBrowserHandler*/ function hsCreateBrowserHandler(/*Browser*/br, /*Listener*/ listener, /*long*/ tabId, /*custom filter ignoreCheckFn(Node to check)*/ ignoreCheckFunction)
{

	var newNodeId = 0;

	var nodeMap = {};	// map id -> node

	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	var obj = {
			highlight: function(/*String[]*/ ids)
			{
				// Clear current highlightning, 
				// highlight new set of nodes
			},
			getNode: function(/*String*/ id)
			{
				if(id in nodeMap)
				{
					return nodeMap[id];
				}
				return null;
			},
			/*String*/getNodeId: function(/*Node*/node)
			{
				return node._internalNodeId;
			},
			getURL: function()
			{
				// returns current URL
			},
			release: /*void*/ function()
			{

			},
			getBrowser:function() { return br; }
	};

	function copyAttributes(htmlDocNode, xmlDocNode)
	{
		if(htmlDocNode.hasAttributes())
		{
			for(var x=0; x < htmlDocNode.attributes.length ; x++)
			{
				var attributeNode = htmlDocNode.attributes[x];
				xmlDocNode.setAttribute(attributeNode.nodeName,attributeNode.nodeValue);
			}
		}
		return xmlDocNode;
	}

	/**
	 * TODO: Ignore empty nodes where you assign id's when storing nodes in node map
	 * 
	 */
	function createXMLPayload(xmlDocument, documentRootNode)
	{
		/**
		 * Checking for empty nodes
		 */
		//Creates an XML payload in reference to the current node map by traversing the given document
		log('Creating payload now for document node  : ' + documentRootNode.nodeName);
		
		var internalNodeId = obj.getNodeId(documentRootNode);
		
		if(internalNodeId != null)
		{
			//Check if this document node is a text node
			if(documentRootNode.nodeType == 3)
			{
				if(documentRootNode.nodeValue.trim() != '')
				{
					var newTextElement = xmlDocument.createElement("textelement");
					var newtextNode = xmlDocument.createTextNode(documentRootNode.nodeValue);
					newTextElement.appendChild(newtextNode);
					return newTextElement;
				}            
			}
			else
			{
				var xmlRootNode = xmlDocument.createElement(documentRootNode.nodeName);
				xmlRootNode = copyAttributes(documentRootNode, xmlRootNode);
				xmlRootNode.setAttribute("node_id",internalNodeId);
				for(var x=0 ; x < documentRootNode.childNodes.length ; x++)
				{
					var childNode = documentRootNode.childNodes[x];
					var elementToAppend = createXMLPayload(xmlDocument, childNode);
					if(elementToAppend != null)
					{
						xmlRootNode.appendChild(elementToAppend);
					}
				}
				return xmlRootNode;
			}
		}
		else
		{
			return null;
		}
	}

	/**
	 * Initialize the node map from the document tree provided and filter nodes with the provided filter callback
	 */
	function initializeNodeMap(documentRootNode)
	{
		log('Initializing node map for document node : ' + documentRootNode.nodeName + " with value : " + documentRootNode.nodeValue + " and type : " + documentRootNode.nodeType);
		//Invoke specified filter that checks if the given node must be ignored or not
		if(ignoreCheckFunction(documentRootNode))
		{
			return;
		}
		nodeMap[newNodeId] = documentRootNode;
		documentRootNode._internalNodeId = newNodeId;
		newNodeId++;
		if(documentRootNode.hasChildNodes())
		{
			for(var x=0 ; x < documentRootNode.childNodes.length ; x++)
			{
				var childNode = documentRootNode.childNodes[x];
				initializeNodeMap(childNode);
			}
		}
	}

	function log(msg) {	consoleService.logStringMessage("browserhandler] "+msg);	}

	// TODO: add implementation.
	// use browser events to control load page process,
	// use mutation observer to control page mutations

	var doc = br.contentDocument;

	log('hsCreateBrowserHandler invoked with document status : ' + document.readyState);

	var docToSend = null;

	if(document.readyState == "complete" || document.readyState == "interactive")
	{
		log('document loading is now complete : ' + document.readyState + 'with URL as ' + document.URL);
		docToSend = doc;
		initializeNodeMap(docToSend.documentElement);
		var xmlDocument = document.implementation.createDocument ('http://www.w3.org/1999/xhtml','HTML', null);
		var xmlPayload = createXMLPayload(xmlDocument, docToSend.documentElement);
		listener.onDOMInit(obj , xmlPayload, tabId);
	}
	else
	{
		docToSend = null;
		/**
		 * Update part of document, receive load as well as DOMContentLoad
		 */		
		docToSend.addEventListener('load',  function(event) {
			//Parse the page into an XML tree and invoke onDOMInit
			log('load was raised');
			if(docToSend == null)
			{
				docToSend = browser.contentDocument;
				var htmlNode = docToSend.getElementsByTagName("HTML")[0];
				initializeNodeMap(htmlNode);
			}
			else
			{
				//Ignore repeated event
			}
		}, false);
		document.addEventListener('DOMContentLoaded',  function(event) {
			//Parse the page into an XML tree and invoke onDOMInit
			log('DOMContentLoaded was raised');
			if(docToSend == null)
			{
				docToSend = browser.contentDocument;
				var htmlNode = docToSend.getElementsByTagName("HTML")[0];
				initializeNodeMap(htmlNode);
			}
			else
			{
				//Ignore repeated event
			}
		}, false);

		document.addEventListener('pageshow',  function(event) {
			//Parse the page into an XML tree and invoke onDOMInit
			log('pageshow event was raised with state : ' + event.doc.readyState);
			if(docToSend == null)
			{
				docToSend = browser.contentDocument;
				var htmlNode = docToSend.getElementsByTagName("HTML")[0];
				initializeNodeMap(htmlNode);
			}
			else
			{
				//Ignore repeated event
			}
		}, false);
	}

	document.addEventListener('pagehide',  function(event) {
		//We do not need to process pagehide so may remove this listener
		log('pagehide was raised');
	}, false);

	return obj;

}
