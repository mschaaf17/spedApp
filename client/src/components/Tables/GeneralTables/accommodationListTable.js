import React, { useEffect, useState } from 'react'; 
import { Space, Table, Select } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SaveIcon from '@mui/icons-material/Save';


const AccommodationListTable = ({accommodationCards, selectedAccommodationId, meData, accommodationLoading, onAccommodationClick, submitAccommodationForStudent, selectedStudent, setSelectedStudent}) => {

  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [isSelectShowing, setSelectShowing] = useState(false);
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);


useEffect(() => {
  if (meData) {
    const options = meData.students
      .filter(student => student.accommodations && !student.accommodations.some(accommodation => accommodation._id === selectedAccommodationId))
      .map(student => ({
        value: student._id,
        label: `${capitalizeInitials(student.lastName)}, ${capitalizeInitials(student.firstName)} (${student.studentSchoolId})`
      }));
    setSelectOptions(options);
  }
}, [meData, selectedAccommodationId]);
useEffect(() => {
  if (selectedStudent) {
    setSelectOptions(prevOptions => prevOptions.filter(option => option.value !== selectedStudent));
  }
}, [selectedStudent]);



const handleSaveAccommodation = () => {
  if (!selectedStudent || !selectedAccommodationId) {
    console.error('Selected student or accommodation ID is missing.');
    return;
  }
  submitAccommodationForStudent(selectedAccommodationId, selectedStudent);
  setSelectOptions(prevOptions => prevOptions.filter(option => option.value !== selectedStudent));

  setSelectedStudent(null)
  setVisibleSelectRowId(null)
};

  const displaySelect = (rowId) => {
    setVisibleSelectRowId(rowId)
    //setSelectShowing(true)
  }
  
  

  const handleChange = (pagination, filters, sorter, extra) => {
    console.log('Various parameters', pagination, filters, sorter, extra);
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

 


  const generateFilters = (key) => {
    if (!accommodationCards) return [];
    const values = [...new Set(accommodationCards.map(student => student[key]))];
    return values.map(value => ({
      text: value,
      value: value,
    }));
  };

  const getRowClassName = (record, index) => {
    return index % 2 === 0 ? 'whiteRow' : 'coloredRow'; 
  };
  const capitalizeInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

//I will create a data seed that will always be in
  //change accommodation cards to only query that ones the user added and from me rather than all of them
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      filterSearch: true,
      filters: generateFilters('title'),
      filteredValue: filteredInfo.title || null,
      onFilter: (value, record) => record.title.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.title.length - b.title.length,
      sortOrder: sortedInfo.columnKey === 'title' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
      
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      filterSearch: true,
      filters: generateFilters('description'),
      filteredValue: filteredInfo.description || null,
      onFilter: (value, record) => record.description.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.description - b.description,
      sortOrder: sortedInfo.columnKey === 'description' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => {
        // Only show students who do not already have this accommodation
        const options = meData?.students
          ?.filter(student =>
            !student.accommodations?.some(acc => acc._id === record._id)
          )
          .map(student => ({
            value: student._id,
            label: `${student.lastName}, ${student.firstName} (${student.studentSchoolId})`
          })) || [];

        return (
          <Space>
            {visibleSelectRowId !== record._id && options.length > 0 && (
              <div className='tooltip' onClick={() => displaySelect(record._id)}>
                <PersonAddAlt1Icon className='icons'/>
                <span className='tooltipText'>Add to student</span>
              </div>
            )}
            {visibleSelectRowId === record._id && (
              <>
                <Select
                  onChange={value => setSelectedStudent(value)}
                  value={selectedStudent}
                  showSearch
                  style={{ width: 200 }}
                  placeholder="Search to Select"
                  options={options}
                />
                <div className='tooltip' onClick={handleSaveAccommodation}>
                  <SaveIcon className="icons"/>
                  <span className='tooltipText'>Save accommodation for student</span>
                </div>
              </>
            )}
          </Space>
        );
      }
    }
  ];
  return (
    <>
      <Space
        style={{
          marginBottom: 16,
        }}
      >
      
      </Space>
      <Table 
        columns={columns} 
        dataSource={accommodationCards.map(card => ({...card, key: card._id}))} 
        loading = {accommodationLoading} 
        onChange={handleChange}
        rowClassName={getRowClassName}
        />
    </>
  );
};


export {AccommodationListTable};
