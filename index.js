const stream = require("stream");
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { google } = require("googleapis");
const app = express();


// Enable CORS for all origins, inmf cmf cmf cnf cmf cmf cmf cm fmc fmc fmcluding localhost
app.use(cors());

// Multer setup with file size limit (1 minute of video ~ 50MB)
const upload = multer({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const auth = new google.auth.GoogleAuth({
    credentials: {
        type: "service_account",
        project_id: "mapper-450909",
        private_key_id: "f6bb29c87b6382250723cc8e66122d33e73da27e",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkZWgOnmWIOePO\n/pn0N365id6Y2oMMgXQ3Q+BMMbLYLsh8k4TRS0o2ESR5c0YPiSHA4/AUzfTSZbKg\nmVSCkV2bnFt0gzkGbNDgePGVFyWk9XkYNsNv3cdpl1lwYxqz4M/UoHOnueiRfAun\nwM/T7UkipCOPbhM6A9ayTmemgymgK8jCExkOdt/g2FawEK09rXMVofdN8dqtLBz4\nvM8nyIFdKETwVFdslPXWMZGwRmozD4O4Jwl5jC0kdtzcYqgWG60GUqdmpUTkIXAN\nxAnDpX+C4+gxIjz9wwRPKRePgnRagbZGwwm7m45OlOSMHrliFNmlCc5F1ockaKL9\nmYdFicT9AgMBAAECggEAAj7zFFAMVGIbafaHJT5PguVj9HP3xQdNDnw6POWTlenT\nCgX8kzITdM2jJphGkBZwLvHDk+UvFQ4X9KMOSS0HObBXJ4OrbG+2zXpELU9AT71I\nHDvooPHyCXqXLuE2ZNgLaXzlAkOYmR7itzX7y4oQV7glAY6gFfN7eWV3e7TgWrR4\nz04RTDYjYr45MIrFaqwH18S2h43xvVWaKh3+Srvj1F8AmCvGgL15w17t5f4r2qed\nIktMkw95ke/HYljJ7gwxQAsjm634gXYkydgv8lV83R7kt8ERwbGGOnGpn7H4gr1N\nM8v21Z81Kq7giB0Uqp0GmEATVsxOK7vZyCXIYl9QGQKBgQDaLz3P3hjTe2JKkLds\nzb/8DkjmkRPiJrwvcFSWq9MKi34IlCJtd5XSpO64mlqerp34dTlI9ANMPp3JklPF\nQ8m0wXwr0xiR5YoxNRQkDhXFFn8f1UYagamDEppMDfMlSvRwDEtojjriCJ069+Es\nINvFZ1HynPoQn2BWjjsmSnuZlwKBgQDA45hOckq4domzRCYtiN2v4+y1i74mGTXu\nwbztvp+GYAJoDrLFBTSOpksQGed0W/54m3E4ghbmNnmUTT/LtU+xSqK79jgz0vG3\ns55rkI16xg23ZjbRcdI8bri2Jl6kcfbksvxPVHE4yj5qZFDFkxYKiTOvwh/a9tNB\nMGYKxumgiwKBgFHsqykCHBBMo/ubm0QffZcHRhhNIUopgT/OzfRFUFkFR62w8bxo\nyrjtdTWbv6sVpftFCN17wkE+wcCOUSYg7fwRKq7J9M/TgLA5Xfar00DN0a4CRvBs\n/1lYAtfL5SB7pIzuEOKRhUqaMW+S49nN/LeCtCKFDuBu952Iim02SnLBAoGAOVny\niTCWYu5r1u9mYpeVQp0EXp5kNTO9w3W7VP0etXeKf6IPKWF41QlAvFLXbNOFgBrH\nuUOEx4Je9+dYFpucTFyisjxtTYtk73fqnJToXB7TKTqtBe1P00Qgi5gw/7ga7rkB\nKB01ZOtNT5jwIy6umQdeZN3VVueYvINFc+LcyC0CgYBHFoF9AIwI5ed2g4HRfMk5\ndxb8khbj9JcoAoy5yiXywcI4+7n3pX0CtCB3cUsDzD3+7THl86t8P/Jkz3FDMawp\nXxelP4Z5rPVOX0Rvk8FIyRBkPfXoSd51Lu3kyNCC9iA+g6wS40M5Uidl0dn7yKJ9\nbPlayDi310a9toGLLJ0PAA==\n-----END PRIVATE KEY-----\n",
        client_email: "mapper-video@mapper-450909.iam.gserviceaccount.com",
        client_id: "100665152441658092546",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/mapper-video%40mapper-450909.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
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

// app.listen(5050, () => {
//     console.log('Server running on port 5050');
// });


module.exports = app;
