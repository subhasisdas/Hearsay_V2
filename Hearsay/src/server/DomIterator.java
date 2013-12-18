package server;

import org.w3c.dom.Node;

import interfaces.IDomIterator;
import interfaces.ITabHandler;

public class DomIterator implements IDomIterator 
{
	final private ITabHandler tab;
	private Node node;
	
	public DomIterator(ITabHandler t)
	{
		tab = t;
	}
	
	@Override
	public boolean next() throws Exception 
	{
		int nextNodeId = tab.getNodeId(node) + 1;
		Node nextNode = tab.getNode(nextNodeId);
		if(nextNode != null)
		{
			node = nextNode;
			return true;
		}
		else
		{
			return false;
		}
	}

	@Override
	public boolean prev() throws Exception 
	{
		int previousNodeId = tab.getNodeId(node) - 1;
		Node previousNode = tab.getNode(previousNodeId);
		if(previousNode != null)
		{
			node = previousNode;
			return true;
		}
		else
		{
			return false;
		}
	}

	@Override
	public void begin() 
	{
		node = tab.getNode(1);
	}

	@Override
	public void end() throws Exception 
	{
		//Move ahead until next returns false which means we reached the last node
		while(next())
		{
		}
		//We are now at the last node
	}

	@Override
	public boolean onRemove(Node node) 
	{
		//TODO: Implementation based on current position
		return false;
	}

	@Override
	public boolean setPos(Node node) 
	{
		if(this.node.equals(node))
		{
			return false;
		}
		else
		{
			this.node = node;
			return true;
		}
	}

	@Override
	public Node getPos() 
	{
		return node;
	}

}
