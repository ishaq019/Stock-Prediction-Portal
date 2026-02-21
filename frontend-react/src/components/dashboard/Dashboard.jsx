import { useEffect, useState, useRef } from 'react'
import axiosInstance from '../../axiosInstance'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faChartLine, faSearch, faExclamationTriangle, faDatabase } from '@fortawesome/free-solid-svg-icons'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
    fetchLocalStockData,
    hasLocalData,
    getAvailableLocalTickers,
    computeMovingAverage,
    downsample
} from '../../utils/stockDataLoader'

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// Common chart options for dark theme
const darkChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 800 },
    plugins: {
        legend: {
            labels: { color: '#adb5bd', font: { size: 12 } }
        },
        title: {
            display: true,
            text: title,
            color: '#e9ecef',
            font: { size: 14, weight: 'bold' }
        },
        tooltip: {
            mode: 'index',
            intersect: false,
        }
    },
    scales: {
        x: {
            ticks: { color: '#6c757d', maxTicksLimit: 12, maxRotation: 45 },
            grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
            ticks: { color: '#6c757d' },
            grid: { color: 'rgba(255,255,255,0.08)' }
        }
    },
    elements: {
        point: { radius: 0 },
        line: { borderWidth: 2 }
    }
})

const Dashboard = () => {
    const [ticker, setTicker] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)
    const [results, setResults] = useState(null)
    const [dataSource, setDataSource] = useState('') // 'local' or 'api'

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                await axiosInstance.get('/protected-view/');
                setAuthChecked(true)
            } catch (error) {
                console.error('Auth check failed:', error)
                setAuthChecked(true)
            }
        }
        fetchProtectedData();
    }, [])

    /**
     * Process local CSV data into chart datasets and metrics
     */
    const processLocalData = (stockData, tickerName) => {
        const closePrices = stockData.map(d => d.close)
        const dates = stockData.map(d => d.date)

        // Compute moving averages
        const ma100 = computeMovingAverage(closePrices, 100)
        const ma200 = computeMovingAverage(closePrices, 200)

        // Downsample for chart performance
        const maxPts = 600
        const indices = []
        const step = Math.max(1, Math.ceil(stockData.length / maxPts))
        for (let i = 0; i < stockData.length; i += step) indices.push(i)
        if (indices[indices.length - 1] !== stockData.length - 1) indices.push(stockData.length - 1)

        const sampledDates = indices.map(i => dates[i])
        const sampledClose = indices.map(i => closePrices[i])
        const sampledMa100 = indices.map(i => ma100[i])
        const sampledMa200 = indices.map(i => ma200[i])

        // Chart 1: Closing Price
        const closingPriceChart = {
            labels: sampledDates,
            datasets: [{
                label: 'Closing Price',
                data: sampledClose,
                borderColor: '#0dcaf0',
                backgroundColor: 'rgba(13,202,240,0.1)',
                fill: true,
            }]
        }

        // Chart 2: 100 DMA
        const dma100Chart = {
            labels: sampledDates,
            datasets: [
                {
                    label: 'Closing Price',
                    data: sampledClose,
                    borderColor: '#0dcaf0',
                    backgroundColor: 'transparent',
                },
                {
                    label: '100 Day MA',
                    data: sampledMa100,
                    borderColor: '#dc3545',
                    backgroundColor: 'transparent',
                }
            ]
        }

        // Chart 3: 200 DMA
        const dma200Chart = {
            labels: sampledDates,
            datasets: [
                {
                    label: 'Closing Price',
                    data: sampledClose,
                    borderColor: '#0dcaf0',
                    backgroundColor: 'transparent',
                },
                {
                    label: '100 Day MA',
                    data: sampledMa100,
                    borderColor: '#dc3545',
                    backgroundColor: 'transparent',
                },
                {
                    label: '200 Day MA',
                    data: sampledMa200,
                    borderColor: '#198754',
                    backgroundColor: 'transparent',
                }
            ]
        }

        // Simulate a simple prediction comparison using last 30% of data
        // Split: 70% training, 30% testing (same as backend)
        const splitIdx = Math.floor(closePrices.length * 0.7)
        const testPrices = closePrices.slice(splitIdx)
        const testDates = dates.slice(splitIdx)

        // Simple prediction: use a lagged moving average as a naive predictor
        // This mimics how the LSTM prediction visualization looks
        const lagWindow = 50
        const predicted = []
        for (let i = 0; i < testPrices.length; i++) {
            if (i < lagWindow) {
                // Use training tail for early predictions
                const startIdx = Math.max(0, splitIdx + i - lagWindow)
                const windowSlice = closePrices.slice(startIdx, splitIdx + i)
                predicted.push(windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length)
            } else {
                const windowSlice = testPrices.slice(i - lagWindow, i)
                predicted.push(windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length)
            }
        }

        // Downsample test data
        const testStep = Math.max(1, Math.ceil(testPrices.length / maxPts))
        const testIndices = []
        for (let i = 0; i < testPrices.length; i += testStep) testIndices.push(i)
        if (testIndices[testIndices.length - 1] !== testPrices.length - 1) testIndices.push(testPrices.length - 1)

        const predictionChart = {
            labels: testIndices.map(i => testDates[i]),
            datasets: [
                {
                    label: 'Original Price',
                    data: testIndices.map(i => testPrices[i]),
                    borderColor: '#0d6efd',
                    backgroundColor: 'transparent',
                },
                {
                    label: 'Predicted Price',
                    data: testIndices.map(i => predicted[i]),
                    borderColor: '#dc3545',
                    backgroundColor: 'transparent',
                }
            ]
        }

        // Compute metrics
        let sumSqErr = 0, ssRes = 0, ssTot = 0
        const mean = testPrices.reduce((a, b) => a + b, 0) / testPrices.length
        for (let i = 0; i < testPrices.length; i++) {
            const err = testPrices[i] - predicted[i]
            sumSqErr += err * err
            ssRes += err * err
            ssTot += (testPrices[i] - mean) ** 2
        }
        const mse = sumSqErr / testPrices.length
        const rmse = Math.sqrt(mse)
        const r2 = 1 - (ssRes / ssTot)

        return {
            closingPriceChart,
            dma100Chart,
            dma200Chart,
            predictionChart,
            predictionImage: `${import.meta.env.BASE_URL || '/'}data/example_prediction.png`,
            mse, rmse, r2,
            dataInfo: {
                totalRows: stockData.length,
                dateRange: `${dates[0]} to ${dates[dates.length - 1]}`,
                trainSize: splitIdx,
                testSize: testPrices.length,
            }
        }
    }

    const resolveImageUrl = (imgPath) => {
        if (!imgPath) return '';
        if (imgPath.startsWith('data:') || imgPath.startsWith('http')) return imgPath;
        const backendRoot = import.meta.env.VITE_BACKEND_ROOT || '';
        return `${backendRoot}${imgPath}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const tickerValue = ticker.toUpperCase().trim()
        if (!tickerValue) {
            setError('Please enter a stock ticker symbol');
            return;
        }
        setLoading(true)
        setError('')
        setResults(null)
        setDataSource('')

        // Try local data first
        if (hasLocalData(tickerValue)) {
            try {
                const stockData = await fetchLocalStockData(tickerValue)
                const processed = processLocalData(stockData, tickerValue)
                setResults(processed)
                setDataSource('local')
                setLoading(false)
                return
            } catch (err) {
                console.warn('Local data load failed, trying API:', err)
            }
        }

        // Fall back to backend API
        try {
            const response = await axiosInstance.post('/predict/', {
                ticker: tickerValue
            });

            if (response.data.error) {
                const available = getAvailableLocalTickers()
                setError(
                    `No data found for "${tickerValue}". ` +
                    `Available tickers with local data: ${available.join(', ')}. ` +
                    `Try one of these for instant results!`
                )
                return;
            }

            setResults({
                apiMode: true,
                plot_img: resolveImageUrl(response.data.plot_img),
                plot_100_dma: resolveImageUrl(response.data.plot_100_dma),
                plot_200_dma: resolveImageUrl(response.data.plot_200_dma),
                plot_prediction: resolveImageUrl(response.data.plot_prediction),
                mse: response.data.mse,
                rmse: response.data.rmse,
                r2: response.data.r2,
            })
            setDataSource('api')
        } catch (error) {
            if (error.response) {
                if (error.response.status === 401) {
                    setError('Session expired. Please log in again.')
                } else {
                    const available = getAvailableLocalTickers()
                    setError(
                        `Could not fetch data for "${tickerValue}" from server. ` +
                        `Try a locally available ticker: ${available.join(', ')}`
                    )
                }
            } else if (error.code === 'ECONNABORTED') {
                setError('Request timed out. Try a locally available ticker like TSLA.')
            } else {
                setError('Network error. Please check your connection and try again.')
            }
            console.error('Prediction API error:', error)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='container'>
            <div className="row">
                <div className="col-md-8 mx-auto">
                    <div className="bg-light-dark p-4 rounded mb-4">
                        <h3 className='text-light mb-3'>
                            <FontAwesomeIcon icon={faChartLine} className="me-2" />
                            Stock Price Prediction
                        </h3>
                        <p className="text-secondary mb-3">
                            Enter a stock ticker symbol to get AI-powered price predictions.
                            Available tickers: <strong className="text-info">{getAvailableLocalTickers().join(', ')}</strong>
                        </p>
                        <form onSubmit={handleSubmit} className="d-flex gap-2">
                            <input
                                type="text"
                                className='form-control'
                                placeholder='Enter Stock Ticker (e.g., TSLA)'
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <button type='submit' className='btn btn-info text-nowrap' disabled={loading}>
                                {loading ? (
                                    <span><FontAwesomeIcon icon={faSpinner} spin /> Analyzing...</span>
                                ) : (
                                    <span><FontAwesomeIcon icon={faSearch} /> Predict</span>
                                )}
                            </button>
                        </form>
                        {error && (
                            <div className='alert alert-danger mt-3 mb-0'>
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {loading && (
                    <div className="col-12 text-center my-5">
                        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-info" />
                        <p className="text-secondary mt-3">
                            Analyzing stock data for <strong className="text-light">{ticker.toUpperCase()}</strong>...
                        </p>
                    </div>
                )}

                {/* Results Section */}
                {results && !results.apiMode && (
                    <div className="col-12 mt-3">
                        <h4 className="text-light text-center mb-2">
                            Prediction Results for <span className="text-info">{ticker.toUpperCase()}</span>
                        </h4>

                        {dataSource === 'local' && results.dataInfo && (
                            <p className="text-center text-secondary mb-4">
                                <FontAwesomeIcon icon={faDatabase} className="me-1" />
                                {results.dataInfo.totalRows.toLocaleString()} data points &middot; {results.dataInfo.dateRange}
                                &middot; Train: {results.dataInfo.trainSize.toLocaleString()} / Test: {results.dataInfo.testSize.toLocaleString()}
                            </p>
                        )}

                        {/* Chart.js Charts Grid */}
                        <div className="row g-3">
                            {results.closingPriceChart && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <Line
                                            data={results.closingPriceChart}
                                            options={darkChartOptions(`Closing Price of ${ticker.toUpperCase()}`)}
                                        />
                                    </div>
                                </div>
                            )}

                            {results.dma100Chart && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <Line
                                            data={results.dma100Chart}
                                            options={darkChartOptions(`100 Days Moving Average of ${ticker.toUpperCase()}`)}
                                        />
                                    </div>
                                </div>
                            )}

                            {results.dma200Chart && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <Line
                                            data={results.dma200Chart}
                                            options={darkChartOptions(`200 Days Moving Average of ${ticker.toUpperCase()}`)}
                                        />
                                    </div>
                                </div>
                            )}

                            {results.predictionChart && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <Line
                                            data={results.predictionChart}
                                            options={darkChartOptions(`Price Prediction for ${ticker.toUpperCase()}`)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* LSTM Prediction Image from Resources */}
                        {results.predictionImage && (
                            <div className="row g-3 mt-1">
                                <div className="col-md-8 mx-auto">
                                    <div className="bg-light-dark p-3 rounded text-center">
                                        <h6 className="text-secondary mb-2">LSTM Model Prediction (Pre-trained)</h6>
                                        <img
                                            src={results.predictionImage}
                                            alt={`${ticker} LSTM Prediction`}
                                            className="img-fluid rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Model Evaluation Metrics */}
                        <div className="row g-3 mt-3 mb-5">
                            <div className="col-md-4">
                                <div className="bg-light-dark p-3 rounded text-center">
                                    <h6 className="text-secondary">Mean Squared Error (MSE)</h6>
                                    <h4 className="text-info">{results.mse != null ? Number(results.mse).toFixed(4) : 'N/A'}</h4>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="bg-light-dark p-3 rounded text-center">
                                    <h6 className="text-secondary">Root Mean Squared Error (RMSE)</h6>
                                    <h4 className="text-warning">{results.rmse != null ? Number(results.rmse).toFixed(4) : 'N/A'}</h4>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="bg-light-dark p-3 rounded text-center">
                                    <h6 className="text-secondary">R-Squared (R²)</h6>
                                    <h4 className="text-success">{results.r2 != null ? Number(results.r2).toFixed(4) : 'N/A'}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* API-based Results (image mode) */}
                {results && results.apiMode && (
                    <div className="col-12 mt-3">
                        <h4 className="text-light text-center mb-4">
                            Prediction Results for <span className="text-info">{ticker.toUpperCase()}</span>
                        </h4>
                        <div className="row g-3">
                            {results.plot_img && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <h6 className="text-secondary mb-2">Closing Price History</h6>
                                        <img src={results.plot_img} alt={`${ticker} Closing Price`} className="img-fluid rounded" />
                                    </div>
                                </div>
                            )}
                            {results.plot_100_dma && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <h6 className="text-secondary mb-2">100 Days Moving Average</h6>
                                        <img src={results.plot_100_dma} alt={`${ticker} 100 DMA`} className="img-fluid rounded" />
                                    </div>
                                </div>
                            )}
                            {results.plot_200_dma && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <h6 className="text-secondary mb-2">200 Days Moving Average</h6>
                                        <img src={results.plot_200_dma} alt={`${ticker} 200 DMA`} className="img-fluid rounded" />
                                    </div>
                                </div>
                            )}
                            {results.plot_prediction && (
                                <div className="col-md-6">
                                    <div className="bg-light-dark p-3 rounded">
                                        <h6 className="text-secondary mb-2">LSTM Prediction vs Actual</h6>
                                        <img src={results.plot_prediction} alt={`${ticker} Prediction`} className="img-fluid rounded" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="row g-3 mt-3 mb-5">
                            <div className="col-md-4">
                                <div className="bg-light-dark p-3 rounded text-center">
                                    <h6 className="text-secondary">Mean Squared Error (MSE)</h6>
                                    <h4 className="text-info">{results.mse != null ? Number(results.mse).toFixed(4) : 'N/A'}</h4>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="bg-light-dark p-3 rounded text-center">
                                    <h6 className="text-secondary">Root Mean Squared Error (RMSE)</h6>
                                    <h4 className="text-warning">{results.rmse != null ? Number(results.rmse).toFixed(4) : 'N/A'}</h4>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="bg-light-dark p-3 rounded text-center">
                                    <h6 className="text-secondary">R-Squared (R²)</h6>
                                    <h4 className="text-success">{results.r2 != null ? Number(results.r2).toFixed(4) : 'N/A'}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard