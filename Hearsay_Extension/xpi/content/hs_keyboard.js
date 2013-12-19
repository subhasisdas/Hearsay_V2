/*
 * Keyboard event handler
 * 
 * listener
 * {
 * 	[void] onKeyPress: function([hsKeyboardHandler] handler, [String] pressed_button);
 * }
 * 
 */

/*hsKeyboardHandler*/ function hsCreateKeyboardHandler(/*Listener*/ listener)
{

	var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

	function log(msg) {	consoleService.logStringMessage(msg);	}


	//adopted from echoing.js
	//**
	// This object defines the text to be spoken out on echoing
	//*
	var echoingMessages = {};  // TODO: externalize the textual content for language support
	echoingMessages[KeyEvent.DOM_VK_F1]='F1';
	echoingMessages[KeyEvent.DOM_VK_F2]='F2';
	echoingMessages[KeyEvent.DOM_VK_F3]='F3';
	echoingMessages[KeyEvent.DOM_VK_F4]='F4';
	echoingMessages[KeyEvent.DOM_VK_F5]='F5';
	echoingMessages[KeyEvent.DOM_VK_F6]='F6';
	echoingMessages[KeyEvent.DOM_VK_F7]='F7';
	echoingMessages[KeyEvent.DOM_VK_F8]='F8';
	echoingMessages[KeyEvent.DOM_VK_F9]='F9';
	echoingMessages[KeyEvent.DOM_VK_F10]='F10';
	echoingMessages[KeyEvent.DOM_VK_F11]='F11';
	echoingMessages[KeyEvent.DOM_VK_F12]='F12';
	echoingMessages[KeyEvent.DOM_VK_END]='End';
	echoingMessages[KeyEvent.DOM_VK_HOME]='Home';
	echoingMessages[KeyEvent.DOM_VK_LEFT]='Left';
	echoingMessages[KeyEvent.DOM_VK_UP]='Up';
	echoingMessages[KeyEvent.DOM_VK_RIGHT]='Right';
	echoingMessages[KeyEvent.DOM_VK_DOWN]='Down';
	echoingMessages[KeyEvent.DOM_VK_DELETE]='Delete';
	echoingMessages[KeyEvent.DOM_VK_COMMA]='Comma'; 			//This is not the ASCII for , but still firefox throws this ASCII. (temp)
	echoingMessages[KeyEvent.DOM_VK_PERIOD]='Period'; 			//This is not the ASCII for . but still firefox throws this ASCII. (temp)
	echoingMessages[KeyEvent.DOM_VK_ESCAPE]='Escape';
	echoingMessages[KeyEvent.DOM_VK_BACK_SPACE]='Backspace';
	echoingMessages[KeyEvent.DOM_VK_TAB]='Tab';
	echoingMessages[KeyEvent.DOM_VK_SPACE]='Space';
	echoingMessages[KeyEvent.DOM_VK_PAUSE]='Pause';
	echoingMessages[KeyEvent.DOM_VK_RETURN]='Enter';
	//removed the statement for insert as its not required now.
	echoingMessages[KeyEvent.DOM_VK_SUBTRACT]='Underscore';
	echoingMessages[KeyEvent.DOM_VK_PAGE_UP]='PageUp';
	echoingMessages[KeyEvent.DOM_VK_PAGE_DOWN]='PageDown';
	echoingMessages[KeyEvent.DOM_VK_SHIFT]='Shift';
	echoingMessages[KeyEvent.DOM_VK_CONTROL]='Control';
	echoingMessages[KeyEvent.DOM_VK_ALT]='Alt';
	echoingMessages[KeyEvent.DOM_VK_ENTER]='Enter';                              
	//the combination of C+S+A was not being sent
	//properly because there was not a case for the keycodes of CSA in the hash for echoing messages
	//now the key presses are properly being sent.
	echoingMessages[KeyEvent.DOM_VK_SHIFT]='';   // SHIFT
	echoingMessages[KeyEvent.DOM_VK_CONTROL]='';   // CONTROL
	echoingMessages[KeyEvent.DOM_VK_ALT]='';   // ALT

	/* 
	 * Gets the keycode of the keys pressed.
	 * @param {Object} event     Event Type
	 * @return toSpeak           Returns the keycode of the pressed Key
	 *//*
	function getHumanReadableKey(String event)
			{

				//temporary local variable 
				var tempSpeak = "";
				if (event.ctrlKey == true)
					tempSpeak += CTRL_KEY + "+";
				if (event.shiftKey == true)
					tempSpeak += SHIFT_KEY + "+";
				if (event.altKey == true)
					tempSpeak += ALT_KEY + "+";
				if(iflag)
					tempSpeak+=INS_KEY + "+";
				if(mflag)
					tempSpeak+="MacCommand+";

				switch (event.keyCode) {
				case KeyEvent.DOM_VK_SUBTRACT: //case for underscore
					if(tempSpeak == SHIFT_KEY + "+")
						tempSpeak = echoingMessages[event.keyCode];
					break;

				case KeyEvent.DOM_VK_INSERT: 
					iflag=true;  //setting the flag if insert was pressed
					break;
				case KeyEvent.DOM_VK_META:
					mflag=true;  //setting the flag if MAC key was pressed
					break;
				default:
					var keyDescription = echoingMessages[event.keyCode];			
				if(keyDescription == null) {
					tempSpeak += String.fromCharCode(event.keyCode);
				}
				else
					tempSpeak += keyDescription;
				}
				return tempSpeak;
			}
	  */

	var keyBdListener =	 /*void*/function(event)
	{			
		// TODO: add Event listeners for keyboard "press" event
		var tempSpeak="";

		if (event.ctrlKey == true)
			tempSpeak += "control" ;
		if (event.shiftKey == true)
			tempSpeak += "shift" ;
		if (event.altKey == true)
			tempSpeak += "alt" ;

		/*//this doesnot work
		if (echoingMessages[event.keyCode] == 'Shift')
			tempSpeak += " Shift ";
		if (echoingMessages[event.keyCode] == 'Control')
			tempSpeak += " Control ";
		if (echoingMessages[event.keyCode] == 'Alt')
			tempSpeak += " Alt ";
		*/

		if (echoingMessages[event.keyCode] == 'Enter')
			tempSpeak = "Enter" ;
		else if (echoingMessages[event.keyCode] == 'Left')
			tempSpeak = "Left" ;
		else if (echoingMessages[event.keyCode] == 'Up')
			tempSpeak = "Up" ;
		else if (echoingMessages[event.keyCode] == 'Down')
			tempSpeak = "Down" ;
		else if (echoingMessages[event.keyCode] == 'Backspace')
			tempSpeak = "backspace" ;
		else if (echoingMessages[event.keyCode] == 'Right')
			tempSpeak = "Right" ;
		else if (echoingMessages[event.keyCode] == 'Delete')
			tempSpeak = "Delete" ;
		else if (echoingMessages[event.keyCode] == 'Home')
			tempSpeak = "Home" ;
		else if (echoingMessages[event.keyCode] == 'End')
			tempSpeak = "End" ;
		else
			tempSpeak += String.fromCharCode(event.charCode);
		
		log("key pressed! "+tempSpeak);
		listener.onKeyPress(keyBHandle,tempSpeak);
	};

	log(" Registering the keyboard listener ");
	//registering the keyboard listener
	window.addEventListener("keypress", keyBdListener, false);

	var keyBHandle =
	{
			release: /*void*/ function()
			{
				// TODO: release listeners
				log("release listeners");
				window.removeEventListener("keypress", keyBdListener ,false);
			}
	};
	return keyBHandle;
}
