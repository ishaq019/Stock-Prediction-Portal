import React, {useState} from 'react'
import axiosInstance from '../axiosInstance'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegistration = async (e) =>{
    e.preventDefault();
    setLoading(true);
    setErrors({})
    setSuccess(false)
    
    const userData = {
      username, email, password
    }
    
    try{
      const response = await axiosInstance.post('/register/', userData)
      setErrors({})
      setSuccess(true)
      setUsername('')
      setEmail('')
      setPassword('')
    }catch(error){
      if (error.response) {
        const data = error.response.data
        if (typeof data === 'string' || error.response.status >= 500) {
          setErrors({ general: 'Server error. Please try again later.' })
        } else {
          setErrors(data)
        }
      } else {
        setErrors({ general: 'Network error. Please check your connection.' })
      }
      console.error('Registration error:', error)
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
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                    Create Account
                </h3>
                <form onSubmit={handleRegistration}>
                  <div className='mb-3'>
                    <label className='form-label text-secondary'>Username</label>
                    <input type="text" className='form-control' placeholder='Choose a username' autoComplete='username' value={username} onChange={(e) => setUsername(e.target.value)} required />
                    {errors.username && <small className='text-danger'>{errors.username}</small>}
                  </div>
                    <div className='mb-3'>
                      <label className='form-label text-secondary'>Email</label>
                      <input type="email" className='form-control' placeholder='Enter your email' value={email} onChange={(e) => setEmail(e.target.value)} required />
                      {errors.email && <small className='text-danger'>{errors.email}</small>}
                    </div>
                    
                    <div className='mb-3'>
                    <label className='form-label text-secondary'>Password</label>
                    <input type="password" className='form-control' placeholder='Minimum 8 characters' autoComplete='new-password' value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {errors.password && <small className='text-danger'>{errors.password}</small>}
                    </div>
                    {errors.general && <div className='alert alert-danger py-2'>{errors.general}</div>}
                    {success && (
                        <div className='alert alert-success py-2'>
                            Registration successful! <Link to='/login' className='alert-link'>Login here</Link>
                        </div>
                    )}
                    {loading ? (
                      <button type='submit' className='btn btn-info d-block w-100' disabled><FontAwesomeIcon icon={faSpinner} spin /> Creating account...</button>
                    ) : (
                      <button type='submit' className='btn btn-info d-block w-100'>Register</button>
                    )}

                    <p className='text-secondary text-center mt-3 mb-0'>Already have an account? <Link to='/login' className='text-info'>Login here</Link></p>
                    
                </form>
            </div>
        </div>
    </div>
    </>
  )
}

export default Register