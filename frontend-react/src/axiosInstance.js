import axios from "axios";


const baseURL = import.meta.env.VITE_API_BASE_URL || "https://stock-prediction-portal-backend-hos.vercel.app/api/v1"
const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 min timeout for ML prediction calls
})


// Request Interceptor
axiosInstance.interceptors.request.use(
    function(config){
        const accessToken = localStorage.getItem('accessToken')
        if(accessToken){
            config.headers['Authorization'] = `Bearer ${accessToken}`
        }
        return config;
    },
    function(error){
        return Promise.reject(error);
    }
)

// Response Interceptor
axiosInstance.interceptors.response.use(
    function(response){
        return response;
    },
    // Handle failed responses
    async function(error){
        const originalRequest = error.config;
        
        // Check if error.response exists (network/CORS errors don't have response)
        if(!error.response){
            console.error('Network error or CORS issue:', error.message);
            return Promise.reject(error);
        }
        
        if(error.response.status === 401 && !originalRequest.retry){
            originalRequest.retry = true;
            const refreshToken = localStorage.getItem('refreshToken')
            if(!refreshToken){
                // No refresh token — force logout
                localStorage.removeItem('accessToken')
                window.dispatchEvent(new Event('auth:logout'))
                return Promise.reject(error);
            }
            try{
                const response = await axiosInstance.post('/token/refresh/', {refresh: refreshToken})
                localStorage.setItem('accessToken', response.data.access)
                originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`
                return axiosInstance(originalRequest)
            }catch(refreshError){
                // Refresh failed — clear tokens and notify app to logout
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.dispatchEvent(new Event('auth:logout'))
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
)


export default axiosInstance;