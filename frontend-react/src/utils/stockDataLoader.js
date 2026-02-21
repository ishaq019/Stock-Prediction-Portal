import Papa from 'papaparse';

/**
 * Available local stock data files.
 * Add more tickers here as CSV files are added to public/data/
 */
const BASE = import.meta.env.BASE_URL || '/';

const LOCAL_TICKERS = {
    'TSLA': `${BASE}data/TSLA.csv`,
};

/**
 * Check if we have local data for a given ticker
 */
export const hasLocalData = (ticker) => {
    return ticker.toUpperCase() in LOCAL_TICKERS;
};

/**
 * Get list of available local tickers
 */
export const getAvailableLocalTickers = () => Object.keys(LOCAL_TICKERS);

/**
 * Fetch and parse a local CSV file for the given ticker
 * Returns an array of objects with Date, Open, High, Low, Close, Volume
 */
export const fetchLocalStockData = (ticker) => {
    const upperTicker = ticker.toUpperCase();
    const csvPath = LOCAL_TICKERS[upperTicker];

    if (!csvPath) {
        return Promise.reject(new Error(`No local data available for ${upperTicker}`));
    }

    return new Promise((resolve, reject) => {
        Papa.parse(csvPath, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parse warnings:', results.errors);
                }
                const data = results.data
                    .filter(row => row.Date && row.Close != null)
                    .map(row => ({
                        date: row.Date,
                        open: row.Open,
                        high: row.High,
                        low: row.Low,
                        close: row.Close,
                        adjClose: row['Adj Close'],
                        volume: row.Volume,
                    }));
                resolve(data);
            },
            error: (err) => reject(err),
        });
    });
};

/**
 * Compute a simple moving average for close prices
 * @param {number[]} prices - Array of close prices
 * @param {number} window - Moving average window (e.g. 100, 200)
 * @returns {(number|null)[]} Array of same length, null for insufficient data points
 */
export const computeMovingAverage = (prices, window) => {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < window - 1) {
            ma.push(null);
        } else {
            const slice = prices.slice(i - window + 1, i + 1);
            const avg = slice.reduce((a, b) => a + b, 0) / window;
            ma.push(avg);
        }
    }
    return ma;
};

/**
 * Downsample data arrays for chart performance (keeps every nth point + always the last)
 * @param {Array} data - Original data array
 * @param {number} maxPoints - Maximum number of points to keep
 * @returns {Array} Downsampled array
 */
export const downsample = (data, maxPoints = 500) => {
    if (data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    const sampled = data.filter((_, i) => i % step === 0);
    // Always include the last point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
    }
    return sampled;
};

/**
 * Compute simple evaluation metrics by comparing two arrays
 */
export const computeMetrics = (actual, predicted) => {
    const n = Math.min(actual.length, predicted.length);
    let sumSqErr = 0;
    let ssRes = 0;
    let ssTot = 0;
    const meanActual = actual.slice(0, n).reduce((a, b) => a + b, 0) / n;
    
    for (let i = 0; i < n; i++) {
        const err = actual[i] - predicted[i];
        sumSqErr += err * err;
        ssRes += err * err;
        ssTot += (actual[i] - meanActual) ** 2;
    }
    
    const mse = sumSqErr / n;
    const rmse = Math.sqrt(mse);
    const r2 = 1 - (ssRes / ssTot);
    
    return { mse, rmse, r2 };
};
