"use strict";

function renderClusterForceLayout() {}
"use strict";

function loadJquery() {
  $(document).ready(function () {
    $("#toggle-sidebar").click(function () {
      $('.ui.sidebar').sidebar('toggle');
    });
  });
}
"use strict";

require.config({
  paths: {
    "d3": "https://d3js.org/d3.v3.min"
  }
});

function loadD3() {
  window.d3Old = d3;

  require(['d3'], function (d3V3) {
    window.d3V3 = d3V3;
    window.d3 = d3Old;
    getAnalysis("asfas", "assad");
    loadParallelCoordinate();
    loadParallelCoordinatesHC();
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
    window.global_data = resp;
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
  });
}

function loadVisualizations() {}

function initPage1(resp) {
  renderClusterAnalysis(resp);
}

function initPage2(resp) {
  renderClusterForceLayout(resp);
}

function initPage3() {
  $("#parallel-coordinate-vis").html("");
  $("#pc-container").html("");
  loadParallelCoordinate();
  loadParallelCoordinatesHC();
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
  var x = d3V3.scale.ordinal().rangePoints([0, width], 1),
      y = {},
      dragging = {};
  var line = d3V3.svg.line(),
      background,
      foreground;
  var svg = d3V3.select("#parallel-coordinate-vis").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
      dimensions;
  getWord2VecClusters([["food", "apple", "banana", "biscuit", "chicken"], ["cricket", "football", "baseball", "tennis"]], function (resp) {
    // Extract the list of dimensions and create a scale for each.
    var cars = generateParallelCoordinateData(resp, 0, 0); // var axisD = d3V3.svg.axis().orient("left").ticks(Object.keys(resp["document_topic"]).length),

    var axisD = d3V3.svg.axis().orient("left").tickValues(Object.keys(resp["document_topic"]).map(function (x) {
      return parseInt(x);
    })),
        axisT = d3V3.svg.axis().orient("left").tickValues(resp["topics"].map(function (x) {
      return parseInt(x);
    })),
        axisW = d3V3.svg.axis().orient("left").tickValues(Object.values(resp["overall_word"]).map(function (x) {
      return parseFloat(x);
    }));
    x.domain(dimensions = d3V3.keys(cars[0]).filter(function (d) {
      return d != "name" && (y[d] = d3V3.scale.linear().domain(d3V3.extent(cars, function (p) {
        return +p[d];
      })).range([height, 0]));
    })); // Add grey background lines for context.

    background = svg.append("g").attr("class", "background").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add blue foreground lines for focus.

    foreground = svg.append("g").attr("class", "foreground").selectAll("path").data(cars).enter().append("path").attr("d", path); // Add a group element for each dimension.

    var g = svg.selectAll(".dimension").data(dimensions).enter().append("g").attr("class", "dimension").attr("transform", function (d) {
      return "translate(" + x(d) + ")";
    }).call(d3V3.behavior.drag().origin(function (d) {
      return {
        x: x(d)
      };
    }).on("dragstart", function (d) {
      dragging[d] = x(d);
      background.attr("visibility", "hidden");
    }).on("drag", function (d) {
      dragging[d] = Math.min(width, Math.max(0, d3V3.event.x));
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
      transition(d3V3.select(this)).attr("transform", "translate(" + x(d) + ")");
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

      d3V3.select(this).call(axis.scale(y[d]));
    }).append("text").style("text-anchor", "middle").attr("y", -9).text(function (d) {
      return d;
    }); // Add and store a brush for each axis.

    g.append("g").attr("class", "brush").each(function (d) {
      d3V3.select(this).call(y[d].brush = d3V3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
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
    d3V3.event.sourceEvent.stopPropagation();
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
  debugger;
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
        initPage1(window.global_data);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiXSwibmFtZXMiOlsicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwibG9hZEpxdWVyeSIsIiQiLCJkb2N1bWVudCIsInJlYWR5IiwiY2xpY2siLCJzaWRlYmFyIiwicmVxdWlyZSIsImNvbmZpZyIsInBhdGhzIiwibG9hZEQzIiwid2luZG93IiwiZDNPbGQiLCJkMyIsImQzVjMiLCJnZXRBbmFseXNpcyIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwiZ2V0RG9jcyIsInRleHQiLCJtZXRob2QiLCJkb2NzIiwiZm5jIiwieCIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJnbG9iYWxfZGF0YSIsImluaXRQYWdlMSIsImluaXRQYWdlMiIsImluaXRQYWdlMyIsImxvYWRWaXN1YWxpemF0aW9ucyIsInJlbmRlckNsdXN0ZXJBbmFseXNpcyIsImh0bWwiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkYXRhIiwiZG9uZSIsInJlc3BvbnNlIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImFsZXJ0IiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJwYXJzZSIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDIiwiSGlnaGNoYXJ0cyIsImNoYXJ0IiwidHlwZSIsInBhcmFsbGVsQ29vcmRpbmF0ZXMiLCJwYXJhbGxlbEF4ZXMiLCJsaW5lV2lkdGgiLCJ0aXRsZSIsInBsb3RPcHRpb25zIiwic2VyaWVzIiwiYW5pbWF0aW9uIiwibWFya2VyIiwiZW5hYmxlZCIsInN0YXRlcyIsImhvdmVyIiwiaGFsbyIsInNpemUiLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJpIiwibmFtZSIsInNoYWRvdyIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIndpZHRoIiwiaGVpZ2h0Iiwic2NhbGUiLCJvcmRpbmFsIiwicmFuZ2VQb2ludHMiLCJ5IiwiZHJhZ2dpbmciLCJsaW5lIiwic3ZnIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJzZWxlY3QiLCJhcHBlbmQiLCJhdHRyIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImZpbHRlciIsImQiLCJsaW5lYXIiLCJleHRlbnQiLCJwIiwicmFuZ2UiLCJzZWxlY3RBbGwiLCJlbnRlciIsInBhdGgiLCJnIiwiY2FsbCIsImJlaGF2aW9yIiwiZHJhZyIsIm9yaWdpbiIsIm9uIiwiTWF0aCIsIm1pbiIsIm1heCIsImV2ZW50Iiwic29ydCIsImEiLCJiIiwicG9zaXRpb24iLCJ0cmFuc2l0aW9uIiwiZGVsYXkiLCJkdXJhdGlvbiIsImVhY2giLCJzdHlsZSIsImJydXNoIiwiYnJ1c2hzdGFydCIsInYiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImZvckVhY2giLCJrZXkiLCJ2YWx1ZSIsInB1c2giLCJjIiwibGFiZWxYIiwibGFiZWxZIiwic2NhbGVMaW5lYXIiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwiYXhpc0JvdHRvbSIsImF4aXNMZWZ0IiwiaW5zZXJ0IiwicmVuZGVyQmFyR3JhcGgiLCJmYWRlIiwiZmFkZU91dCIsInRvcGljX251bWJlciIsInJlbW92ZSIsImZpbmFsX2RhdGEiLCJkYXRhVmFsIiwiaGFzT3duUHJvcGVydHkiLCJ0ZW1wIiwiU3RhdGUiLCJ0b3BpY19mcmVxdWVuY3kiLCJvdmVyYWxsIiwidG90YWwiLCJjb25zb2xlIiwibG9nIiwibGVuZ3RoIiwic2NhbGVCYW5kIiwicmFuZ2VSb3VuZCIsInBhZGRpbmdJbm5lciIsImFsaWduIiwieiIsInNjYWxlT3JkaW5hbCIsIm5pY2UiLCJzdGFjayIsImJhbmR3aWR0aCIsInRpY2tzIiwicG9wIiwibGVnZW5kIiwic2xpY2UiLCJyZXZlcnNlIiwiZ2VuZXJhdGVUb3BpY1ZlY3RvcnMiLCJ0b3BpY1ZlY3RvcnMiLCJ0b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljIiwidmVjdG9yIiwidG9waWNfdGhyZXNob2xkIiwid29yZF90aHJlc2hvbGQiLCJ2aXNEYXRhIiwiZG9jS2V5IiwidG9waWMiLCJ0b3BpY1Njb3JlIiwid29yZCIsIndvcmRTY29yZSIsImluZGV4T2YiLCJ2dWVBcHAiLCJWdWUiLCJlbCIsIm1lc3NhZ2UiLCJub25lU2VsZWN0ZWQiLCJzZWxlY3RlZFBhZ2UiLCJwbGF5ZXJEZXRhaWwiLCJvdmVydmlld0ZpbHRlcnMiLCJzZWxlY3RlZE1hcCIsIm1ldGhvZHMiLCJzZWxlY3RQYWdlIiwibW91bnRlZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxTQUFTQSx3QkFBVCxHQUFtQyxDQUVsQzs7O0FDRkQsU0FBU0MsVUFBVCxHQUFxQjtBQUNqQkMsRUFBQUEsQ0FBQyxDQUFDQyxRQUFE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SUFBQUEsV0FBVyxFQUFFO0FBUlgsR0FGYztBQVlwQkMsRUFBQUEsT0FBTyxFQUFFO0FBQ0xDLElBQUFBLFVBQVUsRUFBRSxvQkFBUzFNLENBQVQsRUFBVztBQUNuQixXQUFLcU0sWUFBTCxHQUFvQnJNLENBQXBCOztBQUNBLFVBQUlBLENBQUMsSUFBSSxDQUFULEVBQVc7QUFDUEssUUFBQUEsU0FBUyxDQUFDakIsTUFBTSxDQUFDZ0IsV0FBUixDQUFUO0FBQ0g7O0FBQ0QsVUFBSUosQ0FBQyxJQUFJLENBQVQsRUFBVztBQUNQTSxRQUFBQSxTQUFTO0FBQ1o7O0FBQ0QsVUFBSU4sQ0FBQyxJQUFJLENBQVQsRUFBVztBQUNQTyxRQUFBQSxTQUFTO0FBQ1o7QUFDSjtBQVpJLEdBWlc7QUEwQnBCb00sRUFBQUEsT0FBTyxFQUFFLG1CQUFVO0FBQ2Z6QyxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxTQUFaO0FBQ0FoTCxJQUFBQSxNQUFNO0FBQ05ULElBQUFBLFVBQVU7QUFDYjtBQTlCbUIsQ0FBUixDQUFoQiIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQoKXtcblx0XG59IiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwicmVxdWlyZS5jb25maWcoe1xuICAgIHBhdGhzOiB7XG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIGxvYWREMygpe1xuXG4gICAgd2luZG93LmQzT2xkID0gZDM7XG4gICAgcmVxdWlyZShbJ2QzJ10sIGZ1bmN0aW9uKGQzVjMpIHtcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcbiAgICAgICAgZ2V0QW5hbHlzaXMoXCJhc2Zhc1wiLCBcImFzc2FkXCIpO1xuICAgICAgICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbiAgICAgICAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKCk7XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0KSB7XG4gIHJldHVybiBbXG4gICAgW1widzFcIiwgXCJ3MlwiLCBcInczXCIsIFwidzRcIiwgXCJ3NVwiLCBcInc2XCJdLFxuICAgIFtcInczXCIsIFwiYXNkc1wiLCBcImFzZGFzZFwiLCBcInNhZGFzZHNhXCIsIFwiYXNkYXNkc2FcIiwgXCJhc2Rhc2RzYWRcIl1cbiAgXTtcbn1cblxuZnVuY3Rpb24gZ2V0QW5hbHlzaXModGV4dCwgbWV0aG9kKSB7XG4gIGxldCBkb2NzID0gZ2V0RG9jcyh0ZXh0KTtcbiAgbGV0IGZuYyA9IHggPT4geDtcbiAgaWYgKG1ldGhvZCA9PSBcIkxEQVwiKSB7XG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XG4gIH0gZWxzZSB7XG4gICAgZm5jID0gZ2V0V29yZDJWZWNDbHVzdGVycztcbiAgfVxuICBmbmMoZG9jcywgcmVzcCA9PiB7XG4gICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcbiAgICBpbml0UGFnZTEocmVzcCk7XG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xuICAgIGluaXRQYWdlMyhyZXNwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcbn1cblxuZnVuY3Rpb24gaW5pdFBhZ2UxKHJlc3ApIHtcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xufVxuXG5cblxuZnVuY3Rpb24gaW5pdFBhZ2UyKHJlc3ApIHtcbiAgcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KHJlc3ApO1xuXG59XG5cbmZ1bmN0aW9uIGluaXRQYWdlMygpe1xuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKCk7XG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiB2ZWN0b3JzXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcblxuICAgIGdldFdvcmQyVmVjQ2x1c3RlcnMoW1xuXHRcdFx0W1wiZm9vZFwiLCBcImFwcGxlXCIsIFwiYmFuYW5hXCIsICBcImJpc2N1aXRcIiwgIFwiY2hpY2tlblwiXSxcblx0XHRcdFtcImNyaWNrZXRcIiwgXCJmb290YmFsbFwiLCBcImJhc2ViYWxsXCIsICBcInRlbm5pc1wiXVxuXHRcdF1cbiAgICAsIGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgbGV0IGRhdGEgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwLCAwLCAwKTtcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xuICAgICAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeUF4aXM6IFt7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cbn1cblxuXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCl7XG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgICB2YXIgeCA9IGQzVjMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxuICAgICAgICB5ID0ge30sXG4gICAgICAgIGRyYWdnaW5nID0ge307XG5cbiAgICB2YXIgbGluZSA9IGQzVjMuc3ZnLmxpbmUoKSxcbiAgICAgICAgYmFja2dyb3VuZCxcbiAgICAgICAgZm9yZWdyb3VuZDtcblxuICAgIHZhciBzdmcgPSBkM1YzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xuXG5cbiAgICBnZXRXb3JkMlZlY0NsdXN0ZXJzKFtcblx0XHRcdFtcImZvb2RcIiwgXCJhcHBsZVwiLCBcImJhbmFuYVwiLCAgXCJiaXNjdWl0XCIsICBcImNoaWNrZW5cIl0sXG5cdFx0XHRbXCJjcmlja2V0XCIsIFwiZm9vdGJhbGxcIiwgXCJiYXNlYmFsbFwiLCAgXCJ0ZW5uaXNcIl1cblx0XHRdXG4gICAgLCBmdW5jdGlvbihyZXNwKSB7XG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNUID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcblxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMgPSBkM1YzLmtleXMoY2Fyc1swXSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcbiAgICAgICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSkpO1xuICAgIH0pKTtcblxuICAgIC8vIEFkZCBncmV5IGJhY2tncm91bmQgbGluZXMgZm9yIGNvbnRleHQuXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXG4gICAgZm9yZWdyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCI7IH0pXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgbGV0IGF4aXMgPSBudWxsO1xuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZihkID09IFwidG9waWNcIil7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxuICAgICAgICAgICAgICAgIGF4aXMuc2NhbGUoeVtkXSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJicnVzaFwiKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDE2KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4gW3Bvc2l0aW9uKHApLCB5W3BdKGRbcF0pXTsgfSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XG4gICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XG4gICAgfSk7XG4gICAgfVxuXG59IiwiZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcbiAgZGVidWdnZXJcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2x1c3RlcicpXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xuICB2YXIgaGVpZ2h0ID0gNDAwO1xuICB2YXIgbWFyZ2luID0gNDA7XG4gIHZhciBkYXRhID0gW107XG5cbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XG4gICAgZGF0YS5wdXNoKHtcbiAgICAgIHg6IHZhbHVlWzBdLFxuICAgICAgeTogdmFsdWVbMV0sXG4gICAgICBjOiAxLFxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcbiAgICAgIGtleToga2V5XG4gICAgfSk7XG4gIH0pO1xuICB2YXIgbGFiZWxYID0gJ1gnO1xuICB2YXIgbGFiZWxZID0gJ1knO1xuXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcbiAgICAuYXBwZW5kKCdzdmcnKVxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydCcpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xuXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueDtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC55O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSldKVxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAyMF0pO1xuXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xuXG5cbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xuXG5cbiAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgLmNhbGwoeUF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgLnRleHQobGFiZWxZKTtcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoeEF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFgpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAuZGF0YShkYXRhKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIG9wYWNpdHkoZC5zaXplKTtcbiAgICB9KVxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XG4gICAgfSlcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gXCIjMWY3N2I0XCI7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcbiAgICAgIGZhZGUoZC5jLCAuMSk7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGVPdXQoKTtcbiAgICB9KVxuICAgIC50cmFuc2l0aW9uKClcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XG4gICAgfSlcbiAgICAuZHVyYXRpb24oNTAwKVxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGQueCk7XG4gICAgfSlcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLnkpO1xuICAgIH0pO1xuXG5cbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5jICE9IGM7XG4gICAgICB9KVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgICB9KTtcbiAgfVxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHZhciB0ZW1wID17fTtcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcbiAgICB9XG4gIH1cbiAgXG5cbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG5cbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNTtcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXG4gICAgbWFyZ2luID0ge1xuICAgICAgdG9wOiAyMCxcbiAgICAgIHJpZ2h0OiAyMCxcbiAgICAgIGJvdHRvbTogMzAsXG4gICAgICBsZWZ0OiA1MFxuICAgIH0sXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbFwiXTtcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICB9KTtcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC5TdGF0ZTtcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxuXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC50b3RhbDtcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXG5cbiAgei5kb21haW4oa2V5cyk7XG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB6KGQua2V5KTtcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXG4gICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSlcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcblxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpIC8vIE5ldyBsaW5lXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxuICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7XG4gICAgfSk7XG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMTkpLmF0dHIoXCJ3aWR0aFwiLCAxOSkuYXR0cihcImhlaWdodFwiLCAxOSkuYXR0cihcImZpbGxcIiwgeik7XG4gIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjQpLmF0dHIoXCJ5XCIsIDkuNSkuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZDtcbiAgfSk7XG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcbiAgICB3aW5kb3cudG9waWNWZWN0b3JzID0ge307XG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICAgICAgdmFyIHZlY3RvciA9IFtdO1xuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZG9jdW1lbnRcIjogIGRvY0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlzRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZpc0RhdGE7XG59XG5cblxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xuICAgIGVsOiAnI3Z1ZS1hcHAnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDMsXG4gICAgICAgIHBsYXllckRldGFpbDoge1xuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDFcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcbiAgICAgICAgbG9hZEQzKCk7XG4gICAgICAgIGxvYWRKcXVlcnkoKTtcbiAgICB9XG59KTsiXX0=
