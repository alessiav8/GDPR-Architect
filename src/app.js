import BpmnJS from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import BpmnModdle from 'bpmn-moddle';
import BpmnModeler from 'bpmn-js/lib/Modeler';
const zeebeModule = require('zeebe-bpmn-moddle/resources/zeebe.json');
import {getNewShapePosition} from 'bpmn-js/lib/features/auto-place/BpmnAutoPlaceUtil.js';
import camundaModdle from "camunda-bpmn-moddle/resources/camunda.json";


import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { query, classes } from "min-dom";

import disableModeling from "./DisableModeling";

import diagram from '../resources/diagram.bpmn';
import diagram_two_activities from '../resources/diagram_two_activities.bpmn';
import consent_to_use_the_data from '../resources/consent_to_use_the_data.bpmn';

import { yesdropDownA, nodropDownA,yesdropDownB,nodropDownB } from './questions.js';
import { createDropDown, removeUlFromDropDown, closeSideBarSurvey, getMetaInformationResponse,isGdprCompliant,setGdprButtonCompleted,setJsonData } from './support.js';

var MetaPackage = require('./metaInfo.json');
var current_diagram = diagram_two_activities;

var moddle = new BpmnModdle({ camunda: camundaModdle });

const second_viewer = new BpmnModeler({
  moddleExtensions: {
  zeebe: zeebeModule
  }
});

var viewer = new BpmnJS({
    container: '#canvas',
    moddleExtensions: {
        meta: MetaPackage
    },
    additionalModules: [disableModeling]

});

//statements
const export_button=document.getElementById('export_button');
const import_button=document.getElementById('import_button');
const gdpr_button=document.getElementById('gdpr_compliant_button');
const canvas_raw=document.getElementById('canvas_raw');
const canvas= document.getElementById('canvas');
const canvas_col=document.getElementById('canvas_col');
const survey_col=document.getElementById('survey_col');
const over_canvas=document.getElementById('over_canvas');
const edit= document.getElementById("mode");

var elementFactory;
var modeling;
var elementRegistry;
var canvas_ref;
var eventBus;
var overlays;
var modeler;
var search = new URLSearchParams(window.location.search);
var browserNavigationInProgress;
var questions_answers;

var search = new URLSearchParams(window.location.search);
var browserNavigationInProgress;

//gdpr questions
const YA=document.getElementById('yes_dropDownA');
const NA=document.getElementById('no_dropDownA');
//end gdpr questions

//

//questa funzione mi ritorna true se esiste un extended element che ha un tag meta al suo interno
function getExtension(element, type) {
  if (!element.extensionElements) {
    return null;
  }
  if (Array.isArray(element.extensionElements)) {
    return element.extensionElements.some(function(e) {
      return e.values.some(function(meta) {
        return meta.$instanceOf(type);
      });
    });
  } else {
    return element.extensionElements.values.some(function(meta) {
      return meta.$instanceOf(type);
    });
  }
}
//

//function that loads the first diagram displayed at every load
document.addEventListener('DOMContentLoaded', async function () {
    await loadDiagram(diagram_two_activities);
});
// end function to load the first diagram 

//function to load the diagram through importXML
async function loadDiagram(diagram){
    try {
      const res = viewer.importXML(diagram)
          .then(async () => {
              viewer.get('canvas').zoom('fit-viewport');
              elementFactory = viewer.get('elementFactory');
              modeling = viewer.get('modeling');
              elementRegistry=viewer.get('elementRegistry');
              changeID();
              checkMetaInfo();
              canvas_ref = viewer.get('canvas');
              eventBus = viewer.get('eventBus');
              overlays = viewer.get('overlays');
            
              getMetaInformationResponse().then((response)=>{
                questions_answers = response;
                if(questions_answers["gdpr_compliant"] == true){
                  setGdprButtonCompleted();
                }
              })
            

              /*canvas_ref.addLayer('root_1', {
                position: 1 
              });*/
          
              //handle the remotion of a gdpr path
              viewer.on('shape.removed', function(event) {

                var element = event.element;
                if(element.type==="bpmn:CallActivity"){
                  const name=element.businessObject.id;
                 
                  getMetaInformationResponse().then((response)=>{

                  if (name.startsWith("consent")){
                    const questionB = response["questionB"];
                    var activity_id = name.split("_")[1]+"_"+name.split("_")[2];
                    const new_meta = questionB.filter(element => element.id!="response" && element.id != activity_id);
                    console.log("new_meta",new_meta);
                    editMetaInfo("B",setJsonData("No",new_meta));
                  }
                  else if(name.startsWith("")){
                  }
                  reorderDiagram();
                })
              }
              });
              //
              
              console.log("default layer",canvas_ref.getDefaultLayer());
              console.log(canvas_ref.getLayer("sub_layer",1));
              console.log(canvas_ref.getActiveLayer());


          })
          .catch(error => {
              console.error('Errore nell\'importazione dell\'XML:', error);
          });

  } catch (err) {
      console.error('Si è verificato un errore:', err);
  }
}
//end function to load the diagram 

//function create backArrow subProcess
function backArrowSubProcess(){
  gdpr_button.disabled=true;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", "50");
  svg.setAttribute("height", "50");
  svg.setAttribute("fill", "#2CA912");
  svg.setAttribute("class", "bi bi-arrow-left");
  svg.setAttribute("viewBox", "0 0 16 16");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute("d", "M4.354 8.354a.5.5 0 0 1 0-.708l3.293-3.293a.5.5 0 0 1 .708.708L5.707 8l2.648 2.647a.5.5 0 0 1-.708.708l-3.293-3.293a.5.5 0 0 1 0-.708z");

  svg.appendChild(path);

  var closeBtn = document.createElement('span');
  closeBtn.classList.add('close-btn');
  closeBtn.style.marginBottom="4vh";
  closeBtn.style.marginLeft="4vh";
  

  closeBtn.prepend(svg);

  over_canvas.appendChild(closeBtn);

  closeBtn.addEventListener("click", ()=>{
    loadDiagram(current_diagram);
    over_canvas.removeChild(closeBtn);
    gdpr_button.disabled = false;
  });


}
//

//function to change the ID for the mainProcess
function changeID(){
  const processElement = elementRegistry.filter(element => {
    return element.type === 'bpmn:Process' && element.parent==null ; 
  }).pop();
  console.log(processElement)
  if (processElement) {
    const newProcessId = 'Main_Process';
    modeling.updateProperties(processElement, {
      id: newProcessId
    });
  } else {
    console.error('Il processo con l\'ID specificato non è stato trovato.');
  }
}
//

//Function to check if already have the gdpr marks or add it
function checkMetaInfo(){
  const Mod = viewer._moddle;
  const processElements = getProcessElement();
  if (processElements.length > 0) {
      var firstProcessElement = processElements[0];
      var processBusinessObject = firstProcessElement.businessObject;
      var processExtension = getExtension(processBusinessObject, 'meta:ModelMetaData');
      //the function returns the business object
      if (processExtension) {
          console.log("already have an extention",processExtension);
          return processBusinessObject.extensionElements;
      } else {
          const meta = Mod.create('meta:ModelMetaData');
          processBusinessObject.extensionElements = Mod.create('bpmn:ExtensionElements');
          processBusinessObject.extensionElements.get('values').push(meta);
          meta.gdpr_compliant = false;
          console.log("not have an extention",processBusinessObject.extensionElements);
          return processBusinessObject.extensionElements;
      }
    } else {
          console.log("Nessun processo trovato nel diagramma.");
    }
}
//end checkMetaInfo 


//TODO: Può esserci più di un processo? 

//Function to get the element process without knowing the ID
function getProcessElement(){
  var allElements = viewer.get('elementRegistry').getAll();

  var processElements = allElements.filter(function(element) {
      return element.type === 'bpmn:Process';
  });
  return processElements;
}
//end function to get the element process

//function to edit MetaInfo
function editMetaInfo(question,value_to_assign){

  const businessObject = checkMetaInfo();
  if (businessObject && businessObject.values.length > 0) {
    businessObject.values.forEach(value => {
      if (value.$type === 'meta:ModelMetaData') {
        switch (question) {
          case 'A':
            value.questionA=value_to_assign;
            break;
          case 'B':
            value.questionB=value_to_assign;
            break;
          case "gdpr":
            value.gdpr_compliant=value_to_assign;
          default:
            break;
        }
      }
    });
  }

  return;

}
//

//export handler 
export_button.addEventListener('click', function () {
  try{
    closeSideBarSurvey();
    handleSideBar(false);
  }
  catch(e){
    console.log("Error",e);
  }

  var container = document.getElementById('canvas');

  var background_container = document.createElement('div');
  background_container.classList="background-container";

  var popup = document.createElement('div');
  popup.classList.add('popup');

  var what_is=document.createElement('div');
  what_is.innerHTML="<strong>Insert a title for the diagram</strong>";
  what_is.style.marginLeft="20%"


  popup.appendChild(what_is);

  var inputText = document.createElement('input');
  inputText.setAttribute('type', 'text');
  inputText.setAttribute('placeholder', 'Insert the title');
  inputText.setAttribute('value', 'Diagram');
  inputText.style.marginTop="1.8vh";


  popup.appendChild(inputText);

  var confirmBtn = document.createElement('button');
  confirmBtn.classList.add('btn-popup');
  confirmBtn.style.backgroundColor = '#10ad74';
  confirmBtn.style.textSize='1vh';
  confirmBtn.textContent = 'Confirm and export';

  popup.appendChild(confirmBtn);

  var closeBtn = document.createElement('span');
    closeBtn.classList.add('close-btn');
    closeBtn.textContent = 'X';
    closeBtn.style.marginBottom="0.4vh";
  popup.appendChild(closeBtn);

    
  background_container.appendChild(popup);  
  container.appendChild(background_container);


  background_container.addEventListener('click', function(event) {
    const target_=event.target
    if(target_.className=="background-container"){
      container.removeChild(background_container);
    }
  });
  closeBtn.addEventListener('click', function() {
    event.stopPropagation();
    container.removeChild(background_container); 
  });
  confirmBtn.addEventListener('click', function() {
    event.stopPropagation();
    var title = inputText.value;
    exportDiagram(title);    
    container.removeChild(background_container); 
  });

});
//part where i actually generate the xml file
function exportDiagram(title){

  viewer.saveXML({ format: true })
  .then(({ xml, error }) => {
      if (error) {
          console.log(error);
      } else {
          console.log("exportDiagram",xml);
          download(xml, title + '.bpmn', 'text/xml');
      }
  })
  .catch(error => {
      console.log(error);
  });
}

function download(content, filename, contentType) {
  var a = document.createElement('a');
  var file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
}
//

//in order to make visible and invisible the label over the export button
export_button.addEventListener('mouseover', () =>{
  document.getElementById("label_export_button").innerHtml = "Export";
});

export_button.addEventListener('mouseout', () =>{
  document.getElementById("label_export_button").innerHtml = "";
});
//
//end export handler


//import handler
import_button.addEventListener('mouseover', () =>{
  document.getElementById("label_import_button").innerHtml = "Import";
});

import_button.addEventListener('mouseout', () =>{
  document.getElementById("label_import_button").innerHtml = "";
});

import_button.addEventListener('click', () =>{
  var input = document.createElement('input');
  input.type = 'file';

  input.addEventListener('change', function(event) {
  var diagram_imported = event.target.files[0];
  if (diagram_imported) {
      const reader = new FileReader();
      reader.onload = function(event) {
          const fileXML = event.target.result;
          loadDiagram(fileXML);
          eventBus.fire("TOGGLE_MODE_EVENT", {
            exportMode: false 
          });       
          edit.textContent = "Edit Mode";
            };
      reader.readAsText(diagram_imported);
      }
    })

    input.click();
    try{
      closeSideBarSurvey();
      handleSideBar(false);
    }
    catch(e){
      console.log("Error",e);
    }
});
//end import handler 


// gdpr compliance button
gdpr_button.addEventListener('click', () => {

  viewer.get('canvas').zoom('fit-viewport');

  handleSideBar(true);
  /*hide the panel and inform the user
  eventBus.fire("TOGGLE_MODE_EVENT", {
    exportMode: true 
  });  
  mode.textContent = "GDPR Mode"
  window.alert("You are now in GDPR mode, and the editor is disabled. \n If you want to edit again, you must close the GDPR panel.");
  */

  const mainColumn = document.querySelector('.main-column');
  const sidebarColumn = document.querySelector('.sidebar-column');
  const canvasRaw = document.querySelector('#canvas-raw');
  const spaceBetween=document.querySelector('.space-between');

  if(!document.getElementById("survey_area")){
    // Aggiorna le larghezze delle colonne
    mainColumn.style.width = '74.8%';
    sidebarColumn.style.width = '23.8%';
    sidebarColumn.style.marginLeft="0.5%";

    sidebarColumn.style.height = canvas.clientHeight + 'px';
    sidebarColumn.style.marginTop = '1vh';
    sidebarColumn.style.borderRadius="4px"

    //start survey area handler
    const survey_area = document.createElement('div');
    survey_area.id="survey_area";
    survey_col.appendChild(survey_area);

    const close_survey = document.createElement('span');
    close_survey.classList.add('close-btn');
    close_survey.textContent = 'X';
    close_survey.style.marginTop="2.5vh";
    close_survey.style.marginRight="3.5vh"

    close_survey.addEventListener('click', () => {
     closeSideBarSurvey();
     handleSideBar(false);
     /*eventBus.fire("TOGGLE_MODE_EVENT", {
      exportMode: false 
    });       
    edit.textContent = "Edit Mode";*/
    });

    survey_area.appendChild(close_survey);

    const title = "GDPR compliance";
    const textNode = document.createTextNode(title);

    const divTitle = document.createElement("div");
    divTitle.className = "container-centered";
    divTitle.style.marginTop="4vh";
    divTitle.style.marginBottom="2vh";
    divTitle.style.fontWeight = 'bold';
    divTitle.style.fontSize = '2vh';

    divTitle.appendChild(textNode);
    survey_area.appendChild(divTitle);

    const areaDropDowns= document.createElement("div");
    areaDropDowns.className = "container";
    areaDropDowns.id="areaDropDowns";
    survey_area.appendChild(areaDropDowns)

    checkQuestion();
  }

});
//end gdpr handler

//function to generete the right questions dropdown
async function checkQuestion() {
  try {
    const response = await getMetaInformationResponse();
    //const setOfQuestions=["A", "B", "C", "D", "E", "F","G","H", "I", "L"];

    console.log("result of questions", response);
    questions_answers = response;
    if (questions_answers["questionA"] === null) {
      createDropDown("dropDownA", true, "Personal data", "Do you handle personal data in your process?");
    } else {
      for (let key in questions_answers) {

        if (key === "questionA") {
          const risp = questions_answers["questionA"][0].value;
          if (risp === "Yes") {
            await yesdropDownA();
          } else {
            await nodropDownA();
          }
        } 
        
        else if (key === "questionB" && questions_answers[key] !== null) {
          const risp = questions_answers["questionB"][0].value;
          if (risp === "Yes") {
            yesdropDownB();
          } else {
            var B = questions_answers.questionB;
            B = B.filter(item => item.value !== 'No');
            nodropDownB(B);
          }
        } else if (key === "questionI" && questions_answers[key] !== null) {
        } else if (key === "questionH" && questions_answers[key] !== null) {
        } else if (key === "questionG" && questions_answers[key] !== null) {
        } else if (key === "questionF" && questions_answers[key] !== null) {
        } else if (key === "questionE" && questions_answers[key] !== null) {
        } else if (key === "questionD" && questions_answers[key] !== null) {
        } else if (key === "questionC" && questions_answers[key] !== null) {
        } else if (key === "questionL" && questions_answers[key] !== null) {
        }
      }
    }
  } catch (error) {
    console.error('Error fetching meta information:', error);
  }
}

//

//function to get the diagram
function getDiagram() {
  return new Promise((resolve, reject) => {
      viewer.saveXML({ format: true, preamble: false })
          .then(({ xml, error }) => {
              if (error) {
                  console.log(error);
                  reject(error); 
              } else {
                  resolve(xml); 
              }
          })
          .catch(error => {
              console.log(error);
              reject(error); 
          });
  });
}
//

//TODO: maybe to remove
//function to push the diagram
function pushDiagram(diagram) {
  try{
    console.log("pushDiagram",diagram);
    console.log("def",viewer.getDefinitions());
    console.log("def",viewer.setDefinitions("meta","metaInfo"))
    console.log(viewer.getDefinitions());
    viewer.importXML(diagram);
    viewer.get('canvas').zoom('fit-viewport');

  }
  catch(error){
    console.error("Error in importing xml",error);
  }
}
//

//TODO: remodel it because if there are collaborations we have a problem :(
//function to get the main process
function getMainProcess(){
  const mainProcess = elementRegistry.filter(element => {
    return element.type === 'bpmn:Process' && element.id == 'Main_Process'; 
  });
  return mainProcess.pop();
}
//

//function to check if the id is unique
function checkUniqueID(id){
  console.log("checkUniqueID",id);
  try{
    elementRegistry = viewer.get('elementRegistry');
    const uniqueID = elementRegistry.get(id);
    console.log(" searching for id: ",id,"is unique?", uniqueID)
    if(uniqueID){
      const parse = id.split('_');
      const name=parse[0];

      const elementNumber = parseInt(parse[1]);
      const nextElementNumber = elementNumber + 1;
      const nextID = `${parse[0]}_${nextElementNumber}`;
      return nextID;
      }
    else{
      return id;
    }

  }
  catch(error){
    console.log("Error in checking unique id");
  }
}
//

//funtion to create the subprocess for the questions
//id: id of the subprocess, content_label: the label is visualized in the subprocess,
//diagram_to_import: the diagram that will be inserted into the subprocess
async function subProcessGeneration(id_passed, content_label, diagram_to_import) {
  try {
    const id = id_passed;
    const elementRegistry = viewer.get('elementRegistry');
    const not_exists = elementRegistry.get(id_passed) == undefined ;

    if(not_exists){
      const subprocess = elementFactory.createShape({
        type: 'bpmn:CallActivity',
        id: id,
        name: content_label,
        isExpanded: true,
      });
      subprocess.businessObject.id=id_passed;
      
      //subprocess.di.id=id_passed;
      const mainProcess = canvas_ref.getRootElement();
      modeling.createShape(subprocess, { x: 700, y: 100 }, mainProcess);
      subprocess.businessObject.name = content_label;
      modeling.updateProperties(subprocess, { name: content_label });

      /*test
      second_viewer.importXML(diagram_to_import).then(event=>{
        const externalProcess = second_viewer.get('canvas').getRootElement();
        const calledElement = elementFactory.create('zeebe:CalledElement', {
          type: 'bpmn:Process',
          processRef: externalProcess
        });

        subprocess.extensionElements = elementFactory.create('bpmn:ExtensionElements', {
          values: [calledElement]
        });
      })
      */

      

    return subprocess;
  }
  else{
    return false;
  }

  } catch (error) {
    console.error('Si è verificato un errore durante la creazione del sottoprocesso con processo interno:', error);
    return null;
  }
}
//

//function to get the reference of an element
function getElement(id){
    const elementRegistry = viewer.get("elementRegistry");
    const element = elementRegistry.get(id);
    if (element) {
      return element;
    } else {
      console.log("Element not found with ID:", id);
      return null;
    }
}
//

//
function orderByXPosition(elementRegistry) {
  const elementsArray = Array.from(elementRegistry.values());
  elementsArray.sort((elementA, elementB) => {
    const xA = elementA.x;
    const xB = elementB.x;
    return xA - xB;
  });
  return elementsArray;
}
//

//function to get the referenc of the previous element of a certain element 
function getPreviousElement(referenceElement) {
  elementRegistry = viewer.get("elementRegistry");
  const incoming=referenceElement.incoming;
  if(incoming[0]){
    const previousE = incoming[0].businessObject.sourceRef.id;
    const res= elementRegistry.get(previousE);
    return res;}
  else return false;
}
//

//function to get the referenc of the successor element of a certain element 
function getSuccessorElement(referenceElement) {
  elementRegistry = viewer.get("elementRegistry");
  const outgoing=referenceElement.outgoing;
  if(outgoing[0]){
  const previousE = outgoing[0].businessObject.targetRef.id;
  const res = elementRegistry.get(previousE);
  return res;
  }
  else return false;
}
//

//function to add an element between two 
function addActivityBetweenTwoElements(firstElement, secondElement, newElement) {
  const modeling = viewer.get("modeling");
  const newX = (firstElement.x + newElement.width) ;
  const newY = (firstElement.type=="bpmn:StartEvent" || firstElement.type=="bpmn:EndEvent")? secondElement.y : firstElement.y;

  const outgoingFlow = firstElement.outgoing[0];

  modeling.removeConnection(outgoingFlow);

  const to_shift= newElement.di.bounds.width;

  const getBoundsNew = newElement.di.bounds;
  const newBoundsNew={
    x: newX,
    y:newY,
    width: getBoundsNew.width,
    height: getBoundsNew.height
  }
  modeling.resizeShape(newElement, newBoundsNew);
  /*const BoundsFirst = {
    x: (firstElement.x - to_shift/2),
    y: firstElement.y,
    width: firstElement.width,
    height: firstElement.di.bounds.height
  }
  modeling.resizeShape(firstElement,BoundsFirst);
  const BoundsSecond={
    x: (secondElement.x + to_shift/2),
    y: secondElement.y,
    width: secondElement.width,
    height: secondElement.di.bounds.height,
  }
  modeling.resizeShape(secondElement,BoundsSecond); */

  const newSequenceFlowAttrsIncoming = {
    id: 'sequenceFlowAttrsInc' + newElement.id,
    type: "bpmn:SequenceFlow"
  };
  modeling.createConnection(firstElement, newElement, newSequenceFlowAttrsIncoming, firstElement.parent);
  const newSequenceFlowAttrsOutgoing = {
    id: 'sequenceFlowAttrsOut' + newElement.id,
    type: "bpmn:SequenceFlow"
  };
  modeling.createConnection(newElement, secondElement, newSequenceFlowAttrsOutgoing, secondElement.parent);  
  reorderDiagram();
}
//

//function to get the set of ordered elements, ordered by their sequence flow 
function getOrderedSub(){
  elementRegistry = viewer.get("elementRegistry");
  const allElements = elementRegistry.getAll();

  const new_set=new Array();
  const starts = allElements.filter(element => element.incoming.length === 0 && element.type!="bpmn:SequenceFlow" && element.type!="bpmn:Process");
  while(starts[0]){
      const start = starts.splice(-1, 1)[0];
      new_set.push(start);
      var first = start;
      while(hasOutgoing(first)){
        const next = hasOutgoing(first)
        new_set.push(next);
        first = next;
      }
    
  }
  return new_set;
}
//

//function to say if an element has a successor and in the case, return it
function hasOutgoing(element){
  elementRegistry=viewer.get("elementRegistry");
  const outgoing=element.outgoing[0];
  if(outgoing){
    const target=outgoing.businessObject.targetRef.id;
    return elementRegistry.get(target)
  }
  else return false;
}
//

//function to reorder the diagram
function reorderDiagram() {
  const sub=getOrderedSub();
  sub.forEach(element => {
    const previousElement = getPreviousElement(element);
    console.log("element", element.id ,previousElement.id )
    if(previousElement){
      const compare = (previousElement.width < 100 ) ? 70 : 150; 
      const diff = element.x - previousElement.x;
      const add = compare - diff;

      if(diff < compare){
        const incomingElement = getIncoming(element);
        modeling.removeConnection(incomingElement);
        modeling.resizeShape(element, {x: element.x + add , y: element.y, width: element.width, height:element.di.bounds.height});
        const newSequenceFlowAttrsIncoming = {
          type: "bpmn:SequenceFlow"
        };
        modeling.createConnection(previousElement, element, newSequenceFlowAttrsIncoming, element.parent);
      }
      else if(diff > compare){
        const remove = diff - compare;
        const incomingElement = getIncoming(element);
        modeling.removeConnection(incomingElement);
        modeling.resizeShape(element, {x: element.x - remove , y: element.y, width: element.width, height:element.di.bounds.height});
        const newSequenceFlowAttrsIncoming = {
          type: "bpmn:SequenceFlow"
        };
        modeling.createConnection(previousElement, element, newSequenceFlowAttrsIncoming, element.parent);
      }

    }

  });
  viewer.get("canvas").zoom('fit-viewport');
}
//
//function to get incoming sequence flow element
function getIncoming(element){
  elementRegistry=viewer.get("elementRegistry");
  const incoming = element.incoming[0];
    return incoming;
}
//



//function to handle the side bar close/open function
//open: you want to open the side bar? 
export function handleSideBar(open){
  if(open){
    eventBus.fire("TOGGLE_MODE_EVENT", {
      exportMode: true 
    });  
    mode.textContent = "GDPR Mode"
    window.alert("You are now in GDPR mode, and the editor is disabled. \n If you want to edit again, you must close the GDPR panel.");
  }else{
    eventBus.fire("TOGGLE_MODE_EVENT", {
      exportMode: false 
    });       
    edit.textContent = "Edit Mode";
  }

}
//



export function removeConsentFromActivity(activity,type){
  elementRegistry=viewer.get('elementRegistry');
  const toRemove = elementRegistry.get(type+activity.id);
  modeling.removeShape(toRemove);
}


export {getDiagram,pushDiagram,editMetaInfo,subProcessGeneration,getElement,getPreviousElement,addActivityBetweenTwoElements}
