require('dotenv').config();
const fs = require('fs');
const util = require('util');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

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
async function deleteFile(fileKey) {
  const deleteParams = {
    Key: fileKey,
    Bucket: bucketName
  };

  const command = new DeleteObjectCommand(deleteParams);
  const response = await s3Client.send(command);

  return response;
}
exports.deleteFile = deleteFile;
// Uploads a file to S3
async function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream, 
    Key: file.filename
  };

  const command = new PutObjectCommand(uploadParams);
  const response = await s3Client.send(command);

  return response;
}
exports.uploadFile = uploadFile;

// Downloads a file from S3
async function downloadFile(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
  };

  const command = new GetObjectCommand(downloadParams);
  const response = await s3Client.send(command);

  return response.Body;
} 
exports.downloadFile = downloadFile;

async function listFiles(prefix) {
    const params = {
      Bucket: bucketName,
      Prefix: prefix
    };
    //console.log(bucketName, region, accessKeyId, secretAccessKey);
    const command = new ListObjectsV2Command(params);
    const response = await s3Client.send(command);
    //console.log(util.inspect(response, false, null, true /* enable colors */));
    //console.log(util.inspect(response.Contents, false, null, true /* enable colors */));
    return response.Contents;
  }
  
exports.listFiles = listFiles;

async function listFolders(prefix){
    const params = {
        Bucket: bucketName,
        Prefix: prefix,
        Delimeter : '/'
      };
      //console.log(bucketName, region, accessKeyId, secretAccessKey);
      const command = new ListObjectsV2Command(params);
      const response = await s3Client.send(command);
      //console.log('response -----');
      //console.log(response);
      const folderNames = new Set();
      response.Contents.forEach(item=>{
        const key = item.Key;
        const folderName = key.substring(prefix.length).split('/')[0];
        
        folderNames.add(folderName);
      })
      console.log('folderNames: '+util.inspect(folderNames));
      const folderNameArray = Array.from(folderNames);
      return folderNameArray;
    }
exports.listFolders = listFolders;
