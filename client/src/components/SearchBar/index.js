import React, {useState} from 'react'
import { useQuery } from '@apollo/client'
import {QUERY_STUDENT_LIST} from '../../utils/queries'
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import "../../../src/index.css"

function SearchBar({placeholder, addStudent, isStudentAdded}) {
    const [filteredData, setFilteredData] = useState([]);
    const {loading, data} = useQuery(QUERY_STUDENT_LIST)
    const getAllStudents = data?.students || []

    const handleFilter = (e) => {
       const searchWord = e.target.value
       const newFilter = getAllStudents.filter((student) => {
        const username = student.username || ''; // Null check
        return (
          username.toLowerCase().includes(searchWord.toLowerCase()) 
        //   &&
        //   !user.isAdmin
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
            <label htmlFor="studentInput">Add a student:</label>
            <input id="studentInput" type="text" placeholder={placeholder} onChange={handleFilter} />
            <div className="searchIcon"><SearchIcon/></div>
            </div>

            <div className='user_list'> 
           {filteredData.length !=0 && (
            <div className="dataResult each_student">
                {filteredData.map((students, index)=>{
                    return (
                        <p key ={index}>               
                <p className= 'center' onClick={() => addStudent(students._id)}>
                {students.username}
                 {isStudentAdded(students._id) ? (
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