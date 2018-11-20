function loadD3(){
    console.log("hello");
    d3.csv("data/document_topic_probability.json", function(x){
        window.document_topic_probability= x;
        d3.csv("data/document_topic_probability.json", function(y){
            window.topic_word_distribution_in_corpora= y;
            d3.csv("data/topic_word_probability_in_topic.json", function(z){
                window.topic_word_probability_in_topic = z;
                generateTopicVectors(); //Loads vectors in window.topicVectors
                loadVisualizations();
            });
        });
    });
}

function loadVisualizations(){

}

function initPage1(topic_number){

	var topic_words = window.document_topic_probability;
	var corpus_words = window.topic_word_distribution_in_corpora;

	var initStackedBarChart = {
	draw: function(config) {
		debugger
		var me = this,
		domEle = config.element,
		stackKey = config.key,
		data = config.data[config.topic_number].values,
		margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom,
		xScale = d3.scaleLinear().rangeRound([0, width]),
		yScale = d3.scaleBand().rangeRound([height, 0]).padding(0.1),
		color = d3.scaleOrdinal(d3.schemeCategory20),
		xAxis = d3.axisBottom(xScale),
		yAxis =  d3.axisLeft(yScale),
		svg = d3.select("#"+domEle).append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


		var stack = d3.stack()
			.keys(stackKey)
			/*.order(d3.stackOrder)*/
			.offset(d3.stackOffsetNone);
	
		var layers= stack(data);
			yScale.domain(data.map(function(d) { return d.keys[0]; }));
			xScale.domain([0, 999]).nice();

		var layer = svg.selectAll(".layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "layer")
			.style("fill", function(d, i) { return color(i); });

		  layer.selectAll("rect")
			  .data(function(d) { return d; })
			.enter().append("rect")
			  .attr("y", function(d) { return yScale(d.data.values[0]); })
			  .attr("x", function(d) { return xScale(d[0]); })
			  .attr("height", yScale.bandwidth())
			  .attr("width", function(d) { return xScale(d[1]) - xScale(d[0]) });
    
			svg.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + (height+5) + ")")
			.call(xAxis);

			svg.append("g")
			.attr("class", "axis axis--y")
			.attr("transform", "translate(0,0)")
			.call(yAxis);							
		}
	}
	var data = window.topic_word_probability_in_topic;
	// var data = [{"date":"TEXT","01":59,"03":33,"04":23},{"date":"DIFF","02":88,"03":1,"04":30},{"date":"ETCH","02":78,"03":81,"04":70},{"date":"ANNL","01":53,"03":12,"05":18},{"date":"FCOT","01":84,"02":27,"05":16},{"date":"PRNT","01A":72,"01A":14,"04B":42}];

//var data = [{"date":"TEXT","TEXT01":59,"TEXT03":33,"TEXT04":23},{"date":"DIFF","DIFF02":88,"DIFF03":1,"DIFF04":30},{"date":"ETCH","ETCH02":78,"ETCH03":81,"ETCH04":70},{"date":"ANNL","ANNL01":53,"ANNL03":12,"ANNL05":18},{"date":"FCOT","FCOT01":84,"FCOT02":27,"FCOT05":16},{"date":"PRNT","PRNT01A":72,"PRNT01A":14,"PRNT04B":42}];
//var key = ["TEXT01","TEXT02", "TEXT03", "TEXT04","DIFF01","DIFF02", "DIFF03", "DIFF04","DIFF05","ETCH01","ETCH02", "ETCH03", "ETCH04", "ETCH05","ANNL01","ANNL02", "ANNL03", "ANNL04", "ANNL05","FCOT01","FCOT02", "FCOT03", "FCOT04", "FCOT05", "PRNT01A", "PRNT01B", "PRNT02A", "PRNT02B", "PRNT01A", "PRNT03B", "PRNT04A", "PRNT04B"];
  
	var key = ["01","02"];
	debugger
	initStackedBarChart.draw({
		data: data,
		key: key,
		element: 'stacked-bar',
		topic_number: topic_number
	});

}

function initPage2(){

}

function initPage3(){
    loadParallelCoordinate();
}