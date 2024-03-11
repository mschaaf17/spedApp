import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_USERS, QUERY_ME } from '../../../utils/queries';
import { Link, useParams } from 'react-router-dom';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import './index.css';
import { ADD_STUDENT_TO_LIST } from '../../../utils/mutations';
import SearchBar from '../../../components/SearchBar';

export default function AddStudent() {
  const [addedStudents, setAddedStudents] = useState({});
  const { username: userParam } = useParams();
  console.log(userParam);

  const { loading, data } = useQuery(QUERY_USERS);
  const { data: dataMe } = useQuery(QUERY_ME);
  const getAllUsers = data?.users || {};
  const user = dataMe?.me || data?.user || {};
  console.log(dataMe?.me.students);
  console.log({ getAllUsers });
  console.log({ user });

  const [addStudentToList, { error }] = useMutation(ADD_STUDENT_TO_LIST);

  const addStudent = async (userId) => {
    try {
      await addStudentToList({
        variables: { studentId: userId },
      });
      setAddedStudents((prevAddedStudents) => ({
        ...prevAddedStudents,
        [userId]: !prevAddedStudents[userId],
      }));
    } catch (e) {
      console.log(e);
    }
    console.log('Student has been added to the list');
  };

  const isStudentAdded = (userId) => {
    return addedStudents[userId] || dataMe?.me.students?.some(
      (student) => student._id === userId
    );
  };

  return (
    <div>
      <h2>Add Or Remove Student</h2>
      <SearchBar placeholder={'Search Student Name'} 
      addStudent = {addStudent}
      isStudentAdded = {isStudentAdded}
      />
      {Object.values(getAllUsers)
        .filter((user) => user.isAdmin === false)
        .map((user, index) => (
          <div className="each_student" key={index}>
            <p onClick={() => addStudent(user._id)}>
              {user.username}
              {isStudentAdded(user._id) ? (
                <DeleteForeverIcon />
              ) : (
                <AddIcon />
              )}
            </p>
          </div>
        ))}
      <div className="student-list-link">
        <Link className="link-to-page logout" to={`/teacherdata/${user.username}`}>
          ← Back to Student List
        </Link>
      </div>
    </div>
  );
}
