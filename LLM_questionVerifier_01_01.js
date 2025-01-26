const axios = require("axios");
const puppeteer = require("puppeteer");
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function fetchQuestion() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://xyz.ag3nts.org");

    const questionSelector = '#human-question';
    await page.waitForSelector(questionSelector);

    const question = await page.$eval(questionSelector, (el) => el.innerHTML);
    console.log("Pobrane pytanie:", question);
    // await browser.close();
    return question.trim();
  } catch (error) {
    console.error("Błąd podczas pobierania pytania:", error);
    await browser.close();
    throw error;
  }
}

async function sendToLLM(question) {
  console.log("Wysyłanie pytania do LLM:", question, OPENAI_API_KEY);
  try {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that only provides numeric answers." },
        { role: "user", content: `${question} Please provide only the numeric answer.` }
      ],
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`, // Klucz API z .env
      },
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Błąd podczas wysyłania pytania do LLM:", error);
    throw error;
  }
}

async function sendFormData(username, password, answer) {
  try {
    const response = await axios.post("https://xyz.ag3nts.org", {
      username,
      password,
      answer,
    });

    return response.data;
  } catch (error) {
    console.error("Błąd podczas wysyłania danych:", error);
    throw error;
  }
}

async function main() {
  const username = "tester"; 
  const password = "574e112a";

  try {
  
    const question = await fetchQuestion();
    
    const answer = await sendToLLM(question);
    console.log("Odpowiedź z LLM:", answer);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://xyz.ag3nts.org');

    const usernameSelector = 'input[name="username"]';
    const passwordSelector = 'input[name="password"]';
    const answerSelector = 'input[name="answer"]';
    const submitButtonSelector = 'button#submit';

   
    await page.waitForSelector(usernameSelector);
    await page.waitForSelector(passwordSelector);
    await page.waitForSelector(answerSelector);

    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);
    await page.type(answerSelector, answer);

    await page.click(submitButtonSelector);

    await page.waitForNavigation();

   
    const pageContent = await page.content();
    
  } catch (error) {
    console.error("Błąd w aplikacji:", error);
  }
}

main();
