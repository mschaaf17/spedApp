/*import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import RecommendIcon from '@mui/icons-material/Recommend';
import thumb from '../../assets/images/thumbs-up-solid.svg'

const AccommodationList = ({ accommodations, title }) => {
    const [style, setStyle] = useState(new Array(accommodations.length).fill(false));


    const changeStyle = (index) => {
        setStyle((prevState) => {
            const updatedStyle = [...prevState];
            updatedStyle[index] = !updatedStyle[index];
            return updatedStyle;
        });
    };
    if (!accommodations.length) {
        return <div>
            <h3>No Accommodations Available</h3>
        </div>

    }
    return (
        <div>
            <h2>Pick what you need {title}!</h2>
            <div className='accom_section'>
                {accommodations &&
                    accommodations.map((accommodation, index) => (
                        <div className="single_accom" key={accommodation._id} onClick={() => changeStyle(index)}>
                            {style[index] ? <img className="thumb" src={thumb} alt="thumbs up" /> : null}
                            <h3>{accommodation.title}</h3>
                            <img className="accomm_img" src={accommodation.image} alt="Picture of accommodation" />
                        </div>
                    ))}

            </div>
        </div>
    )
}


export default AccommodationList*/