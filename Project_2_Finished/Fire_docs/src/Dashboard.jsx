import React, { Fragment, useEffect, useState } from 'react';
import './Login.css';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { GoFilter } from "react-icons/go";
import { NewPopup, DeletePopup, SharePopup } from './Popups';
import axios from "axios";

// TODO logout must delete token from storage
// TODO some message for when there aren't anny notes (nnote that this can also happen when someone searrches for a note that htey don't have, so make the message something likke "couldn't find note"
// TODO remove share tag from note cards

const Dashboard = () => {
    // New popu control flags
    const [newIsOpen, setNewIsOpen] = useState(false);
    const newHandleOpen = () => setNewIsOpen(true);
    const newHandleClose = () => {
        setNewIsOpen(false)
    };
    // Delete popup flags
    const [delIsOpen, setDelIsOpen] = useState(false);
    const [data, setData] = useState(0);
    const delHandleOpen = (number) => {
        setData(number);
        setDelIsOpen(true);
    };
    const delHandleClose = () => setDelIsOpen(false);
    // Share popup flags
    const [shareIsOpen, setShareIsOpen] = useState(false);
    const shareHandleOpen = (number) => {
        setData(number);
        setShareIsOpen(true);
    };
    const shareHandleClose = () => setShareIsOpen(false);

    const [selectCategory, setSelectCategory] = useState(false)
    const [isMenu, setIsMenu] = useState([]);

    const groupNumbers = (numbers, groupSize, search) => {
        let n = [];

        const result = [];
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i].title.includes(search)) {
                n.push(numbers[i]);
            }
        }
        n = n.sort((a, b) => a.timeE - b.timeE);
        for (let i = 0; i < n.length; i += groupSize) {

            result.push(n.slice(i, i + groupSize));
        }
        return result;
    };



    const [searchString, setSearchString] = useState("")

    const [categories, setCategories] = useState([]);
    const [isChecked, setIsChecked] = useState([]);
    const [categoryIds, setCategoryIds] = useState([]);
    const [allChecked, setAllChecked] = useState(true);
    const numbers = [{
        title: "Book",
        category: "Notes",
        timeE: 1
    },
    {
        title: "Table",
        category: "Notes",
        timeE: 5
    },
    {
        title: "Water",
        category: "Outdoors",
        timeE: 14
    },
    {
        title: "Watering plants",
        category: "Outdoors",
        timeE: 2
    },
    {
        title: "Alan",
        category: "Coding",
        timeE: 3
    },
    ];


    const [groupedNumbers, setGroupedNumber] = useState(groupNumbers(numbers, 6, ''));





    const [selectedCategories, setSelectedCategories] = useState()

    const token = localStorage.getItem("jwtToken") // hmmm this feels very wrong

    const getNotes = async () => {
        const config = {headers: {"Authorization": token}}
        const res  = await axios.get("http://localhost:3000/api/notes/user-notes", config)
        //setNotes(res.data)
    }

    const populateCategories = async () => {
        const config = {headers: {"Authorization": token}}
        const res = await axios.get("http://localhost:3000/api/categories/", config)
        const names = res.data.map(item => item.name);
        setCategories(names)
        const ids = res.data.map(item => item.category_id)
        setCategoryIds(ids)
        let temp = []
        for (let i = 0; i < names.length; i++)
            temp.push(true)
        setIsChecked(temp)
    }

    // populate the categories
    useEffect(() => {
        populateCategories()
    }, [])

// Formats the date to print
    const formatDateTime = (rawDate) => {
        const options = { weekday: "long", year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        return new Date(rawDate).toLocaleDateString('en-UK', options);
    }
//     Ensures the correct length of title
    const TextCutoff = (inputText, length) => {
        if (inputText.length <= length) {
            return inputText;
        } else {
        return inputText.substring(0, length-3) + '...';
        }
    };
    const showCards = async () => {
        let note_cards = []
        let cats = []
        for (let i = 0; i < categories.length; i++) {
            if (isChecked[i])
                cats.push(categories[i])
        }
        const config = {headers: {"Authorization": token},
            params: {search: searchString, sort: true, categories: cats.join(",")}}
        const res  = await axios.get("http://localhost:3000/api/notes/get-user-notes", config)
        for (let i = 0; i < res.data.length; i++) {
            const data = res.data[i]
            console.log("ASDAWD", data)
            note_cards.push({title: TextCutoff(data.title, 25), category:  TextCutoff(categories[categoryIds.indexOf(data.category_id)], 22), timeE: formatDateTime(data.last_edited), note_id: data.note_id}) // TODO timeE and category needs to be set
        }
        menu(note_cards)
        setGroupedNumber(groupNumbers(note_cards, 6, ""))
    }
    // show the cards
    // TODO we're always sorting, maybe make this optional
    useEffect(() => {
        showCards()
    }, [isChecked, searchString])






    const handleLogOut = () => {
        localStorage.removeItem("jwtToken");
    }










    const filterCategory = (numbers) => {
        let allFlag = true;
        const c = []
        const filtered = []
        for (let i = 0; i < categories.length; i++) {
            if (isChecked[i]) {
                c.push(categories[i]);
            } else {
                allFlag = false;
            }
        }
        if (allFlag) {
            setAllChecked(true);
        } else {
            setAllChecked(false);
        }
        return numbers.filter(item => c.includes(item.category));
    }

    const menu = (numbers) => {
        const newIsMenu = Array(numbers.length).fill(false);
        setIsMenu(newIsMenu);
    }
    /*useEffect(() => {
        menu(numbers);
        for (let i = 0; i < numbers.length; i++) {
            if (!categories.includes(numbers[i].category)) {
                categories.push(numbers[i].category);
                isChecked.push(true);
            }
        }
    }, [])*/
    let new_input = ""
    const handleInputChange = (e) => {
        setSearchString(e.target.value)
        //new_input = e.target.value
        //setGroupedNumber(groupNumbers(numbers, 6, new_input));
    };

    const toggleCheckbox = (index) => {
        setIsChecked(prevStates => {
            const newStates = [...prevStates];
            newStates[index] = !isChecked[index];
            return newStates;
        });

    };
    const toggleAllCheckbox = (e => {
        for (let index = 0; index < isChecked.length; index++) {
            setIsChecked(prevStates => {
                const newStates = [...prevStates];
                newStates[index] = !allChecked;
                return newStates;
            });
        };
        setAllChecked(!allChecked);
    });
    useEffect(() => {
        setGroupedNumber(groupNumbers(filterCategory(numbers), 6, new_input));
    }, [isChecked])
    return (
        <div>
            {/* Header */}
            <div className="bg-orange-500 p-4 text-white flex w-screen justify-between fixed top-0 left-0 right-0">
                <div className="text-3xl font-bold">Fire Docs🔥</div>
                <div className="space-x-5 flex items-center">
                    <Link to={`/`}>
                    <button className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded" onClick={handleLogOut}>Log out</button>
                    </Link>
                    <Link to={'/Account'}>
                        <button className="h-12 w-12 bg-gray-700 rounded-full border-0 hover:border-4 hover:border-orange-200"></button>
                    </Link>
                </div>

            </div>
            {/* Contents */}
            <div className="bg-orange-50 p-4 text-white w-screen h-screen space-y-6 px-36 mt-10 pt-16" style={{ overflowY: 'auto' }}>
                <div className='flex justify-between items-center'>
                    <div className="font-bold text-3xl text-black text-left">Your Notebooks</div>
                    <div className='flex space-x-2'>
                        <div className="flex items-center rounded text-left w-64 bg-gray-200">
                            <input onChange={handleInputChange} className='bg-gray-200 w-[90%] text-black h-full text-lg'></input>
                            <FaMagnifyingGlass className='text-black' />
                        </div>
                        <div className="relative">
                            <GoFilter onClick={() => setSelectCategory(!selectCategory)} className=' text-black items-center text-4xl' />
                            {selectCategory && (
                                <div className="absolute bg-white border w-48 left-[-150px] top-[20px] border-gray-300 p-2 mt-2 rounded font-normal text-sm text-black">
                                    <div className='flex items-center space-x-3'>
                                        <input
                                            type="checkbox"
                                            className='appearance-none border-2 rounded-full border-orange-400 h-4 w-4 checked:bg-orange-500'
                                            checked = {allChecked}
                                            onChange={(e) => {
                                                toggleAllCheckbox();
                                            }}
                                        />
                                        <div className="text-lg">All</div>
                                    </div>
                                    {categories.map((category, index) => (
                                        <div className='flex items-center space-x-3'>
                                            <input
                                                type="checkbox"
                                                className='appearance-none border-2 rounded-full border-orange-400 h-4 w-4 checked:bg-orange-500'
                                                checked={isChecked[index]}
                                                onChange={(e) => {
                                                    toggleCheckbox(index);
                                                }}
                                            />
                                            <div className="text-lg">{TextCutoff(category, 18)}</div>
                                        </div>

                                    ))}

                                </div>
                            )}
                        </div>
                        <button className="bg-orange-600 hover:bg-orange-300 hover:text-slate-800 border-0 text-white font-bold py-2 px-4 rounded" onClick={newHandleOpen}>New Notebook</button>
                    </div>
                </div>
                {groupedNumbers.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex space-x-[1%] h-[25%] w-[100%]">
                        {row.map((number, index) => (
                            <Link to={`/dashboard/${number.note_id}`}>
                                <div
                                    key={index}
                                    className="w-[100%] h-[100%] max-w-[254px] break-words flex-none bg-white shadow shadow-orange-300 items-center justify-center text-xl font-bold text-black border-orange-300 border-4 rounded-lg hover:bg-orange-100 flex flex-col">
                                    <div className='flex-grow'>
                                    <div className="w-60"/>
                                        {number.title}
                                    </div>
                                    <div className='w-full border-t-4 border-orange-200 text-left pl-4 flex items-center justify-between pr-2'>
                                        <div className='text-xs font-noraml'>
                                            <div className="flex justify-between"><div>Category: </div><div className='font-light'> {number.category}</div></div>
                                            <div>Last edited:</div>
                                            <div className='font-light'>{number.timeE}</div>

                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ))}
            </div>
            <NewPopup isOpen={newIsOpen} onClose={newHandleClose} />
        </div>

    )
}
export default Dashboard
