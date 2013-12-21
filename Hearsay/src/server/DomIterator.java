package server;

import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import interfaces.IDomIterator;
import interfaces.ITabHandler;

/**
 * @author Manoj
 *
 */
public class DomIterator implements IDomIterator 
{
	final private ITabHandler tab;
	private Node node;

	public DomIterator(ITabHandler t)
	{
		tab = t;
	}

	/**
	 * Find the first text node if one exists within this node's subtree
	 * @param rootNode
	 */
	private Node findTextNodeInSubtree(Node rootNode)
	{
		NodeList childNodes = rootNode.getChildNodes();
		for(int iter = 0; iter < childNodes.getLength(); iter++)
		{
			Node currentNode = childNodes.item(iter);
			if(currentNode.getNodeName().equals("textelement"))
			{
				return currentNode;
			}
			else
			{
				Node currentNextNode = findTextNodeInSubtree(currentNode);
				if(currentNextNode != null)
				{
					return currentNextNode;
				}
			}
		}
		return null;
	}

	@Override
	public boolean next() 
	{
		Node currentPosition = getPos();
		if(currentPosition == null)
		{
			return false;
		}
		Node destinationPosition = null;
		Node currentNode = currentPosition;
		Node nextSibling = currentNode.getNextSibling();
		if(nextSibling == null)
		{
			Node parentNode = currentNode.getParentNode();
			while(parentNode != null)
			{
				Node parentNodeSibling = parentNode.getNextSibling();
				if(parentNodeSibling != null)
				{
					currentNode = parentNodeSibling;
					break;
				}
				parentNode = parentNode.getParentNode();
			}
		}
		else
		{
			currentNode = nextSibling;
		}
		if(currentNode.isSameNode(currentPosition))
		{
			return false;
		}
		while(currentNode != null)
		{
			if((currentNode.getNodeName()).equals("textelement"))
			{
				destinationPosition = currentNode;
				break;
			}
			else
			{
				Node nextRelativeNode = findTextNodeInSubtree(currentNode);
				if(nextRelativeNode != null)
				{
					destinationPosition = nextRelativeNode;
					break;
				}
			}
			Node tmpNode = currentNode.getNextSibling();
			if(tmpNode == null)
			{
				Node parentNode = currentNode.getParentNode();
				while(parentNode != null)
				{
					Node parentNodeSibling = parentNode.getNextSibling();
					if(parentNodeSibling != null)
					{
						currentNode = parentNodeSibling;
						break;
					}
					parentNode = parentNode.getParentNode();
				}
				
			}
			else
			{
				currentNode = tmpNode;
			}
		}
		if(destinationPosition != null)
		{
			//TODO: Check this
			this.node = destinationPosition;
			return true;
		}
		return false;
	}

	@Override
	public boolean prev() 
	{
		Node currentPosition = getPos();
		if(currentPosition == null)
		{
			return false;
		}
		Node destinationPosition = null;
		Node currentNode = currentPosition;
		Node prevSibling = currentNode.getPreviousSibling();
		if(prevSibling == null)
		{
			Node parentNode = currentNode.getParentNode();
			while(parentNode != null)
			{
				Node parentNodeSibling = parentNode.getPreviousSibling();
				if(parentNodeSibling != null)
				{
					currentNode = parentNodeSibling;
					break;
				}
				parentNode = parentNode.getParentNode();
			}
		}
		else
		{
			currentNode = prevSibling;
		}
		if(currentNode.isSameNode(currentPosition))
		{
			return false;
		}
		while(currentNode != null)
		{
			if((currentNode.getNodeName()).equals("textelement"))
			{
				destinationPosition = currentNode;
				break;
			}
			else
			{
				Node prevRelativeNode = findTextNodeInSubtree(currentNode);
				if(prevRelativeNode != null)
				{
					destinationPosition = prevRelativeNode;
					break;
				}
			}
			Node tmpNode = currentNode.getPreviousSibling();
			if(tmpNode == null)
			{
				Node parentNode = currentNode.getParentNode();
				while(parentNode != null)
				{
					Node parentNodeSibling = parentNode.getPreviousSibling();
					if(parentNodeSibling != null)
					{
						currentNode = parentNodeSibling;
						break;
					}
					parentNode = parentNode.getParentNode();
				}
				
			}
			else
			{
				currentNode = tmpNode;
			}
		}
		if(destinationPosition != null)
		{
			//TODO: Check this
			this.node = destinationPosition;
			return true;
		}
		return false;
	}

	@Override
	public void begin() 
	{
		node = tab.getNode(1);
		node = findTextNodeInSubtree(node);
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

	//TODO
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
			//TODO: Navigate to the closest text node
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
