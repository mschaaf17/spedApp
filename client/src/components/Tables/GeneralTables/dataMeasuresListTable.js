import React, { useEffect, useState } from 'react'; 
import { Button, Space, Table, Select, Modal } from 'antd';
import { useQuery } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_STUDENT_LIST } from '../../../utils/queries';
import SearchIcon from '@mui/icons-material/Search';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SaveIcon from '@mui/icons-material/Save';





const DataMeasureTable = ({loading, mergedData, meData, selectedDataMeasureId, onDataMeasureClick, submitDataMeasureForStudent, selectedStudent, setSelectedStudent, handleDelete}) => {

  const { loading: loadingMe, error, data: frequencyData } = useQuery(QUERY_FREQUENCY_LIST); 
  const [filteredData, setFilteredData] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectOptions, setSelectOptions] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const capitalizeInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };


  useEffect(() => {
    console.log('meData:', meData);
    console.log('selectedDataMeasureId:', selectedDataMeasureId);
    console.log('mergedData:', mergedData);
    console.log('frequencyData:', frequencyData);

    if (meData && selectedDataMeasureId && mergedData) {
      // Find the selected data measure (template) by ID
      const selectedTemplate = mergedData.find(
        (template) => template._id === selectedDataMeasureId
      );
      console.log('selectedTemplate:', selectedTemplate);

      if (!selectedTemplate) {
        setSelectOptions([]);
        return;
      }
     
      // Only include students who do NOT already have this template assigned
      const options = (meData.students || [])
        .filter(student =>
          !((student.behaviorFrequencies || [])
            .filter(freq => freq.isActive)
            .some(freq =>
              freq.behaviorTitle.trim().toLowerCase() === selectedTemplate.behaviorTitle.trim().toLowerCase()
            ))
        )
        .map(student => ({
          value: student._id,
          label: `${student.lastName}, ${student.firstName} (${student.studentSchoolId})`
        }));

      console.log('Dropdown options:', options);
      setSelectOptions(options);

      (meData.students || []).forEach(student => {
        const hasActive = (student.behaviorFrequencies || [])
          .filter(freq => freq.isActive)
          .some(freq =>
            freq.behaviorTitle.trim().toLowerCase() === selectedTemplate.behaviorTitle.trim().toLowerCase()
          );
        console.log(`${student.firstName} ${student.lastName}: hasActive=${hasActive}`);
      });
    }
  }, [meData, selectedDataMeasureId, mergedData]);

  useEffect(()=> {
    setFilteredInfo({});
    setSortedInfo({});
  }, [mergedData])

const handleSaveDataMeasureToStudent = () => {
  if (!selectedStudent || !selectedDataMeasureId) {
    console.error('Selected student or data measure ID is missing.');
    return;
  }
  
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

  const getSelectOptionsForRow = (record) => {
    if (!meData || !meData.students) return [];
    return meData.students
      .filter(student =>
        !(student.behaviorFrequencies || [])
          .filter(freq => freq.isActive)
          .some(freq => freq.behaviorTitle === record.behaviorTitle)
      )
      .map(student => ({
        value: student._id,
        label: `${student.lastName}, ${student.firstName} (${student.studentSchoolId})`
      }));
  };

  const confirmDelete = (record) => {
    setDeleteRecord(record);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (deleteRecord) {
      handleDelete(deleteRecord);
    }
    setDeleteModalVisible(false);
    setDeleteRecord(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteRecord(null);
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
        render: (text, record) => {
          const optionsForRow = getSelectOptionsForRow(record);
          return (
            <Space>
              {optionsForRow.length > 0 && visibleSelectRowId !== record._id && (
                <div className='tooltip' onClick={() => displaySelect(record._id)}>
                  <PersonAddAlt1Icon className='icons'/>
                  <span className='tooltipText'>Add to student</span>
                </div>
              )}
              {optionsForRow.length === 0 && (
                <div className='tooltip'>
                  <PersonAddAlt1Icon className='icons' style={{ opacity: 0.3, pointerEvents: 'none' }}/>
                  <span className='tooltipText'>No students available</span>
                </div>
              )}
              {visibleSelectRowId === record._id && (
                <>
                  <Select
                    onClick={() => onDataMeasureClick(record._id)}
                    onChange={(value) => setSelectedStudent(value)}
                    value={selectedStudent}
                    showSearch
                    style={{ width: 200 }}
                    placeholder="Search to Select"
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option?.label.toLowerCase().includes(input.toLowerCase())
                    }
                    filterSort={(optionA, optionB) =>
                      optionA.label.toLowerCase().localeCompare(optionB.label.toLowerCase())
                    }
                    options={optionsForRow}
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
                <DeleteForeverIcon danger className="deleteIcon" onClick={() => confirmDelete(record)}/>
                <span className='tooltipText'>Remove data measure from list</span>
              </div>
            </Space>
          );
        }
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
      <Modal
        title={`Are you sure you want to delete "${deleteRecord?.behaviorTitle}"?`}
        visible={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Yes"
        cancelText="Cancel"
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  );
};


export { DataMeasureTable };
