const chromium = require('chrome-aws-lambda');
require('dotenv').config();
const { S3Client,ListObjectsV2Command,PutObjectCommand} = require('@aws-sdk/client-s3');


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
  const fileUrl = decodeURIComponent(event.queryStringParameters.link);
  const link ='https://lens.google.com/uploadbyurl?url='+fileUrl+'&hl=ko-KR';
  const num = decodeURIComponent(event.queryStringParameters.num);
  const prefix = 'https://taewons3.s3.ap-northeast-2.amazonaws.com/';
  const key = fileUrl.substring(prefix.length);
  const jsonKey = key.replace(".png",".json");
  //

  /*const files = await listFiles('');
  console.log(files);
  files.forEach(file=>{

  });
  */
  let products = [];
  let browser = null
  console.log(link);
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    let page = await browser.newPage();
    
    await page.goto(link);
    console.log('page loading . . .');
    await page.waitForNavigation();

    await page.waitForSelector('.aah4tc');
    console.log('page loaded!');
    const columns = await page.evaluate(() => {
      const container = document.querySelector('.aah4tc');
      const columns = container.children.length;
      
      return columns;
    });
    for(let i = 0; i<num; i++){
      let col = i%columns;
      let row = Math.floor(i/columns);

      const product = await page.evaluate((indices)=>{
        const [col,row] = indices;
        const container = document.querySelector('.aah4tc');
        const a = container.children[col].children[row].children[0].children[0];
        const img = a.children[0].children[0].children[0].children[0];
        const Result = {text: a.textContent, imgsource:img.src, url:a.href};
        return Result;
      },[col,row]);
      products.push(product);
      console.log(col,row,product.text,product.imgsource,product.url);
      
    }
    await browser.close();
    
  } catch (error) {
    return callback(error);
  }
  console.log('key: ',key);
  const file = {
    fileStream:JSON.stringify(products),
    filename:jsonKey
  };
  await uploadJSON(file);
  const Response = {statusCode: 200,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
    },
    body: JSON.stringify(products),};
  return callback(null, Response);
};


async function uploadJSON(file) {

  const uploadParams = {
    Bucket: bucketName,
    Body: file.fileStream,
    Key: file.filename,
    ContentType: 'application/json'
  };

  const command = new PutObjectCommand(uploadParams);
  const response = await s3Client.send(command);

  return response;
}

async function listFiles(prefix) {
  const params = {
    Bucket: bucketName,
    Prefix: prefix
  };
  console.log(bucketName, region, accessKeyId, secretAccessKey);
  const command = new ListObjectsV2Command(params);
  const response = await s3Client.send(command);
  return response.Contents;
}