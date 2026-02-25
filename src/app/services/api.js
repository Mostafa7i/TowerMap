import axios from "axios";
import { NotifiyErorr } from "../components/Notify";


const API = axios.create({
    // baseURL : "http://localhost:5000/api",
    baseURL : process.env.NODE_ENV === "production" 
    ? "https://tower-map-back-end.vercel.app/api" 
    : "http://localhost:5000/api",
    headers :{
        'Content-Type' : 'application/json'
    },
    withCredentials : true
})


API.interceptors.response.use(
    res => res,
    (error) =>{
        if(!error.response){
            NotifiyErorr("السيرفر لا يعمل في الوقت الحالي حاول في وقت لاحق.")
            return Promise.reject(error)
        }

        NotifiyErorr(
            error.response?.data?.message ||
            error.response?.data?.error ||
            "حدث خطأ ما"
        )
        return Promise.reject( error.response?.data?.error)
    }
)

export default API