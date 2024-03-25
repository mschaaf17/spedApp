import React, { useEffect, useState } from 'react'; 
import { Button, Space, Table, Select } from 'antd';
import { useQuery } from '@apollo/client';
import { QUERY_ME, QUERY_STUDENT_LIST } from '../../../utils/queries';
import SearchIcon from '@mui/icons-material/Search';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SaveIcon from '@mui/icons-material/Save';





const DataMeasureTable = ({loading, mergedData, meData, selectedDataMeasureId, onDataMeasureClick, submitDataMeasureForStudent, selectedStudent, setSelectedStudent}) => {

  const { loading: loadingMe, error, data } = useQuery(QUERY_ME); 
  const [filteredData, setFilteredData] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);

  const capitalizeInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  useEffect(() => {
    if (meData) {
      const options = meData.students
        .filter(student => 
          !(
            student.behaviorFrequencies && 
            student.behaviorFrequencies.some(frequency => frequency._id === selectedDataMeasureId)
          ) && 
          !(
            student.behaviorDurations && 
            student.behaviorDurations.some(duration => duration._id === selectedDataMeasureId)
          )
        )
        .map(student => ({
          value: student._id,
          label: `${capitalizeInitials(student.lastName)}, ${capitalizeInitials(student.firstName)} (${student.studentSchoolId})`
        }));
      setSelectOptions(options);
    }
  }, [meData, selectedDataMeasureId]);

  useEffect(() => {
    if (selectedStudent) {
      setSelectOptions(prevOptions => prevOptions.filter(option => option.value !== selectedStudent));
    }
  }, [selectedStudent]);

useEffect(()=> {
  setFilteredInfo({});
  setSortedInfo({});
}, [mergedData])

const handleSaveDataMeasureToStudent = () => {
  if (!selectedStudent || !selectedDataMeasureId) {
    console.error('Selected student or data measure ID is missing.');
    return;
  }
  submitDataMeasureForStudent(selectedDataMeasureId, selectedStudent);
  setSelectOptions(prevOptions => prevOptions.filter(option => option.value !== selectedStudent));

  setSelectedStudent(null)
  setVisibleSelectRowId(null)
}

const displaySelect = (rowId) => {
  setVisibleSelectRowId(rowId)
  //setSelectShowing(true)
}

  const handleChange = (pagination, filters, sorter, extra) => {
    console.log('Various parameters', pagination, filters, sorter, extra);
    setFilteredInfo(filters);
    setSortedInfo(sorter);
    //isDataMeasureAdded(extra)
  };

  // const handleRowClick = (dataId) => {
  //   addDataMeasure(dataId)
  // }

 

//change this to only the person logged in
  const generateFilters = (key) => {
    if (!mergedData) return [];
    const values = [...new Set(mergedData.map(data=> data[key]))];
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
      title: 'Data Measure Title',
      dataIndex: 'behaviorTitle',
      key: 'behaviorTitle',
      filterSearch: true,
      filters: generateFilters('behaviorTitle'),
      filteredValue: filteredInfo.behaviorTitle || null,
      onFilter: (value, record) => record.behaviorTitle.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.behaviorTitle.length - b.behaviorTitle.length,
      sortOrder: sortedInfo.columnKey === 'behaviorTitle' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
      
    },
    {
      title: 'Data Measure Type',
      dataIndex: 'dataMeasureType',
      key: 'dataMeasureType',
      filterSearch: true,
      filters: generateFilters('dataMeasureType'),
      filteredValue: filteredInfo.dataMeasureType || null,
      onFilter: (value, record) => record.dataMeasureTypetrim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.dataMeasureType - b.ldataMeasureType,
      sortOrder: sortedInfo.columnKey === 'dataMeasureType' ? sortedInfo.order : null,
      ellipsis: true,
      render: (_, record) => {
        return record.__typename === 'Frequency' ? 'Frequency' : 'Duration';
      }
    },
    {
      title: 'Operational Definition',
      dataIndex: 'operationalDefinition',
      key: 'uoperationalDefinition',
      filterSearch: true,
      filters: generateFilters('operationalDefinition'),
      filteredValue: filteredInfo.operationalDefinition || null,
      onFilter: (value, record) => record.operationalDefinition.trim().toLowerCase().includes(value.trim().toLowerCase()),
      sorter: (a, b) => a.operationalDefinition.length - b.operationalDefinition.length,
      sortOrder: sortedInfo.columnKey === 'operationalDefinition' ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: (text, record) => (
          <>
            <Space>
          {visibleSelectRowId !== record._id && (  
            <div className='tooltip' 
             onClick={() => displaySelect(record._id)}
            >
              <PersonAddAlt1Icon className='icons'/>
              <span className='tooltipText'>Add to student</span>
            </div>
           )} 
          {visibleSelectRowId === record._id && (  
            <>
              <Select
                onClick={() => onDataMeasureClick(record._id)}
                onChange={(value) => setSelectedStudent(value)}
                value={selectedStudent}
                showSearch
                style={{
                  width: 200,
                }}
                placeholder="Search to Select"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.label.toLowerCase().includes(input.toLowerCase())
                }
                filterSort={(optionA, optionB) =>
                  optionA.label.toLowerCase().localeCompare(optionB.label.toLowerCase())
                }
                options={selectOptions}
               />
              <div className='tooltip' 
              onClick={handleSaveDataMeasureToStudent}
              >
                <SaveIcon className="icons" onClick={() => submitDataMeasureForStudent(selectedDataMeasureId, selectedStudent)}/>
                <span className='tooltipText'>Save data measure for student</span>
              </div>
            </>
           )} 
          <div className='tooltip'>
            <DeleteForeverIcon danger className="deleteIcon"/>
            <span className='tooltipText'>Remove data measure from list</span>
          </div>
        </Space>
          </>
        )
    }
    

  ];
  return (
    <>

    {/* {!isAccommodationModalOpen && (
        <Button className='generalButton' onClick={openAccommodationModal}>Add Accommodation</Button>
      )}

      {isAccommodationModalOpen && <AddNewAccommodation onClose={closeAddAccommodationModal} />}
 */}


      <Space
        style={{
          marginBottom: 16,
        }}
      >
      
      </Space>
      <Table 
        columns={columns} 
        dataSource={mergedData || []}
        loading = {loading} 
        onChange={handleChange}
        // onRow={(record) => ({
        //   onClick: () => { handleRowClick(record._id) }, // Trigger addDataMeasure function when a row is clicked
        // })}
        rowClassName={getRowClassName}
        />
    </>
  );
};


export { DataMeasureTable };
