import {useContext} from 'react'
import Button from './Button'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../AuthProvider'
import axiosInstance from '../axiosInstance'

const Header = () => {
  const {isLoggedIn, setIsLoggedIn} = useContext(AuthContext)
  const navigate = useNavigate();

  const handleLogout = () =>{
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsLoggedIn(false)
    // Clear default auth header
    delete axiosInstance.defaults.headers.common['Authorization']
    navigate('/login')
  }
  return (
    <>
        <nav className='navbar container pt-3 pb-3 align-items-center'>
            <Link className='navbar-brand text-light fw-bold' to="/">
                <span className="text-info">Stock</span> Prediction Portal
            </Link>

            <div>
              {isLoggedIn ? (
                <>
                <Button text='Dashboard' class="btn-info" url="/dashboard" />
                &nbsp;
                <button className='btn btn-outline-danger' onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                <Button text='Login' class="btn-outline-info" url="/login" />
                &nbsp;
                <Button text='Register' class="btn-info" url="/register" />
                </>
              )}
                
            </div>
        </nav>
    </>
  )
}

export default Header