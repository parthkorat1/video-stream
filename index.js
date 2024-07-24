import express from "express"
import cors from "cors"
import multer from "multer"
import { v4 as uuidv4 } from "uuid"
import path from "path"
import fs from "fs"
import { exec } from "child_process" //warnings dengered
import {stderr , stdout} from "process"


const app = express()

//multer middleware
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.filename + "-" + uuidv4() + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

app.use(cors(
    {
        origin: 'http://localhost:8000',
        credentials: true
    }
))

app.use((req, res, next) => {
    res.header('Content-Type', 'application/json')
    next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static("uploads"))

app.get('/', function (req, res) {
    res.json({ message: 'Hello world' })
})

app.post("/upload", upload.single('file'), function (req, res) {
    const lessonId = uuidv4()
    const videoPath = req.file.path
    const outputPath = `./uploads/courses/${lessonId}`
    const hlsPath = `${outputPath}/index.m3u8`

    console.log(hlsPath);

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    //ffmpeg
    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac 
    -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" 
    -start_number 0 ${hlsPath}`;
    // i konw this i bad prectice
    exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`ffmpeg error: ${error}`);
            return;
        }
        console.log(`ffmpeg stdout: ${stdout}`);
        console.error(`ffmpeg stderr: ${stderr}`);
        const videoUrl = `https://localhost:8000/uploads/courses/${lessonId}/index.m3u8`;

        res.json({
            message: "video create to HLS model",
            videoUrl:videoUrl,
            lessonId: lessonId
        })
    })
   
})
app.listen(8000, function () {
    console.log('Server started on port 3000')
})