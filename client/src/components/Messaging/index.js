// import React from 'react'

// export default function index() {
//   return (
//     <div id="message-container">
//       <form id="send-container">
//         <input type ="text" id="message-input"></input>
//         <button type ="submit" id="send-button">Send</button>
//       </form>
//     </div>
//   )
// }

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Messages from '../Messages';
import MessageInput from '../MessageInput';

import './index.css';

function InstantMessage() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(`http://${window.location.hostname}:3000`);
    setSocket(newSocket);
    return () => newSocket.close();
  }, [setSocket]);

  return (
    <div className="">
      <div className="">
        Messaging: 
      </div> 
      { socket ? (
        <div className="">
          <Messages socket={socket} />
          <MessageInput socket={socket} />
        </div>
      ) : (
        <div>Not Connected</div>
      )}
    </div>
  );
}

export default InstantMessage;