"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Array.prototype.contains = function (v) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === v) return true;
  }

  return false;
};

Array.prototype.unique = function () {
  var arr = [];

  for (var i = 0; i < this.length; i++) {
    if (!arr.includes(this[i])) {
      arr.push(this[i]);
    }
  }

  return arr;
};

function renderClusterForceLayout(data) {
  var dataVal = data["topic_word"];
  var final_dict = {};

  for (var key in dataVal) {
    if (dataVal.hasOwnProperty(key)) {
      var childrenWords = dataVal[key];

      for (var childKey in childrenWords) {
        if (childrenWords.hasOwnProperty(childKey)) {
          if (!(childKey in final_dict)) {
            final_dict[childKey] = [];
          }

          final_dict[childKey].push(key);
        }
      }
    }
  }

  var cluster_data = {
    "name": "",
    "children": []
  };
  var count = 0;

  for (var key in final_dict) {
    if (final_dict.hasOwnProperty(key)) {
      count = count + 1;
      var hash = {};
      hash["order"] = count;
      hash["alias"] = "White/red/jack pine";
      hash["color"] = "#C7EAFB";
      hash["name"] = key;
      var array_child = final_dict[key].unique();
      var childs = [];

      for (var i = 0; i < array_child.length; i++) {
        var child_hash = {};
        child_hash["order"] = i + 1;
        child_hash["color"] = "#C7EAFB";
        child_hash["name"] = array_child[i];
        childs.push(child_hash);
      }

      hash["children"] = childs;
      cluster_data.children.push(hash);
    }
  }

  var d3 = window.d3V3;
  renderCluster(cluster_data, d3);
}

function renderCluster(cluster_data, d3) {
  var radius = 400;
  var dendogramContainer = "speciescollapsible";
  var dendogramDataSource = "forestSpecies.json";
  var rootNodeSize = 20;
  var levelOneNodeSize = 12;
  var levelTwoNodeSize = 10;
  var levelThreeNodeSize = 7;
  var i = 0;
  var duration = 300; //Changing value doesn't seem any changes in the duration ??

  var rootJsonData;
  var cluster = d3.layout.cluster().size([360, radius - 120]).separation(function (a, b) {
    return (a.parent == b.parent ? 1 : 2) / a.depth;
  });
  var diagonal = d3.svg.diagonal.radial().projection(function (d) {
    return [d.y, d.x / 180 * Math.PI];
  });
  var containerDiv = d3.select(document.getElementById(dendogramContainer));
  containerDiv.append("button").attr("id", "collapse-button").text("Collapse!").on("click", collapseLevels);
  var svgRoot = containerDiv.append("svg:svg").attr("width", "100%").attr("height", "100%").attr("viewBox", "-" + radius + " -" + (radius - 50) + " " + radius * 2 + " " + radius * 2).call(d3.behavior.zoom().scale(0.9).scaleExtent([0.1, 3]).on("zoom", zoom)).on("dblclick.zoom", null).append("svg:g"); // Add the clipping path

  svgRoot.append("svg:clipPath").attr("id", "clipper-path").append("svg:rect").attr('id', 'clip-rect-anim');
  var animGroup = svgRoot.append("svg:g").attr("clip-path", "url(#clipper-path)");
  rootJsonData = cluster_data; //Start with all children collapsed

  rootJsonData.children.forEach(collapse); //Initialize the dendrogram

  createCollapsibleDendroGram(rootJsonData);

  function createCollapsibleDendroGram(source) {
    // Compute the new tree layout.
    var nodes = cluster.nodes(rootJsonData);
    var pathlinks = cluster.links(nodes); // Normalize for nodes' fixed-depth.

    nodes.forEach(function (d) {
      if (d.depth <= 2) {
        d.y = d.depth * 70;
      } else {
        d.y = d.depth * 100;
      }
    }); // Update the nodes…

    var node = svgRoot.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    }); // Enter any new nodes at the parent's previous position.

    var nodeEnter = node.enter().append("g").attr("class", "node").on("click", toggleChildren);
    nodeEnter.append("circle");
    nodeEnter.append("text").attr("x", 10).attr("dy", ".35em").attr("text-anchor", "start").text(function (d) {
      if (d.depth === 2) {
        return d.alias;
      }

      return d.name;
    }); // Transition nodes to their new position.

    var nodeUpdate = node.transition().duration(duration).attr("transform", function (d) {
      return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
    });
    nodeUpdate.select("circle").attr("r", function (d) {
      if (d.depth == 0) {
        return rootNodeSize;
      } else if (d.depth === 1) {
        return levelOneNodeSize;
      } else if (d.depth === 2) {
        return levelTwoNodeSize;
      }

      return levelThreeNodeSize;
    }).style("fill", function (d) {
      if (d.depth === 0) {
        return "#808080";
      } else if (d.depth === 1) {
        if (d.name == "Hardwoods") return "#816854";
        return "#C3B9A0";
      } else {
        return d.color;
      }
    }).style("stroke", function (d) {
      if (d.depth > 1) {
        return "white";
      } else {
        return "lightgray";
      }
    });
    nodeUpdate.select("text").attr('id', function (d) {
      var order = 0;
      if (d.order) order = d.order;
      return 'T-' + d.depth + "-" + order;
    }).attr("text-anchor", function (d) {
      if (d.depth === 1) {
        return d.x < 180 ? "end" : "start";
      }

      return d.x < 180 ? "start" : "end";
    }).attr("dy", function (d) {
      if (d.depth === 1) {
        return d.x < 180 ? "1.4em" : "-0.2em";
      }

      return ".31em";
    }).attr("dx", function (d) {
      if (d.depth === 1) {
        return 0; //return d.x > 180 ? 2 : -2;
      }

      return d.x < 180 ? 1 : -20;
    }).attr("transform", function (d) {
      if (d.depth < 2) {
        return "rotate(" + (90 - d.x) + ")";
      } else {
        return d.x < 180 ? null : "rotate(180)";
      }
    }); // TODO: appropriate transform

    var nodeExit = node.exit().transition().duration(duration).remove(); // Update the links…

    var link = svgRoot.selectAll("path.link").data(pathlinks, function (d) {
      return d.target.id;
    }); // Enter any new links at the parent's previous position.

    link.enter().insert("path", "g").attr("class", "link").attr("d", function (d) {
      var o = {
        x: source.x0,
        y: source.y0
      };
      return diagonal({
        source: o,
        target: o
      });
    }).style("fill", function (d) {
      return d.color;
    }); // Transition links to their new position.

    link.transition().duration(duration).attr("d", diagonal); // Transition exiting nodes to the parent's new position.

    link.exit().transition().duration(duration).attr("d", function (d) {
      var o = {
        x: source.x,
        y: source.y
      };
      return diagonal({
        source: o,
        target: o
      });
    }).remove();
  } // Toggle children on click.


  function toggleChildren(d, clickType) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }

    var type = _typeof(clickType) == undefined ? "node" : clickType; //Activities on node click

    createCollapsibleDendroGram(d);
    highlightNodeSelections(d);
    highlightRootToNodePath(d, type);
  } // Collapse nodes


  function collapse(d) {
    if (d.children) {
      d._children = d.children;

      d._children.forEach(collapse);

      d.children = null;
    }
  } // highlights subnodes of a node


  function highlightNodeSelections(d) {
    var highlightLinkColor = "darkslategray"; //"#f03b20";

    var defaultLinkColor = "lightgray";
    var depth = d.depth;
    var nodeColor = d.color;

    if (depth === 1) {
      nodeColor = highlightLinkColor;
    }

    var pathLinks = svgRoot.selectAll("path.link");
    pathLinks.style("stroke", function (dd) {
      if (dd.source.depth === 0) {
        if (d.name === '') {
          return highlightLinkColor;
        }

        return defaultLinkColor;
      }

      if (dd.source.name === d.name) {
        return nodeColor;
      } else {
        return defaultLinkColor;
      }
    });
  } //Walking parents' chain for root to node tracking


  function highlightRootToNodePath(d, clickType) {
    var ancestors = [];
    var parent = d;

    while (!_.isUndefined(parent)) {
      ancestors.push(parent);
      parent = parent.parent;
    } // Get the matched links


    var matchedLinks = [];
    svgRoot.selectAll('path.link').filter(function (d, i) {
      return _.any(ancestors, function (p) {
        return p === d.target;
      });
    }).each(function (d) {
      matchedLinks.push(d);
    });
    animateChains(matchedLinks, clickType);

    function animateChains(links, clickType) {
      animGroup.selectAll("path.selected").data([]).exit().remove();
      animGroup.selectAll("path.selected").data(links).enter().append("svg:path").attr("class", "selected").attr("d", diagonal); //Reset path highlight if collapse button clicked

      if (clickType == 'button') {
        animGroup.selectAll("path.selected").classed('reset-selected', true);
      }

      var overlayBox = svgRoot.node().getBBox();
      svgRoot.select("#clip-rect-anim").attr("x", -radius).attr("y", -radius).attr("width", 0).attr("height", radius * 2).transition().duration(duration).attr("width", radius * 2);
    }
  }

  function zoom() {
    svgRoot.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  function collapseLevels() {
    if (checkForThirdLevelOpenChildren()) {
      toggleAllSecondLevelChildren();
    } else {
      toggleSecondLevelChildren();
    } // Open first level only by collapsing second level


    function toggleSecondLevelChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          toggleChildren(rootJsonData.children[rootIndex], 'button');
        }
      }
    } // Open first level only by collapsing second level


    function toggleAllSecondLevelChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          for (var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex < childLength; childIndex++) {
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];

            if (isNodeOpen(secondLevelChild)) {
              toggleChildren(rootJsonData.children[rootIndex].children[childIndex], 'button');
            }
          }
        }
      }
    } // Check if any nodes opens at second level


    function checkForThirdLevelOpenChildren() {
      for (var rootIndex = 0, rootLength = rootJsonData.children.length; rootIndex < rootLength; rootIndex++) {
        if (isNodeOpen(rootJsonData.children[rootIndex])) {
          for (var childIndex = 0, childLength = rootJsonData.children[rootIndex].children.length; childIndex < childLength; childIndex++) {
            var secondLevelChild = rootJsonData.children[rootIndex].children[childIndex];

            if (isNodeOpen(secondLevelChild)) {
              return true;
            }
          }
        }
      }
    }

    function isNodeOpen(d) {
      if (d.children) {
        return true;
      }

      return false;
    }
  }
}
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
  d3.select(".chart12").remove();
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
  var svg = d3.select('#cluster').append('svg').attr('class', 'chart12').attr('id', 'cluster_id').attr("width", width + margin + margin).attr("height", height + margin + margin).append("g").attr("transform", "translate(" + margin + "," + margin + ")");
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
    selectedPage: 2,
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
        initPage2(window.global_data);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImdldEFuYWx5c2lzIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJnZXREb2NzIiwibWV0aG9kIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJnbG9iYWxfZGF0YSIsImluaXRQYWdlMSIsImluaXRQYWdlMiIsImluaXRQYWdlMyIsImxvYWRWaXN1YWxpemF0aW9ucyIsInJlbmRlckNsdXN0ZXJBbmFseXNpcyIsImh0bWwiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkb25lIiwicmVzcG9uc2UiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJKU09OIiwic3RyaW5naWZ5IiwiY29udGVudFR5cGUiLCJkYXRhVHlwZSIsInBhcnNlIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwidnVlQXBwIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwic2VsZWN0ZWRNYXAiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsIm1vdW50ZWQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQUEsS0FBSyxDQUFDQyxTQUFOLENBQWdCQyxRQUFoQixHQUEyQixVQUFTQyxDQUFULEVBQVk7QUFDbkMsT0FBSSxJQUFJQyxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxLQUFLQSxDQUFMLE1BQVlELENBQWYsRUFBa0IsT0FBTyxJQUFQO0FBQ3JCOztBQUNELFNBQU8sS0FBUDtBQUNILENBTEQ7O0FBT0FILEtBQUssQ0FBQ0MsU0FBTixDQUFnQkssTUFBaEIsR0FBeUIsWUFBVztBQUNoQyxNQUFJQyxHQUFHLEdBQUcsRUFBVjs7QUFDQSxPQUFJLElBQUlILENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLQyxNQUF4QixFQUFnQ0QsQ0FBQyxFQUFqQyxFQUFxQztBQUNqQyxRQUFHLENBQUNHLEdBQUcsQ0FBQ0MsUUFBSixDQUFhLEtBQUtKLENBQUwsQ0FBYixDQUFKLEVBQTJCO0FBQ3ZCRyxNQUFBQSxHQUFHLENBQUNFLElBQUosQ0FBUyxLQUFLTCxDQUFMLENBQVQ7QUFDSDtBQUNKOztBQUNELFNBQU9HLEdBQVA7QUFDSCxDQVJEOztBQVVBLFNBQVNHLHdCQUFULENBQWtDQyxJQUFsQyxFQUF1QztBQUN0QyxNQUFJQyxPQUFPLEdBQUdELElBQUksQ0FBQyxZQUFELENBQWxCO0FBQ0EsTUFBSUUsVUFBVSxHQUFHLEVBQWpCOztBQUNBLE9BQUssSUFBSUMsR0FBVCxJQUFnQkYsT0FBaEIsRUFBeUI7QUFDckIsUUFBSUEsT0FBTyxDQUFDRyxjQUFSLENBQXVCRCxHQUF2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QUFBLElBQUksRUFBRTtBQURJLEtBSlo7QUFPRm9PLElBQUFBLGVBQWUsRUFBRSxFQVBmO0FBUUZDLElBQUFBLFdBQVcsRUFBRTtBQVJYLEdBRmM7QUFZcEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxVQUFVLEVBQUUsb0JBQVN4USxDQUFULEVBQVc7QUFDbkIsV0FBS21RLFlBQUwsR0FBb0JuUSxDQUFwQjs7QUFDQSxVQUFJQSxDQUFDLElBQUksQ0FBVCxFQUFXO0FBQ1B1RyxRQUFBQSxTQUFTLENBQUNqSSxNQUFNLENBQUNnSSxXQUFSLENBQVQ7QUFDSDs7QUFDRCxVQUFJdEcsQ0FBQyxJQUFJLENBQVQsRUFBVztBQUNQd0csUUFBQUEsU0FBUyxDQUFDbEksTUFBTSxDQUFDZ0ksV0FBUixDQUFUO0FBQ0g7O0FBQ0QsVUFBSXRHLENBQUMsSUFBSSxDQUFULEVBQVc7QUFDUHlHLFFBQUFBLFNBQVM7QUFDWjtBQUNKO0FBWkksR0FaVztBQTBCcEJnSyxFQUFBQSxPQUFPLEVBQUUsbUJBQVU7QUFDZnhDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLFNBQVo7QUFDQXhJLElBQUFBLE1BQU07QUFDTlIsSUFBQUEsVUFBVTtBQUNiO0FBOUJtQixDQUFSLENBQWhCIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuQXJyYXkucHJvdG90eXBlLnVuaXF1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZighYXJyLmluY2x1ZGVzKHRoaXNbaV0pKSB7XG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyOyBcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xuXHR2YXIgZmluYWxfZGljdCA9IHt9O1xuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkpIHtcblx0ICAgIFx0XHRcdGlmKCEoY2hpbGRLZXkgaW4gZmluYWxfZGljdCkpe1xuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xuXHQgICAgXHRcdFx0fVxuXHQgICAgXHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0ucHVzaChrZXkpO1xuXHQgICAgXHRcdH1cblx0ICAgIFx0fSBcblx0ICAgIH1cbiAgXHR9XG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcbiAgXHRcdFwibmFtZVwiOlwiXCIsXG4gIFx0XHRcImNoaWxkcmVuXCI6W11cbiAgXHR9XG5cbiAgXHR2YXIgY291bnQ9MDtcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcbiAgXHRcdGlmIChmaW5hbF9kaWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgXHRcdFx0Y291bnQgPSBjb3VudCArIDE7XG4gIFx0XHRcdHZhciBoYXNoID0ge307XG4gIFx0XHRcdGhhc2hbXCJvcmRlclwiXSA9IGNvdW50O1xuICBcdFx0XHRoYXNoW1wiYWxpYXNcIl0gPSBcIldoaXRlL3JlZC9qYWNrIHBpbmVcIjtcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XG4gIFx0XHRcdGhhc2hbXCJuYW1lXCJdID0ga2V5O1xuXG5cbiAgXHRcdFx0dmFyIGFycmF5X2NoaWxkID0gZmluYWxfZGljdFtrZXldLnVuaXF1ZSgpO1xuICBcdFx0XHR2YXIgY2hpbGRzID1bXTtcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcbiAgXHRcdFx0XHR2YXIgY2hpbGRfaGFzaCA9IHt9O1xuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJvcmRlclwiXSA9IGkrMTtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XG4gIFx0XHRcdFx0Y2hpbGRzLnB1c2goY2hpbGRfaGFzaCk7XG4gIFx0XHRcdH1cbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xuICBcdFx0XHRjbHVzdGVyX2RhdGEuY2hpbGRyZW4ucHVzaChoYXNoKTtcbiAgXHRcdH1cbiAgXHR9XG4gIFx0dmFyIGQzID0gICB3aW5kb3cuZDNWMztcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xuICB2YXIgcmFkaXVzID0gNDAwO1xuICB2YXIgZGVuZG9ncmFtQ29udGFpbmVyID0gXCJzcGVjaWVzY29sbGFwc2libGVcIjtcbiAgdmFyIGRlbmRvZ3JhbURhdGFTb3VyY2UgPSBcImZvcmVzdFNwZWNpZXMuanNvblwiO1xuXG4gIHZhciByb290Tm9kZVNpemUgPSAyMDtcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAxMjtcbiAgdmFyIGxldmVsVHdvTm9kZVNpemUgPSAxMDtcbiAgdmFyIGxldmVsVGhyZWVOb2RlU2l6ZSA9IDc7XG5cblxuICB2YXIgaSA9IDA7XG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XG5cbiAgdmFyIHJvb3RKc29uRGF0YTtcblxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbiAgICAgIC5zaXplKFszNjAscmFkaXVzIC0gMTIwXSlcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XG4gICAgICB9KTtcblxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcbiAgICAgIC5wcm9qZWN0aW9uKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFtkLnksIGQueCAvIDE4MCAqIE1hdGguUEldOyB9KTtcblxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xuXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxuICAgICAgLnRleHQoXCJDb2xsYXBzZSFcIilcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xuXG4gIHZhciBzdmdSb290ID0gY29udGFpbmVyRGl2LmFwcGVuZChcInN2ZzpzdmdcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgIC5hdHRyKFwidmlld0JveFwiLCBcIi1cIiArIChyYWRpdXMpICsgXCIgLVwiICsgKHJhZGl1cyAtIDUwKSArXCIgXCIrIHJhZGl1cyoyICtcIiBcIisgcmFkaXVzKjIpXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcblxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXG4gICAgICAuYXBwZW5kKFwic3ZnOnJlY3RcIilcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xuXG4gIHZhciBhbmltR3JvdXAgPSBzdmdSb290LmFwcGVuZChcInN2ZzpnXCIpXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcblxuICBcdHJvb3RKc29uRGF0YSA9IGNsdXN0ZXJfZGF0YTtcblxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXG4gICAgcm9vdEpzb25EYXRhLmNoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xuXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXG4gIFx0Y3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHJvb3RKc29uRGF0YSk7XG5cblxuXG5cbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcbiAgICB2YXIgcGF0aGxpbmtzID0gY2x1c3Rlci5saW5rcyhub2Rlcyk7XG5cbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcbiAgICAgIH1lbHNlXG4gICAgICB7XG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBub2Rlc+KAplxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcblxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XG5cbiAgICBub2RlRW50ZXIuYXBwZW5kKFwiY2lyY2xlXCIpO1xuXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XG4gICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcbiAgICB9KTtcblxuXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXG4gICAgdmFyIG5vZGVVcGRhdGUgPSBub2RlLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxuXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFRocmVlTm9kZVNpemU7XG5cbiAgICAgICAgfSlcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcbiAgICAgICAgICAgICAgIH1lbHNlIGlmKGQuZGVwdGggPT09IDEpe1xuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcbiAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIndoaXRlXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcImxpZ2h0Z3JheVwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXG5cbiAgICAgICAgLmF0dHIoJ2lkJywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcbiAgICAgICAgICByZXR1cm4gJ1QtJyArIGQuZGVwdGggKyBcIi1cIiArIG9yZGVyO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IFwic3RhcnRcIiA6IFwiZW5kXCI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiLjMxZW1cIjtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IDEgOiAtMjA7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IG51bGwgOiBcInJvdGF0ZSgxODApXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcbiAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBsaW5rc+KAplxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XG5cbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XG4gICAgICAgICAgcmV0dXJuIGRpYWdvbmFsKHtzb3VyY2U6IG8sIHRhcmdldDogb30pO1xuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XG4gICAgICAgICAgcmV0dXJuIGQuY29sb3I7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBsaW5rcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXG4gICAgbGluay50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxuICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXG4gICAgbGluay5leGl0KCkudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueCwgeTogc291cmNlLnl9O1xuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlbW92ZSgpO1xuICB9XG5cbiAgLy8gVG9nZ2xlIGNoaWxkcmVuIG9uIGNsaWNrLlxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xuICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICBkLl9jaGlsZHJlbiA9IGQuY2hpbGRyZW47XG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgZC5jaGlsZHJlbiA9IGQuX2NoaWxkcmVuO1xuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xuICAgIH1cblxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcblxuICAgIC8vQWN0aXZpdGllcyBvbiBub2RlIGNsaWNrXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xuXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcblxuICB9XG5cbiAgLy8gQ29sbGFwc2Ugbm9kZXNcbiAgZnVuY3Rpb24gY29sbGFwc2UoZCkge1xuICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcbiAgICAgICAgZC5fY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xuICAgICAgfVxuICB9XG5cblxuICAvLyBoaWdobGlnaHRzIHN1Ym5vZGVzIG9mIGEgbm9kZVxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcbiAgICAgIHZhciBkZWZhdWx0TGlua0NvbG9yID0gXCJsaWdodGdyYXlcIjtcblxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XG4gICAgICB2YXIgbm9kZUNvbG9yID0gZC5jb2xvcjtcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcbiAgICAgIH1cblxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xuXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKGQubmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5uYW1lID09PSBkLm5hbWUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcbiAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCxjbGlja1R5cGUpe1xuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcbiAgICB2YXIgcGFyZW50ID0gZDtcbiAgICB3aGlsZSAoIV8uaXNVbmRlZmluZWQocGFyZW50KSkge1xuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xuICAgIHZhciBtYXRjaGVkTGlua3MgPSBbXTtcblxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSlcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcbiAgICAgICAge1xuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XG4gICAgICAgIH0pO1xuXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcblxuICAgIGZ1bmN0aW9uIGFuaW1hdGVDaGFpbnMobGlua3MsY2xpY2tUeXBlKXtcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXG4gICAgICAgICAgLmRhdGEoW10pXG4gICAgICAgICAgLmV4aXQoKS5yZW1vdmUoKTtcblxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcbiAgICAgICAgICAuZGF0YShsaW5rcylcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxuICAgICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblxuICAgICAgLy9SZXNldCBwYXRoIGhpZ2hsaWdodCBpZiBjb2xsYXBzZSBidXR0b24gY2xpY2tlZFxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcblxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcbiAgICAgICAgICAuYXR0cihcInlcIiwgLXJhZGl1cylcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxuICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiB6b29tKCkge1xuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcblxuICAgIGlmKGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpKXtcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcbiAgICB9ZWxzZXtcbiAgICAgdG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbigpO1xuICAgIH1cblxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XG4gICAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XG5cbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXG4gICAgZnVuY3Rpb24gY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCl7XG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XG5cbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcblxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc05vZGVPcGVuKGQpe1xuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG5cblxuXG59XG5cbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwicmVxdWlyZS5jb25maWcoe1xuICAgIHBhdGhzOiB7XG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIGxvYWREMygpe1xuXG4gICAgd2luZG93LmQzT2xkID0gZDM7XG4gICAgcmVxdWlyZShbJ2QzJ10sIGZ1bmN0aW9uKGQzVjMpIHtcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcbiAgICAgICAgZ2V0QW5hbHlzaXMoXCJhc2Zhc1wiLCBcImFzc2FkXCIpO1xuICAgICAgICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbiAgICAgICAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKCk7XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0KSB7XG4gIHJldHVybiBbXG4gICAgW1widzFcIiwgXCJ3MlwiLCBcInczXCIsIFwidzRcIiwgXCJ3NVwiLCBcInc2XCJdLFxuICAgIFtcInczXCIsIFwiYXNkc1wiLCBcImFzZGFzZFwiLCBcInNhZGFzZHNhXCIsIFwiYXNkYXNkc2FcIiwgXCJhc2Rhc2RzYWRcIl1cbiAgXTtcbn1cblxuZnVuY3Rpb24gZ2V0QW5hbHlzaXModGV4dCwgbWV0aG9kKSB7XG4gIGxldCBkb2NzID0gZ2V0RG9jcyh0ZXh0KTtcbiAgbGV0IGZuYyA9IHggPT4geDtcbiAgaWYgKG1ldGhvZCA9PSBcIkxEQVwiKSB7XG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XG4gIH0gZWxzZSB7XG4gICAgZm5jID0gZ2V0V29yZDJWZWNDbHVzdGVycztcbiAgfVxuICBmbmMoZG9jcywgcmVzcCA9PiB7XG4gICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcbiAgICBpbml0UGFnZTEocmVzcCk7XG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xuICAgIGluaXRQYWdlMyhyZXNwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcbn1cblxuZnVuY3Rpb24gaW5pdFBhZ2UxKHJlc3ApIHtcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xufVxuXG5cblxuZnVuY3Rpb24gaW5pdFBhZ2UyKHJlc3ApIHtcbiAgcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KHJlc3ApO1xuXG59XG5cbmZ1bmN0aW9uIGluaXRQYWdlMygpe1xuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKCk7XG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiB2ZWN0b3JzXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcblxuICAgIGdldFdvcmQyVmVjQ2x1c3RlcnMoW1xuXHRcdFx0W1wiZm9vZFwiLCBcImFwcGxlXCIsIFwiYmFuYW5hXCIsICBcImJpc2N1aXRcIiwgIFwiY2hpY2tlblwiXSxcblx0XHRcdFtcImNyaWNrZXRcIiwgXCJmb290YmFsbFwiLCBcImJhc2ViYWxsXCIsICBcInRlbm5pc1wiXVxuXHRcdF1cbiAgICAsIGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgbGV0IGRhdGEgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwLCAwLCAwKTtcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xuICAgICAgICAgICAgY2hhcnQ6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeUF4aXM6IFt7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cbn1cblxuXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCl7XG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XG5cbiAgICB2YXIgeCA9IGQzVjMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxuICAgICAgICB5ID0ge30sXG4gICAgICAgIGRyYWdnaW5nID0ge307XG5cbiAgICB2YXIgbGluZSA9IGQzVjMuc3ZnLmxpbmUoKSxcbiAgICAgICAgYmFja2dyb3VuZCxcbiAgICAgICAgZm9yZWdyb3VuZDtcblxuICAgIHZhciBzdmcgPSBkM1YzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xuXG5cbiAgICBnZXRXb3JkMlZlY0NsdXN0ZXJzKFtcblx0XHRcdFtcImZvb2RcIiwgXCJhcHBsZVwiLCBcImJhbmFuYVwiLCAgXCJiaXNjdWl0XCIsICBcImNoaWNrZW5cIl0sXG5cdFx0XHRbXCJjcmlja2V0XCIsIFwiZm9vdGJhbGxcIiwgXCJiYXNlYmFsbFwiLCAgXCJ0ZW5uaXNcIl1cblx0XHRdXG4gICAgLCBmdW5jdGlvbihyZXNwKSB7XG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNUID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcblxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMgPSBkM1YzLmtleXMoY2Fyc1swXSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcbiAgICAgICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSkpO1xuICAgIH0pKTtcblxuICAgIC8vIEFkZCBncmV5IGJhY2tncm91bmQgbGluZXMgZm9yIGNvbnRleHQuXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXG4gICAgZm9yZWdyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCI7IH0pXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgbGV0IGF4aXMgPSBudWxsO1xuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZihkID09IFwidG9waWNcIil7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxuICAgICAgICAgICAgICAgIGF4aXMuc2NhbGUoeVtkXSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJicnVzaFwiKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDE2KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4gW3Bvc2l0aW9uKHApLCB5W3BdKGRbcF0pXTsgfSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XG4gICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XG4gICAgfSk7XG4gICAgfVxuXG59IiwiZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcbiAgZDMuc2VsZWN0KFwiLmNoYXJ0MTJcIikucmVtb3ZlKCk7XG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcbiAgdmFyIHRvcGljX3ZlY3RvcnMgPSByZXNwW1widG9waWNfdmVjdG9yc1wiXTtcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsdXN0ZXInKVxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICB3aWR0aCA9IGJiLnJpZ2h0IC0gYmIubGVmdDtcbiAgdmFyIGhlaWdodCA9IDQwMDtcbiAgdmFyIG1hcmdpbiA9IDQwO1xuICB2YXIgZGF0YSA9IFtdO1xuXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIHZhbHVlID0gdG9waWNfdmVjdG9yc1trZXldO1xuICAgIGRhdGEucHVzaCh7XG4gICAgICB4OiB2YWx1ZVswXSxcbiAgICAgIHk6IHZhbHVlWzFdLFxuICAgICAgYzogMSxcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXG4gICAgICBrZXk6IGtleVxuICAgIH0pO1xuICB9KTtcbiAgdmFyIGxhYmVsWCA9ICdYJztcbiAgdmFyIGxhYmVsWSA9ICdZJztcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjY2x1c3RlcicpXG4gICAgLmFwcGVuZCgnc3ZnJylcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXG4gICAgLmF0dHIoJ2lkJywnY2x1c3Rlcl9pZCcpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xuXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueDtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC55O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSldKVxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAyMF0pO1xuXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xuXG5cbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xuXG5cbiAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgLmNhbGwoeUF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgLnRleHQobGFiZWxZKTtcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoeEF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFgpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAuZGF0YShkYXRhKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIG9wYWNpdHkoZC5zaXplKTtcbiAgICB9KVxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XG4gICAgfSlcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gXCIjMWY3N2I0XCI7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcbiAgICAgIGZhZGUoZC5jLCAuMSk7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGVPdXQoKTtcbiAgICB9KVxuICAgIC50cmFuc2l0aW9uKClcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XG4gICAgfSlcbiAgICAuZHVyYXRpb24oNTAwKVxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGQueCk7XG4gICAgfSlcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLnkpO1xuICAgIH0pO1xuXG5cbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5jICE9IGM7XG4gICAgICB9KVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgICB9KTtcbiAgfVxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHZhciB0ZW1wID17fTtcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcbiAgICB9XG4gIH1cbiAgXG5cbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG5cbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNTtcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXG4gICAgbWFyZ2luID0ge1xuICAgICAgdG9wOiAyMCxcbiAgICAgIHJpZ2h0OiAyMCxcbiAgICAgIGJvdHRvbTogMzAsXG4gICAgICBsZWZ0OiA1MFxuICAgIH0sXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbFwiXTtcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICB9KTtcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC5TdGF0ZTtcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxuXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC50b3RhbDtcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXG5cbiAgei5kb21haW4oa2V5cyk7XG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB6KGQua2V5KTtcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXG4gICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSlcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcblxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpIC8vIE5ldyBsaW5lXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxuICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7XG4gICAgfSk7XG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMTkpLmF0dHIoXCJ3aWR0aFwiLCAxOSkuYXR0cihcImhlaWdodFwiLCAxOSkuYXR0cihcImZpbGxcIiwgeik7XG4gIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjQpLmF0dHIoXCJ5XCIsIDkuNSkuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZDtcbiAgfSk7XG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcbiAgICB3aW5kb3cudG9waWNWZWN0b3JzID0ge307XG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICAgICAgdmFyIHZlY3RvciA9IFtdO1xuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZG9jdW1lbnRcIjogIGRvY0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlzRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZpc0RhdGE7XG59XG5cblxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xuICAgIGVsOiAnI3Z1ZS1hcHAnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDIsXG4gICAgICAgIHBsYXllckRldGFpbDoge1xuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDFcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMih3aW5kb3cuZ2xvYmFsX2RhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcbiAgICAgICAgbG9hZEQzKCk7XG4gICAgICAgIGxvYWRKcXVlcnkoKTtcbiAgICB9XG59KTsiXX0=
