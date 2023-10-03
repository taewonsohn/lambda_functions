// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
require('dotenv').config();
const chromium = require('chrome-aws-lambda');
const apiKey = process.env.OPENAI_API_KEY;
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

exports.lambdaHandler = async (event, context,callback) => {
  if (event.httpMethod === 'OPTIONS') {
    // Handle the preflight request
    const Response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Change this to your allowed origin (e.g., http://localhost:3000)
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET' // Add the allowed methods here
      },
      body: JSON.stringify({}), // Empty body for preflight response
    };

    return callback(null, Response);
  }
  const link = decodeURIComponent(event.queryStringParameters.siteurl);
  let data = [];
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  try {
    

    
      const page = await browser.newPage();
      console.log('link: ',link);
      
        await page.goto(link, { waitUntil: 'domcontentloaded' });

        
        const potentialSelectors = [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // Headings
          'span' // Paragraphs, spans, divs, list items, links, table cells
        ];
      
        let visibleTexts = '';
        const fontSizeThreshold = 13;
        for (const selector of potentialSelectors) {
          const elements = await page.$$eval(selector, (elements,fontSizeThreshold) => {
           return elements
            .filter((el) => {
              const style = window.getComputedStyle(el);
              return style && style.display !== 'none' && parseFloat(style.fontSize) >= fontSizeThreshold; // Filter out elements that are not visible
            })
            .filter((el) => {
              const rect = el.getBoundingClientRect();
              return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight // Check if the element's bottom is within the viewport 
              );
            })
            .map((el) => el.textContent.trim());
        },fontSizeThreshold);
    
        const joinedTexts = elements.join('\n'); // Concatenate all the visible texts with a newline separator
        visibleTexts += joinedTexts + '\n';
      }
    
      console.log('Visible Texts within Viewport:', visibleTexts);

        const response = await chatGPT(visibleTexts+'\n위는 상품페이지에 있는 모든 텍스트야. 상품명을 하나만(첫번째) 간결하게 추출해줘. 꼭 하나만');
        data = response;
      } catch(error){
        console.error('Error processing page: ',error.message);
        const Response = {
          statusCode: 500, // You can use any appropriate status code for the error response
          headers: {
            'Access-Control-Allow-Origin': '*', // Change this to your allowed origin (e.g., http://localhost:3000)
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, GET'
          },
          body: JSON.stringify({ error: 'An error occurred during processing.' }),
        };
      
        return callback(null, Response);
      } finally {
        await browser.close();
        console.log(data);
  
        const Response = {
          statusCode: 200,
          headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'OPTIONS,POST,GET' // Adjust the allowed HTTP methods as needed
          },
          body: JSON.stringify(data)
        };
        
        return callback(null, Response);
      }
    
   
  
  
};

async function chatGPT(Content){
  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: Content }],
    n: 3
  });
  console.log(chatCompletion.data.choices);
  const response = [chatCompletion.data.choices[0].message.content,
  chatCompletion.data.choices[1].message.content,
  chatCompletion.data.choices[2].message.content
];
  return response;
}