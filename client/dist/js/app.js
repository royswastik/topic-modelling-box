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
    window.documents = [["i", "am", "batman", "of", "winterfall"], ["there", "should", "always", "be", "a", "stark", "in", "winterfell"], ["prophecy", "says", "prince", "will", "be", "reborn"]];
    getAnalysis("asfas", "assad");
    loadParallelCoordinate();
    loadParallelCoordinatesHC();
  });
}

function getDocs(texts) {
  return window.documents = texts.map(function (x) {
    return x.split();
  });
}

function getAnalysis(method) {
  var docs = window.documents;

  var fnc = function fnc(x) {
    return x;
  };

  if (method == "LDA") {
    fnc = getWord2VecClusters;
  } else {
    fnc = getLDAClusters;
  }

  fnc(docs, function (resp) {
    window.global_data = resp;
    initPage1(resp);
    initPage2(resp);
    initPage3(resp);
    initPage4();
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

function initPage4() {
  $("#overall-wc").html();
  loadWordCloud(window.global_data);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMiLCJnZXREb2NzIiwidGV4dHMiLCJtYXAiLCJzcGxpdCIsIm1ldGhvZCIsImRvY3MiLCJmbmMiLCJnZXRXb3JkMlZlY0NsdXN0ZXJzIiwiZ2V0TERBQ2x1c3RlcnMiLCJyZXNwIiwiZ2xvYmFsX2RhdGEiLCJpbml0UGFnZTEiLCJpbml0UGFnZTIiLCJpbml0UGFnZTMiLCJpbml0UGFnZTQiLCJsb2FkVmlzdWFsaXphdGlvbnMiLCJyZW5kZXJDbHVzdGVyQW5hbHlzaXMiLCJodG1sIiwibG9hZFdvcmRDbG91ZCIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb250ZW50VHlwZSIsImRhdGFUeXBlIiwicGFyc2UiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyIsIkhpZ2hjaGFydHMiLCJjaGFydCIsInBhcmFsbGVsQ29vcmRpbmF0ZXMiLCJwYXJhbGxlbEF4ZXMiLCJsaW5lV2lkdGgiLCJ0aXRsZSIsInBsb3RPcHRpb25zIiwic2VyaWVzIiwiYW5pbWF0aW9uIiwibWFya2VyIiwiZW5hYmxlZCIsInN0YXRlcyIsImhvdmVyIiwiaGFsbyIsImV2ZW50cyIsIm1vdXNlT3ZlciIsImdyb3VwIiwidG9Gcm9udCIsInhBeGlzIiwiY2F0ZWdvcmllcyIsIm9mZnNldCIsInlBeGlzIiwiT2JqZWN0Iiwia2V5cyIsInZhbHVlcyIsImNvbG9ycyIsInNldCIsInNoYWRvdyIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIndpZHRoIiwiaGVpZ2h0Iiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJwYXJzZUZsb2F0IiwiZG9tYWluIiwibGluZWFyIiwiZXh0ZW50IiwicmFuZ2UiLCJwYXRoIiwiZyIsImRyYWciLCJvcmlnaW4iLCJtaW4iLCJtYXgiLCJzb3J0IiwicG9zaXRpb24iLCJkZWxheSIsImJydXNoIiwiYnJ1c2hzdGFydCIsInNvdXJjZUV2ZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwiYWN0aXZlcyIsImVtcHR5IiwiZXh0ZW50cyIsImV2ZXJ5IiwiZG9jdW1lbnRfdG9waWMiLCJ0b3BpY192ZWN0b3JzIiwiYmIiLCJxdWVyeVNlbGVjdG9yIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidmFsdWUiLCJjIiwibGFiZWxYIiwibGFiZWxZIiwic2NhbGVMaW5lYXIiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwiYXhpc0JvdHRvbSIsImF4aXNMZWZ0IiwicmVuZGVyQmFyR3JhcGgiLCJmYWRlIiwiZmFkZU91dCIsInRvcGljX251bWJlciIsImZpbmFsX2RhdGEiLCJ0ZW1wIiwiU3RhdGUiLCJ0b3BpY19mcmVxdWVuY3kiLCJvdmVyYWxsIiwidG90YWwiLCJjb25zb2xlIiwibG9nIiwic2NhbGVCYW5kIiwicmFuZ2VSb3VuZCIsInBhZGRpbmdJbm5lciIsImFsaWduIiwieiIsInNjYWxlT3JkaW5hbCIsIm5pY2UiLCJzdGFjayIsImJhbmR3aWR0aCIsInRpY2tzIiwicG9wIiwibGVnZW5kIiwic2xpY2UiLCJyZXZlcnNlIiwiZ2VuZXJhdGVUb3BpY1ZlY3RvcnMiLCJ0b3BpY1ZlY3RvcnMiLCJ0b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljIiwidmVjdG9yIiwidG9waWNfdGhyZXNob2xkIiwid29yZF90aHJlc2hvbGQiLCJ2aXNEYXRhIiwiZG9jS2V5IiwidG9waWMiLCJ0b3BpY1Njb3JlIiwid29yZCIsIndvcmRTY29yZSIsImluZGV4T2YiLCJ2dWVBcHAiLCJWdWUiLCJlbCIsIm1lc3NhZ2UiLCJub25lU2VsZWN0ZWQiLCJzZWxlY3RlZFBhZ2UiLCJwbGF5ZXJEZXRhaWwiLCJvdmVydmlld0ZpbHRlcnMiLCJzZWxlY3RlZE1hcCIsIm1ldGhvZHMiLCJzZWxlY3RQYWdlIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVBQWtCLE9BQU8sSUFBUDtBQUNyQjs7QUFDRCxTQUFPLEtBQVA7QUFDSCxDQUxEOztBQU9BSCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JLLE1BQWhCLEdBQXlCLFlBQVc7QUFDaEMsTUFBSUMsR0FBRyxHQUFHLEVBQVY7O0FBQ0EsT0FBSSxJQUFJSCxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxDQUFDRyxHQUFHLENBQUNDLFFBQUosQ0FBYSxLQUFLSixDQUFMLENBQWIsQ0FBSixFQUEyQjtBQUN2QkcsTUFBQUEsR0FBRyxDQUFDRSxJQUFKLENBQVMsS0FBS0wsQ0FBTCxDQUFUO0FBQ0g7QUFDSjs7QUFDRCxTQUFPRyxHQUFQO0FBQ0gsQ0FSRDs7QUFVQSxTQUFTRyx3QkFBVCxDQUFrQ0MsSUFBbEMsRUFBdUM7QUFDdEMsTUFBSUMsT0FB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QUFzQixXQUFTdVMsS0FBL0IsQ0FBZjtBQUNIO0FBQ0o7O0FBRUQsU0FBU2tCLGVBQVQsQ0FBeUJwUCxFQUF6QixFQUE2QnJFLElBQTdCLEVBQW1DbUwsS0FBbkMsRUFBeUM7QUFDckNMLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBWCxDQUFpQjFHLEVBQWpCLEVBQXFCO0FBQ2pCZ0gsSUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDTDFGLE1BQUFBLElBQUksRUFBRSxXQUREO0FBRUwzRixNQUFBQSxJQUFJLEVBQUVBLElBRkQ7QUFHTDBULE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxJQUFJLEVBQUUsQ0FEQTtBQUVOQyxRQUFBQSxFQUFFLEVBQUUsQ0FGRTtBQUdOQyxRQUFBQSxZQUFZLEVBQUU7QUFIUixPQUhMO0FBUUxuUCxNQUFBQSxJQUFJLEVBQUU7QUFSRCxLQUFELENBRFM7QUFXakJ5RyxJQUFBQSxLQUFLLEVBQUU7QUFDSGpJLE1BQUFBLElBQUksRUFBRWlJO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuQXJyYXkucHJvdG90eXBlLnVuaXF1ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZighYXJyLmluY2x1ZGVzKHRoaXNbaV0pKSB7XG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyOyBcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xuXHR2YXIgZmluYWxfZGljdCA9IHt9O1xuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xuXG5cdCAgICBcdGZvcih2YXIgY2hpbGRLZXkgaW4gY2hpbGRyZW5Xb3Jkcyl7XG5cblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiAwLjEpIHtcblxuXHQgICAgXHRcdFx0aWYoIShjaGlsZEtleSBpbiBmaW5hbF9kaWN0KSl7XG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XG5cdCAgICBcdFx0XHR9XG4gICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XS5wdXNoKGtleSk7XG5cdCAgICBcdFx0XHRcblx0ICAgIFx0XHR9XG5cdCAgICBcdH0gXG5cdCAgICB9XG4gIFx0fVxuICBcdHZhciBjbHVzdGVyX2RhdGEgPSB7XG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxuICBcdFx0XCJjaGlsZHJlblwiOltdXG4gIFx0fVxuXG4gIFx0dmFyIGNvdW50PTA7XG4gIFx0Zm9yKHZhciBrZXkgaW4gZmluYWxfZGljdCl7XG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xuICBcdFx0XHR2YXIgaGFzaCA9IHt9O1xuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XG4gIFx0XHRcdGhhc2hbXCJjb2xvclwiXSA9IFwiI0M3RUFGQlwiO1xuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcblxuXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XG4gIFx0XHRcdGZvcih2YXIgaT0wOyBpIDwgYXJyYXlfY2hpbGQubGVuZ3RoO2krKyl7XG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImFsaWFzXCJdID0gaSsxICsgXCJcIjtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XG4gIFx0XHRcdFx0Y2hpbGRzLnB1c2goY2hpbGRfaGFzaCk7XG4gIFx0XHRcdH1cbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xuICBcdFx0XHRjbHVzdGVyX2RhdGEuY2hpbGRyZW4ucHVzaChoYXNoKTtcbiAgXHRcdH1cbiAgXHR9XG4gIFx0dmFyIGQzID0gICB3aW5kb3cuZDNWMztcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xuICB2YXIgcmFkaXVzID0gMjAwO1xuICB2YXIgZGVuZG9ncmFtQ29udGFpbmVyID0gXCJzcGVjaWVzY29sbGFwc2libGVcIjtcbiAgdmFyIGRlbmRvZ3JhbURhdGFTb3VyY2UgPSBcImZvcmVzdFNwZWNpZXMuanNvblwiO1xuXG4gIHZhciByb290Tm9kZVNpemUgPSA2O1xuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcbiAgdmFyIGxldmVsVGhyZWVOb2RlU2l6ZSA9IDI7XG5cblxuICB2YXIgaSA9IDA7XG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XG5cbiAgdmFyIHJvb3RKc29uRGF0YTtcblxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcbiAgICAgIC5zaXplKFszNjAscmFkaXVzIC0gMTIwXSlcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XG4gICAgICB9KTtcblxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcbiAgICAgIC5wcm9qZWN0aW9uKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFtkLnksIGQueCAvIDE4MCAqIE1hdGguUEldOyB9KTtcblxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xuXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxuICAgICAgLnRleHQoXCJDb2xsYXBzZSFcIilcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xuXG4gIHZhciBzdmdSb290ID0gY29udGFpbmVyRGl2LmFwcGVuZChcInN2ZzpzdmdcIilcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgIC5hdHRyKFwidmlld0JveFwiLCBcIi1cIiArIChyYWRpdXMpICsgXCIgLVwiICsgKHJhZGl1cyAtIDUwKSArXCIgXCIrIHJhZGl1cyoyICtcIiBcIisgcmFkaXVzKjIpXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcblxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXG4gICAgICAuYXBwZW5kKFwic3ZnOnJlY3RcIilcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xuXG4gIHZhciBhbmltR3JvdXAgPSBzdmdSb290LmFwcGVuZChcInN2ZzpnXCIpXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcblxuICBcdHJvb3RKc29uRGF0YSA9IGNsdXN0ZXJfZGF0YTtcblxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXG4gICAgcm9vdEpzb25EYXRhLmNoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xuXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXG4gIFx0Y3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHJvb3RKc29uRGF0YSk7XG5cblxuXG5cbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xuXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcbiAgICB2YXIgcGF0aGxpbmtzID0gY2x1c3Rlci5saW5rcyhub2Rlcyk7XG5cbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcbiAgICAgIH1lbHNlXG4gICAgICB7XG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBub2Rlc+KAplxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcblxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XG5cbiAgICBub2RlRW50ZXIuYXBwZW5kKFwiY2lyY2xlXCIpO1xuXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XG4gICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcbiAgICB9KTtcblxuXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXG4gICAgdmFyIG5vZGVVcGRhdGUgPSBub2RlLnRyYW5zaXRpb24oKVxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxuXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFRocmVlTm9kZVNpemU7XG5cbiAgICAgICAgfSlcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcbiAgICAgICAgICAgICAgIH1lbHNlIGlmKGQuZGVwdGggPT09IDEpe1xuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcbiAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIndoaXRlXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcImxpZ2h0Z3JheVwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXG5cbiAgICAgICAgLmF0dHIoJ2lkJywgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcbiAgICAgICAgICByZXR1cm4gJ1QtJyArIGQuZGVwdGggKyBcIi1cIiArIG9yZGVyO1xuICAgICAgICB9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IFwic3RhcnRcIiA6IFwiZW5kXCI7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiLjMxZW1cIjtcbiAgICAgICAgfSlcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IDEgOiAtMjA7XG4gICAgICAgIH0pXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XG4gICAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IG51bGwgOiBcInJvdGF0ZSgxODApXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcbiAgICAgICAgLnJlbW92ZSgpO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBsaW5rc+KAplxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XG5cbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XG4gICAgICAgICAgcmV0dXJuIGRpYWdvbmFsKHtzb3VyY2U6IG8sIHRhcmdldDogb30pO1xuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XG4gICAgICAgICAgcmV0dXJuIGQuY29sb3I7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBsaW5rcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXG4gICAgbGluay50cmFuc2l0aW9uKClcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxuICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xuXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXG4gICAgbGluay5leGl0KCkudHJhbnNpdGlvbigpXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueCwgeTogc291cmNlLnl9O1xuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlbW92ZSgpO1xuICB9XG5cbiAgLy8gVG9nZ2xlIGNoaWxkcmVuIG9uIGNsaWNrLlxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xuICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICBkLl9jaGlsZHJlbiA9IGQuY2hpbGRyZW47XG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgZC5jaGlsZHJlbiA9IGQuX2NoaWxkcmVuO1xuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xuICAgIH1cblxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcblxuICAgIC8vQWN0aXZpdGllcyBvbiBub2RlIGNsaWNrXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xuXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcblxuICB9XG5cbiAgLy8gQ29sbGFwc2Ugbm9kZXNcbiAgZnVuY3Rpb24gY29sbGFwc2UoZCkge1xuICAgIGlmIChkLmNoaWxkcmVuKSB7XG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcbiAgICAgICAgZC5fY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xuICAgICAgfVxuICB9XG5cblxuICAvLyBoaWdobGlnaHRzIHN1Ym5vZGVzIG9mIGEgbm9kZVxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcbiAgICAgIHZhciBkZWZhdWx0TGlua0NvbG9yID0gXCJsaWdodGdyYXlcIjtcblxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XG4gICAgICB2YXIgbm9kZUNvbG9yID0gZC5jb2xvcjtcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcbiAgICAgIH1cblxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xuXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgaWYgKGQubmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5uYW1lID09PSBkLm5hbWUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcbiAgICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCxjbGlja1R5cGUpe1xuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcbiAgICB2YXIgcGFyZW50ID0gZDtcbiAgICB3aGlsZSAoIV8uaXNVbmRlZmluZWQocGFyZW50KSkge1xuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xuICAgIHZhciBtYXRjaGVkTGlua3MgPSBbXTtcblxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSlcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcbiAgICAgICAge1xuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XG4gICAgICAgIH0pO1xuXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcblxuICAgIGZ1bmN0aW9uIGFuaW1hdGVDaGFpbnMobGlua3MsY2xpY2tUeXBlKXtcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXG4gICAgICAgICAgLmRhdGEoW10pXG4gICAgICAgICAgLmV4aXQoKS5yZW1vdmUoKTtcblxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcbiAgICAgICAgICAuZGF0YShsaW5rcylcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxuICAgICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XG5cblxuICAgICAgLy9SZXNldCBwYXRoIGhpZ2hsaWdodCBpZiBjb2xsYXBzZSBidXR0b24gY2xpY2tlZFxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcblxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcbiAgICAgICAgICAuYXR0cihcInlcIiwgLXJhZGl1cylcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxuICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oZHVyYXRpb24pXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiB6b29tKCkge1xuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcblxuICAgIGlmKGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpKXtcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcbiAgICB9ZWxzZXtcbiAgICAgdG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbigpO1xuICAgIH1cblxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XG4gICAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XG5cbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXG4gICAgZnVuY3Rpb24gY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCl7XG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XG5cbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcblxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc05vZGVPcGVuKGQpe1xuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG5cblxuXG59XG5cbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgIH0pO1xufVxuIiwicmVxdWlyZS5jb25maWcoe1xuICAgIHBhdGhzOiB7XG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIGxvYWREMygpe1xuXG4gICAgd2luZG93LmQzT2xkID0gZDM7XG4gICAgcmVxdWlyZShbJ2QzJ10sIGZ1bmN0aW9uKGQzVjMpIHtcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcbiAgICAgICAgd2luZG93LmRvY3VtZW50cyA9IFtcbiAgICAgICAgICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXG4gICAgICAgICAgW1widGhlcmVcIiwgXCJzaG91bGRcIiwgXCJhbHdheXNcIiwgXCJiZVwiLCBcImFcIiwgXCJzdGFya1wiLCBcImluXCIsIFwid2ludGVyZmVsbFwiXSxcbiAgICAgICAgICBbXCJwcm9waGVjeVwiLCBcInNheXNcIiwgXCJwcmluY2VcIiwgXCJ3aWxsXCIsIFwiYmVcIiAsIFwicmVib3JuXCJdXG4gICAgICAgIF07XG4gICAgICAgIGdldEFuYWx5c2lzKFwiYXNmYXNcIiwgXCJhc3NhZFwiKTtcbiAgICAgICAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCk7XG4gICAgICAgICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQygpO1xuICAgIH0pO1xufVxuXG5cbmZ1bmN0aW9uIGdldERvY3ModGV4dHMpIHtcbiAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudHMgPSB0ZXh0cy5tYXAoeCA9PiB4LnNwbGl0KCkpO1xufVxuXG5mdW5jdGlvbiBnZXRBbmFseXNpcyhtZXRob2QpIHtcbiAgbGV0IGRvY3MgPSB3aW5kb3cuZG9jdW1lbnRzO1xuICBsZXQgZm5jID0geCA9PiB4O1xuICBpZiAobWV0aG9kID09IFwiTERBXCIpIHtcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xuICB9IGVsc2Uge1xuICAgIGZuYyA9IGdldExEQUNsdXN0ZXJzO1xuICB9XG4gIGZuYyhkb2NzLCByZXNwID0+IHtcbiAgICAgIHdpbmRvdy5nbG9iYWxfZGF0YSA9IHJlc3A7XG4gICAgaW5pdFBhZ2UxKHJlc3ApO1xuICAgIGluaXRQYWdlMihyZXNwKTtcbiAgICBpbml0UGFnZTMocmVzcCk7XG4gICAgaW5pdFBhZ2U0KCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkVmlzdWFsaXphdGlvbnMoKSB7XG59XG5cbmZ1bmN0aW9uIGluaXRQYWdlMShyZXNwKSB7XG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcbn1cblxuXG5cbmZ1bmN0aW9uIGluaXRQYWdlMihyZXNwKSB7XG4gIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChyZXNwKTtcblxufVxuXG5mdW5jdGlvbiBpbml0UGFnZTMoKXtcbiAgICAkKFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmh0bWwoXCJcIik7XG4gICAgJChcIiNwYy1jb250YWluZXJcIikuaHRtbChcIlwiKTtcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKCk7XG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQygpO1xufVxuXG5mdW5jdGlvbiBpbml0UGFnZTQoKXtcbiAgICAkKFwiI292ZXJhbGwtd2NcIikuaHRtbCgpO1xuICAgIGxvYWRXb3JkQ2xvdWQod2luZG93Lmdsb2JhbF9kYXRhKTtcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXG5mdW5jdGlvbiBnZXQyRFZlY3RvcnModmVjdG9ycywgc3VjY2Vzc0NhbGxiYWNrKXtcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IHZlY3RvcnNcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xuICAgICAgfSk7XG59XG5cbi8vIGRvY3MgZm9ybWF0OiBMaXN0W0xpc3Rbc3RyaW5nKHdvcmQpXV1cbmZ1bmN0aW9uIGdldFdvcmQyVmVjQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XG4gICAgICAgIHVybDogXCIvYXBpL2dldENsdXN0ZXJzV29yZDJWZWNcIixcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcbiAgICAgIH0pO1xuICAgICAgIFxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xuICAgICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldExEQUNsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB1cmw6IFwiL2FwaS9nZXRMREFEYXRhXCIsXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XG4gICAgICB9KTtcbiAgICAgICBcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcbiAgICAgIH0pO1xufVxuXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKHJlc3Ape1xuXG4gICAgZ2V0V29yZDJWZWNDbHVzdGVycyh3aW5kb3cuZG9jdW1lbnRzXG4gICAgLCBmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgMCwgMCk7XG4gICAgICAgIEhpZ2hjaGFydHMuY2hhcnQoJ3BjLWNvbnRhaW5lcicsIHtcbiAgICAgICAgICAgIGNoYXJ0OiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwbGluZScsXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxDb29yZGluYXRlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBwYXJhbGxlbEF4ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ0RvY3VtZW50IC0gVG9waWMgLSBXb3JkIFJlbGF0aW9uc2hpcCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwbG90T3B0aW9uczoge1xuICAgICAgICAgICAgICAgIHNlcmllczoge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtYXJrZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYWxvOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2VPdmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cC50b0Zyb250KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gdG9vbHRpcDoge1xuICAgICAgICAgICAgLy8gICAgIHBvaW50Rm9ybWF0OiAnPHNwYW4gc3R5bGU9XCJjb2xvcjp7cG9pbnQuY29sb3J9XCI+XFx1MjVDRjwvc3Bhbj4nICtcbiAgICAgICAgICAgIC8vICAgICAgICAgJ3tzZXJpZXMubmFtZX06IDxiPntwb2ludC5mb3JtYXR0ZWRWYWx1ZX08L2I+PGJyLz4nXG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBbXG4gICAgICAgICAgICAgICAgICAgICdEb2N1bWVudCcsXG4gICAgICAgICAgICAgICAgICAgICdUb3BpYycsXG4gICAgICAgICAgICAgICAgICAgICdXb3JkJ1xuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAxMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHlBeGlzOiBbe1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Eb2N1bWVudCBcIit4KVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Ub3BpYyBcIit4KVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC52YWx1ZXMocmVzcFtcIndvcmRzXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlwiK3gpXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIGNvbG9yczogWydyZ2JhKDExLCAyMDAsIDIwMCwgMC4xKSddLFxuICAgICAgICAgICAgc2VyaWVzOiBkYXRhLm1hcChmdW5jdGlvbiAoc2V0LCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHNldCxcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuXG59XG5cblxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZSgpe1xuICAgIHZhciBtYXJnaW4gPSB7dG9wOiAzMCwgcmlnaHQ6IDEwLCBib3R0b206IDEwLCBsZWZ0OiAxMH0sXG4gICAgICAgIHdpZHRoID0gOTYwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXG4gICAgICAgIGhlaWdodCA9IDUwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xuXG4gICAgdmFyIHggPSBkM1YzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcbiAgICAgICAgeSA9IHt9LFxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xuXG4gICAgdmFyIGxpbmUgPSBkM1YzLnN2Zy5saW5lKCksXG4gICAgICAgIGJhY2tncm91bmQsXG4gICAgICAgIGZvcmVncm91bmQ7XG5cbiAgICB2YXIgc3ZnID0gZDNWMy5zZWxlY3QoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKSwgZGltZW5zaW9ucztcblxuXG4gICAgZ2V0V29yZDJWZWNDbHVzdGVycyh3aW5kb3cuZG9jdW1lbnRzXG4gICAgLCBmdW5jdGlvbihyZXNwKSB7XG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNUID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcblxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMgPSBkM1YzLmtleXMoY2Fyc1swXSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcbiAgICAgICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSkpO1xuICAgIH0pKTtcblxuICAgIC8vIEFkZCBncmV5IGJhY2tncm91bmQgbGluZXMgZm9yIGNvbnRleHQuXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXG4gICAgZm9yZWdyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgIC5kYXRhKGNhcnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xuXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCI7IH0pXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xuICAgICAgICAgICAgYmFja2dyb3VuZFxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cbiAgICBnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgbGV0IGF4aXMgPSBudWxsO1xuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZihkID09IFwidG9waWNcIil7XG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxuICAgICAgICAgICAgICAgIGF4aXMuc2NhbGUoeVtkXSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXG4gICAgZy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJicnVzaFwiKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDE2KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4gW3Bvc2l0aW9uKHApLCB5W3BdKGRbcF0pXTsgfSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XG4gICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XG4gICAgfSk7XG4gICAgfVxuXG59IiwiZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcbiAgZDMuc2VsZWN0KFwiLmNoYXJ0MTJcIikucmVtb3ZlKCk7XG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcbiAgdmFyIHRvcGljX3ZlY3RvcnMgPSByZXNwW1widG9waWNfdmVjdG9yc1wiXTtcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsdXN0ZXInKVxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICB3aWR0aCA9IGJiLnJpZ2h0IC0gYmIubGVmdDtcbiAgdmFyIGhlaWdodCA9IDQwMDtcbiAgdmFyIG1hcmdpbiA9IDQwO1xuICB2YXIgZGF0YSA9IFtdO1xuXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIHZhbHVlID0gdG9waWNfdmVjdG9yc1trZXldO1xuICAgIGRhdGEucHVzaCh7XG4gICAgICB4OiB2YWx1ZVswXSxcbiAgICAgIHk6IHZhbHVlWzFdLFxuICAgICAgYzogMSxcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXG4gICAgICBrZXk6IGtleVxuICAgIH0pO1xuICB9KTtcbiAgdmFyIGxhYmVsWCA9ICdYJztcbiAgdmFyIGxhYmVsWSA9ICdZJztcblxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjY2x1c3RlcicpXG4gICAgLmFwcGVuZCgnc3ZnJylcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXG4gICAgLmF0dHIoJ2lkJywnY2x1c3Rlcl9pZCcpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xuXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQueDtcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC54O1xuICAgIH0pXSlcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XG5cbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC55O1xuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnk7XG4gICAgfSldKVxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAyMF0pO1xuXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLnNpemU7XG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIGQuc2l6ZTtcbiAgICB9KV0pXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xuXG5cbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xuXG5cbiAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgLmNhbGwoeUF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgLnRleHQobGFiZWxZKTtcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxuICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXG4gICAgLmNhbGwoeEF4aXMpXG4gICAgLmFwcGVuZChcInRleHRcIilcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAudGV4dChsYWJlbFgpO1xuXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcbiAgICAuZGF0YShkYXRhKVxuICAgIC5lbnRlcigpXG4gICAgLmFwcGVuZChcImdcIilcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIG9wYWNpdHkoZC5zaXplKTtcbiAgICB9KVxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XG4gICAgfSlcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gXCIjMWY3N2I0XCI7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcbiAgICAgIGZhZGUoZC5jLCAuMSk7XG4gICAgfSlcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIGZhZGVPdXQoKTtcbiAgICB9KVxuICAgIC50cmFuc2l0aW9uKClcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XG4gICAgfSlcbiAgICAuZHVyYXRpb24oNTAwKVxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB4KGQueCk7XG4gICAgfSlcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geShkLnkpO1xuICAgIH0pO1xuXG5cbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZC5jICE9IGM7XG4gICAgICB9KVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxuICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XG4gICAgICB9KTtcbiAgfVxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHZhciB0ZW1wID17fTtcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcbiAgICB9XG4gIH1cbiAgXG5cbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgd2lkdGggPSBiYi5yaWdodCAtIGJiLmxlZnQ7XG5cbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNTtcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXG4gICAgbWFyZ2luID0ge1xuICAgICAgdG9wOiAyMCxcbiAgICAgIHJpZ2h0OiAyMCxcbiAgICAgIGJvdHRvbTogMzAsXG4gICAgICBsZWZ0OiA1MFxuICAgIH0sXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XG5cbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbFwiXTtcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICB9KTtcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC5TdGF0ZTtcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxuXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZC50b3RhbDtcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXG5cbiAgei5kb21haW4oa2V5cyk7XG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiB6KGQua2V5KTtcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkO1xuICAgIH0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXG4gICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4geChkWzBdKTtcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSlcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcblxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XG5cbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpIC8vIE5ldyBsaW5lXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxuICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgzMDAgKyBpICogMjApICsgXCIpXCI7XG4gICAgfSk7XG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMTkpLmF0dHIoXCJ3aWR0aFwiLCAxOSkuYXR0cihcImhlaWdodFwiLCAxOSkuYXR0cihcImZpbGxcIiwgeik7XG4gIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjQpLmF0dHIoXCJ5XCIsIDkuNSkuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZDtcbiAgfSk7XG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcbiAgICB3aW5kb3cudG9waWNWZWN0b3JzID0ge307XG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xuICAgICAgICAgICAgdmFyIHZlY3RvciA9IFtdO1xuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZG9jdW1lbnRcIjogIGRvY0tleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlzRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xuICAgIGxldCB2aXNEYXRhID0gW107XG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XG5cbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZpc0RhdGE7XG59XG5cblxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xuICAgIGVsOiAnI3Z1ZS1hcHAnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDIsXG4gICAgICAgIHBsYXllckRldGFpbDoge1xuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcbiAgICAgICAgfSxcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDFcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xuICAgICAgICAgICAgICAgIGluaXRQYWdlMih3aW5kb3cuZ2xvYmFsX2RhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeCA9PSA0KXtcbiAgICAgICAgICAgICAgICBpbml0UGFnZTQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJNb3VudGVkXCIpO1xuICAgICAgICBsb2FkRDMoKTtcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xuICAgIH1cbn0pOyIsImZ1bmN0aW9uIGxvYWRXb3JkQ2xvdWQocmVzcCl7XG4gICAgbGV0IGRhdGEgPSBbXTtcbiAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcIm92ZXJhbGxfd29yZFwiXSl7XG4gICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdO1xuICAgICAgICAgZGF0YS5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IHdvcmQsXG4gICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlV29yZENsb3VkKFwib3ZlcmFsbC13Y1wiLCBkYXRhLCBcIkFsbCBEb2N1bWVudHNcIik7XG5cbiAgICBmb3IodmFyIHRvcGljIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdKXtcbiAgICAgICAgbGV0IGRhdGEgPSBbXTtcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XG4gICAgICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xuICAgICAgICAgICAgZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxuICAgICAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAkKFwiI3RvcGljLXdjc1wiKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb2wtc20tNlwiPjxkaXYgc3R5bGU9XCJvdXRsaW5lOiBzb2xpZCAxcHg7XCIgaWQ9XCJ0b3BpYycrdG9waWMrJ1wiIHN0eWxlPVwiaGVpZ2h0OiAzMDBweDtcIj48L2Rpdj48L2Rpdj4nKTtcbiAgICAgICAgY3JlYXRlV29yZENsb3VkKFwidG9waWNcIit0b3BpYywgZGF0YSwgXCJUb3BpYyBcIit0b3BpYyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcbiAgICBIaWdoY2hhcnRzLmNoYXJ0KGlkLCB7XG4gICAgICAgIHNlcmllczogW3tcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHJvdGF0aW9uOiB7XG4gICAgICAgICAgICAgICAgZnJvbTogMCxcbiAgICAgICAgICAgICAgICB0bzogMCxcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbnM6IDVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYW1lOiAnU2NvcmUnXG4gICAgICAgIH1dLFxuICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgdGV4dDogdGl0bGVcbiAgICAgICAgfVxuICAgIH0pO1xufSJdfQ==
