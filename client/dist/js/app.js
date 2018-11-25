"use strict";

function loadJquery() {
  $(document).ready(function () {
    $("#toggle-sidebar").click(function () {
      $('.ui.sidebar').sidebar('toggle');
    });
  });
}
"use strict";

function loadD3() {
  console.log("hello");
  d3.json("data/document_topic_probability.json", function (x) {
    window.document_topic_probability = x;
    d3.json("data/topic_word_distribution_in_corpora.json", function (y) {
      window.word_distribution_in_corpora = y;
      d3.json("data/topic_word_probability_in_topic.json", function (z) {
        window.topic_word_probability = z;
        getAnalysis("asfas", "assad");
      });
    });
  });
}

function getDocs(text) {
  return [["w1", "w2", "w3", "w4", "w5", "w6"], ["w3", "asds", "asdasd", "sadasdsa", "asdasdsa", "asdasdsad"]];
}

function getAnalysis(text, method) {
  var docs = getDocs(text);

  var fnc = function fnc(x) {
    return x;
  };

  if (method == "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }

  fnc(docs, function (resp) {
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
  });
}

function loadVisualizations() {}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}

function renderClusterAnalysis(resp) {
  var document_topic = resp["document_topic"][0];
  var topic_vectors = resp["topic_vectors"];
  var bb = document.querySelector('#cluster').getBoundingClientRect(),
      width = bb.right - bb.left;
  var height = 400;
  var margin = 40;
  var data = [];
  Object.keys(topic_vectors).forEach(function (key) {
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
  var svg = d3.select('#cluster').append('svg').attr('class', 'chart').attr("width", width + margin + margin).attr("height", height + margin + margin).append("g").attr("transform", "translate(" + margin + "," + margin + ")");
  var x = d3.scaleLinear().domain([d3.min(data, function (d) {
    return d.x;
  }), d3.max(data, function (d) {
    return d.x;
  })]).range([0, width]);
  var y = d3.scaleLinear().domain([d3.min(data, function (d) {
    return d.y;
  }), d3.max(data, function (d) {
    return d.y;
  })]).range([height, 0]);
  var scale = d3.scaleSqrt().domain([d3.min(data, function (d) {
    return d.size;
  }), d3.max(data, function (d) {
    return d.size;
  })]).range([1, 20]);
  var opacity = d3.scaleSqrt().domain([d3.min(data, function (d) {
    return d.size;
  }), d3.max(data, function (d) {
    return d.size;
  })]).range([1, .5]);
  var xAxis = d3.axisBottom().scale(x);
  var yAxis = d3.axisLeft().scale(y);
  svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("x", 20).attr("y", -margin).attr("dy", ".71em").style("text-anchor", "end").text(labelY); // x axis and label

  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width + 20).attr("y", margin - 10).attr("dy", ".71em").style("text-anchor", "end").text(labelX);
  svg.selectAll("circle").data(data).enter().append("g").insert("circle").attr("cx", width / 2).attr("cy", height / 2).attr("opacity", function (d) {
    return opacity(d.size);
  }).attr("r", function (d) {
    return scale(d.size);
  }).style("fill", function (d) {
    return "#1f77b4";
  }).on('mouseover', function (d, i) {
    renderBarGraph(d["key"], resp);
    fade(d.c, .1);
  }).on('mouseout', function (d, i) {
    fadeOut();
  }).transition().delay(function (d, i) {
    return x(d.x) - y(d.y);
  }).duration(500).attr("cx", function (d) {
    return x(d.x);
  }).attr("cy", function (d) {
    return y(d.y);
  });

  function fade(c, opacity) {
    svg.selectAll("circle").filter(function (d) {
      return d.c != c;
    }).transition().style("opacity", opacity);
  }

  function fadeOut() {
    svg.selectAll("circle").transition().style("opacity", function (d) {
      opacity(d.size);
    });
  }
}

function renderBarGraph(topic_number, resp) {
  d3.select("#stack-bar").remove();
  var final_data = [];
  var dataVal = resp["topic_word"][topic_number];

  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
      var temp = {};
      temp.State = key;
      temp.topic_frequency = dataVal[key];
      temp.overall = resp["overall_word"][key];
      temp.total = temp.topic_frequency + temp.overall;
      final_data.push(temp);
      console.log(key + " -> " + dataVal[key]);
    }
  }

  var bb = document.querySelector('#stacked-bar').getBoundingClientRect(),
      width = bb.right - bb.left;
  var data = final_data;
  var height = data.length * 25;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height).attr("id", "stack-bar"),
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
  .attr("height", y.bandwidth()).attr("opacity", 0.8); //.attr("width", x.bandwidth()); 

  g.append("g").attr("class", "axis").attr("transform", "translate(0,0)") //  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisLeft(y)); //   .call(d3.axisBottom(x));

  g.append("g").attr("class", "axis").attr("transform", "translate(0," + height + ")") // New line
  .call(d3.axisBottom(x).ticks(null, "s")) //  .call(d3.axisLeft(y).ticks(null, "s"))
  .append("text").attr("y", 2) //     .attr("y", 2)
  .attr("x", x(x.ticks().pop()) + 0.5) //     .attr("y", y(y.ticks().pop()) + 0.5)
  .attr("dy", "0.32em"); //     .attr("dy", "0.32em")

  var legend = g.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  .attr("transform", function (d, i) {
    return "translate(-50," + (300 + i * 20) + ")";
  });
  legend.append("rect").attr("x", width - 19).attr("width", 19).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 24).attr("y", 9.5).attr("dy", "0.32em").text(function (d) {
    return d;
  });
}

function initPage2() {}

function initPage3() {// loadParallelCoordinate();
}
"use strict";

//vectors format: Map[string(topic_id): List[float]]
function get2DVectors(vectors, successCallback) {
  var request = $.ajax({
    url: "/get2DVectors",
    method: "POST",
    data: vectors
  });
  request.done(function (response) {
    successCallback(response);
  });
  request.fail(function (jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
  });
} // docs format: List[List[string(word)]]


function getWord2VecClusters(docs, successCallback) {
  var request = $.ajax({
    url: "/api/getClustersWord2Vec",
    method: "POST",
    data: JSON.stringify({
      docs: docs
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(JSON.parse(response));
  });
  request.fail(function (jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
  });
}

function getLDAClusters(docs, successCallback) {
  var request = $.ajax({
    url: "/api/getClustersWord2Vec",
    method: "POST",
    data: JSON.stringify({
      docs: docs
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(response);
  });
  request.fail(function (jqXHR, textStatus) {
    alert("Request failed: " + textStatus);
  });
}
"use strict";

function loadParallelCoordinate() {
  var margin = {
    top: 30,
    right: 10,
    bottom: 10,
    left: 10
  },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
  var x = d3.scale.ordinal().rangePoints([0, width], 1),
      y = {},
      dragging = {};
  var line = d3.svg.line(),
      background,
      foreground;
  var svg = d3.select("#parallel-coordinate-vis").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
      dimensions;
  getWord2VecClusters([["food", "apple", "banana", "biscuit", "chicken"], ["cricket", "football", "baseball", "tennis"]], function (resp) {
    // Extract the list of dimensions and create a scale for each.
    var cars = generateParallelCoordinateData(resp, 0, 0); // var axisD = d3.svg.axis().orient("left").ticks(Object.keys(resp["document_topic"]).length),

    var axisD = d3.svg.axis().orient("left").tickValues(Object.keys(resp["document_topic"]).map(function (x) {
      return parseInt(x);
    })),
        axisT = d3.svg.axis().orient("left").tickValues(resp["topics"].map(function (x) {
      return parseInt(x);
    })),
        axisW = d3.svg.axis().orient("left").tickValues(Object.values(resp["overall_word"]).map(function (x) {
      return parseFloat(x);
    }));
    x.domain(dimensions = d3.keys(cars[0]).filter(function (d) {
      return d != "name" && (y[d] = d3.scale.linear().domain(d3.extent(cars, function (p) {
        return +p[d];
      })).range([height, 0]));
    })); // Add grey background lines for context.

    background = svg.append("g").attr("class", "background").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add blue foreground lines for focus.

    foreground = svg.append("g").attr("class", "foreground").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add a group element for each dimension.

    var g = svg.selectAll(".dimension").data(dimensions).enter().append("g").attr("class", "dimension").attr("transform", function (d) {
      return "translate(" + x(d) + ")";
    }).call(d3.behavior.drag().origin(function (d) {
      return {
        x: x(d)
      };
    }).on("dragstart", function (d) {
      dragging[d] = x(d);
      background.attr("visibility", "hidden");
    }).on("drag", function (d) {
      dragging[d] = Math.min(width, Math.max(0, d3.event.x));
      foreground.attr("d", path);
      dimensions.sort(function (a, b) {
        return position(a) - position(b);
      });
      x.domain(dimensions);
      g.attr("transform", function (d) {
        return "translate(" + position(d) + ")";
      });
    }).on("dragend", function (d) {
      delete dragging[d];
      transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
      transition(foreground).attr("d", path);
      background.attr("d", path).transition().delay(500).duration(0).attr("visibility", null);
    })); // Add an axis and title.

    g.append("g").attr("class", "axis").each(function (d) {
      var axis = null;

      if (d == "document") {
        axis = axisD;
      } else if (d == "topic") {
        axis = axisT;
      } else {
        axis = axisW;
      }

      d3.select(this).call(axis.scale(y[d]));
    }).append("text").style("text-anchor", "middle").attr("y", -9).text(function (d) {
      return d;
    }); // Add and store a brush for each axis.

    g.append("g").attr("class", "brush").each(function (d) {
      d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
    }).selectAll("rect").attr("x", -8).attr("width", 16);
  });

  function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  } // Returns the path for a given data point.


  function path(d) {
    return line(dimensions.map(function (p) {
      return [position(p), y[p](d[p])];
    }));
  }

  function brushstart() {
    d3.event.sourceEvent.stopPropagation();
  } // Handles a brush event, toggling the display of foreground lines.


  function brush() {
    var actives = dimensions.filter(function (p) {
      return !y[p].brush.empty();
    }),
        extents = actives.map(function (p) {
      return y[p].brush.extent();
    });
    foreground.style("display", function (d) {
      return actives.every(function (p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? null : "none";
    });
  }
}
"use strict";

function generateTopicVectors() {
  window.topicVectors = {};

  if (window.topic_word_probability_in_topic) {
    for (var x in window.topic_word_probability_in_topic) {
      var vector = [];

      for (var y in window.topic_word_probability_in_topic[x]) {
        vector.push(window.topic_word_probability_in_topic[x][y]);
      }

      window.topicVectors[x] = vector;
    }
  }
}

function generateParallelCoordinateData(response, topic_threshold, word_threshold) {
  var visData = [];

  for (var docKey in response["document_topic"]) {
    for (var topic in response["document_topic"][docKey]) {
      var topicScore = response["document_topic"][docKey][topic];

      if (topicScore > topic_threshold) {
        for (var word in response["topic_word"][topic]) {
          var wordScore = response["topic_word"][topic][word];

          if (wordScore > word_threshold) {
            visData.push({
              "name": docKey,
              "document": docKey,
              "topic": topic,
              "word": response["overall_word"][word]
            });
          }
        }
      }
    }
  }

  return visData;
}
"use strict";

window.vueApp = new Vue({
  el: '#vue-app',
  data: {
    message: 'Hello user!',
    noneSelected: true,
    selectedPage: 1,
    playerDetail: {
      name: "<Player Name>"
    },
    overviewFilters: {},
    selectedMap: 1
  },
  methods: {
    selectPage: function selectPage(x) {
      this.selectedPage = x;

      if (x == 1) {
        initPage1(0);
      }

      if (x == 2) {
        initPage2();
      }

      if (x == 3) {
        initPage3();
      }
    }
  },
  mounted: function mounted() {
    console.log("Mounted");
    loadD3();
    loadJquery();
  }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5qcyIsIm1haW4uanMiLCJuZXR3b3JrLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiXSwibmFtZXMiOlsibG9hZEpxdWVyeSIsIiQiLCJkb2N1bWVudCIsInJlYWR5IiwiY2xpY2siLCJzaWRlYmFyIiwibG9hZEQzIiwiY29uc29sZSIsImxvZyIsImQzIiwianNvbiIsIngiLCJ3aW5kb3ciLCJkb2N1bWVudF90b3BpY19wcm9iYWJpbGl0eSIsInkiLCJ3b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhIiwieiIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHkiLCJnZXRBbmFseXNpcyIsImdldERvY3MiLCJ0ZXh0IiwibWV0aG9kIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJkb2N1bWVudF90b3BpYyIsInRvcGljX3ZlY3RvcnMiLCJiYiIsInF1ZXJ5U2VsZWN0b3IiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ3aWR0aCIsInJpZ2h0IiwibGVmdCIsImhlaWdodCIsIm1hcmdpbiIsImRhdGEiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsInZhbHVlIiwicHVzaCIsImMiLCJzaXplIiwibGFiZWxYIiwibGFiZWxZIiwic3ZnIiwic2VsZWN0IiwiYXBwZW5kIiwiYXR0ciIsInNjYWxlTGluZWFyIiwiZG9tYWluIiwibWluIiwiZCIsIm1heCIsInJhbmdlIiwic2NhbGUiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwieEF4aXMiLCJheGlzQm90dG9tIiwieUF4aXMiLCJheGlzTGVmdCIsImNhbGwiLCJzdHlsZSIsInNlbGVjdEFsbCIsImVudGVyIiwiaW5zZXJ0Iiwib24iLCJpIiwicmVuZGVyQmFyR3JhcGgiLCJmYWRlIiwiZmFkZU91dCIsInRyYW5zaXRpb24iLCJkZWxheSIsImR1cmF0aW9uIiwiZmlsdGVyIiwidG9waWNfbnVtYmVyIiwicmVtb3ZlIiwiZmluYWxfZGF0YSIsImRhdGFWYWwiLCJoYXNPd25Qcm9wZXJ0eSIsInRlbXAiLCJTdGF0ZSIsInRvcGljX2ZyZXF1ZW5jeSIsIm92ZXJhbGwiLCJ0b3RhbCIsImxlbmd0aCIsInRvcCIsImJvdHRvbSIsImciLCJzY2FsZUJhbmQiLCJyYW5nZVJvdW5kIiwicGFkZGluZ0lubmVyIiwiYWxpZ24iLCJzY2FsZU9yZGluYWwiLCJzb3J0IiwiYSIsImIiLCJtYXAiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb250ZW50VHlwZSIsImRhdGFUeXBlIiwicGFyc2UiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlIiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJ2YWx1ZXMiLCJwYXJzZUZsb2F0IiwibGluZWFyIiwiZXh0ZW50IiwicCIsInBhdGgiLCJiZWhhdmlvciIsImRyYWciLCJvcmlnaW4iLCJNYXRoIiwiZXZlbnQiLCJwb3NpdGlvbiIsImVhY2giLCJicnVzaCIsImJydXNoc3RhcnQiLCJ2Iiwic291cmNlRXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJhY3RpdmVzIiwiZW1wdHkiLCJleHRlbnRzIiwiZXZlcnkiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwidnVlQXBwIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwibmFtZSIsIm92ZXJ2aWV3RmlsdGVycyIsInNlbGVjdGVkTWFwIiwibWV0aG9kcyIsInNlbGVjdFBhZ2UiLCJtb3VudGVkIl0sIm1hcHBpbmdzIjoiOztBQUFBLFNBQVNBLFVBQVQsR0FBcUI7QUFDakJDLEVBQUFBLENBQUMsQ0FBQ0MsUUFBRCxDQUFELENBQVlDLEtBQVosQ0FBa0IsWUFBVTtBQUN4QkYsSUFBQUEsQ0FBQyxDQUFDLGlCQUFELENBQUQsQ0FBcUJHLEtBQXJCLENBQTJCLFlBQVU7QUFDakNILE1BQUFBLENBQUMsQ0FBQyxhQUFELENBQUQsQ0FDS0ksT0FETCxDQUNhLFFBRGI7QUFHSCxLQUpEO0FBTUgsR0FQRDtBQVFIOzs7QUNURCxTQUFTQyxNQUFULEdBQWtCO0FBQ2hCQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxPQUFaO0FBQ0FDLEVBQUFBLEVBQUUsQ0FBQ0MsSUFBSCxDQUFRLHNDQUFSLEVBQWdELFVBQVNDLENBQVQsRUFBVztBQUN2REMsSUFBQUEsTUFBTSxDQUFDQywwQkFBUCxHQUFtQ0YsQ0FBbkM7QUFDQUYsSUFBQUEsRUFBRSxDQUFDQyxJQUFILENBQVEsOENBQVIsRUFBd0QsVUFBU0ksQ0FBVCxFQUFXO0FBQy9ERixNQUFBQSxNQUFNLENBQUNHLDRCQUFQLEdBQXFDRCxDQUFyQztBQUNBTCxNQUFBQSxFQUFFLENBQUND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dWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwiZnVuY3Rpb24gbG9hZEQzKCkge1xuICBjb25zb2xlLmxvZyhcImhlbGxvXCIpO1xuICBkMy5qc29uKFwiZGF0YS9kb2N1bWVudF90b3BpY19wcm9iYWJpbGl0eS5qc29uXCIsIGZ1bmN0aW9uKHgpe1xuICAgICAgd2luZG93LmRvY3VtZW50X3RvcGljX3Byb2JhYmlsaXR5PSB4O1xuICAgICAgZDMuanNvbihcImRhdGEvdG9waWNfd29yZF9kaXN0cmlidXRpb25faW5fY29ycG9yYS5qc29uXCIsIGZ1bmN0aW9uKHkpe1xuICAgICAgICAgIHdpbmRvdy53b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhPSB5O1xuICAgICAgICAgIGQzLmpzb24oXCJkYXRhL3RvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMuanNvblwiLCBmdW5jdGlvbih6KXtcbiAgICAgICAgICAgICAgd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHkgPSB6O1xuICAgICAgICAgICAgICBnZXRBbmFseXNpcyhcImFzZmFzXCIsIFwiYXNzYWRcIik7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfSk7XG5cbn1cblxuXG5mdW5jdGlvbiBnZXREb2NzKHRleHQpIHtcbiAgcmV0dXJuIFtcbiAgICBbXCJ3MVwiLCBcIncyXCIsIFwidzNcIiwgXCJ3NFwiLCBcInc1XCIsIFwidzZcIl0sXG4gICAgW1widzNcIiwgXCJhc2RzXCIsIFwiYXNkYXNkXCIsIFwic2FkYXNkc2FcIiwgXCJhc2Rhc2RzYVwiLCBcImFzZGFzZHNhZFwiXVxuICBdO1xufVxuXG5mdW5jdGlvbiBnZXRBbmFseXNpcyh0ZXh0LCBtZXRob2QpIHtcbiAgbGV0IGRvY3MgPSBnZXREb2NzKHRleHQpO1xuICBsZXQgZm5jID0geCA9PiB4O1xuICBpZiAobWV0aG9kID09IFwiTERBXCIpIHtcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcbiAgfSBlbHNlIHtcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xuICB9XG4gIGZuYyhkb2NzLCByZXNwID0+IHtcbiAgICBpbml0UGFnZTEocmVzcCk7XG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xuICAgIGluaXRQYWdlMyhyZXNwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcblxufVxuXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xuICByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCk7XG59XG5cblxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2x1c3RlcicpXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xuICB2YXIgaGVpZ2h0ID0gNDAwO1xuICB2YXIgbWFyZ2luID0gNDA7XG4gIHZhciBkYXRhID0gW107XG5cbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgIHg6IHZhbHVlWzBdLFxuICAgICAgeTogdmFsdWVbMV0sXG4gICAgICBjOiAxLFxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcbiAgICAgIGtleToga2V5XG4gICAgfSk7XG4gIH0pO1xuICB2YXIgbGFiZWxYID0gJ1gnO1xuICB2YXIgbGFiZWxZID0gJ1knO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcbiAgICAuYXBwZW5kKCdzdmcnKVxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xuXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueDtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC55O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSldKVxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAyMF0pO1xuXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xuXG5cbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xuXG5cbiAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgLmNhbGwoeUF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgLnRleHQobGFiZWxZKTtcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoeEF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFgpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAuZGF0YShkYXRhKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIG9wYWNpdHkoZC5zaXplKTtcbiAgICB9KVxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XG4gICAgfSlcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gXCIjMWY3N2I0XCI7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcbiAgICAgIGZhZGUoZC5jLCAuMSk7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGVPdXQoKTtcbiAgICB9KVxuICAgIC50cmFuc2l0aW9uKClcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XG4gICAgfSlcbiAgICAuZHVyYXRpb24oNTAwKVxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGQueCk7XG4gICAgfSlcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLnkpO1xuICAgIH0pO1xuXG5cbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5jICE9IGM7XG4gICAgICB9KVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgICB9KTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHZhciB0ZW1wID17fTtcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcbiAgICB9XG4gIH1cbiAgXG5cbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG5cbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNTtcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXG4gICAgbWFyZ2luID0ge1xuICAgICAgdG9wOiAyMCxcbiAgICAgIHJpZ2h0OiAyMCxcbiAgICAgIGJvdHRvbTogMzAsXG4gICAgICBsZWZ0OiA1MFxuICAgIH0sXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbFwiXTtcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICB9KTtcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC5TdGF0ZTtcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxuXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC50b3RhbDtcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXG5cbiAgei5kb21haW4oa2V5cyk7XG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB6KGQua2V5KTtcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXG4gICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSlcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcblxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpIC8vIE5ldyBsaW5lXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxuICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7XG4gICAgfSk7XG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMTkpLmF0dHIoXCJ3aWR0aFwiLCAxOSkuYXR0cihcImhlaWdodFwiLCAxOSkuYXR0cihcImZpbGxcIiwgeik7XG4gIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjQpLmF0dHIoXCJ5XCIsIDkuNSkuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZDtcbiAgfSk7XG59XG5cblxuZnVuY3Rpb24gaW5pdFBhZ2UyKCkge1xuXG59XG5cbmZ1bmN0aW9uIGluaXRQYWdlMygpIHtcbiAgLy8gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSgpO1xufSIsIi8vdmVjdG9ycyBmb3JtYXQ6IE1hcFtzdHJpbmcodG9waWNfaWQpOiBMaXN0W2Zsb2F0XV1cbmZ1bmN0aW9uIGdldDJEVmVjdG9ycyh2ZWN0b3JzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9nZXQyRFZlY3RvcnNcIixcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgZGF0YTogdmVjdG9yc1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxuZnVuY3Rpb24gZ2V0V29yZDJWZWNDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soSlNPTi5wYXJzZShyZXNwb25zZSkpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0TERBQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvYXBpL2dldENsdXN0ZXJzV29yZDJWZWNcIixcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xuICAgICAgfSk7XG59XG5cbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKXtcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMzAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9LFxuICAgICAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgICAgICBoZWlnaHQgPSA1MDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcblxuICAgIHZhciB4ID0gZDMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxuICAgICAgICB5ID0ge30sXG4gICAgICAgIGRyYWdnaW5nID0ge307XG5cbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKCksXG4gICAgICAgIGJhY2tncm91bmQsXG4gICAgICAgIGZvcmVncm91bmQ7XG5cbiAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIiksIGRpbWVuc2lvbnM7XG5cblxuICAgIGdldFdvcmQyVmVjQ2x1c3RlcnMoW1xuXHRcdFx0W1wiZm9vZFwiLCBcImFwcGxlXCIsIFwiYmFuYW5hXCIsICBcImJpc2N1aXRcIiwgIFwiY2hpY2tlblwiXSxcblx0XHRcdFtcImNyaWNrZXRcIiwgXCJmb290YmFsbFwiLCBcImJhc2ViYWxsXCIsICBcInRlbm5pc1wiXVxuXHRcdF1cbiAgICAsIGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIGRpbWVuc2lvbnMgYW5kIGNyZWF0ZSBhIHNjYWxlIGZvciBlYWNoLlxuICAgIHZhciBjYXJzID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3AsIDAsIDApO1xuICAgIC8vIHZhciBheGlzRCA9IGQzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXG4gICAgdmFyIGF4aXNEID0gZDMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxuICAgICAgICBheGlzVCA9IGQzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcbiAgICAgICAgYXhpc1cgPSBkMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcblxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMgPSBkMy5rZXlzKGNhcnNbMF0pLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcbiAgICAgICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSkpO1xuICAgIH0pKTtcblxuICAgIC8vIEFkZCBncmV5IGJhY2tncm91bmQgbGluZXMgZm9yIGNvbnRleHQuXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXG4gICAgZm9yZWdyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCI7IH0pXG4gICAgICAgIC5jYWxsKGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbihkKSB7IHJldHVybiB7eDogeChkKX07IH0pXG4gICAgICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xuICAgICAgICAgICAgYmFja2dyb3VuZC5hdHRyKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0gTWF0aC5taW4od2lkdGgsIE1hdGgubWF4KDAsIGQzLmV2ZW50LngpKTtcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XG4gICAgICAgICAgICBkaW1lbnNpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gcG9zaXRpb24oYSkgLSBwb3NpdGlvbihiKTsgfSk7XG4gICAgICAgICAgICB4LmRvbWFpbihkaW1lbnNpb25zKTtcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XG4gICAgICAgICAgICB0cmFuc2l0aW9uKGQzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgbGV0IGF4aXMgPSBudWxsO1xuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZihkID09IFwidG9waWNcIil7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuY2FsbChcbiAgICAgICAgICAgICAgICBheGlzLnNjYWxlKHlbZF0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAuYXR0cihcInlcIiwgLTkpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICB9KTtcblxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxuICAgIGcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnJ1c2hcIilcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmNhbGwoeVtkXS5icnVzaCA9IGQzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDE2KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4gW3Bvc2l0aW9uKHApLCB5W3BdKGRbcF0pXTsgfSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XG4gICAgZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxuICAgIGZ1bmN0aW9uIGJydXNoKCkge1xuICAgIHZhciBhY3RpdmVzID0gZGltZW5zaW9ucy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gIXlbcF0uYnJ1c2guZW1wdHkoKTsgfSksXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcbiAgICBmb3JlZ3JvdW5kLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XG4gICAgICAgIH0pID8gbnVsbCA6IFwibm9uZVwiO1xuICAgIH0pO1xuICAgIH1cblxufSIsImZ1bmN0aW9uIGdlbmVyYXRlVG9waWNWZWN0b3JzKCl7XG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xuICAgIGlmKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcbiAgICAgICAgZm9yKHZhciB4IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcbiAgICAgICAgICAgIGZvcih2YXIgeSBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XSl7XG4gICAgICAgICAgICAgICAgdmVjdG9yLnB1c2god2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF1beV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2luZG93LnRvcGljVmVjdG9yc1t4XSA9IHZlY3RvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xuXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IGRvY0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BpY1wiOiB0b3BpYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndvcmRcIjogcmVzcG9uc2VbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZpc0RhdGE7XG59XG5cbiIsIndpbmRvdy52dWVBcHAgPSBuZXcgVnVlKHtcbiAgICBlbDogJyN2dWUtYXBwJyxcbiAgICBkYXRhOiB7XG4gICAgICAgIG1lc3NhZ2U6ICdIZWxsbyB1c2VyIScsXG4gICAgICAgIG5vbmVTZWxlY3RlZDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiAxLFxuICAgICAgICBwbGF5ZXJEZXRhaWw6IHtcbiAgICAgICAgICAgIG5hbWU6IFwiPFBsYXllciBOYW1lPlwiXG4gICAgICAgIH0sXG4gICAgICAgIG92ZXJ2aWV3RmlsdGVyczoge30sXG4gICAgICAgIHNlbGVjdGVkTWFwOiAxXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHNlbGVjdFBhZ2U6IGZ1bmN0aW9uKHgpe1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xuICAgICAgICAgICAgaWYgKHggPT0gMSl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UxKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT0gMil7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeCA9PSAzKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJNb3VudGVkXCIpO1xuICAgICAgICBsb2FkRDMoKTtcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xuICAgIH1cbn0pOyJdfQ==
