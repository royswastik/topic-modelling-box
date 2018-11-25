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
  renderBarGraph(0, resp);
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
      size: document_topic[key]
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
  debugger;
  var data = window.topic_word_probability;
  var topic_distribution_in_corpa = window.word_distribution_in_corpora;
  var final_data = [];
  var data = data[topic_number][0]; // data =resp["topic_word"][topic_number]

  for (var i = 0; i < data.length; i++) {
    var temp = {};
    var key = Object.keys(data[i])[0];
    var val = data[i][Object.keys(data[i])[0]];
    var overall = topic_distribution_in_corpa[key];
    temp.State = key;
    temp.topic_frequency = val;
    temp.overall = overall;
    temp.total = temp.topic_frequency + temp.overall;
    final_data.push(temp);
  }

  debugger;
  var bb = document.querySelector('#stacked-bar').getBoundingClientRect(),
      width = bb.right - bb.left;
  var data = final_data;
  var height = data.length * 25;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height),
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
    selectedPage: 3,
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5qcyIsIm1haW4uanMiLCJuZXR3b3JrLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiXSwibmFtZXMiOlsibG9hZEpxdWVyeSIsIiQiLCJkb2N1bWVudCIsInJlYWR5IiwiY2xpY2siLCJzaWRlYmFyIiwibG9hZEQzIiwiY29uc29sZSIsImxvZyIsImQzIiwianNvbiIsIngiLCJ3aW5kb3ciLCJkb2N1bWVudF90b3BpY19wcm9iYWJpbGl0eSIsInkiLCJ3b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhIiwieiIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHkiLCJnZXRBbmFseXNpcyIsImdldERvY3MiLCJ0ZXh0IiwibWV0aG9kIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJyZW5kZXJCYXJHcmFwaCIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsIndpZHRoIiwicmlnaHQiLCJsZWZ0IiwiaGVpZ2h0IiwibWFyZ2luIiwiZGF0YSIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJwdXNoIiwiYyIsInNpemUiLCJsYWJlbFgiLCJsYWJlbFkiLCJzdmciLCJzZWxlY3QiLCJhcHBlbmQiLCJhdHRyIiwic2NhbGVMaW5lYXIiLCJkb21haW4iLCJtaW4iLCJkIiwibWF4IiwicmFuZ2UiLCJzY2FsZSIsInNjYWxlU3FydCIsIm9wYWNpdHkiLCJ4QXhpcyIsImF4aXNCb3R0b20iLCJ5QXhpcyIsImF4aXNMZWZ0IiwiY2FsbCIsInN0eWxlIiwic2VsZWN0QWxsIiwiZW50ZXIiLCJpbnNlcnQiLCJvbiIsImkiLCJmYWRlIiwiZmFkZU91dCIsInRyYW5zaXRpb24iLCJkZWxheSIsImR1cmF0aW9uIiwiZmlsdGVyIiwidG9waWNfbnVtYmVyIiwidG9waWNfZGlzdHJpYnV0aW9uX2luX2NvcnBhIiwiZmluYWxfZGF0YSIsImxlbmd0aCIsInRlbXAiLCJ2YWwiLCJvdmVyYWxsIiwiU3RhdGUiLCJ0b3BpY19mcmVxdWVuY3kiLCJ0b3RhbCIsInRvcCIsImJvdHRvbSIsImciLCJzY2FsZUJhbmQiLCJyYW5nZVJvdW5kIiwicGFkZGluZ0lubmVyIiwiYWxpZ24iLCJzY2FsZU9yZGluYWwiLCJzb3J0IiwiYSIsImIiLCJtYXAiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb250ZW50VHlwZSIsImRhdGFUeXBlIiwicGFyc2UiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlIiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJ2YWx1ZXMiLCJwYXJzZUZsb2F0IiwibGluZWFyIiwiZXh0ZW50IiwicCIsInBhdGgiLCJiZWhhdmlvciIsImRyYWciLCJvcmlnaW4iLCJNYXRoIiwiZXZlbnQiLCJwb3NpdGlvbiIsImVhY2giLCJicnVzaCIsImJydXNoc3RhcnQiLCJ2Iiwic291cmNlRXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJhY3RpdmVzIiwiZW1wdHkiLCJleHRlbnRzIiwiZXZlcnkiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwidnVlQXBwIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwibmFtZSIsIm92ZXJ2aWV3RmlsdGVycyIsInNlbGVjdGVkTWFwIiwibWV0aG9kcyIsInNlbGVjdFBhZ2UiLCJtb3VudGVkIl0sIm1hcHBpbmdzIjoiOztBQUFBLFNBQVNBLFVBQVQsR0FBcUI7QUFDakJDLEVBQUFBLENBQUMsQ0FBQ0MsUUFBRCxDQUFELENBQVlDLEtBQVosQ0FBa0IsWUFBVTtBQUN4QkYsSUFBQUEsQ0FBQyxDQUFDLGlCQUFELENBQUQsQ0FBcUJHLEtBQXJCLENBQTJCLFlBQVU7QUFDakNILE1BQUFBLENBQUMsQ0FBQyxhQUFELENBQUQsQ0FDS0ksT0FETCxDQUNhLFFBRGI7QUFHSCxLQUpEO0FBTUgsR0FQRDtBQVFIOzs7QUNURCxTQUFTQyxNQUFULEdBQWtCO0FBQ2hCQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxPQUFaO0FBQ0FDLEVBQUFBLEVBQUUsQ0FBQ0MsSUFBSCxDQUFRLHNDQUFSLEVBQWdELFVBQVNDLENBQVQsRUFBVztBQUN2REMsSUFBQUEsTUFBTSxDQUFDQywwQkFBUCxHQUFtQ0YsQ0FBbkM7QUFDQUYsSUFBQUEsRUFBRSxDQUFDQyxJQUFILENBQVEsOENBQVIsRUFBd0QsVUFBU0ksQ0FBVCxFQUFXO0FBQy9ERixNQUFBQSxNQUFNLENBQUNHLDRCQUFQLEdBQXFDRCxDQUFyQztBQUNBTCxNQUFBQSxFQUFFLENBQUNDLElBQUgsQ0FBUSwyQ0FBUixFQUFxRCxVQUFTTSxDQUFULEVBQVc7QUFDNURKLFFBQUFBLE1BQU0sQ0FBQ0ssc0JBQVAsR0FBZ0NELENBQWhDO0FBQ0FFLFFBQUFBLFdBQVcsQ0FBQyxPQUFELEVBQVUsT0FBVixDQUFYO0FBQ0gsT0FIRDtBQUlILEtBTkQ7QUFPSCxHQVREO0FBV0Q7O0FBR0QsU0FBU0MsT0FBVCxDQUFpQkMsSUFBakIsRUFBdUI7QUFDckIsU0FBTyxDQUNMLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLEVBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLENBREssRUFFTCxDQUFDLElBQUQsRUFBTyxNQUFQLEVBQWUsUUFBZixFQUF5QixVQUF6QixFQUFxQyxVQUFyQyxFQUFpRCxXQUFqRCxDQUZLLENBQVA7QUFJRDs7QUFFRCxTQUFTRixXQUFULENBQXFCRSxJQUFyQixFQUEyQkMsTUFBM0IsRUFBbUM7QUFDakMsTUFBSUMsSUFBSSxHQUFHSCxPQUFPLENBQUNDLElBQUQsQ0FBbEI7O0FBQ0EsTUFBSUcsR0FBRyxHQUFHLGFBQUFaLENBQUM7QUFBQSxXQUFJQSxDQUFKO0FBQUEsR0FBWDs7QUFDQSxNQUFJVSxNQUFNLElBQUksS0FBZCxFQUFxQjtBQUNuQkUsSUFBQUEsR0FBRyxHQUFHQyxjQUFOO0FBQ0QsR0FGRCxNQUVPO0FBQ0xELElBQUFBLEdBQUcsR0FBR0UsbUJBQU47QUFDRDs7QUFDREYsRUFBQUEsR0FBRyxDQUFDRCxJQUFELEVBQU8sVUFBQUksSUFBSSxFQUFJO0FBQ2hCQyxJQUFBQSxTQUFTLENBQUNELElBQUQsQ0FBVDtBQUNBRSxJQUFBQSxTQUFTLENBQUNGLElBQUQsQ0FBVDtBQUNBRyxJQUFBQSxTQUFTLENBQUNILElBQUQsQ0FBVDtBQUNELEdBSkUsQ0FBSDtBQUtEOztBQUVELFNBQVNJLGtCQUFULEdBQThCLENBRTdCOztBQUVELFNBQVNILFNBQVQsQ0FBbUJELElBQW5CLEVBQXlCO0FBQ3ZCSyxFQUFBQSxxQkFBcUIsQ0FBQ0wsSUFBRCxDQUFyQjtBQUNBTSxFQUFBQSxjQUFjLENBQUMsQ0FBRCxFQUFJTixJQUFKLENBQWQ7QUFDRDs7QUFHRCxTQUFTSyxxQkFBVCxDQUErQkwsSUFBL0IsRUFBcUM7QUFDbkMsTUFBSU8sY0FBYyxHQUFHUCxJQUFJLENBQUMsZ0JBQUQsQ0FBSixDQUF1QixDQUF2QixDQUFyQjtBQUNBLE1BQUlRLGFBQWEsR0FBR1IsSUFBSSxDQUFDLGVBQUQsQ0FBeEI7QUFDQSxNQUFJUyxFQUFFLEdBQUdqQyxRQUFRLENBQUNrQyxhQUFULENBQXVCLFVBQXZCLEVBQ05DLHFCQURNLEVBQVQ7QUFBQSxNQUVFQyxLQUFLLEdBQUdILEVBQUUsQ0FBQ0ksS0FBSCxHQUFXSixFQUFFLENBQUNLLElBRnhCO0FBR0EsTUFBSUMsTUFBTSxHQUFHLEdBQWI7QUFDQSxNQUFJQyxNQUFNLEdBQUcsRUFBYjtBQUNBLE1BQUlDLElBQUksR0FBRyxFQUFYO0FBRUFDLEVBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZWCxhQUFaLEVBQTJCWSxPQUEzQixDQUFtQyxVQUFTQyxHQUFULEVBQWM7QUFDL0MsUUFBSUMsS0FBSyxHQUFHZCxhQUFhLENBQUNhLEdBQUQsQ0FBekI7QUFDQUosSUFBQUEsSUFBSSxDQUFDTSxJQUFMLENBQVU7QUFDUnRDLE1BQUFBLENBQUMsRUFBRXFDLEtBQUssQ0FBQyxDQUFELENBREE7QUFFUmxDLE1BQUFBLENBQUMsRUFBRWtDLEtBQUssQ0FBQyxDQUFELENBRkE7QUFHUkUsTUFBQUEsQ0FBQyxFQUFFLENBSEs7QUFJUkMsTUFBQUEsSUFBSSxFQUFFbEIsY0FBYyxDQUFDYyxHQUFEO0FBSlosS0FBVjtBQU1ELEdBUkQ7QUFTQSxNQUFJSyxNQUFNLEdBQUcsR0FBYjtBQUNBLE1BQUlDLE1BQU0sR0FBRyxHQUFiO0FBRUEsTUFBSUMsR0FBRyxHQUFHN0MsRUFBRSxDQUFDOEMsTUFBSCxDQUFVLFVBQVYsRUFDUEMsTUFETyxDQUNBLEtBREEsRUFFUEMsSUFGTyxDQUVGLE9BRkUsRUFFTyxPQUZQLEVBR1BBLElBSE8sQ0FHRixPQUhFLEVBR09uQixLQUFLLEdBQUdJLE1BQVIsR0FBaUJBLE1BSHhCLEVBSVBlLElBSk8sQ0FJRixRQUpFLEVBSVFoQixNQUFNLEdBQUdDLE1BQVQsR0FBa0JBLE1BSjFCLEVBS1BjLE1BTE8sQ0FLQSxHQUxBLEVBTVBDLElBTk8sQ0FNRixXQU5FLEVBTVcsZUFBZWYsTUFBZixHQUF3QixHQUF4QixHQUE4QkEsTUFBOUIsR0FBdUMsR0FObEQsQ0FBVjtBQVFBLE1BQUkvQixDQUFDLEdBQUdGLEVBQUUsQ0FBQ2lELFdBQUgsR0FDTEMsTUFESyxDQUNFLENBQUNsRCxFQUFFLENBQUNtRCxHQUFILENBQU9qQixJQUFQLEVBQWEsVUFBVWtCLENBQVYsRUFBYTtBQUNqQyxXQUFPQSxDQUFDLENBQUNsRCxDQUFUO0FBQ0QsR0FGUSxDQUFELEVBRUpGLEVBQUUsQ0FBQ3FELEdBQUgsQ0FBT25CLElBQVAsRUFBYSxVQUFVa0IsQ0FBVixFQUFhO0FBQzVCLFdBQU9BLENBQUMsQ0FBQ2xELENBQVQ7QUFDRCxHQUZHLENBRkksQ0FERixFQU1Mb0QsS0FOSyxDQU1DLENBQUMsQ0FBRCxFQUFJekIsS0FBSixDQU5ELENBQVI7QUFRQSxNQUFJeEIsQ0FBQyxHQUFHTCxFQUFFLENBQUNpRCxXQUFILEdBQ0xDLE1BREssQ0FDRSxDQUFDbEQsRUFBRSxDQUFDbUQsR0FBSCxDQUFPakIsSUFBUCxFQUFhLFVBQVVrQixDQUFWLEVBQWE7QUFDakMsV0FBT0EsQ0FBQyxDQUFDL0MsQ0FBVDtBQUNELEdBRlEsQ0FBRCxFQUVKTCxFQUFFLENBQUNxRCxHQUFILENBQU9uQixJQUFQLEVBQWEsVUFBVWtCLENBQVYsRUFBYTtBQUM1QixXQUFPQSxDQUFDLENBQUMvQyxDQUFUO0FBQ0QsR0FGRyxDQUZJLENBREYsRUFNTGlELEtBTkssQ0FNQyxDQUFDdEIsTUFBRCxFQUFTLENBQVQsQ0FORCxDQUFSO0FBUUEsTUFBSXVCLEtBQUssR0FBR3ZELEVBQUUsQ0FBQ3dELFNBQUgsR0FDVE4sTUFEUyxDQUNGLENBQUNsRCxFQUFFLENBQUNtRCxHQUFILENBQU9qQixJQUFQLEVBQWEsVUFBVWtCLENBQVYsRUFBYTtBQUNqQyxXQUFPQSxDQUFDLENBQUNWLElBQVQ7QUFDRCxHQUZRLENBQUQsRUFFSjFDLEVBQUUsQ0FBQ3FELEdBQUgsQ0FBT25CLElBQVAsRUFBYSxVQUFVa0IsQ0FBVixFQUFhO0FBQzVCLFdBQU9BLENBQUMsQ0FBQ1YsSUFBVDtBQUNELEdBRkcsQ0FGSSxDQURFLEVBTVRZLEtBTlMsQ0FNSCxDQUFDLENBQUQsRUFBSSxFQUFKLENBTkcsQ0FBWjtBQVFBLE1BQUlHLE9BQU8sR0FBR3pELEVBQUUsQ0FBQ3dELFNBQUgsR0FDWE4sTUFEVyxDQUNKLENBQUNsRCxFQUFFLENBQUNtRCxHQUFILENBQU9qQixJQUFQLEVBQWEsVUFBVWtCLENBQVYsRUFBYTtBQUNqQyxXQUFPQSxDQUFDLENBQUNWLElBQVQ7QUFDRCxHQUZRLENBQUQsRUFFSjFDLEVBQUUsQ0FBQ3FELEdBQUgsQ0FBT25CLElBQVAsRUFBYSxVQUFVa0IsQ0FBVixFQUFhO0FBQzVCLFdBQU9BLENBQUMsQ0FBQ1YsSUFBVDtBQUNELEdBRkcsQ0FGSSxDQURJLEVBTVhZLEtBTlcsQ0FNTCxDQUFDLENBQUQsRUFBSSxFQUFKLENBTkssQ0FBZDtBQVNBLE1BQUlJLEtBQUssR0FBRzFELEVBQUUsQ0FBQzJELFVBQUgsR0FBZ0JKLEtBQWhCLENBQXNCckQsQ0FBdEIsQ0FBWjtBQUNBLE1BQUkwRCxLQUFLLEdBQUc1RCxFQUFFLENBQUM2RCxRQUFILEdBQWNOLEtBQWQsQ0FBb0JsRCxDQUFwQixDQUFaO0FBR0F3QyxFQUFBQSxHQUFHLENBQUNFLE1BQUosQ0FBVyxHQUFYLEVBQ0dDLElBREgsQ0FDUSxPQURSLEVBQ2lCLFFBRGpCLEVBRUdjLElBRkgsQ0FFUUYsS0FGUixFQUdHYixNQUhILENBR1UsTUFIVixFQUlHQyxJQUpILENBSVEsV0FKUixFQUlxQixhQUpyQixFQUtHQSxJQUxILENBS1EsR0FMUixFQUthLEVBTGIsRUFNR0EsSUFOSCxDQU1RLEdBTlIsRUFNYSxDQUFDZixNQU5kLEVBT0dlLElBUEgsQ0FPUSxJQVBSLEVBT2MsT0FQZCxFQVFHZSxLQVJILENBUVMsYUFSVCxFQVF3QixLQVJ4QixFQVNHcEQsSUFUSCxDQVNRaUMsTUFUUixFQW5FbUMsQ0E2RW5DOztBQUNBQyxFQUFBQSxHQUFHLENBQUNFLE1BQUosQ0FBVyxHQUFYLEVBQ0dDLElBREgsQ0FDUSxPQURSLEVBQ2lCLFFBRGpCLEVBRUdBLElBRkgsQ0FFUSxXQUZSLEVBRXFCLGlCQUFpQmhCLE1BQWpCLEdBQTBCLEdBRi9DLEVBR0c4QixJQUhILENBR1FKLEtBSFIsRUFJR1gsTUFKSCxDQUlVLE1BSlYsRUFLR0MsSUFMSCxDQUtRLEdBTFIsRUFLYW5CLEtBQUssR0FBRyxFQUxyQixFQU1HbUIsSUFOSCxDQU1RLEdBTlIsRUFNYWYsTUFBTSxHQUFHLEVBTnRCLEVBT0dlLElBUEgsQ0FPUSxJQVBSLEVBT2MsT0FQZCxFQVFHZSxLQVJILENBUVMsYUFSVCxFQVF3QixLQVJ4QixFQVNHcEQsSUFUSCxDQVNRZ0MsTUFUUjtBQVdBRSxFQUFBQSxHQUFHLENBQUNtQixTQUFKLENBQWMsUUFBZCxFQUNHOUIsSUFESCxDQUNRQSxJQURSLEVBRUcrQixLQUZILEdBR0dsQixNQUhILENBR1UsR0FIVixFQUlHbUIsTUFKSCxDQUlVLFFBSlYsRUFLR2xCLElBTEgsQ0FLUSxJQUxSLEVBS2NuQixLQUFLLEdBQUcsQ0FMdEIsRUFNR21CLElBTkgsQ0FNUSxJQU5SLEVBTWNoQixNQUFNLEdBQUcsQ0FOdkIsRUFPR2dCLElBUEgsQ0FPUSxTQVBSLEVBT21CLFVBQVVJLENBQVYsRUFBYTtBQUM1QixXQUFPSyxPQUFPLENBQUNMLENBQUMsQ0FBQ1YsSUFBSCxDQUFkO0FBQ0QsR0FUSCxFQVVHTSxJQVZILENBVVEsR0FWUixFQVVhLFVBQVVJLENBQVYsRUFBYTtBQUN0QixXQUFPRyxLQUFLLENBQUNILENBQUMsQ0FBQ1YsSUFBSCxDQUFaO0FBQ0QsR0FaSCxFQWFHcUIsS0FiSCxDQWFTLE1BYlQsRUFhaUIsVUFBVVgsQ0FBVixFQUFhO0FBQzFCLFdBQU8sU0FBUDtBQUNELEdBZkgsRUFnQkdlLEVBaEJILENBZ0JNLFdBaEJOLEVBZ0JtQixVQUFVZixDQUFWLEVBQWFnQixDQUFiLEVBQWdCO0FBQy9CQyxJQUFBQSxJQUFJLENBQUNqQixDQUFDLENBQUNYLENBQUgsRUFBTSxFQUFOLENBQUo7QUFDRCxHQWxCSCxFQW1CRzBCLEVBbkJILENBbUJNLFVBbkJOLEVBbUJrQixVQUFVZixDQUFWLEVBQWFnQixDQUFiLEVBQWdCO0FBQzlCRSxJQUFBQSxPQUFPO0FBQ1IsR0FyQkgsRUFzQkdDLFVBdEJILEdBdUJHQyxLQXZCSCxDQXVCUyxVQUFVcEIsQ0FBVixFQUFhZ0IsQ0FBYixFQUFnQjtBQUNyQixXQUFPbEUsQ0FBQyxDQUFDa0QsQ0FBQyxDQUFDbEQsQ0FBSCxDQUFELEdBQVNHLENBQUMsQ0FBQytDLENBQUMsQ0FBQy9DLENBQUgsQ0FBakI7QUFDRCxHQXpCSCxFQTBCR29FLFFBMUJILENBMEJZLEdBMUJaLEVBMkJHekIsSUEzQkgsQ0EyQlEsSUEzQlIsRUEyQmMsVUFBVUksQ0FBVixFQUFhO0FBQ3ZCLFdBQU9sRCxDQUFDLENBQUNrRCxDQUFDLENBQUNsRCxDQUFILENBQVI7QUFDRCxHQTdCSCxFQThCRzhDLElBOUJILENBOEJRLElBOUJSLEVBOEJjLFVBQVVJLENBQVYsRUFBYTtBQUN2QixXQUFPL0MsQ0FBQyxDQUFDK0MsQ0FBQyxDQUFDL0MsQ0FBSCxDQUFSO0FBQ0QsR0FoQ0g7O0FBbUNBLFdBQVNnRSxJQUFULENBQWM1QixDQUFkLEVBQWlCZ0IsT0FBakIsRUFBMEI7QUFDeEJaLElBQUFBLEdBQUcsQ0FBQ21CLFNBQUosQ0FBYyxRQUFkLEVBQ0dVLE1BREgsQ0FDVSxVQUFVdEIsQ0FBVixFQUFhO0FBQ25CLGFBQU9BLENBQUMsQ0FBQ1gsQ0FBRixJQUFPQSxDQUFkO0FBQ0QsS0FISCxFQUlHOEIsVUFKSCxHQUtHUixLQUxILENBS1MsU0FMVCxFQUtvQk4sT0FMcEI7QUFNRDs7QUFFRCxXQUFTYSxPQUFULEdBQW1CO0FBQ2pCekIsSUFBQUEsR0FBRyxDQUFDbUIsU0FBSixDQUFjLFFBQWQsRUFDR08sVUFESCxHQUVHUixLQUZILENBRVMsU0FGVCxFQUVvQixVQUFVWCxDQUFWLEVBQWE7QUFDN0JLLE1BQUFBLE9BQU8sQ0FBQ0wsQ0FBQyxDQUFDVixJQUFILENBQVA7QUFDRCxLQUpIO0FBS0Q7QUFDRjs7QUFHRCxTQUFTbkIsY0FBVCxDQUF3Qm9ELFlBQXhCLEVBQXNDMUQsSUFBdEMsRUFBNEM7QUFDMUM7QUFDQSxNQUFJaUIsSUFBSSxHQUFHL0IsTUFBTSxDQUFDSyxzQkFBbEI7QUFDQSxNQUFJb0UsMkJBQTJCLEdBQUd6RSxNQUFNLENBQUNHLDRCQUF6QztBQUNBLE1BQUl1RSxVQUFVLEdBQUcsRUFBakI7QUFDQSxNQUFJM0MsSUFBSSxHQUFHQSxJQUFJLENBQUN5QyxZQUFELENBQUosQ0FBbUIsQ0FBbkIsQ0FBWCxDQUwwQyxDQVExQzs7QUFLQSxPQUFLLElBQUlQLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdsQyxJQUFJLENBQUM0QyxNQUF6QixFQUFpQ1YsQ0FBQyxFQUFsQyxFQUFzQztBQUNwQyxRQUFJVyxJQUFJLEdBQUcsRUFBWDtBQUNBLFFBQUl6QyxHQUFHLEdBQUdILE1BQU0sQ0FBQ0MsSUFBUCxDQUFZRixJQUFJLENBQUNrQyxDQUFELENBQWhCLEVBQXFCLENBQXJCLENBQVY7QUFDQSxRQUFJWSxHQUFHLEdBQUc5QyxJQUFJLENBQUNrQyxDQUFELENBQUosQ0FBUWpDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZRixJQUFJLENBQUNrQyxDQUFELENBQWhCLEVBQXFCLENBQXJCLENBQVIsQ0FBVjtBQUNBLFFBQUlhLE9BQU8sR0FBR0wsMkJBQTJCLENBQUN0QyxHQUFELENBQXpDO0FBQ0F5QyxJQUFBQSxJQUFJLENBQUNHLEtBQUwsR0FBYTVDLEdBQWI7QUFDQXlDLElBQUFBLElBQUksQ0FBQ0ksZUFBTCxHQUF1QkgsR0FBdkI7QUFDQUQsSUFBQUEsSUFBSSxDQUFDRSxPQUFMLEdBQWVBLE9BQWY7QUFDQUYsSUFBQUEsSUFBSSxDQUFDSyxLQUFMLEdBQWFMLElBQUksQ0FBQ0ksZUFBTCxHQUF1QkosSUFBSSxDQUFDRSxPQUF6QztBQUNBSixJQUFBQSxVQUFVLENBQUNyQyxJQUFYLENBQWdCdUMsSUFBaEI7QUFDRDs7QUFHRDtBQUVBLE1BQUlyRCxFQUFFLEdBQUdqQyxRQUFRLENBQUNrQyxhQUFULENBQXVCLGNBQXZCLEVBQ05DLHFCQURNLEVBQVQ7QUFBQSxNQUVFQyxLQUFLLEdBQUdILEVBQUUsQ0FBQ0ksS0FBSCxHQUFXSixFQUFFLENBQUNLLElBRnhCO0FBSUEsTUFBSUcsSUFBSSxHQUFHMkMsVUFBWDtBQUNBLE1BQUk3QyxNQUFNLEdBQUdFLElBQUksQ0FBQzRDLE1BQUwsR0FBYyxFQUEzQjtBQUNBLE1BQUlqQyxHQUFHLEdBQUc3QyxFQUFFLENBQUM4QyxNQUFILENBQVUsY0FBVixFQUEwQkMsTUFBMUIsQ0FBaUMsS0FBakMsRUFBd0NDLElBQXhDLENBQTZDLE9BQTdDLEVBQXNEbkIsS0FBdEQsRUFBNkRtQixJQUE3RCxDQUFrRSxRQUFsRSxFQUE0RWhCLE1BQTVFLENBQVY7QUFBQSxNQUNFQyxNQUFNLEdBQUc7QUFDUG9ELElBQUFBLEdBQUcsRUFBRSxFQURFO0FBRVB2RCxJQUFBQSxLQUFLLEVBQUUsRUFGQTtBQUdQd0QsSUFBQUEsTUFBTSxFQUFFLEVBSEQ7QUFJUHZELElBQUFBLElBQUksRUFBRTtBQUpDLEdBRFg7QUFBQSxNQU9FRixLQUFLLEdBQUcsQ0FBQ2dCLEdBQUcsQ0FBQ0csSUFBSixDQUFTLE9BQVQsQ0FBRCxHQUFxQmYsTUFBTSxDQUFDRixJQUE1QixHQUFtQ0UsTUFBTSxDQUFDSCxLQVBwRDtBQUFBLE1BUUVFLE1BQU0sR0FBRyxDQUFDYSxHQUFHLENBQUNHLElBQUosQ0FBUyxRQUFULENBQUQsR0FBc0JmLE1BQU0sQ0FBQ29ELEdBQTdCLEdBQW1DcEQsTUFBTSxDQUFDcUQsTUFSckQ7QUFBQSxNQVNFQyxDQUFDLEdBQUcxQyxHQUFHLENBQUNFLE1BQUosQ0FBVyxHQUFYLEVBQWdCQyxJQUFoQixDQUFxQixXQUFyQixFQUFrQyxlQUFlZixNQUFNLENBQUNGLElBQXRCLEdBQTZCLEdBQTdCLEdBQW1DRSxNQUFNLENBQUNvRCxHQUExQyxHQUFnRCxHQUFsRixDQVROO0FBVUEsTUFBSWhGLENBQUMsR0FBR0wsRUFBRSxDQUFDd0YsU0FBSCxHQUFlO0FBQWYsR0FDTEMsVUFESyxDQUNNLENBQUMsQ0FBRCxFQUFJekQsTUFBSixDQUROLEVBQ21CO0FBRG5CLEdBRUwwRCxZQUZLLENBRVEsSUFGUixFQUVjQyxLQUZkLENBRW9CLEdBRnBCLENBQVI7QUFHQSxNQUFJekYsQ0FBQyxHQUFHRixFQUFFLENBQUNpRCxXQUFILEdBQWlCO0FBQWpCLEdBQ0x3QyxVQURLLENBQ00sQ0FBQyxDQUFELEVBQUk1RCxLQUFKLENBRE4sQ0FBUixDQS9DMEMsQ0FnRGY7O0FBRTNCLE1BQUl0QixDQUFDLEdBQUdQLEVBQUUsQ0FBQzRGLFlBQUgsR0FBa0J0QyxLQUFsQixDQUF3QixDQUFDLFNBQUQsRUFBWSxTQUFaLENBQXhCLENBQVI7QUFDQSxNQUFJbEIsSUFBSSxHQUFHLENBQUMsaUJBQUQsRUFBb0IsU0FBcEIsQ0FBWDtBQUNBRixFQUFBQSxJQUFJLENBQUMyRCxJQUFMLENBQVUsVUFBVUMsQ0FBVixFQUFhQyxDQUFiLEVBQWdCO0FBQ3hCLFdBQU9BLENBQUMsQ0FBQ1gsS0FBRixHQUFVVSxDQUFDLENBQUNWLEtBQW5CO0FBQ0QsR0FGRDtBQUdBL0UsRUFBQUEsQ0FBQyxDQUFDNkMsTUFBRixDQUFTaEIsSUFBSSxDQUFDOEQsR0FBTCxDQUFTLFVBQVU1QyxDQUFWLEVBQWE7QUFDN0IsV0FBT0EsQ0FBQyxDQUFDOEIsS0FBVDtBQUNELEdBRlEsQ0FBVCxFQXZEMEMsQ0F5RHJDOztBQUVMaEYsRUFBQUEsQ0FBQyxDQUFDZ0QsTUFBRixDQUFTLENBQUMsQ0FBRCxFQUFJbEQsRUFBRSxDQUFDcUQsR0FBSCxDQUFPbkIsSUFBUCxFQUFhLFVBQVVrQixDQUFWLEVBQWE7QUFDckMsV0FBT0EsQ0FBQyxDQUFDZ0MsS0FBVDtBQUNELEdBRlksQ0FBSixDQUFULEVBRUthLElBRkwsR0EzRDBDLENBNkQ3Qjs7QUFFYjFGLEVBQUFBLENBQUMsQ0FBQzJDLE1BQUYsQ0FBU2QsSUFBVDtBQUNBbUQsRUFBQUEsQ0FBQyxDQUFDeEMsTUFBRixDQUFTLEdBQVQsRUFBY2lCLFNBQWQsQ0FBd0IsR0FBeEIsRUFBNkI5QixJQUE3QixDQUFrQ2xDLEVBQUUsQ0FBQ2tHLEtBQUgsR0FBVzlELElBQVgsQ0FBZ0JBLElBQWhCLEVBQXNCRixJQUF0QixDQUFsQyxFQUErRCtCLEtBQS9ELEdBQXVFbEIsTUFBdkUsQ0FBOEUsR0FBOUUsRUFBbUZDLElBQW5GLENBQXdGLE1BQXhGLEVBQWdHLFVBQVVJLENBQVYsRUFBYTtBQUN6RyxXQUFPN0MsQ0FBQyxDQUFDNkMsQ0FBQyxDQUFDZCxHQUFILENBQVI7QUFDRCxHQUZILEVBRUswQixTQUZMLENBRWUsTUFGZixFQUV1QjlCLElBRnZCLENBRTRCLFVBQVVrQixDQUFWLEVBQWE7QUFDckMsV0FBT0EsQ0FBUDtBQUNELEdBSkgsRUFJS2EsS0FKTCxHQUlhbEIsTUFKYixDQUlvQixNQUpwQixFQUk0QkMsSUFKNUIsQ0FJaUMsR0FKakMsRUFJc0MsVUFBVUksQ0FBVixFQUFhO0FBQy9DLFdBQU8vQyxDQUFDLENBQUMrQyxDQUFDLENBQUNsQixJQUFGLENBQU9nRCxLQUFSLENBQVI7QUFDRCxHQU5ILEVBTUs7QUFOTCxHQU9HbEMsSUFQSCxDQU9RLEdBUFIsRUFPYSxVQUFVSSxDQUFWLEVBQWE7QUFDdEIsV0FBT2xELENBQUMsQ0FBQ2tELENBQUMsQ0FBQyxDQUFELENBQUYsQ0FBUjtBQUNELEdBVEgsRUFTSztBQVRMLEdBVUdKLElBVkgsQ0FVUSxPQVZSLEVBVWlCLFVBQVVJLENBQVYsRUFBYTtBQUMxQixXQUFPbEQsQ0FBQyxDQUFDa0QsQ0FBQyxDQUFDLENBQUQsQ0FBRixDQUFELEdBQVVsRCxDQUFDLENBQUNrRCxDQUFDLENBQUMsQ0FBRCxDQUFGLENBQWxCO0FBQ0QsR0FaSCxFQVlLO0FBWkwsR0FhR0osSUFiSCxDQWFRLFFBYlIsRUFha0IzQyxDQUFDLENBQUM4RixTQUFGLEVBYmxCLEVBY0duRCxJQWRILENBY1EsU0FkUixFQWNtQixHQWRuQixFQWhFMEMsQ0E4RWpCOztBQUV6QnVDLEVBQUFBLENBQUMsQ0FBQ3hDLE1BQUYsQ0FBUyxHQUFULEVBQWNDLElBQWQsQ0FBbUIsT0FBbkIsRUFBNEIsTUFBNUIsRUFBb0NBLElBQXBDLENBQXlDLFdBQXpDLEVBQXNELGdCQUF0RCxFQUF3RTtBQUF4RSxHQUNHYyxJQURILENBQ1E5RCxFQUFFLENBQUM2RCxRQUFILENBQVl4RCxDQUFaLENBRFIsRUFoRjBDLENBaUZqQjs7QUFFekJrRixFQUFBQSxDQUFDLENBQUN4QyxNQUFGLENBQVMsR0FBVCxFQUFjQyxJQUFkLENBQW1CLE9BQW5CLEVBQTRCLE1BQTVCLEVBQW9DQSxJQUFwQyxDQUF5QyxXQUF6QyxFQUFzRCxpQkFBaUJoQixNQUFqQixHQUEwQixHQUFoRixFQUFxRjtBQUFyRixHQUNHOEIsSUFESCxDQUNROUQsRUFBRSxDQUFDMkQsVUFBSCxDQUFjekQsQ0FBZCxFQUFpQmtHLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCLEdBQTdCLENBRFIsRUFDMkM7QUFEM0MsR0FFR3JELE1BRkgsQ0FFVSxNQUZWLEVBRWtCQyxJQUZsQixDQUV1QixHQUZ2QixFQUU0QixDQUY1QixFQUUrQjtBQUYvQixHQUdHQSxJQUhILENBR1EsR0FIUixFQUdhOUMsQ0FBQyxDQUFDQSxDQUFDLENBQUNrRyxLQUFGLEdBQVVDLEdBQVYsRUFBRCxDQUFELEdBQXFCLEdBSGxDLEVBR3VDO0FBSHZDLEdBSUdyRCxJQUpILENBSVEsSUFKUixFQUljLFFBSmQsRUFuRjBDLENBdUZsQjs7QUFDeEIsTUFBSXNELE1BQU0sR0FBR2YsQ0FBQyxDQUFDeEMsTUFBRixDQUFTLEdBQVQsRUFBY0MsSUFBZCxDQUFtQixhQUFuQixFQUFrQyxZQUFsQyxFQUFnREEsSUFBaEQsQ0FBcUQsV0FBckQsRUFBa0UsRUFBbEUsRUFBc0VBLElBQXRFLENBQTJFLGFBQTNFLEVBQTBGLEtBQTFGLEVBQWlHZ0IsU0FBakcsQ0FBMkcsR0FBM0csRUFBZ0g5QixJQUFoSCxDQUFxSEUsSUFBSSxDQUFDbUUsS0FBTCxHQUFhQyxPQUFiLEVBQXJILEVBQTZJdkMsS0FBN0ksR0FBcUpsQixNQUFySixDQUE0SixHQUE1SixFQUFpSztBQUFqSyxHQUNWQyxJQURVLENBQ0wsV0FESyxFQUNRLFVBQVVJLENBQVYsRUFBYWdCLENBQWIsRUFBZ0I7QUFDakMsV0FBTyxvQkFBb0IsTUFBTUEsQ0FBQyxHQUFHLEVBQTlCLElBQW9DLEdBQTNDO0FBQ0QsR0FIVSxDQUFiO0FBSUFrQyxFQUFBQSxNQUFNLENBQUN2RCxNQUFQLENBQWMsTUFBZCxFQUFzQkMsSUFBdEIsQ0FBMkIsR0FBM0IsRUFBZ0NuQixLQUFLLEdBQUcsRUFBeEMsRUFBNENtQixJQUE1QyxDQUFpRCxPQUFqRCxFQUEwRCxFQUExRCxFQUE4REEsSUFBOUQsQ0FBbUUsUUFBbkUsRUFBNkUsRUFBN0UsRUFBaUZBLElBQWpGLENBQXNGLE1BQXRGLEVBQThGekMsQ0FBOUY7QUFDQStGLEVBQUFBLE1BQU0sQ0FBQ3ZELE1BQVAsQ0FBYyxNQUFkLEVBQXNCQyxJQUF0QixDQUEyQixHQUEzQixFQUFnQ25CLEtBQUssR0FBRyxFQUF4QyxFQUE0Q21CLElBQTVDLENBQWlELEdBQWpELEVBQXNELEdBQXRELEVBQTJEQSxJQUEzRCxDQUFnRSxJQUFoRSxFQUFzRSxRQUF0RSxFQUFnRnJDLElBQWhGLENBQXFGLFVBQVV5QyxDQUFWLEVBQWE7QUFDaEcsV0FBT0EsQ0FBUDtBQUNELEdBRkQ7QUFHRDs7QUFHRCxTQUFTakMsU0FBVCxHQUFxQixDQUVwQjs7QUFFRCxTQUFTQyxTQUFULEdBQXFCLENBQ25CO0FBQ0Q7OztBQ3hTRDtBQUNBLFNBQVNxRixZQUFULENBQXNCQyxPQUF0QixFQUErQkMsZUFBL0IsRUFBK0M7QUFDM0MsTUFBSUMsT0FBTyxHQUFHcEgsQ0FBQyxDQUFDcUgsSUFBRixDQUFPO0FBQ2pCQyxJQUFBQSxHQUFHLEVBQUUsZUFEWTtBQUVqQmxHLElBQUFBLE1BQU0sRUFBRSxNQUZTO0FBR2pCc0IsSUFBQUEsSUFBSSxFQUFFd0U7QUFIVyxHQUFQLENBQWQ7QUFNRUUsRUFBQUEsT0FBTyxDQUFDRyxJQUFSLENBQWEsVUFBVUMsUUFBVixFQUFxQjtBQUNoQ0wsSUFBQUEsZUFBZSxDQUFDSyxRQUFELENBQWY7QUFDRCxHQUZEO0FBSUFKLEVBQUFBLE9BQU8sQ0FBQ0ssSUFBUixDQUFhLFVBQVVDLEtBQVYsRUFBaUJDLFVBQWpCLEVBQThCO0FBQ3pDQyxJQUFBQSxLQUFLLENBQUUscUJBQXFCRCxVQUF2QixDQUFMO0FBQ0QsR0FGRDtBQUdMLEMsQ0FFRDs7O0FBQ0EsU0FBU25HLG1CQUFULENBQTZCSCxJQUE3QixFQUFtQzhGLGVBQW5DLEVBQW1EO0FBQy9DLE1BQUlDLE9BQU8sR0FBR3BILENBQUMsQ0FBQ3FILElBQUYsQ0FBTztBQUNqQkMsSUFBQUEsR0FBRyxFQUFFLDBCQURZO0FBRWpCbEcsSUFBQUEsTUFBTSxFQUFFLE1BRlM7QUFHakJzQixJQUFBQSxJQUFJLEVBQUVtRixJQUFJLENBQUNDLFNBQUwsQ0FBZTtBQUFDekcsTUFBQUEsSUFBSSxFQUFFQTtBQUFQLEtBQWYsQ0FIVztBQUlqQjBHLElBQUFBLFdBQVcsRUFBRSxpQ0FKSTtBQUtqQkMsSUFBQUEsUUFBUSxFQUFLO0FBTEksR0FBUCxDQUFkO0FBUUVaLEVBQUFBLE9BQU8sQ0FBQ0csSUFBUixDQUFhLFVBQVVDLFFBQVYsRUFBcUI7QUFDaENMLElBQUFBLGVBQWUsQ0FBQ1UsSUFBSSxDQUFDSSxLQUFMLENBQVdULFFBQVgsQ0FBRCxDQUFmO0FBQ0QsR0FGRDtBQUlBSixFQUFBQSxPQUFPLENBQUNLLElBQVIsQ0FBYSxVQUFVQyxLQUFWLEVBQWlCQyxVQUFqQixFQUE4QjtBQUN6Q0MsSUFBQUEsS0FBSyxDQUFFLHFCQUFxQkQsVUFBdkIsQ0FBTDtBQUNELEdBRkQ7QUFHTDs7QUFFRCxTQUFTcEcsY0FBVCxDQUF3QkYsSUFBeEIsRUFBOEI4RixlQUE5QixFQUE4QztBQUMxQyxNQUFJQyxPQUFPLEdBQUdwSCxDQUFDLENBQUNxSCxJQUFGLENBQU87QUFDakJDLElBQUFBLEdBQUcsRUFBRSwwQkFEWTtBQUVqQmxHLElBQUFBLE1BQU0sRUFBRSxNQUZTO0FBR2pCc0IsSUFBQUEsSUFBSSxFQUFFbUYsSUFBSSxDQUFDQyxTQUFMLENBQWU7QUFBQ3pHLE1BQUFBLElBQUksRUFBRUE7QUFBUCxLQUFmLENBSFc7QUFJakIwRyxJQUFBQSxXQUFXLEVBQUUsaUNBSkk7QUFLakJDLElBQUFBLFFBQVEsRUFBSztBQUxJLEdBQVAsQ0FBZDtBQVFFWixFQUFBQSxPQUFPLENBQUNHLElBQVIsQ0FBYSxVQUFVQyxRQUFWLEVBQXFCO0FBQ2hDTCxJQUFBQSxlQUFlLENBQUNLLFFBQUQsQ0FBZjtBQUNELEdBRkQ7QUFJQUosRUFBQUEsT0FBTyxDQUFDSyxJQUFSLENBQWEsVUFBVUMsS0FBVixFQUFpQkMsVUFBakIsRUFBOEI7QUFDekNDLElBQUFBLEtBQUssQ0FBRSxxQkFBcUJELFVBQXZCLENBQUw7QUFDRCxHQUZEO0FBR0w7OztBQ3BERCxTQUFTTyxzQkFBVCxHQUFpQztBQUM3QixNQUFJekYsTUFBTSxHQUFHO0FBQUNvRCxJQUFBQSxHQUFHLEVBQUUsRUFBTjtBQUFVdkQsSUFBQUEsS0FBSyxFQUFFLEVBQWpCO0FBQXFCd0QsSUFBQUEsTUFBTSxFQUFFLEVBQTdCO0FBQWlDdkQsSUFBQUEsSUFBSSxFQUFFO0FBQXZDLEdBQWI7QUFBQSxNQUNJRixLQUFLLEdBQUcsTUFBTUksTUFBTSxDQUFDRixJQUFiLEdBQW9CRSxNQUFNLENBQUNILEtBRHZDO0FBQUEsTUFFSUUsTUFBTSxHQUFHLE1BQU1DLE1BQU0sQ0FBQ29ELEdBQWIsR0FBbUJwRCxNQUFNLENBQUNxRCxNQUZ2QztBQUlBLE1BQUlwRixDQUFDLEdBQUdGLEVBQUUsQ0FBQ3VELEtBQUgsQ0FBU29FLE9BQVQsR0FBbUJDLFdBQW5CLENBQStCLENBQUMsQ0FBRCxFQUFJL0YsS0FBSixDQUEvQixFQUEyQyxDQUEzQyxDQUFSO0FBQUEsTUFDSXhCLENBQUMsR0FBRyxFQURSO0FBQUEsTUFFSXdILFFBQVEsR0FBRyxFQUZmO0FBSUEsTUFBSUMsSUFBSSxHQUFHOUgsRUFBRSxDQUFDNkMsR0FBSCxDQUFPaUYsSUFBUCxFQUFYO0FBQUEsTUFDSUMsVUFESjtBQUFBLE1BRUlDLFVBRko7QUFJQSxNQUFJbkYsR0FBRyxHQUFHN0MsRUFBRSxDQUFDOEMsTUFBSCxDQUFVLDBCQUFWLEVBQXNDQyxNQUF0QyxDQUE2QyxLQUE3QyxFQUNMQyxJQURLLENBQ0EsT0FEQSxFQUNTbkIsS0FBSyxHQUFHSSxNQUFNLENBQUNGLElBQWYsR0FBc0JFLE1BQU0sQ0FBQ0gsS0FEdEMsRUFFTGtCLElBRkssQ0FFQSxRQUZBLEVBRVVoQixNQUFNLEdBQUdDLE1BQU0sQ0FBQ29ELEdBQWhCLEdBQXNCcEQsTUFBTSxDQUFDcUQsTUFGdkMsRUFHVHZDLE1BSFMsQ0FHRixHQUhFLEVBSUxDLElBSkssQ0FJQSxXQUpBLEVBSWEsZUFBZWYsTUFBTSxDQUFDRixJQUF0QixHQUE2QixHQUE3QixHQUFtQ0UsTUFBTSxDQUFDb0QsR0FBMUMsR0FBZ0QsR0FKN0QsQ0FBVjtBQUFBLE1BSTZFNEMsVUFKN0U7QUFPQWpILEVBQUFBLG1CQUFtQixDQUFDLENBQ3JCLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsUUFBbEIsRUFBNkIsU0FBN0IsRUFBeUMsU0FBekMsQ0FEcUIsRUFFckIsQ0FBQyxTQUFELEVBQVksVUFBWixFQUF3QixVQUF4QixFQUFxQyxRQUFyQyxDQUZxQixDQUFELEVBSWpCLFVBQVNDLElBQVQsRUFBZTtBQUNqQjtBQUNBLFFBQUlpSCxJQUFJLEdBQUdDLDhCQUE4QixDQUFDbEgsSUFBRCxFQUFPLENBQVAsRUFBVSxDQUFWLENBQXpDLENBRmlCLENBR2pCOztBQUNBLFFBQUltSCxLQUFLLEdBQUdwSSxFQUFFLENBQUM2QyxHQUFILENBQU93RixJQUFQLEdBQWNDLE1BQWQsQ0FBcUIsTUFBckIsRUFBNkJDLFVBQTdCLENBQXdDcEcsTUFBTSxDQUFDQyxJQUFQLENBQVluQixJQUFJLENBQUMsZ0JBQUQsQ0FBaEIsRUFBb0MrRSxHQUFwQyxDQUF3QyxVQUFBOUYsQ0FBQztBQUFBLGFBQUlzSSxRQUFRLENBQUN0SSxDQUFELENBQVo7QUFBQSxLQUF6QyxDQUF4QyxDQUFaO0FBQUEsUUFDSXVJLEtBQUssR0FBR3pJLEVBQUUsQ0FBQzZDLEdBQUgsQ0FBT3dGLElBQVAsR0FBY0MsTUFBZCxDQUFxQixNQUFyQixFQUE2QkMsVUFBN0IsQ0FBd0N0SCxJQUFJLENBQUMsUUFBRCxDQUFKLENBQWUrRSxHQUFmLENBQW1CLFVBQUE5RixDQUFDO0FBQUEsYUFBSXNJLFFBQVEsQ0FBQ3RJLENBQUQsQ0FBWjtBQUFBLEtBQXBCLENBQXhDLENBRFo7QUFBQSxRQUVJd0ksS0FBSyxHQUFHMUksRUFBRSxDQUFDNkMsR0FBSCxDQUFPd0YsSUFBUCxHQUFjQyxNQUFkLENBQXFCLE1BQXJCLEVBQTZCQyxVQUE3QixDQUF3Q3BHLE1BQU0sQ0FBQ3dHLE1BQVAsQ0FBYzFILElBQUksQ0FBQyxjQUFELENBQWxCLEVBQW9DK0UsR0FBcEMsQ0FBd0MsVUFBQTlGLENBQUM7QUFBQSxhQUFJMEksVUFBVSxDQUFDMUksQ0FBRCxDQUFkO0FBQUEsS0FBekMsQ0FBeEMsQ0FGWjtBQUlBQSxJQUFBQSxDQUFDLENBQUNnRCxNQUFGLENBQVMrRSxVQUFVLEdBQUdqSSxFQUFFLENBQUNvQyxJQUFILENBQVE4RixJQUFJLENBQUMsQ0FBRCxDQUFaLEVBQWlCeEQsTUFBakIsQ0FBd0IsVUFBU3RCLENBQVQsRUFBWTtBQUN0RCxhQUFPQSxDQUFDLElBQUksTUFBTCxLQUFnQi9DLENBQUMsQ0FBQytDLENBQUQsQ0FBRCxHQUFPcEQsRUFBRSxDQUFDdUQsS0FBSCxDQUFTc0YsTUFBVCxHQUN6QjNGLE1BRHlCLENBQ2xCbEQsRUFBRSxDQUFDOEksTUFBSCxDQUFVWixJQUFWLEVBQWdCLFVBQVNhLENBQVQsRUFBWTtBQUFFLGVBQU8sQ0FBQ0EsQ0FBQyxDQUFDM0YsQ0FBRCxDQUFUO0FBQWUsT0FBN0MsQ0FEa0IsRUFFekJFLEtBRnlCLENBRW5CLENBQUN0QixNQUFELEVBQVMsQ0FBVCxDQUZtQixDQUF2QixDQUFQO0FBR0gsS0FKcUIsQ0FBdEIsRUFSaUIsQ0FjakI7O0FBQ0ErRixJQUFBQSxVQUFVLEdBQUdsRixHQUFHLENBQUNFLE1BQUosQ0FBVyxHQUFYLEVBQ1JDLElBRFEsQ0FDSCxPQURHLEVBQ00sWUFETixFQUVSZ0IsU0FGUSxDQUVFLE1BRkYsRUFHUjlCLElBSFEsQ0FHSGdHLElBSEcsRUFJUmpFLEtBSlEsR0FJQWxCLE1BSkEsQ0FJTyxNQUpQLEVBS1JDLElBTFEsQ0FLSCxHQUxHLEVBS0VnRyxJQUxGLENBQWIsQ0FmaUIsQ0FzQmpCOztBQUNBaEIsSUFBQUEsVUFBVSxHQUFHbkYsR0FBRyxDQUFDRSxNQUFKLENBQVcsR0FBWCxFQUNSQyxJQURRLENBQ0gsT0FERyxFQUNNLFlBRE4sRUFFUmdCLFNBRlEsQ0FFRSxNQUZGLEVBR1I5QixJQUhRLENBR0hnRyxJQUhHLEVBSVJqRSxLQUpRLEdBSUFsQixNQUpBLENBSU8sTUFKUCxFQUtSQyxJQUxRLENBS0gsR0FMRyxFQUtFZ0csSUFMRixDQUFiLENBdkJpQixDQThCakI7O0FBQ0EsUUFBSXpELENBQUMsR0FBRzFDLEdBQUcsQ0FBQ21CLFNBQUosQ0FBYyxZQUFkLEVBQ0g5QixJQURHLENBQ0UrRixVQURGLEVBRUhoRSxLQUZHLEdBRUtsQixNQUZMLENBRVksR0FGWixFQUdIQyxJQUhHLENBR0UsT0FIRixFQUdXLFdBSFgsRUFJSEEsSUFKRyxDQUlFLFdBSkYsRUFJZSxVQUFTSSxDQUFULEVBQVk7QUFBRSxhQUFPLGVBQWVsRCxDQUFDLENBQUNrRCxDQUFELENBQWhCLEdBQXNCLEdBQTdCO0FBQW1DLEtBSmhFLEVBS0hVLElBTEcsQ0FLRTlELEVBQUUsQ0FBQ2lKLFFBQUgsQ0FBWUMsSUFBWixHQUNEQyxNQURDLENBQ00sVUFBUy9GLENBQVQsRUFBWTtBQUFFLGFBQU87QUFBQ2xELFFBQUFBLENBQUMsRUFBRUEsQ0FBQyxDQUFDa0QsQ0FBRDtBQUFMLE9BQVA7QUFBbUIsS0FEdkMsRUFFRGUsRUFGQyxDQUVFLFdBRkYsRUFFZSxVQUFTZixDQUFULEVBQVk7QUFDN0J5RSxNQUFBQSxRQUFRLENBQUN6RSxDQUFELENBQVIsR0FBY2xELENBQUMsQ0FBQ2tELENBQUQsQ0FBZjtBQUNBMkUsTUFBQUEsVUFBVSxDQUFDL0UsSUFBWCxDQUFnQixZQUFoQixFQUE4QixRQUE5QjtBQUNDLEtBTEMsRUFNRG1CLEVBTkMsQ0FNRSxNQU5GLEVBTVUsVUFBU2YsQ0FBVCxFQUFZO0FBQ3hCeUUsTUFBQUEsUUFBUSxDQUFDekUsQ0FBRCxDQUFSLEdBQWNnRyxJQUFJLENBQUNqRyxHQUFMLENBQVN0QixLQUFULEVBQWdCdUgsSUFBSSxDQUFDL0YsR0FBTCxDQUFTLENBQVQsRUFBWXJELEVBQUUsQ0FBQ3FKLEtBQUgsQ0FBU25KLENBQXJCLENBQWhCLENBQWQ7QUFDQThILE1BQUFBLFVBQVUsQ0FBQ2hGLElBQVgsQ0FBZ0IsR0FBaEIsRUFBcUJnRyxJQUFyQjtBQUNBZixNQUFBQSxVQUFVLENBQUNwQyxJQUFYLENBQWdCLFVBQVNDLENBQVQsRUFBWUMsQ0FBWixFQUFlO0FBQUUsZUFBT3VELFFBQVEsQ0FBQ3hELENBQUQsQ0FBUixHQUFjd0QsUUFBUSxDQUFDdkQsQ0FBRCxDQUE3QjtBQUFtQyxPQUFwRTtBQUNBN0YsTUFBQUEsQ0FBQyxDQUFDZ0QsTUFBRixDQUFTK0UsVUFBVDtBQUNBMUMsTUFBQUEsQ0FBQyxDQUFDdkMsSUFBRixDQUFPLFdBQVAsRUFBb0IsVUFBU0ksQ0FBVCxFQUFZO0FBQUUsZUFBTyxlQUFla0csUUFBUSxDQUFDbEcsQ0FBRCxDQUF2QixHQUE2QixHQUFwQztBQUEwQyxPQUE1RTtBQUNDLEtBWkMsRUFhRGUsRUFiQyxDQWFFLFNBYkYsRUFhYSxVQUFTZixDQUFULEVBQVk7QUFDM0IsYUFBT3lFLFFBQVEsQ0FBQ3pFLENBQUQsQ0FBZjtBQUNBbUIsTUFBQUEsVUFBVSxDQUFDdkUsRUFBRSxDQUFDOEMsTUFBSCxDQUFVLElBQVYsQ0FBRCxDQUFWLENBQTRCRSxJQUE1QixDQUFpQyxXQUFqQyxFQUE4QyxlQUFlOUMsQ0FBQyxDQUFDa0QsQ0FBRCxDQUFoQixHQUFzQixHQUFwRTtBQUNBbUIsTUFBQUEsVUFBVSxDQUFDeUQsVUFBRCxDQUFWLENBQXVCaEYsSUFBdkIsQ0FBNEIsR0FBNUIsRUFBaUNnRyxJQUFqQztBQUNBakIsTUFBQUEsVUFBVSxDQUNML0UsSUFETCxDQUNVLEdBRFYsRUFDZWdHLElBRGYsRUFFS3pFLFVBRkwsR0FHS0MsS0FITCxDQUdXLEdBSFgsRUFJS0MsUUFKTCxDQUljLENBSmQsRUFLS3pCLElBTEwsQ0FLVSxZQUxWLEVBS3dCLElBTHhCO0FBTUMsS0F2QkMsQ0FMRixDQUFSLENBL0JpQixDQTZEakI7O0FBQ0F1QyxJQUFBQSxDQUFDLENBQUN4QyxNQUFGLENBQVMsR0FBVCxFQUNLQyxJQURMLENBQ1UsT0FEVixFQUNtQixNQURuQixFQUVLdUcsSUFGTCxDQUVVLFVBQVNuRyxDQUFULEVBQVk7QUFDZCxVQUFJaUYsSUFBSSxHQUFHLElBQVg7O0FBQ0EsVUFBR2pGLENBQUMsSUFBSSxVQUFSLEVBQW1CO0FBQ2ZpRixRQUFBQSxJQUFJLEdBQUdELEtBQVA7QUFDSCxPQUZELE1BRU8sSUFBR2hGLENBQUMsSUFBSSxPQUFSLEVBQWdCO0FBQ25CaUYsUUFBQUEsSUFBSSxHQUFHSSxLQUFQO0FBQ0gsT0FGTSxNQUVBO0FBQ0hKLFFBQUFBLElBQUksR0FBR0ssS0FBUDtBQUNIOztBQUNEMUksTUFBQUEsRUFBRSxDQUFDOEMsTUFBSCxDQUFVLElBQVYsRUFBZ0JnQixJQUFoQixDQUNJdUUsSUFBSSxDQUFDOUUsS0FBTCxDQUFXbEQsQ0FBQyxDQUFDK0MsQ0FBRCxDQUFaLENBREo7QUFHSCxLQWRMLEVBZUtMLE1BZkwsQ0FlWSxNQWZaLEVBZ0JLZ0IsS0FoQkwsQ0FnQlcsYUFoQlgsRUFnQjBCLFFBaEIxQixFQWlCS2YsSUFqQkwsQ0FpQlUsR0FqQlYsRUFpQmUsQ0FBQyxDQWpCaEIsRUFrQktyQyxJQWxCTCxDQWtCVSxVQUFTeUMsQ0FBVCxFQUFZO0FBQ2QsYUFBT0EsQ0FBUDtBQUNILEtBcEJMLEVBOURpQixDQW9GakI7O0FBQ0FtQyxJQUFBQSxDQUFDLENBQUN4QyxNQUFGLENBQVMsR0FBVCxFQUNLQyxJQURMLENBQ1UsT0FEVixFQUNtQixPQURuQixFQUVLdUcsSUFGTCxDQUVVLFVBQVNuRyxDQUFULEVBQVk7QUFDZHBELE1BQUFBLEVBQUUsQ0FBQzhDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCZ0IsSUFBaEIsQ0FBcUJ6RCxDQUFDLENBQUMrQyxDQUFELENBQUQsQ0FBS29HLEtBQUwsR0FBYXhKLEVBQUUsQ0FBQzZDLEdBQUgsQ0FBTzJHLEtBQVAsR0FBZW5KLENBQWYsQ0FBaUJBLENBQUMsQ0FBQytDLENBQUQsQ0FBbEIsRUFBdUJlLEVBQXZCLENBQTBCLFlBQTFCLEVBQXdDc0YsVUFBeEMsRUFBb0R0RixFQUFwRCxDQUF1RCxPQUF2RCxFQUFnRXFGLEtBQWhFLENBQWxDO0FBQ0gsS0FKTCxFQUtLeEYsU0FMTCxDQUtlLE1BTGYsRUFNS2hCLElBTkwsQ0FNVSxHQU5WLEVBTWUsQ0FBQyxDQU5oQixFQU9LQSxJQVBMLENBT1UsT0FQVixFQU9tQixFQVBuQjtBQVFDLEdBakdrQixDQUFuQjs7QUFtR0EsV0FBU3NHLFFBQVQsQ0FBa0JsRyxDQUFsQixFQUFxQjtBQUNyQixRQUFJc0csQ0FBQyxHQUFHN0IsUUFBUSxDQUFDekUsQ0FBRCxDQUFoQjtBQUNBLFdBQU9zRyxDQUFDLElBQUksSUFBTCxHQUFZeEosQ0FBQyxDQUFDa0QsQ0FBRCxDQUFiLEdBQW1Cc0csQ0FBMUI7QUFDQzs7QUFFRCxXQUFTbkYsVUFBVCxDQUFvQmdCLENBQXBCLEVBQXVCO0FBQ3ZCLFdBQU9BLENBQUMsQ0FBQ2hCLFVBQUYsR0FBZUUsUUFBZixDQUF3QixHQUF4QixDQUFQO0FBQ0MsR0E5SDRCLENBZ0k3Qjs7O0FBQ0EsV0FBU3VFLElBQVQsQ0FBYzVGLENBQWQsRUFBaUI7QUFDakIsV0FBTzBFLElBQUksQ0FBQ0csVUFBVSxDQUFDakMsR0FBWCxDQUFlLFVBQVMrQyxDQUFULEVBQVk7QUFBRSxhQUFPLENBQUNPLFFBQVEsQ0FBQ1AsQ0FBRCxDQUFULEVBQWMxSSxDQUFDLENBQUMwSSxDQUFELENBQUQsQ0FBSzNGLENBQUMsQ0FBQzJGLENBQUQsQ0FBTixDQUFkLENBQVA7QUFBbUMsS0FBaEUsQ0FBRCxDQUFYO0FBQ0M7O0FBRUQsV0FBU1UsVUFBVCxHQUFzQjtBQUN0QnpKLElBQUFBLEVBQUUsQ0FBQ3FKLEtBQUgsQ0FBU00sV0FBVCxDQUFxQkMsZUFBckI7QUFDQyxHQXZJNEIsQ0F5STdCOzs7QUFDQSxXQUFTSixLQUFULEdBQWlCO0FBQ2pCLFFBQUlLLE9BQU8sR0FBRzVCLFVBQVUsQ0FBQ3ZELE1BQVgsQ0FBa0IsVUFBU3FFLENBQVQsRUFBWTtBQUFFLGFBQU8sQ0FBQzFJLENBQUMsQ0FBQzBJLENBQUQsQ0FBRCxDQUFLUyxLQUFMLENBQVdNLEtBQVgsRUFBUjtBQUE2QixLQUE3RCxDQUFkO0FBQUEsUUFDSUMsT0FBTyxHQUFHRixPQUFPLENBQUM3RCxHQUFSLENBQVksVUFBUytDLENBQVQsRUFBWTtBQUFFLGFBQU8xSSxDQUFDLENBQUMwSSxDQUFELENBQUQsQ0FBS1MsS0FBTCxDQUFXVixNQUFYLEVBQVA7QUFBNkIsS0FBdkQsQ0FEZDtBQUVBZCxJQUFBQSxVQUFVLENBQUNqRSxLQUFYLENBQWlCLFNBQWpCLEVBQTRCLFVBQVNYLENBQVQsRUFBWTtBQUNwQyxhQUFPeUcsT0FBTyxDQUFDRyxLQUFSLENBQWMsVUFBU2pCLENBQVQsRUFBWTNFLENBQVosRUFBZTtBQUNwQyxlQUFPMkYsT0FBTyxDQUFDM0YsQ0FBRCxDQUFQLENBQVcsQ0FBWCxLQUFpQmhCLENBQUMsQ0FBQzJGLENBQUQsQ0FBbEIsSUFBeUIzRixDQUFDLENBQUMyRixDQUFELENBQUQsSUFBUWdCLE9BQU8sQ0FBQzNGLENBQUQsQ0FBUCxDQUFXLENBQVgsQ0FBeEM7QUFDQyxPQUZNLElBRUYsSUFGRSxHQUVLLE1BRlo7QUFHSCxLQUpEO0FBS0M7QUFFSjs7O0FDcEpELFNBQVM2RixvQkFBVCxHQUErQjtBQUMzQjlKLEVBQUFBLE1BQU0sQ0FBQytKLFlBQVAsR0FBc0IsRUFBdEI7O0FBQ0EsTUFBRy9KLE1BQU0sQ0FBQ2dLLCtCQUFWLEVBQTBDO0FBQ3RDLFNBQUksSUFBSWpLLENBQVIsSUFBYUMsTUFBTSxDQUFDZ0ssK0JBQXBCLEVBQW9EO0FBQ2hELFVBQUlDLE1BQU0sR0FBRyxFQUFiOztBQUNBLFdBQUksSUFBSS9KLENBQVIsSUFBYUYsTUFBTSxDQUFDZ0ssK0JBQVAsQ0FBdUNqSyxDQUF2QyxDQUFiLEVBQXVEO0FBQ25Ea0ssUUFBQUEsTUFBTSxDQUFDNUgsSUFBUCxDQUFZckMsTUFBTSxDQUFDZ0ssK0JBQVAsQ0FBdUNqSyxDQUF2QyxFQUEwQ0csQ0FBMUMsQ0FBWjtBQUNIOztBQUNERixNQUFBQSxNQUFNLENBQUMrSixZQUFQLENBQW9CaEssQ0FBcEIsSUFBeUJrSyxNQUF6QjtBQUNIO0FBQ0o7QUFDSjs7QUFFRCxTQUFTakMsOEJBQVQsQ0FBd0NuQixRQUF4QyxFQUFrRHFELGVBQWxELEVBQW1FQyxjQUFuRSxFQUFrRjtBQUM5RSxNQUFJQyxPQUFPLEdBQUcsRUFBZDs7QUFDQSxPQUFLLElBQUlDLE1BQVQsSUFBbUJ4RCxRQUFRLENBQUMsZ0JBQUQsQ0FBM0IsRUFBOEM7QUFDMUMsU0FBSSxJQUFJeUQsS0FBUixJQUFpQnpELFFBQVEsQ0FBQyxnQkFBRCxDQUFSLENBQTJCd0QsTUFBM0IsQ0FBakIsRUFBb0Q7QUFDaEQsVUFBSUUsVUFBVSxHQUFHMUQsUUFBUSxDQUFDLGdCQUFELENBQVIsQ0FBMkJ3RCxNQUEzQixFQUFtQ0MsS0FBbkMsQ0FBakI7O0FBQ0EsVUFBSUMsVUFBVSxHQUFHTCxlQUFqQixFQUFpQztBQUU3QixhQUFJLElBQUlNLElBQVIsSUFBZ0IzRCxRQUFRLENBQUMsWUFBRCxDQUFSLENBQXVCeUQsS0FBdkIsQ0FBaEIsRUFBOEM7QUFDMUMsY0FBSUcsU0FBUyxHQUFHNUQsUUFBUSxDQUFDLFlBQUQsQ0FBUixDQUF1QnlELEtBQXZCLEVBQThCRSxJQUE5QixDQUFoQjs7QUFDQSxjQUFJQyxTQUFTLEdBQUdOLGNBQWhCLEVBQStCO0FBQzNCQyxZQUFBQSxPQUFPLENBQUMvSCxJQUFSLENBQWE7QUFDVCxzQkFBUWdJLE1BREM7QUFFVCwwQkFBYUEsTUFGSjtBQUdULHVCQUFTQyxLQUhBO0FBSVQsc0JBQVF6RCxRQUFRLENBQUMsY0FBRCxDQUFSLENBQXlCMkQsSUFBekI7QUFKQyxhQUFiO0FBTUg7QUFDSjtBQUVKO0FBQ0o7QUFDSjs7QUFDRCxTQUFPSixPQUFQO0FBQ0g7OztBQ3BDRHBLLE1BQU0sQ0FBQzBLLE1BQVAsR0FBZ0IsSUFBSUMsR0FBSixDQUFRO0FBQ3BCQyxFQUFBQSxFQUFFLEVBQUUsVUFEZ0I7QUFFcEI3SSxFQUFBQSxJQUFJLEVBQUU7QUFDRjhJLElBQUFBLE9BQU8sRUFBRSxhQURQO0FBRUZDLElBQUFBLFlBQVksRUFBRSxJQUZaO0FBR0ZDLElBQUFBLFlBQVksRUFBRSxDQUhaO0FBSUZDLElBQUFBLFlBQVksRUFBRTtBQUNWQyxNQUFBQSxJQUFJLEVBQUU7QUFESSxLQUpaO0FBT0ZDLElBQUFBLGVBQWUsRUFBRSxFQVBmO0FBUUZDLElBQUFBLFdBQVcsRUFBRTtBQVJYLEdBRmM7QUFZcEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxVQUFVLEVBQUUsb0JBQVN0TCxDQUFULEVBQVc7QUFDbkIsV0FBS2dMLFlBQUwsR0FBb0JoTCxDQUFwQjs7QUFDQSxVQUFJQSxDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1BnQixRQUFBQSxTQUFTLENBQUMsQ0FBRCxDQUFUO0FBQ0g7O0FBQ0QsVUFBSWhCLENBQUMsSUFBSSxDQUFULEVBQVc7QUFDUGlCLFFBQUFBLFNBQVM7QUFDWjs7QUFDRCxVQUFJakIsQ0FBQyxJQUFJLENBQVQsRUFBVztBQUNQa0IsUUFBQUEsU0FBUztBQUNaO0FBQ0o7QUFaSSxHQVpXO0FBMEJwQnFLLEVBQUFBLE9BQU8sRUFBRSxtQkFBVTtBQUNmM0wsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksU0FBWjtBQUNBRixJQUFBQSxNQUFNO0FBQ05OLElBQUFBLFVBQVU7QUFDYjtBQTlCbUIsQ0FBUixDQUFoQiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBsb2FkSnF1ZXJ5KCl7XG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcbiAgICAgICAgJChcIiN0b2dnbGUtc2lkZWJhclwiKS5jbGljayhmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCgnLnVpLnNpZGViYXInKVxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxuICAgICAgICAgICAgO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgfSk7XG59XG4iLCJmdW5jdGlvbiBsb2FkRDMoKSB7XG4gIGNvbnNvbGUubG9nKFwiaGVsbG9cIik7XG4gIGQzLmpzb24oXCJkYXRhL2RvY3VtZW50X3RvcGljX3Byb2JhYmlsaXR5Lmpzb25cIiwgZnVuY3Rpb24oeCl7XG4gICAgICB3aW5kb3cuZG9jdW1lbnRfdG9waWNfcHJvYmFiaWxpdHk9IHg7XG4gICAgICBkMy5qc29uKFwiZGF0YS90b3BpY193b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhLmpzb25cIiwgZnVuY3Rpb24oeSl7XG4gICAgICAgICAgd2luZG93LndvcmRfZGlzdHJpYnV0aW9uX2luX2NvcnBvcmE9IHk7XG4gICAgICAgICAgZDMuanNvbihcImRhdGEvdG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYy5qc29uXCIsIGZ1bmN0aW9uKHope1xuICAgICAgICAgICAgICB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eSA9IHo7XG4gICAgICAgICAgICAgIGdldEFuYWx5c2lzKFwiYXNmYXNcIiwgXCJhc3NhZFwiKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9KTtcblxufVxuXG5cbmZ1bmN0aW9uIGdldERvY3ModGV4dCkge1xuICByZXR1cm4gW1xuICAgIFtcIncxXCIsIFwidzJcIiwgXCJ3M1wiLCBcInc0XCIsIFwidzVcIiwgXCJ3NlwiXSxcbiAgICBbXCJ3M1wiLCBcImFzZHNcIiwgXCJhc2Rhc2RcIiwgXCJzYWRhc2RzYVwiLCBcImFzZGFzZHNhXCIsIFwiYXNkYXNkc2FkXCJdXG4gIF07XG59XG5cbmZ1bmN0aW9uIGdldEFuYWx5c2lzKHRleHQsIG1ldGhvZCkge1xuICBsZXQgZG9jcyA9IGdldERvY3ModGV4dCk7XG4gIGxldCBmbmMgPSB4ID0+IHg7XG4gIGlmIChtZXRob2QgPT0gXCJMREFcIikge1xuICAgIGZuYyA9IGdldExEQUNsdXN0ZXJzO1xuICB9IGVsc2Uge1xuICAgIGZuYyA9IGdldFdvcmQyVmVjQ2x1c3RlcnM7XG4gIH1cbiAgZm5jKGRvY3MsIHJlc3AgPT4ge1xuICAgIGluaXRQYWdlMShyZXNwKTtcbiAgICBpbml0UGFnZTIocmVzcCk7XG4gICAgaW5pdFBhZ2UzKHJlc3ApO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gbG9hZFZpc3VhbGl6YXRpb25zKCkge1xuXG59XG5cbmZ1bmN0aW9uIGluaXRQYWdlMShyZXNwKSB7XG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcbiAgcmVuZGVyQmFyR3JhcGgoMCwgcmVzcCk7XG59XG5cblxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2x1c3RlcicpXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xuICB2YXIgaGVpZ2h0ID0gNDAwO1xuICB2YXIgbWFyZ2luID0gNDA7XG4gIHZhciBkYXRhID0gW107XG5cbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgIHg6IHZhbHVlWzBdLFxuICAgICAgeTogdmFsdWVbMV0sXG4gICAgICBjOiAxLFxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcbiAgICB9KTtcbiAgfSk7XG4gIHZhciBsYWJlbFggPSAnWCc7XG4gIHZhciBsYWJlbFkgPSAnWSc7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxuICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0JylcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luICsgbWFyZ2luKVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luICsgXCIsXCIgKyBtYXJnaW4gKyBcIilcIik7XG5cbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLng7XG4gICAgfSldKVxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcblxuICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFtoZWlnaHQsIDBdKTtcblxuICB2YXIgc2NhbGUgPSBkMy5zY2FsZVNxcnQoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5zaXplO1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzEsIDIwXSk7XG5cbiAgdmFyIG9wYWNpdHkgPSBkMy5zY2FsZVNxcnQoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5zaXplO1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzEsIC41XSk7XG5cblxuICB2YXIgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeCk7XG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XG5cblxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAuY2FsbCh5QXhpcylcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAuYXR0cihcInhcIiwgMjApXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFkpO1xuICAvLyB4IGF4aXMgYW5kIGxhYmVsXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbCh4QXhpcylcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIC5hdHRyKFwieFwiLCB3aWR0aCArIDIwKVxuICAgIC5hdHRyKFwieVwiLCBtYXJnaW4gLSAxMClcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgIC50ZXh0KGxhYmVsWCk7XG5cbiAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgIC5kYXRhKGRhdGEpXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIC5pbnNlcnQoXCJjaXJjbGVcIilcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcbiAgICAuYXR0cihcImN5XCIsIGhlaWdodCAvIDIpXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gb3BhY2l0eShkLnNpemUpO1xuICAgIH0pXG4gICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcbiAgICB9KVxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBcIiMxZjc3YjRcIjtcbiAgICB9KVxuICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGUoZC5jLCAuMSk7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGVPdXQoKTtcbiAgICB9KVxuICAgIC50cmFuc2l0aW9uKClcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XG4gICAgfSlcbiAgICAuZHVyYXRpb24oNTAwKVxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGQueCk7XG4gICAgfSlcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLnkpO1xuICAgIH0pO1xuXG5cbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5jICE9IGM7XG4gICAgICB9KVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgICB9KTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xuICBkZWJ1Z2dlclxuICB2YXIgZGF0YSA9IHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5OyBcbiAgdmFyIHRvcGljX2Rpc3RyaWJ1dGlvbl9pbl9jb3JwYSA9IHdpbmRvdy53b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhO1xuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xuICB2YXIgZGF0YSA9IGRhdGFbdG9waWNfbnVtYmVyXVswXTtcblxuXG4gIC8vIGRhdGEgPXJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljX251bWJlcl1cblxuXG5cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdGVtcCA9IHt9O1xuICAgIHZhciBrZXkgPSBPYmplY3Qua2V5cyhkYXRhW2ldKVswXTtcbiAgICB2YXIgdmFsID0gZGF0YVtpXVtPYmplY3Qua2V5cyhkYXRhW2ldKVswXV07XG4gICAgdmFyIG92ZXJhbGwgPSB0b3BpY19kaXN0cmlidXRpb25faW5fY29ycGFba2V5XTtcbiAgICB0ZW1wLlN0YXRlID0ga2V5O1xuICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gdmFsO1xuICAgIHRlbXAub3ZlcmFsbCA9IG92ZXJhbGw7XG4gICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xuICAgIGZpbmFsX2RhdGEucHVzaCh0ZW1wKTtcbiAgfVxuXG4gIFxuICBkZWJ1Z2dlclxuXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGFja2VkLWJhcicpXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xuXG4gIHZhciBkYXRhID0gZmluYWxfZGF0YTtcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjU7XG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLFxuICAgIG1hcmdpbiA9IHtcbiAgICAgIHRvcDogMjAsXG4gICAgICByaWdodDogMjAsXG4gICAgICBib3R0b206IDMwLFxuICAgICAgbGVmdDogNTBcbiAgICB9LFxuICAgIHdpZHRoID0gK3N2Zy5hdHRyKFwid2lkdGhcIikgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xuICB2YXIgeSA9IGQzLnNjYWxlQmFuZCgpIC8vIHggPSBkMy5zY2FsZUJhbmQoKSAgXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKCkgLy8geSA9IGQzLnNjYWxlTGluZWFyKClcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xuXG4gIHZhciB6ID0gZDMuc2NhbGVPcmRpbmFsKCkucmFuZ2UoW1wiI0M4NDIzRVwiLCBcIiNBMUM3RTBcIl0pO1xuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxcIl07XG4gIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBiLnRvdGFsIC0gYS50b3RhbDtcbiAgfSk7XG4gIHkuZG9tYWluKGRhdGEubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGQuU3RhdGU7XG4gIH0pKTsgLy8geC5kb21haW4uLi5cblxuICB4LmRvbWFpbihbMCwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGQudG90YWw7XG4gIH0pXSkubmljZSgpOyAvLyB5LmRvbWFpbi4uLlxuXG4gIHouZG9tYWluKGtleXMpO1xuICBnLmFwcGVuZChcImdcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGQzLnN0YWNrKCkua2V5cyhrZXlzKShkYXRhKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geihkLmtleSk7XG4gICAgfSkuc2VsZWN0QWxsKFwicmVjdFwiKS5kYXRhKGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZDtcbiAgICB9KS5lbnRlcigpLmFwcGVuZChcInJlY3RcIikuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7XG4gICAgfSkgLy8uYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGEuU3RhdGUpOyB9KVxuICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFswXSk7XG4gICAgfSkgLy8uYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzFdKTsgfSkgIFxuICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFswXSkgLSB5KGRbMV0pOyB9KVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHkuYmFuZHdpZHRoKCkpXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIDAuOCk7IC8vLmF0dHIoXCJ3aWR0aFwiLCB4LmJhbmR3aWR0aCgpKTsgXG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpIC8vICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAvLyAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkpO1xuXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKSAvLyBOZXcgbGluZVxuICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ5XCIsIDIpIC8vICAgICAuYXR0cihcInlcIiwgMilcbiAgICAuYXR0cihcInhcIiwgeCh4LnRpY2tzKCkucG9wKCkpICsgMC41KSAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcbiAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpIC8vICAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpXG4gIHZhciBsZWdlbmQgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMuc2xpY2UoKS5yZXZlcnNlKCkpLmVudGVyKCkuYXBwZW5kKFwiZ1wiKSAvLy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyBpICogMjAgKyBcIilcIjsgfSk7XG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMzAwICsgaSAqIDIwKSArIFwiKVwiO1xuICAgIH0pO1xuICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDE5KS5hdHRyKFwid2lkdGhcIiwgMTkpLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI0KS5hdHRyKFwieVwiLCA5LjUpLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKS50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGQ7XG4gIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGluaXRQYWdlMigpIHtcblxufVxuXG5mdW5jdGlvbiBpbml0UGFnZTMoKSB7XG4gIC8vIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXG5mdW5jdGlvbiBnZXQyRFZlY3RvcnModmVjdG9ycywgc3VjY2Vzc0NhbGxiYWNrKXtcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IHZlY3RvcnNcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xuICAgICAgfSk7XG59XG5cbi8vIGRvY3MgZm9ybWF0OiBMaXN0W0xpc3Rbc3RyaW5nKHdvcmQpXV1cbmZ1bmN0aW9uIGdldFdvcmQyVmVjQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvYXBpL2dldENsdXN0ZXJzV29yZDJWZWNcIixcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xuICAgICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldExEQUNsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCl7XG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgICB2YXIgeCA9IGQzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcbiAgICAgICAgeSA9IHt9LFxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xuXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpLFxuICAgICAgICBiYWNrZ3JvdW5kLFxuICAgICAgICBmb3JlZ3JvdW5kO1xuXG4gICAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xuXG5cbiAgICBnZXRXb3JkMlZlY0NsdXN0ZXJzKFtcblx0XHRcdFtcImZvb2RcIiwgXCJhcHBsZVwiLCBcImJhbmFuYVwiLCAgXCJiaXNjdWl0XCIsICBcImNoaWNrZW5cIl0sXG5cdFx0XHRbXCJjcmlja2V0XCIsIFwiZm9vdGJhbGxcIiwgXCJiYXNlYmFsbFwiLCAgXCJ0ZW5uaXNcIl1cblx0XHRdXG4gICAgLCBmdW5jdGlvbihyZXNwKSB7XG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcbiAgICAvLyB2YXIgYXhpc0QgPSBkMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxuICAgIHZhciBheGlzRCA9IGQzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcbiAgICAgICAgYXhpc1QgPSBkMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNXID0gZDMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XG5cbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZCAhPSBcIm5hbWVcIiAmJiAoeVtkXSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAuZG9tYWluKGQzLmV4dGVudChjYXJzLCBmdW5jdGlvbihwKSB7IHJldHVybiArcFtkXTsgfSkpXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcbiAgICB9KSk7XG5cbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuZGF0YShjYXJzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcblxuICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuZGF0YShjYXJzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcblxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxuICAgIHZhciBnID0gc3ZnLnNlbGVjdEFsbChcIi5kaW1lbnNpb25cIilcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZGltZW5zaW9uXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4ge3g6IHgoZCl9OyB9KVxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0geChkKTtcbiAgICAgICAgICAgIGJhY2tncm91bmQuYXR0cihcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiZHJhZ1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IE1hdGgubWluKHdpZHRoLCBNYXRoLm1heCgwLCBkMy5ldmVudC54KSk7XG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihkMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihmb3JlZ3JvdW5kKS5hdHRyKFwiZFwiLCBwYXRoKTtcbiAgICAgICAgICAgIGJhY2tncm91bmRcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpc2liaWxpdHlcIiwgbnVsbCk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc0Q7XG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmNhbGwoXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC05KVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBBZGQgYW5kIHN0b3JlIGEgYnJ1c2ggZm9yIGVhY2ggYXhpcy5cbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkMy5zdmcuYnJ1c2goKS55KHlbZF0pLm9uKFwiYnJ1c2hzdGFydFwiLCBicnVzaHN0YXJ0KS5vbihcImJydXNoXCIsIGJydXNoKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAtOClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XG4gICAgdmFyIHYgPSBkcmFnZ2luZ1tkXTtcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxuICAgIGZ1bmN0aW9uIHBhdGgoZCkge1xuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xuICAgIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZXMgYSBicnVzaCBldmVudCwgdG9nZ2xpbmcgdGhlIGRpc3BsYXkgb2YgZm9yZWdyb3VuZCBsaW5lcy5cbiAgICBmdW5jdGlvbiBicnVzaCgpIHtcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxuICAgICAgICBleHRlbnRzID0gYWN0aXZlcy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4geVtwXS5icnVzaC5leHRlbnQoKTsgfSk7XG4gICAgZm9yZWdyb3VuZC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XG4gICAgICAgIHJldHVybiBleHRlbnRzW2ldWzBdIDw9IGRbcF0gJiYgZFtwXSA8PSBleHRlbnRzW2ldWzFdO1xuICAgICAgICB9KSA/IG51bGwgOiBcIm5vbmVcIjtcbiAgICB9KTtcbiAgICB9XG5cbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xuICAgIHdpbmRvdy50b3BpY1ZlY3RvcnMgPSB7fTtcbiAgICBpZih3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XG4gICAgICAgICAgICB2YXIgdmVjdG9yID0gW107XG4gICAgICAgICAgICBmb3IodmFyIHkgaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF0pe1xuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpbmRvdy50b3BpY1ZlY3RvcnNbeF0gPSB2ZWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcblxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkb2N1bWVudFwiOiAgZG9jS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG9waWNcIjogdG9waWMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2aXNEYXRhO1xufVxuXG4iLCJ3aW5kb3cudnVlQXBwID0gbmV3IFZ1ZSh7XG4gICAgZWw6ICcjdnVlLWFwcCcsXG4gICAgZGF0YToge1xuICAgICAgICBtZXNzYWdlOiAnSGVsbG8gdXNlciEnLFxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXG4gICAgICAgIHNlbGVjdGVkUGFnZTogMyxcbiAgICAgICAgcGxheWVyRGV0YWlsOiB7XG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxuICAgICAgICB9LFxuICAgICAgICBvdmVydmlld0ZpbHRlcnM6IHt9LFxuICAgICAgICBzZWxlY3RlZE1hcDogMVxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBzZWxlY3RQYWdlOiBmdW5jdGlvbih4KXtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRQYWdlID0geDtcbiAgICAgICAgICAgIGlmICh4ID09IDEpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMSgwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcbiAgICAgICAgbG9hZEQzKCk7XG4gICAgICAgIGxvYWRKcXVlcnkoKTtcbiAgICB9XG59KTsiXX0=
