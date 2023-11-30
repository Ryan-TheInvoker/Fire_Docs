import React, { useEffect, useState } from 'react';
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";

// TODO we don't need share  with part here
// TODO there's no button for create, I've made on but it's poes ugly
// TODO the cancel button on the share thing for notes should maybe be a close button on the note page

const NewPopup = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [validEmails, setValidEmails] = useState([]);
  const [title, setTitle] = useState('');  // New state for Title
  const [category, setCategory] = useState('');  // New state for Category

  const navigate = useNavigate();

  const token = localStorage.getItem("jwtToken")

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && event.target.id == 'popup') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);
  const handleInputChange = (event) => {
    const value = event.target.value;
    if (value[value.length - 1] == ' ') {
      handleInputBlur();
    } else {
      setEmail(value);
    }
  };


  if (!isOpen) return null;

  const onCreate = async () => { // TODO check verification or something idk

    // create category
    const t = localStorage.getItem("jwtToken")
    console.log("AS", t)

    const h = {authorization: t}
    let catId
    try {
      const catRes = await axios.post("http://localhost:3000/api/categories/", {name: category}, {headers: h})
      catId = catRes.data.category_id
    } catch (err) { // TODO also check if jwt expired
      if ((err.response.status) === 409) {
        catId = err.response.data.category_id
      } else {
        return
      }
    }


    const headers = {
      authorization: t
    }
    const body = {
      "title": title,
      "content": "Hello I am a note :)",
      "category_id": catId
    }
    const res = await axios.post('http://localhost:3000/api/notes', body, {headers}) // TODO error handling for if this doesn't work
    //onClose
    navigate("./" + res.data.note_id)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 text-black text-left" id='popup'>
      <div className="modal">
        <div className="bg-white shadow-lg shadow-orange-700 opacity-100 p-4 border-4 border-orange-400">
          <div className="text-2xl mb-4 font-bold">New Notebook</div>
          <div className="text-xl  font-bold">Title:</div>
          <input className='bg-orange-50 border-2 mb-4 border-orange-200 enabled:border-oragne-600' value={title}
                 onChange={(e) => setTitle(e.target.value)}></input>
          <div className="text-xl font-bold">Category:</div>
          <input className='bg-orange-50 border-2 mb-4 border-orange-200 enabled:border-oragne-600' value={category}
                 onChange={(e) => setCategory(e.target.value)}></input>

          <div className=" flex justify-between ">
          <button onClick={onClose} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-300 hover:text-slate-800 border-0">
            Close
          </button>
          <button onClick={onCreate} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-300 hover:text-slate-800 border-0">
            Create
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeletePopup = ({ isOpen, onClose, data }) => {

  const {token} = useParams()
  const jwtToken = localStorage.getItem("jwtToken")

  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && event.target.id == 'popup') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {

    try {
      await axios.delete(`http://localhost:3000/api/notes/remove/${token}`, {headers: {authorization: jwtToken}})
    } catch(err) {
      console.log(err) // TODO show some error maybe
      return
    }

    navigate("../dashboard")

  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 text-black text-left" id='popup'>
      <div className="modal">
        <div className="bg-white shadow-lg shadow-orange-700 opacity-100 p-4 border-4 border-orange-400">
          <div className="text-2xl mb-4 font-bold">Do you wish to delete </div>
          <div className="text-2xl mb-4 font-bold">{data} </div>
          <div className='flex justify-between px-2'>
            <button onClick={onClose} className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded">
              No
            </button>
            <button onClick={handleDelete} className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded">
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteAccountPopup = ({ isOpen, onClose }) => {

  const {token} = useParams()
  const jwtToken = localStorage.getItem("jwtToken")

  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && event.target.id == 'popup') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = async () => {

    try {
      await axios.delete('http://localhost:3000/api/users/delete-profile', {headers: {authorization: jwtToken}})
    } catch  {
      console.log("If you see this you're fucked")
    }

/*
    try {
      await axios.delete(`http://localhost:3000/api/notes/remove/${token}`, {headers: {authorization: jwtToken}})
    } catch(err) {
      console.log(err) // TODO show some error maybe
      return
    }*/

    navigate("../")

  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 text-black text-left" id='popup'>
      <div className="modal">
        <div className="bg-white shadow-lg shadow-orange-700 opacity-100 p-4 border-4 border-orange-400">
          <div className="text-2xl mb-4 font-bold">Are you sure you want </div>
          <div className="text-2xl mb-4 font-bold">to delete your account?</div>
          <div className='flex justify-around px-2'>
            <button onClick={onClose} className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded">
              No
            </button>
            <button onClick={handleDelete} className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded">
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const SharePopup = ({ isOpen, onClose, data }) => {
  const [email, setEmail] = useState('');
  const [validEmails, setValidEmails] = useState([]);

  const jwtToken = localStorage.getItem("jwtToken")

  const {token} = useParams()

  useEffect(() => {
    const handleClickOutside = (event) => {


      if (isOpen && event.target.id === 'popup') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    setValidEmails([]);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    if (value[value.length - 1] == ' ') {
      handleInputBlur();
    } else {
      setEmail(value);
    }
  };

  const handleInputBlur = () => {
    const emails = email.split(' ');
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emails[0])) {
      validEmails.push(emails[0])
      setValidEmails(validEmails);
      //setEmail('');
    }
    console.log(validEmails);
  };

  // load the emails
  useEffect(() => {

  }
  , [])

  const handleShare = async () => {
    // TODO validation maybe?
  console.log("THIS IS THE EMAIL", email)
    try {
      console.log("ches", token)
      const res = await axios.post(`http://localhost:3000/api/notes/share/${token}`, {email: email}, {headers: {"authorization": jwtToken}})
    } catch(err) {
      console.log(err)
    }

  }
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 text-black text-left" id="popup">
      <div className="modal">
        <div className="bg-white shadow-lg shadow-orange-700 opacity-100 p-4 border-4 border-orange-400">
          <div className="text-2xl mb-4 font-bold">Share {data}</div>
          <div className="text-xl font-bold">With:</div>
          <div className='space-y-1'>
            {validEmails.map((validEmail, index) => (
              <div className='bg-orange-300 rounded-lg pl-1' key={index}>{validEmail}</div>
            ))}
          </div>
          <input
            className="bg-orange-50 border-2 mb-4 border-orange-200 enabled:border-orange-600"
            value={email}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-1 px-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-1 px-2 rounded"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { NewPopup, DeletePopup, DeleteAccountPopup, SharePopup };

