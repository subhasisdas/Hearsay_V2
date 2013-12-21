package server;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.DOMException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import interfaces.IDomIterator;
import interfaces.IMessageChannel;
import interfaces.ITabHandler;

public class TabHandler implements ITabHandler
{
	public static final String NODE_ID_ATTR = "node_id";
	
	private final long globalId;
	private final long  tabId;
	private final IMessageChannel channel;

	private Document document;
	private final Map<Integer/*NodeId*/,Node> nodeMap = new HashMap<Integer,Node>();
	private IDomIterator iterator = null;
	private boolean active = false;
	private boolean initializedAtleastOnce = false;

	public TabHandler(long gId, long id, IMessageChannel ch)
	{
		globalId = gId;
		tabId = id;
		channel = ch;
	}

	@Override
	public IMessageChannel getChannel()	{ return channel; }

	@Override
	public long getGlobalId()	{ return globalId; }	

	@Override
	public long getId()	{ return tabId; }

	public void updateNodeMap(Element element)
	{
		if(element != null)
		{
			String nodeId = element.getAttribute(NODE_ID_ATTR);
			nodeMap.put(Integer.parseInt(nodeId), (Node) element);
			NodeList nodeList = element.getChildNodes();
			for(int index = 0; index < nodeList.getLength(); index++)
			{
				Node currentNode = nodeList.item(index);
				if (currentNode.getNodeType() == Node.ELEMENT_NODE)
				{
					Element currentElement = (Element) currentNode;
					updateNodeMap(currentElement);
				}
			}
		}
	}

	@Override
	public synchronized void onReceive(Message msg) throws Exception
	{
			// TODO: process all messages, related to tab (see msg types)
			switch(msg.type)
			{
			case INIT_DOM:
				Node payload = msg.payload;
				if(payload != null)
				{
					Node documentPayload = payload.cloneNode(true);
					DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
					DocumentBuilder builder = factory.newDocumentBuilder();
					document = builder.newDocument();
					Node importedNode = document.importNode(documentPayload, true);
					document.appendChild(importedNode);
					//Recursively traverse the document and update the nodeMap
					Element documentElement = document.getDocumentElement();
					updateNodeMap(documentElement);
					iterator = new DomIterator(this);
					iterator.begin();
					//Sending TTS_SPEAK to extension
					if(active)
					{
						String nodeValueToSend = null;
						if(iterator.getPos().getNodeName().equals("textelement"))
						{
							nodeValueToSend = iterator.getPos().getTextContent();
						}
						else
						{
							boolean nextNodeExists = iterator.next();
							if(nextNodeExists)
							{
								nodeValueToSend = iterator.getPos().getTextContent();
							}
						}
						if(nodeValueToSend != null)
						{
							Message ttsSpeakMessage = new Message(MessageType.TTS_SPEAK, tabId);
							ArrayList<String> textParameter = new ArrayList<String>();
							textParameter.add(nodeValueToSend);
							ttsSpeakMessage.getArguments().put("text", textParameter);
							ttsSpeakMessage.getArguments().put("text_id", new ArrayList<String>() {{add(String.valueOf(channel.getNextTextId()));}});
							channel.send(ttsSpeakMessage);
							
							/*System.out.println("Sending Hightlight Node");
						//sending the highlight text
						Message highlightMessage = new Message(MessageType.SET_HIGHLIGHT, tabId);
						ArrayList<String> nodeToHighlight = new ArrayList<String>();
						if(iterator.getPos().getNodeName().equals("textelement"))
						{
							//System.out.println("Line 2");
							int nodeIdToSend = getNodeId(iterator.getPos().getParentNode());
							nodeToHighlight.add(Integer.toString(nodeIdToSend));
							highlightMessage.getArguments().put("node_id", nodeToHighlight);
							channel.send(highlightMessage);
							System.out.println("Highlight Message sent at INIT_DOM");
						}*/
						}
					}
					initializedAtleastOnce = true;
				}
				else
				{
					throw new Exception("An INIT DOM message was received with an invalid payload");
				}
				break;
			case UPDATE_DOM:
				// TODO: update Docunent and nodeMap. check, that iterator.getPos() is not inside updated tree
				// if it is, then update iterator
			case DELETE_DOM:
				// TODO: update Docunent and nodeMap. check, that iterator.getPos() is not inside updated tree
				// update iterator
			case MOVE_DOM:
				// TODO: update Docunent.
			case UPDATE_ATTR:
				// TODO: update Docunent.
			case DELETE_ATTR:
				// TODO: update Docunent.
			case CHANGE_VALUE:
				// TODO: update Docunent. if iterator points to this input element,
				// re-read its value.
			case TTS_DONE:
				System.out.println("TTS Done was invoked, so speak next node");
				if(active)
				{
					if(iterator.next())
					{
						String nodeValueToSend = iterator.getPos().getTextContent();
						if(nodeValueToSend != null)
						{
							Message ttsSpeakMessage = new Message(MessageType.TTS_SPEAK, tabId);
							ArrayList<String> textParameter = new ArrayList<String>();
							textParameter.add(nodeValueToSend);
							ttsSpeakMessage.getArguments().put("text", textParameter);
							ttsSpeakMessage.getArguments().put("text_id", new ArrayList<String>() {{add(String.valueOf(channel.getNextTextId()));}});
							channel.send(ttsSpeakMessage);
							
							System.out.println("Sending Hightlight Node");
						//sending the highlight text
						Message highlightMessage = new Message(MessageType.SET_HIGHLIGHT, tabId);
						ArrayList<String> nodeToHighlight = new ArrayList<String>();

						/*	nodeToHighlight.add(Integer.toString((getNodeId(iterator.getPos()))));
						highlightMessage.getArguments().put("node_id", nodeToHighlight);
						channel.send(highlightMessage);*/

						if(iterator.getPos().getNodeName().equals("textelement"))
						{
							//System.out.println("Line 2");
							int nodeIdToSend = getNodeId(iterator.getPos().getParentNode());
							nodeToHighlight.add(Integer.toString(nodeIdToSend));
							highlightMessage.getArguments().put("node_id", nodeToHighlight);
							channel.send(highlightMessage);
							System.out.println("Highlight Message sent in TTS_DONE");
						}
						}
					}
				}
				break;
				/**
				 * TTS_DONE
				 */
			}
	}

	@Override
	public void release() 
	{
		// TODO: release all resources
		channel.release();
		document = null;
		nodeMap.clear();
	}

	@Override
	public Node getNode(int id) 
	{
		System.out.println("getNode for id : " + id + " and value seems to be  : " + nodeMap.get(id));
		return nodeMap.get(id);
	}

	@Override
	public int getNodeId(Node node)
	{
		return Integer.parseInt(((Element)node).getAttribute(NODE_ID_ATTR));
	}

	@Override
	public Node getRootNode() 
	{
		return document.getDocumentElement();
	}

	@Override
	public synchronized void activate() throws Exception 
	{
		System.out.println("Activate tab : " + tabId);
		if(active)
			return;
		active = true;
		if(initializedAtleastOnce && (iterator.getPos() != null))
		{
			String nodeValueToSend = iterator.getPos().getTextContent();
			if(nodeValueToSend != null)
			{
				Message ttsSpeakMessage = new Message(MessageType.TTS_SPEAK, tabId);
				ArrayList<String> textParameter = new ArrayList<String>();
				textParameter.add(nodeValueToSend);
				ttsSpeakMessage.getArguments().put("text", textParameter);
				ttsSpeakMessage.getArguments().put("text_id", new ArrayList<String>() {{add(String.valueOf(channel.getNextTextId()));}});
				channel.send(ttsSpeakMessage);
			}
		}
	}

	@Override
	public void deactivate() 
	{
		System.out.println("Deactivate tab : " + tabId);
		if(!active)
			return;
		active = false;
		// TODO: cancel speaking
	}
}
