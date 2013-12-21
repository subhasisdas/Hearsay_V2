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

	function initializeDocument()
	{
		newNodeId = 1;
		docToSend = br.contentDocument;
		initializeNodeMap(br.contentDocument.documentElement);
		var xmlDocument = br.contentDocument.implementation.createDocument('http://www.w3.org/1999/xhtml','HTML', null);
		var xmlPayload = createXMLPayload(xmlDocument, docToSend.documentElement);
		//log("The xml payload is : " + xmlPayload);
		listener.onDOMInit(obj , xmlPayload, tabId);
	}

	function handleLoad(event)
	{
		var eventDocument = event.target;
		if(eventDocument == br.contentDocument)
		{
			if(docToSend == null)
			{
				initializeDocument();
			}
		}
	}

	function handleDOMContentLoaded(event)
	{
		var eventDocument = event.target;
		if(eventDocument == br.contentDocument)
		{
			if(docToSend == null)
			{
				initializeDocument();
			}
		}
	}

	function handlePageShow(event)
	{
		var eventDocument = event.target;
		if(eventDocument == br.contentDocument)
		{
			if(docToSend == null)
			{
				initializeDocument();
			}
		}
	}

	function handlePageHide(event)
	{
		docToSend = null;
	}

	var newNodeId = 0;

	var nodeMap = {};	// map id -> node

	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	var obj = {
			highlight: function(/*String[]*/ ids)
			{
				// Clear current highlightning,
				ClearHighlights(br.contentWindow);
				log("Windows cleaned ");

				log("Highlighting the new set" + ids);			
				// highlight new set of nodes

				for (var index in ids) {
					log("ids[index] value :"+ index);
					var nodeId = this.getNode(index);
					log("nodeId : " + nodeId);
					ClearHighlights(br.contentWindow);
					SetHighlightControl(nodeId,br.contentWindow);
				}
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
				return br.contentDocument.URL;
			},
			release: /*void*/ function()
			{
				br.removeEventListener('load', handleLoad);
				br.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
				br.removeEventListener('pageshow', handlePageShow);
				br.removeEventListener('pagehide', handlePageHide);
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
		//log('Creating payload now for document node  : ' + documentRootNode.nodeName);

		var internalNodeId = obj.getNodeId(documentRootNode);

		if(internalNodeId != null)
		{
			//Check if this document node is a text node
			if(documentRootNode.nodeType == 3)
			{
				if(documentRootNode.nodeValue.trim() != '')
				{
					var newTextElement = xmlDocument.createElement("textelement");
					newTextElement.setAttribute("node_id" , internalNodeId);
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
				//log("Returning xmlRootNode : " + xmlRootNode);
				return xmlRootNode;
			}
		}
		else
		{
			//log("Returning null for xmlRootNode : " + documentRootNode.nodeName);
			return null;
		}
	}

	/**
	 * Initialize the node map from the document tree provided and filter nodes with the provided filter callback
	 */
	function initializeNodeMap(documentRootNode)
	{
		//log('Initializing node map for document node : ' + documentRootNode.nodeName + " with value : " + documentRootNode.nodeValue + " and type : " + documentRootNode.nodeType);
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
				if(childNode.nodeType == 3 && childNode.nodeValue.trim() == '')
				{
					log("Ignoring empty text node");
				}
				else
				{
					initializeNodeMap(childNode);
				}
			}
		}
	}

	function log(msg) {	consoleService.logStringMessage("brhandler] "+msg);	}

	// TODO: add implementation.
	// use br events to control load page process,
	// use mutation observer to control page mutations

	log('hsCreateBrowserHandler invoked with document status : ' + document.readyState);

	var docToSend = null;

	if(br.contentDocument.readyState === "complete" || br.contentDocument.readyState === "interactive")
	{
		//log("ready state of body : " + doc.body + " " + br.contentDocument.body);s
		log('document loading is now complete : ' + br.contentDocument.readyState + 'with URL as ' + br.contentDocument.URL);
		docToSend = br.contentDocument;
		initializeNodeMap(br.contentDocument.documentElement);
		var xmlDocument = br.contentDocument.implementation.createDocument('http://www.w3.org/1999/xhtml','HTML', null);
		//log(br.contentDocument.body.hasChildNodes());
		var xmlPayload = createXMLPayload(xmlDocument, docToSend.documentElement);
		//log("The payload generated was : " + xmlPayload);
		listener.onDOMInit(obj , xmlPayload, tabId);
	}
	/**
	 * Update part of document, receive load as well as DOMContentLoad
	 */

	br.addEventListener('load', handleLoad, false);
	br.addEventListener('DOMContentLoaded', handleDOMContentLoaded, false);
	br.addEventListener('pageshow', handlePageShow, false);
	br.addEventListener('pagehide', handlePageHide, false);

	return obj;

}
