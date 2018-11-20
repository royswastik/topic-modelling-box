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

