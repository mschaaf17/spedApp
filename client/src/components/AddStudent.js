import React, { useState, useEffect, useRef } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_STUDENT_TO_LIST, REMOVE_STUDENT_FROM_LIST } from '../utils/mutations';
import { QUERY_ME, QUERY_STUDENT_LIST } from '../utils/queries';

const AddStudent = () => {
  const [searchValue, setSearchValue] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const { data: meData, refetch: refetchMe } = useQuery(QUERY_ME);
  const { data: allStudentsData } = useQuery(QUERY_STUDENT_LIST);
  const [addStudentToList] = useMutation(ADD_STUDENT_TO_LIST);
  const dropdownRef = useRef(null);

  const myStudents = meData?.me?.students || [];
  const getAllStudents = allStudentsData?.students || [];

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFilteredData([]);
        setSearchValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search/filter for adding students
  const handleFilter = (e) => {
    const searchWord = e.target.value.toLowerCase();
    setSearchValue(searchWord);

    if (!searchWord) {
      setFilteredData([]);
      return;
    }

    const newFilter = getAllStudents.filter((student) => {
      const { username, firstName, lastName, studentSchoolId } = student;
      return (
        username.toLowerCase().includes(searchWord) ||
        firstName.toLowerCase().includes(searchWord) ||
        lastName.toLowerCase().includes(searchWord) ||
        studentSchoolId.includes(searchWord)
      );
    });

    setFilteredData(newFilter);
  };

  // Handle adding a student to the teacher's list
  const handleAddStudent = async (studentId) => {
    try {
      await addStudentToList({
        variables: { studentId },
        refetchQueries: [{ query: QUERY_ME }]
      });
      await refetchMe();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Material-style search bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--md-surface-variant)',
          borderRadius: 24,
          padding: '8px 16px',
          boxShadow: 'var(--md-elevation-1)',
          marginBottom: 8,
        }}
      >
        <SearchIcon style={{ color: 'var(--md-on-surface-variant)', marginRight: 8 }} />
        <input
          type="text"
          placeholder="Search to add student..."
          value={searchValue}
          onChange={handleFilter}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 18,
            flex: 1,
            color: 'var(--md-on-surface)',
          }}
        />
      </div>

      {/* Material-style results dropdown */}
      {filteredData.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            background: 'var(--md-surface)',
            borderRadius: 16,
            boxShadow: 'var(--md-elevation-2)',
            marginTop: 4,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {filteredData.map((student) => {
            const isAdded = myStudents.some((s) => s._id === student._id);
            return (
              <div
                key={student._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  cursor: isAdded ? 'default' : 'pointer',
                  color: 'var(--md-on-surface)',
                  fontSize: 20,
                  borderBottom: '1px solid var(--md-outline-variant)',
                  background: isAdded ? 'var(--md-surface-variant)' : 'var(--md-surface)',
                  transition: 'background 0.2s',
                }}
                onClick={() => {
                  if (!isAdded) handleAddStudent(student._id);
                }}
                onMouseOver={e => {
                  if (!isAdded) e.currentTarget.style.background = 'var(--md-primary-95)';
                }}
                onMouseOut={e => {
                  if (!isAdded) e.currentTarget.style.background = 'var(--md-surface)';
                }}
              >
                <span>
                  {`${student.lastName}, ${student.firstName} (${student.studentSchoolId})`}
                </span>
                {isAdded ? (
                  <BookmarkAddedIcon style={{ color: '#52c41a', marginLeft: 12 }} />
                ) : (
                  <Add style={{ color: 'var(--md-primary-50)', marginLeft: 12 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AddStudent;