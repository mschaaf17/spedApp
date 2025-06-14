import React, { useEffect, useState } from 'react'; 
import { Space, Table, Select, Button } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SaveIcon from '@mui/icons-material/Save';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_ACCOMMODATION_TEMPLATES } from '../../../utils/queries';
import { ADD_ACCOMMODATION_FOR_STUDENT } from '../../../utils/mutations';

const AccommodationListTable = ({
  accommodationItems,
  meData,
  accommodationLoading,
  onAccommodationClick,
  submitAccommodationForStudent
}) => {
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(null);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [isSelectShowing, setSelectShowing] = useState(false);
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch user (for students) and accommodation templates
  const { loading: userLoading, data: userData } = useQuery(QUERY_ME);
  const { loading: accommodationsLoading, data: accommodationsData } = useQuery(QUERY_ACCOMMODATION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });

  const students = userData?.me?.students || [];
  const accommodationList = accommodationsData?.accommodationList || [];

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
    setSelectedStudent(null);
    setVisibleSelectRowId(null);
  };

  const displaySelect = (rowId) => {
    setVisibleSelectRowId(rowId);
    setSelectedAccommodationId(rowId);
  }
  
  const handleChange = (pagination, filters, sorter, extra) => {
    console.log('Various parameters', pagination, filters, sorter, extra);
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const generateFilters = (key) => {
    if (!accommodationItems) return [];
    const values = [...new Set(accommodationItems.map(student => student[key]))];
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
      render: (_, record) => {
        // Only show students who do not already have this accommodation
        const options = students
          .filter(student =>
            !Array.isArray(student.accommodations) ||
            !student.accommodations.some(acc =>
              (acc.templateId && acc.templateId._id === record._id) ||
              acc._id === record._id // fallback for legacy data
            )
          )
          .map(student => ({
            value: student._id,
            label: `${student.lastName}, ${student.firstName} (${student.studentSchoolId})`
          }));

        console.log('selectedStudent:', selectedStudent, 'options:', options);

        return (
          <Space>
            {options.length > 0 ? (
              visibleSelectRowId !== record._id ? (
                <Button
                  icon={<PersonAddAlt1Icon />}
                  onClick={() => displaySelect(record._id)}
                >
                  Add to student
                </Button>
              ) : (
                <>
                  <Select
                    placeholder="Select student"
                    style={{ width: 180 }}
                    value={selectedStudent}
                    onChange={setSelectedStudent}
                    options={options}
                  />
                  <Button
                    type="primary"
                    disabled={!selectedStudent}
                    onClick={handleSaveAccommodation}
                  >
                    Confirm
                  </Button>
                  <Button onClick={() => {
                    setVisibleSelectRowId(null);
                    setSelectedStudent(null);
                  }}>
                    Cancel
                  </Button>
                </>
              )
            ) : (
              <span style={{ color: '#aaa' }}>All students have this</span>
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
        dataSource={accommodationList} 
        loading={userLoading || accommodationsLoading} 
        onChange={handleChange}
        rowClassName={getRowClassName}
      />
    </>
  );
};

export {AccommodationListTable};
