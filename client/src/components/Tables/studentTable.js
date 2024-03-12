import React, { useState } from 'react'; 
import { Button, Space, Table } from 'antd';
import { useQuery } from '@apollo/client';
import { QUERY_ME } from '../../utils/queries';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';

//filter I would like to add typing option
//search I need to say add a student then decide how to filter them?????I think first, last name, student id
//capitalize the first letter of each item in columns

const StudentTable = ({getMyStudentList, removeStudent}) => {

  const { loading, error, data } = useQuery(QUERY_ME); 

  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  const handleChange = (pagination, filters, sorter) => {
    console.log('Various parameters', pagination, filters, sorter);
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };
  const clearFilters = () => {
    setFilteredInfo({});
  };
  const clearAll = () => {
    setFilteredInfo({});
    setSortedInfo({});
  };
  const setUsernameSort = () => {
    setSortedInfo({
      order: 'descend',
      columnKey: 'username',
    });
  };

  const generateFilters = (key) => {
    if (!getMyStudentList) return [];
    const values = [...new Set(getMyStudentList.map(student => student[key]))];
    return values.map(value => ({
      text: value,
      value: value,
    }));
  };

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      filters: generateFilters('firstName'),
      filteredValue: filteredInfo.firstName || null,
      onFilter: (value, record) => record.firstName.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.firstName.length - b.firstName.length,
      sortOrder: sortedInfo.columnKey === 'firstName' ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      filters: generateFilters('lastName'),
      filteredValue: filteredInfo.lastName || null,
      onFilter: (value, record) => record.lastName.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.lastName - b.lastName,
      sortOrder: sortedInfo.columnKey === 'lastName' ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
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
            <Link to={`/studentProfile/${record.username}/addAccommodations`}>
              <GroupAddOutlinedIcon />
            </Link>

            <Link to={`/studentProfile/${record.username}/dataLogging`}>
              <CreateNewFolderOutlinedIcon />
            </Link>

            <Link to={`/studentProfile/${record.username}/studentCharts`}>
              <AssessmentOutlinedIcon />
            </Link>

            {/* <Link to={`/studentProfile/${record.username}/addInterventions`}>
              <PeopleAltOutlinedIcon/>
            </Link> */}

            <DeleteForeverIcon onClick={() => removeStudent(record._id)} danger />
          </Space>
        </>
      ),
    }
    

  ];
  return (
    <>
      <Space
        style={{
          marginBottom: 16,
        }}
      >
        {/* <Button onClick={setUsernameSort}>Sort username</Button>
        <Button onClick={clearFilters}>Clear filters</Button>
        <Button onClick={clearAll}>Clear filters and sorters</Button> */}
      </Space>
      <Table 
        columns={columns} 
        dataSource={getMyStudentList || []}
        loading = {loading} 
        onChange={handleChange} 
        />
    </>
  );
};


export default StudentTable;
