const ytdl = require('ytdl-core');
require('dotenv').config();
const { S3Client} = require('@aws-sdk/client-s3');

const { Upload } = require('@aws-sdk/lib-storage');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

exports.lambdaHandler = async(event, context,callback) => {
  let videoUrl;
  let videoId;
  console.log("request: ",event);
  console.log("videoUrl: ",event.videoUrl);
  console.log("name: ",event.name);
  console.log("context: ",context);
  
  try {
    videoUrl = event.videoUrl;
    videoId = event.name;
    let info = await ytdl.getInfo(videoUrl);
    let format;
    try{
      format = ytdl.chooseFormat(info.formats, { quality: '137' });
    }catch(error){
      try{
        format = ytdl.chooseFormat(info.formats, { quality: '136' });
      }catch(error){
        console.error('Desired formats (1080p and 720p) are unavailable for this video.');
        const Response = {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
          },
          body: JSON.stringify({ message: 'Error downloading the video' }),
        };
        return callback(null, Response);
        
      }
    }
    console.log('Format found!', format);
    const videoStream = ytdl(videoUrl, { quality: format.itag });

    const file = {
      fileStream: videoStream, // Use the PassThrough stream
      filename: `${videoId}.mp4`
      };

    const response = await uploadFile(file);
      

  
    
  } catch (error) {
    console.log('error occured');
    const Response = {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
      },
      body: JSON.stringify({ message: 'Error processing the object' }),
    };
    return callback(null, Response);
  }
  console.log('endendendend');
  const Response = {statusCode: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
    },
    body: JSON.stringify({ message:'successful'}),};
  return callback(null, Response);
  
};


async function uploadFile(file) {
  console.log('Video upload function called.');
  const uploadParams = {
    Bucket: bucketName,
    Body: file.fileStream,
    Key: file.filename
  };
  console.log('Uploading to S3...');
  const parallelUploads3 = new Upload({client: s3Client, params: uploadParams});
  parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(progress);
    });
  await parallelUploads3.done();
  
  console.log('Upload Completed');
  return 'success';
}