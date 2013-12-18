package interfaces;

import server.Message;

public interface IMessageChannel 
{
	int getId();
	int getNextTextId();
	void send(Message msg) throws Exception;
	void release();
}
