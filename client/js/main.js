function loadD3() {
  console.log("hello");
  d3.json("data/document_topic_probability.json", function(x){
      window.document_topic_probability= x;
      d3.json("data/topic_word_distribution_in_corpora.json", function(y){
          window.word_distribution_in_corpora= y;
          d3.json("data/topic_word_probability_in_topic.json", function(z){
              window.topic_word_probability = z;
              getAnalysis("asfas", "assad");
          });
      });
  });

}


function getDocs(text) {
  return [
    ["w1", "w2", "w3", "w4", "w5", "w6"],
    ["w3", "asds", "asdasd", "sadasdsa", "asdasdsa", "asdasdsad"]
  ];
}

function getAnalysis(text, method) {
  let docs = getDocs(text);
  let fnc = x => x;
  if (method == "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }
  fnc(docs, resp => {
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
  });
}

function loadVisualizations() {

}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}


function renderClusterAnalysis(resp) {
  var document_topic = resp["document_topic"][0];
  var topic_vectors = resp["topic_vectors"];
  var bb = document.querySelector('#cluster')
    .getBoundingClientRect(),
    width = bb.right - bb.left;
  var height = 400;
  var margin = 40;
  var data = [];

  Object.keys(topic_vectors).forEach(function(key) {
    var value = topic_vectors[key];
    data.push({
      x: value[0],
      y: value[1],
      c: 1,
      size: document_topic[key],
      key: key
    });
  });
  var labelX = 'X';
  var labelY = 'Y';

  var svg = d3.select('#cluster')
    .append('svg')
    .attr('class', 'chart')
    .attr("width", width + margin + margin)
    .attr("height", height + margin + margin)
    .append("g")
    .attr("transform", "translate(" + margin + "," + margin + ")");

  var x = d3.scaleLinear()
    .domain([d3.min(data, function (d) {
      return d.x;
    }), d3.max(data, function (d) {
      return d.x;
    })])
    .range([0, width]);

  var y = d3.scaleLinear()
    .domain([d3.min(data, function (d) {
      return d.y;
    }), d3.max(data, function (d) {
      return d.y;
    })])
    .range([height, 0]);

  var scale = d3.scaleSqrt()
    .domain([d3.min(data, function (d) {
      return d.size;
    }), d3.max(data, function (d) {
      return d.size;
    })])
    .range([1, 20]);

  var opacity = d3.scaleSqrt()
    .domain([d3.min(data, function (d) {
      return d.size;
    }), d3.max(data, function (d) {
      return d.size;
    })])
    .range([1, .5]);


  var xAxis = d3.axisBottom().scale(x);
  var yAxis = d3.axisLeft().scale(y);


  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", 20)
    .attr("y", -margin)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(labelY);
  // x axis and label
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("x", width + 20)
    .attr("y", margin - 10)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(labelX);

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("g")
    .insert("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("opacity", function (d) {
      return opacity(d.size);
    })
    .attr("r", function (d) {
      return scale(d.size);
    })
    .style("fill", function (d) {
      return "#1f77b4";
    })
    .on('mouseover', function (d, i) {
      renderBarGraph(d["key"], resp);
      fade(d.c, .1);
    })
    .on('mouseout', function (d, i) {
      fadeOut();
    })
    .transition()
    .delay(function (d, i) {
      return x(d.x) - y(d.y);
    })
    .duration(500)
    .attr("cx", function (d) {
      return x(d.x);
    })
    .attr("cy", function (d) {
      return y(d.y);
    });


  function fade(c, opacity) {
    svg.selectAll("circle")
      .filter(function (d) {
        return d.c != c;
      })
      .transition()
      .style("opacity", opacity);
  }

  function fadeOut() {
    svg.selectAll("circle")
      .transition()
      .style("opacity", function (d) {
        opacity(d.size);
      });
  }
}


function renderBarGraph(topic_number, resp) {
  d3.select("#stack-bar").remove();
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
    width = bb.right - bb.left;

  var data = final_data;
  var height = data.length * 25;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height).attr("id","stack-bar"),
    margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 50
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
  var keys = ["topic_frequency", "overall"];
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
  var legend = g.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    .attr("transform", function (d, i) {
      return "translate(-50," + (300 + i * 20) + ")";
    });
  legend.append("rect").attr("x", width - 19).attr("width", 19).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 24).attr("y", 9.5).attr("dy", "0.32em").text(function (d) {
    return d;
  });
}


function initPage2() {

}

function initPage3() {
  // loadParallelCoordinate();
}