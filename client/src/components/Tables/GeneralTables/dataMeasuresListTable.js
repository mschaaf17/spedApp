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
        .filter(student => {
          if (selectedTemplate.__typename === 'Frequency') {
            // Exclude students who already have this frequency assigned
            return !((student.behaviorFrequencies || [])
              .filter(freq => freq.isActive)
              .some(freq =>
                (freq.templateId || freq._id) === selectedTemplate._id
              ));
          } else if (selectedTemplate.__typename === 'Duration') {
            // Exclude students who already have this duration assigned
            return !((student.behaviorDurations || [])
              .filter(dur => dur.isActive)
              .some(dur =>
                (dur.templateId || dur._id) === selectedTemplate._id
              ));
          } 
          return true;
        })
        .map(student => ({
          value: student._id,
          label: `${student.lastName}, ${student.firstName} (${student.studentSchoolId})`
        }));

      console.log('Dropdown options:', options);
      setSelectOptions(options);

      (meData.students || []).forEach(student => {
        let hasActive = false;
        if (selectedTemplate.__typename === 'Frequency') {
          hasActive = (student.behaviorFrequencies || [])
            .filter(freq => freq.isActive)
            .some(freq =>
              (freq.templateId || freq._id) === selectedTemplate._id
            );
        } else if (selectedTemplate.__typename === 'Duration') {
          hasActive = (student.behaviorDurations || [])
            .filter(dur => dur.isActive)
            .some(dur =>
              (dur.templateId || dur._id) === selectedTemplate._id
            );
        } 
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
    
    const values = [...new Set(mergedData.map(data => {
      if (key === 'behaviorTitle') {
        return data.behaviorTitle || data.name || '';
      } else if (key === 'operationalDefinition') {
        return data.operationalDefinition || data.description || '';
      } else if (key === 'dataMeasureType') {
        if (data.__typename === 'Frequency') return 'Frequency';
        if (data.__typename === 'Duration') return 'Duration';
        
        return data.dataMeasureType || '';
      }
      return data[key] || '';
    }))];
    
    return values
      .filter(value => value !== '') // Remove empty values
      .map(value => ({
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
      .filter(student => {
        if (record.__typename === 'Frequency') {
          return !(student.behaviorFrequencies || [])
            .filter(freq => freq.isActive)
            .some(freq => (freq.templateId || freq._id) === record._id);
        } else if (record.__typename === 'Duration') {
          return !(student.behaviorDurations || [])
            .filter(dur => dur.isActive)
            .some(dur => (dur.templateId || dur._id) === record._id);
        } 
        return true;
      })
      .map(student => ({
        value: student._id,
        label: `${student.lastName}, ${student.firstName} (${student.studentSchoolId})`
      }));
  };

  // Check if any students have this data measure assigned
  const getStudentsWithDataMeasure = (record) => {
    if (!meData || !meData.students) return [];
    
    return meData.students.filter(student => {
      if (record.__typename === 'Frequency') {
        return (student.behaviorFrequencies || [])
          .filter(freq => freq.isActive)
          .some(freq => (freq.templateId || freq._id) === record._id);
      } else if (record.__typename === 'Duration') {
        return (student.behaviorDurations || [])
          .filter(dur => dur.isActive)
          .some(dur => (dur.templateId || dur._id) === record._id);
      }
      return false;
    });
  };

  const handleRemoveDataMeasure = (record) => {
    const title = record.behaviorTitle || record.name || 'this data measure';
    Modal.confirm({
      title: 'Confirm Deletion',
      content: `Are you sure you want to delete "${title}"? This action cannot be undone and will permanently remove this data measure template.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        handleDelete(record);
      },
    });
  };

  const columns = [
    {
      title: 'Data Measure Title',
      dataIndex: 'behaviorTitle',
      key: 'behaviorTitle',
      filterSearch: true,
      filters: generateFilters('behaviorTitle'),
      filteredValue: filteredInfo.behaviorTitle || null,
      onFilter: (value, record) => {
        const title = record.behaviorTitle || record.name || '';
        return title.trim().toLowerCase().includes(value.trim().toLowerCase());
      },
      sorter: (a, b) => {
        const titleA = a.behaviorTitle || a.name || '';
        const titleB = b.behaviorTitle || b.name || '';
        return titleA.length - titleB.length;
      },
      sortOrder: sortedInfo.columnKey === 'behaviorTitle' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text, record) => {
        const title = record.behaviorTitle || record.name || '';
        return (
          <span style={{ textTransform: 'capitalize' }}>{title}</span>
        );
      }
      
    },
    {
      title: 'Data Measure Type',
      dataIndex: 'dataMeasureType',
      key: 'dataMeasureType',
      filterSearch: true,
      filters: generateFilters('dataMeasureType'),
      filteredValue: filteredInfo.dataMeasureType || null,
      onFilter: (value, record) => {
        const type = record.dataMeasureType || record.__typename || '';
        return type.trim().toLowerCase().includes(value.trim().toLowerCase());
      },
      sorter: (a, b) => {
        const typeA = a.dataMeasureType || a.__typename || '';
        const typeB = b.dataMeasureType || b.__typename || '';
        return typeA.localeCompare(typeB);
      },
      sortOrder: sortedInfo.columnKey === 'dataMeasureType' ? sortedInfo.order : null,
      ellipsis: true,
      render: (_, record) => {
        if (record.__typename === 'Frequency') return 'Frequency';
        if (record.__typename === 'Duration') return 'Duration';
       
        return record.dataMeasureType || 'Unknown';
      }
    },
    {
      title: 'Operational Definition',
      dataIndex: 'operationalDefinition',
      key: 'operationalDefinition',
      filterSearch: true,
      filters: generateFilters('operationalDefinition'),
      filteredValue: filteredInfo.operationalDefinition || null,
      onFilter: (value, record) => {
        const definition = record.operationalDefinition || record.description || '';
        return definition.trim().toLowerCase().includes(value.trim().toLowerCase());
      },
      sorter: (a, b) => {
        const defA = a.operationalDefinition || a.description || '';
        const defB = b.operationalDefinition || b.description || '';
        return defA.length - defB.length;
      },
      sortOrder: sortedInfo.columnKey === 'operationalDefinition' ? sortedInfo.order : null,
      ellipsis: true,
      render: (text, record) => {
        return record.operationalDefinition || record.description || '';
      }
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: (text, record) => {
          const optionsForRow = getSelectOptionsForRow(record);
          const studentsWithDataMeasure = getStudentsWithDataMeasure(record);
          
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
              
              {/* Remove button - only show if no students have this data measure */}
              {studentsWithDataMeasure.length === 0 && (
                <div className='tooltip'>
                  <DeleteForeverIcon 
                    danger 
                    className="deleteIcon" 
                    onClick={() => handleRemoveDataMeasure(record)}
                    title="Remove data measure (only available if no students have it assigned)"
                  />
                  <span className='tooltipText'>Remove data measure from list</span>
                </div>
              )}
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
    </>
  );
};


export default DataMeasureTable;
