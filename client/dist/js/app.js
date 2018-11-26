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
        if (childrenWords.hasOwnProperty(childKey) && childrenWords[childKey] > 0.1) {
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
        child_hash["alias"] = i + 1 + "";
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
  var radius = 200;
  var dendogramContainer = "speciescollapsible";
  var dendogramDataSource = "forestSpecies.json";
  var rootNodeSize = 6;
  var levelOneNodeSize = 3;
  var levelTwoNodeSize = 3;
  var levelThreeNodeSize = 2;
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
    url: "/api/getLDAData",
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
  getWord2VecClusters(window.documents, function (resp) {
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
  getWord2VecClusters(window.documents, function (resp) {
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

      if (x == 4) {
        initPage4();
      }
    }
  },
  mounted: function mounted() {
    console.log("Mounted");
    loadD3();
    loadJquery();
  }
});
"use strict";

function loadWordCloud(resp) {
  var data = [];

  for (var word in resp["overall_word"]) {
    var weight = resp["overall_word"][word];
    data.push({
      name: word,
      weight: weight
    });
  }

  createWordCloud("overall-wc", data, "All Documents");

  for (var topic in resp["topic_word"]) {
    var _data = [];

    for (var word in resp["topic_word"][topic]) {
      var _weight = resp["topic_word"][topic][word];

      _data.push({
        name: word,
        weight: _weight
      });
    }

    $("#topic-wcs").append('<div class="col-sm-6"><div style="outline: solid 1px;" id="topic' + topic + '" style="height: 300px;"></div></div>');
    createWordCloud("topic" + topic, _data, "Topic " + topic);
  }
}

function createWordCloud(id, data, title) {
  Highcharts.chart(id, {
    series: [{
      type: 'wordcloud',
      data: data,
      rotation: {
        from: 0,
        to: 0,
        orientations: 5
      },
      name: 'Score'
    }],
    title: {
      text: title
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImdldEFuYWx5c2lzIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJnZXREb2NzIiwibWV0aG9kIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsInJlc3AiLCJnbG9iYWxfZGF0YSIsImluaXRQYWdlMSIsImluaXRQYWdlMiIsImluaXRQYWdlMyIsImxvYWRWaXN1YWxpemF0aW9ucyIsInJlbmRlckNsdXN0ZXJBbmFseXNpcyIsImh0bWwiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkb25lIiwicmVzcG9uc2UiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJKU09OIiwic3RyaW5naWZ5IiwiY29udGVudFR5cGUiLCJkYXRhVHlwZSIsInBhcnNlIiwiZG9jdW1lbnRzIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsImxlZ2VuZCIsInNsaWNlIiwicmV2ZXJzZSIsImdlbmVyYXRlVG9waWNWZWN0b3JzIiwidG9waWNWZWN0b3JzIiwidG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyIsInZlY3RvciIsInRvcGljX3RocmVzaG9sZCIsIndvcmRfdGhyZXNob2xkIiwidmlzRGF0YSIsImRvY0tleSIsInRvcGljIiwidG9waWNTY29yZSIsIndvcmQiLCJ3b3JkU2NvcmUiLCJpbmRleE9mIiwidnVlQXBwIiwiVnVlIiwiZWwiLCJtZXNzYWdlIiwibm9uZVNlbGVjdGVkIiwic2VsZWN0ZWRQYWdlIiwicGxheWVyRGV0YWlsIiwib3ZlcnZpZXdGaWx0ZXJzIiwic2VsZWN0ZWRNYXAiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsImluaXRQYWdlNCIsIm1vdW50ZWQiLCJsb2FkV29yZENsb3VkIiwid2VpZ2h0IiwiY3JlYXRlV29yZENsb3VkIiwicm90YXRpb24iLCJmcm9tIiwidG8iLCJvcmllbnRhdGlvbnMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQUEsS0FBSyxDQUFDQyxTQUFOLENBQWdCQyxRQUFoQixHQUEyQixVQUFTQyxDQUFULEVBQVk7QUFDbkMsT0FBSSxJQUFJQyxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxLQUFLQSxDQUFMLE1BQVlELENBQWYsRUFBa0IsT0FBTyxJQUFQO0FBQ3JCOztBQUNELFNBQU8sS0FBUDtBQUNILENBTEQ7O0FBT0FILEtBQUssQ0FBQ0MsU0FBTixDQUFnQkssTUFBaEIsR0FBeUIsWUFBVztBQUNoQyxNQUFJQyxHQUFHLEdBQUcsRUFBVjs7QUFDQSxPQUFJLElBQUlILENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLQyxNQUF4QixFQUFnQ0QsQ0FBQyxFQUFqQyxFQUFxQztBQUNqQyxRQUFHLENBQUNHLEdBQUcsQ0FBQ0MsUUFBSixDQUFhLEtBQUtKLENBQUwsQ0FBYixDQUFKLEVBQTJCO0FBQ3ZCRyxNQUFBQSxHQUFHLENBQUNFLElBQUosQ0FBUyxLQUFLTCxDQUFMLENBQVQ7QUFDSDtBQUNKOztBQUNELFNBQU9HLEdBQVA7QUFDSCxDQVJEOztBQVVBLFNBQVNHLHdCQUFULENBQWtDQyxJQUFsQyxFQUF1QztBQUN0QyxNQUFJQyxPQUFPLEdBQUdELElBQUksQ0FB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RCxLQUFELENBRFM7QUFXakJvRyxJQUFBQSxLQUFLLEVBQUU7QUFDSDVILE1BQUFBLElBQUksRUFBRTRIO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuQXJyYXkucHJvdG90eXBlLnVuaXF1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZighYXJyLmluY2x1ZGVzKHRoaXNbaV0pKSB7XG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyOyBcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xuXHR2YXIgZmluYWxfZGljdCA9IHt9O1xuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xuXG5cdCAgICBcdGZvcih2YXIgY2hpbGRLZXkgaW4gY2hpbGRyZW5Xb3Jkcyl7XG5cblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiAwLjEpIHtcblxuXHQgICAgXHRcdFx0aWYoIShjaGlsZEtleSBpbiBmaW5hbF9kaWN0KSl7XG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XG5cdCAgICBcdFx0XHR9XG4gICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XS5wdXNoKGtleSk7XG5cdCAgICBcdFx0XHRcblx0ICAgIFx0XHR9XG5cdCAgICBcdH0gXG5cdCAgICB9XG4gIFx0fVxuICBcdHZhciBjbHVzdGVyX2RhdGEgPSB7XG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxuICBcdFx0XCJjaGlsZHJlblwiOltdXG4gIFx0fVxuXG4gIFx0dmFyIGNvdW50PTA7XG4gIFx0Zm9yKHZhciBrZXkgaW4gZmluYWxfZGljdCl7XG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xuICBcdFx0XHR2YXIgaGFzaCA9IHt9O1xuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XG4gIFx0XHRcdGhhc2hbXCJjb2xvclwiXSA9IFwiI0M3RUFGQlwiO1xuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcblxuXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XG4gIFx0XHRcdGZvcih2YXIgaT0wOyBpIDwgYXJyYXlfY2hpbGQubGVuZ3RoO2krKyl7XG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImFsaWFzXCJdID0gaSsxICsgXCJcIjtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XG4gIFx0XHRcdFx0Y2hpbGRzLnB1c2goY2hpbGRfaGFzaCk7XG4gIFx0XHRcdH1cbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xuICBcdFx0XHRjbHVzdGVyX2RhdGEuY2hpbGRyZW4ucHVzaChoYXNoKTtcbiAgXHRcdH1cbiAgXHR9XG4gIFx0dmFyIGQzID0gICB3aW5kb3cuZDNWMztcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xuICB2YXIgcmFkaXVzID0gMjAwO1xuICB2YXIgZGVuZG9ncmFtQ29udGFpbmVyID0gXCJzcGVjaWVzY29sbGFwc2libGVcIjtcbiAgdmFyIGRlbmRvZ3JhbURhdGFTb3VyY2UgPSBcImZvcmVzdFNwZWNpZXMuanNvblwiO1xuXG4gIHZhciByb290Tm9kZVNpemUgPSA2O1xuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcbiAgdmFyIGxldmVsVGhyZWVOb2RlU2l6ZSA9IDI7XG5cblxuICB2YXIgaSA9IDA7XG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XG5cbiAgdmFyIHJvb3RKc29uRGF0YTtcblxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbiAgICAgIC5zaXplKFszNjAscmFkaXVzIC0gMTIwXSlcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XG4gICAgICB9KTtcblxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcbiAgICAgIC5wcm9qZWN0aW9uKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFtkLnksIGQueCAvIDE4MCAqIE1hdGguUEldOyB9KTtcblxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xuXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxuICAgICAgLnRleHQoXCJDb2xsYXBzZSFcIilcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xuXG4gIHZhciBzdmdSb290ID0gY29udGFpbmVyRGl2LmFwcGVuZChcInN2ZzpzdmdcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgIC5hdHRyKFwidmlld0JveFwiLCBcIi1cIiArIChyYWRpdXMpICsgXCIgLVwiICsgKHJhZGl1cyAtIDUwKSArXCIgXCIrIHJhZGl1cyoyICtcIiBcIisgcmFkaXVzKjIpXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcblxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXG4gICAgICAuYXBwZW5kKFwic3ZnOnJlY3RcIilcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xuXG4gIHZhciBhbmltR3JvdXAgPSBzdmdSb290LmFwcGVuZChcInN2ZzpnXCIpXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcblxuICBcdHJvb3RKc29uRGF0YSA9IGNsdXN0ZXJfZGF0YTtcblxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXG4gICAgcm9vdEpzb25EYXRhLmNoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xuXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXG4gIFx0Y3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHJvb3RKc29uRGF0YSk7XG5cblxuXG5cbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcbiAgICB2YXIgcGF0aGxpbmtzID0gY2x1c3Rlci5saW5rcyhub2Rlcyk7XG5cbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcbiAgICAgIH1lbHNlXG4gICAgICB7XG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBub2Rlc+KAplxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcblxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XG5cbiAgICBub2RlRW50ZXIuYXBwZW5kKFwiY2lyY2xlXCIpO1xuXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XG4gICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcbiAgICB9KTtcblxuXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXG4gICAgdmFyIG5vZGVVcGRhdGUgPSBub2RlLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxuXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFRocmVlTm9kZVNpemU7XG5cbiAgICAgICAgfSlcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcbiAgICAgICAgICAgICAgIH1lbHNlIGlmKGQuZGVwdGggPT09IDEpe1xuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcbiAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIndoaXRlXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcImxpZ2h0Z3JheVwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXG5cbiAgICAgICAgLmF0dHIoJ2lkJywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcbiAgICAgICAgICByZXR1cm4gJ1QtJyArIGQuZGVwdGggKyBcIi1cIiArIG9yZGVyO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IFwic3RhcnRcIiA6IFwiZW5kXCI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiLjMxZW1cIjtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IDEgOiAtMjA7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IG51bGwgOiBcInJvdGF0ZSgxODApXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcbiAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBsaW5rc+KAplxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XG5cbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XG4gICAgICAgICAgcmV0dXJuIGRpYWdvbmFsKHtzb3VyY2U6IG8sIHRhcmdldDogb30pO1xuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XG4gICAgICAgICAgcmV0dXJuIGQuY29sb3I7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBsaW5rcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXG4gICAgbGluay50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxuICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXG4gICAgbGluay5leGl0KCkudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueCwgeTogc291cmNlLnl9O1xuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlbW92ZSgpO1xuICB9XG5cbiAgLy8gVG9nZ2xlIGNoaWxkcmVuIG9uIGNsaWNrLlxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xuICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICBkLl9jaGlsZHJlbiA9IGQuY2hpbGRyZW47XG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgZC5jaGlsZHJlbiA9IGQuX2NoaWxkcmVuO1xuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xuICAgIH1cblxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcblxuICAgIC8vQWN0aXZpdGllcyBvbiBub2RlIGNsaWNrXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xuXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcblxuICB9XG5cbiAgLy8gQ29sbGFwc2Ugbm9kZXNcbiAgZnVuY3Rpb24gY29sbGFwc2UoZCkge1xuICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcbiAgICAgICAgZC5fY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xuICAgICAgfVxuICB9XG5cblxuICAvLyBoaWdobGlnaHRzIHN1Ym5vZGVzIG9mIGEgbm9kZVxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcbiAgICAgIHZhciBkZWZhdWx0TGlua0NvbG9yID0gXCJsaWdodGdyYXlcIjtcblxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XG4gICAgICB2YXIgbm9kZUNvbG9yID0gZC5jb2xvcjtcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcbiAgICAgIH1cblxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xuXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKGQubmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5uYW1lID09PSBkLm5hbWUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcbiAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCxjbGlja1R5cGUpe1xuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcbiAgICB2YXIgcGFyZW50ID0gZDtcbiAgICB3aGlsZSAoIV8uaXNVbmRlZmluZWQocGFyZW50KSkge1xuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xuICAgIHZhciBtYXRjaGVkTGlua3MgPSBbXTtcblxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSlcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcbiAgICAgICAge1xuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XG4gICAgICAgIH0pO1xuXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcblxuICAgIGZ1bmN0aW9uIGFuaW1hdGVDaGFpbnMobGlua3MsY2xpY2tUeXBlKXtcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXG4gICAgICAgICAgLmRhdGEoW10pXG4gICAgICAgICAgLmV4aXQoKS5yZW1vdmUoKTtcblxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcbiAgICAgICAgICAuZGF0YShsaW5rcylcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxuICAgICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblxuICAgICAgLy9SZXNldCBwYXRoIGhpZ2hsaWdodCBpZiBjb2xsYXBzZSBidXR0b24gY2xpY2tlZFxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcblxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcbiAgICAgICAgICAuYXR0cihcInlcIiwgLXJhZGl1cylcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxuICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiB6b29tKCkge1xuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcblxuICAgIGlmKGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpKXtcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcbiAgICB9ZWxzZXtcbiAgICAgdG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbigpO1xuICAgIH1cblxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XG4gICAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XG5cbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXG4gICAgZnVuY3Rpb24gY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCl7XG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XG5cbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcblxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc05vZGVPcGVuKGQpe1xuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG5cblxuXG59XG5cbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwicmVxdWlyZS5jb25maWcoe1xuICAgIHBhdGhzOiB7XG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIGxvYWREMygpe1xuXG4gICAgd2luZG93LmQzT2xkID0gZDM7XG4gICAgcmVxdWlyZShbJ2QzJ10sIGZ1bmN0aW9uKGQzVjMpIHtcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcbiAgICAgICAgZ2V0QW5hbHlzaXMoXCJhc2Zhc1wiLCBcImFzc2FkXCIpO1xuICAgICAgICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbiAgICAgICAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKCk7XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0KSB7XG4gIHJldHVybiBbXG4gICAgW1widzFcIiwgXCJ3MlwiLCBcInczXCIsIFwidzRcIiwgXCJ3NVwiLCBcInc2XCJdLFxuICAgIFtcInczXCIsIFwiYXNkc1wiLCBcImFzZGFzZFwiLCBcInNhZGFzZHNhXCIsIFwiYXNkYXNkc2FcIiwgXCJhc2Rhc2RzYWRcIl1cbiAgXTtcbn1cblxuZnVuY3Rpb24gZ2V0QW5hbHlzaXModGV4dCwgbWV0aG9kKSB7XG4gIGxldCBkb2NzID0gZ2V0RG9jcyh0ZXh0KTtcbiAgbGV0IGZuYyA9IHggPT4geDtcbiAgaWYgKG1ldGhvZCA9PSBcIkxEQVwiKSB7XG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XG4gIH0gZWxzZSB7XG4gICAgZm5jID0gZ2V0V29yZDJWZWNDbHVzdGVycztcbiAgfVxuICBmbmMoZG9jcywgcmVzcCA9PiB7XG4gICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcbiAgICBpbml0UGFnZTEocmVzcCk7XG4gICAgaW5pdFBhZ2UyKHJlc3ApO1xuICAgIGluaXRQYWdlMyhyZXNwKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcbn1cblxuZnVuY3Rpb24gaW5pdFBhZ2UxKHJlc3ApIHtcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xufVxuXG5cblxuZnVuY3Rpb24gaW5pdFBhZ2UyKHJlc3ApIHtcbiAgcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KHJlc3ApO1xuXG59XG5cbmZ1bmN0aW9uIGluaXRQYWdlMygpe1xuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKTtcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKCk7XG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiB2ZWN0b3JzXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0TERBRGF0YVwiLFxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jc30pLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xuICAgICAgfSk7XG4gICAgICAgXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XG4gICAgICB9KTtcbn1cblxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcblxuICAgIGdldFdvcmQyVmVjQ2x1c3RlcnMod2luZG93LmRvY3VtZW50c1xuICAgICwgZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICBsZXQgZGF0YSA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3AsIDAsIDApO1xuICAgICAgICBIaWdoY2hhcnRzLmNoYXJ0KCdwYy1jb250YWluZXInLCB7XG4gICAgICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGxpbmUnLFxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQ29vcmRpbmF0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxBeGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogMlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIHRleHQ6ICdEb2N1bWVudCAtIFRvcGljIC0gV29yZCBSZWxhdGlvbnNoaXAnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGxvdE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBzZXJpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFsbzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXAudG9Gcm9udCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIHRvb2x0aXA6IHtcbiAgICAgICAgICAgIC8vICAgICBwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3BvaW50LmNvbG9yfVwiPlxcdTI1Q0Y8L3NwYW4+JyArXG4gICAgICAgICAgICAvLyAgICAgICAgICd7c2VyaWVzLm5hbWV9OiA8Yj57cG9pbnQuZm9ybWF0dGVkVmFsdWV9PC9iPjxici8+J1xuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogW1xuICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQnLFxuICAgICAgICAgICAgICAgICAgICAnVG9waWMnLFxuICAgICAgICAgICAgICAgICAgICAnV29yZCdcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIG9mZnNldDogMTBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB5QXhpczogW3tcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uRG9jdW1lbnQgXCIreClcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiByZXNwW1widG9waWNzXCJdLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uVG9waWMgXCIreClcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3QudmFsdWVzKHJlc3BbXCJ3b3Jkc1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5cIit4KVxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBjb2xvcnM6IFsncmdiYSgxMSwgMjAwLCAyMDAsIDAuMSknXSxcbiAgICAgICAgICAgIHNlcmllczogZGF0YS5tYXAoZnVuY3Rpb24gKHNldCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBzZXQsXG4gICAgICAgICAgICAgICAgICAgIHNoYWRvdzogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cblxufVxuXG5cbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUoKXtcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMzAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9LFxuICAgICAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgICAgICBoZWlnaHQgPSA1MDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcblxuICAgIHZhciB4ID0gZDNWMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIHdpZHRoXSwgMSksXG4gICAgICAgIHkgPSB7fSxcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcblxuICAgIHZhciBsaW5lID0gZDNWMy5zdmcubGluZSgpLFxuICAgICAgICBiYWNrZ3JvdW5kLFxuICAgICAgICBmb3JlZ3JvdW5kO1xuXG4gICAgdmFyIHN2ZyA9IGQzVjMuc2VsZWN0KFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIiksIGRpbWVuc2lvbnM7XG5cblxuICAgIGdldFdvcmQyVmVjQ2x1c3RlcnMod2luZG93LmRvY3VtZW50c1xuICAgICwgZnVuY3Rpb24ocmVzcCkge1xuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXG4gICAgdmFyIGNhcnMgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcCwgMCwgMCk7XG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxuICAgIHZhciBheGlzRCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxuICAgICAgICBheGlzVCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMocmVzcFtcInRvcGljc1wiXS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XG5cbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDNWMy5rZXlzKGNhcnNbMF0pLmZpbHRlcihmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgLmRvbWFpbihkM1YzLmV4dGVudChjYXJzLCBmdW5jdGlvbihwKSB7IHJldHVybiArcFtkXTsgfSkpXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcbiAgICB9KSk7XG5cbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuZGF0YShjYXJzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcblxuICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAuZGF0YShjYXJzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcblxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxuICAgIHZhciBnID0gc3ZnLnNlbGVjdEFsbChcIi5kaW1lbnNpb25cIilcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZGltZW5zaW9uXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbihkKSB7IHJldHVybiB7eDogeChkKX07IH0pXG4gICAgICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xuICAgICAgICAgICAgYmFja2dyb3VuZC5hdHRyKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0gTWF0aC5taW4od2lkdGgsIE1hdGgubWF4KDAsIGQzVjMuZXZlbnQueCkpO1xuICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKFwiZFwiLCBwYXRoKTtcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcbiAgICAgICAgICAgIHguZG9tYWluKGRpbWVuc2lvbnMpO1xuICAgICAgICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcG9zaXRpb24oZCkgKyBcIilcIjsgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oXCJkcmFnZW5kXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBkcmFnZ2luZ1tkXTtcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihmb3JlZ3JvdW5kKS5hdHRyKFwiZFwiLCBwYXRoKTtcbiAgICAgICAgICAgIGJhY2tncm91bmRcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpc2liaWxpdHlcIiwgbnVsbCk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc0Q7XG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZDNWMy5zZWxlY3QodGhpcykuY2FsbChcbiAgICAgICAgICAgICAgICBheGlzLnNjYWxlKHlbZF0pXG4gICAgICAgICAgICApO1xuICAgICAgICB9KVxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAuYXR0cihcInlcIiwgLTkpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICB9KTtcblxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxuICAgIGcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnJ1c2hcIilcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZDNWMy5zZWxlY3QodGhpcykuY2FsbCh5W2RdLmJydXNoID0gZDNWMy5zdmcuYnJ1c2goKS55KHlbZF0pLm9uKFwiYnJ1c2hzdGFydFwiLCBicnVzaHN0YXJ0KS5vbihcImJydXNoXCIsIGJydXNoKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAtOClcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XG4gICAgdmFyIHYgPSBkcmFnZ2luZ1tkXTtcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxuICAgIGZ1bmN0aW9uIHBhdGgoZCkge1xuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxuICAgIGZ1bmN0aW9uIGJydXNoKCkge1xuICAgIHZhciBhY3RpdmVzID0gZGltZW5zaW9ucy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gIXlbcF0uYnJ1c2guZW1wdHkoKTsgfSksXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcbiAgICBmb3JlZ3JvdW5kLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XG4gICAgICAgIH0pID8gbnVsbCA6IFwibm9uZVwiO1xuICAgIH0pO1xuICAgIH1cblxufSIsImZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKSB7XG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xuICB2YXIgZG9jdW1lbnRfdG9waWMgPSByZXNwW1wiZG9jdW1lbnRfdG9waWNcIl1bMF07XG4gIHZhciB0b3BpY192ZWN0b3JzID0gcmVzcFtcInRvcGljX3ZlY3RvcnNcIl07XG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG4gIHZhciBoZWlnaHQgPSA0MDA7XG4gIHZhciBtYXJnaW4gPSA0MDtcbiAgdmFyIGRhdGEgPSBbXTtcblxuICBPYmplY3Qua2V5cyh0b3BpY192ZWN0b3JzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIHZhciB2YWx1ZSA9IHRvcGljX3ZlY3RvcnNba2V5XTtcbiAgICBkYXRhLnB1c2goe1xuICAgICAgeDogdmFsdWVbMF0sXG4gICAgICB5OiB2YWx1ZVsxXSxcbiAgICAgIGM6IDEsXG4gICAgICBzaXplOiBkb2N1bWVudF90b3BpY1trZXldLFxuICAgICAga2V5OiBrZXlcbiAgICB9KTtcbiAgfSk7XG4gIHZhciBsYWJlbFggPSAnWCc7XG4gIHZhciBsYWJlbFkgPSAnWSc7XG5cbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxuICAgIC5hcHBlbmQoJ3N2ZycpXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0MTInKVxuICAgIC5hdHRyKCdpZCcsJ2NsdXN0ZXJfaWQnKVxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luICsgbWFyZ2luKVxuICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcblxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLng7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueDtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFswLCB3aWR0aF0pO1xuXG4gIHZhciB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueTtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC55O1xuICAgIH0pXSlcbiAgICAucmFuZ2UoW2hlaWdodCwgMF0pO1xuXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5zaXplO1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSldKVxuICAgIC5yYW5nZShbMSwgMjBdKTtcblxuICB2YXIgb3BhY2l0eSA9IGQzLnNjYWxlU3FydCgpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5zaXplO1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSldKVxuICAgIC5yYW5nZShbMSwgLjVdKTtcblxuXG4gIHZhciB4QXhpcyA9IGQzLmF4aXNCb3R0b20oKS5zY2FsZSh4KTtcbiAgdmFyIHlBeGlzID0gZDMuYXhpc0xlZnQoKS5zY2FsZSh5KTtcblxuXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgIC5jYWxsKHlBeGlzKVxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxuICAgIC5hdHRyKFwieFwiLCAyMClcbiAgICAuYXR0cihcInlcIiwgLW1hcmdpbilcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxuICAgIC50ZXh0KGxhYmVsWSk7XG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcbiAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxuICAgIC5jYWxsKHhBeGlzKVxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXG4gICAgLmF0dHIoXCJ5XCIsIG1hcmdpbiAtIDEwKVxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgLnRleHQobGFiZWxYKTtcblxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXG4gICAgLmRhdGEoZGF0YSlcbiAgICAuZW50ZXIoKVxuICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgLmluc2VydChcImNpcmNsZVwiKVxuICAgIC5hdHRyKFwiY3hcIiwgd2lkdGggLyAyKVxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgfSlcbiAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBzY2FsZShkLnNpemUpO1xuICAgIH0pXG4gICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIFwiIzFmNzdiNFwiO1xuICAgIH0pXG4gICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmVuZGVyQmFyR3JhcGgoZFtcImtleVwiXSwgcmVzcCk7XG4gICAgICBmYWRlKGQuYywgLjEpO1xuICAgIH0pXG4gICAgLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICBmYWRlT3V0KCk7XG4gICAgfSlcbiAgICAudHJhbnNpdGlvbigpXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZXR1cm4geChkLngpIC0geShkLnkpO1xuICAgIH0pXG4gICAgLmR1cmF0aW9uKDUwMClcbiAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkLngpO1xuICAgIH0pXG4gICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHkoZC55KTtcbiAgICB9KTtcblxuXG4gIGZ1bmN0aW9uIGZhZGUoYywgb3BhY2l0eSkge1xuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGQuYyAhPSBjO1xuICAgICAgfSlcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgb3BhY2l0eSk7XG4gIH1cblxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgb3BhY2l0eShkLnNpemUpO1xuICAgICAgfSk7XG4gIH1cbn0iLCJmdW5jdGlvbiByZW5kZXJCYXJHcmFwaCh0b3BpY19udW1iZXIsIHJlc3ApIHtcbiAgZDMuc2VsZWN0KFwiI3N0YWNrLWJhclwiKS5yZW1vdmUoKTtcbiAgdmFyIGZpbmFsX2RhdGEgPSBbXTtcbiAgdmFyIGRhdGFWYWwgPXJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljX251bWJlcl07XG4gIGZvciAodmFyIGtleSBpbiBkYXRhVmFsKSB7XG4gICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICB2YXIgdGVtcCA9e307XG4gICAgICAgIHRlbXAuU3RhdGUgPSBrZXk7XG4gICAgICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gZGF0YVZhbFtrZXldO1xuICAgICAgICB0ZW1wLm92ZXJhbGwgPSByZXNwW1wib3ZlcmFsbF93b3JkXCJdW2tleV07XG4gICAgICAgIHRlbXAudG90YWwgPSB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSArIHRlbXAub3ZlcmFsbDtcbiAgICAgICAgZmluYWxfZGF0YS5wdXNoKHRlbXApO1xuICAgICAgICBjb25zb2xlLmxvZyhrZXkgKyBcIiAtPiBcIiArIGRhdGFWYWxba2V5XSk7XG4gICAgfVxuICB9XG4gIFxuXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGFja2VkLWJhcicpXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xuXG4gIHZhciBkYXRhID0gZmluYWxfZGF0YTtcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjU7XG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwic3RhY2stYmFyXCIpLFxuICAgIG1hcmdpbiA9IHtcbiAgICAgIHRvcDogMjAsXG4gICAgICByaWdodDogMjAsXG4gICAgICBib3R0b206IDMwLFxuICAgICAgbGVmdDogNTBcbiAgICB9LFxuICAgIHdpZHRoID0gK3N2Zy5hdHRyKFwid2lkdGhcIikgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xuICB2YXIgeSA9IGQzLnNjYWxlQmFuZCgpIC8vIHggPSBkMy5zY2FsZUJhbmQoKSAgXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKCkgLy8geSA9IGQzLnNjYWxlTGluZWFyKClcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xuXG4gIHZhciB6ID0gZDMuc2NhbGVPcmRpbmFsKCkucmFuZ2UoW1wiI0M4NDIzRVwiLCBcIiNBMUM3RTBcIl0pO1xuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxcIl07XG4gIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBiLnRvdGFsIC0gYS50b3RhbDtcbiAgfSk7XG4gIHkuZG9tYWluKGRhdGEubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGQuU3RhdGU7XG4gIH0pKTsgLy8geC5kb21haW4uLi5cblxuICB4LmRvbWFpbihbMCwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGQudG90YWw7XG4gIH0pXSkubmljZSgpOyAvLyB5LmRvbWFpbi4uLlxuXG4gIHouZG9tYWluKGtleXMpO1xuICBnLmFwcGVuZChcImdcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGQzLnN0YWNrKCkua2V5cyhrZXlzKShkYXRhKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geihkLmtleSk7XG4gICAgfSkuc2VsZWN0QWxsKFwicmVjdFwiKS5kYXRhKGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZDtcbiAgICB9KS5lbnRlcigpLmFwcGVuZChcInJlY3RcIikuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7XG4gICAgfSkgLy8uYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGEuU3RhdGUpOyB9KVxuICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFswXSk7XG4gICAgfSkgLy8uYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzFdKTsgfSkgIFxuICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFswXSkgLSB5KGRbMV0pOyB9KVxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHkuYmFuZHdpZHRoKCkpXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIDAuOCk7IC8vLmF0dHIoXCJ3aWR0aFwiLCB4LmJhbmR3aWR0aCgpKTsgXG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpIC8vICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAvLyAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkpO1xuXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKSAvLyBOZXcgbGluZVxuICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ5XCIsIDIpIC8vICAgICAuYXR0cihcInlcIiwgMilcbiAgICAuYXR0cihcInhcIiwgeCh4LnRpY2tzKCkucG9wKCkpICsgMC41KSAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcbiAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpIC8vICAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpXG4gIHZhciBsZWdlbmQgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMuc2xpY2UoKS5yZXZlcnNlKCkpLmVudGVyKCkuYXBwZW5kKFwiZ1wiKSAvLy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyBpICogMjAgKyBcIilcIjsgfSk7XG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMzAwICsgaSAqIDIwKSArIFwiKVwiO1xuICAgIH0pO1xuICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDE5KS5hdHRyKFwid2lkdGhcIiwgMTkpLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI0KS5hdHRyKFwieVwiLCA5LjUpLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKS50ZXh0KGZ1bmN0aW9uIChkKSB7XG4gICAgcmV0dXJuIGQ7XG4gIH0pO1xufSIsImZ1bmN0aW9uIGdlbmVyYXRlVG9waWNWZWN0b3JzKCl7XG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xuICAgIGlmKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcbiAgICAgICAgZm9yKHZhciB4IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcbiAgICAgICAgICAgIGZvcih2YXIgeSBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XSl7XG4gICAgICAgICAgICAgICAgdmVjdG9yLnB1c2god2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF1beV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2luZG93LnRvcGljVmVjdG9yc1t4XSA9IHZlY3RvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xuXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IGRvY0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BpY1wiOiB0b3BpYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndvcmRcIjogcmVzcG9uc2VbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZpc0RhdGE7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xuXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaChbcGFyc2VJbnQoZG9jS2V5KSwgcGFyc2VJbnQodG9waWMpLCByZXNwb25zZVtcIndvcmRzXCJdLmluZGV4T2Yod29yZCldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2aXNEYXRhO1xufVxuXG5cbiIsIndpbmRvdy52dWVBcHAgPSBuZXcgVnVlKHtcbiAgICBlbDogJyN2dWUtYXBwJyxcbiAgICBkYXRhOiB7XG4gICAgICAgIG1lc3NhZ2U6ICdIZWxsbyB1c2VyIScsXG4gICAgICAgIG5vbmVTZWxlY3RlZDogdHJ1ZSxcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiAyLFxuICAgICAgICBwbGF5ZXJEZXRhaWw6IHtcbiAgICAgICAgICAgIG5hbWU6IFwiPFBsYXllciBOYW1lPlwiXG4gICAgICAgIH0sXG4gICAgICAgIG92ZXJ2aWV3RmlsdGVyczoge30sXG4gICAgICAgIHNlbGVjdGVkTWFwOiAxXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHNlbGVjdFBhZ2U6IGZ1bmN0aW9uKHgpe1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xuICAgICAgICAgICAgaWYgKHggPT0gMSl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UxKHdpbmRvdy5nbG9iYWxfZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTIod2luZG93Lmdsb2JhbF9kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT0gNCl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2U0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcbiAgICAgICAgbG9hZEQzKCk7XG4gICAgICAgIGxvYWRKcXVlcnkoKTtcbiAgICB9XG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xuICAgIGxldCBkYXRhID0gW107XG4gICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pe1xuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcbiAgICAgICAgIGRhdGEucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiB3b3JkLFxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xuXG4gICAgZm9yKHZhciB0b3BpYyBpbiByZXNwW1widG9waWNfd29yZFwiXSl7XG4gICAgICAgIGxldCBkYXRhID0gW107XG4gICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xuICAgICAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgbmFtZTogd29yZCxcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgJChcIiN0b3BpYy13Y3NcIikuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29sLXNtLTZcIj48ZGl2IHN0eWxlPVwib3V0bGluZTogc29saWQgMXB4O1wiIGlkPVwidG9waWMnK3RvcGljKydcIiBzdHlsZT1cImhlaWdodDogMzAwcHg7XCI+PC9kaXY+PC9kaXY+Jyk7XG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlV29yZENsb3VkKGlkLCBkYXRhLCB0aXRsZSl7XG4gICAgSGlnaGNoYXJ0cy5jaGFydChpZCwge1xuICAgICAgICBzZXJpZXM6IFt7XG4gICAgICAgICAgICB0eXBlOiAnd29yZGNsb3VkJyxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICByb3RhdGlvbjoge1xuICAgICAgICAgICAgICAgIGZyb206IDAsXG4gICAgICAgICAgICAgICAgdG86IDAsXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmFtZTogJ1Njb3JlJ1xuICAgICAgICB9XSxcbiAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgIHRleHQ6IHRpdGxlXG4gICAgICAgIH1cbiAgICB9KTtcbn0iXX0=
