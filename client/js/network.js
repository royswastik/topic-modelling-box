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

