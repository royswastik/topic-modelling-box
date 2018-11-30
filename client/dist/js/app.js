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

  svg.append("text").attr("class", "x label").attr("text-anchor", "end").attr("x", width).attr("y", height + 40).text("PC1");
  svg.append("text").attr("class", "y label").attr("text-anchor", "end").attr("y", -50).attr("dy", ".75em").attr("transform", "rotate(-90)").text("PC2");

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJkb2NzIiwiZm5jIiwiZ2V0TERBQ2x1c3RlcnMiLCJnZXRXb3JkMlZlY0NsdXN0ZXJzIiwibG9hZERGdW5jIiwicmVzcCIsImdsb2JhbF9kYXRhIiwiaW5pdFBhZ2UxIiwiaW5pdFBhZ2UyIiwiaW5pdFBhZ2UzIiwiaW5pdFBhZ2U0IiwibG9hZFZpc3VhbGl6YXRpb25zIiwicmVuZGVyQ2x1c3RlckFuYWx5c2lzIiwiaHRtbCIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwibG9hZFdvcmRDbG91ZCIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGFydCIsImVuZCIsInNlbGVjdGVkIiwiY29udGVudFR5cGUiLCJkYXRhVHlwZSIsInBhcnNlIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsInN2ZzEiLCJsZWdlbmQiLCJzbGljZSIsInJldmVyc2UiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwiaW5kZXhPZiIsInZ1ZUFwcCIsIlZ1ZSIsImVsIiwibWVzc2FnZSIsIm5vbmVTZWxlY3RlZCIsInNlbGVjdGVkUGFnZSIsInBsYXllckRldGFpbCIsIm92ZXJ2aWV3RmlsdGVycyIsInNlbGVjdGVkTWFwIiwic2V0dGluZ3MiLCJzZWxlY3RlZE1ldGhvZCIsImxkYVRvcGljVGhyZXNob2xkIiwid29yZDJWZWNUaHJlc2hvbGQiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsIm1vdW50ZWQiLCJ3ZWlnaHQiLCJjcmVhdGVXb3JkQ2xvdWQiLCJyb3RhdGlvbiIsImZyb20iLCJ0byIsIm9yaWVudGF0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBQSxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFFBQWhCLEdBQTJCLFVBQVNDLENBQVQsRUFBWTtBQUNuQyxPQUFJLElBQUlDLENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLQyxNQUF4QixFQUFnQ0QsQ0FBQyxFQUFqQyxFQUFxQztBQUNqQyxRQUFHLEtBQUtBLENBQUwsTUFBWUQsQ0FBZixFQUFrQixPQUFPLElBQVA7QUFDckI7O0FBQ0QsU0FBTyxLQUFQO0FBQ0gsQ0FMRDs7QUFPQUgsS0FBSyxDQUFDQyxTQUFOLENBQWdCSyxNQUFoQixHQUF5QixZQUFXO0FBQ2hDLE1BQUlDLEdBQUcsR0FBRyxFQUFWOztBQUNBLE9BQUksSUFBSUgsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsQ0FBQ0csR0FBRyxDQUFDQyxRQUFKLENBQWEsS0FBS0osQ0FBTCxDQUFiLENBQUosRUFBMkI7QUFDdkJHLE1BQUFBLEdBQUcsQ0FBQ0UsSUFB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LmNvbnRhaW5zID0gZnVuY3Rpb24odikge1xyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZih0aGlzW2ldID09PSB2KSByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbkFycmF5LnByb3RvdHlwZS51bmlxdWUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhcnIgPSBbXTtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYoIWFyci5pbmNsdWRlcyh0aGlzW2ldKSkge1xyXG4gICAgICAgICAgICBhcnIucHVzaCh0aGlzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyOyBcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KGRhdGEpe1xyXG5cdHZhciBkYXRhVmFsID0gZGF0YVtcInRvcGljX3dvcmRcIl07XHJcblx0dmFyIGZpbmFsX2RpY3QgPSB7fTtcclxuXHRmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG5cdCAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblxyXG5cdCAgICBcdHZhciBjaGlsZHJlbldvcmRzID0gZGF0YVZhbFtrZXldO1xyXG5cclxuXHQgICAgXHRmb3IodmFyIGNoaWxkS2V5IGluIGNoaWxkcmVuV29yZHMpe1xyXG5cclxuXHQgICAgXHRcdGlmIChjaGlsZHJlbldvcmRzLmhhc093blByb3BlcnR5KGNoaWxkS2V5KSAmJiBjaGlsZHJlbldvcmRzW2NoaWxkS2V5XSA+IDAuMDEpIHtcclxuXHJcblx0ICAgIFx0XHRcdGlmKCEoY2hpbGRLZXkgaW4gZmluYWxfZGljdCkpe1xyXG5cdCAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldID0gW107XHJcblx0ICAgIFx0XHRcdH1cclxuICAgIFx0XHRcdFx0ZmluYWxfZGljdFtjaGlsZEtleV0ucHVzaChrZXkpO1xyXG5cdCAgICBcdFx0XHRcclxuXHQgICAgXHRcdH1cclxuXHQgICAgXHR9IFxyXG5cdCAgICB9XHJcbiAgXHR9XHJcbiAgXHR2YXIgY2x1c3Rlcl9kYXRhID0ge1xyXG4gIFx0XHRcIm5hbWVcIjpcIlwiLFxyXG4gIFx0XHRcImNoaWxkcmVuXCI6W11cclxuICBcdH1cclxuXHJcbiAgXHR2YXIgY291bnQ9MDtcclxuICBcdGZvcih2YXIga2V5IGluIGZpbmFsX2RpY3Qpe1xyXG4gIFx0XHRpZiAoZmluYWxfZGljdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgXHRcdFx0Y291bnQgPSBjb3VudCArIDE7XHJcbiAgXHRcdFx0dmFyIGhhc2ggPSB7fTtcclxuICBcdFx0XHRoYXNoW1wib3JkZXJcIl0gPSBjb3VudDtcclxuICBcdFx0XHRoYXNoW1wiYWxpYXNcIl0gPSBcIldoaXRlL3JlZC9qYWNrIHBpbmVcIjtcclxuICBcdFx0XHRoYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRoYXNoW1wibmFtZVwiXSA9IGtleTtcclxuXHJcblxyXG4gIFx0XHRcdHZhciBhcnJheV9jaGlsZCA9IGZpbmFsX2RpY3Rba2V5XS51bmlxdWUoKTtcclxuICBcdFx0XHR2YXIgY2hpbGRzID1bXTtcclxuICBcdFx0XHRmb3IodmFyIGk9MDsgaSA8IGFycmF5X2NoaWxkLmxlbmd0aDtpKyspe1xyXG4gIFx0XHRcdFx0dmFyIGNoaWxkX2hhc2ggPSB7fTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJvcmRlclwiXSA9IGkrMTtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJhbGlhc1wiXSA9IGkrMSArIFwiXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiY29sb3JcIl0gPSBcIiNDN0VBRkJcIjtcclxuICBcdFx0XHRcdGNoaWxkX2hhc2hbXCJuYW1lXCJdPSBhcnJheV9jaGlsZFtpXTtcclxuICBcdFx0XHRcdGNoaWxkcy5wdXNoKGNoaWxkX2hhc2gpO1xyXG4gIFx0XHRcdH1cclxuICBcdFx0XHRoYXNoW1wiY2hpbGRyZW5cIl0gPSBjaGlsZHM7XHJcbiAgXHRcdFx0Y2x1c3Rlcl9kYXRhLmNoaWxkcmVuLnB1c2goaGFzaCk7XHJcbiAgXHRcdH1cclxuICBcdH1cclxuICBcdHZhciBkMyA9ICAgd2luZG93LmQzVjM7XHJcbiAgXHRyZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJDbHVzdGVyKGNsdXN0ZXJfZGF0YSwgZDMpe1xyXG4gIHZhciByYWRpdXMgPSAyMDA7XHJcbiAgdmFyIGRlbmRvZ3JhbUNvbnRhaW5lciA9IFwic3BlY2llc2NvbGxhcHNpYmxlXCI7XHJcbiAgdmFyIGRlbmRvZ3JhbURhdGFTb3VyY2UgPSBcImZvcmVzdFNwZWNpZXMuanNvblwiO1xyXG5cclxuICB2YXIgcm9vdE5vZGVTaXplID0gNjtcclxuICB2YXIgbGV2ZWxPbmVOb2RlU2l6ZSA9IDM7XHJcbiAgdmFyIGxldmVsVHdvTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFRocmVlTm9kZVNpemUgPSAyO1xyXG5cclxuXHJcbiAgdmFyIGkgPSAwO1xyXG4gIHZhciBkdXJhdGlvbiA9IDMwMDsgLy9DaGFuZ2luZyB2YWx1ZSBkb2Vzbid0IHNlZW0gYW55IGNoYW5nZXMgaW4gdGhlIGR1cmF0aW9uID8/XHJcblxyXG4gIHZhciByb290SnNvbkRhdGE7XHJcblxyXG4gIHZhciBjbHVzdGVyID0gZDMubGF5b3V0LmNsdXN0ZXIoKVxyXG4gICAgICAuc2l6ZShbMzYwLHJhZGl1cyAtIDEyMF0pXHJcbiAgICAgIC5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICByZXR1cm4gKGEucGFyZW50ID09IGIucGFyZW50ID8gMSA6IDIpIC8gYS5kZXB0aDtcclxuICAgICAgfSk7XHJcblxyXG4gIHZhciBkaWFnb25hbCA9IGQzLnN2Zy5kaWFnb25hbC5yYWRpYWwoKVxyXG4gICAgICAucHJvamVjdGlvbihmdW5jdGlvbihkKSB7IHJldHVybiBbZC55LCBkLnggLyAxODAgKiBNYXRoLlBJXTsgfSk7XHJcblxyXG4gIHZhciBjb250YWluZXJEaXYgPSBkMy5zZWxlY3QoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZGVuZG9ncmFtQ29udGFpbmVyKSk7XHJcblxyXG4gIGNvbnRhaW5lckRpdi5hcHBlbmQoXCJidXR0b25cIilcclxuICAgICAgLmF0dHIoXCJpZFwiLFwiY29sbGFwc2UtYnV0dG9uXCIpXHJcbiAgICAgIC50ZXh0KFwiQ29sbGFwc2UhXCIpXHJcbiAgICAgIC5vbihcImNsaWNrXCIsY29sbGFwc2VMZXZlbHMpO1xyXG5cclxuICB2YXIgc3ZnUm9vdCA9IGNvbnRhaW5lckRpdi5hcHBlbmQoXCJzdmc6c3ZnXCIpXHJcbiAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCItXCIgKyAocmFkaXVzKSArIFwiIC1cIiArIChyYWRpdXMgLSA1MCkgK1wiIFwiKyByYWRpdXMqMiArXCIgXCIrIHJhZGl1cyoyKVxyXG4gICAgICAuY2FsbChkMy5iZWhhdmlvci56b29tKCkuc2NhbGUoMC45KS5zY2FsZUV4dGVudChbMC4xLCAzXSkub24oXCJ6b29tXCIsIHpvb20pKS5vbihcImRibGNsaWNrLnpvb21cIiwgbnVsbClcclxuICAgICAgLmFwcGVuZChcInN2ZzpnXCIpO1xyXG5cclxuICAvLyBBZGQgdGhlIGNsaXBwaW5nIHBhdGhcclxuICBzdmdSb290LmFwcGVuZChcInN2ZzpjbGlwUGF0aFwiKS5hdHRyKFwiaWRcIiwgXCJjbGlwcGVyLXBhdGhcIilcclxuICAgICAgLmFwcGVuZChcInN2ZzpyZWN0XCIpXHJcbiAgICAgIC5hdHRyKCdpZCcsICdjbGlwLXJlY3QtYW5pbScpO1xyXG5cclxuICB2YXIgYW5pbUdyb3VwID0gc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Z1wiKVxyXG4gICAgICAuYXR0cihcImNsaXAtcGF0aFwiLCBcInVybCgjY2xpcHBlci1wYXRoKVwiKTtcclxuXHJcbiAgXHRyb290SnNvbkRhdGEgPSBjbHVzdGVyX2RhdGE7XHJcblxyXG4gICAgLy9TdGFydCB3aXRoIGFsbCBjaGlsZHJlbiBjb2xsYXBzZWRcclxuICAgIHJvb3RKc29uRGF0YS5jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuXHJcbiAgICAvL0luaXRpYWxpemUgdGhlIGRlbmRyb2dyYW1cclxuICBcdGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShyb290SnNvbkRhdGEpO1xyXG5cclxuXHJcblxyXG5cclxuICBmdW5jdGlvbiBjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0oc291cmNlKSB7XHJcblxyXG4gICAgLy8gQ29tcHV0ZSB0aGUgbmV3IHRyZWUgbGF5b3V0LlxyXG4gICAgdmFyIG5vZGVzID0gY2x1c3Rlci5ub2Rlcyhyb290SnNvbkRhdGEpO1xyXG4gICAgdmFyIHBhdGhsaW5rcyA9IGNsdXN0ZXIubGlua3Mobm9kZXMpO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSBmb3Igbm9kZXMnIGZpeGVkLWRlcHRoLlxyXG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgIGlmKGQuZGVwdGggPD0yKXtcclxuICAgICAgICBkLnkgPSBkLmRlcHRoKjcwO1xyXG4gICAgICB9ZWxzZVxyXG4gICAgICB7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCoxMDA7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbm9kZXPigKZcclxuICAgIHZhciBub2RlID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJnLm5vZGVcIilcclxuICAgICAgICAuZGF0YShub2RlcywgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5pZCB8fCAoZC5pZCA9ICsraSk7IH0pO1xyXG5cclxuICAgIC8vIEVudGVyIGFueSBuZXcgbm9kZXMgYXQgdGhlIHBhcmVudCdzIHByZXZpb3VzIHBvc2l0aW9uLlxyXG4gICAgdmFyIG5vZGVFbnRlciA9IG5vZGUuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAub24oXCJjbGlja1wiLCB0b2dnbGVDaGlsZHJlbik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcImNpcmNsZVwiKTtcclxuXHJcbiAgICBub2RlRW50ZXIuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDEwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwic3RhcnRcIilcclxuICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIGlmKGQuZGVwdGggPT09IDIpe1xyXG4gICAgICAgICAgICByZXR1cm4gZC5hbGlhcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgcmV0dXJuIGQubmFtZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIG5vZGVzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlVXBkYXRlID0gbm9kZS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gXCJyb3RhdGUoXCIgKyAoZC54IC0gOTApICsgXCIpdHJhbnNsYXRlKFwiICsgZC55ICsgXCIpXCI7IH0pXHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJjaXJjbGVcIilcclxuICAgICAgICAuYXR0cihcInJcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByb290Tm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsT25lTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGQuZGVwdGggPT09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVHdvTm9kZVNpemU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbGV2ZWxUaHJlZU5vZGVTaXplO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICBpZihkLmRlcHRoID09PTApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiIzgwODA4MFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZSBpZihkLmRlcHRoID09PSAxKXtcclxuICAgICAgICAgICAgICAgIGlmKGQubmFtZT09XCJIYXJkd29vZHNcIikgcmV0dXJuIFwiIzgxNjg1NFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiI0MzQjlBMFwiO1xyXG4gICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgICBpZihkLmRlcHRoPjEpe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJ3aGl0ZVwiO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaWdodGdyYXlcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgbm9kZVVwZGF0ZS5zZWxlY3QoXCJ0ZXh0XCIpXHJcblxyXG4gICAgICAgIC5hdHRyKCdpZCcsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgdmFyIG9yZGVyID0gMDtcclxuICAgICAgICAgIGlmKGQub3JkZXIpb3JkZXIgPSBkLm9yZGVyO1xyXG4gICAgICAgICAgcmV0dXJuICdULScgKyBkLmRlcHRoICsgXCItXCIgKyBvcmRlcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcImVuZFwiIDogXCJzdGFydFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcInN0YXJ0XCIgOiBcImVuZFwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBcIjEuNGVtXCIgOiBcIi0wLjJlbVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBcIi4zMWVtXCI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcImR4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDsgLy9yZXR1cm4gZC54ID4gMTgwID8gMiA6IC0yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyAxIDogLTIwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgaWYgKGQuZGVwdGggPCAyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJyb3RhdGUoXCIgKyAoOTAgLSBkLngpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkLnggPCAxODAgPyBudWxsIDogXCJyb3RhdGUoMTgwKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogYXBwcm9wcmlhdGUgdHJhbnNmb3JtXHJcbiAgICB2YXIgbm9kZUV4aXQgPSBub2RlLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0aGUgbGlua3PigKZcclxuICAgIHZhciBsaW5rID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIilcclxuICAgICAgICAuZGF0YShwYXRobGlua3MsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0LmlkOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IGxpbmtzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZW50ZXIoKS5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54MCwgeTogc291cmNlLnkwfTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zdHlsZShcImZpbGxcIixmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHJldHVybiBkLmNvbG9yO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRyYW5zaXRpb24gbGlua3MgdG8gdGhlaXIgbmV3IHBvc2l0aW9uLlxyXG4gICAgbGluay50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGV4aXRpbmcgbm9kZXMgdG8gdGhlIHBhcmVudCdzIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsuZXhpdCgpLnRyYW5zaXRpb24oKVxyXG4gICAgICAgIC5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAuYXR0cihcImRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgdmFyIG8gPSB7eDogc291cmNlLngsIHk6IHNvdXJjZS55fTtcclxuICAgICAgICAgIHJldHVybiBkaWFnb25hbCh7c291cmNlOiBvLCB0YXJnZXQ6IG99KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuICB9XHJcblxyXG4gIC8vIFRvZ2dsZSBjaGlsZHJlbiBvbiBjbGljay5cclxuICBmdW5jdGlvbiB0b2dnbGVDaGlsZHJlbihkLGNsaWNrVHlwZSkge1xyXG4gICAgaWYgKGQuY2hpbGRyZW4pIHtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGQuY2hpbGRyZW4gPSBkLl9jaGlsZHJlbjtcclxuICAgICAgZC5fY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB0eXBlID0gdHlwZW9mIGNsaWNrVHlwZSA9PSB1bmRlZmluZWQgPyBcIm5vZGVcIiA6IGNsaWNrVHlwZTtcclxuXHJcbiAgICAvL0FjdGl2aXRpZXMgb24gbm9kZSBjbGlja1xyXG4gICAgY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKGQpO1xyXG4gICAgaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCk7XHJcblxyXG4gICAgaGlnaGxpZ2h0Um9vdFRvTm9kZVBhdGgoZCx0eXBlKTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBDb2xsYXBzZSBub2Rlc1xyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKGQpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgZC5fY2hpbGRyZW4gPSBkLmNoaWxkcmVuO1xyXG4gICAgICAgIGQuX2NoaWxkcmVuLmZvckVhY2goY29sbGFwc2UpO1xyXG4gICAgICAgIGQuY2hpbGRyZW4gPSBudWxsO1xyXG4gICAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgLy8gaGlnaGxpZ2h0cyBzdWJub2RlcyBvZiBhIG5vZGVcclxuICBmdW5jdGlvbiBoaWdobGlnaHROb2RlU2VsZWN0aW9ucyhkKSB7XHJcbiAgICAgIHZhciBoaWdobGlnaHRMaW5rQ29sb3IgPSBcImRhcmtzbGF0ZWdyYXlcIjsvL1wiI2YwM2IyMFwiO1xyXG4gICAgICB2YXIgZGVmYXVsdExpbmtDb2xvciA9IFwibGlnaHRncmF5XCI7XHJcblxyXG4gICAgICB2YXIgZGVwdGggPSAgZC5kZXB0aDtcclxuICAgICAgdmFyIG5vZGVDb2xvciA9IGQuY29sb3I7XHJcbiAgICAgIGlmIChkZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgbm9kZUNvbG9yID0gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgcGF0aExpbmtzID0gc3ZnUm9vdC5zZWxlY3RBbGwoXCJwYXRoLmxpbmtcIik7XHJcblxyXG4gICAgICBwYXRoTGlua3Muc3R5bGUoXCJzdHJva2VcIixmdW5jdGlvbihkZCkge1xyXG4gICAgICAgICAgaWYgKGRkLnNvdXJjZS5kZXB0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGlmIChkLm5hbWUgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBoaWdobGlnaHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0TGlua0NvbG9yO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UubmFtZSA9PT0gZC5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVDb2xvcjtcclxuICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICAvL1dhbGtpbmcgcGFyZW50cycgY2hhaW4gZm9yIHJvb3QgdG8gbm9kZSB0cmFja2luZ1xyXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsY2xpY2tUeXBlKXtcclxuICAgIHZhciBhbmNlc3RvcnMgPSBbXTtcclxuICAgIHZhciBwYXJlbnQgPSBkO1xyXG4gICAgd2hpbGUgKCFfLmlzVW5kZWZpbmVkKHBhcmVudCkpIHtcclxuICAgICAgICBhbmNlc3RvcnMucHVzaChwYXJlbnQpO1xyXG4gICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHRoZSBtYXRjaGVkIGxpbmtzXHJcbiAgICB2YXIgbWF0Y2hlZExpbmtzID0gW107XHJcblxyXG4gICAgc3ZnUm9vdC5zZWxlY3RBbGwoJ3BhdGgubGluaycpXHJcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkLCBpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uYW55KGFuY2VzdG9ycywgZnVuY3Rpb24ocClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHAgPT09IGQudGFyZ2V0O1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWF0Y2hlZExpbmtzLnB1c2goZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgYW5pbWF0ZUNoYWlucyhtYXRjaGVkTGlua3MsY2xpY2tUeXBlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhbmltYXRlQ2hhaW5zKGxpbmtzLGNsaWNrVHlwZSl7XHJcbiAgICAgIGFuaW1Hcm91cC5zZWxlY3RBbGwoXCJwYXRoLnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuZGF0YShbXSlcclxuICAgICAgICAgIC5leGl0KCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEobGlua3MpXHJcbiAgICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJzdmc6cGF0aFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAuYXR0cihcImRcIiwgZGlhZ29uYWwpO1xyXG5cclxuXHJcbiAgICAgIC8vUmVzZXQgcGF0aCBoaWdobGlnaHQgaWYgY29sbGFwc2UgYnV0dG9uIGNsaWNrZWRcclxuICAgICAgaWYoY2xpY2tUeXBlID09ICdidXR0b24nKXtcclxuICAgICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKS5jbGFzc2VkKCdyZXNldC1zZWxlY3RlZCcsdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBvdmVybGF5Qm94ID0gc3ZnUm9vdC5ub2RlKCkuZ2V0QkJveCgpO1xyXG5cclxuICAgICAgc3ZnUm9vdC5zZWxlY3QoXCIjY2xpcC1yZWN0LWFuaW1cIilcclxuICAgICAgICAgIC5hdHRyKFwieFwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ5XCIsIC1yYWRpdXMpXHJcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsMClcclxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIscmFkaXVzKjIpXHJcbiAgICAgICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCByYWRpdXMqMik7XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gem9vbSgpIHtcclxuICAgICBzdmdSb290LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBkMy5ldmVudC50cmFuc2xhdGUgKyBcIilzY2FsZShcIiArIGQzLmV2ZW50LnNjYWxlICsgXCIpXCIpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY29sbGFwc2VMZXZlbHMoKXtcclxuXHJcbiAgICBpZihjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKSl7XHJcbiAgICAgIHRvZ2dsZUFsbFNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1lbHNle1xyXG4gICAgIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPcGVuIGZpcnN0IGxldmVsIG9ubHkgYnkgY29sbGFwc2luZyBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIHRvZ2dsZVNlY29uZExldmVsQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuICAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgaWYoaXNOb2RlT3Blbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XSkpe1xyXG5cclxuICAgICAgICAgIGZvcih2YXIgY2hpbGRJbmRleCA9IDAsIGNoaWxkTGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW4ubGVuZ3RoOyBjaGlsZEluZGV4PGNoaWxkTGVuZ3RoOyBjaGlsZEluZGV4Kyspe1xyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICB0b2dnbGVDaGlsZHJlbihyb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XSwnYnV0dG9uJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGlmIGFueSBub2RlcyBvcGVucyBhdCBzZWNvbmQgbGV2ZWxcclxuICAgIGZ1bmN0aW9uIGNoZWNrRm9yVGhpcmRMZXZlbE9wZW5DaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZWNvbmRMZXZlbENoaWxkID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF07XHJcbiAgICAgICAgICAgIGlmKGlzTm9kZU9wZW4oc2Vjb25kTGV2ZWxDaGlsZCkpe1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNOb2RlT3BlbihkKXtcclxuICAgICAgaWYoZC5jaGlsZHJlbil7cmV0dXJuIHRydWU7fVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcblxyXG5cclxufVxyXG5cclxuICAiLCJmdW5jdGlvbiBsb2FkSnF1ZXJ5KCl7XHJcbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpe1xyXG4gICAgICAgICQoXCIjdG9nZ2xlLXNpZGViYXJcIikuY2xpY2soZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJCgnLnVpLnNpZGViYXInKVxyXG4gICAgICAgICAgICAgICAgLnNpZGViYXIoJ3RvZ2dsZScpXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgIH0pO1xyXG59XHJcbiIsInJlcXVpcmUuY29uZmlnKHtcclxuICAgIHBhdGhzOiB7XHJcbiAgICAgICAgXCJkM1wiOiBcImh0dHBzOi8vZDNqcy5vcmcvZDMudjMubWluXCJcclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiBsb2FkRDMoKXtcclxuXHJcbiAgICB3aW5kb3cuZDNPbGQgPSBkMztcclxuICAgIHJlcXVpcmUoWydkMyddLCBmdW5jdGlvbihkM1YzKSB7XHJcbiAgICAgICAgd2luZG93LmQzVjMgPSBkM1YzO1xyXG4gICAgICAgIHdpbmRvdy5kMyA9IGQzT2xkO1xyXG4gICAgICAgIC8vIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcImlcIiwgXCJhbVwiLCBcImJhdG1hblwiLCBcIm9mXCIsIFwid2ludGVyZmFsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1widGhlcmVcIiwgXCJzaG91bGRcIiwgXCJhbHdheXNcIiwgXCJiZVwiLCBcImFcIiwgXCJzdGFya1wiLCBcImluXCIsIFwid2ludGVyZmVsbFwiXSxcclxuICAgICAgICAvLyAgICAgICAgIC8vICAgW1wicHJvcGhlY3lcIiwgXCJzYXlzXCIsIFwicHJpbmNlXCIsIFwid2lsbFwiLCBcImJlXCIgLCBcInJlYm9yblwiXVxyXG4gICAgICAgIC8vICAgICAgICAgLy8gXTtcclxuICAgICAgICAvLyAgICAgd2luZG93LmRvY3VtZW50cyA9IFtbJ3Byb2plY3QnLCAnY2xhc3NpZmljYXRpb24nLCAnY29tcGFyZScsICduZXVyYWwnLCAnbmV0cycsICdTVk0nLCAnZHVlJywgJ2R1ZSddLCBbJ3R3bycsICduZXcnLCAncHJvZ3Jlc3MnLCAnY2hlY2tzJywgJ2ZpbmFsJywgJ3Byb2plY3QnLCAgJ2Fzc2lnbmVkJywgJ2ZvbGxvd3MnXSwgWydyZXBvcnQnLCAnZ3JhZGVkJywgICdjb250cmlidXRlJywgJ3BvaW50cycsICAndG90YWwnLCAnc2VtZXN0ZXInLCAnZ3JhZGUnXSwgWydwcm9ncmVzcycsICd1cGRhdGUnLCAnZXZhbHVhdGVkJywgJ1RBJywgJ3BlZXJzJ10sIFsnY2xhc3MnLCAnbWVldGluZycsICd0b21vcnJvdycsJ3RlYW1zJywgJ3dvcmsnLCAncHJvZ3Jlc3MnLCAncmVwb3J0JywgJ2ZpbmFsJywgJ3Byb2plY3QnXSwgWyAncXVpeicsICAnc2VjdGlvbnMnLCAncmVndWxhcml6YXRpb24nLCAnVHVlc2RheSddLCBbICdxdWl6JywgJ1RodXJzZGF5JywgJ2xvZ2lzdGljcycsICd3b3JrJywgJ29ubGluZScsICdzdHVkZW50JywgJ3Bvc3Rwb25lJywgICdxdWl6JywgJ1R1ZXNkYXknXSwgWydxdWl6JywgJ2NvdmVyJywgJ1RodXJzZGF5J10sIFsncXVpeicsICdjaGFwJywgJ2NoYXAnLCAnbGluZWFyJywgJ3JlZ3Jlc3Npb24nXV07XHJcbiAgICAgICAgd2luZG93LmRvY3VtZW50cyA9IFtcclxuICAgICAgICAgICAgWydzZXJpb3VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICd0YWxrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmcmllbmRzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmbGFreScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbGF0ZWx5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnN0b29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdnb29kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdldmVuaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdoYW5naW5nJ10sXHJcbiAgICAgICAgICAgIFsnZ290JywgJ2dpZnQnLCAnZWxkZXInLCAnYnJvdGhlcicsICdyZWFsbHknLCAnc3VycHJpc2luZyddLFxyXG4gICAgICAgICAgICAgICAgICAgICBbJ2NvbXBsZXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnNScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnbWlsZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3J1bicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnd2l0aG91dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnYnJlYWsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21ha2VzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdmZWVsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdzdHJvbmcnXSxcclxuXHJcbiAgICAgICAgICAgIFsnc29uJywgJ3BlcmZvcm1lZCcsICd3ZWxsJywgJ3Rlc3QnLFxyXG4gICAgICAgICAgICAgICAgJ3ByZXBhcmF0aW9uJ11cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBnZXRBbmFseXNpcyhcIndvcmQydmVjXCIpO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXREb2NzKHRleHRzKSB7XHJcbiAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudHMgPSB0ZXh0cy5tYXAoeCA9PiB4LnNwbGl0KCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBbmFseXNpcyhtZXRob2QpIHtcclxuICBsZXQgZG9jcyA9IHdpbmRvdy5kb2N1bWVudHM7XHJcbiAgbGV0IGZuYyA9IHggPT4geDtcclxuICBpZiAobWV0aG9kID09PSBcIkxEQVwiKSB7XHJcbiAgICBmbmMgPSBnZXRMREFDbHVzdGVycztcclxuXHJcbiAgfSBlbHNlIHtcclxuICAgIGZuYyA9IGdldFdvcmQyVmVjQ2x1c3RlcnM7XHJcbiAgfVxyXG4gIHdpbmRvdy5sb2FkREZ1bmMgPSAgZm5jO1xyXG4gIGZuYyhkb2NzLCByZXNwID0+IHtcclxuICAgICAgd2luZG93Lmdsb2JhbF9kYXRhID0gcmVzcDtcclxuICAgIGluaXRQYWdlMShyZXNwKTtcclxuICAgIGluaXRQYWdlMihyZXNwKTtcclxuICAgIGluaXRQYWdlMyhyZXNwKTtcclxuICAgIGluaXRQYWdlNCgpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2FkVmlzdWFsaXphdGlvbnMoKSB7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMShyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckFuYWx5c2lzKHJlc3ApO1xyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMihyZXNwKSB7XHJcbiAgcmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0KHJlc3ApO1xyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UzKHJlc3Ape1xyXG4gICAgJChcIiNwYXJhbGxlbC1jb29yZGluYXRlLXZpc1wiKS5odG1sKFwiXCIpO1xyXG4gICAgJChcIiNwYy1jb250YWluZXJcIikuaHRtbChcIlwiKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCk7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKHJlc3ApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTQoKXtcclxuICAgICQoXCIjb3ZlcmFsbC13Y1wiKS5odG1sKCk7XHJcbiAgICBsb2FkV29yZENsb3VkKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbn0iLCIvL3ZlY3RvcnMgZm9ybWF0OiBNYXBbc3RyaW5nKHRvcGljX2lkKTogTGlzdFtmbG9hdF1dXHJcbmZ1bmN0aW9uIGdldDJEVmVjdG9ycyh2ZWN0b3JzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvZ2V0MkRWZWN0b3JzXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiB2ZWN0b3JzXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG4vLyBkb2NzIGZvcm1hdDogTGlzdFtMaXN0W3N0cmluZyh3b3JkKV1dXHJcbmZ1bmN0aW9uIGdldFdvcmQyVmVjQ2x1c3RlcnMoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2FwaS9nZXRDbHVzdGVyc1dvcmQyVmVjXCIsXHJcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7ZG9jczogZG9jcywgc3RhcnQ6IDEsIGVuZDogNSwgc2VsZWN0ZWQ6IDB9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldExEQURhdGFcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzLCBzdGFydDogMSwgZW5kOiA1LCBzZWxlY3RlZDogMH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgMCwgMCk7XHJcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xyXG4gICAgICAgICAgICBjaGFydDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwbGluZScsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxBeGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwbG90T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXAudG9Gcm9udCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XHJcbiAgICAgICAgICAgIC8vICAgICBwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3BvaW50LmNvbG9yfVwiPlxcdTI1Q0Y8L3NwYW4+JyArXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgJ3tzZXJpZXMubmFtZX06IDxiPntwb2ludC5mb3JtYXR0ZWRWYWx1ZX08L2I+PGJyLz4nXHJcbiAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgIHhBeGlzOiB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAnVG9waWMnLFxyXG4gICAgICAgICAgICAgICAgICAgICdXb3JkJ1xyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIG9mZnNldDogMTBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeUF4aXM6IFt7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uRG9jdW1lbnQgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC52YWx1ZXMocmVzcFtcIndvcmRzXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlwiK3gpXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBjb2xvcnM6IFsncmdiYSgxMSwgMjAwLCAyMDAsIDAuMSknXSxcclxuICAgICAgICAgICAgc2VyaWVzOiBkYXRhLm1hcChmdW5jdGlvbiAoc2V0LCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHNldCxcclxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG5cclxufVxyXG5cclxuXHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCl7XHJcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMzAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9LFxyXG4gICAgICAgIHdpZHRoID0gOTYwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIHggPSBkM1YzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcclxuICAgICAgICB5ID0ge30sXHJcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcclxuXHJcbiAgICB2YXIgbGluZSA9IGQzVjMuc3ZnLmxpbmUoKSxcclxuICAgICAgICBiYWNrZ3JvdW5kLFxyXG4gICAgICAgIGZvcmVncm91bmQ7XHJcblxyXG4gICAgdmFyIHN2ZyA9IGQzVjMuc2VsZWN0KFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcclxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKSwgZGltZW5zaW9ucztcclxuXHJcblxyXG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cclxuICAgIHZhciBjYXJzID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3AsIDAsIDApO1xyXG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxyXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XHJcblxyXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzVjMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcclxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXHJcbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxyXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxyXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XHJcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcclxuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XHJcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcclxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxyXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XHJcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xyXG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxyXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XHJcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcclxuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XHJcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxyXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcclxuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XHJcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XHJcbiAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcclxuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNjAwO1xyXG4gIHZhciBoZWlnaHQgPSA0MDA7XHJcbiAgdmFyIG1hcmdpbiA9IDgwO1xyXG4gIHZhciBkYXRhID0gW107XHJcblxyXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XHJcbiAgICBkYXRhLnB1c2goe1xyXG4gICAgICB4OiB2YWx1ZVswXSxcclxuICAgICAgeTogdmFsdWVbMV0sXHJcbiAgICAgIGM6IDEsXHJcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXHJcbiAgICAgIGtleToga2V5XHJcbiAgICB9KTtcclxuICB9KTtcclxuICB2YXIgbGFiZWxYID0gJ1gnO1xyXG4gIHZhciBsYWJlbFkgPSAnWSc7XHJcblxyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcclxuICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXHJcbiAgICAuYXR0cignaWQnLCdjbHVzdGVyX2lkJylcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcclxuXHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcclxuXHJcbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMTAsIDIwXSk7XHJcblxyXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xyXG5cclxuXHJcbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xyXG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxyXG4gICAgLmNhbGwoeUF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFkpO1xyXG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoeEF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXHJcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFgpO1xyXG5cclxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAuZGF0YShkYXRhKVxyXG4gICAgLmVudGVyKClcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXHJcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcclxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcclxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gb3BhY2l0eShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBcIiMxZjc3YjRcIjtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xyXG4gICAgICBmYWRlKGQuYywgLjEpO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICBmYWRlT3V0KCk7XHJcbiAgICB9KVxyXG4gICAgLnRyYW5zaXRpb24oKVxyXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XHJcbiAgICB9KVxyXG4gICAgLmR1cmF0aW9uKDUwMClcclxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQueSk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgICAvLyB0ZXh0IGxhYmVsIGZvciB0aGUgeCBheGlzXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgICAuYXR0cihcInlcIiwgaGVpZ2h0ICs0MClcclxuICAgIC50ZXh0KFwiUEMxXCIpO1xyXG5cclxuXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInlcIiwgLTUwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43NWVtXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAudGV4dChcIlBDMlwiKTtcclxuXHJcblxyXG4gIGZ1bmN0aW9uIGZhZGUoYywgb3BhY2l0eSkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQuYyAhPSBjO1xyXG4gICAgICB9KVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgb3BhY2l0eSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIiNzdGFjay1iYXJcIikucmVtb3ZlKCk7XHJcbiAgIGQzLnNlbGVjdChcIiNsZWdlbmRzdmdcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGZpbmFsX2RhdGEgPSBbXTtcclxuICB2YXIgZGF0YVZhbCA9cmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNfbnVtYmVyXTtcclxuICBmb3IgKHZhciBrZXkgaW4gZGF0YVZhbCkge1xyXG4gICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgIHZhciB0ZW1wID17fTtcclxuICAgICAgICB0ZW1wLlN0YXRlID0ga2V5O1xyXG4gICAgICAgIHRlbXAudG9waWNfZnJlcXVlbmN5ID0gZGF0YVZhbFtrZXldO1xyXG4gICAgICAgIHRlbXAub3ZlcmFsbCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1ba2V5XTtcclxuICAgICAgICB0ZW1wLnRvdGFsID0gdGVtcC50b3BpY19mcmVxdWVuY3kgKyB0ZW1wLm92ZXJhbGw7XHJcbiAgICAgICAgZmluYWxfZGF0YS5wdXNoKHRlbXApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIC0+IFwiICsgZGF0YVZhbFtrZXldKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcblxyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzdGFja2VkLWJhcicpXHJcbiAgICAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXHJcbiAgICB3aWR0aCA9IDYwMDtcclxuXHJcbiAgdmFyIGRhdGEgPSBmaW5hbF9kYXRhO1xyXG4gIHZhciBoZWlnaHQgPSBkYXRhLmxlbmd0aCAqIDI1O1xyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoXCIjc3RhY2tlZC1iYXJcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwic3RhY2stYmFyXCIpLFxyXG4gICAgbWFyZ2luID0ge1xyXG4gICAgICB0b3A6IDIwLFxyXG4gICAgICByaWdodDogMjAsXHJcbiAgICAgIGJvdHRvbTogMzAsXHJcbiAgICAgIGxlZnQ6IDgwXHJcbiAgICB9LFxyXG4gICAgd2lkdGggPSArc3ZnLmF0dHIoXCJ3aWR0aFwiKSAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0LFxyXG4gICAgaGVpZ2h0ID0gK3N2Zy5hdHRyKFwiaGVpZ2h0XCIpIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b20sXHJcbiAgICBnID0gc3ZnLmFwcGVuZChcImdcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpO1xyXG4gIHZhciB5ID0gZDMuc2NhbGVCYW5kKCkgLy8geCA9IGQzLnNjYWxlQmFuZCgpICBcclxuICAgIC5yYW5nZVJvdW5kKFswLCBoZWlnaHRdKSAvLyAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKVxyXG4gICAgLnBhZGRpbmdJbm5lcigwLjI1KS5hbGlnbigwLjEpO1xyXG4gIHZhciB4ID0gZDMuc2NhbGVMaW5lYXIoKSAvLyB5ID0gZDMuc2NhbGVMaW5lYXIoKVxyXG4gICAgLnJhbmdlUm91bmQoWzAsIHdpZHRoXSk7IC8vIC5yYW5nZVJvdW5kKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHogPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbXCIjQzg0MjNFXCIsIFwiI0ExQzdFMFwiXSk7XHJcbiAgdmFyIGtleXMgPSBbXCJ0b3BpY19mcmVxdWVuY3lcIiwgXCJvdmVyYWxsX2ZyZXF1ZW5jeVwiXTtcclxuICBkYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgIHJldHVybiBiLnRvdGFsIC0gYS50b3RhbDtcclxuICB9KTtcclxuICB5LmRvbWFpbihkYXRhLm1hcChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQuU3RhdGU7XHJcbiAgfSkpOyAvLyB4LmRvbWFpbi4uLlxyXG5cclxuICB4LmRvbWFpbihbMCwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC50b3RhbDtcclxuICB9KV0pLm5pY2UoKTsgLy8geS5kb21haW4uLi5cclxuXHJcbiAgei5kb21haW4oa2V5cyk7XHJcbiAgZy5hcHBlbmQoXCJnXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShkMy5zdGFjaygpLmtleXMoa2V5cykoZGF0YSkpLmVudGVyKCkuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geihkLmtleSk7XHJcbiAgICB9KS5zZWxlY3RBbGwoXCJyZWN0XCIpLmRhdGEoZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQ7XHJcbiAgICB9KS5lbnRlcigpLmFwcGVuZChcInJlY3RcIikuYXR0cihcInlcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHkoZC5kYXRhLlN0YXRlKTtcclxuICAgIH0pIC8vLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHgoZC5kYXRhLlN0YXRlKTsgfSlcclxuICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkWzBdKTtcclxuICAgIH0pIC8vLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFsxXSk7IH0pICBcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZFsxXSkgLSB4KGRbMF0pO1xyXG4gICAgfSkgLy8uYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMF0pIC0geShkWzFdKTsgfSlcclxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHkuYmFuZHdpZHRoKCkpXHJcbiAgICAuYXR0cihcIm9wYWNpdHlcIiwgMC44KTsgLy8uYXR0cihcIndpZHRoXCIsIHguYmFuZHdpZHRoKCkpOyBcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApXCIpIC8vICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAuY2FsbChkMy5heGlzTGVmdCh5KSk7IC8vICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KSk7XHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKSAvLyBOZXcgbGluZVxyXG4gICAgLmNhbGwoZDMuYXhpc0JvdHRvbSh4KS50aWNrcyhudWxsLCBcInNcIikpIC8vICAuY2FsbChkMy5heGlzTGVmdCh5KS50aWNrcyhudWxsLCBcInNcIikpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieVwiLCAyKSAvLyAgICAgLmF0dHIoXCJ5XCIsIDIpXHJcbiAgICAuYXR0cihcInhcIiwgeCh4LnRpY2tzKCkucG9wKCkpICsgMC41KSAvLyAgICAgLmF0dHIoXCJ5XCIsIHkoeS50aWNrcygpLnBvcCgpKSArIDAuNSlcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIikgLy8gICAgIC5hdHRyKFwiZHlcIiwgXCIwLjMyZW1cIilcclxuICBcclxuXHJcblxyXG5cclxuICB2YXIgc3ZnMSA9IGQzLnNlbGVjdChcIiNsZWdlbmRUXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcImxlZ2VuZHN2Z1wiKVxyXG52YXIgbGVnZW5kID0gc3ZnMS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGggLSAyNSkuYXR0cihcIndpZHRoXCIsIDYwKS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI0KS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcblxyXG4gIHZhciBzdmcxID0gZDMuc2VsZWN0KFwiI2xlZ2VuZFRcIikuYXBwZW5kKFwic3ZnXCIpLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCkuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpLmF0dHIoXCJpZFwiLFwibGVnZW5kc3ZnXCIpXHJcbnZhciBsZWdlbmQgPSBzdmcxLmFwcGVuZChcImdcIikuYXR0cihcImZvbnQtZmFtaWx5XCIsIFwic2Fucy1zZXJpZlwiKS5hdHRyKFwiZm9udC1zaXplXCIsIDEwKS5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGtleXMuc2xpY2UoKS5yZXZlcnNlKCkpLmVudGVyKCkuYXBwZW5kKFwiZ1wiKSAvLy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIFwidHJhbnNsYXRlKDAsXCIgKyBpICogMjAgKyBcIilcIjsgfSk7XHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoLTUwLFwiICsgKDAgKyBpICogMjApICsgXCIpXCI7XHJcbiAgICB9KTtcclxuICBsZWdlbmQuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI1KS5hdHRyKFwid2lkdGhcIiwgNjApLmF0dHIoXCJoZWlnaHRcIiwgMTkpLmF0dHIoXCJmaWxsXCIsIHopO1xyXG4gIGxlZ2VuZC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHdpZHRoIC0gMjQpLmF0dHIoXCJ5XCIsIDE4KS5hdHRyKFwiZHlcIiwgXCIwLjBlbVwiKS50ZXh0KGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZDtcclxuICB9KTtcclxufSIsImZ1bmN0aW9uIGdlbmVyYXRlVG9waWNWZWN0b3JzKCl7XHJcbiAgICB3aW5kb3cudG9waWNWZWN0b3JzID0ge307XHJcbiAgICBpZih3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgZm9yKHZhciB4IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcclxuICAgICAgICAgICAgdmFyIHZlY3RvciA9IFtdO1xyXG4gICAgICAgICAgICBmb3IodmFyIHkgaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF0pe1xyXG4gICAgICAgICAgICAgICAgdmVjdG9yLnB1c2god2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF1beV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHdpbmRvdy50b3BpY1ZlY3RvcnNbeF0gPSB2ZWN0b3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IGRvY0tleSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZG9jdW1lbnRcIjogIGRvY0tleSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG9waWNcIjogdG9waWMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndvcmRcIjogcmVzcG9uc2VbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xyXG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xyXG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcclxuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xyXG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaChbcGFyc2VJbnQoZG9jS2V5KSwgcGFyc2VJbnQodG9waWMpLCByZXNwb25zZVtcIndvcmRzXCJdLmluZGV4T2Yod29yZCldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZpc0RhdGE7XHJcbn1cclxuXHJcblxyXG4iLCJ3aW5kb3cudnVlQXBwID0gbmV3IFZ1ZSh7XHJcbiAgICBlbDogJyN2dWUtYXBwJyxcclxuICAgIGRhdGE6IHtcclxuICAgICAgICBtZXNzYWdlOiAnSGVsbG8gdXNlciEnLFxyXG4gICAgICAgIG5vbmVTZWxlY3RlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDQsXHJcbiAgICAgICAgcGxheWVyRGV0YWlsOiB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiPFBsYXllciBOYW1lPlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvdmVydmlld0ZpbHRlcnM6IHt9LFxyXG4gICAgICAgIHNlbGVjdGVkTWFwOiAxLFxyXG4gICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkTWV0aG9kOiAxLFxyXG4gICAgICAgICAgICBzdGFydDogMSxcclxuICAgICAgICAgICAgZW5kOiAxLFxyXG4gICAgICAgICAgICBsZGFUb3BpY1RocmVzaG9sZDogMCxcclxuICAgICAgICAgICAgd29yZDJWZWNUaHJlc2hvbGQ6IDBcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbWV0aG9kczoge1xyXG4gICAgICAgIHNlbGVjdFBhZ2U6IGZ1bmN0aW9uKHgpe1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkUGFnZSA9IHg7XHJcbiAgICAgICAgICAgIGlmICh4ID09IDEpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UxKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMil7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTIod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSAzKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMyh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDQpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2U0KHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xyXG4gICAgfVxyXG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xyXG4gICAgbGV0IGRhdGEgPSBbXTtcclxuICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1wib3ZlcmFsbF93b3JkXCJdKXtcclxuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcclxuICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xyXG5cclxuICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcFtcInRvcGljX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCBkYXRhID0gW107XHJcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjdG9waWMtd2NzXCIpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+PGRpdiBzdHlsZT1cIm91dGxpbmU6IHNvbGlkIDFweDtcIiBpZD1cInRvcGljJyt0b3BpYysnXCIgc3R5bGU9XCJoZWlnaHQ6IDMwMHB4O1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcclxuICAgIEhpZ2hjaGFydHMuY2hhcnQoaWQsIHtcclxuICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgIHRvOiAwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdTY29yZSdcclxuICAgICAgICB9XSxcclxuICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aXRsZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59Il19
