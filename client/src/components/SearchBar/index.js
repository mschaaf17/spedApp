import React, {useState} from 'react'
import { useQuery } from '@apollo/client'
import {QUERY_USERS} from '../../utils/queries'
import "./index.css";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';

function SearchBar({placeholder, addStudent, isStudentAdded}) {
    const [filteredData, setFilteredData] = useState([]);
    const {loading, data} = useQuery(QUERY_USERS)
    const getAllUsers = data?.users || []

    const handleFilter = (e) => {
       const searchWord = e.target.value
       const newFilter = getAllUsers.filter((user) => {
        const username = user.username || ''; // Null check
        return (
          username.toLowerCase().includes(searchWord.toLowerCase()) &&
          !user.isAdmin
        );
      });
      
       if (searchWord === "") {
        setFilteredData([]);
       }
       else{
        setFilteredData(newFilter)
       }
    }
    return (
        <div className = "search"> 
            <div className="searchInputs">
                <input type ="text" placeholder = {placeholder} onChange={handleFilter}></input>
                <div className="searchIcon"><SearchIcon/></div>
            </div>
            <div className='user_list'> 
           {filteredData.length !=0 && (
            <div className="dataResult each_student">
                {filteredData.map((users, index)=>{
                    return (
                        <p key ={index}>               
                <p className= 'center' onClick={() => addStudent(users._id)}>
                {users.username}
                 {isStudentAdded(users._id) ? (
                    <BookmarkAddedIcon />
                  ) : (
                <AddIcon />
                 )}
                 </p>
                        </p>
                    )
                })}
                </div>
            )}
            </div>
            </div>
    )
}

export default SearchBar