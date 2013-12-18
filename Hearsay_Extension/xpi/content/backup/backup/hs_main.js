/*
 * Main part of extension.
 * depends on:
 * 	hs_transport.js
 *  hs_msgtypes.js
 * 	hs_message.js
 */

(function()
{
// services, such as console output
// internal variables
	var transport = null;
	var keyboard = null;
	var mouse = null;
	var tts = null;
	var newTabId;
	var tabMap = {};	// map tabId: tab
	var activeTab = null;
	var activeTabBrowser = null;
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	function log(msg) {	consoleService.logStringMessage("[main] : "+msg);	}
	
	function getActiveTabId()
	{
		var activeTabId;
		for(var tabId in tabMap)
		{
			if(tabMap[tabId].getBrowser() == activeTabBrowser)
			{
				activeTabId = tabId;
			}
		}
		return activeTabId;
	}
	
	//Tab events
	function onTabAdded(event)
	{
		log('A new tab was added');
		var browser = gBrowser.getBrowserForTab(event.target);
		browserHandler = hsCreateBrowserHandler(browser, listener);
		tabMap[newTabId] = browserHandler;
		//Dont care here about document
		var currentDocument = browser.contentDocument;
		//tabMap[newTabId] = event.target;
		newTabMessage = hsMessage.create(hsMsgType.NEW_TAB, newTabId);
		transport.send(newTabMessage.toXMLString());
		if(currentDocument.readyState === "loading")
		{
			log('LOADING');
			currentDocument.onreadystatechange = function () {
				if (currentDocument.readyState === "complete" || currentDocument.readyState === "interactive") {
					//TODO: Generate payload before sending
					sendInitDom(newTabId, null);
				}
			};
		}
		else
		{
			sendInitDom(newTabId, currentDocument.URL, null);
		}
		newTabId++;
	}

	function onTabRemoved(event)
	{
		log('A tab was removed');
		var tabRemovedBrowser = gBrowser.getBrowserForTab(event.target);
		var tabRemovedId;
		activeTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
		for(var tabId in tabMap)
		{
			if(tabMap[tabId].getBrowser() == tabRemovedBrowser)
			{
				tabRemovedId = tabId;
			}
		}
		if(tabRemovedId)
		{
			//TODO: tabBrowserHandlerMap[].release();
			delete tabMap[tabRemovedId];
			removedTabMessage = hsMessage.create(hsMsgType.DELETE_TAB, tabRemovedId);
			transport.send(removedTabMessage.toXMLString());
		}
		//TODO: Send active tab for the newly active tab
		var newActiveTabId = getActiveTabId();
		if(newActiveTabId)
		{
			activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, newActiveTabId);
			transport.send(activeTabMessage.toXMLString());
		}
	}

	function onTabActivated(event)
	{
		log('A tab has just been selected');
		var newActiveTabId = getActiveTabId();
		if(newActiveTabId)
		{
			activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, newActiveTabId);
			transport.send(activeTabMessage.toXMLString());
		}
	}
	
	var listener =
	{
		// transport events ----------------------------------------------------------------------
		onConnect: 		/*void*/function(/*hsTransport*/ handle) 
		{
			newTabId = 1;
			// Initialize keyboard, mouse and tts components
			mouse = hsCreateMouseHandler(listener);
			keyboard = hsCreateKeyboardHandler(listener);
			log("handlers created");
			
			// enumerate already existed tabs and send INIT_DOMs
			var activeTabId;
			var numberOfTabs = gBrowser.browsers.length;
			//Make separate function
			for(var index = 0; index < numberOfTabs; index++)
			{
				var browserInstance = gBrowser.getBrowserAtIndex(index);
				var currentDocument = browserInstance.contentDocument;
				//Check document load status
				var currentTab = gBrowser.tabContainer.childNodes[index];
				var currentBrowser = gBrowser.getBrowserForTab(currentTab);
				browserHandler = hsCreateBrowserHandler(currentBrowser, this);
				tabMap[newTabId] = browserHandler;
				//Compare the stored active tab browser with browser for every tab handler
				/*if(gBrowser.selectedTab == currentTab)
				{
					activeTabId = newTabId;
				}*/
				//Separate function to process a new tab
				newTabMessage = hsMessage.create(hsMsgType.NEW_TAB, newTabId);
				handle.send(newTabMessage.toXMLString());
				//Move to the onDOMINIT in browser handler
				//TODO: pageShow event
				if(currentDocument.readyState == "loading")
				{
					/*
					var tabBrowser = gBrowser.getBrowserForTab(currentTab);
					currentDocument.addEventListener("load", function () {
					//Do not worry about sending to server yet
					var payloadNode = document.createElement("payload");
					var currentURL = currentDocument.URL;
					htmlTree(payloadNode, document.getElementsByTagName('HTML')[0].parentNode);
					sendInitDom(newTabId, currentURL, payloadNode);
					
				});*/
				}
				else
				{
					xmlDoc = document.implementation.createDocument('http://www.w3.org/1999/xhtml','HTML', null);
					var currentXMLNode = xmlDoc.getElementsByTagName("HTML")[0];
					currentXMLNode.setAttribute("node_id",0);
					map[0] = currentXMLNode;
					htmlTree(currentDocument.getElementsByTagName("HTML")[0], currentXMLNode);
					sendInitDom(newTabId, currentXMLNode);
				}
				newTabId++;
			}
			// set activeTab and send out ACTIVE_TAB message
			activeTab = tabMap[activeTabId];
			activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, activeTabId);	
			// set eventListeners for gBrowser events for new tab, delete tab, and active tab
			var container = gBrowser.tabContainer;
			container.addEventListener("TabOpen", onTabAdded, false);
			container.addEventListener("TabClose", onTabRemoved, false);
			container.addEventListener("TabSelect", onTabActivated, false);			
		},
		onDisconnect:	/*void*/function(/*hsTransport*/ handle) 
		{	
			if(keyboard)
			{
				keyboard.release();
				keyboard = null;
			}
			if(mouse)
			{
				mouse.release();
				mouse = null;
			}
			if(tts)
			{
				tts.release();
				tts = null;
			}
			if(tabMap)
			{
				for(tabId in tabMap)
				{
					//TODO: tabBrowserHandlerMap[tabId].release();
				}
			}
			tabMap = {};
			//TODO: tabBrowserHandlerMap = {};
			// release gBrowser listeners
			var container = gBrowser.tabContainer;
			container.removeEventListener("TabOpen", onTabAdded, false);
			container.removeEventListener("TabClose", onTabRemoved, false);
			container.removeEventListener("TabSelect", onTabActivated, false);
		},
		onReceive:		/*void*/function(/*hsTransport*/ handle, /*String*/message) 
		{
			var msg = hsMessage.load(message);
			switch(msg.getType())
			{
			case hsMsgType.TTS_SPEAK:
				var text = msg.getParameter("text");
				var text_id = msg.getParameter("text_id");
				text = text && text.length>0 && text[0];
				if(text)
				{
					text_id = text_id && text_id.length>0 && text_id[0];
					tts.speak(text, text_id);
				}
				break;
			case hsMsgType.TTS_CANCEL:
				// TODO: implement it
				break;
			case hsMsgType.SET_HIGHLIGHT:
				var tab = tabMap[msg.getId()];
				if(tab)
					tab.setHightLight(msg.getParameter("node_id"));
				break;
			default:
				// TODO: print error message to console with message description
				log("in default: error ");
			}
		},
		// TTS events -----------------------------------------------------------------------
		onEndSpeak: /*void*/function(/*ttsHandler*/tts, /*String*/text_id)
		{
			
		},
		// ----------------------------------------------------------------------------------
		// TODO: add keyboard, mouse event handlers
		onKeyPress: /*void*/function(/*keybHandler*/keyboard, /*String*/key)
		{
			log(" onKeyPress message sent!"+ key);
			// TODO: send hsMsgType.KEY message
			if(activeTab)
			{
				log(" onKeyPress message sent!");
				var msg = hsMessage.create(hsMsgType.KEY, activeTab.getId());
				msg.setParameter("press", [key]);
				transport.send(msg.toXMLString());
				
			}
		},
		onClick : /*void*/function(/*[hsMouseHandler]*/ mouse, /*[Node]*/ clicked_node, /*[String]*/ button)
		{
			log(" onClick message sent!"+ button);
			if(activeTab)
			{
				log("onClick message sent!");
				var msg = hsMessage.create(hsMsgType.MOUSE, activeTab.getId());
				msg.setParameter("click", [button]);
				transport.send(msg.toXMLString());
				//log("onClick message sent!"+ msg.toXMLString());
			}
		},
		// DOM events observer
		// TODO: implement it
		// onDOMUpdate,
		// onDOMDelete,
		// onDOMInit,
		// onDOMMove,
		// onDOMAttrChange,
		// onDOMAttrDelete,
		// onValueChange
	};
	
	function sendInitDom(tabId, payload)
	{
		initDOMMessage = hsMessage.create(hsMsgType.INIT_DOM, tabId);
		initDOMMessage.setParameter("URL", [document.url]);
		//TODO: Set payload
		initDOMMessage.setPayload(payload);
		log(initDOMMessage.toXMLString());
		transport.send(initDOMMessage.toXMLString());
	}
	
	function onLoad()
	{
		window.removeEventListener("load", onLoad, false);
		window.addEventListener("unload", onUnload, false);
		transport = hsCreateTransport("localhost", /*port*/13000, /*TransportListener*/listener);
		//transport = new HearSayTransport(listener.onConnect, listener.onDisconnect, listener.onReceive);
	}

	// do not forget to release all resources!
	function onUnload()
	{
		window.removeEventListener("unload", onUnloadBrowser, false);
		transport.release();
		// TODO: release all: transport, mouse, keyboard, listeners ....
	}
	
	// TODO: add gBrowser event listeners
	
	window.addEventListener("load", onLoad, false);
})();
