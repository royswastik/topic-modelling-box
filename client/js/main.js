require.config({
    paths: {
        "d3": "https://d3js.org/d3.v3.min"
    }
});

function loadD3(){

    window.d3Old = d3;
    require(['d3'], function(d3V3) {
        window.d3V3 = d3V3;
        window.d3 = d3Old;
        window.documents = [
          ["i", "am", "batman", "of", "winterfall"],
          ["there", "should", "always", "be", "a", "stark", "in", "winterfell"],
          ["prophecy", "says", "prince", "will", "be" , "reborn"]
        ];
        getAnalysis("asfas", "assad");
          loadParallelCoordinate();
          loadParallelCoordinatesHC();
    });
}


function getDocs(texts) {
  return window.documents = texts.map(x => x.split());
}

function getAnalysis(method) {
  let docs = window.documents;
  let fnc = x => x;
  if (method == "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }
  fnc(docs, resp => {
      window.global_data = resp;
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
    initPage4();
  });
}

function loadVisualizations() {
}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}



function initPage2(resp) {
  renderClusterForceLayout(resp);

}

function initPage3(){
    $("#parallel-coordinate-vis").html("");
    $("#pc-container").html("");
    loadParallelCoordinate();
    loadParallelCoordinatesHC();
}

function initPage4(){
    $("#overall-wc").html();
    loadWordCloud(window.global_data);
}