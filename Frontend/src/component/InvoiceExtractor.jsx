import React, { useState } from 'react';
import {HashLoader} from 'react-spinners';

const InvoiceExtractor = () => {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState('');
  const [fileExtension, setFileExtension] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const handleFileChange = async(e) => {
    const selectedFile = e.target.files[0];
    const formData = new FormData();
    formData.append("PDFdocs", selectedFile);
    try{
      setLoading1(true);
      const res = await fetch('http://localhost:5000/upload', {
        method : 'POST',
        body : formData,
      });
      const data = await res.json();
      console.log(data);
      setResult(data.overview);
      setLoading1(false);
    }catch(e){
      setLoading1(false);
      setFile(null)
      // alert("Error While Uploading: Upload Once Again");
      console.log(e);
    }
    setFile(selectedFile);
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
    setResult('');
  };

  const handleExtractClick = async() => {

    try{
      
      setLoading2(true);

      const res = await fetch("http://localhost:5000/getAnswer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({query : textInput}),
      });
      const data = await res.json();
      console.log(data);
      setResult(data.answer);
      setLoading2(false);
    }catch(e){
      setLoading2(false);
      console.log(e);
    }
  };

    const handleImageExtractClick = async () => {

      const formData = new FormData();
      formData.append("PDFdocs", file);
      formData.append("query", textInput);
      try {
        setLoading2(true);

        const res = await fetch("http://localhost:5000/uploadImage", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        console.log(data);
        setResult(data.answer);
        setLoading2(false);
      } catch (e) {
        setLoading2(false);
        console.log(e);
      }
    };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Invoice Extractor</h1>
      <div className="flex mb-4">
        <div className="flex mr-2 border border-gray-300 px-4 py-2 mr-4 rounded-lg">
          <input
            type="file"
            accept=".pdf"
            onChange={(e)=>{
              const file = e.target.files[0];
              const fileName = file.name;
              const fileExtension = fileName.split(".").pop();
              if(fileExtension === "pdf"){
                handleFileChange(e);
              }else{
                setFile(file);
                setFileExtension(fileExtension);
              }
            }}
            className=""
          />
          {loading1 && (
            <div className="flex">
              <HashLoader color="#0000FF" size={25} />
            </div>
          )}
        </div>
        <input
          type="text"
          value={textInput}
          onChange={handleTextInputChange}
          placeholder="Enter additional information"
          className="border border-gray-300 px-4 py-2 mr-4 rounded-lg"
        />
        <button
          onClick={()=>{
            if(fileExtension === "pdf"){
              handleExtractClick();
            }else{
              handleImageExtractClick();
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Extract
        </button>
      </div>
      <div className="border border-gray-300 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Result</h2>
        {loading2 ? (
          <HashLoader color="#0000FF" size={30}/>
        ) : (
          <div>{result}</div>
        )}
      </div>
    </div>
  );
};

export default InvoiceExtractor;
