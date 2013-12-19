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
	private final long globalId;
	private final long  tabId;
	private final IMessageChannel channel;
	
	private Document document;
	private final Map<Integer/*NodeId*/,Node> nodeMap = new HashMap<Integer,Node>();
	private IDomIterator iterator = null;
	private boolean active = false;
		
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
			String nodeId = element.getAttribute("node_id");
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
					document.importNode(documentPayload, true);
					document.appendChild(documentPayload); 
					//Recursively traverse the document and update the nodeMap
					Element documentElement = document.getDocumentElement();
					updateNodeMap(documentElement);
					iterator = new DomIterator(this);
					iterator.begin();
					//Sending TTS_SPEAK to extension
					//Message ttsSpeakMessage = new Message(MessageType.TTS_SPEAK, tabId);
					//ttsSpeakMessage.getArguments().put("text", new ArrayList<String>() {{add(iterator.getPos().getNodeValue());}});
					//ttsSpeakMessage.getArguments().put("text_id", new ArrayList<String>() {{add(String.valueOf(channel.getNextTextId()));}});
					//channel.send(ttsSpeakMessage);
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
			/**
			 * TTS_DONE
			 */
		}
	}

	@Override
	public void release() 
	{
		// TODO: release all resources
	}

	@Override
	public synchronized Node getNode(int id) 
	{
		return nodeMap.get(id);
	}

	@Override
	public synchronized int getNodeId(Node node) throws Exception 
	{
		for(Map.Entry<Integer, Node> nodeEntry : nodeMap.entrySet())
		{
			Node currentNode = nodeEntry.getValue();
			if(currentNode.isSameNode(node))
			{
				return nodeEntry.getKey();
			}
		}
		throw new Exception("The node being searched for cannot be found");
	}

	@Override
	public synchronized Node getRootNode() 
	{
		return document.getDocumentElement();
	}

	@Override
	public synchronized void activate() 
	{
		System.out.println("Activate tab : " + tabId);
		if(active)
			return;
		active = true;
		// TODO: start speaking at current position
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
