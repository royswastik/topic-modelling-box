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