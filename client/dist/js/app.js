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
"use strict";

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5qcyIsIm1haW4uanMiLCJuZXR3b3JrLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiXSwibmFtZXMiOlsibG9hZEpxdWVyeSIsIiQiLCJkb2N1bWVudCIsInJlYWR5IiwiY2xpY2siLCJzaWRlYmFyIiwibG9hZEQzIiwiY29uc29sZSIsImxvZyIsImQzIiwianNvbiIsIngiLCJ3aW5kb3ciLCJkb2N1bWVudF90b3BpY19wcm9iYWJpbGl0eSIsInkiLCJ3b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhIiwieiIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHkiLCJnZXRBbmFseXNpcyIsImdldERvY3MiLCJ0ZXh0IiwibWV0aG9kIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkYXRhIiwiZG9uZSIsInJlc3BvbnNlIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImFsZXJ0IiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJwYXJzZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsInNjYWxlIiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwic3ZnIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJzZWxlY3QiLCJhcHBlbmQiLCJhdHRyIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsInBhcnNlSW50IiwiYXhpc1QiLCJheGlzVyIsInZhbHVlcyIsInBhcnNlRmxvYXQiLCJkb21haW4iLCJmaWx0ZXIiLCJkIiwibGluZWFyIiwiZXh0ZW50IiwicCIsInJhbmdlIiwic2VsZWN0QWxsIiwiZW50ZXIiLCJwYXRoIiwiZyIsImNhbGwiLCJiZWhhdmlvciIsImRyYWciLCJvcmlnaW4iLCJvbiIsIk1hdGgiLCJtaW4iLCJtYXgiLCJldmVudCIsInNvcnQiLCJhIiwiYiIsInBvc2l0aW9uIiwidHJhbnNpdGlvbiIsImRlbGF5IiwiZHVyYXRpb24iLCJlYWNoIiwic3R5bGUiLCJicnVzaCIsImJydXNoc3RhcnQiLCJ2Iiwic291cmNlRXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJhY3RpdmVzIiwiZW1wdHkiLCJleHRlbnRzIiwiZXZlcnkiLCJpIiwiZG9jdW1lbnRfdG9waWMiLCJ0b3BpY192ZWN0b3JzIiwiYmIiLCJxdWVyeVNlbGVjdG9yIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiZm9yRWFjaCIsImtleSIsInZhbHVlIiwicHVzaCIsImMiLCJzaXplIiwibGFiZWxYIiwibGFiZWxZIiwic2NhbGVMaW5lYXIiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwieEF4aXMiLCJheGlzQm90dG9tIiwieUF4aXMiLCJheGlzTGVmdCIsImluc2VydCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJyZW1vdmUiLCJmaW5hbF9kYXRhIiwiZGF0YVZhbCIsImhhc093blByb3BlcnR5IiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwibGVuZ3RoIiwic2NhbGVCYW5kIiwicmFuZ2VSb3VuZCIsInBhZGRpbmdJbm5lciIsImFsaWduIiwic2NhbGVPcmRpbmFsIiwibmljZSIsInN0YWNrIiwiYmFuZHdpZHRoIiwidGlja3MiLCJwb3AiLCJsZWdlbmQiLCJzbGljZSIsInJldmVyc2UiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwidnVlQXBwIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwibmFtZSIsIm92ZXJ2aWV3RmlsdGVycyIsInNlbGVjdGVkTWFwIiwibWV0aG9kcyIsInNlbGVjdFBhZ2UiLCJtb3VudGVkIl0sIm1hcHBpbmdzIjoiOztBQUFBLFNBQVNBLFVBQVQsR0FBcUI7QUFDakJDLEVBQUFBLENBQUMsQ0FBQ0MsUUFBRCxDQUFELENBQVlDLEtBQVosQ0FBa0IsWUFBVTtBQUN4QkYsSUFBQUEsQ0FBQyxDQUFDLGlCQUFELENBQUQsQ0FBcUJHLEtBQXJCLENBQTJCLFlBQVU7QUFDakNILE1BQUFBLENBQUMsQ0FBQyxhQUFELENBQUQsQ0FDS0ksT0FETCxDQUNhLFFBRGI7QUFHSCxLQUpEO0FBTUgsR0FQRDtBQVFIOzs7QUNURCxTQUFTQyxNQUFULEdBQWtCO0FBQ2hCQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxPQUFaO0FBQ0FDLEVBQUFBLEVBQUUsQ0FBQ0MsSUFBSCxDQUFRLHNDQUFSLEVBQWdELFVBQVNDLENBQVQsRUFBVztBQUN2REMsSUFBQUEsTUFBTSxDQUFDQywwQkFBUCxHQUFtQ0YsQ0FBbkM7QUFDQUYsSUFBQUEsRUFBRSxDQUFDQyxJQUFILENBQVEsOENBQVIsRUFBd0QsVUFBU0ksQ0FBVCxFQUFXO0FBQy9ERixNQUFB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aEIiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwiZnVuY3Rpb24gbG9hZEQzKCkge1xuICBjb25zb2xlLmxvZyhcImhlbGxvXCIpO1xuICBkMy5qc29uKFwiZGF0YS9kb2N1bWVudF90b3BpY19wcm9iYWJpbGl0eS5qc29uXCIsIGZ1bmN0aW9uKHgpe1xuICAgICAgd2luZG93LmRvY3VtZW50X3RvcGljX3Byb2JhYmlsaXR5PSB4O1xuICAgICAgZDMuanNvbihcImRhdGEvdG9waWNfd29yZF9kaXN0cmlidXRpb25faW5fY29ycG9yYS5qc29uXCIsIGZ1bmN0aW9uKHkpe1xuICAgICAgICAgIHdpbmRvdy53b3JkX2Rpc3RyaWJ1dGlvbl9pbl9jb3Jwb3JhPSB5O1xuICAgICAgICAgIGQzLmpzb24oXCJkYXRhL3RvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMuanNvblwiLCBmdW5jdGlvbih6KXtcbiAgICAgICAgICAgICAgd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHkgPSB6O1xuICAgICAgICAgICAgICBnZXRBbmFseXNpcyhcImFzZmFzXCIsIFwiYXNzYWRcIik7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfSk7XG5cbn1cblxuXG5mdW5jdGlvbiBnZXREb2NzKHRleHQpIHtcbiAgcmV0dXJuIFtcbiAgICBbXCJ3MVwiLCBcIncyXCIsIFwidzNcIiwgXCJ3NFwiLCBcInc1XCIsIFwidzZcIl0sXG4gICAgW1widzNcIiwgXCJhc2RzXCIsIFwiYXNkYXNkXCIsIFwic2FkYXNkc2FcIiwgXCJhc2Rhc2RzYVwiLCBcImFzZGFzZHNhZFwiXVxuICBdO1xufVxuXG5mdW5jdGlvbiBnZXRBbmFseXNpcyh0ZXh0LCBtZXRob2QpIHtcbiAgbGV0IGRvY3MgPSBnZXREb2NzKHRleHQpO1xuICBsZXQgZm5jID0geCA9PiB4O1xuICBpZiAobWV0aG9kID09IFwiTERBXCIpIHtcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcbiAgfSBlbHNlIHtcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xuICB9XG4gIGZuYyhkb2NzLCByZXNwID0+IHtcbiAgICBpbml0UGFnZTEocmVzcCk7XG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xuICAgIGluaXRQYWdlMyhyZXNwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcblxufVxuXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xuICByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCk7XG59XG5cblxuXG5mdW5jdGlvbiBpbml0UGFnZTIoKSB7XG5cbn1cblxuZnVuY3Rpb24gaW5pdFBhZ2UzKCkge1xuICAvLyBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCk7XG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiB2ZWN0b3JzXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSgpe1xuICAgIHZhciBtYXJnaW4gPSB7dG9wOiAzMCwgcmlnaHQ6IDEwLCBib3R0b206IDEwLCBsZWZ0OiAxMH0sXG4gICAgICAgIHdpZHRoID0gOTYwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXG4gICAgICAgIGhlaWdodCA9IDUwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuXG4gICAgdmFyIHggPSBkMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIHdpZHRoXSwgMSksXG4gICAgICAgIHkgPSB7fSxcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcblxuICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKSxcbiAgICAgICAgYmFja2dyb3VuZCxcbiAgICAgICAgZm9yZWdyb3VuZDtcblxuICAgIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKSwgZGltZW5zaW9ucztcblxuXG4gICAgZ2V0V29yZDJWZWNDbHVzdGVycyhbXG5cdFx0XHRbXCJmb29kXCIsIFwiYXBwbGVcIiwgXCJiYW5hbmFcIiwgIFwiYmlzY3VpdFwiLCAgXCJjaGlja2VuXCJdLFxuXHRcdFx0W1wiY3JpY2tldFwiLCBcImZvb3RiYWxsXCIsIFwiYmFzZWJhbGxcIiwgIFwidGVubmlzXCJdXG5cdFx0XVxuICAgICwgZnVuY3Rpb24ocmVzcCkge1xuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXG4gICAgdmFyIGNhcnMgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcCwgMCwgMCk7XG4gICAgLy8gdmFyIGF4aXNEID0gZDMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubGVuZ3RoKSxcbiAgICB2YXIgYXhpc0QgPSBkMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNUID0gZDMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMocmVzcFtcInRvcGljc1wiXS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxuICAgICAgICBheGlzVyA9IGQzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC52YWx1ZXMocmVzcFtcIm92ZXJhbGxfd29yZFwiXSkubWFwKHggPT4gcGFyc2VGbG9hdCh4KSkpO1xuXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzLmtleXMoY2Fyc1swXSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgLmRvbWFpbihkMy5leHRlbnQoY2FycywgZnVuY3Rpb24ocCkgeyByZXR1cm4gK3BbZF07IH0pKVxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XG4gICAgfSkpO1xuXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cbiAgICBiYWNrZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmRhdGEoY2FycylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XG5cbiAgICAvLyBBZGQgYmx1ZSBmb3JlZ3JvdW5kIGxpbmVzIGZvciBmb2N1cy5cbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImZvcmVncm91bmRcIilcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcbiAgICAgICAgLmRhdGEoY2FycylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XG5cbiAgICAvLyBBZGQgYSBncm91cCBlbGVtZW50IGZvciBlYWNoIGRpbWVuc2lvbi5cbiAgICB2YXIgZyA9IHN2Zy5zZWxlY3RBbGwoXCIuZGltZW5zaW9uXCIpXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpbWVuc2lvblwiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcbiAgICAgICAgLmNhbGwoZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDMuZXZlbnQueCkpO1xuICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKFwiZFwiLCBwYXRoKTtcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcbiAgICAgICAgICAgIHguZG9tYWluKGRpbWVuc2lvbnMpO1xuICAgICAgICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcG9zaXRpb24oZCkgKyBcIilcIjsgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJkcmFnZW5kXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBkcmFnZ2luZ1tkXTtcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDMuc2VsZWN0KHRoaXMpKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZm9yZWdyb3VuZCkuYXR0cihcImRcIiwgcGF0aCk7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIG51bGwpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgLy8gQWRkIGFuIGF4aXMgYW5kIHRpdGxlLlxuICAgIGcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XG4gICAgICAgICAgICBpZihkID09IFwiZG9jdW1lbnRcIil7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNEO1xuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1Q7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jYWxsKFxuICAgICAgICAgICAgICAgIGF4aXMuc2NhbGUoeVtkXSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJicnVzaFwiKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuY2FsbCh5W2RdLmJydXNoID0gZDMuc3ZnLmJydXNoKCkueSh5W2RdKS5vbihcImJydXNoc3RhcnRcIiwgYnJ1c2hzdGFydCkub24oXCJicnVzaFwiLCBicnVzaCkpO1xuICAgICAgICB9KVxuICAgICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgLTgpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gcG9zaXRpb24oZCkge1xuICAgIHZhciB2ID0gZHJhZ2dpbmdbZF07XG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xuICAgIHJldHVybiBnLnRyYW5zaXRpb24oKS5kdXJhdGlvbig1MDApO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIHBhdGggZm9yIGEgZ2l2ZW4gZGF0YSBwb2ludC5cbiAgICBmdW5jdGlvbiBwYXRoKGQpIHtcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcbiAgICBkMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XG4gICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XG4gICAgfSk7XG4gICAgfVxuXG59IiwiZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2x1c3RlcicpXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xuICB2YXIgaGVpZ2h0ID0gNDAwO1xuICB2YXIgbWFyZ2luID0gNDA7XG4gIHZhciBkYXRhID0gW107XG5cbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgIHg6IHZhbHVlWzBdLFxuICAgICAgeTogdmFsdWVbMV0sXG4gICAgICBjOiAxLFxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcbiAgICAgIGtleToga2V5XG4gICAgfSk7XG4gIH0pO1xuICB2YXIgbGFiZWxYID0gJ1gnO1xuICB2YXIgbGFiZWxZID0gJ1knO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcbiAgICAuYXBwZW5kKCdzdmcnKVxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xuXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueDtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC55O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSldKVxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAyMF0pO1xuXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xuXG5cbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xuXG5cbiAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgLmNhbGwoeUF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgLnRleHQobGFiZWxZKTtcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoeEF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFgpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAuZGF0YShkYXRhKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIG9wYWNpdHkoZC5zaXplKTtcbiAgICB9KVxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XG4gICAgfSlcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gXCIjMWY3N2I0XCI7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcbiAgICAgIGZhZGUoZC5jLCAuMSk7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGVPdXQoKTtcbiAgICB9KVxuICAgIC50cmFuc2l0aW9uKClcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XG4gICAgfSlcbiAgICAuZHVyYXRpb24oNTAwKVxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGQueCk7XG4gICAgfSlcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLnkpO1xuICAgIH0pO1xuXG5cbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5jICE9IGM7XG4gICAgICB9KVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgICB9KTtcbiAgfVxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHZhciB0ZW1wID17fTtcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcbiAgICB9XG4gIH1cbiAgXG5cbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG5cbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNTtcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXG4gICAgbWFyZ2luID0ge1xuICAgICAgdG9wOiAyMCxcbiAgICAgIHJpZ2h0OiAyMCxcbiAgICAgIGJvdHRvbTogMzAsXG4gICAgICBsZWZ0OiA1MFxuICAgIH0sXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbFwiXTtcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICB9KTtcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC5TdGF0ZTtcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxuXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC50b3RhbDtcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXG5cbiAgei5kb21haW4oa2V5cyk7XG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB6KGQua2V5KTtcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXG4gICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSlcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcblxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpIC8vIE5ldyBsaW5lXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxuICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7XG4gICAgfSk7XG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMTkpLmF0dHIoXCJ3aWR0aFwiLCAxOSkuYXR0cihcImhlaWdodFwiLCAxOSkuYXR0cihcImZpbGxcIiwgeik7XG4gIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjQpLmF0dHIoXCJ5XCIsIDkuNSkuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZDtcbiAgfSk7XG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcbiAgICB3aW5kb3cudG9waWNWZWN0b3JzID0ge307XG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICAgICAgdmFyIHZlY3RvciA9IFtdO1xuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZG9jdW1lbnRcIjogIGRvY0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlzRGF0YTtcbn1cblxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xuICAgIGVsOiAnI3Z1ZS1hcHAnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDEsXG4gICAgICAgIHBsYXllckRldGFpbDoge1xuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDFcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtb3VudGVkOiBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XG4gICAgICAgIGxvYWREMygpO1xuICAgICAgICBsb2FkSnF1ZXJ5KCk7XG4gICAgfVxufSk7Il19
