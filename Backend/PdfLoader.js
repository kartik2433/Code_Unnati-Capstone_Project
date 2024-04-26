const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const Tesseract = require("tesseract.js");
// import { env } from "./config";

 async function getChunkedDocsFromPDF(PATH) {
  try {
    const loader = new PDFLoader(PATH);
    const docs = await loader.load();
    console.log();

    // From the docs https://www.pinecone.io/learn/chunking-strategies/
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 70,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);
console.log("chunkedDocs",chunkedDocs);
    return chunkedDocs;
  } catch (e) {
    console.error(e);
    throw new Error("PDF docs chunking failed !");
  }
}

async function getChunkedDocsFromImage (PATH) {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 70,
    });
   const data = await Tesseract.recognize(
      PATH, // replace with your image path
      "eng", // language
      { logger: (m) => console.log(m) } // optional - logs progress
    )
    console.log(data)
        // console.log(text); // logs the extracted text
        // const chunkedDocs = await textSplitter.splitDocuments(text);
        // console.log("chunkedDocs",chunkedDocs);
        return data;
  } catch (e) {
    console.error(e);
    throw new Error("Image docs chunking failed !");
  }
}
module.exports = { getChunkedDocsFromPDF, getChunkedDocsFromImage };