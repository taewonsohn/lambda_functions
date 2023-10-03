
//const {listFiles,listFolders,deleteFile} = require('./s3');
require('dotenv').config();
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

exports.lambdaHandler = async (event, context,callback) => {

  const requestType = event.queryStringParameters.requestType;
  console.log(requestType);
  let result;
  if(requestType == 'filelist'){
    try{
      const prefix = event.queryStringParameters.prefix;
      console.log(prefix);
      result = await listFiles(prefix);
    }catch(error){
      console.error(error);
      const Response = {statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
        },
        body: 'noRequestType',};
      return callback(null, Response);
    }
  }else{
    const Response = {statusCode: 500,
      headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
      },
      body: 'noRequestType',};
    return callback(null, Response);
  }
  
  const Response = {statusCode: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
    },
    body: JSON.stringify(result),};
  return callback(null, Response);
  
};

async function listFiles(prefix) {
  const params = {
    Bucket: bucketName,
    Prefix: prefix
  };
  console.log(bucketName, region, accessKeyId, secretAccessKey);
  const command = new ListObjectsV2Command(params);
  const response = await s3Client.send(command);
  console.log(response);
  console.log(response.Contents);
  return response.Contents;
}