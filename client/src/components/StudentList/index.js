import React, {useState} from 'react'
import './index.css'
import { Link } from 'react-router-dom'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SearchBar from '../SearchBar';


export default function StudentList({getAllUsers, filteredData}) {

  return (
    
    <div className ="user_list">
            {Object.values(getAllUsers &&
        getAllUsers.filter(user => user.isAdmin === false)|| filteredData).map((users, index) => (
          <div className='each_student' key={index}>
            <p>
             <Link className='link-to-page logout center' to = {`/studentProfile/${users.username}`}>{users.username}</Link> 
             <p className='center'><DeleteForeverIcon/></p>  
             {/* https://www.youtube.com/watch?v=x7niho285qs */}
            </p>

          </div>
        ))}
    </div>
  )
}
