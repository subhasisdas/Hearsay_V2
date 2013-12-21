/*
 * Main part of extension.
 * depends on:
 * 	hs_transport.js
 *  hs_msgtypes.js
 * 	hs_message.js
 */

//services, such as console output
//internal variables
var transport = null;
var keyboard = null;
var mouse = null;
var tts = null;
var newTabId;
var tabMap = {};	// map tabId: tab
var activeTabBrowserHandler = null;
var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

function log(msg) {	consoleService.logStringMessage("main] "+msg);	}

function getTabId(/*Browser*/ br)
{
	for(var tabId in tabMap)
	{
		log('Check for tabId : ' + tabId);
		if(tabMap[tabId].getBrowser() == br)
			return tabId;
	}
	return null;
}

function ignoreCheckFunction(/*Node*/ node)
{
	if(node.nodeName == 'SCRIPT' || node.nodeName == 'script' || node.nodeType == 8)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function processNewTab(/*int*/ newTabId, /*Browser*/ browser)
{
	log('Sending NEW_TAB message');
	var newTabMessage = hsMessage.create(hsMsgType.NEW_TAB, newTabId);
	transport.send(newTabMessage.toXMLString());
	tabMap[newTabId] = hsCreateBrowserHandler(browser, listener, newTabId, ignoreCheckFunction);
}

//Tab events
function onTabAdded(event)
{
	try
	{
		var browser = gBrowser.getBrowserForTab(event.target);
		processNewTab(newTabId, browser);
		newTabId++;
	}
	catch(ex)
	{
		log(ex);
	}
}

function onTabRemoved(event)
{
	log('A tab was removed');
	var removedTabBrowser = gBrowser.getBrowserForTab(event.target);
	var tabRemovedId = getTabId(removedTabBrowser);
	var activeTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
	var newActiveTabId = getTabId(activeTabBrowser);
	if(tabRemovedId)
	{
		tabMap[tabRemovedId].release();
		delete tabMap[tabRemovedId];
		var m = hsMessage.create(hsMsgType.DELETE_TAB, tabRemovedId);
		transport.send(m.toXMLString());
	}
	if(newActiveTabId)
	{
		activeTabBrowserHandler = tabMap[newActiveTabId];
		if(activeTabBrowserHandler)
		{
			var activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, newActiveTabId);
			transport.send(activeTabMessage.toXMLString());
		}
	}
}

function onTabActivated(event)
{
	log('A tab has been selected / activated');
	var activeTabBrowser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
	var newActiveTabId = getTabId(activeTabBrowser);
	if(newActiveTabId)
	{
		activeTabBrowserHandler = tabMap[newActiveTabId];
		var activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, newActiveTabId);
		transport.send(activeTabMessage.toXMLString());
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
			log('onConnect on listener in main was invoked');
			newTabId = 1;
			log('onConnect 1');
			// Initialize keyboard, mouse and tts components
			log("initializing the handlers");
			tts = hsCreateTTS(listener);
			mouse = hsCreateMouseHandler(listener);
			keyboard = hsCreateKeyboardHandler(listener);	
			log("handlers created");

			//enumerate already existed tabs and send INIT_DOMs
			enumerateExistingTabs(gBrowser);
			if(gBrowser.selectedTab)
			{
				//Set the active tab and send the ACTIVE_TAB message to server
				var activeTabId = getTabId(gBrowser.getBrowserForTab(gBrowser.selectedTab));
				if(activeTabId)
				{
					activeTabBrowserHandler = tabMap[activeTabId];
					var activeTabMessage = hsMessage.create(hsMsgType.ACTIVE_TAB, activeTabId);
					transport.send(activeTabMessage.toXMLString());
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
			//log("Listener onReceive msg="+message);
			switch(msg.getType())
			{
			case hsMsgType.TTS_SPEAK:

				var text = msg.getParameter("text");
				var text_id = msg.getParameter("text_id");				
				text = text && text.length>0 && text[1];
				if(text)
				{
					text_id = text_id && text_id.length>0 && text_id[1];
					tts.speak(text, text_id);
				}
				break;
			case hsMsgType.TTS_CANCEL:
				// TODO: implement it
				break;
			case hsMsgType.SET_HIGHLIGHT:
				log("hsMsgType.SET_HIGHLIGHT: Received")
				var tab = tabMap[msg.getId()];
				log("tab"+tab+":"+msg.getParameter("node_id"));
				if(tab)
					tab.highlight(msg.getParameter("node_id"));
				log("hsMsgType.SET_HIGHLIGHT: OK")
				break;
			default:
				// TODO: print error message to console with message description
			}
		},
		// TTS events -----------------------------------------------------------------------
		onEndSpeak: /*void*/function(/*ttsHandler*/tts, /*String*/text_id)
		{
			log("onEndSpeak "+text_id );
			var activeTabId =  getTabId(gBrowser.getBrowserForTab(gBrowser.selectedTab));
			var activeTabMessage = hsMessage.create(hsMsgType.TTS_DONE, activeTabId);
			activeTabMessage.setParameter("text_id", [text_id]);
			//if(!pause)
			transport.send(activeTabMessage.toXMLString());
		},
		// ----------------------------------------------------------------------------------
		// TODO: add keyboard, mouse event handlers
		onKeyPress: /*void*/function(/*keybHandler*/keyboard, /*String*/key)
		{
			// TODO: send hsMsgType.KEY message
			// TODO: send hsMsgType.KEY message
			log(" onKeyPress message sent!"+ key);
			var activeTabId =  getTabId(gBrowser.getBrowserForTab(gBrowser.selectedTab));
			if(activeTabId)
			{
				log(" onKeyPress message sent!");
				if(key && key.length>0)	
				{
					var activeTabMessage = hsMessage.create(hsMsgType.KEY, activeTabId);
					activeTabMessage.setParameter("press", [key]);
					log("msg sent is :"+activeTabMessage.toXMLString())
					transport.send(activeTabMessage.toXMLString());
				}

			}
		},
		onClick : /*void*/function(/*[hsMouseHandler]*/ mouse, /*[Node]*/ clicked_node, /*[String]*/ button)
		{
			log(" onClick message sent!"+ button);
			//tts.speak("click",1);
			var activeTabId =  getTabId(gBrowser.getBrowserForTab(gBrowser.selectedTab));
			if(activeTabId)
			{
				log("onClick message sent!");
				var activeTabMessage = hsMessage.create(hsMsgType.MOUSE, activeTabId);
				activeTabMessage.setParameter("click", [button]);
				//log("msg sent is :"+activeTabMessage.toXMLString())
				transport.send(activeTabMessage.toXMLString());
				//log("onClick message sent!"+ msg.toXMLString());
			}
		},
		// DOM events observer
		// TODO: implement it
		// onDOMUpdate,
		// onDOMDelete,
		onDOMInit: /*void*/function(/*hsBrowserHandler*/ handler, /*Node*/ xml_dom, /*long*/ tabId)
		{
			log('onDOMInit invoked : ' + handler.getBrowser());
			//var relevantTabId = getTabId(handler.getBrowser());
			log("Tab id is : " + tabId);
			if(tabId)
			{
				var initDOMMessage = hsMessage.create(hsMsgType.INIT_DOM, tabId);
				initDOMMessage.setParameter("URL", [handler.getBrowser().contentDocument.URL]);
				initDOMMessage.setPayload(xml_dom);
				log(initDOMMessage.toXMLString());
				transport.send(initDOMMessage.toXMLString());
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
	transport = hsCreateTransport("localhost", /*port*/13000, /*TransportListener*/listener);
	log("transport initiated");
}

//do not forget to release all resources!
function onUnload()
{
	window.removeEventListener("unload", onUnload, false);
	transport.release();
	// TODO: release all: transport, mouse, keyboard, listeners ....
	mouse.release();
	keyboard.release();
	tts.release();
}

//TODO: add gBrowser event listeners
window.addEventListener("load", onLoad, false);