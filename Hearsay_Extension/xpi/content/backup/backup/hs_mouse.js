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
	var mouseListener ={
			
			onClick: /*void*/function()
			{			
			// TODO: add Event listeners for keyboard "press" event
			listener.onClick(mHandler,null,"ButtonClicked");
			}

	}
	
	//registering the keyboard listener
	window.addEventListener("click", mouseListener, false);

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
