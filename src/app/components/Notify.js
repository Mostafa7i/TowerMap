import { toast } from "react-toastify"



export const NotifiyErorr = (msg) =>{
    toast.error(msg , {
        position : 'top-right',
        autoClose : 1500,
        draggable : true
    })
}
export const NotifiyInfo = (msg) =>{
    toast.info(msg , {
        position : 'top-right',
        autoClose : 1500,
        draggable : true
    })
}
export const NotifiySuccess = (msg) =>{
    toast.success(msg , {
        position : 'top-right',
        autoClose : 1500,
        draggable : true
    })
}