const stream = require("stream");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { google } = require("googleapis");
require('dotenv').config();
const app = express();


// Enable CORS for all origins, inmf cmf cmf cnf cmf cmf cmf cm fmc fmc fmcluding localhost
app.use(cors());

// Multer setup with file size limit (1 minute of video ~ 50MB)
const upload = multer({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const KEYFILEPATH = path.join(__dirname, "cred.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const auth = new google.auth.GoogleAuth({
    credentials: {
        type: process.env.TYPE,
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY,
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.CLIENT_ID,
        auth_uri: process.env.AUTH_URI,
        token_uri: process.env.TOKEN_URI,
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSE_DOMAIN
    },
    scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

app.post("/upload", upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).send("No file uploaded.");

        if (!file.mimetype.startsWith('video/')) {
            return res.status(400).send("Only video files are allowed.");
        }

        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);

        const { data } = await drive.files.create({
            media: {
                mimeType: file.mimetype,
                body: bufferStream,
            },
            requestBody: {
                name: file.originalname,
                parents: ["1PK9Acp3PhdZsV6aEJvkSY2P1NSR5pOhy"],
            },
            fields: "id, name, webViewLink, webContentLink",
        });

        await drive.permissions.create({
            fileId: data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        console.log(`Download Link: ${data.webContentLink}`);
        res.status(200).send(`File uploaded successfully: ${data.name}, ID: ${data.id}, View Link: ${data.webViewLink}, Download Link: ${data.webContentLink}`);
    } catch (error) {
        res.status(500).send(`Error uploading file: ${error.message}`);
    }
});

app.listen(5050, () => {
    console.log('Server running on port 5050');
});

// Install dependencies: npm install express multer googleapis cors
