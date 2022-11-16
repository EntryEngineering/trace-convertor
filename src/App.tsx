import dateFormat from 'dateformat';
import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  let fileReader: FileReader;
  const [link, setLink] = useState<HTMLAnchorElement | null>(null);
  const [inputFileName, setInputFileName] = useState<string>("");
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [output, setOutput] = useState<string>("");

  const handleFileRead = () => {
    if (fileReader.result) convert(fileReader.result.toString());
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file: File = e.target.files[0];
      if (file.name.endsWith(".trc")) {
        const newFileName = file.name.slice(0, -4);
        setInputFileName(newFileName);
        fileReader = new FileReader();
        fileReader.onloadend = handleFileRead;
        fileReader.readAsText(file);
      }
    }
    e.target.value = '';
  }

  const parseStartTime = (input: string) => {
    const date = input.split(" ")[0];
    const time = input.split(" ")[1];
    const seconds = time.split(":")[2];
    const year = parseInt(date.split(".")[2]);
    const month = parseInt(date.split(".")[1]);
    const day = parseInt(date.split(".")[0]);
    const hour = parseInt(time.split(":")[0]);
    const minute = parseInt(time.split(":")[1]);
    const second = parseInt(seconds.split(".")[0]);
    const ms = parseInt(seconds.slice(seconds.indexOf('.') + 1));
    const dateObject = new Date(year, month, day, hour, minute, second, ms);
    return dateObject;
  }

  const convert = (text: string) => {
    let result = "";
    const lines = text.split(/\r?\n/);
    const startTimeString = lines[4].split(": ")[1]
    const date = dateFormat(parseStartTime(startTimeString), "ddd mmm dd HH:MM:ss.l tt yyyy");
    result += "date " + date + "\n";
    result += "base hex  timestamps absolute\ninternal events logged\n";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      let resultLine = "";
      if (line.startsWith(";")) continue;
      const lineData = line.split(/\s+/);
      if (lineData[2] === "DT") {
        resultLine += "   " + (parseFloat(lineData[1]) / 1000).toString().substring(0, 8); //time ms
        while (resultLine.length < 11) resultLine += " ";
        resultLine += " 1"; // channel id
        resultLine += "  " + lineData[3];
        for (let j = 0; j < (16 - lineData[3].length); j++) resultLine += " ";
        resultLine += lineData[4]; // Rx/Tx
        resultLine += "   d ";
        resultLine += lineData[5];
        for (let j = 6; j < (lineData.length); j++) resultLine += " " + lineData[j];
        result += resultLine + "\n";
      }
    }
    setOutput(result);
  }

  useEffect(() => {
    if ((output.length > 0) && (inputFileName.length > 0)) {
      const fileName = inputFileName + ".asc";
      const blob = new Blob([output]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      setLink(link);
      setOutputFileName(fileName);
    }
  }, [output, inputFileName])

  const handleDownload = () => {
    if (link) {
      link.click();
    }
  }

  return (
    <div className="App">
      <div className="content">
        <input type="file" accept='.trc' onChange={handleFileInputChange}></input>
        {(link) && (
          <div className="downloadWrapper">
            <button className="downloadButton" key="submit" onClick={handleDownload}>Stáhnout</button>
            <div className="fileName">{outputFileName}</div>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
