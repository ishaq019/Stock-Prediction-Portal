import React from 'react'
import Button from './Button'

const NotFound = () => {
  return (
    <div className='container'>
        <div className="row justify-content-center">
            <div className="col-md-6 text-center py-5">
                <h1 className='text-info display-1 fw-bold'>404</h1>
                <h3 className='text-light mb-3'>Page Not Found</h3>
                <p className='text-secondary mb-4'>The page you're looking for doesn't exist or has been moved.</p>
                <Button text="Go Home" class="btn-info" url="/" />
            </div>
        </div>
    </div>
  )
}

export default NotFound
