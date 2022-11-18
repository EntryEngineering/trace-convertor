import dateFormat from 'dateformat';
import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  let fileReader: FileReader;
  const [link, setLink] = useState<HTMLAnchorElement | null>(null);
  const [inputFileName, setInputFileName] = useState<string>("");
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isConverting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);

  const handleTrcFileRead = () => {
    if (fileReader.result) convertTrc(fileReader.result.toString());
  }

  const handleTraceFileRead = () => {
    if (fileReader.result) convertTrace(fileReader.result.toString());
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file: File = e.target.files[0];
      const lastIndex = file.name.lastIndexOf(".");
      const newFileName = file.name.slice(0, lastIndex);
      const ext = file.name.slice(lastIndex);
      if ((ext === ".trc") || (ext === ".trace")) {
        setInputFileName(newFileName);
        fileReader = new FileReader();
        setConversionProgress(0);
        setConverting(true);
        switch (ext) {
          case ".trc":
            fileReader.onloadend = handleTrcFileRead;
            break;
          case ".trace":
            fileReader.onloadend = handleTraceFileRead;
            break;
        }
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

  const convertTrace = (text: string) => {
    let result = "";
    const lines = text.split(/\r?\n/);
    const lineCount = lines.length;
    const startTimeString = lines[1].split(": ")[1];
    const date = dateFormat(new Date(startTimeString), "ddd mmm dd HH:MM:ss.l tt yyyy")
    result += "date " + date + "\n";
    result += "base hex  timestamps absolute\ninternal events logged\n";

    let actPerc = 0;
    for (let i = 0; i < lines.length; i++) {
      let perc = Math.round(100 / (lineCount / i));
      if (perc > actPerc) {
        actPerc = perc;
        setConversionProgress(perc);
      }
      const line = lines[i].trim();
      if (line.startsWith(";")) continue;
      const lineData = line.split(/\s+/);
      if (lineData[0].endsWith(":")) {
        const data: string[] = [];
        for (let j = 5; j < (5 + parseInt(lineData[4])); j++) {
          data.push(lineData[j])
        }
        const resultLine = writeLine((parseFloat(lineData[1]) / 1000), "1", lineData[3], lineData[2], parseInt(lineData[4]), data);
        result += resultLine + "\n";
      }
    }
    setOutput(result);
  }

  const convertTrc = (text: string) => {
    let result = "";
    const lines = text.split(/\r?\n/);
    const lineCount = lines.length;
    const startTimeString = lines[4].split(": ")[1];
    const date = dateFormat(parseStartTime(startTimeString), "ddd mmm dd HH:MM:ss.l tt yyyy");
    result += "date " + date + "\n";
    result += "base hex  timestamps absolute\ninternal events logged\n";

    let actPerc = 0;
    for (let i = 0; i < lines.length; i++) {
      let perc = Math.round(100 / (lineCount / i));
      if (perc > actPerc) {
        actPerc = perc;
        setConversionProgress(perc);
      }
      const line = lines[i].trim();
      if (line.startsWith(";")) continue;
      const lineData = line.split(/\s+/);
      if (lineData[2] === "DT") {
        const data: string[] = [];
        for (let j = 6; j < (6 + parseInt(lineData[5])); j++) {
          data.push(lineData[j])
        }
        const resultLine = writeLine((parseFloat(lineData[1]) / 1000), "1", lineData[3], lineData[4], parseInt(lineData[5]), data);
        result += resultLine + "\n";
      }
    }
    setOutput(result);
  }

  const writeLine = (time: number, channel: string = "1", id: string, direction: string, dataLength: number, data: string[]) => {
    let line = ""
    const timeString = time.toString().substring(0, 8);
    line += "   " + timeString;
    while (line.length < 11) line += " ";
    line += " " + channel + "  " + id;
    for (let i = 0; i < (16 - id.length); i++) line += " ";
    line += direction + "   d " + dataLength;
    for (let i = 0; i < dataLength; i++) {
      line += " " + data[i];
    }
    return line;
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
      setConverting(false);
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
        <input type="file" accept=".trc,.trace" onChange={handleFileInputChange}></input>
        {(link) && (
          <div className="downloadWrapper">
            <button className="downloadButton" key="submit" onClick={handleDownload}>Stáhnout</button>
            <div className="fileName">{outputFileName}</div>
          </div>
        )}
        {isConverting && (
          <div className="progress">
            <div className="progressBar" style={{ width: conversionProgress + '%' }}></div>
            <span className="percentage">{conversionProgress + "%"}</span>
          </div>)}
      </div>

    </div>
  );
}

export default App;
