draw: function(config) {
		me = this,
		domEle = config.element,
		stackKey = config.key,
		data = config.data,
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
			yScale.domain(data.map(function(d) { return d.date; }));
			xScale.domain([0, 999 ]).nice();

		var layer = svg.selectAll(".layer")
			.data(layers)
			.enter().append("g")
			.attr("class", "layer")
			.style("fill", function(d, i) { return color(i); });

		  layer.selectAll("rect")
			  .data(function(d) { return d; })
			.enter().append("rect")
			  .attr("y", function(d) { return yScale(d.data.date); })
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