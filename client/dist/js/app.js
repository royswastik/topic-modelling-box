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
    getAnalysis("word2Vec");
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJkb2NzIiwiZm5jIiwiZ2V0TERBQ2x1c3RlcnMiLCJnZXRXb3JkMlZlY0NsdXN0ZXJzIiwibG9hZERGdW5jIiwicmVzcCIsImdsb2JhbF9kYXRhIiwiaW5pdFBhZ2UxIiwiaW5pdFBhZ2UyIiwiaW5pdFBhZ2UzIiwiaW5pdFBhZ2U0IiwibG9hZFZpc3VhbGl6YXRpb25zIiwicmVuZGVyQ2x1c3RlckFuYWx5c2lzIiwiaHRtbCIsImxvYWRQYXJhbGxlbENvb3JkaW5hdGUiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDIiwibG9hZFdvcmRDbG91ZCIsImdldDJEVmVjdG9ycyIsInZlY3RvcnMiLCJzdWNjZXNzQ2FsbGJhY2siLCJyZXF1ZXN0IiwiYWpheCIsInVybCIsImRvbmUiLCJyZXNwb25zZSIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJhbGVydCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb250ZW50VHlwZSIsImRhdGFUeXBlIiwicGFyc2UiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyIsIkhpZ2hjaGFydHMiLCJjaGFydCIsInBhcmFsbGVsQ29vcmRpbmF0ZXMiLCJwYXJhbGxlbEF4ZXMiLCJsaW5lV2lkdGgiLCJ0aXRsZSIsInBsb3RPcHRpb25zIiwic2VyaWVzIiwiYW5pbWF0aW9uIiwibWFya2VyIiwiZW5hYmxlZCIsInN0YXRlcyIsImhvdmVyIiwiaGFsbyIsImV2ZW50cyIsIm1vdXNlT3ZlciIsImdyb3VwIiwidG9Gcm9udCIsInhBeGlzIiwiY2F0ZWdvcmllcyIsIm9mZnNldCIsInlBeGlzIiwiT2JqZWN0Iiwia2V5cyIsInZhbHVlcyIsImNvbG9ycyIsInNldCIsInNoYWRvdyIsIm1hcmdpbiIsInRvcCIsInJpZ2h0IiwiYm90dG9tIiwibGVmdCIsIndpZHRoIiwiaGVpZ2h0Iiwib3JkaW5hbCIsInJhbmdlUG9pbnRzIiwiZHJhZ2dpbmciLCJsaW5lIiwiYmFja2dyb3VuZCIsImZvcmVncm91bmQiLCJkaW1lbnNpb25zIiwiY2FycyIsImdlbmVyYXRlUGFyYWxsZWxDb29yZGluYXRlRGF0YSIsImF4aXNEIiwiYXhpcyIsIm9yaWVudCIsInRpY2tWYWx1ZXMiLCJwYXJzZUludCIsImF4aXNUIiwiYXhpc1ciLCJwYXJzZUZsb2F0IiwiZG9tYWluIiwibGluZWFyIiwiZXh0ZW50IiwicmFuZ2UiLCJwYXRoIiwiZyIsImRyYWciLCJvcmlnaW4iLCJtaW4iLCJtYXgiLCJzb3J0IiwicG9zaXRpb24iLCJkZWxheSIsImJydXNoIiwiYnJ1c2hzdGFydCIsInNvdXJjZUV2ZW50Iiwic3RvcFByb3BhZ2F0aW9uIiwiYWN0aXZlcyIsImVtcHR5IiwiZXh0ZW50cyIsImV2ZXJ5IiwiZG9jdW1lbnRfdG9waWMiLCJ0b3BpY192ZWN0b3JzIiwiYmIiLCJxdWVyeVNlbGVjdG9yIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwidmFsdWUiLCJjIiwibGFiZWxYIiwibGFiZWxZIiwic2NhbGVMaW5lYXIiLCJzY2FsZVNxcnQiLCJvcGFjaXR5IiwiYXhpc0JvdHRvbSIsImF4aXNMZWZ0IiwicmVuZGVyQmFyR3JhcGgiLCJmYWRlIiwiZmFkZU91dCIsInRvcGljX251bWJlciIsImZpbmFsX2RhdGEiLCJ0ZW1wIiwiU3RhdGUiLCJ0b3BpY19mcmVxdWVuY3kiLCJvdmVyYWxsIiwidG90YWwiLCJjb25zb2xlIiwibG9nIiwic2NhbGVCYW5kIiwicmFuZ2VSb3VuZCIsInBhZGRpbmdJbm5lciIsImFsaWduIiwieiIsInNjYWxlT3JkaW5hbCIsIm5pY2UiLCJzdGFjayIsImJhbmR3aWR0aCIsInRpY2tzIiwicG9wIiwibGVnZW5kIiwic2xpY2UiLCJyZXZlcnNlIiwiZ2VuZXJhdGVUb3BpY1ZlY3RvcnMiLCJ0b3BpY1ZlY3RvcnMiLCJ0b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljIiwidmVjdG9yIiwidG9waWNfdGhyZXNob2xkIiwid29yZF90aHJlc2hvbGQiLCJ2aXNEYXRhIiwiZG9jS2V5IiwidG9waWMiLCJ0b3BpY1Njb3JlIiwid29yZCIsIndvcmRTY29yZSIsImluZGV4T2YiLCJ2dWVBcHAiLCJWdWUiLCJlbCIsIm1lc3NhZ2UiLCJub25lU2VsZWN0ZWQiLCJzZWxlY3RlZFBhZ2UiLCJwbGF5ZXJEZXRhaWwiLCJvdmVydmlld0ZpbHRlcnMiLCJzZWxlY3RlZE1hcCIsInNldHRpbmdzIiwic2VsZWN0ZWRNZXRob2QiLCJzdGFydCIsImVuZCIsIm1ldGhvZHMiLCJzZWxlY3RQYWdlIiwibW91bnRlZCIsIndlaWdodCIsImNyZWF0ZVdvcmRDbG91ZCIsInJvdGF0aW9uIiwiZnJvbSIsInRvIiwib3JpZW50YXRpb25zIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUFBLEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsUUFBaEIsR0FBMkIsVUFBU0MsQ0FBVCxFQUFZO0FBQ25DLE9BQUksSUFBSUMsQ0FBQyxHQUFHLENBQVosRUFBZUEsQ0FBQyxHQUFHLEtBQUtDLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUcsS0FBS0EsQ0FBTCxNQUFZRCxDQUFmLEVBQWtCLE9BQU8sSUFBUDtBQUNyQjs7QUFDRCxTQUFPLEtBQVA7QUFDSCxDQUxEOztBQU9BSCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JLLE1BQWhCLEdBQXlCLFlBQVc7QUFDaEMsTUFBSUMsR0FBRyxHQUFHLEVBQVY7O0FBQ0EsT0FBSSxJQUFJSCxDQUFDLEdBQUcsQ0FBWixFQUFlQSxDQUFDLEdBQUcsS0FBS0MsTUFBeEIsRUFBZ0NELENBQUMsRUFBakMsRUFBcUM7QUFDakMsUUFBRyxDQUFDRyxHQUFHLENBQUNDLFFBQUosQ0FBYSxLQUFLSixDQUFMLENBQWIsQ0FBSixFQUEyQjtBQUN2QkcsTUFBQUEsR0FBRyxDQUFDRSxJQUFKLENBQVMsS0FBS0wsQ0FBTCxDQUFUO0FBQ0g7QUFDSjs7QUFDRCxTQUFPRyxHQUFQO0FBQ0gsQ0FS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LENBQVU7QUFDTjRFLFFBQUFBLElBQUksRUFBRWdPLElBREE7QUFFTm1CLFFBQUFBLE1BQU0sRUFBRUE7QUFGRixPQUFWO0FBSUg7O0FBQ0RqTSxJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCNUUsTUFBaEIsQ0FBdUIscUVBQW1Fd1AsS0FBbkUsR0FBeUUsdUNBQWhHO0FBQ0FzQixJQUFBQSxlQUFlLENBQUMsVUFBUXRCLEtBQVQsRUFBZ0J4UyxLQUFoQixFQUFzQixXQUFTd1MsS0FBL0IsQ0FBZjtBQUNIO0FBQ0o7O0FBRUQsU0FBU3NCLGVBQVQsQ0FBeUJ6UCxFQUF6QixFQUE2QnJFLElBQTdCLEVBQW1Db0wsS0FBbkMsRUFBeUM7QUFDckNMLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBWCxDQUFpQjNHLEVBQWpCLEVBQXFCO0FBQ2pCaUgsSUFBQUEsTUFBTSxFQUFFLENBQUM7QUFDTDNGLE1BQUFBLElBQUksRUFBRSxXQUREO0FBRUwzRixNQUFBQSxJQUFJLEVBQUVBLElBRkQ7QUFHTCtULE1BQUFBLFFBQVEsRUFBRTtBQUNOQyxRQUFBQSxJQUFJLEVBQUUsQ0FEQTtBQUVOQyxRQUFBQSxFQUFFLEVBQUUsQ0FGRTtBQUdOQyxRQUFBQSxZQUFZLEVBQUU7QUFIUixPQUhMO0FBUUx4UCxNQUFBQSxJQUFJLEVBQUU7QUFSRCxLQUFELENBRFM7QUFXakIwRyxJQUFBQSxLQUFLLEVBQUU7QUFDSGxJLE1BQUFBLElBQUksRUFBRWtJO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYodGhpc1tpXSA9PT0gdikgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKCFhcnIuaW5jbHVkZXModGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChkYXRhKXtcclxuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xyXG5cdHZhciBmaW5hbF9kaWN0ID0ge307XHJcblx0Zm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cclxuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcclxuXHJcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcclxuXHJcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiAwLjAxKSB7XHJcblxyXG5cdCAgICBcdFx0XHRpZighKGNoaWxkS2V5IGluIGZpbmFsX2RpY3QpKXtcclxuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xyXG5cdCAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldLnB1c2goa2V5KTtcclxuXHQgICAgXHRcdFx0XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSBcclxuXHQgICAgfVxyXG4gIFx0fVxyXG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcclxuICBcdFx0XCJuYW1lXCI6XCJcIixcclxuICBcdFx0XCJjaGlsZHJlblwiOltdXHJcbiAgXHR9XHJcblxyXG4gIFx0dmFyIGNvdW50PTA7XHJcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcclxuICBcdFx0aWYgKGZpbmFsX2RpY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xyXG4gIFx0XHRcdHZhciBoYXNoID0ge307XHJcbiAgXHRcdFx0aGFzaFtcIm9yZGVyXCJdID0gY291bnQ7XHJcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XHJcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0aGFzaFtcIm5hbWVcIl0gPSBrZXk7XHJcblxyXG5cclxuICBcdFx0XHR2YXIgYXJyYXlfY2hpbGQgPSBmaW5hbF9kaWN0W2tleV0udW5pcXVlKCk7XHJcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XHJcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcclxuICBcdFx0XHRcdHZhciBjaGlsZF9oYXNoID0ge307XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiYWxpYXNcIl0gPSBpKzEgKyBcIlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XHJcbiAgXHRcdFx0XHRjaGlsZHMucHVzaChjaGlsZF9oYXNoKTtcclxuICBcdFx0XHR9XHJcbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xyXG4gIFx0XHRcdGNsdXN0ZXJfZGF0YS5jaGlsZHJlbi5wdXNoKGhhc2gpO1xyXG4gIFx0XHR9XHJcbiAgXHR9XHJcbiAgXHR2YXIgZDMgPSAgIHdpbmRvdy5kM1YzO1xyXG4gIFx0cmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKXtcclxuICB2YXIgcmFkaXVzID0gMjAwO1xyXG4gIHZhciBkZW5kb2dyYW1Db250YWluZXIgPSBcInNwZWNpZXNjb2xsYXBzaWJsZVwiO1xyXG4gIHZhciBkZW5kb2dyYW1EYXRhU291cmNlID0gXCJmb3Jlc3RTcGVjaWVzLmpzb25cIjtcclxuXHJcbiAgdmFyIHJvb3ROb2RlU2l6ZSA9IDY7XHJcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUaHJlZU5vZGVTaXplID0gMjtcclxuXHJcblxyXG4gIHZhciBpID0gMDtcclxuICB2YXIgZHVyYXRpb24gPSAzMDA7IC8vQ2hhbmdpbmcgdmFsdWUgZG9lc24ndCBzZWVtIGFueSBjaGFuZ2VzIGluIHRoZSBkdXJhdGlvbiA/P1xyXG5cclxuICB2YXIgcm9vdEpzb25EYXRhO1xyXG5cclxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcclxuICAgICAgLnNpemUoWzM2MCxyYWRpdXMgLSAxMjBdKVxyXG4gICAgICAuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XHJcbiAgICAgIH0pO1xyXG5cclxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcclxuICAgICAgLnByb2plY3Rpb24oZnVuY3Rpb24oZCkgeyByZXR1cm4gW2QueSwgZC54IC8gMTgwICogTWF0aC5QSV07IH0pO1xyXG5cclxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xyXG5cclxuICBjb250YWluZXJEaXYuYXBwZW5kKFwiYnV0dG9uXCIpXHJcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxyXG4gICAgICAudGV4dChcIkNvbGxhcHNlIVwiKVxyXG4gICAgICAub24oXCJjbGlja1wiLGNvbGxhcHNlTGV2ZWxzKTtcclxuXHJcbiAgdmFyIHN2Z1Jvb3QgPSBjb250YWluZXJEaXYuYXBwZW5kKFwic3ZnOnN2Z1wiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiLVwiICsgKHJhZGl1cykgKyBcIiAtXCIgKyAocmFkaXVzIC0gNTApICtcIiBcIisgcmFkaXVzKjIgK1wiIFwiKyByYWRpdXMqMilcclxuICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLnNjYWxlKDAuOSkuc2NhbGVFeHRlbnQoWzAuMSwgM10pLm9uKFwiem9vbVwiLCB6b29tKSkub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcclxuXHJcbiAgLy8gQWRkIHRoZSBjbGlwcGluZyBwYXRoXHJcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6cmVjdFwiKVxyXG4gICAgICAuYXR0cignaWQnLCAnY2xpcC1yZWN0LWFuaW0nKTtcclxuXHJcbiAgdmFyIGFuaW1Hcm91cCA9IHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmdcIilcclxuICAgICAgLmF0dHIoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI2NsaXBwZXItcGF0aClcIik7XHJcblxyXG4gIFx0cm9vdEpzb25EYXRhID0gY2x1c3Rlcl9kYXRhO1xyXG5cclxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXHJcbiAgICByb290SnNvbkRhdGEuY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcblxyXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXHJcbiAgXHRjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0ocm9vdEpzb25EYXRhKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIG5ldyB0cmVlIGxheW91dC5cclxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcclxuICAgIHZhciBwYXRobGlua3MgPSBjbHVzdGVyLmxpbmtzKG5vZGVzKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cclxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICBpZihkLmRlcHRoIDw9Mil7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcclxuICAgICAgfWVsc2VcclxuICAgICAge1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG5vZGVz4oCmXHJcbiAgICB2YXIgbm9kZSA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwiZy5ub2RlXCIpXHJcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IG5vZGVzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9nZ2xlQ2hpbGRyZW4pO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJjaXJjbGVcIik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICBpZihkLmRlcHRoID09PSAyKXtcclxuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBkLm5hbWU7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZVVwZGF0ZSA9IG5vZGUudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbE9uZU5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFR3b05vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVGhyZWVOb2RlU2l6ZTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgaWYoZC5kZXB0aCA9PT0wKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2UgaWYoZC5kZXB0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZihkLm5hbWU9PVwiSGFyZHdvb2RzXCIpIHJldHVybiBcIiM4MTY4NTRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwid2hpdGVcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlnaHRncmF5XCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwidGV4dFwiKVxyXG5cclxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHZhciBvcmRlciA9IDA7XHJcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcclxuICAgICAgICAgIHJldHVybiAnVC0nICsgZC5kZXB0aCArIFwiLVwiICsgb3JkZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJlbmRcIiA6IFwic3RhcnRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJzdGFydFwiIDogXCJlbmRcIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCIxLjRlbVwiIDogXCItMC4yZW1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCIuMzFlbVwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7IC8vcmV0dXJuIGQueCA+IDE4MCA/IDIgOiAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gMSA6IC0yMDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKDkwIC0gZC54KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gbnVsbCA6IFwicm90YXRlKDE4MClcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86IGFwcHJvcHJpYXRlIHRyYW5zZm9ybVxyXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtz4oCmXHJcbiAgICB2YXIgbGluayA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpXHJcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBsaW5rcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGxpbmtzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54LCB5OiBzb3VyY2UueX07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBUb2dnbGUgY2hpbGRyZW4gb24gY2xpY2suXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2hpbGRyZW4oZCxjbGlja1R5cGUpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkLmNoaWxkcmVuID0gZC5fY2hpbGRyZW47XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBjbGlja1R5cGUgPT0gdW5kZWZpbmVkID8gXCJub2RlXCIgOiBjbGlja1R5cGU7XHJcblxyXG4gICAgLy9BY3Rpdml0aWVzIG9uIG5vZGUgY2xpY2tcclxuICAgIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShkKTtcclxuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xyXG5cclxuICAgIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsdHlwZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQ29sbGFwc2Ugbm9kZXNcclxuICBmdW5jdGlvbiBjb2xsYXBzZShkKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgICBkLl9jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuICAgICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIGhpZ2hsaWdodHMgc3Vibm9kZXMgb2YgYSBub2RlXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCkge1xyXG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcclxuICAgICAgdmFyIGRlZmF1bHRMaW5rQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG5cclxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XHJcbiAgICAgIHZhciBub2RlQ29sb3IgPSBkLmNvbG9yO1xyXG4gICAgICBpZiAoZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xyXG5cclxuICAgICAgcGF0aExpbmtzLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZGQpIHtcclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZC5uYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLm5hbWUgPT09IGQubmFtZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBub2RlQ29sb3I7XHJcbiAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcclxuICBmdW5jdGlvbiBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLGNsaWNrVHlwZSl7XHJcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XHJcbiAgICB2YXIgcGFyZW50ID0gZDtcclxuICAgIHdoaWxlICghXy5pc1VuZGVmaW5lZChwYXJlbnQpKSB7XHJcbiAgICAgICAgYW5jZXN0b3JzLnB1c2gocGFyZW50KTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xyXG4gICAgdmFyIG1hdGNoZWRMaW5rcyA9IFtdO1xyXG5cclxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCwgaSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwID09PSBkLnRhcmdldDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1hdGNoZWRMaW5rcy5wdXNoKGQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGFuaW1hdGVDaGFpbnMobWF0Y2hlZExpbmtzLGNsaWNrVHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZUNoYWlucyhsaW5rcyxjbGlja1R5cGUpe1xyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEoW10pXHJcbiAgICAgICAgICAuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKGxpbmtzKVxyXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwic3ZnOnBhdGhcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcblxyXG4gICAgICAvL1Jlc2V0IHBhdGggaGlnaGxpZ2h0IGlmIGNvbGxhcHNlIGJ1dHRvbiBjbGlja2VkXHJcbiAgICAgIGlmKGNsaWNrVHlwZSA9PSAnYnV0dG9uJyl7XHJcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcclxuXHJcbiAgICAgIHN2Z1Jvb3Quc2VsZWN0KFwiI2NsaXAtcmVjdC1hbmltXCIpXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLDApXHJcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxyXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcmFkaXVzKjIpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHpvb20oKSB7XHJcbiAgICAgc3ZnUm9vdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlTGV2ZWxzKCl7XHJcblxyXG4gICAgaWYoY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCkpe1xyXG4gICAgICB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcbiAgICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTm9kZU9wZW4oZCl7XHJcbiAgICAgIGlmKGQuY2hpbGRyZW4pe3JldHVybiB0cnVlO31cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKFwiI3RvZ2dsZS1zaWRlYmFyXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcclxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxufVxyXG4iLCJyZXF1aXJlLmNvbmZpZyh7XHJcbiAgICBwYXRoczoge1xyXG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gbG9hZEQzKCl7XHJcblxyXG4gICAgd2luZG93LmQzT2xkID0gZDM7XHJcbiAgICByZXF1aXJlKFsnZDMnXSwgZnVuY3Rpb24oZDNWMykge1xyXG4gICAgICAgIHdpbmRvdy5kM1YzID0gZDNWMztcclxuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcclxuICAgICAgICAvLyB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInRoZXJlXCIsIFwic2hvdWxkXCIsIFwiYWx3YXlzXCIsIFwiYmVcIiwgXCJhXCIsIFwic3RhcmtcIiwgXCJpblwiLCBcIndpbnRlcmZlbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInByb3BoZWN5XCIsIFwic2F5c1wiLCBcInByaW5jZVwiLCBcIndpbGxcIiwgXCJiZVwiICwgXCJyZWJvcm5cIl1cclxuICAgICAgICAvLyAgICAgICAgIC8vIF07XHJcbiAgICAgICAgLy8gICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbWydwcm9qZWN0JywgJ2NsYXNzaWZpY2F0aW9uJywgJ2NvbXBhcmUnLCAnbmV1cmFsJywgJ25ldHMnLCAnU1ZNJywgJ2R1ZScsICdkdWUnXSwgWyd0d28nLCAnbmV3JywgJ3Byb2dyZXNzJywgJ2NoZWNrcycsICdmaW5hbCcsICdwcm9qZWN0JywgICdhc3NpZ25lZCcsICdmb2xsb3dzJ10sIFsncmVwb3J0JywgJ2dyYWRlZCcsICAnY29udHJpYnV0ZScsICdwb2ludHMnLCAgJ3RvdGFsJywgJ3NlbWVzdGVyJywgJ2dyYWRlJ10sIFsncHJvZ3Jlc3MnLCAndXBkYXRlJywgJ2V2YWx1YXRlZCcsICdUQScsICdwZWVycyddLCBbJ2NsYXNzJywgJ21lZXRpbmcnLCAndG9tb3Jyb3cnLCd0ZWFtcycsICd3b3JrJywgJ3Byb2dyZXNzJywgJ3JlcG9ydCcsICdmaW5hbCcsICdwcm9qZWN0J10sIFsgJ3F1aXonLCAgJ3NlY3Rpb25zJywgJ3JlZ3VsYXJpemF0aW9uJywgJ1R1ZXNkYXknXSwgWyAncXVpeicsICdUaHVyc2RheScsICdsb2dpc3RpY3MnLCAnd29yaycsICdvbmxpbmUnLCAnc3R1ZGVudCcsICdwb3N0cG9uZScsICAncXVpeicsICdUdWVzZGF5J10sIFsncXVpeicsICdjb3ZlcicsICdUaHVyc2RheSddLCBbJ3F1aXonLCAnY2hhcCcsICdjaGFwJywgJ2xpbmVhcicsICdyZWdyZXNzaW9uJ11dO1xyXG4gICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgICAgIFsnc2VyaW91cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndGFsaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZnJpZW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmxha3knLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2xhdGVseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzdG9vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZ29vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnaGFuZ2luZyddLFxyXG4gICAgICAgICAgICBbJ2dvdCcsICdnaWZ0JywgJ2VsZGVyJywgJ2Jyb3RoZXInLCAncmVhbGx5JywgJ3N1cnByaXNpbmcnXSxcclxuICAgICAgICAgICAgICAgICAgICAgWydjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21pbGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdydW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3dpdGhvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2JyZWFrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtYWtlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmVlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnc3Ryb25nJ10sXHJcblxyXG4gICAgICAgICAgICBbJ3NvbicsICdwZXJmb3JtZWQnLCAnd2VsbCcsICd0ZXN0JyxcclxuICAgICAgICAgICAgICAgICdwcmVwYXJhdGlvbiddXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0QW5hbHlzaXMoXCJ3b3JkMlZlY1wiKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0cykge1xyXG4gIHJldHVybiB3aW5kb3cuZG9jdW1lbnRzID0gdGV4dHMubWFwKHggPT4geC5zcGxpdCgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QW5hbHlzaXMobWV0aG9kKSB7XHJcbiAgbGV0IGRvY3MgPSB3aW5kb3cuZG9jdW1lbnRzO1xyXG4gIGxldCBmbmMgPSB4ID0+IHg7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJMREFcIikge1xyXG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XHJcblxyXG4gIH0gZWxzZSB7XHJcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xyXG4gIH1cclxuICB3aW5kb3cubG9hZERGdW5jID0gIGZuYztcclxuICBmbmMoZG9jcywgcmVzcCA9PiB7XHJcbiAgICAgIHdpbmRvdy5nbG9iYWxfZGF0YSA9IHJlc3A7XHJcbiAgICBpbml0UGFnZTEocmVzcCk7XHJcbiAgICBpbml0UGFnZTIocmVzcCk7XHJcbiAgICBpbml0UGFnZTMocmVzcCk7XHJcbiAgICBpbml0UGFnZTQoKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbG9hZFZpc3VhbGl6YXRpb25zKCkge1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTEocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTIocmVzcCkge1xyXG4gIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChyZXNwKTtcclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlMyhyZXNwKXtcclxuICAgICQoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjcGMtY29udGFpbmVyXCIpLmh0bWwoXCJcIik7XHJcbiAgICBsb2FkUGFyYWxsZWxDb29yZGluYXRlKHJlc3ApO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2U0KCl7XHJcbiAgICAkKFwiI292ZXJhbGwtd2NcIikuaHRtbCgpO1xyXG4gICAgbG9hZFdvcmRDbG91ZCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG59IiwiLy92ZWN0b3JzIGZvcm1hdDogTWFwW3N0cmluZyh0b3BpY19pZCk6IExpc3RbZmxvYXRdXVxyXG5mdW5jdGlvbiBnZXQyRFZlY3RvcnModmVjdG9ycywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2dldDJEVmVjdG9yc1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogdmVjdG9yc1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICB9KTtcclxufVxyXG5cclxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxyXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3N9KSxcclxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgZGF0YVR5cGUgICA6IFwianNvblwiXHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5mYWlsKGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcclxuICAgICAgICBhbGVydCggXCJSZXF1ZXN0IGZhaWxlZDogXCIgKyB0ZXh0U3RhdHVzICk7XHJcbiAgICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMREFDbHVzdGVycyhkb2NzLCBzdWNjZXNzQ2FsbGJhY2spe1xyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogXCIvYXBpL2dldExEQURhdGFcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG4gICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgICAgXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICB9KTtcclxufVxyXG4iLCJmdW5jdGlvbiBsb2FkUGFyYWxsZWxDb29yZGluYXRlc0hDKHJlc3Ape1xyXG5cclxuXHJcbiAgICAgICAgbGV0IGRhdGEgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwLCAwLCAwKTtcclxuICAgICAgICBIaWdoY2hhcnRzLmNoYXJ0KCdwYy1jb250YWluZXInLCB7XHJcbiAgICAgICAgICAgIGNoYXJ0OiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BsaW5lJyxcclxuICAgICAgICAgICAgICAgIHBhcmFsbGVsQ29vcmRpbmF0ZXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbEF4ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IDJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgICAgIHRleHQ6ICdEb2N1bWVudCAtIFRvcGljIC0gV29yZCBSZWxhdGlvbnNoaXAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsb3RPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBzZXJpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFsbzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cC50b0Zyb250KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgLy8gICAgIHBvaW50Rm9ybWF0OiAnPHNwYW4gc3R5bGU9XCJjb2xvcjp7cG9pbnQuY29sb3J9XCI+XFx1MjVDRjwvc3Bhbj4nICtcclxuICAgICAgICAgICAgLy8gICAgICAgICAne3Nlcmllcy5uYW1lfTogPGI+e3BvaW50LmZvcm1hdHRlZFZhbHVlfTwvYj48YnIvPidcclxuICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgeEF4aXM6IHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAnRG9jdW1lbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUb3BpYycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1dvcmQnXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAxMFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB5QXhpczogW3tcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHg9PiBcIi4uLi4uLi4uLi4uLi4uLi5Eb2N1bWVudCBcIit4KVxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiByZXNwW1widG9waWNzXCJdLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uVG9waWMgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogT2JqZWN0LnZhbHVlcyhyZXNwW1wid29yZHNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uXCIreClcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgIGNvbG9yczogWydyZ2JhKDExLCAyMDAsIDIwMCwgMC4xKSddLFxyXG4gICAgICAgICAgICBzZXJpZXM6IGRhdGEubWFwKGZ1bmN0aW9uIChzZXQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRvdzogZmFsc2VcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKXtcclxuICAgIHZhciBtYXJnaW4gPSB7dG9wOiAzMCwgcmlnaHQ6IDEwLCBib3R0b206IDEwLCBsZWZ0OiAxMH0sXHJcbiAgICAgICAgd2lkdGggPSA5NjAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgICAgICBoZWlnaHQgPSA1MDAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcclxuXHJcbiAgICB2YXIgeCA9IGQzVjMuc2NhbGUub3JkaW5hbCgpLnJhbmdlUG9pbnRzKFswLCB3aWR0aF0sIDEpLFxyXG4gICAgICAgIHkgPSB7fSxcclxuICAgICAgICBkcmFnZ2luZyA9IHt9O1xyXG5cclxuICAgIHZhciBsaW5lID0gZDNWMy5zdmcubGluZSgpLFxyXG4gICAgICAgIGJhY2tncm91bmQsXHJcbiAgICAgICAgZm9yZWdyb3VuZDtcclxuXHJcbiAgICB2YXIgc3ZnID0gZDNWMy5zZWxlY3QoXCIjcGFyYWxsZWwtY29vcmRpbmF0ZS12aXNcIikuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxyXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbi5sZWZ0ICsgXCIsXCIgKyBtYXJnaW4udG9wICsgXCIpXCIpLCBkaW1lbnNpb25zO1xyXG5cclxuXHJcbiAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIGRpbWVuc2lvbnMgYW5kIGNyZWF0ZSBhIHNjYWxlIGZvciBlYWNoLlxyXG4gICAgdmFyIGNhcnMgPSBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcCwgMCwgMCk7XHJcbiAgICAvLyB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLmxlbmd0aCksXHJcbiAgICB2YXIgYXhpc0QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKE9iamVjdC5rZXlzKHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXSkubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVCA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMocmVzcFtcInRvcGljc1wiXS5tYXAoeCA9PiBwYXJzZUludCh4KSkpLFxyXG4gICAgICAgIGF4aXNXID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3QudmFsdWVzKHJlc3BbXCJvdmVyYWxsX3dvcmRcIl0pLm1hcCh4ID0+IHBhcnNlRmxvYXQoeCkpKTtcclxuXHJcbiAgICB4LmRvbWFpbihkaW1lbnNpb25zID0gZDNWMy5rZXlzKGNhcnNbMF0pLmZpbHRlcihmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQgIT0gXCJuYW1lXCIgJiYgKHlbZF0gPSBkM1YzLnNjYWxlLmxpbmVhcigpXHJcbiAgICAgICAgICAgIC5kb21haW4oZDNWMy5leHRlbnQoY2FycywgZnVuY3Rpb24ocCkgeyByZXR1cm4gK3BbZF07IH0pKVxyXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCwgMF0pKTtcclxuICAgIH0pKTtcclxuXHJcbiAgICAvLyBBZGQgZ3JleSBiYWNrZ3JvdW5kIGxpbmVzIGZvciBjb250ZXh0LlxyXG4gICAgYmFja2dyb3VuZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcclxuICAgICAgICAuc2VsZWN0QWxsKFwicGF0aFwiKVxyXG4gICAgICAgIC5kYXRhKGNhcnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuXHJcbiAgICAvLyBBZGQgYmx1ZSBmb3JlZ3JvdW5kIGxpbmVzIGZvciBmb2N1cy5cclxuICAgIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJmb3JlZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXHJcbiAgICB2YXIgZyA9IHN2Zy5zZWxlY3RBbGwoXCIuZGltZW5zaW9uXCIpXHJcbiAgICAgICAgLmRhdGEoZGltZW5zaW9ucylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgeChkKSArIFwiKVwiOyB9KVxyXG4gICAgICAgIC5jYWxsKGQzVjMuYmVoYXZpb3IuZHJhZygpXHJcbiAgICAgICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4ge3g6IHgoZCl9OyB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IHgoZCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQuYXR0cihcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkcmFnZ2luZ1tkXSA9IE1hdGgubWluKHdpZHRoLCBNYXRoLm1heCgwLCBkM1YzLmV2ZW50LngpKTtcclxuICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKFwiZFwiLCBwYXRoKTtcclxuICAgICAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xyXG4gICAgICAgICAgICB4LmRvbWFpbihkaW1lbnNpb25zKTtcclxuICAgICAgICAgICAgZy5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgcG9zaXRpb24oZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ2VuZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkcmFnZ2luZ1tkXTtcclxuICAgICAgICAgICAgdHJhbnNpdGlvbihkM1YzLnNlbGVjdCh0aGlzKSkuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIik7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZm9yZWdyb3VuZCkuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmRcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBwYXRoKVxyXG4gICAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKVxyXG4gICAgICAgICAgICAgICAgLmRlbGF5KDUwMClcclxuICAgICAgICAgICAgICAgIC5kdXJhdGlvbigwKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIG51bGwpO1xyXG4gICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGFuIGF4aXMgYW5kIHRpdGxlLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGxldCBheGlzID0gbnVsbDtcclxuICAgICAgICAgICAgaWYoZCA9PSBcImRvY3VtZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNEO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYoZCA9PSBcInRvcGljXCIpe1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNUO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXhpcyA9IGF4aXNXO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoXHJcbiAgICAgICAgICAgICAgICBheGlzLnNjYWxlKHlbZF0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC05KVxyXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQ7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXHJcbiAgICBnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiYnJ1c2hcIilcclxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIGQzVjMuc2VsZWN0KHRoaXMpLmNhbGwoeVtkXS5icnVzaCA9IGQzVjMuc3ZnLmJydXNoKCkueSh5W2RdKS5vbihcImJydXNoc3RhcnRcIiwgYnJ1c2hzdGFydCkub24oXCJicnVzaFwiLCBicnVzaCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInJlY3RcIilcclxuICAgICAgICAuYXR0cihcInhcIiwgLTgpXHJcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCAxNik7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcclxuICAgIHZhciB2ID0gZHJhZ2dpbmdbZF07XHJcbiAgICByZXR1cm4gdiA9PSBudWxsID8geChkKSA6IHY7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNpdGlvbihnKSB7XHJcbiAgICByZXR1cm4gZy50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBSZXR1cm5zIHRoZSBwYXRoIGZvciBhIGdpdmVuIGRhdGEgcG9pbnQuXHJcbiAgICBmdW5jdGlvbiBwYXRoKGQpIHtcclxuICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBicnVzaHN0YXJ0KCkge1xyXG4gICAgZDNWMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXHJcbiAgICBmdW5jdGlvbiBicnVzaCgpIHtcclxuICAgIHZhciBhY3RpdmVzID0gZGltZW5zaW9ucy5maWx0ZXIoZnVuY3Rpb24ocCkgeyByZXR1cm4gIXlbcF0uYnJ1c2guZW1wdHkoKTsgfSksXHJcbiAgICAgICAgZXh0ZW50cyA9IGFjdGl2ZXMubWFwKGZ1bmN0aW9uKHApIHsgcmV0dXJuIHlbcF0uYnJ1c2guZXh0ZW50KCk7IH0pO1xyXG4gICAgZm9yZWdyb3VuZC5zdHlsZShcImRpc3BsYXlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcclxuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcclxuICAgICAgICB9KSA/IG51bGwgOiBcIm5vbmVcIjtcclxuICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSIsImZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJBbmFseXNpcyhyZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiLmNoYXJ0MTJcIikucmVtb3ZlKCk7XHJcbiAgdmFyIGRvY3VtZW50X3RvcGljID0gcmVzcFtcImRvY3VtZW50X3RvcGljXCJdWzBdO1xyXG4gIHZhciB0b3BpY192ZWN0b3JzID0gcmVzcFtcInRvcGljX3ZlY3RvcnNcIl07XHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NsdXN0ZXInKVxyXG4gICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgd2lkdGggPSA2MDA7XHJcbiAgdmFyIGhlaWdodCA9IDQwMDtcclxuICB2YXIgbWFyZ2luID0gNDA7XHJcbiAgdmFyIGRhdGEgPSBbXTtcclxuXHJcbiAgT2JqZWN0LmtleXModG9waWNfdmVjdG9ycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcclxuICAgIHZhciB2YWx1ZSA9IHRvcGljX3ZlY3RvcnNba2V5XTtcclxuICAgIGRhdGEucHVzaCh7XHJcbiAgICAgIHg6IHZhbHVlWzBdLFxyXG4gICAgICB5OiB2YWx1ZVsxXSxcclxuICAgICAgYzogMSxcclxuICAgICAgc2l6ZTogZG9jdW1lbnRfdG9waWNba2V5XSxcclxuICAgICAga2V5OiBrZXlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIHZhciBsYWJlbFggPSAnWCc7XHJcbiAgdmFyIGxhYmVsWSA9ICdZJztcclxuXHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdCgnI2NsdXN0ZXInKVxyXG4gICAgLmFwcGVuZCgnc3ZnJylcclxuICAgIC5hdHRyKCdjbGFzcycsICdjaGFydDEyJylcclxuICAgIC5hdHRyKCdpZCcsJ2NsdXN0ZXJfaWQnKVxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbiArIG1hcmdpbilcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIG1hcmdpbiArIFwiLFwiICsgbWFyZ2luICsgXCIpXCIpO1xyXG5cclxuICB2YXIgeCA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC54O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFswLCB3aWR0aF0pO1xyXG5cclxuICB2YXIgeSA9IGQzLnNjYWxlTGluZWFyKClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC55O1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFtoZWlnaHQsIDBdKTtcclxuXHJcbiAgdmFyIHNjYWxlID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxMCwgMjBdKTtcclxuXHJcbiAgdmFyIG9wYWNpdHkgPSBkMy5zY2FsZVNxcnQoKVxyXG4gICAgLmRvbWFpbihbZDMubWluKGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KSwgZDMubWF4KGRhdGEsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkLnNpemU7XHJcbiAgICB9KV0pXHJcbiAgICAucmFuZ2UoWzEsIC41XSk7XHJcblxyXG5cclxuICB2YXIgeEF4aXMgPSBkMy5heGlzQm90dG9tKCkuc2NhbGUoeCk7XHJcbiAgdmFyIHlBeGlzID0gZDMuYXhpc0xlZnQoKS5zY2FsZSh5KTtcclxuXHJcblxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXHJcbiAgICAuY2FsbCh5QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAuYXR0cihcInhcIiwgMjApXHJcbiAgICAuYXR0cihcInlcIiwgLW1hcmdpbilcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWSk7XHJcbiAgLy8geCBheGlzIGFuZCBsYWJlbFxyXG4gIHN2Zy5hcHBlbmQoXCJnXCIpXHJcbiAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpXHJcbiAgICAuY2FsbCh4QXhpcylcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGggKyAyMClcclxuICAgIC5hdHRyKFwieVwiLCBtYXJnaW4gLSAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuNzFlbVwiKVxyXG4gICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcclxuICAgIC50ZXh0KGxhYmVsWCk7XHJcblxyXG4gIHN2Zy5zZWxlY3RBbGwoXCJjaXJjbGVcIilcclxuICAgIC5kYXRhKGRhdGEpXHJcbiAgICAuZW50ZXIoKVxyXG4gICAgLmFwcGVuZChcImdcIilcclxuICAgIC5pbnNlcnQoXCJjaXJjbGVcIilcclxuICAgIC5hdHRyKFwiY3hcIiwgd2lkdGggLyAyKVxyXG4gICAgLmF0dHIoXCJjeVwiLCBoZWlnaHQgLyAyKVxyXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBvcGFjaXR5KGQuc2l6ZSk7XHJcbiAgICB9KVxyXG4gICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBzY2FsZShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIFwiIzFmNzdiNFwiO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdmVyJywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmVuZGVyQmFyR3JhcGgoZFtcImtleVwiXSwgcmVzcCk7XHJcbiAgICAgIGZhZGUoZC5jLCAuMSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIGZhZGVPdXQoKTtcclxuICAgIH0pXHJcbiAgICAudHJhbnNpdGlvbigpXHJcbiAgICAuZGVsYXkoZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KSAtIHkoZC55KTtcclxuICAgIH0pXHJcbiAgICAuZHVyYXRpb24oNTAwKVxyXG4gICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkLngpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHkoZC55KTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgZnVuY3Rpb24gZmFkZShjLCBvcGFjaXR5KSB7XHJcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICByZXR1cm4gZC5jICE9IGM7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBvcGFjaXR5KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZhZGVPdXQoKSB7XHJcbiAgICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgLnN0eWxlKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgIG9wYWNpdHkoZC5zaXplKTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG59IiwiZnVuY3Rpb24gcmVuZGVyQmFyR3JhcGgodG9waWNfbnVtYmVyLCByZXNwKSB7XHJcbiAgZDMuc2VsZWN0KFwiI3N0YWNrLWJhclwiKS5yZW1vdmUoKTtcclxuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xyXG4gIHZhciBkYXRhVmFsID1yZXNwW1widG9waWNfd29yZFwiXVt0b3BpY19udW1iZXJdO1xyXG4gIGZvciAodmFyIGtleSBpbiBkYXRhVmFsKSB7XHJcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPXt9O1xyXG4gICAgICAgIHRlbXAuU3RhdGUgPSBrZXk7XHJcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XHJcbiAgICAgICAgdGVtcC5vdmVyYWxsID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldO1xyXG4gICAgICAgIHRlbXAudG90YWwgPSB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSArIHRlbXAub3ZlcmFsbDtcclxuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCIgLT4gXCIgKyBkYXRhVmFsW2tleV0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuXHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gYmIucmlnaHQgLSBiYi5sZWZ0O1xyXG5cclxuICB2YXIgZGF0YSA9IGZpbmFsX2RhdGE7XHJcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjU7XHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXHJcbiAgICBtYXJnaW4gPSB7XHJcbiAgICAgIHRvcDogMjAsXHJcbiAgICAgIHJpZ2h0OiAyMCxcclxuICAgICAgYm90dG9tOiAzMCxcclxuICAgICAgbGVmdDogNTBcclxuICAgIH0sXHJcbiAgICB3aWR0aCA9ICtzdmcuYXR0cihcIndpZHRoXCIpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcclxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XHJcbiAgdmFyIHkgPSBkMy5zY2FsZUJhbmQoKSAvLyB4ID0gZDMuc2NhbGVCYW5kKCkgIFxyXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXHJcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpIC8vIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbCgpLnJhbmdlKFtcIiNDODQyM0VcIiwgXCIjQTFDN0UwXCJdKTtcclxuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxcIl07XHJcbiAgZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XHJcbiAgfSk7XHJcbiAgeS5kb21haW4oZGF0YS5tYXAoZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLlN0YXRlO1xyXG4gIH0pKTsgLy8geC5kb21haW4uLi5cclxuXHJcbiAgeC5kb21haW4oWzAsIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQudG90YWw7XHJcbiAgfSldKS5uaWNlKCk7IC8vIHkuZG9tYWluLi4uXHJcblxyXG4gIHouZG9tYWluKGtleXMpO1xyXG4gIGcuYXBwZW5kKFwiZ1wiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoZDMuc3RhY2soKS5rZXlzKGtleXMpKGRhdGEpKS5lbnRlcigpLmFwcGVuZChcImdcIikuYXR0cihcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHooZC5rZXkpO1xyXG4gICAgfSkuc2VsZWN0QWxsKFwicmVjdFwiKS5kYXRhKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBkO1xyXG4gICAgfSkuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQuZGF0YS5TdGF0ZSk7XHJcbiAgICB9KSAvLy5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0YS5TdGF0ZSk7IH0pXHJcbiAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZFswXSk7XHJcbiAgICB9KSAvLy5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiB5KGRbMV0pOyB9KSAgXHJcbiAgICAuYXR0cihcIndpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB4KGRbMV0pIC0geChkWzBdKTtcclxuICAgIH0pIC8vLmF0dHIoXCJoZWlnaHRcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzBdKSAtIHkoZFsxXSk7IH0pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCB5LmJhbmR3aWR0aCgpKVxyXG4gICAgLmF0dHIoXCJvcGFjaXR5XCIsIDAuOCk7IC8vLmF0dHIoXCJ3aWR0aFwiLCB4LmJhbmR3aWR0aCgpKTsgXHJcblxyXG4gIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwwKVwiKSAvLyAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpOyAvLyAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkpO1xyXG5cclxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIikgLy8gTmV3IGxpbmVcclxuICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkudGlja3MobnVsbCwgXCJzXCIpKSAvLyAgLmNhbGwoZDMuYXhpc0xlZnQoeSkudGlja3MobnVsbCwgXCJzXCIpKVxyXG4gICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcInlcIiwgMikgLy8gICAgIC5hdHRyKFwieVwiLCAyKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHgoeC50aWNrcygpLnBvcCgpKSArIDAuNSkgLy8gICAgIC5hdHRyKFwieVwiLCB5KHkudGlja3MoKS5wb3AoKSkgKyAwLjUpXHJcbiAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpIC8vICAgICAuYXR0cihcImR5XCIsIFwiMC4zMmVtXCIpXHJcbiAgdmFyIGxlZ2VuZCA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiZm9udC1mYW1pbHlcIiwgXCJzYW5zLXNlcmlmXCIpLmF0dHIoXCJmb250LXNpemVcIiwgMTApLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImVuZFwiKS5zZWxlY3RBbGwoXCJnXCIpLmRhdGEoa2V5cy5zbGljZSgpLnJldmVyc2UoKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpIC8vLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gXCJ0cmFuc2xhdGUoMCxcIiArIGkgKiAyMCArIFwiKVwiOyB9KTtcclxuICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiBcInRyYW5zbGF0ZSgtNTAsXCIgKyAoMzAwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGggLSAxOSkuYXR0cihcIndpZHRoXCIsIDE5KS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI0KS5hdHRyKFwieVwiLCA5LjUpLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKS50ZXh0KGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZDtcclxuICB9KTtcclxufSIsImZ1bmN0aW9uIGdlbmVyYXRlVG9waWNWZWN0b3JzKCl7XHJcbiAgICB3aW5kb3cudG9waWNWZWN0b3JzID0ge307XHJcbiAgICBpZih3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgZm9yKHZhciB4IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljKXtcclxuICAgICAgICAgICAgdmFyIHZlY3RvciA9IFtdO1xyXG4gICAgICAgICAgICBmb3IodmFyIHkgaW4gd2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF0pe1xyXG4gICAgICAgICAgICAgICAgdmVjdG9yLnB1c2god2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWNbeF1beV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHdpbmRvdy50b3BpY1ZlY3RvcnNbeF0gPSB2ZWN0b3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IGRvY0tleSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZG9jdW1lbnRcIjogIGRvY0tleSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidG9waWNcIjogdG9waWMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIndvcmRcIjogcmVzcG9uc2VbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGFIQyhyZXNwb25zZSwgdG9waWNfdGhyZXNob2xkLCB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICBsZXQgdmlzRGF0YSA9IFtdO1xyXG4gICAgZm9yICh2YXIgZG9jS2V5IGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl0pe1xyXG4gICAgICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldKXtcclxuICAgICAgICAgICAgbGV0IHRvcGljU2NvcmUgPSByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV1bdG9waWNdO1xyXG4gICAgICAgICAgICBpZiAodG9waWNTY29yZSA+IHRvcGljX3RocmVzaG9sZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3b3JkU2NvcmUgPSByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JkU2NvcmUgPiB3b3JkX3RocmVzaG9sZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc0RhdGEucHVzaChbcGFyc2VJbnQoZG9jS2V5KSwgcGFyc2VJbnQodG9waWMpLCByZXNwb25zZVtcIndvcmRzXCJdLmluZGV4T2Yod29yZCldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZpc0RhdGE7XHJcbn1cclxuXHJcblxyXG4iLCJ3aW5kb3cudnVlQXBwID0gbmV3IFZ1ZSh7XHJcbiAgICBlbDogJyN2dWUtYXBwJyxcclxuICAgIGRhdGE6IHtcclxuICAgICAgICBtZXNzYWdlOiAnSGVsbG8gdXNlciEnLFxyXG4gICAgICAgIG5vbmVTZWxlY3RlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3RlZFBhZ2U6IDQsXHJcbiAgICAgICAgcGxheWVyRGV0YWlsOiB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiPFBsYXllciBOYW1lPlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBvdmVydmlld0ZpbHRlcnM6IHt9LFxyXG4gICAgICAgIHNlbGVjdGVkTWFwOiAxLFxyXG4gICAgICAgIHNldHRpbmdzOiB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkTWV0aG9kOiAxLFxyXG4gICAgICAgICAgICBzdGFydDogMSxcclxuICAgICAgICAgICAgZW5kOiAxXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgICBzZWxlY3RQYWdlOiBmdW5jdGlvbih4KXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xyXG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMSh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UyKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTMod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSA0KXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlNCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1vdW50ZWQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJNb3VudGVkXCIpO1xyXG4gICAgICAgIGxvYWREMygpO1xyXG4gICAgICAgIGxvYWRKcXVlcnkoKTtcclxuICAgIH1cclxufSk7IiwiZnVuY3Rpb24gbG9hZFdvcmRDbG91ZChyZXNwKXtcclxuICAgIGxldCBkYXRhID0gW107XHJcbiAgICBmb3IodmFyIHdvcmQgaW4gcmVzcFtcIm92ZXJhbGxfd29yZFwiXSl7XHJcbiAgICAgICAgbGV0IHdlaWdodCA9IHJlc3BbXCJvdmVyYWxsX3dvcmRcIl1bd29yZF07XHJcbiAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgIG5hbWU6IHdvcmQsXHJcbiAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBjcmVhdGVXb3JkQ2xvdWQoXCJvdmVyYWxsLXdjXCIsIGRhdGEsIFwiQWxsIERvY3VtZW50c1wiKTtcclxuXHJcbiAgICBmb3IodmFyIHRvcGljIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdKXtcclxuICAgICAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY10pe1xyXG4gICAgICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcInRvcGljX3dvcmRcIl1bdG9waWNdW3dvcmRdO1xyXG4gICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKFwiI3RvcGljLXdjc1wiKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb2wtc20tNlwiPjxkaXYgc3R5bGU9XCJvdXRsaW5lOiBzb2xpZCAxcHg7XCIgaWQ9XCJ0b3BpYycrdG9waWMrJ1wiIHN0eWxlPVwiaGVpZ2h0OiAzMDBweDtcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICBjcmVhdGVXb3JkQ2xvdWQoXCJ0b3BpY1wiK3RvcGljLCBkYXRhLCBcIlRvcGljIFwiK3RvcGljKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlV29yZENsb3VkKGlkLCBkYXRhLCB0aXRsZSl7XHJcbiAgICBIaWdoY2hhcnRzLmNoYXJ0KGlkLCB7XHJcbiAgICAgICAgc2VyaWVzOiBbe1xyXG4gICAgICAgICAgICB0eXBlOiAnd29yZGNsb3VkJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgcm90YXRpb246IHtcclxuICAgICAgICAgICAgICAgIGZyb206IDAsXHJcbiAgICAgICAgICAgICAgICB0bzogMCxcclxuICAgICAgICAgICAgICAgIG9yaWVudGF0aW9uczogNVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuYW1lOiAnU2NvcmUnXHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgdGV4dDogdGl0bGVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSJdfQ==
