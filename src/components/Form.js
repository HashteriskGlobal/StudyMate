import React, { useEffect, useState, useCallback } from "react";
import Module from "./Module";
import Book from "./Book";
import * as pdfjsLib from "pdfjs-dist";
import { storage } from "../firebase-config";
import { auth } from "../firebase-config";
import swal from "sweetalert";
import "../css/form.css";
import constants from "./constants";

function Form() {
  const [university, setUniversity] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [showModule, setShowModule] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pdfExists, setPdfExists] = useState(false);
  const [syllabus, setSyllabus] = useState({topics:{module1:[],module2:[],module3:[],module4:[],module5:[]}});
  let datas ;

  useEffect(() => {
    if (university) {
      setSubjectCode("");
    }
  }, [university]);

  useEffect(() => {
    const checkPdfExists = async () => {
      const userId = auth.currentUser.uid;
      const pdfPath1 = storage.ref().child(`pdfs/${subjectCode}.pdf`);
      const pdfPath2 = storage.ref().child(`pdfs/${userId}/${subjectCode}.pdf`);

      try {
        await pdfPath1.getDownloadURL();
        await pdfPath2.getDownloadURL();
        setPdfExists(true);
      } catch (error) {
        setPdfExists(false);
      }
    };

    checkPdfExists();
  }, [subjectCode]);

  const handleUniversityChange = (event) => {
    setUniversity(event.target.value);
  };

  const handleSubjectCodeChange = (event) => {
    const code = event.target.value.toUpperCase();
    setSubjectCode(code);
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setShowModule(true);
    setShowBook(true);
    console.log("Subject Code is:", subjectCode);
    console.log("Selected university is:", university);

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.6.172/pdf.worker.js";

    const pdfPath1 = storage.ref().child(`pdfs/${subjectCode}.pdf`);
    const pdfPath2 = storage
      .ref()
      .child(`pdfs/${auth.currentUser.uid}/${subjectCode}.pdf`);

    let pdf;

    try {
      const url1 = await pdfPath1.getDownloadURL();
      const loadingTask1 = pdfjsLib.getDocument(url1);
      pdf = await loadingTask1.promise;
    } catch (error) {
      try {
        const url2 = await pdfPath2.getDownloadURL();
        const loadingTask2 = pdfjsLib.getDocument(url2);
        pdf = await loadingTask2.promise;
      } catch (error) {
        console.error("Error:", error);
        swal(
          "The PDF is not available in our database.",
          "Please upload PDF.",
          "error"
        );
        setErrorOccurred(true);
        return;
      }
    }

    const numPages = pdf.numPages;
    const textPromises = [];

    let isContinueSyllabus = false;
    let isContinueModules = {1 : false, 2 : false, 3 : false, 4 : false, 5 : false, 6 : false};
    let isContinueTextbook = false;
    let isContinueReferences = false;
    let module1 = "";
    let module2 = "";
    let module3 = "";
    let module4 = "";
    let module5 = "";
    let module6 = "";
    let references = "";
    let textbooks = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        await pdf.getPage(i)
        .then(async page => {
            await page.getTextContent()
            .then(textContent => {
                for (let i = 0; i < textContent.items.length; i++) {
                    if(constants.syllabusCourseCode.test(textContent.items[i].str)){
                        if(textContent.items[i].str.split(constants.syllabusCourseCode).filter(item => item.length>0 && !constants.zeroCharacter.test(item)).length > 0)
                          setSyllabus(oldSyllabus => { return {...oldSyllabus, courseCode : textContent.items[i].str.split(constants.syllabusCourseCode).filter(item => item.length>0 || !constants.zeroCharacter.test(item))[0]}});
                        else{
                            for(i; i<textContent.items.length && constants.zeroCharacter.test(textContent.items[i].str); i++);
                            setSyllabus(oldSyllabus => { return {...oldSyllabus, courseCode : textContent.items[++i].str}});
                        }
                    }
                    if(constants.syllabusCourseName.test(textContent.items[i].str)){
                        if(textContent.items[i].str.split(constants.syllabusCourseName).filter(item => item.length>0 && !constants.zeroCharacter.test(item)).length > 0)
                          setSyllabus(oldSyllabus => { return {...oldSyllabus, courseName : textContent.items[i].str.split(constants.syllabusCourseName).filter(item => item.length>0 || !constants.zeroCharacter.test(item))[0]}});
                        else{
                            for(i; i<textContent.items.length && constants.zeroCharacter.test(textContent.items[i].str); i++);
                              setSyllabus(oldSyllabus => { return {...oldSyllabus, courseName : textContent.items[++i].str}});
                        }
                    }
                    if(constants.syllabus.test(textContent.items[i].str) || isContinueSyllabus){
                        isContinueSyllabus = true;
                        for(i; i<textContent.items.length && isContinueSyllabus; i++){ //removed i++ if needed do a if clause for textContent.items[i].str 's test flag
                            if(!constants.zeroCharacter.test(textContent.items[i].str)){
                                if(constants.module1.test(textContent.items[i].str) || isContinueModules[1] ){
                                    isContinueModules[1] = true;
                                    for(i++; i<textContent.items.length; i++){
                                        if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                                        if(constants.module2.test(textContent.items[i].str)){
                                            isContinueModules[1] = false;
                                            i--;
                                            break;
                                        }
                                        module1 += ` ${textContent.items[i].str}`;
                                    }
                                    if(module1.search(constants.hours) != -1){
                                        let j;
                                        for(j=module1.search(constants.hours); j<module1.length && module1.charAt(j) !== ')'; j++);
                                        j++;
                                        module1 = module1.slice(j);
                                    }
                                    setSyllabus(oldSyllabus => { return {...oldSyllabus, topics: {...oldSyllabus.topics, module1: module1.split(/-|\.|–|,|–/)}}});
                                }
                                else if(constants.module2.test(textContent.items[i].str) || isContinueModules[2] ){
                                    isContinueModules[2] = true;
                                    for(i; i<textContent.items.length; i++){
                                        if(constants.module2.test(textContent.items[i].str)) continue;
                                        if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                                        if(constants.module3.test(textContent.items[i].str)){
                                            isContinueModules[2] = false;
                                            i--;
                                            break;
                                        }
                                        module2 += ` ${textContent.items[i].str}`;
                                    }
                                    if(module2.search(constants.hours) != -1){
                                        let j;
                                        for(j=module2.search(constants.hours); j<module2.length && module2.charAt(j) !== ')'; j++);
                                        j++;
                                        module2 = module2.slice(j);
                                    }
                                    setSyllabus(oldSyllabus => { return {...oldSyllabus, topics: {...oldSyllabus.topics, module2: module2.split(/-|\.|–|,|–/)}}});
                                }
                                else if(constants.module3.test(textContent.items[i].str) || isContinueModules[3] ){
                                    isContinueModules[3] = true;
                                    for(i; i<textContent.items.length; i++){
                                        if(constants.module3.test(textContent.items[i].str)) continue;
                                        if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                                        if(constants.module4.test(textContent.items[i].str)){
                                            isContinueModules[3] = false;
                                            i--;
                                            break;
                                        }
                                        module3 += ` ${textContent.items[i].str}`;
                                    }
                                    if(module3.search(constants.hours) != -1){
                                        let j;
                                        for(j=module3.search(constants.hours); j<module3.length && module3.charAt(j) !== ')'; j++);
                                        j++;
                                        module3 = module3.slice(j);
                                    }
                                    setSyllabus(oldSyllabus => { return {...oldSyllabus, topics: {...oldSyllabus.topics, module3: module3.split(/-|\.|–|,|–/)}}});
                                }
                                else if(constants.module4.test(textContent.items[i].str) || isContinueModules[4] ){
                                    isContinueModules[4] = true;
                                    for(i; i<textContent.items.length; i++){
                                        if(constants.module4.test(textContent.items[i].str)) continue;
                                        if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                                        if(constants.module5.test(textContent.items[i].str)){
                                            isContinueModules[4] = false;
                                            i--;
                                            break;
                                        }
                                        module4 += ` ${textContent.items[i].str}`;
                                    }   
                                    if(module4.search(constants.hours) != -1){
                                        let j;
                                        for(j=module4.search(constants.hours); j<module4.length && module4.charAt(j) !== ')'; j++);
                                        j++;
                                        module4 = module4.slice(j);
                                    }
                                    setSyllabus(oldSyllabus => { return {...oldSyllabus, topics: {...oldSyllabus.topics, module4: module4.split(/-|\.|–|,|–/)}}});
                                }
                                else if(constants.module5.test(textContent.items[i].str) || isContinueModules[5] ){
                                    isContinueModules[5] = true;
                                    for(i; i<textContent.items.length; i++){
                                        if(constants.module5.test(textContent.items[i].str)) continue;
                                        if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                                        if(constants.module6.test(textContent.items[i].str) || constants.textbooks.test(textContent.items[i].str)){
                                            isContinueModules[5] = false;
                                            if(constants.textbooks.test(textContent.items[i].str)) isContinueSyllabus = false;
                                            console.log(isContinueSyllabus);
                                            i--;
                                            break;
                                        }
                                        module5 += ` ${textContent.items[i].str}`;
                                    }
                                    if(module5.search(constants.hours) != -1){
                                        let j;
                                        for(j=module5.search(constants.hours); j<module5.length && module5.charAt(j) !== ')'; j++);
                                        j++;
                                        module5 = module5.slice(j);
                                    }
                                    setSyllabus(oldSyllabus => { return {...oldSyllabus, topics: {...oldSyllabus.topics, module5: module5.split(/-|\.|–|,|–/)}}});
                                }
                                else if(constants.module6.test(textContent.items[i].str) || isContinueModules[6] ){
                                    isContinueModules[6] = true;
                                    for(i; i<textContent.items.length; i++){
                                        if(constants.module6.test(textContent.items[i].str)) continue;
                                        if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                                        if(constants.textbooks.test(textContent.items[i].str)){
                                            isContinueModules[6] = false;
                                            isContinueSyllabus = false;
                                            i--;
                                            break;
                                        }
                                        module6 += ` ${textContent.items[i].str}`;    
                                    }
                                    if(module6.search(constants.hours) != -1){
                                        let j;
                                        for(j=module6.search(constants.hours); j<module6.length && module6.charAt(j) !== ')'; j++);
                                        j++;
                                        module6 = module6.slice(j);
                                    }
                                    setSyllabus(oldSyllabus => { return {...oldSyllabus, topics: {...oldSyllabus.topics, module6: module6.split(/-|\.|–|,|–/)}}});
                                }
                            }
                        }
                    }
                    if(i<textContent.items.length && (constants.textbooks.test(textContent.items[i].str) || isContinueTextbook)){
                        isContinueTextbook = true;
                        for(i ;i<textContent.items.length && !constants.references.test(textContent.items[i].str); i++){
                            if(constants.textbooks.test(textContent.items[i].str)) continue;
                            if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                            textbooks += ` ${textContent.items[i].str.trim()}`; 
                        }
                        if(i<textContent.items.length && constants.references.test(textContent.items[i].str)) isContinueTextbook = false;
                        setSyllabus(oldSyllabus => { return {...oldSyllabus, textbooks : textbooks.split(constants.newItem).filter(item => item.length>0)}});
                    }if(i<textContent.items.length && (constants.references.test(textContent.items[i].str) || isContinueReferences)){
                        isContinueReferences = true;
                        for(i; i<textContent.items.length && !textContent.items[i].str.toLowerCase().includes("lecture schedule"); i++){
                            if(constants.references.test(textContent.items[i].str)) continue;
                            if(constants.zeroCharacter.test(textContent.items[i].str)) continue;
                            references += ` ${textContent.items[i].str.trim()}`; 
                        }
                        if(i<textContent.items.length && textContent.items[i].str.toLowerCase().includes("lecture schedule")) isContinueReferences = false;
                        setSyllabus(oldSyllabus => { return {...oldSyllabus, references : references.split(constants.newItem).filter(item => item.length>0)}});
                    }
                }
            })
        })

        
    }
  };
  datas = [
    { id: 1,
      name: "Module 1",
      topics: syllabus.topics.module1.map((item,index) => {return{id:index,name:item,videos:[{
        id: 1,
        title: "Introduction to Data Structures",
        url: "https://youtu.be/xLetJpcjHS0",
        thumbnail: "https://i.ytimg.com/vi/xLetJpcjHS0/hq720.jpg",
        views: "933K"
      },
      {
        id: 2,
        title: "Data Structures and Algorithms for Beginners",
        url: "https://youtu.be/BBpAmxU_NQo",
        thumbnail: "https://i.ytimg.com/vi/BBpAmxU_NQo/hq720.jpg",
        views: "1.3M"
      }]}})
    },
    { id: 2,
      name: "Module 2",
      topics: syllabus.topics.module2.map((item,index) => {return{id:index,name:item,videos:[{
        id: 1,
        title: "Introduction to Data Structures",
        url: "https://youtu.be/xLetJpcjHS0",
        thumbnail: "https://i.ytimg.com/vi/xLetJpcjHS0/hq720.jpg",
        views: "933K"
      },
      {
        id: 2,
        title: "Data Structures and Algorithms for Beginners",
        url: "https://youtu.be/BBpAmxU_NQo",
        thumbnail: "https://i.ytimg.com/vi/BBpAmxU_NQo/hq720.jpg",
        views: "1.3M"
      }]}})
    },
    { id: 3,
      name: "Module 3",
      topics: syllabus.topics.module3.map((item,index) => {return{id:index,name:item,videos:[{
        id: 1,
        title: "Introduction to Data Structures",
        url: "https://youtu.be/xLetJpcjHS0",
        thumbnail: "https://i.ytimg.com/vi/xLetJpcjHS0/hq720.jpg",
        views: "933K"
      },
      {
        id: 2,
        title: "Data Structures and Algorithms for Beginners",
        url: "https://youtu.be/BBpAmxU_NQo",
        thumbnail: "https://i.ytimg.com/vi/BBpAmxU_NQo/hq720.jpg",
        views: "1.3M"
      }]}})
    },
    { id: 4,
      name: "Module 4",
      topics: syllabus.topics.module4.map((item,index) => {return{id:index,name:item,videos:[{
        id: 1,
        title: "Introduction to Data Structures",
        url: "https://youtu.be/xLetJpcjHS0",
        thumbnail: "https://i.ytimg.com/vi/xLetJpcjHS0/hq720.jpg",
        views: "933K"
      },
      {
        id: 2,
        title: "Data Structures and Algorithms for Beginners",
        url: "https://youtu.be/BBpAmxU_NQo",
        thumbnail: "https://i.ytimg.com/vi/BBpAmxU_NQo/hq720.jpg",
        views: "1.3M"
      }]}})
    },
    { id: 5,
      name: "Module 5",
      topics: syllabus.topics.module5.map((item,index) => {return{id:index,name:item,videos:[{
        id: 1,
        title: "Introduction to Data Structures",
        url: "https://youtu.be/xLetJpcjHS0",
        thumbnail: "https://i.ytimg.com/vi/xLetJpcjHS0/hq720.jpg",
        views: "933K"
      },
      {
        id: 2,
        title: "Data Structures and Algorithms for Beginners",
        url: "https://youtu.be/BBpAmxU_NQo",
        thumbnail: "https://i.ytimg.com/vi/BBpAmxU_NQo/hq720.jpg",
        views: "1.3M"
      }]}})
    },
  ];
  console.log(datas);

  const handleFileUpload = async () => {
    if (file) {
      setUploading(true);
      const userId = auth.currentUser.uid;
      const pdfPath = storage.ref().child(`pdfs/${userId}/${subjectCode}.pdf`);

      try {
        await pdfPath.put(file);
        console.log("File uploaded successfully!");
        swal("File uploaded successfully", "", "success");
        setPdfExists(true);
      } catch (error) {
        console.error("Error while uploading file:", error);
        swal(
          "An error occurred while uploading the file. Please try again later.",
          "",
          "error"
        );
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div style={{ alignItems: "flex-start" }}>
      <br />
      <form onSubmit={handleFormSubmit}>
        <div className="input-group">
          <select
            value={university}
            onChange={handleUniversityChange}
            style={{ verticalAlign: "top" }}
            required
          >
            <option disabled value="">
              Select your University
            </option>
            <option value="ktu">
              APJ Abdul Kalam Technological University
            </option>
            <option value="mg">MG University</option>
            <option value="calicut">Calicut University</option>
          </select>
        </div>
        <br />
        {university && (
          <div className="input-group">
            <input
              type="text"
              name="subjcode"
              value={subjectCode}
              onChange={handleSubjectCodeChange}
              className="input"
              required
            />
            <label className="user-label">Subject Code</label>
          </div>
        )}

        {university && subjectCode && (
          <div id="submit-button">
            <button type="submit" id="submitbtn">
              Submit
            </button>
          </div>
        )}
      </form>

      {errorOccurred && (
        <div className="file-input-container">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            id="syllabus-upload"
            style={{ display: "none" }}
          />

          <label htmlFor="syllabus-upload" className="syllabus-label">
            Select your syllabus
          </label>
          <button onClick={handleFileUpload}>Upload</button>
        </div>
      )}

      {showModule && <Module modules={datas}/>}
      {showBook && <Book textbooks={syllabus.textbooks} references={syllabus.references}/>}
    </div>
  );
}

export default Form;
