
function loadD3(){
  console.log("hello");
  getAnalysis("asfas", "assad");
  loadParallelCoordinate();
  loadParallelCoordinatesHC();
}


function getDocs(text) {
  return [
    ["w1", "w2", "w3", "w4", "w5", "w6"],
    ["w3", "asds", "asdasd", "sadasdsa", "asdasdsa", "asdasdsad"]
  ];
}

function getAnalysis(text, method) {
  let docs = getDocs(text);
  let fnc = x => x;
  if (method == "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }
  fnc(docs, resp => {
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
  });
}

function loadVisualizations() {

}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}



function initPage2() {

}

function initPage3() {
  // loadParallelCoordinate();
}