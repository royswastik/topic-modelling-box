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
    getAnalysis("word2vec");
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
      end: 1,
      ldaTopicThreshold: 0,
      word2VecThreshold: 0
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJkb2NzIiwiZm5jIiwiZ2V0TERBQ2x1c3RlcnMiLCJnZXRXb3JkMlZlY0NsdXN0ZXJzIiwibG9hZERGdW5jIiwicmVzcCIsImdsb2JhbF9kYXRhIiwiaW5pdFBhZ2UxIiwiaW5pdFBhZ2UyIiwiaW5pdFBhZ2UzIiwiaW5pdFBhZ2U0IiwibG9hZFZpc3VhbGl6YXRpb25zIiwicmVuZGVyQ2x1c3RlckFuYWx5c2lzIiwiaHRtbCIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwibG9hZFdvcmRDbG91ZCIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGFydCIsImVuZCIsInNlbGVjdGVkIiwiY29udGVudFR5cGUiLCJkYXRhVHlwZSIsInBhcnNlIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsInN2ZzEiLCJsZWdlbmQiLCJzbGljZSIsInJldmVyc2UiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwiaW5kZXhPZiIsInZ1ZUFwcCIsIlZ1ZSIsImVsIiwibWVzc2FnZSIsIm5vbmVTZWxlY3RlZCIsInNlbGVjdGVkUGFnZSIsInBsYXllckRldGFpbCIsIm92ZXJ2aWV3RmlsdGVycyIsInNlbGVjdGVkTWFwIiwic2V0dGluZ3MiLCJzZWxlY3RlZE1ldGhvZCIsImxkYVRvcGljVGhyZXNob2xkIiwid29yZDJWZWNUaHJlc2hvbGQiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsIm1vdW50ZWQiLCJ3ZWlnaHQiLCJjcmVhdGVXb3JkQ2xvdWQiLCJyb3RhdGlvbiIsImZyb20iLCJ0byIsIm9yaWVudGF0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBQSxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFFBQWhCLEdBQTJCLFVBQVNDLENBQVQsRUFBWTtBQUNuQyxPQUFJLElBQUlDLENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLQyxNQUF4QixFQUFnQ0QsQ0FBQyxFQUFqQyxFQUFxQztBQUNqQyxRQUFHLEtBQUtBLENBQUwsTUFBWUQsQ0FBZixFQUFrQixPQUFPLElBQVA7QUFDckI7O0FBQ0QsU0FBTyxLQUFQO0FBQ0gsQ0FMRDs7QUFPQUgsS0FBSyxDQUFDQyxTQUFOLENBQWdCSyxNQUFoQixHQUF5QixZQUFXO0FBQ2hDLE1BQUlDLEdBQUcsR0FBRyxFQUFWOztBQUNBLE9BQUksSUFBSUgsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsQ0FBQ0csR0FBRyxDQUFDQyxRQUFKLENBQWEsS0FBS0osQ0FBTCxDQUFiLENBQUosRUFBMkI7QUFDdkJHLE1BQUFBLEdBQUcsQ0FBQ0UsSUFB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LEVBQTBCRSxJQUExQixDQUFiOztBQUNBOVMsTUFBQUEsS0FBSSxDQUFDRixJQUFMLENBQVU7QUFDTjRFLFFBQUFBLElBQUksRUFBRW9PLElBREE7QUFFTm1CLFFBQUFBLE1BQU0sRUFBRUE7QUFGRixPQUFWO0FBSUg7O0FBQ0RyTSxJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCNUUsTUFBaEIsQ0FBdUIscUVBQW1FNFAsS0FBbkUsR0FBeUUsdUNBQWhHO0FBQ0FzQixJQUFBQSxlQUFlLENBQUMsVUFBUXRCLEtBQVQsRUFBZ0I1UyxLQUFoQixFQUFzQixXQUFTNFMsS0FBL0IsQ0FBZjtBQUNIO0FBQ0o7O0FBRUQsU0FBU3NCLGVBQVQsQ0FBeUI3UCxFQUF6QixFQUE2QnJFLElBQTdCLEVBQW1DdUwsS0FBbkMsRUFBeUM7QUFDckNMLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBWCxDQUFpQjlHLEVBQWpCLEVBQXFCO0FBQ2pCb0gsSUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDTDlGLE1BQUFBLElBQUksRUFBRSxXQUREO0FBRUwzRixNQUFBQSxJQUFJLEVBQUVBLElBRkQ7QUFHTG1VLE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxJQUFJLEVBQUUsQ0FEQTtBQUVOQyxRQUFBQSxFQUFFLEVBQUUsQ0FGRTtBQUdOQyxRQUFBQSxZQUFZLEVBQUU7QUFIUixPQUhMO0FBUUw1UCxNQUFBQSxJQUFJLEVBQUU7QUFSRCxLQUFELENBRFM7QUFXakI2RyxJQUFBQSxLQUFLLEVBQUU7QUFDSHJJLE1BQUFBLElBQUksRUFBRXFJO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYodGhpc1tpXSA9PT0gdikgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKCFhcnIuaW5jbHVkZXModGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChkYXRhKXtcclxuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xyXG5cdHZhciBmaW5hbF9kaWN0ID0ge307XHJcblx0Zm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cclxuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcclxuXHJcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcclxuXHJcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiAwLjAxKSB7XHJcblxyXG5cdCAgICBcdFx0XHRpZighKGNoaWxkS2V5IGluIGZpbmFsX2RpY3QpKXtcclxuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xyXG5cdCAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldLnB1c2goa2V5KTtcclxuXHQgICAgXHRcdFx0XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSBcclxuXHQgICAgfVxyXG4gIFx0fVxyXG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcclxuICBcdFx0XCJuYW1lXCI6XCJcIixcclxuICBcdFx0XCJjaGlsZHJlblwiOltdXHJcbiAgXHR9XHJcblxyXG4gIFx0dmFyIGNvdW50PTA7XHJcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcclxuICBcdFx0aWYgKGZpbmFsX2RpY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xyXG4gIFx0XHRcdHZhciBoYXNoID0ge307XHJcbiAgXHRcdFx0aGFzaFtcIm9yZGVyXCJdID0gY291bnQ7XHJcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XHJcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0aGFzaFtcIm5hbWVcIl0gPSBrZXk7XHJcblxyXG5cclxuICBcdFx0XHR2YXIgYXJyYXlfY2hpbGQgPSBmaW5hbF9kaWN0W2tleV0udW5pcXVlKCk7XHJcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XHJcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcclxuICBcdFx0XHRcdHZhciBjaGlsZF9oYXNoID0ge307XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiYWxpYXNcIl0gPSBpKzEgKyBcIlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XHJcbiAgXHRcdFx0XHRjaGlsZHMucHVzaChjaGlsZF9oYXNoKTtcclxuICBcdFx0XHR9XHJcbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xyXG4gIFx0XHRcdGNsdXN0ZXJfZGF0YS5jaGlsZHJlbi5wdXNoKGhhc2gpO1xyXG4gIFx0XHR9XHJcbiAgXHR9XHJcbiAgXHR2YXIgZDMgPSAgIHdpbmRvdy5kM1YzO1xyXG4gIFx0cmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKXtcclxuICB2YXIgcmFkaXVzID0gMjAwO1xyXG4gIHZhciBkZW5kb2dyYW1Db250YWluZXIgPSBcInNwZWNpZXNjb2xsYXBzaWJsZVwiO1xyXG4gIHZhciBkZW5kb2dyYW1EYXRhU291cmNlID0gXCJmb3Jlc3RTcGVjaWVzLmpzb25cIjtcclxuXHJcbiAgdmFyIHJvb3ROb2RlU2l6ZSA9IDY7XHJcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUaHJlZU5vZGVTaXplID0gMjtcclxuXHJcblxyXG4gIHZhciBpID0gMDtcclxuICB2YXIgZHVyYXRpb24gPSAzMDA7IC8vQ2hhbmdpbmcgdmFsdWUgZG9lc24ndCBzZWVtIGFueSBjaGFuZ2VzIGluIHRoZSBkdXJhdGlvbiA/P1xyXG5cclxuICB2YXIgcm9vdEpzb25EYXRhO1xyXG5cclxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcclxuICAgICAgLnNpemUoWzM2MCxyYWRpdXMgLSAxMjBdKVxyXG4gICAgICAuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XHJcbiAgICAgIH0pO1xyXG5cclxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcclxuICAgICAgLnByb2plY3Rpb24oZnVuY3Rpb24oZCkgeyByZXR1cm4gW2QueSwgZC54IC8gMTgwICogTWF0aC5QSV07IH0pO1xyXG5cclxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xyXG5cclxuICBjb250YWluZXJEaXYuYXBwZW5kKFwiYnV0dG9uXCIpXHJcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxyXG4gICAgICAudGV4dChcIkNvbGxhcHNlIVwiKVxyXG4gICAgICAub24oXCJjbGlja1wiLGNvbGxhcHNlTGV2ZWxzKTtcclxuXHJcbiAgdmFyIHN2Z1Jvb3QgPSBjb250YWluZXJEaXYuYXBwZW5kKFwic3ZnOnN2Z1wiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiLVwiICsgKHJhZGl1cykgKyBcIiAtXCIgKyAocmFkaXVzIC0gNTApICtcIiBcIisgcmFkaXVzKjIgK1wiIFwiKyByYWRpdXMqMilcclxuICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLnNjYWxlKDAuOSkuc2NhbGVFeHRlbnQoWzAuMSwgM10pLm9uKFwiem9vbVwiLCB6b29tKSkub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcclxuXHJcbiAgLy8gQWRkIHRoZSBjbGlwcGluZyBwYXRoXHJcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6cmVjdFwiKVxyXG4gICAgICAuYXR0cignaWQnLCAnY2xpcC1yZWN0LWFuaW0nKTtcclxuXHJcbiAgdmFyIGFuaW1Hcm91cCA9IHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmdcIilcclxuICAgICAgLmF0dHIoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI2NsaXBwZXItcGF0aClcIik7XHJcblxyXG4gIFx0cm9vdEpzb25EYXRhID0gY2x1c3Rlcl9kYXRhO1xyXG5cclxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXHJcbiAgICByb290SnNvbkRhdGEuY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcblxyXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXHJcbiAgXHRjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0ocm9vdEpzb25EYXRhKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIG5ldyB0cmVlIGxheW91dC5cclxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcclxuICAgIHZhciBwYXRobGlua3MgPSBjbHVzdGVyLmxpbmtzKG5vZGVzKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cclxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICBpZihkLmRlcHRoIDw9Mil7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcclxuICAgICAgfWVsc2VcclxuICAgICAge1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG5vZGVz4oCmXHJcbiAgICB2YXIgbm9kZSA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwiZy5ub2RlXCIpXHJcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IG5vZGVzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9nZ2xlQ2hpbGRyZW4pO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJjaXJjbGVcIik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICBpZihkLmRlcHRoID09PSAyKXtcclxuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBkLm5hbWU7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZVVwZGF0ZSA9IG5vZGUudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbE9uZU5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFR3b05vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVGhyZWVOb2RlU2l6ZTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgaWYoZC5kZXB0aCA9PT0wKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2UgaWYoZC5kZXB0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZihkLm5hbWU9PVwiSGFyZHdvb2RzXCIpIHJldHVybiBcIiM4MTY4NTRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwid2hpdGVcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlnaHRncmF5XCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwidGV4dFwiKVxyXG5cclxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHZhciBvcmRlciA9IDA7XHJcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcclxuICAgICAgICAgIHJldHVybiAnVC0nICsgZC5kZXB0aCArIFwiLVwiICsgb3JkZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJlbmRcIiA6IFwic3RhcnRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJzdGFydFwiIDogXCJlbmRcIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCIxLjRlbVwiIDogXCItMC4yZW1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCIuMzFlbVwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7IC8vcmV0dXJuIGQueCA+IDE4MCA/IDIgOiAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gMSA6IC0yMDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKDkwIC0gZC54KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gbnVsbCA6IFwicm90YXRlKDE4MClcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86IGFwcHJvcHJpYXRlIHRyYW5zZm9ybVxyXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtz4oCmXHJcbiAgICB2YXIgbGluayA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpXHJcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBsaW5rcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGxpbmtzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54LCB5OiBzb3VyY2UueX07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBUb2dnbGUgY2hpbGRyZW4gb24gY2xpY2suXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2hpbGRyZW4oZCxjbGlja1R5cGUpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkLmNoaWxkcmVuID0gZC5fY2hpbGRyZW47XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBjbGlja1R5cGUgPT0gdW5kZWZpbmVkID8gXCJub2RlXCIgOiBjbGlja1R5cGU7XHJcblxyXG4gICAgLy9BY3Rpdml0aWVzIG9uIG5vZGUgY2xpY2tcclxuICAgIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShkKTtcclxuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xyXG5cclxuICAgIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsdHlwZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQ29sbGFwc2Ugbm9kZXNcclxuICBmdW5jdGlvbiBjb2xsYXBzZShkKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgICBkLl9jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuICAgICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIGhpZ2hsaWdodHMgc3Vibm9kZXMgb2YgYSBub2RlXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCkge1xyXG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcclxuICAgICAgdmFyIGRlZmF1bHRMaW5rQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG5cclxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XHJcbiAgICAgIHZhciBub2RlQ29sb3IgPSBkLmNvbG9yO1xyXG4gICAgICBpZiAoZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xyXG5cclxuICAgICAgcGF0aExpbmtzLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZGQpIHtcclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZC5uYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLm5hbWUgPT09IGQubmFtZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBub2RlQ29sb3I7XHJcbiAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcclxuICBmdW5jdGlvbiBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLGNsaWNrVHlwZSl7XHJcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XHJcbiAgICB2YXIgcGFyZW50ID0gZDtcclxuICAgIHdoaWxlICghXy5pc1VuZGVmaW5lZChwYXJlbnQpKSB7XHJcbiAgICAgICAgYW5jZXN0b3JzLnB1c2gocGFyZW50KTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xyXG4gICAgdmFyIG1hdGNoZWRMaW5rcyA9IFtdO1xyXG5cclxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCwgaSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwID09PSBkLnRhcmdldDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1hdGNoZWRMaW5rcy5wdXNoKGQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGFuaW1hdGVDaGFpbnMobWF0Y2hlZExpbmtzLGNsaWNrVHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZUNoYWlucyhsaW5rcyxjbGlja1R5cGUpe1xyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEoW10pXHJcbiAgICAgICAgICAuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKGxpbmtzKVxyXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwic3ZnOnBhdGhcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcblxyXG4gICAgICAvL1Jlc2V0IHBhdGggaGlnaGxpZ2h0IGlmIGNvbGxhcHNlIGJ1dHRvbiBjbGlja2VkXHJcbiAgICAgIGlmKGNsaWNrVHlwZSA9PSAnYnV0dG9uJyl7XHJcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcclxuXHJcbiAgICAgIHN2Z1Jvb3Quc2VsZWN0KFwiI2NsaXAtcmVjdC1hbmltXCIpXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLDApXHJcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxyXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcmFkaXVzKjIpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHpvb20oKSB7XHJcbiAgICAgc3ZnUm9vdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlTGV2ZWxzKCl7XHJcblxyXG4gICAgaWYoY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCkpe1xyXG4gICAgICB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcbiAgICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTm9kZU9wZW4oZCl7XHJcbiAgICAgIGlmKGQuY2hpbGRyZW4pe3JldHVybiB0cnVlO31cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKFwiI3RvZ2dsZS1zaWRlYmFyXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcclxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxufVxyXG4iLCJyZXF1aXJlLmNvbmZpZyh7XHJcbiAgICBwYXRoczoge1xyXG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gbG9hZEQzKCl7XHJcblxyXG4gICAgd2luZG93LmQzT2xkID0gZDM7XHJcbiAgICByZXF1aXJlKFsnZDMnXSwgZnVuY3Rpb24oZDNWMykge1xyXG4gICAgICAgIHdpbmRvdy5kM1YzID0gZDNWMztcclxuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcclxuICAgICAgICAvLyB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInRoZXJlXCIsIFwic2hvdWxkXCIsIFwiYWx3YXlzXCIsIFwiYmVcIiwgXCJhXCIsIFwic3RhcmtcIiwgXCJpblwiLCBcIndpbnRlcmZlbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInByb3BoZWN5XCIsIFwic2F5c1wiLCBcInByaW5jZVwiLCBcIndpbGxcIiwgXCJiZVwiICwgXCJyZWJvcm5cIl1cclxuICAgICAgICAvLyAgICAgICAgIC8vIF07XHJcbiAgICAgICAgLy8gICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbWydwcm9qZWN0JywgJ2NsYXNzaWZpY2F0aW9uJywgJ2NvbXBhcmUnLCAnbmV1cmFsJywgJ25ldHMnLCAnU1ZNJywgJ2R1ZScsICdkdWUnXSwgWyd0d28nLCAnbmV3JywgJ3Byb2dyZXNzJywgJ2NoZWNrcycsICdmaW5hbCcsICdwcm9qZWN0JywgICdhc3NpZ25lZCcsICdmb2xsb3dzJ10sIFsncmVwb3J0JywgJ2dyYWRlZCcsICAnY29udHJpYnV0ZScsICdwb2ludHMnLCAgJ3RvdGFsJywgJ3NlbWVzdGVyJywgJ2dyYWRlJ10sIFsncHJvZ3Jlc3MnLCAndXBkYXRlJywgJ2V2YWx1YXRlZCcsICdUQScsICdwZWVycyddLCBbJ2NsYXNzJywgJ21lZXRpbmcnLCAndG9tb3Jyb3cnLCd0ZWFtcycsICd3b3JrJywgJ3Byb2dyZXNzJywgJ3JlcG9ydCcsICdmaW5hbCcsICdwcm9qZWN0J10sIFsgJ3F1aXonLCAgJ3NlY3Rpb25zJywgJ3JlZ3VsYXJpemF0aW9uJywgJ1R1ZXNkYXknXSwgWyAncXVpeicsICdUaHVyc2RheScsICdsb2dpc3RpY3MnLCAnd29yaycsICdvbmxpbmUnLCAnc3R1ZGVudCcsICdwb3N0cG9uZScsICAncXVpeicsICdUdWVzZGF5J10sIFsncXVpeicsICdjb3ZlcicsICdUaHVyc2RheSddLCBbJ3F1aXonLCAnY2hhcCcsICdjaGFwJywgJ2xpbmVhcicsICdyZWdyZXNzaW9uJ11dO1xyXG4gICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgICAgIFsnc2VyaW91cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndGFsaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZnJpZW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmxha3knLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2xhdGVseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzdG9vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZ29vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnaGFuZ2luZyddLFxyXG4gICAgICAgICAgICBbJ2dvdCcsICdnaWZ0JywgJ2VsZGVyJywgJ2Jyb3RoZXInLCAncmVhbGx5JywgJ3N1cnByaXNpbmcnXSxcclxuICAgICAgICAgICAgICAgICAgICAgWydjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21pbGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdydW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3dpdGhvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2JyZWFrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtYWtlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmVlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnc3Ryb25nJ10sXHJcblxyXG4gICAgICAgICAgICBbJ3NvbicsICdwZXJmb3JtZWQnLCAnd2VsbCcsICd0ZXN0JyxcclxuICAgICAgICAgICAgICAgICdwcmVwYXJhdGlvbiddXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0QW5hbHlzaXMoXCJ3b3JkMnZlY1wiKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0cykge1xyXG4gIHJldHVybiB3aW5kb3cuZG9jdW1lbnRzID0gdGV4dHMubWFwKHggPT4geC5zcGxpdCgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QW5hbHlzaXMobWV0aG9kKSB7XHJcbiAgbGV0IGRvY3MgPSB3aW5kb3cuZG9jdW1lbnRzO1xyXG4gIGxldCBmbmMgPSB4ID0+IHg7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJMREFcIikge1xyXG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XHJcblxyXG4gIH0gZWxzZSB7XHJcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xyXG4gIH1cclxuICB3aW5kb3cubG9hZERGdW5jID0gIGZuYztcclxuICBmbmMoZG9jcywgcmVzcCA9PiB7XHJcbiAgICAgIHdpbmRvdy5nbG9iYWxfZGF0YSA9IHJlc3A7XHJcbiAgICBpbml0UGFnZTEocmVzcCk7XHJcbiAgICBpbml0UGFnZTIocmVzcCk7XHJcbiAgICBpbml0UGFnZTMocmVzcCk7XHJcbiAgICBpbml0UGFnZTQoKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZFZpc3VhbGl6YXRpb25zKCkge1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTIocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChyZXNwKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMyhyZXNwKXtcclxuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjcGMtY29udGFpbmVyXCIpLmh0bWwoXCJcIik7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3ApO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2U0KCl7XHJcbiAgICAkKFwiI292ZXJhbGwtd2NcIikuaHRtbCgpO1xyXG4gICAgbG9hZFdvcmRDbG91ZCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxyXG5mdW5jdGlvbiBnZXQyRFZlY3RvcnModmVjdG9ycywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogdmVjdG9yc1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICB9KTtcclxufVxyXG5cclxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxyXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiAxLCBlbmQ6IDUsIHNlbGVjdGVkOiAwfSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhKU09OLnBhcnNlKHJlc3BvbnNlKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TERBQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRMREFEYXRhXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IDEsIGVuZDogNSwgc2VsZWN0ZWQ6IDB9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCl7XHJcblxyXG5cclxuICAgICAgICBsZXQgZGF0YSA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3AsIDAsIDApO1xyXG4gICAgICAgIEhpZ2hjaGFydHMuY2hhcnQoJ3BjLWNvbnRhaW5lcicsIHtcclxuICAgICAgICAgICAgY2hhcnQ6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGxpbmUnLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxDb29yZGluYXRlczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQXhlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogMlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICAgICAgdGV4dDogJ0RvY3VtZW50IC0gVG9waWMgLSBXb3JkIFJlbGF0aW9uc2hpcCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcGxvdE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHNlcmllczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYWxvOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBldmVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW91c2VPdmVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyb3VwLnRvRnJvbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gdG9vbHRpcDoge1xyXG4gICAgICAgICAgICAvLyAgICAgcG9pbnRGb3JtYXQ6ICc8c3BhbiBzdHlsZT1cImNvbG9yOntwb2ludC5jb2xvcn1cIj5cXHUyNUNGPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICd7c2VyaWVzLm5hbWV9OiA8Yj57cG9pbnQuZm9ybWF0dGVkVmFsdWV9PC9iPjxici8+J1xyXG4gICAgICAgICAgICAvLyB9LFxyXG4gICAgICAgICAgICB4QXhpczoge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogW1xyXG4gICAgICAgICAgICAgICAgICAgICdEb2N1bWVudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1RvcGljJyxcclxuICAgICAgICAgICAgICAgICAgICAnV29yZCdcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHlBeGlzOiBbe1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLkRvY3VtZW50IFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Ub3BpYyBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3QudmFsdWVzKHJlc3BbXCJ3b3Jkc1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5cIit4KVxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgY29sb3JzOiBbJ3JnYmEoMTEsIDIwMCwgMjAwLCAwLjEpJ10sXHJcbiAgICAgICAgICAgIHNlcmllczogZGF0YS5tYXAoZnVuY3Rpb24gKHNldCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBzZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hhZG93OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3Ape1xyXG4gICAgdmFyIG1hcmdpbiA9IHt0b3A6IDMwLCByaWdodDogMTAsIGJvdHRvbTogMTAsIGxlZnQ6IDEwfSxcclxuICAgICAgICB3aWR0aCA9IDk2MCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgICAgIGhlaWdodCA9IDUwMCAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tO1xyXG5cclxuICAgIHZhciB4ID0gZDNWMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIHdpZHRoXSwgMSksXHJcbiAgICAgICAgeSA9IHt9LFxyXG4gICAgICAgIGRyYWdnaW5nID0ge307XHJcblxyXG4gICAgdmFyIGxpbmUgPSBkM1YzLnN2Zy5saW5lKCksXHJcbiAgICAgICAgYmFja2dyb3VuZCxcclxuICAgICAgICBmb3JlZ3JvdW5kO1xyXG5cclxuICAgIHZhciBzdmcgPSBkM1YzLnNlbGVjdChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXHJcbiAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b20pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIiksIGRpbWVuc2lvbnM7XHJcblxyXG5cclxuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXHJcbiAgICB2YXIgY2FycyA9IGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwLCAwLCAwKTtcclxuICAgIC8vIHZhciBheGlzRCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubGVuZ3RoKSxcclxuICAgIHZhciBheGlzRCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxyXG4gICAgICAgIGF4aXNUID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhyZXNwW1widG9waWNzXCJdLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1cgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC52YWx1ZXMocmVzcFtcIm92ZXJhbGxfd29yZFwiXSkubWFwKHggPT4gcGFyc2VGbG9hdCh4KSkpO1xyXG5cclxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMgPSBkM1YzLmtleXMoY2Fyc1swXSkuZmlsdGVyKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gZCAhPSBcIm5hbWVcIiAmJiAoeVtkXSA9IGQzVjMuc2NhbGUubGluZWFyKClcclxuICAgICAgICAgICAgLmRvbWFpbihkM1YzLmV4dGVudChjYXJzLCBmdW5jdGlvbihwKSB7IHJldHVybiArcFtkXTsgfSkpXHJcbiAgICAgICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSkpO1xyXG4gICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBncmV5IGJhY2tncm91bmQgbGluZXMgZm9yIGNvbnRleHQuXHJcbiAgICBiYWNrZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxyXG4gICAgZm9yZWdyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImZvcmVncm91bmRcIilcclxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxyXG4gICAgICAgIC5kYXRhKGNhcnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuXHJcbiAgICAvLyBBZGQgYSBncm91cCBlbGVtZW50IGZvciBlYWNoIGRpbWVuc2lvbi5cclxuICAgIHZhciBnID0gc3ZnLnNlbGVjdEFsbChcIi5kaW1lbnNpb25cIilcclxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZGltZW5zaW9uXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgLmNhbGwoZDNWMy5iZWhhdmlvci5kcmFnKClcclxuICAgICAgICAgICAgLm9yaWdpbihmdW5jdGlvbihkKSB7IHJldHVybiB7eDogeChkKX07IH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0geChkKTtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC5hdHRyKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ1wiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRyYWdnaW5nW2RdID0gTWF0aC5taW4od2lkdGgsIE1hdGgubWF4KDAsIGQzVjMuZXZlbnQueCkpO1xyXG4gICAgICAgICAgICBmb3JlZ3JvdW5kLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBkaW1lbnNpb25zLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gcG9zaXRpb24oYSkgLSBwb3NpdGlvbihiKTsgfSk7XHJcbiAgICAgICAgICAgIHguZG9tYWluKGRpbWVuc2lvbnMpO1xyXG4gICAgICAgICAgICBnLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBwb3NpdGlvbihkKSArIFwiKVwiOyB9KVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnZW5kXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGQzVjMuc2VsZWN0KHRoaXMpKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiKTtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbihmb3JlZ3JvdW5kKS5hdHRyKFwiZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgYmFja2dyb3VuZFxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpXHJcbiAgICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgICAgICAgICAgICAuZGVsYXkoNTAwKVxyXG4gICAgICAgICAgICAgICAgLmR1cmF0aW9uKDApXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcInZpc2liaWxpdHlcIiwgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXHJcbiAgICBnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKVxyXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgbGV0IGF4aXMgPSBudWxsO1xyXG4gICAgICAgICAgICBpZihkID09IFwiZG9jdW1lbnRcIil7XHJcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc0Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihkID09IFwidG9waWNcIil7XHJcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBheGlzID0gYXhpc1c7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZDNWMy5zZWxlY3QodGhpcykuY2FsbChcclxuICAgICAgICAgICAgICAgIGF4aXMuc2NhbGUoeVtkXSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAuYXR0cihcInlcIiwgLTkpXHJcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBBZGQgYW5kIHN0b3JlIGEgYnJ1c2ggZm9yIGVhY2ggYXhpcy5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJicnVzaFwiKVxyXG4gICAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZDNWMy5zZWxlY3QodGhpcykuY2FsbCh5W2RdLmJydXNoID0gZDNWMy5zdmcuYnJ1c2goKS55KHlbZF0pLm9uKFwiYnJ1c2hzdGFydFwiLCBicnVzaHN0YXJ0KS5vbihcImJydXNoXCIsIGJydXNoKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc2VsZWN0QWxsKFwicmVjdFwiKVxyXG4gICAgICAgIC5hdHRyKFwieFwiLCAtOClcclxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIDE2KTtcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gcG9zaXRpb24oZCkge1xyXG4gICAgdmFyIHYgPSBkcmFnZ2luZ1tkXTtcclxuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFuc2l0aW9uKGcpIHtcclxuICAgIHJldHVybiBnLnRyYW5zaXRpb24oKS5kdXJhdGlvbig1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJldHVybnMgdGhlIHBhdGggZm9yIGEgZ2l2ZW4gZGF0YSBwb2ludC5cclxuICAgIGZ1bmN0aW9uIHBhdGgoZCkge1xyXG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4gW3Bvc2l0aW9uKHApLCB5W3BdKGRbcF0pXTsgfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGJydXNoc3RhcnQoKSB7XHJcbiAgICBkM1YzLmV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXMgYSBicnVzaCBldmVudCwgdG9nZ2xpbmcgdGhlIGRpc3BsYXkgb2YgZm9yZWdyb3VuZCBsaW5lcy5cclxuICAgIGZ1bmN0aW9uIGJydXNoKCkge1xyXG4gICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcclxuICAgICAgICBleHRlbnRzID0gYWN0aXZlcy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4geVtwXS5icnVzaC5leHRlbnQoKTsgfSk7XHJcbiAgICBmb3JlZ3JvdW5kLnN0eWxlKFwiZGlzcGxheVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xyXG4gICAgICAgIHJldHVybiBleHRlbnRzW2ldWzBdIDw9IGRbcF0gJiYgZFtwXSA8PSBleHRlbnRzW2ldWzFdO1xyXG4gICAgICAgIH0pID8gbnVsbCA6IFwibm9uZVwiO1xyXG4gICAgfSk7XHJcbiAgICB9XHJcblxyXG59IiwiZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApIHtcclxuICBkMy5zZWxlY3QoXCIuY2hhcnQxMlwiKS5yZW1vdmUoKTtcclxuICB2YXIgZG9jdW1lbnRfdG9waWMgPSByZXNwW1wiZG9jdW1lbnRfdG9waWNcIl1bMF07XHJcbiAgdmFyIHRvcGljX3ZlY3RvcnMgPSByZXNwW1widG9waWNfdmVjdG9yc1wiXTtcclxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2x1c3RlcicpXHJcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICB3aWR0aCA9IDYwMDtcclxuICB2YXIgaGVpZ2h0ID0gNDAwO1xyXG4gIHZhciBtYXJnaW4gPSA4MDtcclxuICB2YXIgZGF0YSA9IFtdO1xyXG5cclxuICBPYmplY3Qua2V5cyh0b3BpY192ZWN0b3JzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xyXG4gICAgdmFyIHZhbHVlID0gdG9waWNfdmVjdG9yc1trZXldO1xyXG4gICAgZGF0YS5wdXNoKHtcclxuICAgICAgeDogdmFsdWVbMF0sXHJcbiAgICAgIHk6IHZhbHVlWzFdLFxyXG4gICAgICBjOiAxLFxyXG4gICAgICBzaXplOiBkb2N1bWVudF90b3BpY1trZXldLFxyXG4gICAgICBrZXk6IGtleVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgdmFyIGxhYmVsWCA9ICdYJztcclxuICB2YXIgbGFiZWxZID0gJ1knO1xyXG5cclxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjY2x1c3RlcicpXHJcbiAgICAuYXBwZW5kKCdzdmcnKVxyXG4gICAgLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0MTInKVxyXG4gICAgLmF0dHIoJ2lkJywnY2x1c3Rlcl9pZCcpXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luICsgbWFyZ2luKVxyXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0ICsgbWFyZ2luICsgbWFyZ2luKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luICsgXCIsXCIgKyBtYXJnaW4gKyBcIilcIik7XHJcblxyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLng7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLng7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzAsIHdpZHRoXSk7XHJcblxyXG4gIHZhciB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnk7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnk7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgc2NhbGUgPSBkMy5zY2FsZVNxcnQoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzEwLCAyMF0pO1xyXG5cclxuICB2YXIgb3BhY2l0eSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMSwgLjVdKTtcclxuXHJcblxyXG4gIHZhciB4QXhpcyA9IGQzLmF4aXNCb3R0b20oKS5zY2FsZSh4KTtcclxuICB2YXIgeUF4aXMgPSBkMy5heGlzTGVmdCgpLnNjYWxlKHkpO1xyXG5cclxuXHJcbiAgc3ZnLmFwcGVuZChcImdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGF4aXNcIilcclxuICAgIC5jYWxsKHlBeGlzKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcclxuICAgIC5hdHRyKFwieFwiLCAyMClcclxuICAgIC5hdHRyKFwieVwiLCAtbWFyZ2luKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXHJcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnRleHQobGFiZWxZKTtcclxuICAvLyB4IGF4aXMgYW5kIGxhYmVsXHJcbiAgc3ZnLmFwcGVuZChcImdcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcclxuICAgIC5jYWxsKHhBeGlzKVxyXG4gICAgLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCB3aWR0aCArIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIG1hcmdpbiAtIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXHJcbiAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKVxyXG4gICAgLnRleHQobGFiZWxYKTtcclxuXHJcbiAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgLmRhdGEoZGF0YSlcclxuICAgIC5lbnRlcigpXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmluc2VydChcImNpcmNsZVwiKVxyXG4gICAgLmF0dHIoXCJjeFwiLCB3aWR0aCAvIDIpXHJcbiAgICAuYXR0cihcImN5XCIsIGhlaWdodCAvIDIpXHJcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIG9wYWNpdHkoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHNjYWxlKGQuc2l6ZSk7XHJcbiAgICB9KVxyXG4gICAgLnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gXCIjMWY3N2I0XCI7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICByZW5kZXJCYXJHcmFwaChkW1wia2V5XCJdLCByZXNwKTtcclxuICAgICAgZmFkZShkLmMsIC4xKTtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3V0JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgZmFkZU91dCgpO1xyXG4gICAgfSlcclxuICAgIC50cmFuc2l0aW9uKClcclxuICAgIC5kZWxheShmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICByZXR1cm4geChkLngpIC0geShkLnkpO1xyXG4gICAgfSlcclxuICAgIC5kdXJhdGlvbig1MDApXHJcbiAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCk7XHJcbiAgICB9KVxyXG4gICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geShkLnkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgICAvLyB0ZXh0IGxhYmVsIGZvciB0aGUgeCBheGlzXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgICAuYXR0cihcInlcIiwgaGVpZ2h0ICs0MClcclxuICAgIC50ZXh0KFwiUENBMVwiKTtcclxuXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInlcIiwgLTUwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43NWVtXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAudGV4dChcIlBDQTJcIik7XHJcblxyXG5cclxuICBmdW5jdGlvbiBmYWRlKGMsIG9wYWNpdHkpIHtcclxuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgIHJldHVybiBkLmMgIT0gYztcclxuICAgICAgfSlcclxuICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIG9wYWNpdHkpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmFkZU91dCgpIHtcclxuICAgIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAuc3R5bGUoXCJvcGFjaXR5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgb3BhY2l0eShkLnNpemUpO1xyXG4gICAgICB9KTtcclxuICB9XHJcbn0iLCJmdW5jdGlvbiByZW5kZXJCYXJHcmFwaCh0b3BpY19udW1iZXIsIHJlc3ApIHtcclxuICBkMy5zZWxlY3QoXCIjc3RhY2stYmFyXCIpLnJlbW92ZSgpO1xyXG4gICBkMy5zZWxlY3QoXCIjbGVnZW5kc3ZnXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBmaW5hbF9kYXRhID0gW107XHJcbiAgdmFyIGRhdGFWYWwgPXJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljX251bWJlcl07XHJcbiAgZm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuICAgIGlmIChkYXRhVmFsLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuICAgICAgICB2YXIgdGVtcCA9e307XHJcbiAgICAgICAgdGVtcC5TdGF0ZSA9IGtleTtcclxuICAgICAgICB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSA9IGRhdGFWYWxba2V5XTtcclxuICAgICAgICB0ZW1wLm92ZXJhbGwgPSByZXNwW1wib3ZlcmFsbF93b3JkXCJdW2tleV07XHJcbiAgICAgICAgdGVtcC50b3RhbCA9IHRlbXAudG9waWNfZnJlcXVlbmN5ICsgdGVtcC5vdmVyYWxsO1xyXG4gICAgICAgIGZpbmFsX2RhdGEucHVzaCh0ZW1wKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhrZXkgKyBcIiAtPiBcIiArIGRhdGFWYWxba2V5XSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG5cclxuICB2YXIgYmIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc3RhY2tlZC1iYXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA2MDA7XHJcblxyXG4gIHZhciBkYXRhID0gZmluYWxfZGF0YTtcclxuICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGggKiAyNTtcclxuICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI3N0YWNrZWQtYmFyXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcInN0YWNrLWJhclwiKSxcclxuICAgIG1hcmdpbiA9IHtcclxuICAgICAgdG9wOiAyMCxcclxuICAgICAgcmlnaHQ6IDIwLFxyXG4gICAgICBib3R0b206IDMwLFxyXG4gICAgICBsZWZ0OiA4MFxyXG4gICAgfSxcclxuICAgIHdpZHRoID0gK3N2Zy5hdHRyKFwid2lkdGhcIikgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgIGhlaWdodCA9ICtzdmcuYXR0cihcImhlaWdodFwiKSAtIG1hcmdpbi50b3AgLSBtYXJnaW4uYm90dG9tLFxyXG4gICAgZyA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKTtcclxuICB2YXIgeSA9IGQzLnNjYWxlQmFuZCgpIC8vIHggPSBkMy5zY2FsZUJhbmQoKSAgXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgaGVpZ2h0XSkgLy8gLnJhbmdlUm91bmQoWzAsIHdpZHRoXSlcclxuICAgIC5wYWRkaW5nSW5uZXIoMC4yNSkuYWxpZ24oMC4xKTtcclxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKCkgLy8geSA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pOyAvLyAucmFuZ2VSb3VuZChbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciB6ID0gZDMuc2NhbGVPcmRpbmFsKCkucmFuZ2UoW1wiI0M4NDIzRVwiLCBcIiNBMUM3RTBcIl0pO1xyXG4gIHZhciBrZXlzID0gW1widG9waWNfZnJlcXVlbmN5XCIsIFwib3ZlcmFsbF9mcmVxdWVuY3lcIl07XHJcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XHJcbiAgfSk7XHJcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLlN0YXRlO1xyXG4gIH0pKTsgLy8geC5kb21haW4uLi5cclxuXHJcbiAgeC5kb21haW4oWzAsIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQudG90YWw7XHJcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXHJcblxyXG4gIHouZG9tYWluKGtleXMpO1xyXG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHooZC5rZXkpO1xyXG4gICAgfSkuc2VsZWN0QWxsKFwicmVjdFwiKS5kYXRhKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkO1xyXG4gICAgfSkuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7XHJcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXHJcbiAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZFswXSk7XHJcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTtcclxuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCB5LmJhbmR3aWR0aCgpKVxyXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIDAuOCk7IC8vLmF0dHIoXCJ3aWR0aFwiLCB4LmJhbmR3aWR0aCgpKTsgXHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwwKVwiKSAvLyAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAvLyAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkpO1xyXG5cclxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIikgLy8gTmV3IGxpbmVcclxuICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxyXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHgoeC50aWNrcygpLnBvcCgpKSArIDAuNSkgLy8gICAgIC5hdHRyKFwieVwiLCB5KHkudGlja3MoKS5wb3AoKSkgKyAwLjUpXHJcbiAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpIC8vICAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpXHJcbiAgXHJcblxyXG5cclxuXHJcbiAgdmFyIHN2ZzEgPSBkMy5zZWxlY3QoXCIjbGVnZW5kVFwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJsZWdlbmRzdmdcIilcclxudmFyIGxlZ2VuZCA9IHN2ZzEuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMCArIGkgKiAyMCkgKyBcIilcIjtcclxuICAgIH0pO1xyXG4gIGxlZ2VuZC5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjUpLmF0dHIoXCJ3aWR0aFwiLCA2MCkuYXR0cihcImhlaWdodFwiLCAxOSkuYXR0cihcImZpbGxcIiwgeik7XHJcbiAgbGVnZW5kLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgd2lkdGggLSAyNCkuYXR0cihcInlcIiwgMTgpLmF0dHIoXCJkeVwiLCBcIjAuMGVtXCIpLnRleHQoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkO1xyXG4gIH0pO1xyXG59IiwiZnVuY3Rpb24gZ2VuZXJhdGVUb3BpY1ZlY3RvcnMoKXtcclxuICAgIHdpbmRvdy50b3BpY1ZlY3RvcnMgPSB7fTtcclxuICAgIGlmKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcclxuICAgICAgICBmb3IodmFyIHggaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgICAgICB2YXIgdmVjdG9yID0gW107XHJcbiAgICAgICAgICAgIGZvcih2YXIgeSBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XSl7XHJcbiAgICAgICAgICAgICAgICB2ZWN0b3IucHVzaCh3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpY1t4XVt5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgd2luZG93LnRvcGljVmVjdG9yc1t4XSA9IHZlY3RvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YShyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xyXG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xyXG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcclxuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xyXG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkb2N1bWVudFwiOiAgZG9jS2V5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0b3BpY1wiOiB0b3BpYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwid29yZFwiOiByZXNwb25zZVtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZpc0RhdGE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YUhDKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKFtwYXJzZUludChkb2NLZXkpLCBwYXJzZUludCh0b3BpYyksIHJlc3BvbnNlW1wid29yZHNcIl0uaW5kZXhPZih3b3JkKV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuXHJcbiIsIndpbmRvdy52dWVBcHAgPSBuZXcgVnVlKHtcclxuICAgIGVsOiAnI3Z1ZS1hcHAnLFxyXG4gICAgZGF0YToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdIZWxsbyB1c2VyIScsXHJcbiAgICAgICAgbm9uZVNlbGVjdGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGVkUGFnZTogNCxcclxuICAgICAgICBwbGF5ZXJEZXRhaWw6IHtcclxuICAgICAgICAgICAgbmFtZTogXCI8UGxheWVyIE5hbWU+XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIG92ZXJ2aWV3RmlsdGVyczoge30sXHJcbiAgICAgICAgc2VsZWN0ZWRNYXA6IDEsXHJcbiAgICAgICAgc2V0dGluZ3M6IHtcclxuICAgICAgICAgICAgc2VsZWN0ZWRNZXRob2Q6IDEsXHJcbiAgICAgICAgICAgIHN0YXJ0OiAxLFxyXG4gICAgICAgICAgICBlbmQ6IDEsXHJcbiAgICAgICAgICAgIGxkYVRvcGljVGhyZXNob2xkOiAwLFxyXG4gICAgICAgICAgICB3b3JkMlZlY1RocmVzaG9sZDogMFxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtZXRob2RzOiB7XHJcbiAgICAgICAgc2VsZWN0UGFnZTogZnVuY3Rpb24oeCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRQYWdlID0geDtcclxuICAgICAgICAgICAgaWYgKHggPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTEod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAyKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMih3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDMpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UzKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gNCl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBtb3VudGVkOiBmdW5jdGlvbigpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcclxuICAgICAgICBsb2FkRDMoKTtcclxuICAgICAgICBsb2FkSnF1ZXJ5KCk7XHJcbiAgICB9XHJcbn0pOyIsImZ1bmN0aW9uIGxvYWRXb3JkQ2xvdWQocmVzcCl7XHJcbiAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdO1xyXG4gICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgY3JlYXRlV29yZENsb3VkKFwib3ZlcmFsbC13Y1wiLCBkYXRhLCBcIkFsbCBEb2N1bWVudHNcIik7XHJcblxyXG4gICAgZm9yKHZhciB0b3BpYyBpbiByZXNwW1widG9waWNfd29yZFwiXSl7XHJcbiAgICAgICAgbGV0IGRhdGEgPSBbXTtcclxuICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHdvcmQsXHJcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJChcIiN0b3BpYy13Y3NcIikuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29sLXNtLTZcIj48ZGl2IHN0eWxlPVwib3V0bGluZTogc29saWQgMXB4O1wiIGlkPVwidG9waWMnK3RvcGljKydcIiBzdHlsZT1cImhlaWdodDogMzAwcHg7XCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgY3JlYXRlV29yZENsb3VkKFwidG9waWNcIit0b3BpYywgZGF0YSwgXCJUb3BpYyBcIit0b3BpYyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVdvcmRDbG91ZChpZCwgZGF0YSwgdGl0bGUpe1xyXG4gICAgSGlnaGNoYXJ0cy5jaGFydChpZCwge1xyXG4gICAgICAgIHNlcmllczogW3tcclxuICAgICAgICAgICAgdHlwZTogJ3dvcmRjbG91ZCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgIHJvdGF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBmcm9tOiAwLFxyXG4gICAgICAgICAgICAgICAgdG86IDAsXHJcbiAgICAgICAgICAgICAgICBvcmllbnRhdGlvbnM6IDVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbmFtZTogJ1Njb3JlJ1xyXG4gICAgICAgIH1dLFxyXG4gICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRpdGxlXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0iXX0=
