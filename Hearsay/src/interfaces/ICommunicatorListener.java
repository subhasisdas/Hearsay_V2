package interfaces;

import java.net.Socket;

import server.Communicator;

public interface ICommunicatorListener 
{
	void onConnect(Communicator source, Socket socket);
}
