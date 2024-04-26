const express = require("express");
const {
  getChunkedDocsFromPDF,
  getChunkedDocsFromImage,
} = require("./PdfLoader");
const cors = require("cors");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { BufferMemory } = require("langchain/memory");
const {
  ConversationalRetrievalQAChain,
  RetrievalQAChain,
} = require("langchain/chains");
const { ChatOpenAI } = require("@langchain/openai");
const formatConvHistory = require("./formatConvHistory.js");

const {
  RunnablePassthrough,
  RunnableSequence,
} = require("@langchain/core/runnables");
const { formatDocumentsAsString } = require("langchain/util/document");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} = require("@langchain/core/prompts");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const { SupabaseVectorStore } = require("langchain/vectorstores/supabase");

const axios = require("axios");
const fs = require("fs");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const multer = require("multer");
const upload = multer({ dest: "public/" });


// const fs = require('fs');
// const path = require('path');
const formidable = require("express-formidable");
const sbApiKey = process.env.SUPABASE_API_KEY;
const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT;
const openAIApiKey = process.env.OPENAI_API_KEY;
const app = express();
const port = 5000;

app.use(cors()); // Enable CORS
app.use(express.json()); // Enable JSON parsing
var Chat_history = [];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function ensureVectorStore(
  client,
  documents,
  openAIApiKey,
  alreadyProcessed
) {
  // Placeholder for checking if documents already processed
  // This should be replaced with actual logic to check for existing embeddings
  // This should be dynamic based on your application's logic

  let vectorStore;

  if (alreadyProcessed) {
    // Initialize vectorStore with existing data
    vectorStore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings({ openAIApiKey }),
      {
        client,
        tableName: "pdfdocuments", // Assuming this table contains your pre-processed embeddings
        queryName: "match_pdfdocuments",
      }
    );
  } else {
    // Process and store documents as embeddings
    vectorStore = await SupabaseVectorStore.fromDocuments(
      documents,
      new OpenAIEmbeddings({ openAIApiKey }),
      {
        client,
        tableName: "pdfdocuments",
        queryName: "match_pdfdocuments",
      }
    );

    // Optionally, here you might want to mark these documents as processed in your logic
    // to avoid reprocessing in the future
  }

  return vectorStore;
}

async function get_Conversation_chain(vectorStore, query) {
  const model = new ChatOpenAI({ openAIApiKey });
  // const memory = new BufferMemory({ memoryKey: "chat_history", returnMessages: true });

  // const conversation = new RetrievalQAChain({
  //     llm,
  //     retriever: vectorStore.asRetriever(),
  //     memory
  // });
  // const res = await conversation.invoke({
  //     query: "Who is Jayesh Yadav?",
  //   });
  //   console.log({ res });
  const vectorStoreRetriever = vectorStore.asRetriever();

  const SYSTEM_TEMPLATE = `Use the following pieces of context  and the conversation history  to answer the question at the end .Try to find the answer in the context. If the answer is not given in the context, find the answer in the chat_history if possible.

If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------------
{context}

`;
  const messages = [
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate("{question}"),
  ];
  const prompt = ChatPromptTemplate.fromMessages(messages);
  // let chain = ConversationalRetrievalQAChain.fromLLM(
  //   model,
  //   vectorStore.asRetriever(),

  // );
  const chain = RunnableSequence.from([
    {
      context: vectorStoreRetriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke(query);
  // const answerText = await chain.invoke({ question: query, chat_history: formatConvHistory( Chat_history) });

  // const {text}=answerText;
  // Chat_history.push(query)
  // Chat_history.push(text)
  // console.log({text ,Chat_history});

  //     return text;
  // Chat_history.push(query)
  // Chat_history.push(answer)
  return answer;
}

app.post(
  "/upload",
  formidable({
    multiples: true,
  }),
  async (req, res) => {
    const { PDFdocs } = req.files;
    const output = await getChunkedDocsFromPDF(PDFdocs.path);
    const client = createClient(sbUrl, sbApiKey);
    console.log("output", output);

    const vectorStore = await ensureVectorStore(
      client,
      output,
      openAIApiKey,
      false
    );

    const brief = await get_Conversation_chain(
      vectorStore,
      `Given an invoice document, extract and summarize the essential aspects such as company name, products/services purchased, grand total, and any other significant details. Simply Gives In tailwind Formatting: 14px text size, black colour`
    );

    console.log("Answer", brief);

    res.json({
      message: "Files uploaded successfully",
      overview: brief,
    });
  }
);

app.post("/getAnswer", async (req, res) => {
  console.log(req.body);
  const { query } = req.body;
    const prompt = ` You are an expert in understanding invoices.
               You will receiveF input images as invoices &
               you will have to answer questions based on the input image.`
  console.log("query", query);
  const client = createClient(sbUrl, sbApiKey);
  const vectorStore = await ensureVectorStore(client, [], openAIApiKey, true);
  const conversation = await get_Conversation_chain(vectorStore, `${prompt} ${query}`);
  console.log("Answer", conversation);
  res.json({ message: "Answer Found Successfully", answer: conversation });
});


app.post("/uploadImage", upload.single("PDFdocs"), async (req, res) => {
  const PDFdocs = req.file;
  const { query } = req.body;
  console.log("query", query);
  console.log("image", PDFdocs);
  // Read the image file
  // const imageBase64 = await convertImageToBase64(PDFdocs.path); 

  // // Construct the prompt with the image and query
  const prompt = ` You are an expert in understanding invoices.
               You will receiveF input images as invoices &
               you will have to answer questions based on the input image.`

  
  const generationConfig = {
    maxOutputTokens: 200,
    temperature: 0,
    topP: 0.1,
    topK: 16,
  };
  const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig,
  });
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text;
  console.log(response);
  console.log(text);

  if (response.ok) {
    const jsonResponse = await response.json();
    fs.unlink(PDFdocs.path, (err) => {
      if (err) {
        console.error("There was an error:", err);
      } else {
        console.log("File was deleted successfully");
      }
    });
    console.log(jsonResponse.choices[0].text); // Output or process the generated text
  } else {
    fs.unlink(PDFdocs.path, (err) => {
      if (err) {
        console.error("There was an error:", err);
      } else {
        console.log("File was deleted successfully");
      }
    });
    console.error("Failed to call OpenAI API:", response.statusText);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
