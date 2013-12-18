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
	var activeTabBrowser = null;
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	function log(msg) {	consoleService.logStringMessage("main] "+msg);	}
	
	function getTabId(/*Browser*/ br)
	{
		var tabIdForBrowser;
		for(var tabId in tabMap)
		{
			if(tabMap[tabId].getBrowser() == br)
			{
				tabIdForBrowser = tabId;
			}
		}
		return tabIdForBrowser;
	}
	
	function processNewTab(/*int*/ newTabId, /*Browser*/ browser)
	{
		newTabMessage = hsMessage.create(hsMsgType.NEW_TAB, newTabId);
		//transport.send(newTabMessage.toXMLString());
		browserHandler = hsCreateBrowserHandler(browser, listener);
		tabMap[newTabId] = browserHandler;
	}
	
	//Tab events
	function onTabAdded(event)
	{
		var browser = gBrowser.getBrowserForTab(event.target);
		processNewTab(newTabId, browser);
		newTabId++;
	}

	function onTabRemoved(event)
	{
		log('A tab was removed');
		var removedTabBrowser = gBrowser.getBrowserForTab(event.target);
		var tabRemovedId;
		activeTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
		for(var tabId in tabMap)
		{
			if(tabMap[tabId].getBrowser() == removedTabBrowser)
			{
				tabRemovedId = tabId;
			}
		}
		if(tabRemovedId)
		{
			tabMap[tabRemovedId].release();
			delete tabMap[tabRemovedId];
			removedTabMessage = hsMessage.create(hsMsgType.DELETE_TAB, tabRemovedId);
			//transport.send(removedTabMessage.toXMLString());
		}
		if(activeTabBrowser)
		{
			var newActiveTabId = getActiveTabId();
			if(newActiveTabId)
			{
				activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, newActiveTabId);
				//transport.send(activeTabMessage.toXMLString());
			}
		}
	}

	function onTabActivated(event)
	{
		log('A tab has just been selected / activated');
		activeTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
		var newActiveTabId = getTabId(activeTabBrowser);
		if(newActiveTabId)
		{
			activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, newActiveTabId);
			//transport.send(activeTabMessage.toXMLString());
		}
	}
	
	/**
	 * Invoked from the listener's onConnect implementation
	 */
	function enumerateExistingTabs(/*tabbrowser*/ gBrowser)
	{
		var numberOfTabs = gBrowser.browsers.length;
		for(var index = 0; index < numberOfTabs; index++)
		{
			var currentTab = gBrowser.tabContainer.childNodes[index];
			var currentBrowser = gBrowser.getBrowserForTab(currentTab);
			processNewTab(newTabId, currentBrowser);
			newTabId++;
		}
	}
	
	var listener =
	{
		// transport events ----------------------------------------------------------------------
		onConnect: 		/*void*/function(/*hsTransport*/ handle) 
		{
			newTabId = 1;
			// Initialize keyboard, mouse and tts components
			log("initializing the handlers");
			tts = hsCreateTTS(listener);
			mouse = hsCreateMouseHandler(listener);
			keyboard = hsCreateKeyboardHandler(listener);	
			log("handlers created");
			
			var activeTabId;
			//enumerate already existed tabs and send INIT_DOMs
			enumerateExistingTabs(gBrowser);
			if(gBrowser.selectedTab)
			{
				//Set the active tab and send the ACTIVE_TAB message to server
				activeTabId = getTabId(gBrowser.getBrowserForTab(gBrowser.selectedTab));
				if(activeTabId)
				{
					activeTab = tabMap[activeTabId];
					activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, activeTabId);
					//transport.send(activeTabMessage.toXMLString());
				}
			}
			// set eventListeners for gBrowser events for new tab, delete tab, and active tab
			var container = gBrowser.tabContainer;
			container.addEventListener("TabOpen", onTabAdded, false);
			container.addEventListener("TabClose", onTabRemoved, false);
			container.addEventListener("TabSelect", onTabActivated, false);			
		},
		onDisconnect:	/*void*/function(/*hsTransport*/ handle) 
		{	
			log("onDisconnect!");
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
				//tts.release();
				tts = null;
			}
			if(tabMap)
			{
				for(tabId in tabMap)
				{
					tabMap[tabId].release();
				}
			}
			tabMap = {};
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
				var text_id = msg.getParameter("text_id");
				text_id = text_id && text_id.length>0 && text_id[0];
				tts.cancel(text_id);
				// TODO: implement it
				//sdas:done
				break;
			case hsMsgType.SET_HIGHLIGHT:
				var tab = tabMap[msg.getId()];
				if(tab)
					tab.setHightLight(msg.getParameter("node_id"));
				break;
			default:
				log("in Default");
				// TODO: print error message to console with message description
			}
		},
		// TTS events -----------------------------------------------------------------------
		onEndSpeak: /*void*/function(/*ttsHandler*/tts, /*String*/text_id)
		{
			log("onEndSpeak "+text_id );
		},
		// ----------------------------------------------------------------------------------
		// TODO: add keyboard, mouse event handlers
		onKeyPress: /*void*/function(/*keybHandler*/keyboard, /*String*/key)
		{
			// TODO: send hsMsgType.KEY message
			log(" onKeyPress message sent!"+ key);
			tts.speak(key,1);
			/*if(activeTab)
			{
				log(" onKeyPress message sent!");
				var msg = hsMessage.create(hsMsgType.KEY, activeTab.getId());
				msg.setParameter("press", [key]);
				transport.send(msg.toXMLString());
				
			}*/
		},
		onClick : /*void*/function(/*[hsMouseHandler]*/ mouse, /*[Node]*/ clicked_node, /*[String]*/ button)
		{
			log(" onClick message sent!"+ button);
			tts.speak("click",1);
			/*if(activeTab)
			{
				log("onClick message sent!");
				var msg = hsMessage.create(hsMsgType.MOUSE, activeTab.getId());
				msg.setParameter("click", [button]);
				transport.send(msg.toXMLString());
				//log("onClick message sent!"+ msg.toXMLString());
			}*/
		},
		// DOM events observer
		// TODO: implement it
		// onDOMUpdate,
		// onDOMDelete,
		onDOMInit: /*void*/function(/*hsBrowserHandler*/ handler, /*Node*/ xml_dom)
		{
			var relevantTabId = getTabId(handler.getBrowser());
			if(relevantTabId)
			{
				initDOMMessage = hsMessage.create(hsMsgType.INIT_DOM, relevantTabId);
				initDOMMessage.setParameter("URL", [document.url]);
				initDOMMessage.setPayload(xml_dom);
				//transport.send(initDOMMessage.toXMLString());
			}
		},
		// onDOMMove,
		// onDOMAttrChange,
		// onDOMAttrDelete,
		// onValueChange
	};
	
	function onLoad()
	{
		window.removeEventListener("load", onLoad, false);
		window.addEventListener("unload", onUnload, false);
		
		log("Listener onConnect");
		listener.onConnect(null);

		//transport = hsCreateTransport("localhost", /*port*/13000, /*TransportListener*/listener);
		log("transport initiated");
		//log(transport);
	}

	// do not forget to release all resources!
	function onUnload()
	{
		window.removeEventListener("unload", onUnload, false);
		
		// TODO: release all: transport, mouse, keyboard, listeners ....
		//transport.release();
		mouse.release();
		keyboard.release();
		tts.release();
	
	}
	
	// TODO: add gBrowser event listeners
	
	window.addEventListener("load", onLoad, false);
})();
