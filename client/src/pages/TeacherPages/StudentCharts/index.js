import React, {useState, useEffect} from 'react'
import { Link, useParams } from 'react-router-dom'
import NavigationLinks from '../../../components/NavigationLinks'
import { useQuery, useMutation } from '@apollo/client';
import WeeklyData from '../../../components/StudentData/weekly'
import {QUERY_USER, QUERY_INTERVENTION_LIST, QUERY_ME} from '../../../utils/queries'
import { ADD_ACCOMMODATION_FOR_STUDENT, ADD_INTERVENTION_TO_STUDENT, REMOVE_INTERVENTION_FROM_STUDENT } from '../../../utils/mutations';
import './index.css'
import moment from 'moment';
import { Modal, Button } from 'react-bootstrap';
import OutOfSeatData from '../../../components/StudentData/outOfSeatData';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import SearchIcon from '@mui/icons-material/Search';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';


//this needs to be saved to the backend rather than local storage
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Student Charts for frequency, duration?? eloping/aggression/other?, observation form, abc data   
export default function StudentCharts() {
  const [interventionColors, setInterventionColors] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [addedInterventions, setAddedInterventions] = useState({});
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [showData, setShowData] = useState(false);
  const { username: userParam } = useParams()
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [showOutOfSeatData, setShowOutOfSeatData] = useState(false);
    const [showBreakData, setShowBreakData] = useState(false);

  useEffect(() => {
    // Retrieve intervention colors from local storage on component mount
    const storedInterventionColors = localStorage.getItem('interventionColors');
    if (storedInterventionColors) {
      setInterventionColors(JSON.parse(storedInterventionColors));
    }
  }, []);

  useEffect(() => {
    // Save intervention colors to local storage whenever it changes
    localStorage.setItem('interventionColors', JSON.stringify(interventionColors));
  }, [interventionColors]);


  //issue is that we need ot query who is logged in not userparem
  const {data} = useQuery(QUERY_USER, {
    variables: {username: userParam}
  });
  const {data: me} = useQuery(QUERY_ME)

  const user = data?.user || {};
  console.log(me?.me.username)

const { loading: interventionsLoading, data: interventions, error: interventionsError } = useQuery(QUERY_INTERVENTION_LIST, {
  variables: { username: me?.me.username },
});
const interventionListFromTeacher = interventions?.interventionList || [];
console.log(interventions?.interventionList)
console.log(interventionListFromTeacher)

const [addInterventionToStudent, {error}] = useMutation(
 ADD_INTERVENTION_TO_STUDENT 
)

const [removeInterventionFromStudentList] = useMutation(
  REMOVE_INTERVENTION_FROM_STUDENT
)

//when adding intervention a modal must display with a dropdown
//or search bar to pick from 

const addIntervention = async (parameterInterventionId) => {
  try {
    await addInterventionToStudent({
      variables: { username: userParam, interventionId: parameterInterventionId },
      refetchQueries: [
        {query: QUERY_INTERVENTION_LIST, variables: {username: me?.me.username}},
        {query: QUERY_USER, variables: {username: userParam}}
    ]
})
    // await addInterventionToStudent({
    //   variables: {title, username, functions, summary}
    // })
    setAddedInterventions((prevAddedInterventions) => ({
      ...prevAddedInterventions,
      [parameterInterventionId]: !prevAddedInterventions[parameterInterventionId]
    }))
    setInterventionColors((prevColors) => ({
      ...prevColors,
      [parameterInterventionId]: getRandomColor()
    }));
  } catch (e) {
    console.log(e)
  }
  console.log('intervention has been added to the list')
}

const removeIntervention = async (interventionId) => {
  setSelectedIntervention(interventionId)
  setShowConfirmationModal(true);
}
const handleDeleteConfirmation = async () => {
  try {
      await removeInterventionFromStudentList({
          variables: {username: userParam, interventionId: selectedIntervention},
          refetchQueries: [
            {query: QUERY_INTERVENTION_LIST, variables: {username: me?.me.username}},
              {query: QUERY_USER, variables: {username: userParam}}
          ]
      })
      
  } catch (e) {
      console.log(e)
  }
  setShowConfirmationModal(false)
  setSelectedIntervention(null)
  console.log('intervention has been removed')
}

const handleCancelConfirmation = () => {
  setShowConfirmationModal(false)
  setSelectedIntervention(null)
}

  const outOfSeat = user.outOfSeat
  const outOfSeatTotalCount = user.outOfSeatCount
  const outOfSeatByDay = data?.user?.outOfSeatCountByDayVirtual
 
 
  const breakCount = user.breakCount || {}
  console.log(breakCount)
  const breaks = user.breaks || {}
  console.log(breaks)
  const breakDates = breaks.createdAt || []
  

  const getTodayCount = () => {
    const today = new Date().toISOString().split('T')[0]; 

    const todayData = outOfSeatByDay.find((data) => {
      const dataDate = new Date(data.createdAt).toISOString().split('T')[0]; 
      console.log("todays date " + today)
      console.log("data.createdAt is returning: " + dataDate)
      return dataDate === today; 
    });
    console.log(todayData ? todayData.count : 0);
    return todayData ? todayData.count : 0;
  }
  const handleFilter = (e) => {
    const searchWord = e.target.value
    const newFilter = interventionListFromTeacher.filter((int) => {
     const title = int.title || ''; // Null check
     return (
       title.toLowerCase().includes(searchWord.toLowerCase()) 
       //&& all interventions plus the ones queries by me?
     );
   });
   
    if (searchWord === "") {
     setFilteredData([]);
    }
    else{
     setFilteredData(newFilter)
    }
  }
  console.log(data?.user.userInterventions)
  const isInterventionAdded = (parameterInterventionId) => {
    return addedInterventions[parameterInterventionId] || data?.user.userInterventions?.some(
      (intervention) => intervention._id === parameterInterventionId
    );
  };

  const displayInterventionList = (intervention) => {
    //need a filter by type or search bar?
    switch (intervention) {
      case 'Scheduled Breaks':
        return 'Summary explaining about the scheduled breaks';
      // Add more cases for other hardcoded interventions
      default:
        return '';
    }
  };

  const handlePrintClick = () => {
    setPdfGenerating(true);
    //http://localhost:3000/generate-pdf?url=http://localhost:3000/studentProfile/henry.com/studentCharts
   // http://localhost:3000/studentProfile/henry.com/studentCharts
    //const url = `/generate-pdf?url=${encodeURIComponent(window.location.href)}`;
    const url = 'http://localhost:3001/generate-pdf?url=' + encodeURIComponent('http://localhost:3000/studentProfile/' + userParam + '/studentCharts');
   // const url = 'https://inclusion-student-app-351765654f70.herokuapp.com/generate-pdf?url=' + encodeURIComponent('https://inclusion-student-app-351765654f70.herokuapp.com/studentProfile/' + userParam + '/studentCharts');
    console.log(url);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setPdfGenerating(false);
      });
    } else {
      setPdfGenerating(false);
      console.error('Error opening print window.');
    }
  };
  
  const handleClick = () => {
      setShowData(!showData);
  
    };

    const handleOutOfSeatClick = () => {
        setShowOutOfSeatData(!showOutOfSeatData)
    }
    const handleBreakClick = () => {
        setShowBreakData(!showBreakData)
    }
  
  return (
    <>
    <div>

   
      <div>
        <button><Link to ={`/studentProfile/${userParam}/studentCharts/additionalStudentInfo`}>Provide more Information on {userParam}</Link></button>
        {/* this button should be similar to a bip or the questionairre for student behavior such as a FBA */}
      <h2>Viewing Charts and Data for {userParam}</h2>
     
        <div className = "data-to-click">
                      <button className='logout' onClick={handleClick}>Frequency</button>
                      
                      {showData && breakCount >= 1 && (
                          <>
                              <button onClick={() => handleBreakClick()}> Breaks </button>
                          </>
                            )}
    {showBreakData && breakCount >= 1 && (
      <>
      <div>
       <div>
      <h4>Today's Break Count: </h4>
      <h4>Average Daily Break Count:</h4>
      <h4>Total Break Count: {breakCount}</h4>
      {/* move data out of chart and onto this page */}
      </div> 
      <WeeklyData  
      totalBreaks = {breakCount}
      userBreaks = {breaks}
      breakDates= {breakDates}
      />
      </div>
      </>
      
                      )}
                      {showData && outOfSeatTotalCount >= 1 && (
                          <>
                              <button onClick={() => handleOutOfSeatClick()}>Out Of Seat</button>
                          </>
                        )}
                       
                      {showOutOfSeatData && outOfSeatTotalCount >= 1 && (
                          <>
                             
      <div className='graph_flex' >

        <div className=''>
          <h3 className='center_only'>Key</h3>
          <div className='margin_auto border_solid'>
            <button className='logout'onClick={() => setSelectedIntervention('Scheduled Breaks')}>Add Intervention</button>
            {/* after clicking add intervention a modal with a list of all the interventions 
            should be display to click on -- once clicked it needs to add to this students user model
            of interventions.. and display in the key as a list with a specific color to match the graph line
             everytime an intervention is added a new line on the graph needs to be created-- 
             will need to add interventions for the student on the backend*/}
            <div>
            {data?.user.userInterventions.length > 0 ? (
    <ul>
      {data.user.userInterventions.map((userInt, index) => {
        const isAdded = isInterventionAdded(userInt._id);
        const interventionStyle = {
          color: interventionColors[userInt._id] || 'black'
        };
        return (
          <li key={index}>
            <p
              className={isAdded ? 'added-intervention' : ''}
              style={interventionStyle}
            >
              {userInt.title}
              <DeleteForeverIcon onClick={() => removeIntervention(userInt._id)} />
            </p>
          </li>
        );
      })}
    </ul>
  ) : (
    <p>No Interventions for this student</p>
  )}
           
          </div>
          </div>
           </div>


      <OutOfSeatData
       outOfSeatByDay = {outOfSeatByDay}
      />
      <div className=''>
        <h3 className='center_only'>Out of Seat Information:</h3>

      <div className='border_solid'>
      <h4 className='center_only'>Today's Count: {getTodayCount()}</h4>
      <h4 className='center_only'>Average Daily Count: {Math.round(user.averageOutOfSeatCount)} </h4>
      <h4 className='center_only'>Total Count: {outOfSeatTotalCount}</h4>
      </div>

      <div className='border_solid'>
      <h4 className='center_only'>Dates/Times: </h4>
      {Object.values(outOfSeat && outOfSeat).map((amount, index) => {
  const createdAtTimestamp = parseInt(amount.createdAt);
  const createdAtDate = new Date(createdAtTimestamp);

  // Check if createdAtDate is a valid date before formatting
  const formattedDate = moment(createdAtDate).format('MMMM Do, YYYY [at] h:mma');

      return (
        <div key={index}>
         <p className='center_only'>{formattedDate}</p>
        </div>
       );
    })}
   
   </div>

         </div>
         </div>
            </>
           )}
   

      <button className='logout'>Duration</button>
      {/* duration data should be a pie chart with off or on task comparted to class time
      and a bar chart */}
      <button className='logout'>Contract</button>
      {/* line graph */}
      <button className='logout'>ABC</button>
      {/* will be a comprized list of 
       function of behavior, targeted struggle times, frequency consequences, and
       antecendent behaviors-- all based on abc logging */}
      </div>
        </div>
        {selectedIntervention && !showConfirmationModal && (
  <Modal show={true} onHide={() => setSelectedIntervention(null)}>
    <Modal.Header closeButton>
      <Modal.Title>Add Intervention</Modal.Title>
    </Modal.Header>
    <Modal.Body>
    <div className = "search"> 
            <div className="searchInputs">
                <input type ="text" placeholder = 'Search Intervention' onChange={handleFilter}></input>
                <div className="searchIcon"><SearchIcon/></div>
            </div>

            
            <div className='user_list'> 
           {filteredData.length !=0 && (
            <div className="dataResult each_student">
              
                {filteredData.map((int, index)=>{
                    return (
                        <p key ={index}>               
                <p className= 'center' onClick={() => addIntervention(int._id, int.username)}>
                {int.title}
                 {isInterventionAdded(int._id) ? (
                    <BookmarkAddedIcon />
                  ) : (
                <AddIcon />
                 )}
                 </p>
                        </p>
                    )
                })}
                </div>
            )}
            </div>
            </div>
 
    
    
    
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setSelectedIntervention(null)}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
)}

{showConfirmationModal && (
        <Modal show={showConfirmationModal} onHide={handleCancelConfirmation}>
          <Modal.Header closeButton>
            <Modal.Title >Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this intervention from this list?</Modal.Body>
          <Modal.Footer>
            <Button className='modal-cancel' variant='secondary' onClick={handleCancelConfirmation}>
              Cancel
            </Button>
            <Button className = 'modal-delete' variant='danger' onClick={handleDeleteConfirmation}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

        <div className='print_data'>
        <button
      className="logout"
      disabled={pdfGenerating}
      onClick={handlePrintClick}
    >
        Print Student Data</button>

        </div>


      <div>
        Intervention Suggestions:
        {/* if data point is three points above the aimline offer differnt intervention suggestion?? */}
      </div>
      <div className="view-other-pages"> <Link className="link-to-page logout" to ={`/teacherdata/${userParam}`}> ← Back to Student List</Link></div>
    </div>
    </>
  )
}
