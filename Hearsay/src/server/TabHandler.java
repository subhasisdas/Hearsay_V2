package server;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
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
	private boolean pauseMode = false;

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

	/**
	 * 	Speaks and highlight the input parameter.
	 * 	@param String This attribute stores the text content of the node and its descendants
	 *  @return void
	 */
	public void speakAndHighlightNode(String nodeValueToSend) throws Exception{
		System.out.println("highlighting");
		Message ttsSpeakMessage = new Message(MessageType.TTS_SPEAK, tabId);
		ArrayList<String> textParameter = new ArrayList<String>();
		textParameter.add(nodeValueToSend);
		ArrayList<String> textIdParameter = new ArrayList<String>();
		textIdParameter.add(Long.toString(globalId));
		ttsSpeakMessage.getArguments().put("text", textParameter);
		ttsSpeakMessage.getArguments().put("text_id", textIdParameter);
		channel.send(ttsSpeakMessage);

		System.out.println("Sending Hightlight Node ");
		//sending the highlight text
		Message highlightMessage = new Message(MessageType.SET_HIGHLIGHT, tabId);
		ArrayList<String> nodeToHighlight = new ArrayList<String>();
		int nodeIdToSend = 0;
		if(iterator.getPos().getNodeName().equals("textelement"))
		{
			nodeIdToSend = getNodeId(iterator.getPos().getParentNode());
		}
		else
		{
			nodeIdToSend = getNodeId(iterator.getPos());
		}
		nodeToHighlight.add(Integer.toString(nodeIdToSend));
		highlightMessage.getArguments().put("node_id", nodeToHighlight);
		channel.send(highlightMessage);
		System.out.println("Highlight Message  sent");
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
				for(;iterator.getPos() != null;)
				{
					System.out.println(getNodeId(iterator.getPos())+">>> "+ iterator.getPos().getTextContent());
					if(!iterator.next())
						break;
				}
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
						speakAndHighlightNode(nodeValueToSend);
						System.out.println("Highlight Message sent at INIT_DOM"); 

					}
				}
				initializedAtleastOnce = true;
			}
			else
			{
				throw new Exception("An INIT DOM message was received with an invalid payload");
			}
			break;
		case KEY:
			if(active)
			{
				String keyPressed = msg.getArguments().get("press").get(0);
				if(keyPressed != null & !keyPressed.isEmpty())
				{
					if(keyPressed.equals("keyPressed Insert"))
					{
						System.out.println("KeyPresses "+ keyPressed);
						if(pauseMode)
						{
							pauseMode = false;
							String nodeValueToSend = iterator.getPos().getTextContent();
							if(nodeValueToSend != null)
							{
								speakAndHighlightNode(nodeValueToSend);
								System.out.println("Highlight Message sent on KEY PAUSE"); 
							}
						}
						else
						{
							pauseMode = true;
							System.out.println("PAUSE MODE ENABLED");
						}
					}
					/*else if(keyPressed.equals("keyPressed Up")){
							
							String nodeValueToSend = null;
							if(iterator.getPos().getPreviousSibling() != null)
								nodeValueToSend = iterator.getPos().getPreviousSibling().getTextContent();
							if(nodeValueToSend == null)
							{
								System.out.println(" NOTHING UP");
							}
							if(nodeValueToSend != null)
							{
								speakAndHighlightNode(nodeValueToSend);
								System.out.println("Highlight Message sent on KEY UP"); 
							}
						
					}
					else if(keyPressed.equals("keyPressed Down")){
						
							String nodeValueToSend = null;
							if(iterator.getPos().getNextSibling() != null)
								nodeValueToSend = iterator.getPos().getNextSibling().getTextContent();
							if(nodeValueToSend == null)
							{
								System.out.println(" NOTHING DOWN");
							}
							if(nodeValueToSend != null)
							{
								speakAndHighlightNode(nodeValueToSend);
								System.out.println("Highlight Message sent on KEY DOWN"); 
							}
						
					}*/
					else
					{
						speakAndHighlightNode(keyPressed);
					}
				}
				break;
			}
		case MOUSE:
			int nodeClickedId = Integer.parseInt(msg.getArguments().get("id").get(0));
			Node newPosition = nodeMap.get(nodeClickedId);
			String nodeValueToSend = null;
			if(newPosition != null)
			{
				boolean positionUpdated = iterator.setPos(newPosition);
				if(positionUpdated)
				{
					Node currentNode = iterator.getPos();
					if(currentNode != null)
					{
						nodeValueToSend = currentNode.getTextContent();
					}
					if(nodeValueToSend != null)
					{
						speakAndHighlightNode(nodeValueToSend);
						System.out.println("Highlight Message sent on MOUSE CLICK"); 

					}
				}
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
			System.out.println("Received a TTS_DONE message with pauseMode : " + pauseMode);
			if(active && !pauseMode)
			{
				if(iterator.next())
				{
					String ttsDoneNodeValueToSend = iterator.getPos().getTextContent();
					if(ttsDoneNodeValueToSend != null)
					{
						speakAndHighlightNode(ttsDoneNodeValueToSend);
						System.out.println("Highlight Message sent on TTS_DONE"); 
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
		if(!pauseMode && initializedAtleastOnce && (iterator.getPos() != null))
		{
			String nodeValueToSend = iterator.getPos().getTextContent();
			if(nodeValueToSend != null)
			{
				speakAndHighlightNode(nodeValueToSend);
				System.out.println("Highlight Message sent on ACTIVATE"); 
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
