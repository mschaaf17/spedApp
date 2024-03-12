import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import AccessAlarmOutlinedIcon from '@mui/icons-material/AccessAlarmOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined';
import Header from '../../components/Header';

export default function Home() {
    useEffect(() => {
        // Function to switch to the next slide
        function nextSlide() {
            const currentSlide = document.querySelector('input[name="frame"]:checked');
            if (currentSlide.nextElementSibling) {
                currentSlide.nextElementSibling.checked = true;
            } else {
                document.querySelector('input[name="frame"]:first-child').checked = true;
            }
        }

        // Interval for automatic slide transition (change slide every 5 seconds)
        let slideInterval = setInterval(nextSlide, 5000);

        // Function to stop the slide interval when the user interacts with the slider manually
        function stopSlideInterval() {
            clearInterval(slideInterval);
        }

        // Add event listeners to the slider controls to stop the automatic slide transition when the user interacts with them
        const sliderControls = document.querySelectorAll('#controls label, #bullets label');
        sliderControls.forEach(control => {
            control.addEventListener('click', stopSlideInterval);
        });

        // Clear the interval when the component is unmounted to prevent memory leaks
        return () => {
            clearInterval(slideInterval);
        };
    }, []); // Empty dependency array ensures that this effect runs only once after the component mounts

    return (
        <div id="frame">
            <input type="radio" name="frame" id="frame1" checked />
            <input type="radio" name="frame" id="frame2" />
            <input type="radio" name="frame" id="frame3" />
            <input type="radio" name="frame" id="frame4" />
            <div id="slides">
                <div id="overflow">
                    <div className="inner">
                        <div className="frame frame_1">
                            <div className="frame-content">
                                <h2>Support students with ease</h2>
                            </div>
                        </div>
                        <div className="frame frame_2">
                            <div className="frame-content">
                                <h2>Provide data driven results</h2>
                            </div>
                        </div>
                        <div className="frame frame_3">
                            <div className="frame-content">
                                <h2>Increase inclusion across classrooms</h2>
                            </div>
                        </div>
                        <div className="frame frame_4">
                            <div className="frame-content">
                                <h2>Students monitor their own progress</h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="controls">
                <label htmlFor="frame1"></label>
                <label htmlFor="frame2"></label>
                <label htmlFor="frame3"></label>
                <label htmlFor="frame4"></label>
            </div>
            <div id="bullets">
                <label htmlFor="frame1"></label>
                <label htmlFor="frame2"></label>
                <label htmlFor="frame3"></label>
                <label htmlFor="frame4"></label>
            </div>

            <div className='container-flex-items'>
          <div className='home-icon'>
            <AccessAlarmOutlinedIcon style={{ fontSize: '7rem' }} />
             </div>
             <div className='home-icon'>
               <TrendingUpOutlinedIcon style={{ fontSize: '7rem' }}/>
             </div>
             <div className='home-icon'>
               <AddTaskOutlinedIcon style={{ fontSize: '7rem' }}/>
             </div>
         </div>
        </div>
    );
}
{/* <p className="">Not a member? {'  '}
        <Link className="" to ="/signup">Sign up</Link>
        </p> */}