import React, { useState, useEffect, useRef } from 'react';

import { marked } from 'marked';


const Markdowney = () => {
    const [input, setInput] = useState('');
    const ws = useRef(null);

    // initial setup
    useEffect(() => {
        console.log("1")
        ws.current = new WebSocket('ws://localhost:8081');
        console.log("2")

        ws.current.onmessage = (e) => {
            console.log("received something!")
            // TODO bad cringe code 🤢 very stinky 🤮🤮🤮🤮
            if (e.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const message = event.target.result;
                    setInput(message)
                };
                reader.readAsText(e.data);
            } else {
                const message = e.data;
                setInput(message)
            }
        };


        ws.current.onopen = () => {
            console.log('Connected to the server');
            // send authentication info TODO lots of work
            ws.current.send(JSON.stringify({"token": 123, "note_id": 1}));
        };



        return () => {
            ws.current.close();
        };
    }, []);

    const handleInputChange = (e) => {
        const new_input = e.target.value
        console.log("sent something!", new_input)
        //setInput(e.target.value);
        if (new_input.trim()) {
            ws.current.send(JSON.stringify({"note_id": 1, "content": new_input}));
        }
    };

    return (
        <div>
            <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Enter Markdown"
            ></textarea>
            <div
                dangerouslySetInnerHTML={{ __html: marked(input) }}
            ></div>
        </div>
    );
}

export default Markdowney
