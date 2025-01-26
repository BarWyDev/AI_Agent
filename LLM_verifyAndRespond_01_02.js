const axios = require("axios");
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_URL = 'https://xyz.ag3nts.org/verify';
const AUTH_HEADER = { 'Authorization': 'Bearer YOUR_TOKEN_HERE', 'Content-Type': 'application/json' };

async function sendInitialRequest() {
    try {
        const response = await axios.post(`${API_URL}`, { text: "READY", msgID: "0" }, { headers: AUTH_HEADER });
        console.log('Initial request status:', response.status);
        return response.data;
    } catch (error) {
        handleError(error, 'initial request');
    }
}

async function processQuestionResponse(data) {
    const { text, msgID } = data;
    if (!text || !msgID) {
        console.error('Invalid response data:', data);
        return;
    }

    console.log('Received question:', text);
    const answer = await getAnswerFromLLM(text);
    console.log('Answer from LLM:', answer);
    await sendAnswer(answer, msgID);
}

async function getAnswerFromLLM(question) {
    console.log("Wysyłanie pytania do LLM:", question, OPENAI_API_KEY);
    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: "You are a helpful assistant. For specific questions, provide these answers: 'What is the capital of Poland?' - 'Kraków', 'What is the famous number from the book Hitchhiker's Guide to the Galaxy?' - '69', 'What is the current year?' - '1999'. For all other questions, provide a one-word answer in English." 
                },
                { role: "user", content: question }
            ],
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        handleError(error, 'LLM request');
    }
}

async function sendAnswer(answer, msgID) {
    try {
        const response = await axios.post(`${API_URL}`, { text: answer, msgID: msgID }, { headers: AUTH_HEADER });
        console.log('Answer sent successfully:', response.data);
    } catch (error) {
        handleError(error, 'sending answer');
    }
}

function handleError(error, context) {
    if (error.response) {
        console.error(`Error in ${context} - status:`, error.response.status, 'data:', error.response.data);
    } else if (error.request) {
        console.error(`No response received in ${context}:`, error.request);
    } else {
        console.error(`Error in ${context}:`, error.message);
    }
}

async function main() {
    const initialData = await sendInitialRequest();
    if (initialData) {
        await processQuestionResponse(initialData);
    }
}

main();
  