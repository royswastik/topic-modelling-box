require.config({
    paths: {
        "d3": "https://d3js.org/d3.v3.min"
    }
});

function loadD3(){
    require(['d3'], function(d3V3) {
        window.d3V3 = d3V3;
    });
    d3.json("data/document_topic_probability.json", function(x){
        window.document_topic_probability= x;
        d3.json("data/topic_word_distribution_in_corpora.json", function(y){
            window.word_distribution_in_corpora= y;
            d3.json("data/topic_word_probability_in_topic.json", function(z){
                window.topic_word_probability = z;
                generateTopicVectors(); //Loads vectors in window.topicVectors
                loadVisualizations();
                loadParallelCoordinate();
                loadParallelCoordinatesHC();
            });
        });
    });
}

function loadVisualizations(){

}

function initPage1(){

}

function initPage2(){

}

function initPage3(){
    loadParallelCoordinate();
}