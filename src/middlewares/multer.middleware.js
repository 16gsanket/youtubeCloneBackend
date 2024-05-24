import multer from "multer";

const storage = multer.diskStorage({

  //The file would be stored at the pulic/temp folder in the server from where it will be 
  // uploaded to the cloudinary ... once uploaded -> inlinking of file will be done on the 
  // local server.
  
  destination: function (req, file, cb) {
  
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    console.log('inside the multer file')
  },
});

export const upload = multer({
  storage,
});
