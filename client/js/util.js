function generateTopicVectors(){
    window.topicVectors = {};
    if(window.topic_word_probability_in_topic){
        for(var x in window.topic_word_probability_in_topic){
            var vector = [];
            for(var y in window.topic_word_probability_in_topic[x]){
                vector.push(window.topic_word_probability_in_topic[x][y]);
            }
            window.topicVectors[x] = vector;
        }
    }
}

function generateParallelCoordinateData(){
    var words = window.word_distribution_in_corpora.keys();
    var topic_word_threshold = 0.3;
    window.topic_word_probability ={};
}

