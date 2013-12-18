function /*hsTransport*/hsCreateTransport(/*String*/host, /*uint16*/port, /*TransportListener*/listener)
{

	//test listener object
	var TransportListener = listener;
	var item = 10;

	var CC = Components.classes;
	var CI = Components.interfaces;
	var consoleService = CC["@mozilla.org/consoleservice;1"].getService(CI.nsIConsoleService);

	/* nsITimerCallback interface.
	 * this function invoke by both timers: timeout and reconnect.
	 * which timer and which action it will do, depend of parameter timer
	 * 
	 * @param timer                which timer invoked this function
	 */
	var initWithCallbackEvent = 
	{
			notify : function(/*in nsITimer*/ timer) {
				if(_ReConnectTimer == timer)	// is it signal from Reconnect timer?
				{	// ok, now time to reconnect
					Log(4, "I live again. Hardrock Hallelujah!");
					//_StopConnectTimeoutTimer();
					if(!_InitTransport())
						_ReConnectTimer.initWithCallback(initWithCallbackEvent, hstReconnectInterval, 0);	// Type: TYPE_ONE_SHOT

					return;	
				}

				if(_ConnectTimeOutTimer == timer)	// is it signal from timeout timer?
				{	// time to try connect to server is up.
					// cleanup socket data
					_DestroyTransport();
					// wait some time, then try to reconnect
					_ReConnectTimer.initWithCallback(initWithCallbackEvent, hstReconnectInterval, 0);	// Type: TYPE_ONE_SHOT
					return;	
				}

				Log(1, "HearSayTransport::notify: a very wrong state.");	// must be error	
			}
	}

	/*
	 * nsITransportEventSink interface
	 * callback that monitoring connection state.
	 */ 	 
	var setEventSinkEvent=
	{
			onTransportStatus : function (/*nsITransport*/ aTransport,/*nsresult*/ aStatus,/*unsigned long long*/ aProgress,/*unsigned long long*/ aProgressMax) {
				switch(aStatus)
				{
				case aTransport.STATUS_READING:
					Log(4, "onTransportStatus::status: Reading, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					break;
				case aTransport.STATUS_WRITING:
					Log(4, "onTransportStatus::status: Writing, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					break;
				case aTransport.STATUS_RESOLVING:
					Log(4, "onTransportStatus::status: Resolving, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					break; 			
				case aTransport.STATUS_CONNECTED_TO: 			
					Log(4, "onTransportStatus::status: Connected, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					_onConnect();		    			    
					break; 			
				case aTransport.STATUS_SENDING_TO:
					Log(4, "onTransportStatus::status: Sending, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					break; 			

				case aTransport.STATUS_RECEIVING_FROM:
					Log(4, "onTransportStatus::status: Receiving, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);  				
					break;

				case aTransport.STATUS_CONNECTING_TO:
					Log(4, "onTransportStatus::status: Connecting, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					break; 			
				case aTransport.STATUS_WAITING_FOR:
					Log(4, "onTransportStatus::status: Waiting, aProgress=" + aProgress + ", aProgressMax="+aProgressMax);
					break;
				default:
					Log(4, "onTransportStatus::status: Unknown, code=" + aStatus);
				}
			}
	}


	/* this function is called when we got data in input stream
	 * 
	 * @param aStream                not used
	 */
	var asyncWaitEvent=
	{	
			onInputStreamReady:	function(/*nsIAsyncInputStream*/ aStream) {
				try {
					var avail_bytes = _in.available();
					Log(1, "avail = " + avail_bytes);
					//_data += _in.read(avail_bytes);
					_data += _in.readBytes(avail_bytes);

					for(;;) {
						if(_DataLength==0) {	// // read length
							// log("Really readed: " + _data.length);
							if(_data.length<8)
								break;

							_DataLength = _data.substr(0, 8);
							_data 		 = _data.substr(8);
							// log("Message length detected = " + _DataLength); 
						}

						if(_data.length<_DataLength)
							break;			  				

						var message 	 = decodeURIComponent(escape(_data.substr(0, _DataLength)));
						_data  	 = _data.substr(_DataLength);
						_DataLength = 0;
						Log(1, "execute message: \"" + message + "\":" + message.length);
						listener.onReceive(hsTransportObj,message);
					}
					_InStream.asyncWait(asyncWaitEvent, 0, 0, hstThreadManager.mainThread);
				}
				catch(e) {
					Log(1, "onInputStreamReady exception. finish");
					Log(2, e.name);
					Log(2, e.message);
					_OnDisconnect();
				}
			}

	}

	const hstHost = host		; 		// HearSay host,  def:-"localhost"          vartype: string
	const hstPort = port;       		// HearSay host's port,                     vartype: integer
	const hstConnectTimeout = 5000;		// connect timeout in milliseconds
	const hstReconnectInterval = 2000;	// if connect failed, trying reconnect with this interval
	const hstLogLevel = 2;	

	var TimerComponent 				= Components.Constructor("@mozilla.org/timer;1", Components.interfaces.nsITimer);   
	var BinaryInputStreamComponent  = Components.Constructor("@mozilla.org/binaryinputstream;1", Components.interfaces.nsIBinaryInputStream);

	const hstThreadManager = Components.classes["@mozilla.org/thread-manager;1"]
	.createInstance(Components.interfaces.nsIThreadManager);

	const hstTransportService = Components.classes["@mozilla.org/network/socket-transport-service;1"]
	.getService(Components.interfaces.nsISocketTransportService);

	//constructor
	_ConnectTimeOutTimer = new TimerComponent();
	_ReConnectTimer 	  = new TimerComponent(); 

	_InStream	   = null;
	_in		   = null;  

	function log(msg){	
		consoleService.logStringMessage(msg);
	}

	log("createTransport");

	//handle = Object.getPrototypeOf(this);

	if(!_InitTransport())
		_ReConnectTimer.initWithCallback(initWithCallbackEvent, hstReconnectInterval, 0);	// Type: TYPE_ONE_SHOT

	log("transport created");

	/*
	 * ---------------------------------------------------------------------------------------------
	 * Function to format the length of the message to be sent to HS 
	 * @param {Object} mesg the message to be sent
	 * moved from SocketComponent.js
	 */
	function _hstFormatMessageLength(msg) {
		var len_s = msg.length.toString();
		return "00000000".slice(len_s.length)+len_s;
	}


	//_transport  = hstTransportService.createTransport(null, 0, hstHost, hstPort, null);

	//function earlier part of _hstInstance, now internal functions

	function Log(/*int*/ level,/*string*/ msg) {
		if(level<=hstLogLevel)
			log(msg);
	}


	Log(1,"HsTransport.js loaded");

//	internal data
//	data
//	methods
	function Done() {
		Log(1, "hstDone");
		if(_ReConnectTimer != null)
		{
			_ReConnectTimer.cancel();
			_ReConnectTimer = null;
		}

		_DestroyTransport();

		_StopConnectTimeoutTimer();       	
		_ConnectTimeOutTimer = null;

	}


	/** internal use only function. Canceled connect timeout timer */ 

	function _StopConnectTimeoutTimer() {
		Log(4, "Cancel ConnectTimeout timer");
		if(_ConnectTimeOutTimer != null)
			_ConnectTimeOutTimer.cancel();
	}

	/*
	 * internal use only function. initialize all data and objects, which
	 * work with channel data, such as: input/output stream, delivered data,
	 * internal state of message loader.   
	 */
	function _InitTransport(){
		try {
			_data 		   	 	= "";
			_DataLength   	 	= 0;
			_ReadCounter  	 	= 0;
			_transport    		= hstTransportService.createTransport(null, 0, hstHost, hstPort, null);

			_ConnectTimeOutTimer.initWithCallback(initWithCallbackEvent, hstConnectTimeout, 0);	// Type: TYPE_ONE_SHOT  				    
			_transport.setEventSink(setEventSinkEvent, hstThreadManager.mainThread); // this forces the async transport run in main thread of FF		

			_OutStream    		= _transport.openOutputStream(1, 0, 0);
		}
		catch(e){			
			Log(1, "_InitTransport exception: " + e.name);
			Log(1, "\t" + e.message);
			_DestroyTransport();
			_StopConnectTimeoutTimer();
			return false;
		}  
		return true;
	}


	// * internal use only function. an antipode of _InitTransport().
	//* destroy all associated with socket   

	function _DestroyTransport(){
		if(_transport != null) {
			try
			{
				if(_OutStream != null)
					_OutStream.close();
				_transport.close(0);
			}
			catch(e)
			{
				Log(4, "Shit happens");
			}
			_OutStream = null;
			_InStream  = null;
			_in		= null;            	
			_transport = null;
		}  
	}


	/* * internal use only. this function is called when channel got CONNECTED_TO status
	 * stops timeout timer, setup input stream callback, calls to external callback 
	 */ 
	function _onConnect() {
		_StopConnectTimeoutTimer();
		_InStream     = _transport.openInputStream(0, 0, 0);
		_in	   	   = new BinaryInputStreamComponent();        


		_in.setInputStream(_InStream);
		_InStream.asyncWait(asyncWaitEvent, 0, 0, hstThreadManager.mainThread);    			
		Log(1,"Connecting");
		listener.onConnect(hsTransportObj);		
	}

	/*
	 * internal use only. this function is called when channel disconnected from server
	 * calls to external callback, clear state, setup reconnect timer. 
	 */ 
	function _OnDisconnect() {		
		listener.onDisconnect(hsTransportObj);

		_StopConnectTimeoutTimer();
		_DestroyTransport();

		if(_ReConnectTimer != null)
			_ReConnectTimer.initWithCallback(initWithCallbackEvent, hstReconnectInterval, 0);	// Type: TYPE_ONE_SHOT			
	}



	function IsConnected() {
		return _InStream!= null;
	}


	//return {
	var hsTransportObj =
	{
			/*
			 * Just send message from FireFox to Hearsay
			 * NOTE: format browser messages and hearsay messages are different!
			 * message - just formatted string from Message object (see Message.js)
			 */

			send: function(message)	{
				Log(1,"hstSend");
				if(_OutStream == null)
					Log(1, "Error: call hs_transport.js::hstSendMsg() without initialize transport");
				else {
					try
					{
						var strbytes = _hstFormatMessageLength(message);
						_OutStream.write(strbytes, 8);
						_OutStream.write(message, message.length);
						Log(4, "hs_transport.js::hstSendMsg, msg.length=" + message.length);
						Log(5, "hs_transport.js::hstSendMsg, msg=<" + message +">");
					}
					catch(e)
					{
						Log(2, "hs_transport.js::hstSendMsg exception, disconnect");
						_OnDisconnect();
					}
				}		
			},
			release: function(){
				Log(1,"Closing Everything");
				Done();
			}
	};
	return hsTransportObj;
	//};
}



