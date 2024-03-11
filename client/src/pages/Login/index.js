import React, {useState, userParam} from 'react'
import {Link} from 'react-router-dom'
import {useMutation, useQuery} from '@apollo/client'
import {QUERY_ME} from '../../utils/queries'
import { LOGIN_USER } from '../../utils/mutations'
import Auth from '../../utils/auth'
import './index.css'

const Login = props => {
  // const { username: userParam } = useParams()
    const [formState, setFormState] = useState({ username: '', password: ''})
    const [login, {error}] = useMutation(LOGIN_USER)
    const {loading, data} = useQuery(QUERY_ME)
    const admin = data?.me.isAdmin
    console.log(data)
  
    if (loading) {
      return <div className='loader'>Loading...</div>;
    }

    // update state based on form input changes
    const handleChange = event => {
        const {name, value} = event.target
        
        setFormState({
            ...formState,
            [name]: value
        })
    }
    
    const handleFormSubmit = async event => {
      event.preventDefault();
      try {
        const { data } = await login({
          variables: { ...formState },
        });
        Auth.login(data.login.token);
        window.location.href = "/loading";
        
      } catch (e) {
        console.log(e);
      }
      
      // Clear form values
      setFormState({
        username: "",
        password: ""
      });
    };


    
    return (
        <main className="login-signup-background">
      <div className="">
          <div className="login-signup-form">
            <form onSubmit={handleFormSubmit}>
                <h2 className="login-signup-title">Login</h2>
                   <p className = "welcome-back">Welcome Back!</p>
              <div className="user-input">
                  <label>Username</label>
                  <input
                    className="form-input"
                    placeholder="username"
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
              </div>
              <div className='login-signup-submit-section'>
              <button className="login-signup-submit-button" type="submit">
                Submit
              </button>
              </div>
              <div className=''>
      <p className="member-check"> Not yet a member? {' '}
        <Link className="switch-login-signup-link " to ="/signup">Create an account</Link>
        </p>
          </div>
            </form>
            {error && <div>Login failed</div>}
          </div>
      </div>
    </main>
    )
}

export default Login;