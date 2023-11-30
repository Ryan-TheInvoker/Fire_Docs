import React, { useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import axios from "axios";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    console.log(email, password)
    const login_data = {"email": email, "password": password, "remember" : rememberMe}

    try {
      const res = await axios.post("http://localhost:3000/api/users/login", login_data) // TODO handle invalid credentials and remember me
      console.log("token:", res.data)
      localStorage.setItem("jwtToken", res.data["token"]);
      navigate('/dashboard');
    } catch(err) {
      setError("* Invalid username or password! *")
    }
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  }

  return (
      <div className="w-screen h-screen flex items-center justify-center bg-orange-100">
        <div className="bg-white shadow-md rounded pb-8 mb-4 border-orange-500 border-4">

            {/* Header */}
            <div className="bg-orange-500 text-white flex w-90 justify-center">
              <div className="text-3xl p-5 font-bold">Fire Docs🔥</div>
            </div>

            {/* Contents */}
          <form onSubmit={handleLogin}>
            <div className="font-bold text-3xl text-black text-center pt-6">Login</div>

            <div className="pt-6 mb-4 px-12">
            {error && <p className="text-red-600">{error}</p>}
              <label className="block text-gray-700 text-s font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                  className="border-orange-200 border-2 bg-orange-50 shadow rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  id="email"
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="pt-6 mb-4 px-12">
              <label className="block text-gray-700 text-s font-bold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  className="border-orange-200 border-2 bg-orange-50 shadow rounded w-full py-2 px-3 text-gray-700 leading-tight focus:shadow-outline"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <span
                  className="mt-auto text-orange-500 hover:text-orange-700 text-s font-bold cursor-pointer"
                  onClick={toggleShowPassword}
                >
                  {showPassword ? "Hide Password" : "Show Password"}
                </span>

              </div>
            </div>
              <div className="mb-4 px-12">
                <label>
                  <input
                    className="form-checkbox text-white"
                    id="rememberme"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span className="ml-2 text-gray-700 text-sm">Remember Me</span>
                </label>
              </div>
              <Link to="Register">
                <div className="mb-6">
                  <label className="text-orange-500 hover:text-orange-700 text-s font-bold">
                    Don't have an account? Register here.
                  </label>
                </div>
              </Link>



            <div className="flex items-center justify-center">
              <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:shadow-outline"
              >
                Sign In
              </button>
            </div>
          </form>
          </div>
        </div>
      )
}
export default Login
