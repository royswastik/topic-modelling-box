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
        if (childrenWords.hasOwnProperty(childKey) && childrenWords[childKey] > 0.01) {
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
    window.d3 = d3Old; // window.documents = [
    //         //   ["i", "am", "batman", "of", "winterfall"],
    //         //   ["there", "should", "always", "be", "a", "stark", "in", "winterfell"],
    //         //   ["prophecy", "says", "prince", "will", "be" , "reborn"]
    //         // ];
    //     window.documents = [['project', 'classification', 'compare', 'neural', 'nets', 'SVM', 'due', 'due'], ['two', 'new', 'progress', 'checks', 'final', 'project',  'assigned', 'follows'], ['report', 'graded',  'contribute', 'points',  'total', 'semester', 'grade'], ['progress', 'update', 'evaluated', 'TA', 'peers'], ['class', 'meeting', 'tomorrow','teams', 'work', 'progress', 'report', 'final', 'project'], [ 'quiz',  'sections', 'regularization', 'Tuesday'], [ 'quiz', 'Thursday', 'logistics', 'work', 'online', 'student', 'postpone',  'quiz', 'Tuesday'], ['quiz', 'cover', 'Thursday'], ['quiz', 'chap', 'chap', 'linear', 'regression']];

    window.documents = [['serious', 'talk', 'friends', 'flaky', 'lately', 'understood', 'good', 'evening', 'hanging'], ['got', 'gift', 'elder', 'brother', 'really', 'surprising'], ['completed', '5', 'miles', 'run', 'without', 'break', 'makes', 'feel', 'strong'], ['son', 'performed', 'well', 'test', 'preparation']];
    getAnalysis("LDA");
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

  if (method === "LDA") {
    fnc = getLDAClusters;
  } else {
    fnc = getWord2VecClusters;
  }

  window.loadDFunc = fnc;
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

function initPage3(resp) {
  $("#parallel-coordinate-vis").html("");
  $("#pc-container").html("");
  loadParallelCoordinate(resp);
  loadParallelCoordinatesHC(resp);
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
      docs: docs,
      start: 1,
      end: 5,
      selected: 0
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
      docs: docs,
      start: 1,
      end: 5,
      selected: 0
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
}
"use strict";

function loadParallelCoordinate(resp) {
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
      dimensions; // Extract the list of dimensions and create a scale for each.

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
      width = 600;
  var height = 400;
  var margin = 80;
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
  })]).range([10, 20]);
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
  }); // text label for the x axis

  svg.append("text").attr("class", "x label").attr("text-anchor", "end").attr("x", width).attr("y", height + 40).text("PCA1");
  svg.append("text").attr("class", "y label").attr("text-anchor", "end").attr("y", -50).attr("dy", ".75em").attr("transform", "rotate(-90)").text("PCA2");

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
  d3.select("#legendsvg").remove();
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
      width = 600;
  var data = final_data;
  var height = data.length * 25;
  var svg = d3.select("#stacked-bar").append("svg").attr("width", width).attr("height", height).attr("id", "stack-bar"),
      margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 80
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
  var keys = ["topic_frequency", "overall_frequency"];
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

  var svg1 = d3.select("#legendT").append("svg").attr("width", width).attr("height", height).attr("id", "legendsvg");
  var legend = svg1.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("text-anchor", "end").selectAll("g").data(keys.slice().reverse()).enter().append("g") //.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
  .attr("transform", function (d, i) {
    return "translate(-50," + (0 + i * 20) + ")";
  });
  legend.append("rect").attr("x", width - 25).attr("width", 60).attr("height", 19).attr("fill", z);
  legend.append("text").attr("x", width - 24).attr("y", 18).attr("dy", "0.0em").text(function (d) {
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
    selectedPage: 4,
    playerDetail: {
      name: "<Player Name>"
    },
    overviewFilters: {},
    selectedMap: 1,
    settings: {
      selectedMethod: 1,
      start: 1,
      end: 1
    }
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
        initPage3(window.global_data);
      }

      if (x == 4) {
        initPage4(window.global_data);
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJkb2NzIiwiZm5jIiwiZ2V0TERBQ2x1c3RlcnMiLCJnZXRXb3JkMlZlY0NsdXN0ZXJzIiwibG9hZERGdW5jIiwicmVzcCIsImdsb2JhbF9kYXRhIiwiaW5pdFBhZ2UxIiwiaW5pdFBhZ2UyIiwiaW5pdFBhZ2UzIiwiaW5pdFBhZ2U0IiwibG9hZFZpc3VhbGl6YXRpb25zIiwicmVuZGVyQ2x1c3RlckFuYWx5c2lzIiwiaHRtbCIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwibG9hZFdvcmRDbG91ZCIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGFydCIsImVuZCIsInNlbGVjdGVkIiwiY29udGVudFR5cGUiLCJkYXRhVHlwZSIsInBhcnNlIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsInN2ZzEiLCJsZWdlbmQiLCJzbGljZSIsInJldmVyc2UiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwiaW5kZXhPZiIsInZ1ZUFwcCIsIlZ1ZSIsImVsIiwibWVzc2FnZSIsIm5vbmVTZWxlY3RlZCIsInNlbGVjdGVkUGFnZSIsInBsYXllckRldGFpbCIsIm92ZXJ2aWV3RmlsdGVycyIsInNlbGVjdGVkTWFwIiwic2V0dGluZ3MiLCJzZWxlY3RlZE1ldGhvZCIsIm1ldGhvZHMiLCJzZWxlY3RQYWdlIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVBQWtCLE9BQU8sSUFBUDtBQUNyQjs7QUFDRCxTQUFPLEtBQVA7QUFDSCxDQUxEOztBQU9BSCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JLLE1BQWhCLEdBQXlCLFlBQVc7QUFDaEMsTUFBSUMsR0FBRyxHQUFHLEVBQVY7O0FBQ0EsT0FBSSxJQUFJSCxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxDQUFDRyxHQUFHLENBQUNDLFFBQUosQ0FBYSxLQUFLSixDQUFMLENBQWIsQ0FBSixFQUEyQjtBQUN2QkcsTUFBQUEsR0FBRyxDQUFDRSxJQUFKLENBQVMsS0FBS0wsQ0FBTCxDQUFUO0FBQ0g7QUFDSjs7QUFDRCxT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QUFNLEVBQUVBO0FBRkYsT0FBVjtBQUlIOztBQUNEbk0sSUFBQUEsQ0FBQyxDQUFDLFlBQUQsQ0FBRCxDQUFnQjVFLE1BQWhCLENBQXVCLHFFQUFtRTRQLEtBQW5FLEdBQXlFLHVDQUFoRztBQUNBb0IsSUFBQUEsZUFBZSxDQUFDLFVBQVFwQixLQUFULEVBQWdCNVMsS0FBaEIsRUFBc0IsV0FBUzRTLEtBQS9CLENBQWY7QUFDSDtBQUNKOztBQUVELFNBQVNvQixlQUFULENBQXlCM1AsRUFBekIsRUFBNkJyRSxJQUE3QixFQUFtQ3VMLEtBQW5DLEVBQXlDO0FBQ3JDTCxFQUFBQSxVQUFVLENBQUNDLEtBQVgsQ0FBaUI5RyxFQUFqQixFQUFxQjtBQUNqQm9ILElBQUFBLE1BQU0sRUFBRSxDQUFDO0FBQ0w5RixNQUFBQSxJQUFJLEVBQUUsV0FERDtBQUVMM0YsTUFBQUEsSUFBSSxFQUFFQSxJQUZEO0FBR0xpVSxNQUFBQSxRQUFRLEVBQUU7QUFDTkMsUUFBQUEsSUFBSSxFQUFFLENBREE7QUFFTkMsUUFBQUEsRUFBRSxFQUFFLENBRkU7QUFHTkMsUUFBQUEsWUFBWSxFQUFFO0FBSFIsT0FITDtBQVFMMVAsTUFBQUEsSUFBSSxFQUFFO0FBUkQsS0FBRCxDQURTO0FBV2pCNkcsSUFBQUEsS0FBSyxFQUFFO0FBQ0hySSxNQUFBQSxJQUFJLEVBQUVxSTtBQURIO0FBWFUsR0FBckI7QUFlSCIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJBcnJheS5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbih2KSB7XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKHRoaXNbaV0gPT09IHYpIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuQXJyYXkucHJvdG90eXBlLnVuaXF1ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGFyciA9IFtdO1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZighYXJyLmluY2x1ZGVzKHRoaXNbaV0pKSB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKHRoaXNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcnI7IFxyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQoZGF0YSl7XHJcblx0dmFyIGRhdGFWYWwgPSBkYXRhW1widG9waWNfd29yZFwiXTtcclxuXHR2YXIgZmluYWxfZGljdCA9IHt9O1xyXG5cdGZvciAodmFyIGtleSBpbiBkYXRhVmFsKSB7XHJcblx0ICAgIGlmIChkYXRhVmFsLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHJcblx0ICAgIFx0dmFyIGNoaWxkcmVuV29yZHMgPSBkYXRhVmFsW2tleV07XHJcblxyXG5cdCAgICBcdGZvcih2YXIgY2hpbGRLZXkgaW4gY2hpbGRyZW5Xb3Jkcyl7XHJcblxyXG5cdCAgICBcdFx0aWYgKGNoaWxkcmVuV29yZHMuaGFzT3duUHJvcGVydHkoY2hpbGRLZXkpICYmIGNoaWxkcmVuV29yZHNbY2hpbGRLZXldID4gMC4wMSkge1xyXG5cclxuXHQgICAgXHRcdFx0aWYoIShjaGlsZEtleSBpbiBmaW5hbF9kaWN0KSl7XHJcblx0ICAgIFx0XHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0gPSBbXTtcclxuXHQgICAgXHRcdFx0fVxyXG4gICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XS5wdXNoKGtleSk7XHJcblx0ICAgIFx0XHRcdFxyXG5cdCAgICBcdFx0fVxyXG5cdCAgICBcdH0gXHJcblx0ICAgIH1cclxuICBcdH1cclxuICBcdHZhciBjbHVzdGVyX2RhdGEgPSB7XHJcbiAgXHRcdFwibmFtZVwiOlwiXCIsXHJcbiAgXHRcdFwiY2hpbGRyZW5cIjpbXVxyXG4gIFx0fVxyXG5cclxuICBcdHZhciBjb3VudD0wO1xyXG4gIFx0Zm9yKHZhciBrZXkgaW4gZmluYWxfZGljdCl7XHJcbiAgXHRcdGlmIChmaW5hbF9kaWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICBcdFx0XHRjb3VudCA9IGNvdW50ICsgMTtcclxuICBcdFx0XHR2YXIgaGFzaCA9IHt9O1xyXG4gIFx0XHRcdGhhc2hbXCJvcmRlclwiXSA9IGNvdW50O1xyXG4gIFx0XHRcdGhhc2hbXCJhbGlhc1wiXSA9IFwiV2hpdGUvcmVkL2phY2sgcGluZVwiO1xyXG4gIFx0XHRcdGhhc2hbXCJjb2xvclwiXSA9IFwiI0M3RUFGQlwiO1xyXG4gIFx0XHRcdGhhc2hbXCJuYW1lXCJdID0ga2V5O1xyXG5cclxuXHJcbiAgXHRcdFx0dmFyIGFycmF5X2NoaWxkID0gZmluYWxfZGljdFtrZXldLnVuaXF1ZSgpO1xyXG4gIFx0XHRcdHZhciBjaGlsZHMgPVtdO1xyXG4gIFx0XHRcdGZvcih2YXIgaT0wOyBpIDwgYXJyYXlfY2hpbGQubGVuZ3RoO2krKyl7XHJcbiAgXHRcdFx0XHR2YXIgY2hpbGRfaGFzaCA9IHt9O1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcIm9yZGVyXCJdID0gaSsxO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImFsaWFzXCJdID0gaSsxICsgXCJcIjtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJjb2xvclwiXSA9IFwiI0M3RUFGQlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcIm5hbWVcIl09IGFycmF5X2NoaWxkW2ldO1xyXG4gIFx0XHRcdFx0Y2hpbGRzLnB1c2goY2hpbGRfaGFzaCk7XHJcbiAgXHRcdFx0fVxyXG4gIFx0XHRcdGhhc2hbXCJjaGlsZHJlblwiXSA9IGNoaWxkcztcclxuICBcdFx0XHRjbHVzdGVyX2RhdGEuY2hpbGRyZW4ucHVzaChoYXNoKTtcclxuICBcdFx0fVxyXG4gIFx0fVxyXG4gIFx0dmFyIGQzID0gICB3aW5kb3cuZDNWMztcclxuICBcdHJlbmRlckNsdXN0ZXIoY2x1c3Rlcl9kYXRhLCBkMyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXIoY2x1c3Rlcl9kYXRhLCBkMyl7XHJcbiAgdmFyIHJhZGl1cyA9IDIwMDtcclxuICB2YXIgZGVuZG9ncmFtQ29udGFpbmVyID0gXCJzcGVjaWVzY29sbGFwc2libGVcIjtcclxuICB2YXIgZGVuZG9ncmFtRGF0YVNvdXJjZSA9IFwiZm9yZXN0U3BlY2llcy5qc29uXCI7XHJcblxyXG4gIHZhciByb290Tm9kZVNpemUgPSA2O1xyXG4gIHZhciBsZXZlbE9uZU5vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUd29Ob2RlU2l6ZSA9IDM7XHJcbiAgdmFyIGxldmVsVGhyZWVOb2RlU2l6ZSA9IDI7XHJcblxyXG5cclxuICB2YXIgaSA9IDA7XHJcbiAgdmFyIGR1cmF0aW9uID0gMzAwOyAvL0NoYW5naW5nIHZhbHVlIGRvZXNuJ3Qgc2VlbSBhbnkgY2hhbmdlcyBpbiB0aGUgZHVyYXRpb24gPz9cclxuXHJcbiAgdmFyIHJvb3RKc29uRGF0YTtcclxuXHJcbiAgdmFyIGNsdXN0ZXIgPSBkMy5sYXlvdXQuY2x1c3RlcigpXHJcbiAgICAgIC5zaXplKFszNjAscmFkaXVzIC0gMTIwXSlcclxuICAgICAgLnNlcGFyYXRpb24oZnVuY3Rpb24oYSwgYikge1xyXG4gICAgICAgIHJldHVybiAoYS5wYXJlbnQgPT0gYi5wYXJlbnQgPyAxIDogMikgLyBhLmRlcHRoO1xyXG4gICAgICB9KTtcclxuXHJcbiAgdmFyIGRpYWdvbmFsID0gZDMuc3ZnLmRpYWdvbmFsLnJhZGlhbCgpXHJcbiAgICAgIC5wcm9qZWN0aW9uKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFtkLnksIGQueCAvIDE4MCAqIE1hdGguUEldOyB9KTtcclxuXHJcbiAgdmFyIGNvbnRhaW5lckRpdiA9IGQzLnNlbGVjdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZW5kb2dyYW1Db250YWluZXIpKTtcclxuXHJcbiAgY29udGFpbmVyRGl2LmFwcGVuZChcImJ1dHRvblwiKVxyXG4gICAgICAuYXR0cihcImlkXCIsXCJjb2xsYXBzZS1idXR0b25cIilcclxuICAgICAgLnRleHQoXCJDb2xsYXBzZSFcIilcclxuICAgICAgLm9uKFwiY2xpY2tcIixjb2xsYXBzZUxldmVscyk7XHJcblxyXG4gIHZhciBzdmdSb290ID0gY29udGFpbmVyRGl2LmFwcGVuZChcInN2ZzpzdmdcIilcclxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXHJcbiAgICAgIC5hdHRyKFwidmlld0JveFwiLCBcIi1cIiArIChyYWRpdXMpICsgXCIgLVwiICsgKHJhZGl1cyAtIDUwKSArXCIgXCIrIHJhZGl1cyoyICtcIiBcIisgcmFkaXVzKjIpXHJcbiAgICAgIC5jYWxsKGQzLmJlaGF2aW9yLnpvb20oKS5zY2FsZSgwLjkpLnNjYWxlRXh0ZW50KFswLjEsIDNdKS5vbihcInpvb21cIiwgem9vbSkpLm9uKFwiZGJsY2xpY2suem9vbVwiLCBudWxsKVxyXG4gICAgICAuYXBwZW5kKFwic3ZnOmdcIik7XHJcblxyXG4gIC8vIEFkZCB0aGUgY2xpcHBpbmcgcGF0aFxyXG4gIHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmNsaXBQYXRoXCIpLmF0dHIoXCJpZFwiLCBcImNsaXBwZXItcGF0aFwiKVxyXG4gICAgICAuYXBwZW5kKFwic3ZnOnJlY3RcIilcclxuICAgICAgLmF0dHIoJ2lkJywgJ2NsaXAtcmVjdC1hbmltJyk7XHJcblxyXG4gIHZhciBhbmltR3JvdXAgPSBzdmdSb290LmFwcGVuZChcInN2ZzpnXCIpXHJcbiAgICAgIC5hdHRyKFwiY2xpcC1wYXRoXCIsIFwidXJsKCNjbGlwcGVyLXBhdGgpXCIpO1xyXG5cclxuICBcdHJvb3RKc29uRGF0YSA9IGNsdXN0ZXJfZGF0YTtcclxuXHJcbiAgICAvL1N0YXJ0IHdpdGggYWxsIGNoaWxkcmVuIGNvbGxhcHNlZFxyXG4gICAgcm9vdEpzb25EYXRhLmNoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xyXG5cclxuICAgIC8vSW5pdGlhbGl6ZSB0aGUgZGVuZHJvZ3JhbVxyXG4gIFx0Y3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHJvb3RKc29uRGF0YSk7XHJcblxyXG5cclxuXHJcblxyXG4gIGZ1bmN0aW9uIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShzb3VyY2UpIHtcclxuXHJcbiAgICAvLyBDb21wdXRlIHRoZSBuZXcgdHJlZSBsYXlvdXQuXHJcbiAgICB2YXIgbm9kZXMgPSBjbHVzdGVyLm5vZGVzKHJvb3RKc29uRGF0YSk7XHJcbiAgICB2YXIgcGF0aGxpbmtzID0gY2x1c3Rlci5saW5rcyhub2Rlcyk7XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIGZvciBub2RlcycgZml4ZWQtZGVwdGguXHJcbiAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgaWYoZC5kZXB0aCA8PTIpe1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqNzA7XHJcbiAgICAgIH1lbHNlXHJcbiAgICAgIHtcclxuICAgICAgICBkLnkgPSBkLmRlcHRoKjEwMDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRoZSBub2Rlc+KAplxyXG4gICAgdmFyIG5vZGUgPSBzdmdSb290LnNlbGVjdEFsbChcImcubm9kZVwiKVxyXG4gICAgICAgIC5kYXRhKG5vZGVzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLmlkIHx8IChkLmlkID0gKytpKTsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBub2RlcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZUVudGVyID0gbm9kZS5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxyXG4gICAgICAgIC5vbihcImNsaWNrXCIsIHRvZ2dsZUNoaWxkcmVuKTtcclxuXHJcbiAgICBub2RlRW50ZXIuYXBwZW5kKFwiY2lyY2xlXCIpO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInhcIiwgMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJzdGFydFwiKVxyXG4gICAgLnRleHQoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgaWYoZC5kZXB0aCA9PT0gMil7XHJcbiAgICAgICAgICAgIHJldHVybiBkLmFsaWFzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICByZXR1cm4gZC5uYW1lO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gbm9kZXMgdG8gdGhlaXIgbmV3IHBvc2l0aW9uLlxyXG4gICAgdmFyIG5vZGVVcGRhdGUgPSBub2RlLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInJvdGF0ZShcIiArIChkLnggLSA5MCkgKyBcIil0cmFuc2xhdGUoXCIgKyBkLnkgKyBcIilcIjsgfSlcclxuXHJcbiAgICBub2RlVXBkYXRlLnNlbGVjdChcImNpcmNsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3ROb2RlU2l6ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxPbmVOb2RlU2l6ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoZC5kZXB0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxUd29Ob2RlU2l6ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFRocmVlTm9kZVNpemU7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgIGlmKGQuZGVwdGggPT09MCl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCIjODA4MDgwXCI7XHJcbiAgICAgICAgICAgICAgIH1lbHNlIGlmKGQuZGVwdGggPT09IDEpe1xyXG4gICAgICAgICAgICAgICAgaWYoZC5uYW1lPT1cIkhhcmR3b29kc1wiKSByZXR1cm4gXCIjODE2ODU0XCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCIjQzNCOUEwXCI7XHJcbiAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGQuY29sb3I7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcInN0cm9rZVwiLGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICAgIGlmKGQuZGVwdGg+MSl7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIndoaXRlXCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcImxpZ2h0Z3JheVwiO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICBub2RlVXBkYXRlLnNlbGVjdChcInRleHRcIilcclxuXHJcbiAgICAgICAgLmF0dHIoJ2lkJywgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICB2YXIgb3JkZXIgPSAwO1xyXG4gICAgICAgICAgaWYoZC5vcmRlcilvcmRlciA9IGQub3JkZXI7XHJcbiAgICAgICAgICByZXR1cm4gJ1QtJyArIGQuZGVwdGggKyBcIi1cIiArIG9yZGVyO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IFwiZW5kXCIgOiBcInN0YXJ0XCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IFwic3RhcnRcIiA6IFwiZW5kXCI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcImR5XCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IFwiMS40ZW1cIiA6IFwiLTAuMmVtXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIFwiLjMxZW1cIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHhcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwOyAvL3JldHVybiBkLnggPiAxODAgPyAyIDogLTI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IDEgOiAtMjA7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA8IDIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInJvdGF0ZShcIiArICg5MCAtIGQueCkgKyBcIilcIjtcclxuICAgICAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGQueCA8IDE4MCA/IG51bGwgOiBcInJvdGF0ZSgxODApXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUT0RPOiBhcHByb3ByaWF0ZSB0cmFuc2Zvcm1cclxuICAgIHZhciBub2RlRXhpdCA9IG5vZGUuZXhpdCgpLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRoZSBsaW5rc+KAplxyXG4gICAgdmFyIGxpbmsgPSBzdmdSb290LnNlbGVjdEFsbChcInBhdGgubGlua1wiKVxyXG4gICAgICAgIC5kYXRhKHBhdGhsaW5rcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQuaWQ7IH0pO1xyXG5cclxuICAgIC8vIEVudGVyIGFueSBuZXcgbGlua3MgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxyXG4gICAgbGluay5lbnRlcigpLmluc2VydChcInBhdGhcIiwgXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgdmFyIG8gPSB7eDogc291cmNlLngwLCB5OiBzb3VyY2UueTB9O1xyXG4gICAgICAgICAgcmV0dXJuIGRpYWdvbmFsKHtzb3VyY2U6IG8sIHRhcmdldDogb30pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwiZmlsbFwiLGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgcmV0dXJuIGQuY29sb3I7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBsaW5rcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gZXhpdGluZyBub2RlcyB0byB0aGUgcGFyZW50J3MgbmV3IHBvc2l0aW9uLlxyXG4gICAgbGluay5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueCwgeTogc291cmNlLnl9O1xyXG4gICAgICAgICAgcmV0dXJuIGRpYWdvbmFsKHtzb3VyY2U6IG8sIHRhcmdldDogb30pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnJlbW92ZSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gVG9nZ2xlIGNoaWxkcmVuIG9uIGNsaWNrLlxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNoaWxkcmVuKGQsY2xpY2tUeXBlKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICBkLl9jaGlsZHJlbiA9IGQuY2hpbGRyZW47XHJcbiAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZC5jaGlsZHJlbiA9IGQuX2NoaWxkcmVuO1xyXG4gICAgICBkLl9jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgY2xpY2tUeXBlID09IHVuZGVmaW5lZCA/IFwibm9kZVwiIDogY2xpY2tUeXBlO1xyXG5cclxuICAgIC8vQWN0aXZpdGllcyBvbiBub2RlIGNsaWNrXHJcbiAgICBjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0oZCk7XHJcbiAgICBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKTtcclxuXHJcbiAgICBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLHR5cGUpO1xyXG5cclxuICB9XHJcblxyXG4gIC8vIENvbGxhcHNlIG5vZGVzXHJcbiAgZnVuY3Rpb24gY29sbGFwc2UoZCkge1xyXG4gICAgaWYgKGQuY2hpbGRyZW4pIHtcclxuICAgICAgICBkLl9jaGlsZHJlbiA9IGQuY2hpbGRyZW47XHJcbiAgICAgICAgZC5fY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcbiAgICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvLyBoaWdobGlnaHRzIHN1Ym5vZGVzIG9mIGEgbm9kZVxyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpIHtcclxuICAgICAgdmFyIGhpZ2hsaWdodExpbmtDb2xvciA9IFwiZGFya3NsYXRlZ3JheVwiOy8vXCIjZjAzYjIwXCI7XHJcbiAgICAgIHZhciBkZWZhdWx0TGlua0NvbG9yID0gXCJsaWdodGdyYXlcIjtcclxuXHJcbiAgICAgIHZhciBkZXB0aCA9ICBkLmRlcHRoO1xyXG4gICAgICB2YXIgbm9kZUNvbG9yID0gZC5jb2xvcjtcclxuICAgICAgaWYgKGRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICBub2RlQ29sb3IgPSBoaWdobGlnaHRMaW5rQ29sb3I7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBwYXRoTGlua3MgPSBzdmdSb290LnNlbGVjdEFsbChcInBhdGgubGlua1wiKTtcclxuXHJcbiAgICAgIHBhdGhMaW5rcy5zdHlsZShcInN0cm9rZVwiLGZ1bmN0aW9uKGRkKSB7XHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLmRlcHRoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGQubmFtZSA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5uYW1lID09PSBkLm5hbWUpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gbm9kZUNvbG9yO1xyXG4gICAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vV2Fsa2luZyBwYXJlbnRzJyBjaGFpbiBmb3Igcm9vdCB0byBub2RlIHRyYWNraW5nXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCxjbGlja1R5cGUpe1xyXG4gICAgdmFyIGFuY2VzdG9ycyA9IFtdO1xyXG4gICAgdmFyIHBhcmVudCA9IGQ7XHJcbiAgICB3aGlsZSAoIV8uaXNVbmRlZmluZWQocGFyZW50KSkge1xyXG4gICAgICAgIGFuY2VzdG9ycy5wdXNoKHBhcmVudCk7XHJcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgdGhlIG1hdGNoZWQgbGlua3NcclxuICAgIHZhciBtYXRjaGVkTGlua3MgPSBbXTtcclxuXHJcbiAgICBzdmdSb290LnNlbGVjdEFsbCgncGF0aC5saW5rJylcclxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5hbnkoYW5jZXN0b3JzLCBmdW5jdGlvbihwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcCA9PT0gZC50YXJnZXQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtYXRjaGVkTGlua3MucHVzaChkKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBhbmltYXRlQ2hhaW5zKG1hdGNoZWRMaW5rcyxjbGlja1R5cGUpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFuaW1hdGVDaGFpbnMobGlua3MsY2xpY2tUeXBlKXtcclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKFtdKVxyXG4gICAgICAgICAgLmV4aXQoKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuZGF0YShsaW5rcylcclxuICAgICAgICAgIC5lbnRlcigpLmFwcGVuZChcInN2ZzpwYXRoXCIpXHJcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG5cclxuICAgICAgLy9SZXNldCBwYXRoIGhpZ2hsaWdodCBpZiBjb2xsYXBzZSBidXR0b24gY2xpY2tlZFxyXG4gICAgICBpZihjbGlja1R5cGUgPT0gJ2J1dHRvbicpe1xyXG4gICAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpLmNsYXNzZWQoJ3Jlc2V0LXNlbGVjdGVkJyx0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIG92ZXJsYXlCb3ggPSBzdmdSb290Lm5vZGUoKS5nZXRCQm94KCk7XHJcblxyXG4gICAgICBzdmdSb290LnNlbGVjdChcIiNjbGlwLXJlY3QtYW5pbVwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJ4XCIsIC1yYWRpdXMpXHJcbiAgICAgICAgICAuYXR0cihcInlcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwwKVxyXG4gICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIixyYWRpdXMqMilcclxuICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHJhZGl1cyoyKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB6b29tKCkge1xyXG4gICAgIHN2Z1Jvb3QuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGQzLmV2ZW50LnRyYW5zbGF0ZSArIFwiKXNjYWxlKFwiICsgZDMuZXZlbnQuc2NhbGUgKyBcIilcIik7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjb2xsYXBzZUxldmVscygpe1xyXG5cclxuICAgIGlmKGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpKXtcclxuICAgICAgdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgdG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG4gICAgICAgICAgICAgICB0b2dnbGVDaGlsZHJlbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSwnYnV0dG9uJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xyXG4gICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgYW55IG5vZGVzIG9wZW5zIGF0IHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG5cclxuICAgICAgICAgIGZvcih2YXIgY2hpbGRJbmRleCA9IDAsIGNoaWxkTGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4PGNoaWxkTGVuZ3RoOyBjaGlsZEluZGV4Kyspe1xyXG5cclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc05vZGVPcGVuKGQpe1xyXG4gICAgICBpZihkLmNoaWxkcmVuKXtyZXR1cm4gdHJ1ZTt9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuXHJcblxyXG59XHJcblxyXG4gICIsImZ1bmN0aW9uIGxvYWRKcXVlcnkoKXtcclxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgJChcIiN0b2dnbGUtc2lkZWJhclwiKS5jbGljayhmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAkKCcudWkuc2lkZWJhcicpXHJcbiAgICAgICAgICAgICAgICAuc2lkZWJhcigndG9nZ2xlJylcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgfSk7XHJcbn1cclxuIiwicmVxdWlyZS5jb25maWcoe1xyXG4gICAgcGF0aHM6IHtcclxuICAgICAgICBcImQzXCI6IFwiaHR0cHM6Ly9kM2pzLm9yZy9kMy52My5taW5cIlxyXG4gICAgfVxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGxvYWREMygpe1xyXG5cclxuICAgIHdpbmRvdy5kM09sZCA9IGQzO1xyXG4gICAgcmVxdWlyZShbJ2QzJ10sIGZ1bmN0aW9uKGQzVjMpIHtcclxuICAgICAgICB3aW5kb3cuZDNWMyA9IGQzVjM7XHJcbiAgICAgICAgd2luZG93LmQzID0gZDNPbGQ7XHJcbiAgICAgICAgLy8gd2luZG93LmRvY3VtZW50cyA9IFtcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1wiaVwiLCBcImFtXCIsIFwiYmF0bWFuXCIsIFwib2ZcIiwgXCJ3aW50ZXJmYWxsXCJdLFxyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJ0aGVyZVwiLCBcInNob3VsZFwiLCBcImFsd2F5c1wiLCBcImJlXCIsIFwiYVwiLCBcInN0YXJrXCIsIFwiaW5cIiwgXCJ3aW50ZXJmZWxsXCJdLFxyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJwcm9waGVjeVwiLCBcInNheXNcIiwgXCJwcmluY2VcIiwgXCJ3aWxsXCIsIFwiYmVcIiAsIFwicmVib3JuXCJdXHJcbiAgICAgICAgLy8gICAgICAgICAvLyBdO1xyXG4gICAgICAgIC8vICAgICB3aW5kb3cuZG9jdW1lbnRzID0gW1sncHJvamVjdCcsICdjbGFzc2lmaWNhdGlvbicsICdjb21wYXJlJywgJ25ldXJhbCcsICduZXRzJywgJ1NWTScsICdkdWUnLCAnZHVlJ10sIFsndHdvJywgJ25ldycsICdwcm9ncmVzcycsICdjaGVja3MnLCAnZmluYWwnLCAncHJvamVjdCcsICAnYXNzaWduZWQnLCAnZm9sbG93cyddLCBbJ3JlcG9ydCcsICdncmFkZWQnLCAgJ2NvbnRyaWJ1dGUnLCAncG9pbnRzJywgICd0b3RhbCcsICdzZW1lc3RlcicsICdncmFkZSddLCBbJ3Byb2dyZXNzJywgJ3VwZGF0ZScsICdldmFsdWF0ZWQnLCAnVEEnLCAncGVlcnMnXSwgWydjbGFzcycsICdtZWV0aW5nJywgJ3RvbW9ycm93JywndGVhbXMnLCAnd29yaycsICdwcm9ncmVzcycsICdyZXBvcnQnLCAnZmluYWwnLCAncHJvamVjdCddLCBbICdxdWl6JywgICdzZWN0aW9ucycsICdyZWd1bGFyaXphdGlvbicsICdUdWVzZGF5J10sIFsgJ3F1aXonLCAnVGh1cnNkYXknLCAnbG9naXN0aWNzJywgJ3dvcmsnLCAnb25saW5lJywgJ3N0dWRlbnQnLCAncG9zdHBvbmUnLCAgJ3F1aXonLCAnVHVlc2RheSddLCBbJ3F1aXonLCAnY292ZXInLCAnVGh1cnNkYXknXSwgWydxdWl6JywgJ2NoYXAnLCAnY2hhcCcsICdsaW5lYXInLCAncmVncmVzc2lvbiddXTtcclxuICAgICAgICB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgICAgICBbJ3NlcmlvdXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3RhbGsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2ZyaWVuZHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2ZsYWt5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICdsYXRlbHknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3VuZGVyc3Rvb2QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2dvb2QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2V2ZW5pbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2hhbmdpbmcnXSxcclxuICAgICAgICAgICAgWydnb3QnLCAnZ2lmdCcsICdlbGRlcicsICdicm90aGVyJywgJ3JlYWxseScsICdzdXJwcmlzaW5nJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgIFsnY29tcGxldGVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICc1JyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtaWxlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAncnVuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICd3aXRob3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICdicmVhaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbWFrZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2ZlZWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3N0cm9uZyddLFxyXG5cclxuICAgICAgICAgICAgWydzb24nLCAncGVyZm9ybWVkJywgJ3dlbGwnLCAndGVzdCcsXHJcbiAgICAgICAgICAgICAgICAncHJlcGFyYXRpb24nXVxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGdldEFuYWx5c2lzKFwiTERBXCIpO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREb2NzKHRleHRzKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudHMgPSB0ZXh0cy5tYXAoeCA9PiB4LnNwbGl0KCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbmFseXNpcyhtZXRob2QpIHtcclxuICBsZXQgZG9jcyA9IHdpbmRvdy5kb2N1bWVudHM7XHJcbiAgbGV0IGZuYyA9IHggPT4geDtcclxuICBpZiAobWV0aG9kID09PSBcIkxEQVwiKSB7XHJcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcclxuXHJcbiAgfSBlbHNlIHtcclxuICAgIGZuYyA9IGdldFdvcmQyVmVjQ2x1c3RlcnM7XHJcbiAgfVxyXG4gIHdpbmRvdy5sb2FkREZ1bmMgPSAgZm5jO1xyXG4gIGZuYyhkb2NzLCByZXNwID0+IHtcclxuICAgICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcclxuICAgIGluaXRQYWdlMShyZXNwKTtcclxuICAgIGluaXRQYWdlMihyZXNwKTtcclxuICAgIGluaXRQYWdlMyhyZXNwKTtcclxuICAgIGluaXRQYWdlNCgpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlzdWFsaXphdGlvbnMoKSB7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMShyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMihyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KHJlc3ApO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UzKHJlc3Ape1xyXG4gICAgJChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5odG1sKFwiXCIpO1xyXG4gICAgJChcIiNwYy1jb250YWluZXJcIikuaHRtbChcIlwiKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCk7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKHJlc3ApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTQoKXtcclxuICAgICQoXCIjb3ZlcmFsbC13Y1wiKS5odG1sKCk7XHJcbiAgICBsb2FkV29yZENsb3VkKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXHJcbmZ1bmN0aW9uIGdldDJEVmVjdG9ycyh2ZWN0b3JzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiB2ZWN0b3JzXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXHJcbmZ1bmN0aW9uIGdldFdvcmQyVmVjQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IDEsIGVuZDogNSwgc2VsZWN0ZWQ6IDB9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldExEQURhdGFcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzLCBzdGFydDogMSwgZW5kOiA1LCBzZWxlY3RlZDogMH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgMCwgMCk7XHJcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xyXG4gICAgICAgICAgICBjaGFydDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwbGluZScsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxBeGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwbG90T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXAudG9Gcm9udCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XHJcbiAgICAgICAgICAgIC8vICAgICBwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3BvaW50LmNvbG9yfVwiPlxcdTI1Q0Y8L3NwYW4+JyArXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgJ3tzZXJpZXMubmFtZX06IDxiPntwb2ludC5mb3JtYXR0ZWRWYWx1ZX08L2I+PGJyLz4nXHJcbiAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgIHhBeGlzOiB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAnVG9waWMnLFxyXG4gICAgICAgICAgICAgICAgICAgICdXb3JkJ1xyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIG9mZnNldDogMTBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeUF4aXM6IFt7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uRG9jdW1lbnQgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC52YWx1ZXMocmVzcFtcIndvcmRzXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlwiK3gpXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBjb2xvcnM6IFsncmdiYSgxMSwgMjAwLCAyMDAsIDAuMSknXSxcclxuICAgICAgICAgICAgc2VyaWVzOiBkYXRhLm1hcChmdW5jdGlvbiAoc2V0LCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHNldCxcclxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG5cclxufVxyXG5cclxuXHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCl7XHJcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMzAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9LFxyXG4gICAgICAgIHdpZHRoID0gOTYwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIHggPSBkM1YzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcclxuICAgICAgICB5ID0ge30sXHJcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcclxuXHJcbiAgICB2YXIgbGluZSA9IGQzVjMuc3ZnLmxpbmUoKSxcclxuICAgICAgICBiYWNrZ3JvdW5kLFxyXG4gICAgICAgIGZvcmVncm91bmQ7XHJcblxyXG4gICAgdmFyIHN2ZyA9IGQzVjMuc2VsZWN0KFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcclxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKSwgZGltZW5zaW9ucztcclxuXHJcblxyXG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cclxuICAgIHZhciBjYXJzID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3AsIDAsIDApO1xyXG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxyXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XHJcblxyXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzVjMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcclxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXHJcbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxyXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxyXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XHJcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcclxuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XHJcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcclxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxyXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XHJcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xyXG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxyXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XHJcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcclxuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XHJcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxyXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcclxuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XHJcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XHJcbiAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcclxuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNjAwO1xyXG4gIHZhciBoZWlnaHQgPSA0MDA7XHJcbiAgdmFyIG1hcmdpbiA9IDgwO1xyXG4gIHZhciBkYXRhID0gW107XHJcblxyXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XHJcbiAgICBkYXRhLnB1c2goe1xyXG4gICAgICB4OiB2YWx1ZVswXSxcclxuICAgICAgeTogdmFsdWVbMV0sXHJcbiAgICAgIGM6IDEsXHJcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXHJcbiAgICAgIGtleToga2V5XHJcbiAgICB9KTtcclxuICB9KTtcclxuICB2YXIgbGFiZWxYID0gJ1gnO1xyXG4gIHZhciBsYWJlbFkgPSAnWSc7XHJcblxyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcclxuICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXHJcbiAgICAuYXR0cignaWQnLCdjbHVzdGVyX2lkJylcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcclxuXHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcclxuXHJcbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMTAsIDIwXSk7XHJcblxyXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xyXG5cclxuXHJcbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xyXG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxyXG4gICAgLmNhbGwoeUF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFkpO1xyXG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoeEF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXHJcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFgpO1xyXG5cclxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAuZGF0YShkYXRhKVxyXG4gICAgLmVudGVyKClcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXHJcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcclxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcclxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gb3BhY2l0eShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBcIiMxZjc3YjRcIjtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xyXG4gICAgICBmYWRlKGQuYywgLjEpO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICBmYWRlT3V0KCk7XHJcbiAgICB9KVxyXG4gICAgLnRyYW5zaXRpb24oKVxyXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XHJcbiAgICB9KVxyXG4gICAgLmR1cmF0aW9uKDUwMClcclxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQueSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAgIC8vIHRleHQgbGFiZWwgZm9yIHRoZSB4IGF4aXNcclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieFwiLCB3aWR0aClcclxuICAgIC5hdHRyKFwieVwiLCBoZWlnaHQgKzQwKVxyXG4gICAgLnRleHQoXCJQQ0ExXCIpO1xyXG5cclxuICBzdmcuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgbGFiZWxcIilcclxuICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC5hdHRyKFwieVwiLCAtNTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjc1ZW1cIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcclxuICAgIC50ZXh0KFwiUENBMlwiKTtcclxuXHJcblxyXG4gIGZ1bmN0aW9uIGZhZGUoYywgb3BhY2l0eSkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQuYyAhPSBjO1xyXG4gICAgICB9KVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgb3BhY2l0eSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIiNzdGFjay1iYXJcIikucmVtb3ZlKCk7XHJcbiAgIGQzLnNlbGVjdChcIiNsZWdlbmRzdmdcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGZpbmFsX2RhdGEgPSBbXTtcclxuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG4gICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIHZhciB0ZW1wID17fTtcclxuICAgICAgICB0ZW1wLlN0YXRlID0ga2V5O1xyXG4gICAgICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gZGF0YVZhbFtrZXldO1xyXG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcclxuICAgICAgICB0ZW1wLnRvdGFsID0gdGVtcC50b3BpY19mcmVxdWVuY3kgKyB0ZW1wLm92ZXJhbGw7XHJcbiAgICAgICAgZmluYWxfZGF0YS5wdXNoKHRlbXApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcblxyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGFja2VkLWJhcicpXHJcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICB3aWR0aCA9IDYwMDtcclxuXHJcbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xyXG4gIHZhciBoZWlnaHQgPSBkYXRhLmxlbmd0aCAqIDI1O1xyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwic3RhY2stYmFyXCIpLFxyXG4gICAgbWFyZ2luID0ge1xyXG4gICAgICB0b3A6IDIwLFxyXG4gICAgICByaWdodDogMjAsXHJcbiAgICAgIGJvdHRvbTogMzAsXHJcbiAgICAgIGxlZnQ6IDgwXHJcbiAgICB9LFxyXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgaGVpZ2h0ID0gK3N2Zy5hdHRyKFwiaGVpZ2h0XCIpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXHJcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xyXG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcclxuICAgIC5yYW5nZVJvdW5kKFswLCBoZWlnaHRdKSAvLyAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKVxyXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7IC8vIC5yYW5nZVJvdW5kKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XHJcbiAgdmFyIGtleXMgPSBbXCJ0b3BpY19mcmVxdWVuY3lcIiwgXCJvdmVyYWxsX2ZyZXF1ZW5jeVwiXTtcclxuICBkYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgIHJldHVybiBiLnRvdGFsIC0gYS50b3RhbDtcclxuICB9KTtcclxuICB5LmRvbWFpbihkYXRhLm1hcChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQuU3RhdGU7XHJcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxyXG5cclxuICB4LmRvbWFpbihbMCwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC50b3RhbDtcclxuICB9KV0pLm5pY2UoKTsgLy8geS5kb21haW4uLi5cclxuXHJcbiAgei5kb21haW4oa2V5cyk7XHJcbiAgZy5hcHBlbmQoXCJnXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShkMy5zdGFjaygpLmtleXMoa2V5cykoZGF0YSkpLmVudGVyKCkuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geihkLmtleSk7XHJcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQ7XHJcbiAgICB9KS5lbnRlcigpLmFwcGVuZChcInJlY3RcIikuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcclxuICAgIH0pIC8vLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHgoZC5kYXRhLlN0YXRlKTsgfSlcclxuICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkWzBdKTtcclxuICAgIH0pIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFsxXSk7IH0pICBcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xyXG4gICAgfSkgLy8uYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMF0pIC0geShkWzFdKTsgfSlcclxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHkuYmFuZHdpZHRoKCkpXHJcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpIC8vICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKSAvLyBOZXcgbGluZVxyXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieVwiLCAyKSAvLyAgICAgLmF0dHIoXCJ5XCIsIDIpXHJcbiAgICAuYXR0cihcInhcIiwgeCh4LnRpY2tzKCkucG9wKCkpICsgMC41KSAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcclxuICBcclxuXHJcblxyXG5cclxuICB2YXIgc3ZnMSA9IGQzLnNlbGVjdChcIiNsZWdlbmRUXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcImxlZ2VuZHN2Z1wiKVxyXG52YXIgbGVnZW5kID0gc3ZnMS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGggLSAyNSkuYXR0cihcIndpZHRoXCIsIDYwKS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI0KS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xyXG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xyXG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcclxuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcclxuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5cclxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xyXG4gICAgZWw6ICcjdnVlLWFwcCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcclxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiA0LFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMSxcclxuICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZE1ldGhvZDogMSxcclxuICAgICAgICAgICAgc3RhcnQ6IDEsXHJcbiAgICAgICAgICAgIGVuZDogMVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtZXRob2RzOiB7XHJcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRQYWdlID0geDtcclxuICAgICAgICAgICAgaWYgKHggPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMih3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gNCl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtb3VudGVkOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcclxuICAgICAgICBsb2FkRDMoKTtcclxuICAgICAgICBsb2FkSnF1ZXJ5KCk7XHJcbiAgICB9XHJcbn0pOyIsImZ1bmN0aW9uIGxvYWRXb3JkQ2xvdWQocmVzcCl7XHJcbiAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdO1xyXG4gICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgY3JlYXRlV29yZENsb3VkKFwib3ZlcmFsbC13Y1wiLCBkYXRhLCBcIkFsbCBEb2N1bWVudHNcIik7XHJcblxyXG4gICAgZm9yKHZhciB0b3BpYyBpbiByZXNwW1widG9waWNfd29yZFwiXSl7XHJcbiAgICAgICAgbGV0IGRhdGEgPSBbXTtcclxuICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHdvcmQsXHJcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJChcIiN0b3BpYy13Y3NcIikuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29sLXNtLTZcIj48ZGl2IHN0eWxlPVwib3V0bGluZTogc29saWQgMXB4O1wiIGlkPVwidG9waWMnK3RvcGljKydcIiBzdHlsZT1cImhlaWdodDogMzAwcHg7XCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgY3JlYXRlV29yZENsb3VkKFwidG9waWNcIit0b3BpYywgZGF0YSwgXCJUb3BpYyBcIit0b3BpYyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdvcmRDbG91ZChpZCwgZGF0YSwgdGl0bGUpe1xyXG4gICAgSGlnaGNoYXJ0cy5jaGFydChpZCwge1xyXG4gICAgICAgIHNlcmllczogW3tcclxuICAgICAgICAgICAgdHlwZTogJ3dvcmRjbG91ZCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgIHJvdGF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBmcm9tOiAwLFxyXG4gICAgICAgICAgICAgICAgdG86IDAsXHJcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbnM6IDVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbmFtZTogJ1Njb3JlJ1xyXG4gICAgICAgIH1dLFxyXG4gICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRpdGxlXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0iXX0=
