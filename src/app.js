import express from "export";
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
app.use(express.urlencoder({ extended: true, limit: "16kb" }));

//to save the incoming media in server in public folder temporarily 
app.use(express.static("public"))

// used by server to perform crud operations onto the Cookies saved in the browser of the user
app.use(express.cookieParser())

export { app };
