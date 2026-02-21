import React, {useContext, useState} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faSignInAlt } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '../axiosInstance'
import {useNavigate, Link} from 'react-router-dom'
import { AuthContext } from '../AuthProvider'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const {isLoggedIn, setIsLoggedIn} = useContext(AuthContext)

  const handleLogin = async (e) =>{
    e.preventDefault();
    setLoading(true);
    setError('');

    const userData = {username, password}

    try{
      const response = await axiosInstance.post('/token/', userData)
      localStorage.setItem('accessToken', response.data.access)
      localStorage.setItem('refreshToken', response.data.refresh)
      setIsLoggedIn(true)
      navigate('/dashboard')
    }catch(error){
      if (error.response) {
        if (error.response.status === 401) {
          setError('Invalid username or password.')
        } else if (error.response.status >= 500) {
          setError('Server error. Please try again later.')
        } else if (error.response.data?.detail) {
          setError(error.response.data.detail)
        } else {
          setError('Login failed. Please try again.')
        }
      } else {
        setError('Network error. Please check your connection.')
      }
      console.error('Login error:', error)
    }finally{
      setLoading(false)
    }
  }
  

  return (
    <>
    <div className='container'>
        <div className="row justify-content-center">
            <div className="col-md-5 bg-light-dark p-5 rounded">
                <h3 className='text-light text-center mb-4'>
                    <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
                    Login
                </h3>
                <form onSubmit={handleLogin}>
                  <div className='mb-3'>
                    <label className='form-label text-secondary'>Username</label>
                    <input type="text" className='form-control' placeholder='Enter your username' autoComplete='username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </div>
                    
                    <div className='mb-3'>
                    <label className='form-label text-secondary'>Password</label>
                    <input type="password" className='form-control' placeholder='Enter your password' autoComplete='current-password' value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    
                    {error && <div className='alert alert-danger py-2'>{error}</div> }

                    {loading ? (
                      <button type='submit' className='btn btn-info d-block w-100' disabled><FontAwesomeIcon icon={faSpinner} spin /> Logging in...</button>
                    ) : (
                      <button type='submit' className='btn btn-info d-block w-100'>Login</button>
                    )}

                    <p className='text-secondary text-center mt-3 mb-0'>Don't have an account? <Link to='/register' className='text-info'>Register here</Link></p>
                    
                </form>
            </div>
        </div>
    </div>
    </>
  )
}

export default Login