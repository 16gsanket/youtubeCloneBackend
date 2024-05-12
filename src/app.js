import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

//to limit the data incoming to server in json format to limit to 16kb
app.use(express.json({ limit: "16kb" }));

//to tell server to handle the data from browser -> simge space " " = %20 ..and so on
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//to save the incoming media in server in public folder temporarily 
app.use(express.static("public"))

// used by server to perform crud operations onto the Cookies saved in the browser of the user
app.use(cookieParser())

//importing the users route
import {router as userRouter} from './routes/user.routes.js'

// router declaration
app.use('/api/v1/user', userRouter)



export { app };
