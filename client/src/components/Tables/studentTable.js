import React, { useEffect, useState } from 'react'; 
import { Button, Space, Table, Select } from 'antd';
import { useQuery } from '@apollo/client';
import { QUERY_ME, QUERY_STUDENT_LIST } from '../../utils/queries';
import SearchIcon from '@mui/icons-material/Search';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { Link } from 'react-router-dom';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import "../../../src/index.css";
import useSelectedCharts from '../../hooks/useSelectCharts';



const StudentTable = ({placeholder, isStudentAdded, getAllStudents, getMyStudentList, removeStudent, addStudent, setSelectedForm}) => {

  const { loading, error, data } = useQuery(QUERY_ME); 
  const [filteredData, setFilteredData] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const {selectCharts} = useSelectedCharts();

  const handleViewGraphClick = () => {
    setSelectedForm('3');
  };

  const capitalizeInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFilter = (e) => {
    const searchWord = e.target.value.toLowerCase();
    const newFilter = getAllStudents.filter((student) => {
      const { username, firstName, lastName, studentSchoolId } = student;
      const fullName = `${capitalizeInitials(lastName)}, ${capitalizeInitials(
        firstName
      )} (${studentSchoolId})`;

      return (
        username.toLowerCase().includes(searchWord) ||
        firstName.toLowerCase().includes(searchWord) ||
        lastName.toLowerCase().includes(searchWord) ||
        studentSchoolId.includes(searchWord)
      );
    });

    if (searchWord === '') {
      setFilteredData([]);
    } else {
      setFilteredData(newFilter);
    }
  };

useEffect(()=> {
  setFilteredInfo({});
  setSortedInfo({});
}, [getMyStudentList])

  const handleChange = (pagination, filters, sorter, extra) => {
    console.log('Various parameters', pagination, filters, sorter, extra);
    setFilteredInfo(filters);
    setSortedInfo(sorter);
    isStudentAdded(extra)
  };

  const handleRowClick = (studentId) => {
    addStudent(studentId)
  }


  const generateFilters = (key) => {
    if (!getMyStudentList) return [];
    const values = [...new Set(getMyStudentList.map(student => student[key]))];
    return values.map(value => ({
      text: value,
      value: value,
    }));
  };

  const getRowClassName = (record, index) => {
    return index % 2 === 0 ? 'whiteRow' : 'coloredRow'; // Alternate between white and green rows
  };

 
  const columns = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      filterSearch: true,
      filters: generateFilters('firstName'),
      filteredValue: filteredInfo.firstName || null,
      onFilter: (value, record) => record.firstName.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.firstName.length - b.firstName.length,
      sortOrder: sortedInfo.columnKey === 'firstName' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
      
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      filterSearch: true,
      filters: generateFilters('lastName'),
      filteredValue: filteredInfo.lastName || null,
      onFilter: (value, record) => record.lastName.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.lastName - b.lastName,
      sortOrder: sortedInfo.columnKey === 'lastName' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      filterSearch: true,
      filters: generateFilters('username'),
      filteredValue: filteredInfo.username || null,
      onFilter: (value, record) => record.username.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.username.length - b.username.length,
      sortOrder: sortedInfo.columnKey === 'username' ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: 'School ID',
      dataIndex: 'studentSchoolId',
      key: 'studentSchoolId',
      filterSearch: true,
      filters: generateFilters('studentSchoolId'),
      filteredValue: filteredInfo.studentSchoolId || null,
      onFilter: (value, record) => record.studentSchoolId.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.studentSchoolId.length - b.studentSchoolId.length,
      sortOrder: sortedInfo.columnKey === 'studentSchoolId' ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Space>
          <div className='tooltip'>
            <Link to={`/studentProfile/${record.username}/SideMenuLandingPage`}>
              <CreateNewFolderOutlinedIcon className='icons'/>
              <span className='tooltipText'>Log Data</span>
            </Link>
            </div>

            <div className='tooltip'>
            <Link to={`/studentProfile/${record.username}/SideMenuLandingPage`}onClick={handleViewGraphClick}>
              <AssessmentOutlinedIcon className='icons'/>
              <span className='tooltipText'>View Graph</span>
            </Link>
            </div>

            {/* <Link to={`/studentProfile/${record.username}/addInterventions`}>
              <PeopleAltOutlinedIcon/>
            </Link> */}
            <div className='tooltip'>
            <Link to={`/studentProfile/${record.username}/addAccommodationsForStudent`}>
              <GroupAddOutlinedIcon className='icons' />
              <span className='tooltipText'>Add Accommodations</span>
            </Link>
            </div>

          <div className='tooltip'>
            <DeleteForeverIcon onClick={() => removeStudent(record._id)} danger className="deleteIcon"/>
            <span className='tooltipText'>Remove Student</span>
          </div>
          </Space>
        </>
      ),
    }
    

  ];
  return (
    <>
 <div className="search">
      <div className="searchInputs">
        <label htmlFor="studentInput">Add a student:</label>
        <input
          id="studentInput"
          type="text"
          placeholder={placeholder}
          onChange={handleFilter}
        />
        <div className="searchIcon">
          <SearchIcon />
        </div>
      </div>

      <div className="">
        {filteredData.length !== 0 && (
          <div className="dataResult">
            {filteredData.map((student, index) => {
              const { _id, firstName, lastName, studentSchoolId } = student;
              const fullName = `${capitalizeInitials(lastName)}, ${capitalizeInitials(
                firstName
              )} (${studentSchoolId})`;

              const isAlreadyAdded = getMyStudentList.some(
                (addedStudent) => addedStudent._id === _id
              );

              return (
                <p
                  key={index}
                  className="centerDropdown"
                  onClick={() => {
                    if (!isAlreadyAdded) {
                      addStudent(_id);
                    }
                  }}
                >
                  {fullName}
                  {isAlreadyAdded ? (
                    <BookmarkAddedIcon />
                  ) : (
                    <AddIcon />
                  )}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>



      <Space
        style={{
          marginBottom: 16,
        }}
      >
      
      </Space>
      <Table 
        columns={columns} 
        dataSource={getMyStudentList || []}
        loading = {loading} 
        onChange={handleChange}
        onRow={(record) => ({
          onClick: () => { handleRowClick(record._id) }, // Trigger addStudent function when a row is clicked
        })}
        rowClassName={getRowClassName}
        />
    </>
  );
};


export default StudentTable;
