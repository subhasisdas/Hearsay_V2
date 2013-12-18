// eSpeak and other code here are under the GNU GPL.
var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
function log(msg) { consoleService.logStringMessage(msg); }
function generateSpeech(text, args) {
	var start = new Date().getTime();
   var self = { text: text, args: args, ret: null };
  (function() {

  }).call(self);
  var end = new Date().getTime();
  var time = end - start;
  log('Execution time: ' + time);
  return self.ret;
}
