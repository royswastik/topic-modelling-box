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
  getAnalysis("asfas", "assad");
  loadParallelCoordinate();
  loadParallelCoordinatesHC();
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

function loadParallelCoordinatesHC(resp) {
  getWord2VecClusters([["food", "apple", "banana", "biscuit", "chicken"], ["cricket", "football", "baseball", "tennis"]], function (resp) {
    var data = generateParallelCoordinateDataHC(resp, 0, 0);
    Highcharts.chart('pc-container', {
      chart: {
        type: 'spline',
        parallelCoordinates: true,
        parallelAxes: {
          lineWidth: 2
        }
      },
      title: {
        text: 'Document - Topic - Word Relationship'
      },
      plotOptions: {
        series: {
          animation: false,
          marker: {
            enabled: false,
            states: {
              hover: {
                enabled: false
              }
            }
          },
          states: {
            hover: {
              halo: {
                size: 0
              }
            }
          },
          events: {
            mouseOver: function mouseOver() {
              this.group.toFront();
            }
          }
        }
      },
      // tooltip: {
      //     pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
      //         '{series.name}: <b>{point.formattedValue}</b><br/>'
      // },
      xAxis: {
        categories: ['Document', 'Topic', 'Word'],
        offset: 10
      },
      yAxis: [{
        categories: Object.keys(resp["document_topic"]).map(function (x) {
          return "................Document " + x;
        })
      }, {
        categories: resp["topics"].map(function (x) {
          return "................Topic " + x;
        })
      }, {
        categories: Object.values(resp["words"]).map(function (x) {
          return "................" + x;
        })
      }],
      colors: ['rgba(11, 200, 200, 0.1)'],
      series: data.map(function (set, i) {
        return {
          name: '',
          data: set,
          shadow: false
        };
      })
    });
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

function generateParallelCoordinateDataHC(response, topic_threshold, word_threshold) {
  var visData = [];

  for (var docKey in response["document_topic"]) {
    for (var topic in response["document_topic"][docKey]) {
      var topicScore = response["document_topic"][docKey][topic];

      if (topicScore > topic_threshold) {
        for (var word in response["topic_word"][topic]) {
          var wordScore = response["topic_word"][topic][word];

          if (wordScore > word_threshold) {
            visData.push([parseInt(docKey), parseInt(topic), response["words"].indexOf(word)]);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5qcyIsIm1haW4uanMiLCJuZXR3b3JrLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS1oYy5qcyIsInBhcmFsbGVsLWNvb3JkaW5hdGUuanMiLCJzY2F0dGVyX3Bsb3Rfd2l0aF93ZWlnaHRzLmpzIiwic3RhY2tlZF9iYXJfZ3JhcGguanMiLCJ1dGlsLmpzIiwidnVlX21vZGVsLmpzIl0sIm5hbWVzIjpbImxvYWRKcXVlcnkiLCIkIiwiZG9jdW1lbnQiLCJyZWFkeSIsImNsaWNrIiwic2lkZWJhciIsImxvYWREMyIsImNvbnNvbGUiLCJsb2ciLCJnZXRBbmFseXNpcyIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwiZ2V0RG9jcyIsInRleHQiLCJtZXRob2QiLCJkb2NzIiwiZm5jIiwieCIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkYXRhIiwiZG9uZSIsInJlc3BvbnNlIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImFsZXJ0IiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJwYXJzZSIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDIiwiSGlnaGNoYXJ0cyIsImNoYXJ0IiwidHlwZSIsInBhcmFsbGVsQ29vcmRpbmF0ZXMiLCJwYXJhbGxlbEF4ZXMiLCJsaW5lV2lkdGgiLCJ0aXRsZSIsInBsb3RPcHRpb25zIiwic2VyaWVzIiwiYW5pbWF0aW9uIiwibWFya2VyIiwiZW5hYmxlZCIsInN0YXRlcyIsImhvdmVyIiwiaGFsbyIsInNpemUiLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJpIiwibmFtZSIsInNoYWRvdyIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIndpZHRoIiwiaGVpZ2h0IiwiZDMiLCJzY2FsZSIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsInkiLCJkcmFnZ2luZyIsImxpbmUiLCJzdmciLCJiYWNrZ3JvdW5kIiwiZm9yZWdyb3VuZCIsInNlbGVjdCIsImFwcGVuZCIsImF0dHIiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJwYXJzZUZsb2F0IiwiZG9tYWluIiwiZmlsdGVyIiwiZCIsImxpbmVhciIsImV4dGVudCIsInAiLCJyYW5nZSIsInNlbGVjdEFsbCIsImVudGVyIiwicGF0aCIsImciLCJjYWxsIiwiYmVoYXZpb3IiLCJkcmFnIiwib3JpZ2luIiwib24iLCJNYXRoIiwibWluIiwibWF4IiwiZXZlbnQiLCJzb3J0IiwiYSIsImIiLCJwb3NpdGlvbiIsInRyYW5zaXRpb24iLCJkZWxheSIsImR1cmF0aW9uIiwiZWFjaCIsInN0eWxlIiwiYnJ1c2giLCJicnVzaHN0YXJ0IiwidiIsInNvdXJjZUV2ZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwiYWN0aXZlcyIsImVtcHR5IiwiZXh0ZW50cyIsImV2ZXJ5IiwiZG9jdW1lbnRfdG9waWMiLCJ0b3BpY192ZWN0b3JzIiwiYmIiLCJxdWVyeVNlbGVjdG9yIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiZm9yRWFjaCIsImtleSIsInZhbHVlIiwicHVzaCIsImMiLCJsYWJlbFgiLCJsYWJlbFkiLCJzY2FsZUxpbmVhciIsInNjYWxlU3FydCIsIm9wYWNpdHkiLCJheGlzQm90dG9tIiwiYXhpc0xlZnQiLCJpbnNlcnQiLCJyZW5kZXJCYXJHcmFwaCIsImZhZGUiLCJmYWRlT3V0IiwidG9waWNfbnVtYmVyIiwicmVtb3ZlIiwiZmluYWxfZGF0YSIsImRhdGFWYWwiLCJoYXNPd25Qcm9wZXJ0eSIsInRlbXAiLCJTdGF0ZSIsInRvcGljX2ZyZXF1ZW5jeSIsIm92ZXJhbGwiLCJ0b3RhbCIsImxlbmd0aCIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwid2luZG93IiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwidnVlQXBwIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwic2VsZWN0ZWRNYXAiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsIm1vdW50ZWQiXSwibWFwcGluZ3MiOiI7O0FBQUEsU0FBU0EsVUFBVCxHQUFxQjtBQUNqQkMsRUFBQUEsQ0FBQyxDQUFDQyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFVO0FBQ3hCRixJQUFBQSxDQUFDLENBQUMsaUJBQUQsQ0FBRCxDQUFxQkcsS0FBckIsQ0FBMkIsWUFBVTtBQUNqQ0gsTUFBQUEsQ0FBQyxDQUFDLGFBQUQsQ0FBRCxDQUNLSSxPQURMLENBQ2EsUUFEYjtBQUdILEtB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LEdBQUosQ0FBUTtBQUNwQkMsRUFBQUEsRUFBRSxFQUFFLFVBRGdCO0FBRXBCakwsRUFBQUEsSUFBSSxFQUFFO0FBQ0ZrTCxJQUFBQSxPQUFPLEVBQUUsYUFEUDtBQUVGQyxJQUFBQSxZQUFZLEVBQUUsSUFGWjtBQUdGQyxJQUFBQSxZQUFZLEVBQUUsQ0FIWjtBQUlGQyxJQUFBQSxZQUFZLEVBQUU7QUFDVnpJLE1BQUFBLElBQUksRUFBRTtBQURJLEtBSlo7QUFPRjBJLElBQUFBLGVBQWUsRUFBRSxFQVBmO0FBUUZDLElBQUFBLFdBQVcsRUFBRTtBQVJYLEdBRmM7QUFZcEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxVQUFVLEVBQUUsb0JBQVN4TSxDQUFULEVBQVc7QUFDbkIsV0FBS21NLFlBQUwsR0FBb0JuTSxDQUFwQjs7QUFDQSxVQUFJQSxDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1BJLFFBQUFBLFNBQVMsQ0FBQyxDQUFELENBQVQ7QUFDSDs7QUFDRCxVQUFJSixDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1BLLFFBQUFBLFNBQVM7QUFDWjs7QUFDRCxVQUFJTCxDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1BNLFFBQUFBLFNBQVM7QUFDWjtBQUNKO0FBWkksR0FaVztBQTBCcEJtTSxFQUFBQSxPQUFPLEVBQUUsbUJBQVU7QUFDZm5OLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLFNBQVo7QUFDQUYsSUFBQUEsTUFBTTtBQUNOTixJQUFBQSxVQUFVO0FBQ2I7QUE5Qm1CLENBQVIsQ0FBaEIiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwiXG5mdW5jdGlvbiBsb2FkRDMoKXtcbiAgY29uc29sZS5sb2coXCJoZWxsb1wiKTtcbiAgZ2V0QW5hbHlzaXMoXCJhc2Zhc1wiLCBcImFzc2FkXCIpO1xuICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCk7XG4gIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMoKTtcbn1cblxuXG5mdW5jdGlvbiBnZXREb2NzKHRleHQpIHtcbiAgcmV0dXJuIFtcbiAgICBbXCJ3MVwiLCBcIncyXCIsIFwidzNcIiwgXCJ3NFwiLCBcInc1XCIsIFwidzZcIl0sXG4gICAgW1widzNcIiwgXCJhc2RzXCIsIFwiYXNkYXNkXCIsIFwic2FkYXNkc2FcIiwgXCJhc2Rhc2RzYVwiLCBcImFzZGFzZHNhZFwiXVxuICBdO1xufVxuXG5mdW5jdGlvbiBnZXRBbmFseXNpcyh0ZXh0LCBtZXRob2QpIHtcbiAgbGV0IGRvY3MgPSBnZXREb2NzKHRleHQpO1xuICBsZXQgZm5jID0geCA9PiB4O1xuICBpZiAobWV0aG9kID09IFwiTERBXCIpIHtcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcbiAgfSBlbHNlIHtcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xuICB9XG4gIGZuYyhkb2NzLCByZXNwID0+IHtcbiAgICBpbml0UGFnZTEocmVzcCk7XG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xuICAgIGluaXRQYWdlMyhyZXNwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcblxufVxuXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xuICByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCk7XG59XG5cblxuXG5mdW5jdGlvbiBpbml0UGFnZTIoKSB7XG5cbn1cblxuZnVuY3Rpb24gaW5pdFBhZ2UzKCkge1xuICAvLyBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCk7XG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiB2ZWN0b3JzXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcblxuICAgIGdldFdvcmQyVmVjQ2x1c3RlcnMoW1xuXHRcdFx0W1wiZm9vZFwiLCBcImFwcGxlXCIsIFwiYmFuYW5hXCIsICBcImJpc2N1aXRcIiwgIFwiY2hpY2tlblwiXSxcblx0XHRcdFtcImNyaWNrZXRcIiwgXCJmb290YmFsbFwiLCBcImJhc2ViYWxsXCIsICBcInRlbm5pc1wiXVxuXHRcdF1cbiAgICAsIGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgbGV0IGRhdGEgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwLCAwLCAwKTtcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xuICAgICAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeUF4aXM6IFt7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cbn1cblxuXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCl7XG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgICB2YXIgeCA9IGQzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcbiAgICAgICAgeSA9IHt9LFxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xuXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpLFxuICAgICAgICBiYWNrZ3JvdW5kLFxuICAgICAgICBmb3JlZ3JvdW5kO1xuXG4gICAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xuXG5cbiAgICBnZXRXb3JkMlZlY0NsdXN0ZXJzKFtcblx0XHRcdFtcImZvb2RcIiwgXCJhcHBsZVwiLCBcImJhbmFuYVwiLCAgXCJiaXNjdWl0XCIsICBcImNoaWNrZW5cIl0sXG5cdFx0XHRbXCJjcmlja2V0XCIsIFwiZm9vdGJhbGxcIiwgXCJiYXNlYmFsbFwiLCAgXCJ0ZW5uaXNcIl1cblx0XHRdXG4gICAgLCBmdW5jdGlvbihyZXNwKSB7XG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcbiAgICAvLyB2YXIgYXhpc0QgPSBkMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxuICAgIHZhciBheGlzRCA9IGQzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcbiAgICAgICAgYXhpc1QgPSBkMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNXID0gZDMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XG5cbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZCAhPSBcIm5hbWVcIiAmJiAoeVtkXSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAuZG9tYWluKGQzLmV4dGVudChjYXJzLCBmdW5jdGlvbihwKSB7IHJldHVybiArcFtkXTsgfSkpXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcbiAgICB9KSk7XG5cbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuZGF0YShjYXJzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcblxuICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuZGF0YShjYXJzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcblxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxuICAgIHZhciBnID0gc3ZnLnNlbGVjdEFsbChcIi5kaW1lbnNpb25cIilcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZGltZW5zaW9uXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxuICAgICAgICAuY2FsbChkMy5iZWhhdmlvci5kcmFnKClcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4ge3g6IHgoZCl9OyB9KVxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0geChkKTtcbiAgICAgICAgICAgIGJhY2tncm91bmQuYXR0cihcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKFwiZHJhZ1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IE1hdGgubWluKHdpZHRoLCBNYXRoLm1heCgwLCBkMy5ldmVudC54KSk7XG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihkMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihmb3JlZ3JvdW5kKS5hdHRyKFwiZFwiLCBwYXRoKTtcbiAgICAgICAgICAgIGJhY2tncm91bmRcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpc2liaWxpdHlcIiwgbnVsbCk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc0Q7XG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmNhbGwoXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC05KVxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBBZGQgYW5kIHN0b3JlIGEgYnJ1c2ggZm9yIGVhY2ggYXhpcy5cbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkMy5zdmcuYnJ1c2goKS55KHlbZF0pLm9uKFwiYnJ1c2hzdGFydFwiLCBicnVzaHN0YXJ0KS5vbihcImJydXNoXCIsIGJydXNoKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAtOClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XG4gICAgdmFyIHYgPSBkcmFnZ2luZ1tkXTtcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxuICAgIGZ1bmN0aW9uIHBhdGgoZCkge1xuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xuICAgIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZXMgYSBicnVzaCBldmVudCwgdG9nZ2xpbmcgdGhlIGRpc3BsYXkgb2YgZm9yZWdyb3VuZCBsaW5lcy5cbiAgICBmdW5jdGlvbiBicnVzaCgpIHtcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxuICAgICAgICBleHRlbnRzID0gYWN0aXZlcy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4geVtwXS5icnVzaC5leHRlbnQoKTsgfSk7XG4gICAgZm9yZWdyb3VuZC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XG4gICAgICAgIHJldHVybiBleHRlbnRzW2ldWzBdIDw9IGRbcF0gJiYgZFtwXSA8PSBleHRlbnRzW2ldWzFdO1xuICAgICAgICB9KSA/IG51bGwgOiBcIm5vbmVcIjtcbiAgICB9KTtcbiAgICB9XG5cbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xuICB2YXIgZG9jdW1lbnRfdG9waWMgPSByZXNwW1wiZG9jdW1lbnRfdG9waWNcIl1bMF07XG4gIHZhciB0b3BpY192ZWN0b3JzID0gcmVzcFtcInRvcGljX3ZlY3RvcnNcIl07XG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG4gIHZhciBoZWlnaHQgPSA0MDA7XG4gIHZhciBtYXJnaW4gPSA0MDtcbiAgdmFyIGRhdGEgPSBbXTtcblxuICBPYmplY3Qua2V5cyh0b3BpY192ZWN0b3JzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIHZhciB2YWx1ZSA9IHRvcGljX3ZlY3RvcnNba2V5XTtcbiAgICBkYXRhLnB1c2goe1xuICAgICAgeDogdmFsdWVbMF0sXG4gICAgICB5OiB2YWx1ZVsxXSxcbiAgICAgIGM6IDEsXG4gICAgICBzaXplOiBkb2N1bWVudF90b3BpY1trZXldLFxuICAgICAga2V5OiBrZXlcbiAgICB9KTtcbiAgfSk7XG4gIHZhciBsYWJlbFggPSAnWCc7XG4gIHZhciBsYWJlbFkgPSAnWSc7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxuICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0JylcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luICsgbWFyZ2luKVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luICsgXCIsXCIgKyBtYXJnaW4gKyBcIilcIik7XG5cbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLng7XG4gICAgfSldKVxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcblxuICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFtoZWlnaHQsIDBdKTtcblxuICB2YXIgc2NhbGUgPSBkMy5zY2FsZVNxcnQoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5zaXplO1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzEsIDIwXSk7XG5cbiAgdmFyIG9wYWNpdHkgPSBkMy5zY2FsZVNxcnQoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5zaXplO1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzEsIC41XSk7XG5cblxuICB2YXIgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeCk7XG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XG5cblxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcbiAgICAuY2FsbCh5QXhpcylcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAuYXR0cihcInhcIiwgMjApXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFkpO1xuICAvLyB4IGF4aXMgYW5kIGxhYmVsXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbCh4QXhpcylcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgIC5hdHRyKFwieFwiLCB3aWR0aCArIDIwKVxuICAgIC5hdHRyKFwieVwiLCBtYXJnaW4gLSAxMClcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgIC50ZXh0KGxhYmVsWCk7XG5cbiAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgIC5kYXRhKGRhdGEpXG4gICAgLmVudGVyKClcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgIC5pbnNlcnQoXCJjaXJjbGVcIilcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcbiAgICAuYXR0cihcImN5XCIsIGhlaWdodCAvIDIpXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gb3BhY2l0eShkLnNpemUpO1xuICAgIH0pXG4gICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcbiAgICB9KVxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBcIiMxZjc3YjRcIjtcbiAgICB9KVxuICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xuICAgICAgZmFkZShkLmMsIC4xKTtcbiAgICB9KVxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgZmFkZU91dCgpO1xuICAgIH0pXG4gICAgLnRyYW5zaXRpb24oKVxuICAgIC5kZWxheShmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmV0dXJuIHgoZC54KSAtIHkoZC55KTtcbiAgICB9KVxuICAgIC5kdXJhdGlvbig1MDApXG4gICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZC54KTtcbiAgICB9KVxuICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB5KGQueSk7XG4gICAgfSk7XG5cblxuICBmdW5jdGlvbiBmYWRlKGMsIG9wYWNpdHkpIHtcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBkLmMgIT0gYztcbiAgICAgIH0pXG4gICAgICAudHJhbnNpdGlvbigpXG4gICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIG9wYWNpdHkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmFkZU91dCgpIHtcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXG4gICAgICAudHJhbnNpdGlvbigpXG4gICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIG9wYWNpdHkoZC5zaXplKTtcbiAgICAgIH0pO1xuICB9XG59IiwiZnVuY3Rpb24gcmVuZGVyQmFyR3JhcGgodG9waWNfbnVtYmVyLCByZXNwKSB7XG4gIGQzLnNlbGVjdChcIiNzdGFjay1iYXJcIikucmVtb3ZlKCk7XG4gIHZhciBmaW5hbF9kYXRhID0gW107XG4gIHZhciBkYXRhVmFsID1yZXNwW1widG9waWNfd29yZFwiXVt0b3BpY19udW1iZXJdO1xuICBmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xuICAgIGlmIChkYXRhVmFsLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdmFyIHRlbXAgPXt9O1xuICAgICAgICB0ZW1wLlN0YXRlID0ga2V5O1xuICAgICAgICB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSA9IGRhdGFWYWxba2V5XTtcbiAgICAgICAgdGVtcC5vdmVyYWxsID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldO1xuICAgICAgICB0ZW1wLnRvdGFsID0gdGVtcC50b3BpY19mcmVxdWVuY3kgKyB0ZW1wLm92ZXJhbGw7XG4gICAgICAgIGZpbmFsX2RhdGEucHVzaCh0ZW1wKTtcbiAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCIgLT4gXCIgKyBkYXRhVmFsW2tleV0pO1xuICAgIH1cbiAgfVxuICBcblxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhY2tlZC1iYXInKVxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICB3aWR0aCA9IGJiLnJpZ2h0IC0gYmIubGVmdDtcblxuICB2YXIgZGF0YSA9IGZpbmFsX2RhdGE7XG4gIHZhciBoZWlnaHQgPSBkYXRhLmxlbmd0aCAqIDI1O1xuICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI3N0YWNrZWQtYmFyXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcInN0YWNrLWJhclwiKSxcbiAgICBtYXJnaW4gPSB7XG4gICAgICB0b3A6IDIwLFxuICAgICAgcmlnaHQ6IDIwLFxuICAgICAgYm90dG9tOiAzMCxcbiAgICAgIGxlZnQ6IDUwXG4gICAgfSxcbiAgICB3aWR0aCA9ICtzdmcuYXR0cihcIndpZHRoXCIpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXG4gICAgaGVpZ2h0ID0gK3N2Zy5hdHRyKFwiaGVpZ2h0XCIpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXG4gICAgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKTtcbiAgdmFyIHkgPSBkMy5zY2FsZUJhbmQoKSAvLyB4ID0gZDMuc2NhbGVCYW5kKCkgIFxuICAgIC5yYW5nZVJvdW5kKFswLCBoZWlnaHRdKSAvLyAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKVxuICAgIC5wYWRkaW5nSW5uZXIoMC4yNSkuYWxpZ24oMC4xKTtcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpIC8vIHkgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7IC8vIC5yYW5nZVJvdW5kKFtoZWlnaHQsIDBdKTtcblxuICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbCgpLnJhbmdlKFtcIiNDODQyM0VcIiwgXCIjQTFDN0UwXCJdKTtcbiAgdmFyIGtleXMgPSBbXCJ0b3BpY19mcmVxdWVuY3lcIiwgXCJvdmVyYWxsXCJdO1xuICBkYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XG4gIH0pO1xuICB5LmRvbWFpbihkYXRhLm1hcChmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkLlN0YXRlO1xuICB9KSk7IC8vIHguZG9tYWluLi4uXG5cbiAgeC5kb21haW4oWzAsIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkLnRvdGFsO1xuICB9KV0pLm5pY2UoKTsgLy8geS5kb21haW4uLi5cblxuICB6LmRvbWFpbihrZXlzKTtcbiAgZy5hcHBlbmQoXCJnXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShkMy5zdGFjaygpLmtleXMoa2V5cykoZGF0YSkpLmVudGVyKCkuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHooZC5rZXkpO1xuICAgIH0pLnNlbGVjdEFsbChcInJlY3RcIikuZGF0YShmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfSkuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLmRhdGEuU3RhdGUpO1xuICAgIH0pIC8vLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHgoZC5kYXRhLlN0YXRlKTsgfSlcbiAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGRbMF0pO1xuICAgIH0pIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFsxXSk7IH0pICBcbiAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkWzFdKSAtIHgoZFswXSk7XG4gICAgfSkgLy8uYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMF0pIC0geShkWzFdKTsgfSlcbiAgICAuYXR0cihcImhlaWdodFwiLCB5LmJhbmR3aWR0aCgpKVxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCAwLjgpOyAvLy5hdHRyKFwid2lkdGhcIiwgeC5iYW5kd2lkdGgoKSk7IFxuXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwwKVwiKSAvLyAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxuICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHkpKTsgLy8gICAuY2FsbChkMy5heGlzQm90dG9tKHgpKTtcblxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIikgLy8gTmV3IGxpbmVcbiAgICAuY2FsbChkMy5heGlzQm90dG9tKHgpLnRpY2tzKG51bGwsIFwic1wiKSkgLy8gIC5jYWxsKGQzLmF4aXNMZWZ0KHkpLnRpY2tzKG51bGwsIFwic1wiKSlcbiAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieVwiLCAyKSAvLyAgICAgLmF0dHIoXCJ5XCIsIDIpXG4gICAgLmF0dHIoXCJ4XCIsIHgoeC50aWNrcygpLnBvcCgpKSArIDAuNSkgLy8gICAgIC5hdHRyKFwieVwiLCB5KHkudGlja3MoKS5wb3AoKSkgKyAwLjUpXG4gICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKSAvLyAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKVxuICB2YXIgbGVnZW5kID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoLTUwLFwiICsgKDMwMCArIGkgKiAyMCkgKyBcIilcIjtcbiAgICB9KTtcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGggLSAxOSkuYXR0cihcIndpZHRoXCIsIDE5KS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcbiAgbGVnZW5kLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgd2lkdGggLSAyNCkuYXR0cihcInlcIiwgOS41KS5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkO1xuICB9KTtcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xuICAgIHdpbmRvdy50b3BpY1ZlY3RvcnMgPSB7fTtcbiAgICBpZih3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XG4gICAgICAgICAgICB2YXIgdmVjdG9yID0gW107XG4gICAgICAgICAgICBmb3IodmFyIHkgaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF0pe1xuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpbmRvdy50b3BpY1ZlY3RvcnNbeF0gPSB2ZWN0b3I7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcblxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkb2N1bWVudFwiOiAgZG9jS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG9waWNcIjogdG9waWMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2aXNEYXRhO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcblxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlzRGF0YTtcbn1cblxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xuICAgIGVsOiAnI3Z1ZS1hcHAnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDEsXG4gICAgICAgIHBsYXllckRldGFpbDoge1xuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDFcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEoMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBtb3VudGVkOiBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XG4gICAgICAgIGxvYWREMygpO1xuICAgICAgICBsb2FkSnF1ZXJ5KCk7XG4gICAgfVxufSk7Il19
