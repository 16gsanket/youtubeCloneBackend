// require('dotenv').config()
import dotenv from "dotenv"

import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path:'/env'
})


connectDB()
.then(()=>{

    app.on("error",(error)=>{
        console.log(error)
        throw new error
    })

    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`  Server is Listening on Port Number : ${process.env.PORT}`)
    })
})
.catch(err=>{
    console.log("MongoDB not Connected")
})






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
