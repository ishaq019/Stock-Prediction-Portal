import React from 'react'
import Button from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine, faBrain, faChartBar } from '@fortawesome/free-solid-svg-icons'

const Main = () => {
  return (
    <>
    
    <div className="container">
        <div className='p-5 text-center bg-light-dark rounded mb-4'>
            <h1 className='text-light mb-3'>
                <FontAwesomeIcon icon={faChartLine} className="text-info me-2" />
                Stock Prediction App
            </h1>
            <p className="lead text-secondary">AI-powered stock price prediction using Long Short-Term Memory (LSTM) neural networks. Analyze historical data, moving averages, and get future price forecasts for any stock ticker.</p>
            <Button text="Get Started" class="btn-info btn-lg mt-2" url="/dashboard" />
        </div>

        <div className="row g-4 mb-5">
            <div className="col-md-4">
                <div className="bg-light-dark p-4 rounded text-center h-100">
                    <FontAwesomeIcon icon={faBrain} size="2x" className="text-info mb-3" />
                    <h5 className="text-light">LSTM Model</h5>
                    <p className="text-secondary">Powered by Keras LSTM neural network trained on historical stock data for accurate predictions.</p>
                </div>
            </div>
            <div className="col-md-4">
                <div className="bg-light-dark p-4 rounded text-center h-100">
                    <FontAwesomeIcon icon={faChartBar} size="2x" className="text-warning mb-3" />
                    <h5 className="text-light">Moving Averages</h5>
                    <p className="text-secondary">Analyze 100-day and 200-day moving averages — key indicators used by professional stock analysts.</p>
                </div>
            </div>
            <div className="col-md-4">
                <div className="bg-light-dark p-4 rounded text-center h-100">
                    <FontAwesomeIcon icon={faChartLine} size="2x" className="text-success mb-3" />
                    <h5 className="text-light">Model Evaluation</h5>
                    <p className="text-secondary">Get MSE, RMSE, and R² metrics to evaluate the prediction accuracy for your chosen stock.</p>
                </div>
            </div>
        </div>
    </div>
    
    
    </>
  )
}

export default Main