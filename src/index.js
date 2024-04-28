// require('dotenv').config()
import dotenv from "dotenv"

import connectDB from "./db/index.js"

dotenv.config({
    path:'/env'
})


connectDB()






/*
import express from 'express'
const app =express()
;(async()=>{

    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        application.on("error",(error)=>{
            console.log('Error')
            throw new error
        })

        app.listen(process.env.PORT , ()=>{
            console.log("App is listening");
            throw error
        })

    }catch(error){
        console.log("ERROR",error)
        throw error;
    }


})()

*/
