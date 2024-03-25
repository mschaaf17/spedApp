// import React, { useState } from 'react';
// import { useQuery } from '@apollo/client';
// import { QUERY_STUDENT_LIST } from '../../utils/queries';
// import SearchIcon from '@mui/icons-material/Search';
// import AddIcon from '@mui/icons-material/Add';
// import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
// import "../../../src/index.css";

// function SearchBar({ placeholder, addStudent, isStudentAdded, getAllStudents }) {
//   const [filteredData, setFilteredData] = useState([]);
//   //const { loading, data } = useQuery(QUERY_STUDENT_LIST);
//   // const getAllStudents = data?.students || [];

//   const capitalizeInitials = (name) => {
//     return name
//       .split(' ')
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   };

//   const handleFilter = (e) => {
//     const searchWord = e.target.value.toLowerCase();
//     const newFilter = getAllStudents.filter((student) => {
//       const { username, firstName, lastName, studentSchoolId } = student;
//       const fullName = `${capitalizeInitials(lastName)}, ${capitalizeInitials(
//         firstName
//       )} (${studentSchoolId})`;

//       return (
//         username.toLowerCase().includes(searchWord) ||
//         firstName.toLowerCase().includes(searchWord) ||
//         lastName.toLowerCase().includes(searchWord) ||
//         studentSchoolId.includes(searchWord)
//       );
//     });

//     if (searchWord === '') {
//       setFilteredData([]);
//     } else {
//       setFilteredData(newFilter);
//     }
//   };

//   return (
//     <div className="search">
//       <div className="searchInputs">
//         <label htmlFor="studentInput">Add a student:</label>
//         <input
//           id="studentInput"
//           type="text"
//           placeholder={placeholder}
//           onChange={handleFilter}
//         />
//         <div className="searchIcon">
//           <SearchIcon />
//         </div>
//       </div>

//       <div className="">
//         {filteredData.length !== 0 && (
//           <div className="dataResult">
//             {filteredData.map((student, index) => {
//               const { firstName, lastName, studentSchoolId } = student;
//               const fullName = `${capitalizeInitials(lastName)}, ${capitalizeInitials(
//                 firstName
//               )} (${studentSchoolId})`;

//               return (
//                 <p
//                   key={index}
//                   className="centerDropdown"
//                   onClick={() => {
//                     if (!isStudentAdded(student._id)) {
//                       addStudent(student._id);
//                     }
//                   }}
//                 >
//                   {fullName}
//                   {isStudentAdded(student._id) ? (
//                     <BookmarkAddedIcon />
//                   ) : (
//                     <AddIcon />
//                   )}
//                 </p>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default SearchBar;
