import React , {useState} from 'react';
import { useParams } from 'react-router-dom';
import { QUERY_ACCOMMODATION_CARDS } from '../../utils/queries';
import { useQuery } from '@apollo/client';
import './index.css'
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';


const AllAccommodationCards = ({ addAccommodation,
  isAccommodationAdded, addedAccommodation}) => {
   
    
    const { loading, data } = useQuery(QUERY_ACCOMMODATION_CARDS);
    const accommodationCards = data?.accommodationCards || [];

    console.log(accommodationCards)
   

  return (
    <div>
<h3 className='center_only'>Select Accommodations From list</h3>
<div className=''>
    
        { accommodationCards && accommodationCards.map((accommodation, index) => (
            <div  className='center_only' key={`accommodation_${accommodation._id || index}`}onClick={()=> addAccommodation(accommodation._id, accommodation.title, accommodation.image)}>
              <div className='each_student '>
              <div className='center_only'>{accommodation.title}</div>
              <p className='small-image' src={accommodation.image} />
              <div className='center'>
              {isAccommodationAdded(accommodation.title) ? (
                    <BookmarkAddedIcon  />
                  ) : ( 
                <AddIcon className='center' />
                 )}
                 </div>
                 </div>
            </div>
          ))}
      </div>
  
    </div>
  );
};

export default AllAccommodationCards;
