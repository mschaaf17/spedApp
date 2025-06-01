import React, { useEffect, useState } from 'react'; 
import { Space, Table, Select } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SaveIcon from '@mui/icons-material/Save';

const AccommodationTable = ({
  accommodationCards,
  selectedAccommodationId,
  userData,
  accommodationLoading,
  onAccommodationClick,
  submitAccommodationForStudent,
  selectedStudent,
  setSelectedStudent
}) => {
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  useEffect(() => {
    if (userData) {
      const options = userData.user.accommodations
        .filter(student => student.accommodations && !student.accommodations.some(accommodation => accommodation._id === selectedAccommodationId))
        .map(student => ({
          value: student._id,
          label: `${capitalizeInitials(student.lastName)}, ${capitalizeInitials(student.firstName)} (${student.studentSchoolId})`
        }));
      setSelectOptions(options);
    }
  }, [userData, selectedAccommodationId]);

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
    setSelectedStudent(null);
    setVisibleSelectRowId(null);
  };

  const displaySelect = (rowId) => {
    setVisibleSelectRowId(rowId);
  };
  
  const capitalizeInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const generateFilters = (key) => {
    if (!accommodationCards) return [];
    const values = [...new Set(accommodationCards.map(student => student[key]))];
    return values.map(value => ({
      text: value,
      value: value,
    }));
  };

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
      dataIndex: 'actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Space>
            {!record.isAdded && (
              <div className='tooltip' onClick={() => displaySelect(record._id)}>
                <PersonAddAlt1Icon className='icons'/>
                <span className='tooltipText'>Add to student</span>
              </div>
            )}
            {record.isAdded && (
              <div className='tooltip'>
                <DeleteForeverIcon className="deleteIcon"/>
                <span className='tooltipText'>Remove from student</span>
              </div>
            )}
            {/* {visibleSelectRowId === record._id && (
              <div>
                <Select
                  value={selectedStudent}
                  onChange={value => setSelectedStudent(value)}
                  options={selectOptions}
                />
                <SaveIcon className='saveIcon' onClick={handleSaveAccommodation} />
              </div>
            )} */}
          </Space>
        </>
      )
    }
  ];

  return (
    <>
      <Table 
        columns={columns} 
        dataSource={accommodationCards.map(card => ({...card, key: card._id, isAdded: selectedStudent && selectedStudent === card._id}))} 
        loading={accommodationLoading} 
        pagination={false}
      />
    </>
  );
};

export default AccommodationTable;
