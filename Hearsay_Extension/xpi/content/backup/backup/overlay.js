var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
function log(msg) {
	consoleService.logStringMessage(msg);
}

var Hearsay_Extension = 
{
	ButtonClick: function(stri) {

		speak(stri,{ noWorker:true});
		
	},
	StopClick: function() {

		const doc = gBrowser.contentDocument;
		var ele = doc.getElementById("audio");
		doc.body.removeChild(ele);
		log('audio stopped by user');
		
	},
	WAlert: function(str) {
		window.alert(str);
	},
	
	onConnect: function() 
		{
			hstInit(function()
					{
				log("We've connected to the server!");
//				hstSendMsg("Connected!");

					}, 
					function()
					{
						log("Server disconnected!");
					}, 
					function(hearsayXMLMessage)
					{
						log("onConnect! " + hearsayXMLMessage);
						newmessageref = createmessage(hearsayXMLMessage);
						
						log("Received from server : " + newmessageref.getTabId() + " " + newmessageref.getMessageType() + " " + newmessageref.getParameter("param1"));
//						log("Received from Server : "+msg);
					}
			);
		},
		onDisconnect: function()
		{
			hstDone();
		},
		onSend: function()
		{
			log("[Firefox Client]: sending");
			messageref = new message("NEW_DOM",1);
			var parameterName = "param1";
			var parameterValues = ["value1", "value2"];
			messageref.setParameter(parameterName, parameterValues);
			var hearsayXMLMessage = messageref.convertToString();
			log("[Firefox Client]: XML Message is : " + hearsayXMLMessage);
//			newmessageref = createmessage(hearsayXMLMessage);
//			log(newmessageref.getTabId() + " " + newmessageref.getMessageType() + " " + newmessageref.getParameter());
			
			hstSendMsg(hearsayXMLMessage);
		}
};

log("Hearsay_Extension is loaded");

function init() {
	document.getElementById('play').addEventListener('click',function() {
		Hearsay_Extension.ButtonClick('Play/Resume Text Play/Resume');
	},false);
	document.getElementById('pause').addEventListener('click',function() {
		Hearsay_Extension.StopClick();
	},false);
	document.getElementById('send').addEventListener('click',function() {
		Hearsay_Extension.ButtonClick('Send Info to Server');
	},false);
}

window.addEventListener("load", init, false);

