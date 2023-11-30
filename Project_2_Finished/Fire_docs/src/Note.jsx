import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import { BsTrash3Fill } from "react-icons/bs";
import { DeletePopup, SharePopup } from './Popups';
import axios from "axios";


// TODO only show share note if this is the owner

const Note = () => {
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const shareHandleClose = () => setShareIsOpen(false);
  const [data, setData] = useState(0);
  const shareHandleOpen = (number) => {
    setData(number);
    setShareIsOpen(true);
  };
  // Delete popup flags
  const [delIsOpen, setDelIsOpen] = useState(false);
  const delHandleOpen = (number) => {
      setData(number);
      setDelIsOpen(true);
  };
  const delHandleClose = () => setDelIsOpen(false);
  const [markdown, setMarkdown] = useState('# Marked in Node.js\n\nRendered by **marked**.');
  const ws = useRef(null);
  const [users, setUsers] = useState([]);

  const [noteName, setNoteName] = useState("");
  const [nameEdit, setNameEdit] = useState(false);
  const handleHeadingChange = (value) =>{
    setNameEdit(true);
    setNoteName(value);
  }
  const currentURL = window.location.href;
  const note_id = currentURL.substring(currentURL.lastIndexOf("/")+1)

  const jwtToken = localStorage.getItem("jwtToken")
  let { token } = useParams()

  useEffect(() => {
    document.getElementById('markdown').value = markdown;
  }, [markdown]);

  const getNoteInfo = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/notes/${token}`, {headers: {"Authorization": jwtToken}})
      setNoteName(res.data.title)
    } catch{
      console.log("PROBLEM")
    }
  }

  const setupEditors = async (user_ids) => {
    const newUsers = [];
    for (let i = 0; i < user_ids.length; i++) {
      const user_id = user_ids[i];
      const res = await axios.get(`http://localhost:3000/api/users/get-user-info/${user_id}`, {});
      newUsers.push(res.data.username);
    }
    setUsers(newUsers);  // This will update the users state and re-render the component
    console.log("I HATE LIFE", newUsers);
  };


  // initial setup
  useEffect(() => {

    ws.current = new WebSocket('ws://localhost:8081');

    // get information about the note
    getNoteInfo()

    /*
    ws.current.onmessage = (e) => {
      console.log("received something!")
      // TODO bad cringe code 🤢 very stinky 🤮🤮🤮🤮
      if (e.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const message = event.target.result;
          setMarkdown(message)
        };
        reader.readAsText(e.data);
      } else {
        const message = e.data;
        setMarkdown(message)
      }
    };
*/

    ws.current.onmessage = (e) => {
      console.log("received something!");

      // Read the incoming data, whether it's a Blob or a string
      if (e.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const message = event.target.result;
          console.log('Received message:', message);


          // Parse the JSON string back into an object
          const payload = JSON.parse(message);

          // Access content and user_id from the payload
          const { content, user_ids } = payload;

          //setUsers([])
          setupEditors(user_ids)

          // Now you can use content and user_id as needed
          setMarkdown(content);
          // Use user_id as you see fit
        };
        reader.readAsText(e.data);
      } else {
        // Handle the case where e.data is already a string
        const payload = JSON.parse(e.data);
        const { content, user_id } = payload;

        setMarkdown(content);
      }
    };


    ws.current.onopen = () => {
      console.log('Connected to the server');
      // send authentication info TODO lots of work
      ws.current.send(JSON.stringify({"token": jwtToken, "note_id": note_id}));
    };

    return () => {
      ws.current.close();
    };
  }, []);

  useEffect(() => {
    updatePreview();
  }, [markdown]);

  function updatePreview() {
    const preview = document.getElementById("preview");
    preview.innerHTML = marked(markdown);
  }

  const handleInputChange = (e) => {
    const new_input = e.target.value
    console.log("sent something!", new_input)
    //setInput(e.target.value);
    if (new_input.trim() || new_input === "") {
      ws.current.send(JSON.stringify({"note_id": note_id, "content": new_input}));
    }

  };

  return (
    <div className='bg-orange-100 w-screen h-screen'>
      {/* Header */}
      <div className="bg-orange-500 p-4 text-white flex w-screen justify-between fixed top-0 left-0 right-0">
        <Link to={`/dashboard`}>
          <div className="text-3xl font-bold text-white">Fire Docs🔥</div>
        </Link>
        <div className="space-x-5 flex items-center">
          <button className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded"
            onClick={(e) => {
              e.preventDefault();
              shareHandleOpen(noteName);
            }}>Share note</button>
            <BsTrash3Fill className='text-3xl hover:text-red-700' onClick={(e) => {
                                                        e.preventDefault();
                                                        delHandleOpen(noteName);
                                                    }}/>
         <Link to={'/Account'}>
                        <button className="h-12 w-12 bg-gray-700 rounded-full border-0 hover:border-4 hover:border-orange-200"></button>
                    </Link>

        </div>

      </div>
      <div className="flex justify-between pr-4">
        <div>
          <input className='text-left ml-5 max-h-20 bg-orange-100 text-black font-bold text-4xl mt-24' value={noteName} onChange={(e) => handleHeadingChange(e.target.value)}/>
          {nameEdit && <button className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 ml-4 rounded"
            onClick={(e) => {
              setNameEdit(false);
            }}>Change name</button>}
        <div className='text-left ml-5  text-black font-bold text-xl '></div>
        </div>
        <div className='text-black text-left text-sm pt-20'>
          Current users:
          <div className='flex space-x-1 h-14'>
            {users.map((user) => (
              <div className="h-12 w-12 bg-orange-400 rounded-full border-0 hover:border-4 hover:border-orange-200 text-center">{user}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-around">
        <div className='flex-grow text-left ml-5 text-black font-bold text-xl'>Plain Text:</div>
        <div className='flex-grow text-left text-black font-bold text-xl'>Markdown:</div>
      </div>
      <div className="flex h-[48rem] w-screen text-left">
        <div className="w-1/2 h-full pr-2 p-4 ">
          <textarea
            className="w-full h-full border border-gray-300 p-2 border-orange-400 border-4 "
            id="markdown"

            onChange={handleInputChange}
          ></textarea>
        </div>
        <div className="w-1/2 flex flex-col h-full pl-2 p-4 text-black">
          <div className="bg-gray-200 flex-grow pl-4 border-orange-300 border-4 " id="preview">
          </div>
        </div>
      </div>
      <DeletePopup isOpen={delIsOpen} onClose={delHandleClose} data={data} />
      <SharePopup isOpen={shareIsOpen} onClose={shareHandleClose} data={noteName} />
    </div>
  )
}
export default Note
