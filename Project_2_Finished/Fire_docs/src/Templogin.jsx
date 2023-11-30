// Credit: Chat-GPT

import React, { useState } from "react";
import axios from "axios";

const Templogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [output, setOutput] = useState("");

    const handleSubmit = async () => {
        // get token (I assume correct information)
        setOutput(`Email: ${email}, Password: ${password}`);
        console.log(email, password)
        const login_data = {"email": email, "password": password}
        const res = await axios.post("http://localhost:3000/api/users/login", login_data)
        localStorage.setItem("jwtToken", res.data["token"]);
    };

    return (
        <div>
            <h1>Simple React Page</h1>
            <h2>YOU SHOULD NOT BE HERE</h2>
            <label>
                Email:
                <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </label>
            <br />
            <label>
                Password:
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </label>
            <br />
            <button onClick={handleSubmit}>Submit</button>
            <p>{output}</p>
        </div>
    );
}

export default Templogin;
