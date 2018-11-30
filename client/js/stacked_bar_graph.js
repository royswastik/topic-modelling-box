function renderBarGraph(topic_number, resp) {
  d3.select("#stack-bar").remove();
   d3.select("#legendsvg").remove();
  var final_data = [];
  var dataVal =resp["topic_word"][topic_number];
  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
        var temp ={};
        temp.State = key;
        temp.topic_frequency = dataVal[key];
        temp.overall = resp["overall_word"][key];
        temp.total = temp.topic_frequency + temp.overall;
        final_data.push(temp);
        console.log(key + " -> " + dataVal[key]);
    }
  }
  

  var bb = document.querySelector('#stacked-bar')
    .getBoundingClientRect(),
    width = 600;

  var data = final_data;
  var height = data.length * 25;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height).attr("id","stack-bar"),
    margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 80
    },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var y = d3.scaleBand() // x = d3.scaleBand()  
    .rangeRound([0, height]) // .rangeRound([0, width])
    .paddingInner(0.25).align(0.1);
  var x = d3.scaleLinear() // y = d3.scaleLinear()
    .rangeRound([0, width]); // .rangeRound([height, 0]);

  var z = d3.scaleOrdinal().range(["#C8423E", "#A1C7E0"]);
  var keys = ["topic_frequency", "overall_frequency"];
  data.sort(function (a, b) {
    return b.total - a.total;
  });
  y.domain(data.map(function (d) {
    return d.State;
  })); // x.domain...

  x.domain([0, d3.max(data, function (d) {
    return d.total;
  })]).nice(); // y.domain...

  z.domain(keys);
  g.append("g").selectAll("g").data(d3.stack().keys(keys)(data)).enter().append("g").attr("fill", function (d) {
      return z(d.key);
    }).selectAll("rect").data(function (d) {
      return d;
    }).enter().append("rect").attr("y", function (d) {
      return y(d.data.State);
    }) //.attr("x", function(d) { return x(d.data.State); })
    .attr("x", function (d) {
      return x(d[0]);
    }) //.attr("y", function(d) { return y(d[1]); })  
    .attr("width", function (d) {
      return x(d[1]) - x(d[0]);
    }) //.attr("height", function(d) { return y(d[0]) - y(d[1]); })
    .attr("height", y.bandwidth())
    .attr("opacity", 0.8); //.attr("width", x.bandwidth()); 

  g.append("g").attr("class", "axis").attr("transform", "translate(0,0)") //  .attr("transform", "translate(0," + height + ")")
    .call(d3.axisLeft(y)); //   .call(d3.axisBottom(x));

  g.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")") // New line
    .call(d3.axisBottom(x).ticks(null, "s")) //  .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text").attr("y", 2) //     .attr("y", 2)
    .attr("x", x(x.ticks().pop()) + 0.5) //     .attr("y", y(y.ticks().pop()) + 0.5)
    .attr("dy", "0.32em") //     .attr("dy", "0.32em")
  



  var svg1 = d3.select("#legendT").append("svg").attr("width", width).attr("height", height).attr("id","legendsvg")
var legend = svg1.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    .attr("transform", function (d, i) {
      return "translate(-50," + (0 + i * 20) + ")";
    });
  legend.append("rect").attr("x", width - 25).attr("width", 60).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 24).attr("y", 18).attr("dy", "0.0em").text(function (d) {
    return d;
  });

  var svg1 = d3.select("#legendT").append("svg").attr("width", width).attr("height", height).attr("id","legendsvg")
var legend = svg1.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    .attr("transform", function (d, i) {
      return "translate(-50," + (0 + i * 20) + ")";
    });
  legend.append("rect").attr("x", width - 25).attr("width", 60).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 24).attr("y", 18).attr("dy", "0.0em").text(function (d) {
    return d;
  });
}