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
	 * Find the first text node if one exists within the given root node's subtree
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
		System.out.println("DOM : Line 1");
		Node currentPosition = getPos();
		System.out.println("DOM : Line 2");
		if(currentPosition == null)
		{
			return false;
		}
		System.out.println("DOM : Line 3");
		Node destinationPosition = null;
		Node currentNode = currentPosition;
		Node nextNodeToCheck;
		System.out.println("DOM : Line 4 with : " + currentNode.getNodeName());
		do
		{
			System.out.println("DOM : Line 5");
			nextNodeToCheck = currentNode;
			Node nextSibling = currentNode.getNextSibling();
			if(nextSibling == null)
			{
				Node parentNode = currentNode.getParentNode();
				while(parentNode != null)
				{
					System.out.println("Parent node : " + parentNode.getNodeName());
					Node parentNodeSibling = parentNode.getNextSibling();
					if(parentNodeSibling != null)
					{
						nextNodeToCheck = parentNodeSibling;
						break;
					}
					parentNode = parentNode.getParentNode();
				}
			}
			else
			{
				nextNodeToCheck = nextSibling;
			}
			if(currentNode.isSameNode(nextNodeToCheck))
			{
				System.out.println("DOM : Line 7");
				//We had no new node when we tried to move
				break;
			}
			currentNode = nextNodeToCheck;
			System.out.println("DOM : Line 8");
			if((currentNode.getNodeName()).equals("textelement"))
			{
				System.out.println("DOM : Line 9 with : " + currentNode.getTextContent());
				destinationPosition = currentNode;
				break;
			}
			else
			{
				System.out.println("DOM : Line 10");
				Node prevRelativeNode = findTextNodeInSubtree(currentNode);
				if(prevRelativeNode != null)
				{
					destinationPosition = prevRelativeNode;
					break;
				}
			}
		}
		while((currentNode.getParentNode() != null) || (currentNode.getNextSibling() != null));

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
		Node nextNodeToCheck;
		do
		{
			nextNodeToCheck = currentNode;
			Node previousSibling = currentNode.getPreviousSibling();
			if(previousSibling == null)
			{
				Node parentNode = currentNode.getParentNode();
				while(parentNode != null)
				{
					Node parentNodeSibling = parentNode.getPreviousSibling();
					if(parentNodeSibling != null)
					{
						nextNodeToCheck = parentNodeSibling;
						break;
					}
					parentNode = parentNode.getParentNode();
				}
			}
			else
			{
				nextNodeToCheck = previousSibling;
			}
			if(currentNode.isSameNode(nextNodeToCheck))
			{
				//We had no new node when we tried to move
				break;
			}
			currentNode = nextNodeToCheck;
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
		}
		while((currentNode.getParentNode() != null) || (currentNode.getPreviousSibling() != null));

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
		/**
		 * Check if the node is the same as the current node being spoken out
		 * Then, we need to recalculate our speaking position and return true
		 * Else, we return false after removing this node
		 */
		if(node.isSameNode(getPos()))
		{
			//Recalculate the speaking position to a text node

			return true;
		}
		else
		{
			return false;
		}
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
			//TODO: Navigate to the closest text node position
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
