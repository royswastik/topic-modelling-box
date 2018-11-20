function loadD3(){
    console.log("hello");
    d3.csv("data/document_topic_probability.json", function(x){
        window.document_topic_probability= x;
        d3.csv("data/document_topic_probability.json", function(y){
            window.topic_word_distribution_in_corpora= y;
            d3.csv("data/document_topic_probability.json", function(z){
                window.topic_word_probability_in_topic = z;
                generateTopicVectors(); //Loads vectors in window.topicVectors
                loadVisualizations();
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

}