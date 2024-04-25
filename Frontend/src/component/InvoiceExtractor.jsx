import React, { useState } from 'react';

const InvoiceExtractor = () => {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleExtractClick = () => {
    // Logic for extracting information from the file and text input
    // and setting the result
    setResult('Extracted information will be displayed here');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Invoice Extractor</h1>
      <div className="flex mb-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="border border-gray-300 px-4 py-2 mr-4 rounded-lg"
        />
        <input
          type="text"
          value={textInput}
          onChange={handleTextInputChange}
          placeholder="Enter additional information"
          className="border border-gray-300 px-4 py-2 mr-4 rounded-lg"
        />
        <button
          onClick={handleExtractClick}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Extract
        </button>
      </div>
      <div className="border border-gray-300 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Result</h2>
        <div>{result}</div>
      </div>
    </div>
  );
};

export default InvoiceExtractor;
