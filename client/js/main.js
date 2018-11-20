function loadD3(){
    console.log("hello");
    d3.csv("data.json", function(x){
        window.data1= x;
    });
}