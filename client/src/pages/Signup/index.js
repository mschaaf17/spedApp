import React, {useState} from 'react'
import { useMutation } from '@apollo/client'
import { ADD_USER } from '../../utils/mutations'
import { Link } from 'react-router-dom'
import './index.css'


import Auth from '../../utils/auth'

const Signup = () => {
    const [formState, setFormState] = useState({ firstName: '', lastName: '', studentSchoolId: '', username: '', password: '', isAdmin: false})
    const [addUser, {error}] = useMutation(ADD_USER)

    const handleChange = event => {
        const { name, value, type, checked } = event.target
        if (type === 'checkbox'){
          setFormState({
            ...formState,
            [name]: checked
          })
        } else {
          setFormState({
            ...formState,
            [name]: value
            
        })
    }
        }

       

    const handleFormSubmit = async event => {
        event.preventDefault()
        try{
          const {data} = await addUser({
            variables: {...formState}
          })
          Auth.login(data.addUser.token)
          window.location.href = "/loading"
          
        } catch (e) {
          console.error(e)
        }
    }

    return (
<main className="login-signup-background">
      <div className="">
        <div className="">
          <div className="login-signup-form">
            <form className="user-input" onSubmit={handleFormSubmit}>
            <h2 className="login-signup-title">Sign Up</h2>
            
            <label>First Name</label>
              <input
                className="form-input"
                placeholder="Type your first name"
                name="firstName"
                type="firstName"
                id="firstName"
                value={formState.firstName}
                onChange={handleChange}
              />

            <label>Last Name</label>
              <input
                className="form-input"
                placeholder="Type your last name"
                name="lastName"
                type="lastName"
                id="lastName"
                value={formState.lastName}
                onChange={handleChange}
              />

            <label>Student ID Number</label>
              <input
                className="form-input"
                placeholder="Type your Student ID"
                name="studentSchoolId"
                type="studentSchoolId"
                id="studentSchoolId"
                value={formState.studentSchoolId}
                onChange={handleChange}
              />

            <label>Username</label>
              <input
                className="form-input"
                placeholder="Type a username"
                name="username"
                type="username"
                id="username"
                value={formState.username}
                onChange={handleChange}
              />
                <label>Password</label>
              <input
                className="form-input"
                placeholder="******"
                name="password"
                type="password"
                id="password"
                value={formState.password}
                onChange={handleChange}
              />
             
            <div className='are-you-a-teacher'> Are you a Teacher? {" "}
              <input 
              id='admin_teacher'
              type="checkbox"
              name="isAdmin"
              label='Teacher?'
              checked ={formState.isAdmin}
              onChange={handleChange} />
              </div>

              <div className='login-signup-submit-section'>
              <button className="login-signup-submit-button" type="submit">
                Submit
              </button>
              </div>
              <div className='start-section'>
      <p className="member-check"> Already a member? {' '}
        <Link className="switch-login-signup-link " to ="/login">Login</Link>
        </p>
          </div>
            </form>
            {error && <div>Signup Failed </div>}
          </div>
        </div>
      </div>
      

    </main>
  );
}

export default Signup