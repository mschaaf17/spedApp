//only person accessing student profile will be the teacher
import React, {useState} from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import {useQuery, useMutation} from '@apollo/client'
import {ADD_INTERVENTION_TO_STUDENT, REMOVE_INTERVENTION_FROM_STUDENT, REMOVE_INTERVENTION, ADD_INTERVENTION_TEMPLATE} from '../../../utils/mutations'
import {QUERY_USER, QUERY_ME,  QUERY_INTERVENTION_TEMPLATES} from '../../../utils/queries'
import Auth from '../../../utils/auth'
import NavigationLinks from '../../../components/SideNavigationLinks'
import './index.css'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Modal, Button } from 'react-bootstrap';
import InterventionDataTable from '../../../components/Tables/GeneralTables/interventionListTable';
import AddNewIntervention from '../../../components/AddNewIntervention/AddNewIntervention';
export default function InterventionsTab() {

  const { username: userParam } = useParams()
// const {loading, data} = useQuery(QUERY_USER, {
//   variables: {username: userParam}
// })
const [formError, setFormError] = useState("");
const [selectedIntervention, setSelectedIntervention] = useState("");
const [showConfirmationModal, setShowConfirmationModal] = useState(false);
const [showSummaryModal, setShowSummaryModal] = useState(false);
const [selectedSummary, setSelectedSummary] = useState('');
const [selectedHardcodedIntervention, setSelectedHardcodedIntervention] = useState(null);

const [addedIntervention, setAddedIntervention] = useState([]);
const [isAddInterventionOpen, setAddInterventionOpen] = useState(false);

const { loading, data } = useQuery(QUERY_ME)



const user = data?.me || data?.user || {};


const { loading: interventionsLoading, data: interventions } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
  variables: { isTemplate: true, isActive: true }
});
console.log(interventions?.interventionList, "raw interventionList");
interventions?.interventionList?.forEach(i => console.log(i.isTemplate, typeof i.isTemplate));
const interventionList = interventions?.interventionList?.filter(
  intervention => intervention.isTemplate === true || intervention.isTemplate === "true"
) || [];
console.log(interventionList, "filtered interventionList")

// console.log(user.username + username)
const [addInterventionToList, {error}] = useMutation(
  ADD_INTERVENTION_TEMPLATE
);

const [removeInterventionFromList] = useMutation(
  REMOVE_INTERVENTION
);


const removeIntervention = async (interventionId) => {
  setSelectedIntervention(interventionId)
  setShowConfirmationModal(true);

}


const handleDeleteConfirmation = async () => {
  try {
      await removeInterventionFromList({
          variables: { id: selectedIntervention},
          refetchQueries: [
              {query: QUERY_INTERVENTION_TEMPLATES, variables: {username: user.username}},
              {query: QUERY_ME, variables: {username: user.username}}
          ]
      })
      
  } catch (e) {
      console.log(e)
  }
  setShowConfirmationModal(false)
  setSelectedIntervention(null)
  console.log('Intervention has been removed')
}

const handleCancelConfirmation = () => {
  setShowConfirmationModal(false)
  setSelectedIntervention(null)
}

const handleShowSummaryModal = summary => {
  setSelectedSummary(summary)
  setShowSummaryModal(true)
}

const handleHideSummaryModal = () => {
  setShowSummaryModal(false)
}

const handleUpdateInterventionData = (newData) => {
  setAddedIntervention(newData);
};

const addIntervention = async (event) => {
  event.preventDefault();
  const title = event.target.elements.title.value;
  const summary = event.target.elements.summary.value;

  if (!selectedIntervention || !title || !summary) {
    setFormError("Please fill in all the fields.");
    return;
  }

  try {
    await addInterventionToList({
      variables: {
        title,
        summary,
        function: selectedIntervention,
        isTemplate: true,
        isActive: true,
      },
      refetchQueries: [
        { query: QUERY_INTERVENTION_TEMPLATES, variables: { username: user.username}},
        { query: QUERY_ME, variables: { username: user.username } },
      ],
    });
    const newIntervention = {
      type: selectedIntervention,
      title: title,
      summary: summary,
    };
    setAddedIntervention((prevAddedInterventions) => [...prevAddedInterventions, newIntervention]);
  } catch (e) {
    console.log(e);
  }

  event.target.reset();
  setSelectedIntervention('');
  setFormError("");
  console.log('Intervention has been added');
};


const isInterventionAdded = (title) => {
  const isAdded = addedIntervention[title] || interventionList.some((intervention) => intervention.function === title);
  console.log(`Intervention title: ${title}, Is Added: ${isAdded}`);
  return isAdded;
};
const getHardcodedInterventionSummary = (intervention) => {
  switch (intervention) {
    case 'Scheduled Breaks':
      return 'Summary explaining about the scheduled breaks';
    // Add more cases for other hardcoded interventions
    default:
      return '';
  }
};


if (loading) {
  return <div className='loader'>Loading...</div>;
}

  return (
    <div>
      
      <h2 className='profile-name'>Intervention Ideas</h2>
      {!isAddInterventionOpen && (
        <Button className='generalButton' onClick={() => setAddInterventionOpen(true)}>
          Add Intervention
        </Button>
      )}
      {isAddInterventionOpen && (
        <AddNewIntervention
          onClose={() => setAddInterventionOpen(false)}
          updateInterventionData={handleUpdateInterventionData}
          interventionData={interventionList}
        />
      )}
      
      {/* Pass interventionList as a prop here */}
      <div style={{ marginBottom: 32 }}>
        <InterventionDataTable interventionList={interventionList} />
      </div>
      
        
</div>
)
}
