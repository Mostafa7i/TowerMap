import { NextResponse } from "next/server";

export function proxy(req){
    const token = req.cookies.get("access_token")

    const {pathname} = req.nextUrl;


    if(!token && pathname.startsWith("/dashboard")){
        return NextResponse.redirect(new URL("/Login" , req.url))
    }

    if(token && pathname === "/Login"){
        return NextResponse.redirect(new URL("/dashboard" , req.url))
    }


    return NextResponse.next()

}

export const config = {
    matcher : ["/dashboard/:path*" , "/Login"]
}