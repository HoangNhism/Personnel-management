var express = require('express');
var router = express.Router();
let multer = require('multer')
let path = require('path')
let fs = require('fs').promises;

// Define paths for different file types
const paths = {
  avatars: path.join(__dirname, "../uploads/avatars"),
  resumes: path.join(__dirname, "../uploads/resumes"),
  idProofs: path.join(__dirname, "../uploads/id-proofs"),
  certificates: path.join(__dirname, "../uploads/certificates")
};

// Ensure directories exist
const ensureDirectories = async () => {
  for (const dir of Object.values(paths)) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Call it when server starts
ensureDirectories().catch(console.error);

// Update CORS headers
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-User-ID');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  next();
});

// Add multer middleware to parse FormData before file handling
router.use(express.urlencoded({ extended: true }));

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Select destination based on file type
    let dest = paths.avatars; // default to avatars
    if (file.fieldname === 'resume') dest = paths.resumes;
    if (file.fieldname === 'idProof') dest = paths.idProofs;
    if (file.fieldname === 'certificate') dest = paths.certificates;
    cb(null, dest)
  },
  filename: (req, file, cb) => {
    // Get userId from URL query parameter instead of body
    let userId = req.query.userId;
    console.log('User ID from query:', userId);
    
    if (!userId) {
      console.error('No userId provided in query');
      userId = 'unknown';
    }

    // Clean up user ID to be safe for filenames
    userId = userId.replace(/[^a-zA-Z0-9]/g, '');
    console.log('Cleaned user ID for filename:', userId);

    const timestamp = new Date(Date.now()).getTime();
    const filename = `${userId}_${timestamp}_${file.originalname}`;
    console.log('Generated filename:', filename);
    cb(null, filename);
  },
});

let fileFilter = (req, file, cb) => {
  // Define allowed types for each category
  const allowedTypes = {
    avatar: /^image\/(jpg|jpeg|png|gif)$/,
    resume: /^application\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/,
    idProof: /^(image\/(jpg|jpeg|png)|application\/pdf)$/,
    certificate: /^(image\/(jpg|jpeg|png)|application\/pdf)$/
  };

  const type = file.fieldname === 'avatar' ? 'avatar' :
               file.fieldname === 'resume' ? 'resume' :
               file.fieldname === 'idProof' ? 'idProof' : 'certificate';

  if (!file.mimetype.match(allowedTypes[type])) {
    cb(new Error(`Invalid file type for ${type}`))
    return;
  }
  cb(null, true)
}

let upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Modify upload route to use basic POST
router.post('/upload', (req, res, next) => {
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'certificate', maxCount: 5 }
  ])(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }
      
      console.log('Files received:', req.files);
      console.log('Form data:', req.body);

      const fileField = Object.keys(req.files)[0];
      const file = req.files[fileField][0];
      const fileType = fileField === 'avatar' ? 'avatars' :
                      fileField === 'resume' ? 'resumes' :
                      fileField === 'idProof' ? 'id-proofs' : 'certificates';
      
      let url = `http://localhost:4000/${fileType}/${file.filename}`;
      res.status(200).json({
        success: true,
        message: url,
        owner: req.body.userId,
        filename: file.filename
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
});

// Add routes to serve files from different directories
router.get('/avatars/:filename', (req, res) => {
  res.sendFile(path.join(paths.avatars, req.params.filename));
});

router.get('/resumes/:filename', (req, res) => {
  res.sendFile(path.join(paths.resumes, req.params.filename));
});

router.get('/id-proofs/:filename', (req, res) => {
  res.sendFile(path.join(paths.idProofs, req.params.filename));
});

router.get('/certificates/:filename', (req, res) => {
  res.sendFile(path.join(paths.certificates, req.params.filename));
});

// Update the getAllUserFiles function
async function getAllUserFiles(userId) {
  const userFiles = [];
  const directories = ['avatars', 'resumes', 'id-proofs', 'certificates'];
  
  for (const dir of directories) {
    try {
      const dirPath = paths[dir.replace('-', '')];
      const files = await fs.readdir(dirPath);
      const userFilesInDir = files.filter(file => file.startsWith(userId));
      
      userFilesInDir.forEach(file => {
        userFiles.push({
          _id: file,
          name: file.split('_').slice(2).join('_'),
          type: dir.slice(0, -1), // remove 's' from end
          url: `http://localhost:4000/${dir}/${file}`,
          uploadDate: new Date(parseInt(file.split('_')[1]))
        });
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
      // Continue with other directories even if one fails
    }
  }

  return userFiles;
}

// Update the documents endpoint
router.get('/documents/:userId', async function (req, res, next) {
  try {
    const userId = req.params.userId;
    if (!userId || userId.length !== 16) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const files = await getAllUserFiles(userId);
    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error getting user files:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching files'
    });
  }
});

module.exports = router;
