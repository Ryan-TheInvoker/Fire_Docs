import React, {useEffect, useState} from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { DeleteAccountPopup } from './Popups';
import axios from "axios";


function Account() {
    const jwtToken = localStorage.getItem("jwtToken");

    const user = {
        username: 'Us3rname3xample',
        email: 'example@gmail.com',
        password: 'example-password',
        avatar: null,
    };
    const [username, setUsername] = useState(user.username);
    const [email, setEmail] = useState(user.email);
    const [password, setpassword] = useState();
    const [avatarPreview, setAvatarPreview] = useState(null)

    const setupData = async () => {
        // get the username and email
        try {
            const res = await axios.get('http://localhost:3000/api/users/get-my-info', {headers: {authorization: jwtToken}})
            console.log(res.data)
            setUsername(res.data.username)
            setEmail(res.data.email)
            setpassword(res.data.password)
        } catch {
            console.log("SOMETHING BAD HAPPENED")
        }

        // get the avatar
        axios({
            method: 'get',
            url: 'http://localhost:3000/api/users/get-avatar', // Replace with your endpoint
            responseType: 'arraybuffer', // Important for receiving image as binary data
            headers: {
                'Authorization': jwtToken // Replace with your JWT token
            }
        })
            .then(response => {
                // Convert binary data to base64
                const base64 = btoa(
                    new Uint8Array(response.data)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );

                // Get the img element and set its src attribute
                //const imgElement = document.getElementById('avatar');
                //imgElement.src = `data:image/png;base64,${base64}`;
                setAvatarPreview(`data:image/png;base64,${base64}`);})
            .catch(error => {
                console.error('Error fetching avatar:', error);
            });

    }

    // initialize everything
    useEffect(() => {
        setupData()
    }, [])

    const handleInputChange = (e) => {
        const { id, files } = e.target;
    
        if (id === 'avatar') {
          const avatarFile = files[0];
    
          // Create a preview URL for the selected avatar image
          const reader = new FileReader();
          reader.onload = (e) => {
            setAvatarPreview(e.target.result);
          };
          reader.readAsDataURL(avatarFile);

        }
    };
    const [isOpen, setIsOpen] = useState(false);
    const handleOpen = () => {
        setIsOpen(true);
    }
    const handleClose = () => {
        setIsOpen(false)
    };
    const handleAvatarButtonClick = () => {
        // Trigger the file input's click event
        document.getElementById('avatar').click();
    };
    //     Error message flags
    const [eTaken, setETaken] = useState(false);
    const [eUser, setEUser] = useState(false);
    const [eEmail, setEEmail] = useState(false);
    const [eValid, setEValid] = useState(false);
    const [ePassword, setEPassword] = useState(false);
    const [eCPassword, setECPPassword] = useState(false);
    const [ePMatch, setEPMatch] = useState(false);

    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const isEmailValid = (email) => {
        // This regular expression pattern checks for a basic email format
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailPattern.test(email);
    };
    const handleUpdateDetails = async () => {
        // attempt to update user details
        setETaken(false);
        setEEmail(false);
        setEValid(false);
        setEPassword(false);
        setEUser(false);
        setECPPassword(false);
        setEPMatch(false);

        let error = false;
        if (email === "") {
            setEEmail(true);
            error = true;
        } else if (!isEmailValid(email)) {
            setEValid(true);
            error = true;
        }
        if (password === "") {
            setEPassword(true);
            error = true;
        }if (username === "") {
            setEUser(true);
            error = true;
        }

        if (error) {
            return
        }
        try {
            const res = axios.put('http://localhost:3000/api/users/update-profile', {username: username, email: email, password: password}, {headers: {authorization: jwtToken}})
            setSuccess(true)
        } catch {
            setETaken(true);
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="bg-orange-500 p-4 text-white flex w-screen justify-between fixed top-0 left-0 right-0">
                <Link to={'/Dashboard'}>
                    <div className="text-3xl font-bold text-white">Fire Docs🔥</div>
                </Link>
                <div className="space-x-5 flex items-center">
                    <Link to={`/`}>
                        <button className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded">Log out</button>
                    </Link>
                    <button className="h-12 w-12 bg-gray-700 rounded-full border-0 hover:border-4 hover:border-orange-200"></button>
                </div>

            </div>
        

            {/* Contents */}
            <div className="bg-orange-50 p-4 text-white w-screen h-screen space-y-6 px-36 mt-10 pt-16">
                <div className="flex justify-between items-center">
                    <div className="font-bold text-3xl text-black text-left">Account Details</div>
                </div>

                <div className="flex justify-around space-5-x border-orange-500 border-4 pt-12 pl-5 pb-12 bg-white">
                    <div className="flex-col">
                        <label
                            className="w-full flex justify-center bg-orange-50 border-orange-200 border-4 text-gray-700 rounded"
                        >   
                            <span>
                                {avatarPreview ? '' : 'Choose Avatar'}
                            </span>

                            {avatarPreview && (
                                <div className="flex justify-center">
                                    <img
                                        className="w-60 h-60"
                                        src={avatarPreview}
                                        alt="Avatar Preview"
                                    />
                                </div>
                            )}
                        </label>


                    </div>

                    <div className="flex-col pl-12 text-left">
                        
                        <div className="flex justify-between rounded mb-4">

                            <div className="flex-col">
                            {success && <div className="text-orange-500">Details updated successfully</div>}
                            {eUser && <div className="text-red-500">Please add a username</div>}
                            {eTaken && <div className="text-red-500">Username or email already used</div>}
                                <label className="block text-gray-700 text-xl font-bold mb-4" htmlFor="username">
                                    Username
                                </label>
                        
                                <input className="w-full py-2 px-3 text-3xl bg-orange-100 text-gray-700 leading-tight focus:shadow-outline" htmlFor="username" value={username} onChange={(e) => setUsername(e.target.value)}>

                                </input>
                            </div>
                        </div>

                        <div className="flex justify-between rounded mb-4">
                            <div className="flex-col">
                            {eEmail && <div className="text-red-500">Please add an email address</div>}
                            {eValid && <div className="text-red-500">Please enter a valid email address</div>}
                                <label className="block text-gray-700 text-xl font-bold mb-4" htmlFor="email">
                                    Email
                                </label>

                                <input className="w-full py-2 px-3 text-3xl bg-orange-100 text-gray-700 leading-tight focus:shadow-outline" htmlFor="email" value={email}  onChange={(e) => setEmail(e.target.value)}>

                                </input>
                            </div>
                        </div>

                        <div className="flex justify-between rounded mb-4">
                            <div className="flex-col">
                                {ePassword && <div className="text-red-500">Please add a password</div>}
                                <label className="block text-gray-700 text-xl font-bold mb-4" htmlFor="email">
                                    Password
                                </label>

                                <input className="w-full py-2 px-3 text-3xl bg-orange-100 text-gray-700 leading-tight focus:shadow-outline" htmlFor="email" type="password" value={password} onChange={(e) => setpassword(e.target.value)}>

                                </input>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <button className="bg-orange-500 hover:bg-orange-700 text-sm text-white font-bold rounded cursor-pointer" onClick={handleUpdateDetails}>
                                Update Account details
                            </button>
                            <button className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-sm text-white font-bold rounded cursor-pointer" onClick={handleOpen}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <DeleteAccountPopup  isOpen={isOpen} onClose={handleClose}/>
        </div>

    )
}

export default Account

/*
                        

                        <label className="block text-gray-700 text-xl font-bold mb-4 pt-12" htmlFor="password">
                            Password
                        </label>

                        <label className="w-full py-2 px-3 text-3xl text-gray-700 leading-tight focus:shadow-outline" htmlFor="password">
                            {user.password}
                        </label>

*/
