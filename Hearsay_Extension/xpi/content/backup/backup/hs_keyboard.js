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

	var keyBdListener ={
			
			onKeyPress: /*void*/function()
			{			
			// TODO: add Event listeners for keyboard "press" event
			listener.onKeyPress(keyBHandle,keyPress);
			}

	}
	
	//registering the keyboard listener
	window.addEventListener("keypress", keyBdListener, false);
	
	
	//adopted from echoing.js
	/**
	 * This object defines the text to be spoken out on echoing
	 */
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

	//the combination of C+S+A was not being sent
	//properly because there was not a case for the keycodes of CSA in the hash for echoing messages
	//now the key presses are properly being sent.
	echoingMessages[KeyEvent.DOM_VK_SHIFT]='';   // SHIFT
	echoingMessages[KeyEvent.DOM_VK_CONTROL]='';   // CONTROL
	echoingMessages[KeyEvent.DOM_VK_ALT]='';   // ALT

	/**
	 * Gets the keycode of the keys pressed.
	 * @param {Object} event     Event Type
	 * @return toSpeak           Returns the keycode of the pressed Key
	 */
	var keyPress = "";
	var keyPressObj=
	{  
			getHumanReadableKey: /*String*/ function(event)
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
				keyPress = tempSpeak;
				return tempSpeak;
			}

	};

	
	var keyBHandle =
	{
			release: /*void*/ function()
			{
				// TODO: release listeners
				window.removeEventListener("keypress", keyBdListener ,false);
			}
	};
	return keyBHandle;
}