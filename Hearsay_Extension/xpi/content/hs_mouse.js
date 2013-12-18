/*
 * Mouse event handler
 * 
 * listener
 * {
 * 	[void] onClick: function([hsMouseHandler] handler, [Node] clicked_node, [String] pressed_buttons);
 * }
 * 
 */

/*hsMouseHandler*/ function hsCreateMouseHandler(/*MouseListener*/ listener)
{
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	function log(msg) {	consoleService.logStringMessage(msg);	}

	var mouseListener = /*void*/function(event)
			{			
				// TODO: add Event listeners for mouse "click" event
				log("[mouseHandler]: click");
				clickEventString = String.fromCharCode(event.charCode);
				listener.onClick(mHandler,null,clickEventString);
			};


	//registering the mouse listener
	window.addEventListener('click', mouseListener, false);
	
	/*window.addEventListener('click', function(event){log("[mouseHandler]: click");
	listener.onClick(mHandler,null,"ButtonClicked");}, false);*/
	
	log("Registered the mouse listener");

	var mHandler =
	{
			release: /*void*/ function()
			{
				// TODO: release listeners for mouse click event
				window.removeEventListener("click", mouseListener, false);

			}
	};
	return mHandler;
}