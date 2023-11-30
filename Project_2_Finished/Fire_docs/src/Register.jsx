import React, {useState} from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import axios from "axios";

function Register() {

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatar: null,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showCPassword, setShowCPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState(null);


//     Error message flags
    const [eTaken, setETaken] = useState(false);
    const [eUser, setEUser] = useState(false);
    const [eEmail, setEEmail] = useState(false);
    const [eValid, setEValid] = useState(false);
    const [ePassword, setEPassword] = useState(false);
    const [eCPassword, setECPPassword] = useState(false);
    const [ePMatch, setEPMatch] = useState(false);
    const navigate = useNavigate();

    const isEmailValid = (email) => {
        // This regular expression pattern checks for a basic email format
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailPattern.test(email);
    };

    const handleInputChange = (e) => {
        const { id, value, files } = e.target;

        if (id === 'avatar') {
          const avatarFile = files[0];
          setFormData({ ...formData, [id]: avatarFile });

          // Create a preview URL for the selected avatar image
          const reader = new FileReader();
          reader.onload = (e) => {
            setAvatarPreview(e.target.result);
          };
          reader.readAsDataURL(avatarFile);
        } else {
          setFormData({ ...formData, [id]: value });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const {email, password, username, confirmPassword} = formData
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
        }if (confirmPassword === "") {
            setECPPassword(true);
            error = true;
        } else if (confirmPassword !== password && password !== "") {
            setEPMatch(true);
            error = true;
        }

        if (error) {
            return

        }
        if (email === "" || password === "" || username === "" || confirmPassword === "") {
            setError("Please fill in all fields")
            return;
        }

        if (!isEmailValid(email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return;
        }

        if (!formData.avatar) {
            setError("no avatar")
            return
        }

        const formDataObj = new FormData();
        formDataObj.append("username", username);
        formDataObj.append("email", email);
        formDataObj.append("password", password);
        formDataObj.append("confirmPassword", confirmPassword);
        if (formData.avatar) {
            formDataObj.append("avatar", formData.avatar);
        }

        try {
            const res = await axios.post(
                "http://localhost:3000/api/users/register",
                formDataObj,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            navigate('/');
        } catch (e) {
            console.log("Some problem, probably useername or email already in use", e)
            setETaken(true);
        }

    }

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const toggleShowCPassword = () => {
        setShowCPassword(!showCPassword);
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-orange-100">
            <div className="bg-white shadow-md rounded pb-8 mb-4 border-orange-500 border-4">

                {/* Header */}
                <div className="bg-orange-500 text-white flex w-90 justify-center">
                    <div className="text-3xl p-5 font-bold">Fire Docs🔥</div>
                </div>

                {/* Contents */}
                <div className="font-bold text-3xl text-black text-center pt-6">Register</div>

                <form className="flex">
                    <form className="flex-col">
                        <div className="pt-6 mb-4 px-12">
                            <label className="block text-gray-700 text-s font-bold mb-2" htmlFor="username">
                                Username
                            </label>
                            {eUser && <div className="text-red-500">Please add a username</div>}
                            {eTaken && <div className="text-red-500">Username or email already used</div>}
                            <input
                                className="border-orange-200 border-2 bg-orange-50 shadow rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                                id="username"
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="pt-6 mb-4 px-12">
                            <label className="block text-gray-700 text-s font-bold mb-2" htmlFor="email">
                                Email
                            </label>
                            {eEmail && <div className="text-red-500">Please add an email address</div>}
                            {eValid && <div className="text-red-500">Please enter a valid email address</div>}
                            <input
                                className="border-orange-200 border-2 bg-orange-50 shadow rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="pt-6 mb-4 px-12">
                            <label className="block text-gray-700 text-s font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            {ePassword && <div className="text-red-500">Please add a password</div>}
                            {ePMatch && <div className="text-red-500">Your passwords do not match</div>}
                            <div className="relative">
                                <input
                                    className="border-orange-200 border-2 bg-orange-50 shadow rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />

                                <span
                                    className="mt-auto text-orange-500 hover:text-orange-700 text-s font-bold cursor-pointer"
                                    onClick={toggleShowPassword}
                                >
                                    {showPassword ? "Hide Password" : "Show Password"}
                                </span>

                            </div>
                        </div>

                        <div className="pt-6 mb-4 px-12">
                            <label className="block text-gray-700 text-s font-bold mb-2" htmlFor="password">
                                Confirm Password
                            </label>
                            {eCPassword && <div className="text-red-500">Please confirm your password</div>}
                            <div className="relative">
                                <input
                                    className="border-orange-200 border-2 bg-orange-50 shadow rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                                    id="confirmPassword"
                                    type={showCPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />

                                <span
                                    className="mt-auto text-orange-500 hover:text-orange-700 text-s font-bold cursor-pointer"
                                    onClick={toggleShowCPassword}
                                >
                                    {showCPassword ? "Hide Password" : "Show Password"}
                                </span>

                            </div>
                        </div>
                        {error && <p className="text-red-600">{error}</p>}
                    </form>

                    <form className="flex-col px-12">
                        <label className="block text-s text-gray-700 font-bold pt-6 mb-2 px-12" htmlFor="avatar">
                            User Avatar
                        </label>

                        <label
                            className="w-full flex justify-center bg-orange-50 border-orange-200 border-4 text-gray-700 rounded cursor-pointer hover:bg-orange-300"
                        >
                            <span className="flex justify-center">
                                {avatarPreview ? '' : 'Choose Avatar'}
                            </span>

                            <input
                                className="hidden"
                                id="avatar"
                                type="file"
                                onChange={handleInputChange}
                                accept="image/*"
                                placeholder="Select File"
                            />

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

                        <Link to="/">
                            <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 mt-6 rounded focus:shadow-outline" onClick={handleRegister}>Register</button>
                        </Link>
                    </form>

                    <Link to="/" className="mt-auto mb-4 pr-12">
                        <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 mt-6 rounded focus:shadow-outline">
                            Back
                        </button>
                    </Link>
                </form>
            </div>

        </div>
    )
}
export default Register
