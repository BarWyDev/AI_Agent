const axios = require("axios");
require('dotenv').config();
const math = require('mathjs');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_KEY = process.env.API_KEY;
const API_URL = `https://centrala.ag3nts.org/data/${API_KEY}/json.txt`;
const REPORT_URL ='https://centrala.ag3nts.org/report ';

async function fetchJSON() {
    try {
        const response = await axios.get(API_URL);
        const data = response.data;
        const dataToFix = checkJSON(data);
        const dataToLLM = dataToFix.filter(item => item.test);
        const fixedData = await processFixedData(dataToLLM);
        const updatedTestData = [... dataToFix.filter(item => !item.test), ...fixedData];
        
        await sendCorrectedJSON( updatedTestData );
    } catch (error) {
        console.error("Error fetching JSON:", error);
        throw error;
    }
}

async function sendToLLM(question) {
    console.log("Wysyłanie pytania do LLM:", question, OPENAI_API_KEY);
    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI assistant designed to answer questions accurately. Answer the following questions:" },
          { role: "user", content: `${JSON.stringify(question)} You are an AI assistant designed to answer questions accurately. Answer the following questions:` }
        ],
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`, // Klucz API z .env
        },
      });
      console.log(response.data.choices);
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Błąd podczas wysyłania pytania do LLM:", error);
      throw error;
    }
  }

function checkJSON(json) {
    const testData = json['test-data'];
    testData.map((item) => {
        if(math.evaluate(item.question) !== item.answer){
            item.answer = math.evaluate(item.question); 
        }
       
    });
    return testData;
};

async function processFixedData(dataToFix) {
    const fixedData = await Promise.all(dataToFix.map(async item => ({
        ...item,
        test: { ...item.test, a: await sendToLLM(item.test.q) }
    })));
    console.log("Fixed Data:", fixedData);
    return fixedData;
}

async function sendCorrectedJSON(updatedData) {
    console.log("Sending corrected JSON:", updatedData);
    const dataToSend = { "task": "JSON",
        "apikey": "c038d2fa-47d5-4a30-8171-6e4bd21f172d",
        "answer": {
        "apikey": "c038d2fa-47d5-4a30-8171-6e4bd21f172d",
        "description": "This is simple calibration data used for testing purposes. Do not use it in production environment!",
        "copyright": "Copyright (C) 2238 by BanAN Technologies Inc.",
        "test-data": updatedData }
    }
    try {
        const response = await axios.post(REPORT_URL, dataToSend, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        console.log("Corrected JSON sent successfully:", response.data);
    } catch (error) {
        throw error;
    }
}

fetchJSON();
