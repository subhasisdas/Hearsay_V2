/**
 * This class represents the messaging layer on the client end for HearSay
 * 
 * Reviewed by Valentyn
 * 
 * 1) Rename to hs_message.js
 * 2) Remove all dependencies (see hs_transport.js how to do it)
 * 3) Complete the code
 * 
 */

var hsMessage = (function()
{
	const HS_MSG_TAG 	= "hearsayMessage";
	const HS_MSG_ID	 	= "tabId";
	const HS_MSG_TYPE 	= "type";
	const HS_PAYLOAD = "payload";
	const HS_PARAMETERS = "parameters";
	const HS_PARAMETER = "parameter";
	const HS_PARAMETER_NAME = "parameterName";
	const HS_PARAMETER_VALUES = "parameterValues";
	const HS_PARAMETER_VALUE = "parameterValue";
	
	return {
		create: /*hsMessage*/ function(/*MsgType*/ type, /*int*/ tabId)
		{
		// message private data
			var/*Node*/ payload;
			var/*Map*/ parameters = {};
			
			return {
				getParameters:/*Map<String, String[]>*/	function() { return parameters; },
				getParameter: /*String[]*/ 				function(/*String*/name)	{ return parameters[name]; },
				setParameter: /*void*/					function(/*String*/name, /*Strings[]*/values)	{ parameters[name] = values; },
				setPayload:	  /*void*/					function(/*Node*/ root) { payload = root; },
				toXMLString:  /*String*/				function()
				{
					var xmldoc = document.implementation.createDocument("", "", null);
					var xmlroot = xmldoc.appendChild(xmldoc.createElement(HS_MSG_TAG));
					var idNode = xmldoc.createElement(HS_MSG_ID);
					idNode.appendChild(xmldoc.createTextNode(tabId));
					xmlroot.appendChild(idNode);
					var typeNode = xmldoc.createElement(HS_MSG_TYPE);
					typeNode.appendChild(xmldoc.createTextNode(type));
					xmlroot.appendChild(typeNode);
					var parameters = xmldoc.createElement(HS_PARAMETERS);
					for(parameterName in this.parameters)
					{
						var parameter = xmldoc.createElement(HS_PARAMETER);
						var parameterNameNode = xmldoc.createElement(HS_PARAMETER_NAME);
						parameterNameNode.appendChild(xmldoc.createTextNode(parameterName));
						var parameterValues = xmldoc.createElement(HS_PARAMETER_VALUES);
						var valuesList = this.parameters[parameterName];
						for(valueIndex = 0; valueIndex < valuesList.length; valueIndex++)
						{
							var parameterValue = xmldoc.createElement(HS_PARAMETER_VALUE);
							parameterValue.appendChild(xmldoc.createTextNode(valuesList[valueIndex]));
							parameterValues.appendChild(parameterValue);
						}
						parameter.appendChild(parameterNameNode);
						parameter.appendChild(parameterValues);
						parameters.appendChild(parameter);
					}
					xmlroot.appendChild(parameters);
					//Append the payload if one exists
					if(payload && payload instanceof Object)
					{
						var payloadNode = xmldoc.createElement(HS_PAYLOAD);
						payloadNode.appendChild(payload);
						xmlroot.appendChild(payloadNode);
					}
					return new XMLSerializer().serializeToString(xmlroot);
				}
			};
		},
		load: /*hsMessage*/ function(/*String*/ xml_string)
		{
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(xml_string,"text/xml");
			var tabId = xmlDoc.getElementsByTagName('tabId')[0].childNodes[0].nodeValue;
			var messageType = xmlDoc.getElementsByTagName('type')[0].childNodes[0].nodeValue;
			var parameterList = xmlDoc.getElementsByTagName('parameters')[0].getElementsByTagName('parameter');
			var parameterCount = parameterList.length;
			messageReference = this.create(messageType, tabId);
			for(var index = 0; index < parameterList.length ; index++)
			{
				var parameterName = parameterList[index].getElementsByTagName(HS_PARAMETER_NAME)[0].textContent;
				var parameterValueList = parameterList[index].getElementsByTagName(HS_PARAMETER_VALUES)[0].childNodes;
				var parameterValues = [];
				for(var parameterValueIndex = 0; parameterValueIndex < parameterValueList.length ; parameterValueIndex++)
				{
					var parameterValue = parameterValueList[parameterValueIndex].textContent;
					parameterValues.push(parameterValue);
				}
				messageReference.parameters[parameterName] = parameterValues;
			}
			var payloadElementList = xmlDoc.getElementsByTagName(HS_PAYLOAD);
			if(payloadElementList && payloadElementList.childNodes.length == 1)
			{
				messageReference.payload = payloadElements[0].childNodes[0];
			}
			return messageReference;
		}
	};
})();


