import { useState } from 'react'
import './App.css'
import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import Account from './Account'
import Note from './Note'
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Markdowney from "./Markdowney";
import Templogin from "./Templogin";

function App() {
  console.log("APP")
  return(
    <BrowserRouter>
    <main>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Register" element={<Register />} /> 
        <Route path="/Account" element={<Account />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Dashboard/:token" element={<Note />}/>
        <Route path="/demo" element={<Markdowney />} />
        <Route path="/login" element={<Templogin />} />
      </Routes>
    </main>
  </BrowserRouter>
)
  
}

export default App
