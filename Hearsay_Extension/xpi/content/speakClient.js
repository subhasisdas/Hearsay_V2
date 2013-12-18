/*
 * Valentyn Melnyk:
 * this code doesn't work - my browser says that there is no "doc" object
 * 
 * 1) rename it from speakClient.js to hs_tts.js
 * 2) put all auxiliary functions and variables into function-creator scope (see hs_transport.js)
 * 3) Don't modify html document with your "audio" element. try to create it but don't append as a child, 
 * or try something else - but don't modify html page's DOM.
 * 4) It is extremely slow. 0.7 seconds to generate is very slow. Measure every part of the code:
 * speakGenerator.js output and your part separately. if your part takes significant part (>30%) you will find the way to optimize it.
 * 5) your code will look like this:
 * 
 * listener =
 * {
 * 	onEndSpeak: function([ttsHandler] tts, [String] text_id) {},
 * }
 * 
 * [hsTTSHandler] function hsCreateTTS([Listener] listener)
{
	var current_text_id;	// current speaking text id. if there is no text, then it will be empty.
							// if you receive cancel command with wrong text_id, then ignore it.
							// it will help you to avoid a situation, when java cancels next bit of text instead of previous one.
	//TODO: implement init tts part (if you need one)
	return {
		cancel: function(text_id)
		{
			if(text_id!=current_text_id)	// not current text, ignore
				return;
			// TODO: implement canceling
		},
		speak: function(text, text_id)
		{
			this.cancel(current_text_id);	// cancel previous
			current_text_id = text_id;
			// TODO: implement speaking
		},
		release: function()
		{
			// TODO: cancel current text and release internal objects
		}
	};
}
 * 
 * This task will be completed in 1 week.
 * To check it, you can create simple extension with no tcp connection,
 * append menu items such as "Say", "Cancel", and log output for onEndSpeak event.
 * 
 */

var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
function log(msg) { consoleService.logStringMessage(msg); }

function AudioEnded(){
	const doc = gBrowser.contentDocument;
	var ele = doc.getElementById("player");
	ele.removeEventListener('ended', AudioEnded, false);
	var ele = doc.getElementById("audio");
	doc.body.removeChild(ele);
	log('audio finished playing');
}


function speak(text, args) {
  var PROFILE = 1;

  
  function parseWav(wav) {
    function readInt(i, bytes) {
      var ret = 0;
      var shft = 0;
      while (bytes) {
        ret += wav[i] << shft;
        shft += 8;
        i++;
        bytes--;
      }
      return ret;
    }
    if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
    if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
    return {
      sampleRate: readInt(24, 4),
      bitsPerSample: readInt(34, 2),
      samples: wav.subarray(44)
    };
  }

  function playHTMLAudioElement(wav) {
    function encode64(data) {
	  
      var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      var PAD = '=';
      var ret = '';
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
        leftchar = (leftchar << 8) | data[i];
        leftbits += 8;
        while (leftbits >= 6) {
          var curr = (leftchar >> (leftbits-6)) & 0x3f;
          leftbits -= 6;
          ret += BASE[curr];
        }
      }
      if (leftbits == 2) {
        ret += BASE[(leftchar&3) << 4];
        ret += PAD + PAD;
      } else if (leftbits == 4) {
        ret += BASE[(leftchar&0xf) << 2];
        ret += PAD;
      }
      return ret;
    }
    //added by rucha to set audio div
	const doc = document;//gBrowser.contentDocument;
	const input = doc.createElement( "div" );
	if(doc.getElementById("audio")==null)
	{
		input.setAttribute( "id", "audio" );
		
		doc.body.appendChild( input );
	}
	
	doc.getElementById("audio").innerHTML=("<audio id=\"player\" src=\"data:audio/x-wav;base64,"+encode64(wav)+"\"/>");
	doc.getElementById("player").addEventListener('ended',function() { AudioEnded();},false);
	doc.getElementById("player").play();
	
  }
  
  /*function stopPlay(){
	const doc = gBrowser.contentDocument;
	const input = doc.createElement( "div" );
	if(doc.getElementById("audio")==null)
	{
		input.setAttribute( "id", "audio" );
		doc.body.appendChild( input );
	}
	doc.getElementById("audio").innerHTML=("<audio id=\"player\""\"/>");
	doc.getElementById("player").pause();
	doc.getElementById("player").currentTime = 0;
  }
  */
  function playAudioDataAPI(data) {
    try {
      var output = new Audio();
      output.mozSetup(1, data.sampleRate);
      var num = data.samples.length;
      var buffer = data.samples;
      var f32Buffer = new Float32Array(num);
      for (var i = 0; i < num; i++) {
        var value = buffer[i<<1] + (buffer[(i<<1)+1]<<8);
        if (value >= 0x8000) value |= ~0x7FFF;
        f32Buffer[i] = value / 0x8000;
      }
      output.mozWriteAudio(f32Buffer);
      return true;
    } catch(e) {
      return false;
    }
  }

  function handleWav(wav) {
    var startTime = Date.now();
    var data = parseWav(wav); // validate the data and parse it
    // TODO: try playAudioDataAPI(data), and fallback if failed
    playHTMLAudioElement(wav);
    if (PROFILE) console.log('speak.js: wav processing took ' + (Date.now()-startTime).toFixed(2) + ' ms');
  }

  if (args && args.noWorker) {
	  console.log('proceeding without worker-rucha');
    // Do everything right now. speakGenerator.js must have been loaded.
    var startTime = Date.now();
	var wav = generateSpeech(text, args);
    if (PROFILE) console.log('speak.js: processing took ' + (Date.now()-startTime).toFixed(2) + ' ms');
    handleWav(wav);
	
  } else {
	  console.log('error in generating speech');
  }
  
  
  
}

