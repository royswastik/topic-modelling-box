//vectors format: Map[string(topic_id): List[float]]
function get2DVectors(vectors, successCallback){
    var request = $.ajax({
        url: "/get2DVectors",
        method: "POST",
        data: vectors
      });
       
      request.done(function( response ) {
        successCallback(response);
      });
       
      request.fail(function( jqXHR, textStatus ) {
        alert( "Request failed: " + textStatus );
      });
}

// docs format: List[List[string(word)]]
function getWord2VecClusters(docs, successCallback){
    var request = $.ajax({
        url: "/api/getClustersWord2Vec",
        method: "POST",
        data: JSON.stringify({docs: docs}),
        contentType: "application/json; charset=utf-8",
        dataType   : "json"
      });
       
      request.done(function( response ) {
        successCallback(response);
      });
       
      request.fail(function( jqXHR, textStatus ) {
        alert( "Request failed: " + textStatus );
      });
}

