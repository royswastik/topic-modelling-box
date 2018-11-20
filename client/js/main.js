function loadD3(){
    console.log("hello");
    d3.json("data/document_topic_probability.json", function(x){
        window.document_topic_probability= x;
        d3.json("data/topic_word_distribution_in_corpora.json", function(y){
<<<<<<< HEAD
            window.topic_word_distribution_in_corpora= y;
=======
            window.word_distribution_in_corpora= y;
>>>>>>> 9ede90cd44f8a013d801646498c0d6517eb8e936
            d3.json("data/topic_word_probability_in_topic.json", function(z){
                window.topic_word_probability = z;
                generateTopicVectors(); //Loads vectors in window.topicVectors
                loadVisualizations();
            });
        });
    });
}

function loadVisualizations(){

}

// pass integer of topic_number
function initPage1(topic_number){

	var topic_words = window.document_topic_probability;
	var corpus_words = window.topic_word_distribution_in_corpora;
	var data = window.topic_word_probability;
	var topic_distribution_in_corpa = window.topic_word_distribution_in_corpora;

	var final_data =[];
	var data = data[topic_number][0];
	for (var i = 0; i < data.length; i++) {
		var temp ={}
		var key = Object.keys(data[i])[0];
		var val = data[i][Object.keys(data[i])[0]];
		var overall = topic_distribution_in_corpa[key];
		temp.State = key;
		temp.topic_frequency = val;
		temp.overall = overall;
		temp.total = temp.topic_frequency + temp.overall;
		final_data.push(temp);
	}
	var data = final_data;
	var svg = d3.select("#stacked-bar"),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var y = d3.scaleBand()			// x = d3.scaleBand()	
	    .rangeRound([0, height])	// .rangeRound([0, width])
	    .paddingInner(0.05)
	    .align(0.1);

	var x = d3.scaleLinear()		// y = d3.scaleLinear()
	    .rangeRound([0, width]);	// .rangeRound([height, 0]);

	var z = d3.scaleOrdinal()
	    .range(["#98abc5", "#8a89a6"]);

	var keys = ["topic_frequency","overall"];
	data.sort(function(a, b) { return b.total - a.total; });
    y.domain(data.map(function(d) { return d.State; }));					// x.domain...
    x.domain([0, d3.max(data, function(d) { return d.total; })]).nice();	// y.domain...
    z.domain(keys);
    g.append("g")
    .selectAll("g")
    .data(d3.stack().keys(keys)(data))
    .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("y", function(d) { return y(d.data.State); })	    //.attr("x", function(d) { return x(d.data.State); })
      .attr("x", function(d) { return x(d[0]); })			    //.attr("y", function(d) { return y(d[1]); })	
      .attr("width", function(d) { return x(d[1]) - x(d[0]); })	//.attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("height", y.bandwidth());						    //.attr("width", x.bandwidth());	

    g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,0)") 						//  .attr("transform", "translate(0," + height + ")")
      .call(d3.axisLeft(y));									//   .call(d3.axisBottom(x));

  g.append("g")
      .attr("class", "axis")
	  .attr("transform", "translate(0,"+height+")")				// New line
      .call(d3.axisBottom(x).ticks(null, "s"))					//  .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
      .attr("y", 2)												//     .attr("y", 2)
      .attr("x", x(x.ticks().pop()) + 0.5) 						//     .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")										//     .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Population")
	  .attr("transform", "translate("+ (-width) +",-10)");

	var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
    .selectAll("g")
    .data(keys.slice().reverse())
    .enter().append("g")
    //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
	 .attr("transform", function(d, i) { return "translate(-50," + (300 + i * 20) + ")"; });

  legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });



}

function initPage2(){

}

function initPage3(){
    loadParallelCoordinate();
}