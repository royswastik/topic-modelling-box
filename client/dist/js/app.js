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

function getAnalysis(method, success) {
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

    if (success) {
      success(resp);
    }
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
}

function getTokenizedDocs(docs, successCallback) {
  var request = $.ajax({
    url: "/getDocsFromTexts",
    method: "POST",
    data: JSON.stringify({
      docs: docs
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json"
  });
  request.done(function (response) {
    successCallback(response.docs);
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
      start: window.vueApp.settings.start2,
      end: window.vueApp.settings.end2,
      selected: window.vueApp.settings.selectedDataset
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
      start: window.vueApp.settings.start1,
      end: window.vueApp.settings.end1,
      selected: window.vueApp.settings.selectedDataset
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
    fade(d.c, .7);
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
      console.log(key + "->" + resp["overall_word"][key]);
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
    selectedPage: 5,
    playerDetail: {
      name: "<Player Name>"
    },
    overviewFilters: {},
    newDocs: [],
    selectedMap: 1,
    success: false,
    loading: false,
    newDoc: '',
    newDocsProccessed: '',
    showProcessed: false,
    settings: {
      selectedMethod: 'word2Vec',
      selectedDataset: 0,
      start1: 0,
      //HappyDB
      end1: 10,
      //HappyDB
      start2: 0,
      //Medium
      end2: 5,
      //Medium
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
    },
    addNewDoc: function addNewDoc() {
      if (this.newDoc.trim().split(" ").length < 3) {
        alert("Please add at least 3 words");
        return;
      }

      this.newDocs.push(this.newDoc);
      this.newDoc = '';
      this.showProcessed = false;
    },
    processDocs: function processDocs() {
      var self = this;
      getTokenizedDocs(this.newDocs, function (resp) {
        self.newDocsProccessed = resp;
        self.showProcessed = true;
      });
    },
    saveChanges: function saveChanges() {
      var self = this;
      self.success = false;
      self.loading = true;

      if (this.settings.selectedDataset == 0) {
        if (this.settings.end1 - this.settings.start1 < 10) {
          alert("There needs to be atleast 5 documents(& <= 50) for Happy DB. And start index can not be greater than end.");
          return;
        } else if (this.settings.end1 - this.settings.start1 > 50) {
          alert("There needs to be less than 50 documents for HappyDB.");
          return;
        }
      } else if (this.settings.selectedDataset == 1) {
        if (this.settings.end2 - this.settings.start2 < 5) {
          alert("There needs to be atleast 5 documents(& <= 30) for Medium Articles. And start index can not be greater than end.");
          return;
        } else if (this.settings.end2 - this.settings.start2 > 30) {
          alert("There needs to be less than 30 documents for Medium Articles.");
          return;
        }
      } else if (this.settings.selectedDataset == 2) {
        if (!this.showProcessed) {
          alert("Please process all documents first");
          return;
        }

        window.documents = this.newDocsProccessed;
      }

      getAnalysis(this.settings.selectedMethod, function (resp) {
        self.success = true;
        self.loading = false;
      });
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNsdXN0ZXJfZm9yY2VfbGF5b3V0LmpzIiwiZXZlbnRzLmpzIiwibWFpbi5qcyIsIm5ldHdvcmsuanMiLCJwYXJhbGxlbC1jb29yZGluYXRlLWhjLmpzIiwicGFyYWxsZWwtY29vcmRpbmF0ZS5qcyIsInNjYXR0ZXJfcGxvdF93aXRoX3dlaWdodHMuanMiLCJzdGFja2VkX2Jhcl9ncmFwaC5qcyIsInV0aWwuanMiLCJ2dWVfbW9kZWwuanMiLCJ3b3JkY2xvdWQuanMiXSwibmFtZXMiOlsiQXJyYXkiLCJwcm90b3R5cGUiLCJjb250YWlucyIsInYiLCJpIiwibGVuZ3RoIiwidW5pcXVlIiwiYXJyIiwiaW5jbHVkZXMiLCJwdXNoIiwicmVuZGVyQ2x1c3RlckZvcmNlTGF5b3V0IiwiZGF0YSIsImRhdGFWYWwiLCJmaW5hbF9kaWN0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJjaGlsZHJlbldvcmRzIiwiY2hpbGRLZXkiLCJjbHVzdGVyX2RhdGEiLCJjb3VudCIsImhhc2giLCJhcnJheV9jaGlsZCIsImNoaWxkcyIsImNoaWxkX2hhc2giLCJjaGlsZHJlbiIsImQzIiwid2luZG93IiwiZDNWMyIsInJlbmRlckNsdXN0ZXIiLCJyYWRpdXMiLCJkZW5kb2dyYW1Db250YWluZXIiLCJkZW5kb2dyYW1EYXRhU291cmNlIiwicm9vdE5vZGVTaXplIiwibGV2ZWxPbmVOb2RlU2l6ZSIsImxldmVsVHdvTm9kZVNpemUiLCJsZXZlbFRocmVlTm9kZVNpemUiLCJkdXJhdGlvbiIsInJvb3RKc29uRGF0YSIsImNsdXN0ZXIiLCJsYXlvdXQiLCJzaXplIiwic2VwYXJhdGlvbiIsImEiLCJiIiwicGFyZW50IiwiZGVwdGgiLCJkaWFnb25hbCIsInN2ZyIsInJhZGlhbCIsInByb2plY3Rpb24iLCJkIiwieSIsIngiLCJNYXRoIiwiUEkiLCJjb250YWluZXJEaXYiLCJzZWxlY3QiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiYXBwZW5kIiwiYXR0ciIsInRleHQiLCJvbiIsImNvbGxhcHNlTGV2ZWxzIiwic3ZnUm9vdCIsImNhbGwiLCJiZWhhdmlvciIsInpvb20iLCJzY2FsZSIsInNjYWxlRXh0ZW50IiwiYW5pbUdyb3VwIiwiZm9yRWFjaCIsImNvbGxhcHNlIiwiY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtIiwic291cmNlIiwibm9kZXMiLCJwYXRobGlua3MiLCJsaW5rcyIsIm5vZGUiLCJzZWxlY3RBbGwiLCJpZCIsIm5vZGVFbnRlciIsImVudGVyIiwidG9nZ2xlQ2hpbGRyZW4iLCJhbGlhcyIsIm5hbWUiLCJub2RlVXBkYXRlIiwidHJhbnNpdGlvbiIsInN0eWxlIiwiY29sb3IiLCJvcmRlciIsIm5vZGVFeGl0IiwiZXhpdCIsInJlbW92ZSIsImxpbmsiLCJ0YXJnZXQiLCJpbnNlcnQiLCJvIiwieDAiLCJ5MCIsImNsaWNrVHlwZSIsIl9jaGlsZHJlbiIsInR5cGUiLCJ1bmRlZmluZWQiLCJoaWdobGlnaHROb2RlU2VsZWN0aW9ucyIsImhpZ2hsaWdodFJvb3RUb05vZGVQYXRoIiwiaGlnaGxpZ2h0TGlua0NvbG9yIiwiZGVmYXVsdExpbmtDb2xvciIsIm5vZGVDb2xvciIsInBhdGhMaW5rcyIsImRkIiwiYW5jZXN0b3JzIiwiXyIsImlzVW5kZWZpbmVkIiwibWF0Y2hlZExpbmtzIiwiZmlsdGVyIiwiYW55IiwicCIsImVhY2giLCJhbmltYXRlQ2hhaW5zIiwiY2xhc3NlZCIsIm92ZXJsYXlCb3giLCJnZXRCQm94IiwiZXZlbnQiLCJ0cmFuc2xhdGUiLCJjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4iLCJ0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuIiwidG9nZ2xlU2Vjb25kTGV2ZWxDaGlsZHJlbiIsInJvb3RJbmRleCIsInJvb3RMZW5ndGgiLCJpc05vZGVPcGVuIiwiY2hpbGRJbmRleCIsImNoaWxkTGVuZ3RoIiwic2Vjb25kTGV2ZWxDaGlsZCIsImxvYWRKcXVlcnkiLCIkIiwicmVhZHkiLCJjbGljayIsInNpZGViYXIiLCJyZXF1aXJlIiwiY29uZmlnIiwicGF0aHMiLCJsb2FkRDMiLCJkM09sZCIsImRvY3VtZW50cyIsImdldEFuYWx5c2lzIiwiZ2V0RG9jcyIsInRleHRzIiwibWFwIiwic3BsaXQiLCJtZXRob2QiLCJzdWNjZXNzIiwiZG9jcyIsImZuYyIsImdldExEQUNsdXN0ZXJzIiwiZ2V0V29yZDJWZWNDbHVzdGVycyIsImxvYWRERnVuYyIsInJlc3AiLCJnbG9iYWxfZGF0YSIsImluaXRQYWdlMSIsImluaXRQYWdlMiIsImluaXRQYWdlMyIsImluaXRQYWdlNCIsImxvYWRWaXN1YWxpemF0aW9ucyIsInJlbmRlckNsdXN0ZXJBbmFseXNpcyIsImh0bWwiLCJsb2FkUGFyYWxsZWxDb29yZGluYXRlIiwibG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyIsImxvYWRXb3JkQ2xvdWQiLCJnZXQyRFZlY3RvcnMiLCJ2ZWN0b3JzIiwic3VjY2Vzc0NhbGxiYWNrIiwicmVxdWVzdCIsImFqYXgiLCJ1cmwiLCJkb25lIiwicmVzcG9uc2UiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiYWxlcnQiLCJnZXRUb2tlbml6ZWREb2NzIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRUeXBlIiwiZGF0YVR5cGUiLCJzdGFydCIsInZ1ZUFwcCIsInNldHRpbmdzIiwic3RhcnQyIiwiZW5kIiwiZW5kMiIsInNlbGVjdGVkIiwic2VsZWN0ZWREYXRhc2V0IiwicGFyc2UiLCJzdGFydDEiLCJlbmQxIiwiZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMiLCJIaWdoY2hhcnRzIiwiY2hhcnQiLCJwYXJhbGxlbENvb3JkaW5hdGVzIiwicGFyYWxsZWxBeGVzIiwibGluZVdpZHRoIiwidGl0bGUiLCJwbG90T3B0aW9ucyIsInNlcmllcyIsImFuaW1hdGlvbiIsIm1hcmtlciIsImVuYWJsZWQiLCJzdGF0ZXMiLCJob3ZlciIsImhhbG8iLCJldmVudHMiLCJtb3VzZU92ZXIiLCJncm91cCIsInRvRnJvbnQiLCJ4QXhpcyIsImNhdGVnb3JpZXMiLCJvZmZzZXQiLCJ5QXhpcyIsIk9iamVjdCIsImtleXMiLCJ2YWx1ZXMiLCJjb2xvcnMiLCJzZXQiLCJzaGFkb3ciLCJtYXJnaW4iLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ3aWR0aCIsImhlaWdodCIsIm9yZGluYWwiLCJyYW5nZVBvaW50cyIsImRyYWdnaW5nIiwibGluZSIsImJhY2tncm91bmQiLCJmb3JlZ3JvdW5kIiwiZGltZW5zaW9ucyIsImNhcnMiLCJnZW5lcmF0ZVBhcmFsbGVsQ29vcmRpbmF0ZURhdGEiLCJheGlzRCIsImF4aXMiLCJvcmllbnQiLCJ0aWNrVmFsdWVzIiwicGFyc2VJbnQiLCJheGlzVCIsImF4aXNXIiwicGFyc2VGbG9hdCIsImRvbWFpbiIsImxpbmVhciIsImV4dGVudCIsInJhbmdlIiwicGF0aCIsImciLCJkcmFnIiwib3JpZ2luIiwibWluIiwibWF4Iiwic29ydCIsInBvc2l0aW9uIiwiZGVsYXkiLCJicnVzaCIsImJydXNoc3RhcnQiLCJzb3VyY2VFdmVudCIsInN0b3BQcm9wYWdhdGlvbiIsImFjdGl2ZXMiLCJlbXB0eSIsImV4dGVudHMiLCJldmVyeSIsImRvY3VtZW50X3RvcGljIiwidG9waWNfdmVjdG9ycyIsImJiIiwicXVlcnlTZWxlY3RvciIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZhbHVlIiwiYyIsImxhYmVsWCIsImxhYmVsWSIsInNjYWxlTGluZWFyIiwic2NhbGVTcXJ0Iiwib3BhY2l0eSIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsInJlbmRlckJhckdyYXBoIiwiZmFkZSIsImZhZGVPdXQiLCJ0b3BpY19udW1iZXIiLCJmaW5hbF9kYXRhIiwidGVtcCIsIlN0YXRlIiwidG9waWNfZnJlcXVlbmN5Iiwib3ZlcmFsbCIsInRvdGFsIiwiY29uc29sZSIsImxvZyIsInNjYWxlQmFuZCIsInJhbmdlUm91bmQiLCJwYWRkaW5nSW5uZXIiLCJhbGlnbiIsInoiLCJzY2FsZU9yZGluYWwiLCJuaWNlIiwic3RhY2siLCJiYW5kd2lkdGgiLCJ0aWNrcyIsInBvcCIsInN2ZzEiLCJsZWdlbmQiLCJzbGljZSIsInJldmVyc2UiLCJnZW5lcmF0ZVRvcGljVmVjdG9ycyIsInRvcGljVmVjdG9ycyIsInRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMiLCJ2ZWN0b3IiLCJ0b3BpY190aHJlc2hvbGQiLCJ3b3JkX3RocmVzaG9sZCIsInZpc0RhdGEiLCJkb2NLZXkiLCJ0b3BpYyIsInRvcGljU2NvcmUiLCJ3b3JkIiwid29yZFNjb3JlIiwiaW5kZXhPZiIsIlZ1ZSIsImVsIiwibWVzc2FnZSIsIm5vbmVTZWxlY3RlZCIsInNlbGVjdGVkUGFnZSIsInBsYXllckRldGFpbCIsIm92ZXJ2aWV3RmlsdGVycyIsIm5ld0RvY3MiLCJzZWxlY3RlZE1hcCIsImxvYWRpbmciLCJuZXdEb2MiLCJuZXdEb2NzUHJvY2Nlc3NlZCIsInNob3dQcm9jZXNzZWQiLCJzZWxlY3RlZE1ldGhvZCIsImxkYVRvcGljVGhyZXNob2xkIiwid29yZDJWZWNUaHJlc2hvbGQiLCJtZXRob2RzIiwic2VsZWN0UGFnZSIsImFkZE5ld0RvYyIsInRyaW0iLCJwcm9jZXNzRG9jcyIsInNlbGYiLCJzYXZlQ2hhbmdlcyIsIm1vdW50ZWQiLCJ3ZWlnaHQiLCJjcmVhdGVXb3JkQ2xvdWQiLCJyb3RhdGlvbiIsImZyb20iLCJ0byIsIm9yaWVudGF0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBQSxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFFBQWhCLEdBQTJCLFVBQVNDLENBQVQsRUFBWTtBQUNuQyxPQUFJLElBQUlDLENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBRyxLQUFLQyxNQUF4QixFQUFnQ0QsQ0FBQyxFQUFqQyxFQUFxQztBQUNqQyxRQUFHLEtBQUtBLENBQUwsTUFBWUQsQ0FBZixFQUFrQixPQUFPLElBQVA7QUFDckI7O0FBQ0QsU0FBTyxLQUFQO0FBQ0gsQ0FMRDs7QUFPQUgsS0FBSyxDQUFDQyxTQUFOLENBQWdCSyxNQUFoQixHQUF5QixZQUFXO0FBQ2hD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QUFBQSxLQUFLLEVBQUU7QUFDSDlJLE1BQUFBLElBQUksRUFBRThJO0FBREg7QUFYVSxHQUFyQjtBQWVIIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkFycmF5LnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uKHYpIHtcclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYodGhpc1tpXSA9PT0gdikgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5BcnJheS5wcm90b3R5cGUudW5pcXVlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJyID0gW107XHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmKCFhcnIuaW5jbHVkZXModGhpc1tpXSkpIHtcclxuICAgICAgICAgICAgYXJyLnB1c2godGhpc1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNsdXN0ZXJGb3JjZUxheW91dChkYXRhKXtcclxuXHR2YXIgZGF0YVZhbCA9IGRhdGFbXCJ0b3BpY193b3JkXCJdO1xyXG5cdHZhciBmaW5hbF9kaWN0ID0ge307XHJcblx0Zm9yICh2YXIga2V5IGluIGRhdGFWYWwpIHtcclxuXHQgICAgaWYgKGRhdGFWYWwuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cclxuXHQgICAgXHR2YXIgY2hpbGRyZW5Xb3JkcyA9IGRhdGFWYWxba2V5XTtcclxuXHJcblx0ICAgIFx0Zm9yKHZhciBjaGlsZEtleSBpbiBjaGlsZHJlbldvcmRzKXtcclxuXHJcblx0ICAgIFx0XHRpZiAoY2hpbGRyZW5Xb3Jkcy5oYXNPd25Qcm9wZXJ0eShjaGlsZEtleSkgJiYgY2hpbGRyZW5Xb3Jkc1tjaGlsZEtleV0gPiAwLjAxKSB7XHJcblxyXG5cdCAgICBcdFx0XHRpZighKGNoaWxkS2V5IGluIGZpbmFsX2RpY3QpKXtcclxuXHQgICAgXHRcdFx0XHRmaW5hbF9kaWN0W2NoaWxkS2V5XSA9IFtdO1xyXG5cdCAgICBcdFx0XHR9XHJcbiAgICBcdFx0XHRcdGZpbmFsX2RpY3RbY2hpbGRLZXldLnB1c2goa2V5KTtcclxuXHQgICAgXHRcdFx0XHJcblx0ICAgIFx0XHR9XHJcblx0ICAgIFx0fSBcclxuXHQgICAgfVxyXG4gIFx0fVxyXG4gIFx0dmFyIGNsdXN0ZXJfZGF0YSA9IHtcclxuICBcdFx0XCJuYW1lXCI6XCJcIixcclxuICBcdFx0XCJjaGlsZHJlblwiOltdXHJcbiAgXHR9XHJcblxyXG4gIFx0dmFyIGNvdW50PTA7XHJcbiAgXHRmb3IodmFyIGtleSBpbiBmaW5hbF9kaWN0KXtcclxuICBcdFx0aWYgKGZpbmFsX2RpY3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gIFx0XHRcdGNvdW50ID0gY291bnQgKyAxO1xyXG4gIFx0XHRcdHZhciBoYXNoID0ge307XHJcbiAgXHRcdFx0aGFzaFtcIm9yZGVyXCJdID0gY291bnQ7XHJcbiAgXHRcdFx0aGFzaFtcImFsaWFzXCJdID0gXCJXaGl0ZS9yZWQvamFjayBwaW5lXCI7XHJcbiAgXHRcdFx0aGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0aGFzaFtcIm5hbWVcIl0gPSBrZXk7XHJcblxyXG5cclxuICBcdFx0XHR2YXIgYXJyYXlfY2hpbGQgPSBmaW5hbF9kaWN0W2tleV0udW5pcXVlKCk7XHJcbiAgXHRcdFx0dmFyIGNoaWxkcyA9W107XHJcbiAgXHRcdFx0Zm9yKHZhciBpPTA7IGkgPCBhcnJheV9jaGlsZC5sZW5ndGg7aSsrKXtcclxuICBcdFx0XHRcdHZhciBjaGlsZF9oYXNoID0ge307XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wib3JkZXJcIl0gPSBpKzE7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wiYWxpYXNcIl0gPSBpKzEgKyBcIlwiO1xyXG4gIFx0XHRcdFx0Y2hpbGRfaGFzaFtcImNvbG9yXCJdID0gXCIjQzdFQUZCXCI7XHJcbiAgXHRcdFx0XHRjaGlsZF9oYXNoW1wibmFtZVwiXT0gYXJyYXlfY2hpbGRbaV07XHJcbiAgXHRcdFx0XHRjaGlsZHMucHVzaChjaGlsZF9oYXNoKTtcclxuICBcdFx0XHR9XHJcbiAgXHRcdFx0aGFzaFtcImNoaWxkcmVuXCJdID0gY2hpbGRzO1xyXG4gIFx0XHRcdGNsdXN0ZXJfZGF0YS5jaGlsZHJlbi5wdXNoKGhhc2gpO1xyXG4gIFx0XHR9XHJcbiAgXHR9XHJcbiAgXHR2YXIgZDMgPSAgIHdpbmRvdy5kM1YzO1xyXG4gIFx0cmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ2x1c3RlcihjbHVzdGVyX2RhdGEsIGQzKXtcclxuICB2YXIgcmFkaXVzID0gMjAwO1xyXG4gIHZhciBkZW5kb2dyYW1Db250YWluZXIgPSBcInNwZWNpZXNjb2xsYXBzaWJsZVwiO1xyXG4gIHZhciBkZW5kb2dyYW1EYXRhU291cmNlID0gXCJmb3Jlc3RTcGVjaWVzLmpzb25cIjtcclxuXHJcbiAgdmFyIHJvb3ROb2RlU2l6ZSA9IDY7XHJcbiAgdmFyIGxldmVsT25lTm9kZVNpemUgPSAzO1xyXG4gIHZhciBsZXZlbFR3b05vZGVTaXplID0gMztcclxuICB2YXIgbGV2ZWxUaHJlZU5vZGVTaXplID0gMjtcclxuXHJcblxyXG4gIHZhciBpID0gMDtcclxuICB2YXIgZHVyYXRpb24gPSAzMDA7IC8vQ2hhbmdpbmcgdmFsdWUgZG9lc24ndCBzZWVtIGFueSBjaGFuZ2VzIGluIHRoZSBkdXJhdGlvbiA/P1xyXG5cclxuICB2YXIgcm9vdEpzb25EYXRhO1xyXG5cclxuICB2YXIgY2x1c3RlciA9IGQzLmxheW91dC5jbHVzdGVyKClcclxuICAgICAgLnNpemUoWzM2MCxyYWRpdXMgLSAxMjBdKVxyXG4gICAgICAuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIChhLnBhcmVudCA9PSBiLnBhcmVudCA/IDEgOiAyKSAvIGEuZGVwdGg7XHJcbiAgICAgIH0pO1xyXG5cclxuICB2YXIgZGlhZ29uYWwgPSBkMy5zdmcuZGlhZ29uYWwucmFkaWFsKClcclxuICAgICAgLnByb2plY3Rpb24oZnVuY3Rpb24oZCkgeyByZXR1cm4gW2QueSwgZC54IC8gMTgwICogTWF0aC5QSV07IH0pO1xyXG5cclxuICB2YXIgY29udGFpbmVyRGl2ID0gZDMuc2VsZWN0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGRlbmRvZ3JhbUNvbnRhaW5lcikpO1xyXG5cclxuICBjb250YWluZXJEaXYuYXBwZW5kKFwiYnV0dG9uXCIpXHJcbiAgICAgIC5hdHRyKFwiaWRcIixcImNvbGxhcHNlLWJ1dHRvblwiKVxyXG4gICAgICAudGV4dChcIkNvbGxhcHNlIVwiKVxyXG4gICAgICAub24oXCJjbGlja1wiLGNvbGxhcHNlTGV2ZWxzKTtcclxuXHJcbiAgdmFyIHN2Z1Jvb3QgPSBjb250YWluZXJEaXYuYXBwZW5kKFwic3ZnOnN2Z1wiKVxyXG4gICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiLVwiICsgKHJhZGl1cykgKyBcIiAtXCIgKyAocmFkaXVzIC0gNTApICtcIiBcIisgcmFkaXVzKjIgK1wiIFwiKyByYWRpdXMqMilcclxuICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLnNjYWxlKDAuOSkuc2NhbGVFeHRlbnQoWzAuMSwgM10pLm9uKFwiem9vbVwiLCB6b29tKSkub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6Z1wiKTtcclxuXHJcbiAgLy8gQWRkIHRoZSBjbGlwcGluZyBwYXRoXHJcbiAgc3ZnUm9vdC5hcHBlbmQoXCJzdmc6Y2xpcFBhdGhcIikuYXR0cihcImlkXCIsIFwiY2xpcHBlci1wYXRoXCIpXHJcbiAgICAgIC5hcHBlbmQoXCJzdmc6cmVjdFwiKVxyXG4gICAgICAuYXR0cignaWQnLCAnY2xpcC1yZWN0LWFuaW0nKTtcclxuXHJcbiAgdmFyIGFuaW1Hcm91cCA9IHN2Z1Jvb3QuYXBwZW5kKFwic3ZnOmdcIilcclxuICAgICAgLmF0dHIoXCJjbGlwLXBhdGhcIiwgXCJ1cmwoI2NsaXBwZXItcGF0aClcIik7XHJcblxyXG4gIFx0cm9vdEpzb25EYXRhID0gY2x1c3Rlcl9kYXRhO1xyXG5cclxuICAgIC8vU3RhcnQgd2l0aCBhbGwgY2hpbGRyZW4gY29sbGFwc2VkXHJcbiAgICByb290SnNvbkRhdGEuY2hpbGRyZW4uZm9yRWFjaChjb2xsYXBzZSk7XHJcblxyXG4gICAgLy9Jbml0aWFsaXplIHRoZSBkZW5kcm9ncmFtXHJcbiAgXHRjcmVhdGVDb2xsYXBzaWJsZURlbmRyb0dyYW0ocm9vdEpzb25EYXRhKTtcclxuXHJcblxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29sbGFwc2libGVEZW5kcm9HcmFtKHNvdXJjZSkge1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIG5ldyB0cmVlIGxheW91dC5cclxuICAgIHZhciBub2RlcyA9IGNsdXN0ZXIubm9kZXMocm9vdEpzb25EYXRhKTtcclxuICAgIHZhciBwYXRobGlua3MgPSBjbHVzdGVyLmxpbmtzKG5vZGVzKTtcclxuXHJcbiAgICAvLyBOb3JtYWxpemUgZm9yIG5vZGVzJyBmaXhlZC1kZXB0aC5cclxuICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICBpZihkLmRlcHRoIDw9Mil7XHJcbiAgICAgICAgZC55ID0gZC5kZXB0aCo3MDtcclxuICAgICAgfWVsc2VcclxuICAgICAge1xyXG4gICAgICAgIGQueSA9IGQuZGVwdGgqMTAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIG5vZGVz4oCmXHJcbiAgICB2YXIgbm9kZSA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwiZy5ub2RlXCIpXHJcbiAgICAgICAgLmRhdGEobm9kZXMsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuaWQgfHwgKGQuaWQgPSArK2kpOyB9KTtcclxuXHJcbiAgICAvLyBFbnRlciBhbnkgbmV3IG5vZGVzIGF0IHRoZSBwYXJlbnQncyBwcmV2aW91cyBwb3NpdGlvbi5cclxuICAgIHZhciBub2RlRW50ZXIgPSBub2RlLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgLm9uKFwiY2xpY2tcIiwgdG9nZ2xlQ2hpbGRyZW4pO1xyXG5cclxuICAgIG5vZGVFbnRlci5hcHBlbmQoXCJjaXJjbGVcIik7XHJcblxyXG4gICAgbm9kZUVudGVyLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwieFwiLCAxMClcclxuICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxyXG4gICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcInN0YXJ0XCIpXHJcbiAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICBpZihkLmRlcHRoID09PSAyKXtcclxuICAgICAgICAgICAgcmV0dXJuIGQuYWxpYXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgIHJldHVybiBkLm5hbWU7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBub2RlcyB0byB0aGVpciBuZXcgcG9zaXRpb24uXHJcbiAgICB2YXIgbm9kZVVwZGF0ZSA9IG5vZGUudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIFwicm90YXRlKFwiICsgKGQueCAtIDkwKSArIFwiKXRyYW5zbGF0ZShcIiArIGQueSArIFwiKVwiOyB9KVxyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwiY2lyY2xlXCIpXHJcbiAgICAgICAgLmF0dHIoXCJyXCIsIGZ1bmN0aW9uKGQpe1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdE5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbE9uZU5vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChkLmRlcHRoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBsZXZlbFR3b05vZGVTaXplO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGxldmVsVGhyZWVOb2RlU2l6ZTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgaWYoZC5kZXB0aCA9PT0wKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiM4MDgwODBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2UgaWYoZC5kZXB0aCA9PT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZihkLm5hbWU9PVwiSGFyZHdvb2RzXCIpIHJldHVybiBcIiM4MTY4NTRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIiNDM0I5QTBcIjtcclxuICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgICAgaWYoZC5kZXB0aD4xKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwid2hpdGVcIjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlnaHRncmF5XCI7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIG5vZGVVcGRhdGUuc2VsZWN0KFwidGV4dFwiKVxyXG5cclxuICAgICAgICAuYXR0cignaWQnLCBmdW5jdGlvbihkKXtcclxuICAgICAgICAgIHZhciBvcmRlciA9IDA7XHJcbiAgICAgICAgICBpZihkLm9yZGVyKW9yZGVyID0gZC5vcmRlcjtcclxuICAgICAgICAgIHJldHVybiAnVC0nICsgZC5kZXB0aCArIFwiLVwiICsgb3JkZXI7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJlbmRcIiA6IFwic3RhcnRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCJzdGFydFwiIDogXCJlbmRcIjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gXCIxLjRlbVwiIDogXCItMC4yZW1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gXCIuMzFlbVwiO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmF0dHIoXCJkeFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICBpZiAoZC5kZXB0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7IC8vcmV0dXJuIGQueCA+IDE4MCA/IDIgOiAtMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gMSA6IC0yMDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgICAgIGlmIChkLmRlcHRoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicm90YXRlKFwiICsgKDkwIC0gZC54KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZC54IDwgMTgwID8gbnVsbCA6IFwicm90YXRlKDE4MClcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86IGFwcHJvcHJpYXRlIHRyYW5zZm9ybVxyXG4gICAgdmFyIG5vZGVFeGl0ID0gbm9kZS5leGl0KCkudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIGxpbmtz4oCmXHJcbiAgICB2YXIgbGluayA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpXHJcbiAgICAgICAgLmRhdGEocGF0aGxpbmtzLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC5pZDsgfSk7XHJcblxyXG4gICAgLy8gRW50ZXIgYW55IG5ldyBsaW5rcyBhdCB0aGUgcGFyZW50J3MgcHJldmlvdXMgcG9zaXRpb24uXHJcbiAgICBsaW5rLmVudGVyKCkuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICB2YXIgbyA9IHt4OiBzb3VyY2UueDAsIHk6IHNvdXJjZS55MH07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc3R5bGUoXCJmaWxsXCIsZnVuY3Rpb24oZCl7XHJcbiAgICAgICAgICByZXR1cm4gZC5jb2xvcjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBUcmFuc2l0aW9uIGxpbmtzIHRvIHRoZWlyIG5ldyBwb3NpdGlvbi5cclxuICAgIGxpbmsudHJhbnNpdGlvbigpXHJcbiAgICAgICAgLmR1cmF0aW9uKGR1cmF0aW9uKVxyXG4gICAgICAgIC5hdHRyKFwiZFwiLCBkaWFnb25hbCk7XHJcblxyXG4gICAgLy8gVHJhbnNpdGlvbiBleGl0aW5nIG5vZGVzIHRvIHRoZSBwYXJlbnQncyBuZXcgcG9zaXRpb24uXHJcbiAgICBsaW5rLmV4aXQoKS50cmFuc2l0aW9uKClcclxuICAgICAgICAuZHVyYXRpb24oZHVyYXRpb24pXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgIHZhciBvID0ge3g6IHNvdXJjZS54LCB5OiBzb3VyY2UueX07XHJcbiAgICAgICAgICByZXR1cm4gZGlhZ29uYWwoe3NvdXJjZTogbywgdGFyZ2V0OiBvfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVtb3ZlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBUb2dnbGUgY2hpbGRyZW4gb24gY2xpY2suXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2hpbGRyZW4oZCxjbGlja1R5cGUpIHtcclxuICAgIGlmIChkLmNoaWxkcmVuKSB7XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgZC5jaGlsZHJlbiA9IG51bGw7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBkLmNoaWxkcmVuID0gZC5fY2hpbGRyZW47XHJcbiAgICAgIGQuX2NoaWxkcmVuID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBjbGlja1R5cGUgPT0gdW5kZWZpbmVkID8gXCJub2RlXCIgOiBjbGlja1R5cGU7XHJcblxyXG4gICAgLy9BY3Rpdml0aWVzIG9uIG5vZGUgY2xpY2tcclxuICAgIGNyZWF0ZUNvbGxhcHNpYmxlRGVuZHJvR3JhbShkKTtcclxuICAgIGhpZ2hsaWdodE5vZGVTZWxlY3Rpb25zKGQpO1xyXG5cclxuICAgIGhpZ2hsaWdodFJvb3RUb05vZGVQYXRoKGQsdHlwZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQ29sbGFwc2Ugbm9kZXNcclxuICBmdW5jdGlvbiBjb2xsYXBzZShkKSB7XHJcbiAgICBpZiAoZC5jaGlsZHJlbikge1xyXG4gICAgICAgIGQuX2NoaWxkcmVuID0gZC5jaGlsZHJlbjtcclxuICAgICAgICBkLl9jaGlsZHJlbi5mb3JFYWNoKGNvbGxhcHNlKTtcclxuICAgICAgICBkLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIC8vIGhpZ2hsaWdodHMgc3Vibm9kZXMgb2YgYSBub2RlXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0Tm9kZVNlbGVjdGlvbnMoZCkge1xyXG4gICAgICB2YXIgaGlnaGxpZ2h0TGlua0NvbG9yID0gXCJkYXJrc2xhdGVncmF5XCI7Ly9cIiNmMDNiMjBcIjtcclxuICAgICAgdmFyIGRlZmF1bHRMaW5rQ29sb3IgPSBcImxpZ2h0Z3JheVwiO1xyXG5cclxuICAgICAgdmFyIGRlcHRoID0gIGQuZGVwdGg7XHJcbiAgICAgIHZhciBub2RlQ29sb3IgPSBkLmNvbG9yO1xyXG4gICAgICBpZiAoZGVwdGggPT09IDEpIHtcclxuICAgICAgICAgIG5vZGVDb2xvciA9IGhpZ2hsaWdodExpbmtDb2xvcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHBhdGhMaW5rcyA9IHN2Z1Jvb3Quc2VsZWN0QWxsKFwicGF0aC5saW5rXCIpO1xyXG5cclxuICAgICAgcGF0aExpbmtzLnN0eWxlKFwic3Ryb2tlXCIsZnVuY3Rpb24oZGQpIHtcclxuICAgICAgICAgIGlmIChkZC5zb3VyY2UuZGVwdGggPT09IDApIHtcclxuICAgICAgICAgICAgICBpZiAoZC5uYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0TGlua0NvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdExpbmtDb2xvcjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoZGQuc291cmNlLm5hbWUgPT09IGQubmFtZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBub2RlQ29sb3I7XHJcbiAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRMaW5rQ29sb3I7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy9XYWxraW5nIHBhcmVudHMnIGNoYWluIGZvciByb290IHRvIG5vZGUgdHJhY2tpbmdcclxuICBmdW5jdGlvbiBoaWdobGlnaHRSb290VG9Ob2RlUGF0aChkLGNsaWNrVHlwZSl7XHJcbiAgICB2YXIgYW5jZXN0b3JzID0gW107XHJcbiAgICB2YXIgcGFyZW50ID0gZDtcclxuICAgIHdoaWxlICghXy5pc1VuZGVmaW5lZChwYXJlbnQpKSB7XHJcbiAgICAgICAgYW5jZXN0b3JzLnB1c2gocGFyZW50KTtcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEdldCB0aGUgbWF0Y2hlZCBsaW5rc1xyXG4gICAgdmFyIG1hdGNoZWRMaW5rcyA9IFtdO1xyXG5cclxuICAgIHN2Z1Jvb3Quc2VsZWN0QWxsKCdwYXRoLmxpbmsnKVxyXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCwgaSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLmFueShhbmNlc3RvcnMsIGZ1bmN0aW9uKHApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwID09PSBkLnRhcmdldDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1hdGNoZWRMaW5rcy5wdXNoKGQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIGFuaW1hdGVDaGFpbnMobWF0Y2hlZExpbmtzLGNsaWNrVHlwZSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZUNoYWlucyhsaW5rcyxjbGlja1R5cGUpe1xyXG4gICAgICBhbmltR3JvdXAuc2VsZWN0QWxsKFwicGF0aC5zZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmRhdGEoW10pXHJcbiAgICAgICAgICAuZXhpdCgpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIilcclxuICAgICAgICAgIC5kYXRhKGxpbmtzKVxyXG4gICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwic3ZnOnBhdGhcIilcclxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgLmF0dHIoXCJkXCIsIGRpYWdvbmFsKTtcclxuXHJcblxyXG4gICAgICAvL1Jlc2V0IHBhdGggaGlnaGxpZ2h0IGlmIGNvbGxhcHNlIGJ1dHRvbiBjbGlja2VkXHJcbiAgICAgIGlmKGNsaWNrVHlwZSA9PSAnYnV0dG9uJyl7XHJcbiAgICAgICAgYW5pbUdyb3VwLnNlbGVjdEFsbChcInBhdGguc2VsZWN0ZWRcIikuY2xhc3NlZCgncmVzZXQtc2VsZWN0ZWQnLHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgb3ZlcmxheUJveCA9IHN2Z1Jvb3Qubm9kZSgpLmdldEJCb3goKTtcclxuXHJcbiAgICAgIHN2Z1Jvb3Quc2VsZWN0KFwiI2NsaXAtcmVjdC1hbmltXCIpXHJcbiAgICAgICAgICAuYXR0cihcInhcIiwgLXJhZGl1cylcclxuICAgICAgICAgIC5hdHRyKFwieVwiLCAtcmFkaXVzKVxyXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLDApXHJcbiAgICAgICAgICAuYXR0cihcImhlaWdodFwiLHJhZGl1cyoyKVxyXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbihkdXJhdGlvbilcclxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcmFkaXVzKjIpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHpvb20oKSB7XHJcbiAgICAgc3ZnUm9vdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgZDMuZXZlbnQudHJhbnNsYXRlICsgXCIpc2NhbGUoXCIgKyBkMy5ldmVudC5zY2FsZSArIFwiKVwiKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGNvbGxhcHNlTGV2ZWxzKCl7XHJcblxyXG4gICAgaWYoY2hlY2tGb3JUaGlyZExldmVsT3BlbkNoaWxkcmVuKCkpe1xyXG4gICAgICB0b2dnbGVBbGxTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gT3BlbiBmaXJzdCBsZXZlbCBvbmx5IGJ5IGNvbGxhcHNpbmcgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiB0b2dnbGVTZWNvbmRMZXZlbENoaWxkcmVuKCl7XHJcbiAgICAgIGZvcih2YXIgcm9vdEluZGV4ID0gMCwgcm9vdExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbi5sZW5ndGg7IHJvb3RJbmRleDxyb290TGVuZ3RoOyByb290SW5kZXgrKyl7XHJcbiAgICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcbiAgICAgICAgICAgICAgIHRvZ2dsZUNoaWxkcmVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLCdidXR0b24nKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE9wZW4gZmlyc3QgbGV2ZWwgb25seSBieSBjb2xsYXBzaW5nIHNlY29uZCBsZXZlbFxyXG4gICAgZnVuY3Rpb24gdG9nZ2xlQWxsU2Vjb25kTGV2ZWxDaGlsZHJlbigpe1xyXG4gICAgICBmb3IodmFyIHJvb3RJbmRleCA9IDAsIHJvb3RMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW4ubGVuZ3RoOyByb290SW5kZXg8cm9vdExlbmd0aDsgcm9vdEluZGV4Kyspe1xyXG4gICAgICAgIGlmKGlzTm9kZU9wZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0pKXtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGNoaWxkSW5kZXggPSAwLCBjaGlsZExlbmd0aCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuLmxlbmd0aDsgY2hpbGRJbmRleDxjaGlsZExlbmd0aDsgY2hpbGRJbmRleCsrKXtcclxuICAgICAgICAgICAgdmFyIHNlY29uZExldmVsQ2hpbGQgPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbltjaGlsZEluZGV4XTtcclxuICAgICAgICAgICAgaWYoaXNOb2RlT3BlbihzZWNvbmRMZXZlbENoaWxkKSl7XHJcbiAgICAgICAgICAgICAgdG9nZ2xlQ2hpbGRyZW4ocm9vdEpzb25EYXRhLmNoaWxkcmVuW3Jvb3RJbmRleF0uY2hpbGRyZW5bY2hpbGRJbmRleF0sJ2J1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayBpZiBhbnkgbm9kZXMgb3BlbnMgYXQgc2Vjb25kIGxldmVsXHJcbiAgICBmdW5jdGlvbiBjaGVja0ZvclRoaXJkTGV2ZWxPcGVuQ2hpbGRyZW4oKXtcclxuICAgICAgZm9yKHZhciByb290SW5kZXggPSAwLCByb290TGVuZ3RoID0gcm9vdEpzb25EYXRhLmNoaWxkcmVuLmxlbmd0aDsgcm9vdEluZGV4PHJvb3RMZW5ndGg7IHJvb3RJbmRleCsrKXtcclxuICAgICAgICBpZihpc05vZGVPcGVuKHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdKSl7XHJcblxyXG4gICAgICAgICAgZm9yKHZhciBjaGlsZEluZGV4ID0gMCwgY2hpbGRMZW5ndGggPSByb290SnNvbkRhdGEuY2hpbGRyZW5bcm9vdEluZGV4XS5jaGlsZHJlbi5sZW5ndGg7IGNoaWxkSW5kZXg8Y2hpbGRMZW5ndGg7IGNoaWxkSW5kZXgrKyl7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2Vjb25kTGV2ZWxDaGlsZCA9IHJvb3RKc29uRGF0YS5jaGlsZHJlbltyb290SW5kZXhdLmNoaWxkcmVuW2NoaWxkSW5kZXhdO1xyXG4gICAgICAgICAgICBpZihpc05vZGVPcGVuKHNlY29uZExldmVsQ2hpbGQpKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzTm9kZU9wZW4oZCl7XHJcbiAgICAgIGlmKGQuY2hpbGRyZW4pe3JldHVybiB0cnVlO31cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcbiAgIiwiZnVuY3Rpb24gbG9hZEpxdWVyeSgpe1xyXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKFwiI3RvZ2dsZS1zaWRlYmFyXCIpLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICQoJy51aS5zaWRlYmFyJylcclxuICAgICAgICAgICAgICAgIC5zaWRlYmFyKCd0b2dnbGUnKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxufVxyXG4iLCJyZXF1aXJlLmNvbmZpZyh7XHJcbiAgICBwYXRoczoge1xyXG4gICAgICAgIFwiZDNcIjogXCJodHRwczovL2QzanMub3JnL2QzLnYzLm1pblwiXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gbG9hZEQzKCl7XHJcblxyXG4gICAgd2luZG93LmQzT2xkID0gZDM7XHJcbiAgICByZXF1aXJlKFsnZDMnXSwgZnVuY3Rpb24oZDNWMykge1xyXG4gICAgICAgIHdpbmRvdy5kM1YzID0gZDNWMztcclxuICAgICAgICB3aW5kb3cuZDMgPSBkM09sZDtcclxuICAgICAgICAvLyB3aW5kb3cuZG9jdW1lbnRzID0gW1xyXG4gICAgICAgIC8vICAgICAgICAgLy8gICBbXCJpXCIsIFwiYW1cIiwgXCJiYXRtYW5cIiwgXCJvZlwiLCBcIndpbnRlcmZhbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInRoZXJlXCIsIFwic2hvdWxkXCIsIFwiYWx3YXlzXCIsIFwiYmVcIiwgXCJhXCIsIFwic3RhcmtcIiwgXCJpblwiLCBcIndpbnRlcmZlbGxcIl0sXHJcbiAgICAgICAgLy8gICAgICAgICAvLyAgIFtcInByb3BoZWN5XCIsIFwic2F5c1wiLCBcInByaW5jZVwiLCBcIndpbGxcIiwgXCJiZVwiICwgXCJyZWJvcm5cIl1cclxuICAgICAgICAvLyAgICAgICAgIC8vIF07XHJcbiAgICAgICAgLy8gICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbWydwcm9qZWN0JywgJ2NsYXNzaWZpY2F0aW9uJywgJ2NvbXBhcmUnLCAnbmV1cmFsJywgJ25ldHMnLCAnU1ZNJywgJ2R1ZScsICdkdWUnXSwgWyd0d28nLCAnbmV3JywgJ3Byb2dyZXNzJywgJ2NoZWNrcycsICdmaW5hbCcsICdwcm9qZWN0JywgICdhc3NpZ25lZCcsICdmb2xsb3dzJ10sIFsncmVwb3J0JywgJ2dyYWRlZCcsICAnY29udHJpYnV0ZScsICdwb2ludHMnLCAgJ3RvdGFsJywgJ3NlbWVzdGVyJywgJ2dyYWRlJ10sIFsncHJvZ3Jlc3MnLCAndXBkYXRlJywgJ2V2YWx1YXRlZCcsICdUQScsICdwZWVycyddLCBbJ2NsYXNzJywgJ21lZXRpbmcnLCAndG9tb3Jyb3cnLCd0ZWFtcycsICd3b3JrJywgJ3Byb2dyZXNzJywgJ3JlcG9ydCcsICdmaW5hbCcsICdwcm9qZWN0J10sIFsgJ3F1aXonLCAgJ3NlY3Rpb25zJywgJ3JlZ3VsYXJpemF0aW9uJywgJ1R1ZXNkYXknXSwgWyAncXVpeicsICdUaHVyc2RheScsICdsb2dpc3RpY3MnLCAnd29yaycsICdvbmxpbmUnLCAnc3R1ZGVudCcsICdwb3N0cG9uZScsICAncXVpeicsICdUdWVzZGF5J10sIFsncXVpeicsICdjb3ZlcicsICdUaHVyc2RheSddLCBbJ3F1aXonLCAnY2hhcCcsICdjaGFwJywgJ2xpbmVhcicsICdyZWdyZXNzaW9uJ11dO1xyXG4gICAgICAgIHdpbmRvdy5kb2N1bWVudHMgPSBbXHJcbiAgICAgICAgICAgIFsnc2VyaW91cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndGFsaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZnJpZW5kcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmxha3knLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2xhdGVseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzdG9vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZ29vZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZXZlbmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnaGFuZ2luZyddLFxyXG4gICAgICAgICAgICBbJ2dvdCcsICdnaWZ0JywgJ2VsZGVyJywgJ2Jyb3RoZXInLCAncmVhbGx5JywgJ3N1cnByaXNpbmcnXSxcclxuICAgICAgICAgICAgICAgICAgICAgWydjb21wbGV0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJzUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ21pbGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdydW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ3dpdGhvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgJ2JyZWFrJyxcclxuICAgICAgICAgICAgICAgICAgICAgICdtYWtlcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnZmVlbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAnc3Ryb25nJ10sXHJcblxyXG4gICAgICAgICAgICBbJ3NvbicsICdwZXJmb3JtZWQnLCAnd2VsbCcsICd0ZXN0JyxcclxuICAgICAgICAgICAgICAgICdwcmVwYXJhdGlvbiddXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZ2V0QW5hbHlzaXMoXCJ3b3JkMnZlY1wiKTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RG9jcyh0ZXh0cykge1xyXG4gIHJldHVybiB3aW5kb3cuZG9jdW1lbnRzID0gdGV4dHMubWFwKHggPT4geC5zcGxpdCgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QW5hbHlzaXMobWV0aG9kLCBzdWNjZXNzKSB7XHJcbiAgbGV0IGRvY3MgPSB3aW5kb3cuZG9jdW1lbnRzO1xyXG4gIGxldCBmbmMgPSB4ID0+IHg7XHJcbiAgaWYgKG1ldGhvZCA9PT0gXCJMREFcIikge1xyXG4gICAgZm5jID0gZ2V0TERBQ2x1c3RlcnM7XHJcblxyXG4gIH0gZWxzZSB7XHJcbiAgICBmbmMgPSBnZXRXb3JkMlZlY0NsdXN0ZXJzO1xyXG4gIH1cclxuICB3aW5kb3cubG9hZERGdW5jID0gIGZuYztcclxuICBmbmMoZG9jcywgcmVzcCA9PiB7XHJcbiAgICAgIHdpbmRvdy5nbG9iYWxfZGF0YSA9IHJlc3A7XHJcbiAgICBpbml0UGFnZTEocmVzcCk7XHJcbiAgICBpbml0UGFnZTIocmVzcCk7XHJcbiAgICBpbml0UGFnZTMocmVzcCk7XHJcbiAgICBpbml0UGFnZTQoKTtcclxuICAgIGlmKHN1Y2Nlc3Mpe1xyXG4gICAgICAgIHN1Y2Nlc3MocmVzcCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvYWRWaXN1YWxpemF0aW9ucygpIHtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UxKHJlc3ApIHtcclxuICByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCk7XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gaW5pdFBhZ2UyKHJlc3ApIHtcclxuICByZW5kZXJDbHVzdGVyRm9yY2VMYXlvdXQocmVzcCk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGFnZTMocmVzcCl7XHJcbiAgICAkKFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI3BjLWNvbnRhaW5lclwiKS5odG1sKFwiXCIpO1xyXG4gICAgbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZShyZXNwKTtcclxuICAgIGxvYWRQYXJhbGxlbENvb3JkaW5hdGVzSEMocmVzcCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRQYWdlNCgpe1xyXG4gICAgJChcIiNvdmVyYWxsLXdjXCIpLmh0bWwoKTtcclxuICAgIGxvYWRXb3JkQ2xvdWQod2luZG93Lmdsb2JhbF9kYXRhKTtcclxufSIsIi8vdmVjdG9ycyBmb3JtYXQ6IE1hcFtzdHJpbmcodG9waWNfaWQpOiBMaXN0W2Zsb2F0XV1cclxuZnVuY3Rpb24gZ2V0MkRWZWN0b3JzKHZlY3RvcnMsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9nZXQyRFZlY3RvcnNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IHZlY3RvcnNcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFRva2VuaXplZERvY3MoZG9jcywgc3VjY2Vzc0NhbGxiYWNrKXtcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IFwiL2dldERvY3NGcm9tVGV4dHNcIixcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtkb2NzOiBkb2NzfSksXHJcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgIGRhdGFUeXBlICAgOiBcImpzb25cIlxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKHJlc3BvbnNlLmRvY3MpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJlcXVlc3QuZmFpbChmdW5jdGlvbigganFYSFIsIHRleHRTdGF0dXMgKSB7XHJcbiAgICAgICAgYWxlcnQoIFwiUmVxdWVzdCBmYWlsZWQ6IFwiICsgdGV4dFN0YXR1cyApO1xyXG4gICAgICB9KTtcclxufVxyXG5cclxuLy8gZG9jcyBmb3JtYXQ6IExpc3RbTGlzdFtzdHJpbmcod29yZCldXVxyXG5mdW5jdGlvbiBnZXRXb3JkMlZlY0NsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0Q2x1c3RlcnNXb3JkMlZlY1wiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnN0YXJ0MiwgZW5kOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLmVuZDIsIHNlbGVjdGVkOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2soSlNPTi5wYXJzZShyZXNwb25zZSkpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldExEQUNsdXN0ZXJzKGRvY3MsIHN1Y2Nlc3NDYWxsYmFjayl7XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBcIi9hcGkvZ2V0TERBRGF0YVwiLFxyXG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe2RvY3M6IGRvY3MsIHN0YXJ0OiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnN0YXJ0MSwgZW5kOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLmVuZDEsIHNlbGVjdGVkOiB3aW5kb3cudnVlQXBwLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldH0pLFxyXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICBkYXRhVHlwZSAgIDogXCJqc29uXCJcclxuICAgICAgfSk7XHJcbiAgICAgICBcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuICAgICAgICBzdWNjZXNzQ2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgICAgIFxyXG4gICAgICByZXF1ZXN0LmZhaWwoZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xyXG4gICAgICAgIGFsZXJ0KCBcIlJlcXVlc3QgZmFpbGVkOiBcIiArIHRleHRTdGF0dXMgKTtcclxuICAgICAgfSk7XHJcbn1cclxuIiwiZnVuY3Rpb24gbG9hZFBhcmFsbGVsQ29vcmRpbmF0ZXNIQyhyZXNwKXtcclxuXHJcblxyXG4gICAgICAgIGxldCBkYXRhID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcCwgMCwgMCk7XHJcbiAgICAgICAgSGlnaGNoYXJ0cy5jaGFydCgncGMtY29udGFpbmVyJywge1xyXG4gICAgICAgICAgICBjaGFydDoge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwbGluZScsXHJcbiAgICAgICAgICAgICAgICBwYXJhbGxlbENvb3JkaW5hdGVzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcGFyYWxsZWxBeGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiAyXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRpdGxlOiB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0OiAnRG9jdW1lbnQgLSBUb3BpYyAtIFdvcmQgUmVsYXRpb25zaGlwJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwbG90T3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgc2VyaWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbG86IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXAudG9Gcm9udCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAvLyB0b29sdGlwOiB7XHJcbiAgICAgICAgICAgIC8vICAgICBwb2ludEZvcm1hdDogJzxzcGFuIHN0eWxlPVwiY29sb3I6e3BvaW50LmNvbG9yfVwiPlxcdTI1Q0Y8L3NwYW4+JyArXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgJ3tzZXJpZXMubmFtZX06IDxiPntwb2ludC5mb3JtYXR0ZWRWYWx1ZX08L2I+PGJyLz4nXHJcbiAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgIHhBeGlzOiB7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgJ0RvY3VtZW50JyxcclxuICAgICAgICAgICAgICAgICAgICAnVG9waWMnLFxyXG4gICAgICAgICAgICAgICAgICAgICdXb3JkJ1xyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIG9mZnNldDogMTBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgeUF4aXM6IFt7XHJcbiAgICAgICAgICAgICAgICBjYXRlZ29yaWVzOiBPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4PT4gXCIuLi4uLi4uLi4uLi4uLi4uRG9jdW1lbnQgXCIreClcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczogcmVzcFtcInRvcGljc1wiXS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlRvcGljIFwiK3gpXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIGNhdGVnb3JpZXM6IE9iamVjdC52YWx1ZXMocmVzcFtcIndvcmRzXCJdKS5tYXAoeD0+IFwiLi4uLi4uLi4uLi4uLi4uLlwiK3gpXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBjb2xvcnM6IFsncmdiYSgxMSwgMjAwLCAyMDAsIDAuMSknXSxcclxuICAgICAgICAgICAgc2VyaWVzOiBkYXRhLm1hcChmdW5jdGlvbiAoc2V0LCBpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHNldCxcclxuICAgICAgICAgICAgICAgICAgICBzaGFkb3c6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG5cclxufVxyXG5cclxuXHJcbiIsImZ1bmN0aW9uIGxvYWRQYXJhbGxlbENvb3JkaW5hdGUocmVzcCl7XHJcbiAgICB2YXIgbWFyZ2luID0ge3RvcDogMzAsIHJpZ2h0OiAxMCwgYm90dG9tOiAxMCwgbGVmdDogMTB9LFxyXG4gICAgICAgIHdpZHRoID0gOTYwIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICAgICAgaGVpZ2h0ID0gNTAwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgdmFyIHggPSBkM1YzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgd2lkdGhdLCAxKSxcclxuICAgICAgICB5ID0ge30sXHJcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcclxuXHJcbiAgICB2YXIgbGluZSA9IGQzVjMuc3ZnLmxpbmUoKSxcclxuICAgICAgICBiYWNrZ3JvdW5kLFxyXG4gICAgICAgIGZvcmVncm91bmQ7XHJcblxyXG4gICAgdmFyIHN2ZyA9IGQzVjMuc2VsZWN0KFwiI3BhcmFsbGVsLWNvb3JkaW5hdGUtdmlzXCIpLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcclxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4ubGVmdCArIFwiLFwiICsgbWFyZ2luLnRvcCArIFwiKVwiKSwgZGltZW5zaW9ucztcclxuXHJcblxyXG4gICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBkaW1lbnNpb25zIGFuZCBjcmVhdGUgYSBzY2FsZSBmb3IgZWFjaC5cclxuICAgIHZhciBjYXJzID0gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3AsIDAsIDApO1xyXG4gICAgLy8gdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja3MoT2JqZWN0LmtleXMocmVzcFtcImRvY3VtZW50X3RvcGljXCJdKS5sZW5ndGgpLFxyXG4gICAgdmFyIGF4aXNEID0gZDNWMy5zdmcuYXhpcygpLm9yaWVudChcImxlZnRcIikudGlja1ZhbHVlcyhPYmplY3Qua2V5cyhyZXNwW1wiZG9jdW1lbnRfdG9waWNcIl0pLm1hcCh4ID0+IHBhcnNlSW50KHgpKSksXHJcbiAgICAgICAgYXhpc1QgPSBkM1YzLnN2Zy5heGlzKCkub3JpZW50KFwibGVmdFwiKS50aWNrVmFsdWVzKHJlc3BbXCJ0b3BpY3NcIl0ubWFwKHggPT4gcGFyc2VJbnQoeCkpKSxcclxuICAgICAgICBheGlzVyA9IGQzVjMuc3ZnLmF4aXMoKS5vcmllbnQoXCJsZWZ0XCIpLnRpY2tWYWx1ZXMoT2JqZWN0LnZhbHVlcyhyZXNwW1wib3ZlcmFsbF93b3JkXCJdKS5tYXAoeCA9PiBwYXJzZUZsb2F0KHgpKSk7XHJcblxyXG4gICAgeC5kb21haW4oZGltZW5zaW9ucyA9IGQzVjMua2V5cyhjYXJzWzBdKS5maWx0ZXIoZnVuY3Rpb24oZCkge1xyXG4gICAgICAgIHJldHVybiBkICE9IFwibmFtZVwiICYmICh5W2RdID0gZDNWMy5zY2FsZS5saW5lYXIoKVxyXG4gICAgICAgICAgICAuZG9tYWluKGQzVjMuZXh0ZW50KGNhcnMsIGZ1bmN0aW9uKHApIHsgcmV0dXJuICtwW2RdOyB9KSlcclxuICAgICAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKSk7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cclxuICAgIGJhY2tncm91bmQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXHJcbiAgICAgICAgLnNlbGVjdEFsbChcInBhdGhcIilcclxuICAgICAgICAuZGF0YShjYXJzKVxyXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcclxuICAgICAgICAuYXR0cihcImRcIiwgcGF0aCk7XHJcblxyXG4gICAgLy8gQWRkIGJsdWUgZm9yZWdyb3VuZCBsaW5lcyBmb3IgZm9jdXMuXHJcbiAgICBmb3JlZ3JvdW5kID0gc3ZnLmFwcGVuZChcImdcIilcclxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZm9yZWdyb3VuZFwiKVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJwYXRoXCIpXHJcbiAgICAgICAgLmRhdGEoY2FycylcclxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXHJcbiAgICAgICAgLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG5cclxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxyXG4gICAgdmFyIGcgPSBzdmcuc2VsZWN0QWxsKFwiLmRpbWVuc2lvblwiKVxyXG4gICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXHJcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkaW1lbnNpb25cIilcclxuICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHgoZCkgKyBcIilcIjsgfSlcclxuICAgICAgICAuY2FsbChkM1YzLmJlaGF2aW9yLmRyYWcoKVxyXG4gICAgICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHt4OiB4KGQpfTsgfSlcclxuICAgICAgICAgICAgLm9uKFwiZHJhZ3N0YXJ0XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSB4KGQpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oXCJkcmFnXCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbih3aWR0aCwgTWF0aC5tYXgoMCwgZDNWMy5ldmVudC54KSk7XHJcbiAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cihcImRcIiwgcGF0aCk7XHJcbiAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcclxuICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XHJcbiAgICAgICAgICAgIGcuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBcInRyYW5zbGF0ZShcIiArIHBvc2l0aW9uKGQpICsgXCIpXCI7IH0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbihcImRyYWdlbmRcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24oZDNWMy5zZWxlY3QodGhpcykpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyB4KGQpICsgXCIpXCIpO1xyXG4gICAgICAgICAgICB0cmFuc2l0aW9uKGZvcmVncm91bmQpLmF0dHIoXCJkXCIsIHBhdGgpO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kXHJcbiAgICAgICAgICAgICAgICAuYXR0cihcImRcIiwgcGF0aClcclxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKClcclxuICAgICAgICAgICAgICAgIC5kZWxheSg1MDApXHJcbiAgICAgICAgICAgICAgICAuZHVyYXRpb24oMClcclxuICAgICAgICAgICAgICAgIC5hdHRyKFwidmlzaWJpbGl0eVwiLCBudWxsKTtcclxuICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgIC8vIEFkZCBhbiBheGlzIGFuZCB0aXRsZS5cclxuICAgIGcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJheGlzXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBsZXQgYXhpcyA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmKGQgPT0gXCJkb2N1bWVudFwiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzRDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGQgPT0gXCJ0b3BpY1wiKXtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGF4aXMgPSBheGlzVztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKFxyXG4gICAgICAgICAgICAgICAgYXhpcy5zY2FsZSh5W2RdKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAuc3R5bGUoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgIC5hdHRyKFwieVwiLCAtOSlcclxuICAgICAgICAudGV4dChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBkO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxyXG4gICAgZy5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJydXNoXCIpXHJcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICBkM1YzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkM1YzLnN2Zy5icnVzaCgpLnkoeVtkXSkub24oXCJicnVzaHN0YXJ0XCIsIGJydXNoc3RhcnQpLm9uKFwiYnJ1c2hcIiwgYnJ1c2gpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zZWxlY3RBbGwoXCJyZWN0XCIpXHJcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04KVxyXG4gICAgICAgIC5hdHRyKFwid2lkdGhcIiwgMTYpO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XHJcbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IHgoZCkgOiB2O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zaXRpb24oZykge1xyXG4gICAgcmV0dXJuIGcudHJhbnNpdGlvbigpLmR1cmF0aW9uKDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxyXG4gICAgZnVuY3Rpb24gcGF0aChkKSB7XHJcbiAgICByZXR1cm4gbGluZShkaW1lbnNpb25zLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYnJ1c2hzdGFydCgpIHtcclxuICAgIGQzVjMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxyXG4gICAgZnVuY3Rpb24gYnJ1c2goKSB7XHJcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxyXG4gICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcclxuICAgIGZvcmVncm91bmQuc3R5bGUoXCJkaXNwbGF5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICByZXR1cm4gYWN0aXZlcy5ldmVyeShmdW5jdGlvbihwLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVudHNbaV1bMF0gPD0gZFtwXSAmJiBkW3BdIDw9IGV4dGVudHNbaV1bMV07XHJcbiAgICAgICAgfSkgPyBudWxsIDogXCJub25lXCI7XHJcbiAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJmdW5jdGlvbiByZW5kZXJDbHVzdGVyQW5hbHlzaXMocmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIi5jaGFydDEyXCIpLnJlbW92ZSgpO1xyXG4gIHZhciBkb2N1bWVudF90b3BpYyA9IHJlc3BbXCJkb2N1bWVudF90b3BpY1wiXVswXTtcclxuICB2YXIgdG9waWNfdmVjdG9ycyA9IHJlc3BbXCJ0b3BpY192ZWN0b3JzXCJdO1xyXG4gIHZhciBiYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjbHVzdGVyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNjAwO1xyXG4gIHZhciBoZWlnaHQgPSA0MDA7XHJcbiAgdmFyIG1hcmdpbiA9IDgwO1xyXG4gIHZhciBkYXRhID0gW107XHJcblxyXG4gIE9iamVjdC5rZXlzKHRvcGljX3ZlY3RvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XHJcbiAgICB2YXIgdmFsdWUgPSB0b3BpY192ZWN0b3JzW2tleV07XHJcbiAgICBkYXRhLnB1c2goe1xyXG4gICAgICB4OiB2YWx1ZVswXSxcclxuICAgICAgeTogdmFsdWVbMV0sXHJcbiAgICAgIGM6IDEsXHJcbiAgICAgIHNpemU6IGRvY3VtZW50X3RvcGljW2tleV0sXHJcbiAgICAgIGtleToga2V5XHJcbiAgICB9KTtcclxuICB9KTtcclxuICB2YXIgbGFiZWxYID0gJ1gnO1xyXG4gIHZhciBsYWJlbFkgPSAnWSc7XHJcblxyXG4gIHZhciBzdmcgPSBkMy5zZWxlY3QoJyNjbHVzdGVyJylcclxuICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQxMicpXHJcbiAgICAuYXR0cignaWQnLCdjbHVzdGVyX2lkJylcclxuICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGggKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4gKyBtYXJnaW4pXHJcbiAgICAuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBtYXJnaW4gKyBcIixcIiArIG1hcmdpbiArIFwiKVwiKTtcclxuXHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueDtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMCwgd2lkdGhdKTtcclxuXHJcbiAgdmFyIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQueTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gIHZhciBzY2FsZSA9IGQzLnNjYWxlU3FydCgpXHJcbiAgICAuZG9tYWluKFtkMy5taW4oZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIGQuc2l6ZTtcclxuICAgIH0pXSlcclxuICAgIC5yYW5nZShbMTAsIDIwXSk7XHJcblxyXG4gIHZhciBvcGFjaXR5ID0gZDMuc2NhbGVTcXJ0KClcclxuICAgIC5kb21haW4oW2QzLm1pbihkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSksIGQzLm1heChkYXRhLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZC5zaXplO1xyXG4gICAgfSldKVxyXG4gICAgLnJhbmdlKFsxLCAuNV0pO1xyXG5cclxuXHJcbiAgdmFyIHhBeGlzID0gZDMuYXhpc0JvdHRvbSgpLnNjYWxlKHgpO1xyXG4gIHZhciB5QXhpcyA9IGQzLmF4aXNMZWZ0KCkuc2NhbGUoeSk7XHJcblxyXG5cclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxyXG4gICAgLmNhbGwoeUF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIDIwKVxyXG4gICAgLmF0dHIoXCJ5XCIsIC1tYXJnaW4pXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFkpO1xyXG4gIC8vIHggYXhpcyBhbmQgbGFiZWxcclxuICBzdmcuYXBwZW5kKFwiZ1wiKVxyXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCxcIiArIGhlaWdodCArIFwiKVwiKVxyXG4gICAgLmNhbGwoeEF4aXMpXHJcbiAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgLmF0dHIoXCJ4XCIsIHdpZHRoICsgMjApXHJcbiAgICAuYXR0cihcInlcIiwgbWFyZ2luIC0gMTApXHJcbiAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcclxuICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAudGV4dChsYWJlbFgpO1xyXG5cclxuICBzdmcuc2VsZWN0QWxsKFwiY2lyY2xlXCIpXHJcbiAgICAuZGF0YShkYXRhKVxyXG4gICAgLmVudGVyKClcclxuICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAuaW5zZXJ0KFwiY2lyY2xlXCIpXHJcbiAgICAuYXR0cihcImN4XCIsIHdpZHRoIC8gMilcclxuICAgIC5hdHRyKFwiY3lcIiwgaGVpZ2h0IC8gMilcclxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gb3BhY2l0eShkLnNpemUpO1xyXG4gICAgfSlcclxuICAgIC5hdHRyKFwiclwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gc2NhbGUoZC5zaXplKTtcclxuICAgIH0pXHJcbiAgICAuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiBcIiMxZjc3YjRcIjtcclxuICAgIH0pXHJcbiAgICAub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJlbmRlckJhckdyYXBoKGRbXCJrZXlcIl0sIHJlc3ApO1xyXG4gICAgICBmYWRlKGQuYywgLjcpO1xyXG4gICAgfSlcclxuICAgIC5vbignbW91c2VvdXQnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICBmYWRlT3V0KCk7XHJcbiAgICB9KVxyXG4gICAgLnRyYW5zaXRpb24oKVxyXG4gICAgLmRlbGF5KGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgIHJldHVybiB4KGQueCkgLSB5KGQueSk7XHJcbiAgICB9KVxyXG4gICAgLmR1cmF0aW9uKDUwMClcclxuICAgIC5hdHRyKFwiY3hcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgcmV0dXJuIHgoZC54KTtcclxuICAgIH0pXHJcbiAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB5KGQueSk7XHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgICAvLyB0ZXh0IGxhYmVsIGZvciB0aGUgeCBheGlzXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInhcIiwgd2lkdGgpXHJcbiAgICAuYXR0cihcInlcIiwgaGVpZ2h0ICs0MClcclxuICAgIC50ZXh0KFwiUEMxXCIpO1xyXG5cclxuXHJcbiAgc3ZnLmFwcGVuZChcInRleHRcIilcclxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ5IGxhYmVsXCIpXHJcbiAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXHJcbiAgICAuYXR0cihcInlcIiwgLTUwKVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIi43NWVtXCIpXHJcbiAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgtOTApXCIpXHJcbiAgICAudGV4dChcIlBDMlwiKTtcclxuXHJcblxyXG4gIGZ1bmN0aW9uIGZhZGUoYywgb3BhY2l0eSkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgICAgcmV0dXJuIGQuYyAhPSBjO1xyXG4gICAgICB9KVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgb3BhY2l0eSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmYWRlT3V0KCkge1xyXG4gICAgc3ZnLnNlbGVjdEFsbChcImNpcmNsZVwiKVxyXG4gICAgICAudHJhbnNpdGlvbigpXHJcbiAgICAgIC5zdHlsZShcIm9wYWNpdHlcIiwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICBvcGFjaXR5KGQuc2l6ZSk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxufSIsImZ1bmN0aW9uIHJlbmRlckJhckdyYXBoKHRvcGljX251bWJlciwgcmVzcCkge1xyXG4gIGQzLnNlbGVjdChcIiNzdGFjay1iYXJcIikucmVtb3ZlKCk7XHJcbiAgZDMuc2VsZWN0KFwiI2xlZ2VuZHN2Z1wiKS5yZW1vdmUoKTtcclxuICB2YXIgZmluYWxfZGF0YSA9IFtdO1xyXG4gIHZhciBkYXRhVmFsID1yZXNwW1widG9waWNfd29yZFwiXVt0b3BpY19udW1iZXJdO1xyXG4gIGZvciAodmFyIGtleSBpbiBkYXRhVmFsKSB7XHJcbiAgICBpZiAoZGF0YVZhbC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgdmFyIHRlbXAgPXt9O1xyXG4gICAgICAgIHRlbXAuU3RhdGUgPSBrZXk7XHJcbiAgICAgICAgdGVtcC50b3BpY19mcmVxdWVuY3kgPSBkYXRhVmFsW2tleV07XHJcbiAgICAgICAgdGVtcC5vdmVyYWxsID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldO1xyXG4gICAgICAgIHRlbXAudG90YWwgPSB0ZW1wLnRvcGljX2ZyZXF1ZW5jeSArIHRlbXAub3ZlcmFsbDtcclxuICAgICAgICBmaW5hbF9kYXRhLnB1c2godGVtcCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coa2V5ICsgXCItPlwiICsgcmVzcFtcIm92ZXJhbGxfd29yZFwiXVtrZXldKTtcclxuICAgIH1cclxuICAgIFxyXG4gIH1cclxuICBcclxuXHJcbiAgdmFyIGJiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3N0YWNrZWQtYmFyJylcclxuICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgIHdpZHRoID0gNjAwO1xyXG5cclxuICB2YXIgZGF0YSA9IGZpbmFsX2RhdGE7XHJcbiAgdmFyIGhlaWdodCA9IGRhdGEubGVuZ3RoICogMjU7XHJcbiAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNzdGFja2VkLWJhclwiKS5hcHBlbmQoXCJzdmdcIikuYXR0cihcIndpZHRoXCIsIHdpZHRoKS5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCkuYXR0cihcImlkXCIsXCJzdGFjay1iYXJcIiksXHJcbiAgICBtYXJnaW4gPSB7XHJcbiAgICAgIHRvcDogMjAsXHJcbiAgICAgIHJpZ2h0OiAyMCxcclxuICAgICAgYm90dG9tOiAzMCxcclxuICAgICAgbGVmdDogODBcclxuICAgIH0sXHJcbiAgICB3aWR0aCA9ICtzdmcuYXR0cihcIndpZHRoXCIpIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXHJcbiAgICBoZWlnaHQgPSArc3ZnLmF0dHIoXCJoZWlnaHRcIikgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSxcclxuICAgIGcgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbWFyZ2luLmxlZnQgKyBcIixcIiArIG1hcmdpbi50b3AgKyBcIilcIik7XHJcbiAgdmFyIHkgPSBkMy5zY2FsZUJhbmQoKSAvLyB4ID0gZDMuc2NhbGVCYW5kKCkgIFxyXG4gICAgLnJhbmdlUm91bmQoWzAsIGhlaWdodF0pIC8vIC5yYW5nZVJvdW5kKFswLCB3aWR0aF0pXHJcbiAgICAucGFkZGluZ0lubmVyKDAuMjUpLmFsaWduKDAuMSk7XHJcbiAgdmFyIHggPSBkMy5zY2FsZUxpbmVhcigpIC8vIHkgPSBkMy5zY2FsZUxpbmVhcigpXHJcbiAgICAucmFuZ2VSb3VuZChbMCwgd2lkdGhdKTsgLy8gLnJhbmdlUm91bmQoW2hlaWdodCwgMF0pO1xyXG5cclxuICB2YXIgeiA9IGQzLnNjYWxlT3JkaW5hbCgpLnJhbmdlKFtcIiNDODQyM0VcIiwgXCIjQTFDN0UwXCJdKTtcclxuICB2YXIga2V5cyA9IFtcInRvcGljX2ZyZXF1ZW5jeVwiLCBcIm92ZXJhbGxfZnJlcXVlbmN5XCJdO1xyXG4gIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xyXG4gIH0pO1xyXG4gIHkuZG9tYWluKGRhdGEubWFwKGZ1bmN0aW9uIChkKSB7XHJcbiAgICByZXR1cm4gZC5TdGF0ZTtcclxuICB9KSk7IC8vIHguZG9tYWluLi4uXHJcblxyXG4gIHguZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgIHJldHVybiBkLnRvdGFsO1xyXG4gIH0pXSkubmljZSgpOyAvLyB5LmRvbWFpbi4uLlxyXG5cclxuICB6LmRvbWFpbihrZXlzKTtcclxuICBnLmFwcGVuZChcImdcIikuc2VsZWN0QWxsKFwiZ1wiKS5kYXRhKGQzLnN0YWNrKCkua2V5cyhrZXlzKShkYXRhKSkuZW50ZXIoKS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB6KGQua2V5KTtcclxuICAgIH0pLnNlbGVjdEFsbChcInJlY3RcIikuZGF0YShmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4gZDtcclxuICAgIH0pLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geShkLmRhdGEuU3RhdGUpO1xyXG4gICAgfSkgLy8uYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geChkLmRhdGEuU3RhdGUpOyB9KVxyXG4gICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XHJcbiAgICAgIHJldHVybiB4KGRbMF0pO1xyXG4gICAgfSkgLy8uYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4geShkWzFdKTsgfSkgIFxyXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xyXG4gICAgICByZXR1cm4geChkWzFdKSAtIHgoZFswXSk7XHJcbiAgICB9KSAvLy5hdHRyKFwiaGVpZ2h0XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZFswXSkgLSB5KGRbMV0pOyB9KVxyXG4gICAgLmF0dHIoXCJoZWlnaHRcIiwgeS5iYW5kd2lkdGgoKSlcclxuICAgIC5hdHRyKFwib3BhY2l0eVwiLCAwLjgpOyAvLy5hdHRyKFwid2lkdGhcIiwgeC5iYW5kd2lkdGgoKSk7IFxyXG5cclxuICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpc1wiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMClcIikgLy8gIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsXCIgKyBoZWlnaHQgKyBcIilcIilcclxuICAgIC5jYWxsKGQzLmF4aXNMZWZ0KHkpKTsgLy8gICAuY2FsbChkMy5heGlzQm90dG9tKHgpKTtcclxuXHJcbiAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNcIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLFwiICsgaGVpZ2h0ICsgXCIpXCIpIC8vIE5ldyBsaW5lXHJcbiAgICAuY2FsbChkMy5heGlzQm90dG9tKHgpLnRpY2tzKG51bGwsIFwic1wiKSkgLy8gIC5jYWxsKGQzLmF4aXNMZWZ0KHkpLnRpY2tzKG51bGwsIFwic1wiKSlcclxuICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ5XCIsIDIpIC8vICAgICAuYXR0cihcInlcIiwgMilcclxuICAgIC5hdHRyKFwieFwiLCB4KHgudGlja3MoKS5wb3AoKSkgKyAwLjUpIC8vICAgICAuYXR0cihcInlcIiwgeSh5LnRpY2tzKCkucG9wKCkpICsgMC41KVxyXG4gICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKSAvLyAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzJlbVwiKVxyXG4gIFxyXG5cclxuICB2YXIgc3ZnMSA9IGQzLnNlbGVjdChcIiNsZWdlbmRUXCIpLmFwcGVuZChcInN2Z1wiKS5hdHRyKFwid2lkdGhcIiwgd2lkdGgpLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KS5hdHRyKFwiaWRcIixcImxlZ2VuZHN2Z1wiKVxyXG52YXIgbGVnZW5kID0gc3ZnMS5hcHBlbmQoXCJnXCIpLmF0dHIoXCJmb250LWZhbWlseVwiLCBcInNhbnMtc2VyaWZcIikuYXR0cihcImZvbnQtc2l6ZVwiLCAxMCkuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpLnNlbGVjdEFsbChcImdcIikuZGF0YShrZXlzLnNsaWNlKCkucmV2ZXJzZSgpKS5lbnRlcigpLmFwcGVuZChcImdcIikgLy8uYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBpKSB7IHJldHVybiBcInRyYW5zbGF0ZSgwLFwiICsgaSAqIDIwICsgXCIpXCI7IH0pO1xyXG4gICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKC01MCxcIiArICgwICsgaSAqIDIwKSArIFwiKVwiO1xyXG4gICAgfSk7XHJcbiAgbGVnZW5kLmFwcGVuZChcInJlY3RcIikuYXR0cihcInhcIiwgd2lkdGggLSAyNSkuYXR0cihcIndpZHRoXCIsIDYwKS5hdHRyKFwiaGVpZ2h0XCIsIDE5KS5hdHRyKFwiZmlsbFwiLCB6KTtcclxuICBsZWdlbmQuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwieFwiLCB3aWR0aCAtIDI0KS5hdHRyKFwieVwiLCAxOCkuYXR0cihcImR5XCIsIFwiMC4wZW1cIikudGV4dChmdW5jdGlvbiAoZCkge1xyXG4gICAgcmV0dXJuIGQ7XHJcbiAgfSk7XHJcbn0iLCJmdW5jdGlvbiBnZW5lcmF0ZVRvcGljVmVjdG9ycygpe1xyXG4gICAgd2luZG93LnRvcGljVmVjdG9ycyA9IHt9O1xyXG4gICAgaWYod2luZG93LnRvcGljX3dvcmRfcHJvYmFiaWxpdHlfaW5fdG9waWMpe1xyXG4gICAgICAgIGZvcih2YXIgeCBpbiB3aW5kb3cudG9waWNfd29yZF9wcm9iYWJpbGl0eV9pbl90b3BpYyl7XHJcbiAgICAgICAgICAgIHZhciB2ZWN0b3IgPSBbXTtcclxuICAgICAgICAgICAgZm9yKHZhciB5IGluIHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdKXtcclxuICAgICAgICAgICAgICAgIHZlY3Rvci5wdXNoKHdpbmRvdy50b3BpY193b3JkX3Byb2JhYmlsaXR5X2luX3RvcGljW3hdW3ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB3aW5kb3cudG9waWNWZWN0b3JzW3hdID0gdmVjdG9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhKHJlc3BvbnNlLCB0b3BpY190aHJlc2hvbGQsIHdvcmRfdGhyZXNob2xkKXtcclxuICAgIGxldCB2aXNEYXRhID0gW107XHJcbiAgICBmb3IgKHZhciBkb2NLZXkgaW4gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXSl7XHJcbiAgICAgICAgZm9yKHZhciB0b3BpYyBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdW2RvY0tleV0pe1xyXG4gICAgICAgICAgICBsZXQgdG9waWNTY29yZSA9IHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XVt0b3BpY107XHJcbiAgICAgICAgICAgIGlmICh0b3BpY1Njb3JlID4gdG9waWNfdGhyZXNob2xkKXtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIHdvcmQgaW4gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmRTY29yZSA9IHJlc3BvbnNlW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmRTY29yZSA+IHdvcmRfdGhyZXNob2xkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzRGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImRvY3VtZW50XCI6ICBkb2NLZXksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRvcGljXCI6IHRvcGljLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ3b3JkXCI6IHJlc3BvbnNlW1wib3ZlcmFsbF93b3JkXCJdW3dvcmRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmlzRGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbGxlbENvb3JkaW5hdGVEYXRhSEMocmVzcG9uc2UsIHRvcGljX3RocmVzaG9sZCwgd29yZF90aHJlc2hvbGQpe1xyXG4gICAgbGV0IHZpc0RhdGEgPSBbXTtcclxuICAgIGZvciAodmFyIGRvY0tleSBpbiByZXNwb25zZVtcImRvY3VtZW50X3RvcGljXCJdKXtcclxuICAgICAgICBmb3IodmFyIHRvcGljIGluIHJlc3BvbnNlW1wiZG9jdW1lbnRfdG9waWNcIl1bZG9jS2V5XSl7XHJcbiAgICAgICAgICAgIGxldCB0b3BpY1Njb3JlID0gcmVzcG9uc2VbXCJkb2N1bWVudF90b3BpY1wiXVtkb2NLZXldW3RvcGljXTtcclxuICAgICAgICAgICAgaWYgKHRvcGljU2NvcmUgPiB0b3BpY190aHJlc2hvbGQpe1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgd29yZCBpbiByZXNwb25zZVtcInRvcGljX3dvcmRcIl1bdG9waWNdKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgd29yZFNjb3JlID0gcmVzcG9uc2VbXCJ0b3BpY193b3JkXCJdW3RvcGljXVt3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod29yZFNjb3JlID4gd29yZF90aHJlc2hvbGQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNEYXRhLnB1c2goW3BhcnNlSW50KGRvY0tleSksIHBhcnNlSW50KHRvcGljKSwgcmVzcG9uc2VbXCJ3b3Jkc1wiXS5pbmRleE9mKHdvcmQpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2aXNEYXRhO1xyXG59XHJcblxyXG5cclxuIiwid2luZG93LnZ1ZUFwcCA9IG5ldyBWdWUoe1xyXG4gICAgZWw6ICcjdnVlLWFwcCcsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0hlbGxvIHVzZXIhJyxcclxuICAgICAgICBub25lU2VsZWN0ZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0ZWRQYWdlOiA1LFxyXG4gICAgICAgIHBsYXllckRldGFpbDoge1xyXG4gICAgICAgICAgICBuYW1lOiBcIjxQbGF5ZXIgTmFtZT5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3ZlcnZpZXdGaWx0ZXJzOiB7fSxcclxuICAgICAgICBuZXdEb2NzOiBbXSxcclxuICAgICAgICBzZWxlY3RlZE1hcDogMSxcclxuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICBsb2FkaW5nOiBmYWxzZSxcclxuICAgICAgICBuZXdEb2M6ICcnLFxyXG4gICAgICAgIG5ld0RvY3NQcm9jY2Vzc2VkOiAnJyxcclxuICAgICAgICBzaG93UHJvY2Vzc2VkOiBmYWxzZSxcclxuICAgICAgICBzZXR0aW5nczoge1xyXG4gICAgICAgICAgICBzZWxlY3RlZE1ldGhvZDogJ3dvcmQyVmVjJyxcclxuICAgICAgICAgICAgc2VsZWN0ZWREYXRhc2V0OiAwLFxyXG4gICAgICAgICAgICBzdGFydDE6IDAsICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIGVuZDE6IDEwLCAgICAgICAgLy9IYXBweURCXHJcbiAgICAgICAgICAgIHN0YXJ0MjogMCwgICAgICAvL01lZGl1bVxyXG4gICAgICAgICAgICBlbmQyOiA1LCAgICAgICAgLy9NZWRpdW1cclxuICAgICAgICAgICAgbGRhVG9waWNUaHJlc2hvbGQ6IDAsXHJcbiAgICAgICAgICAgIHdvcmQyVmVjVGhyZXNob2xkOiAwXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIG1ldGhvZHM6IHtcclxuICAgICAgICBzZWxlY3RQYWdlOiBmdW5jdGlvbih4KXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFBhZ2UgPSB4O1xyXG4gICAgICAgICAgICBpZiAoeCA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlMSh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh4ID09IDIpe1xyXG4gICAgICAgICAgICAgICAgaW5pdFBhZ2UyKHdpbmRvdy5nbG9iYWxfZGF0YSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHggPT0gMyl7XHJcbiAgICAgICAgICAgICAgICBpbml0UGFnZTMod2luZG93Lmdsb2JhbF9kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoeCA9PSA0KXtcclxuICAgICAgICAgICAgICAgIGluaXRQYWdlNCh3aW5kb3cuZ2xvYmFsX2RhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBhZGROZXdEb2M6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5ld0RvYy50cmltKCkuc3BsaXQoXCIgXCIpLmxlbmd0aCA8IDMpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgYWRkIGF0IGxlYXN0IDMgd29yZHNcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5uZXdEb2NzLnB1c2godGhpcy5uZXdEb2MpO1xyXG4gICAgICAgICAgICB0aGlzLm5ld0RvYyA9ICcnO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dQcm9jZXNzZWQgPSBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb2Nlc3NEb2NzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgZ2V0VG9rZW5pemVkRG9jcyh0aGlzLm5ld0RvY3MsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXdEb2NzUHJvY2Nlc3NlZCA9IHJlc3A7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNob3dQcm9jZXNzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNhdmVDaGFuZ2VzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHNlbGYuc3VjY2VzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzZWxmLmxvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDEgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MSA8IDEwKXtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIlRoZXJlIG5lZWRzIHRvIGJlIGF0bGVhc3QgNSBkb2N1bWVudHMoJiA8PSA1MCkgZm9yIEhhcHB5IERCLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQxIC0gdGhpcy5zZXR0aW5ncy5zdGFydDEgPiA1MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gNTAgZG9jdW1lbnRzIGZvciBIYXBweURCLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5zZWxlY3RlZERhdGFzZXQgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnNldHRpbmdzLmVuZDIgLSB0aGlzLnNldHRpbmdzLnN0YXJ0MiA8IDUpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiVGhlcmUgbmVlZHMgdG8gYmUgYXRsZWFzdCA1IGRvY3VtZW50cygmIDw9IDMwKSBmb3IgTWVkaXVtIEFydGljbGVzLiBBbmQgc3RhcnQgaW5kZXggY2FuIG5vdCBiZSBncmVhdGVyIHRoYW4gZW5kLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5zZXR0aW5ncy5lbmQyIC0gdGhpcy5zZXR0aW5ncy5zdGFydDIgPiAzMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJUaGVyZSBuZWVkcyB0byBiZSBsZXNzIHRoYW4gMzAgZG9jdW1lbnRzIGZvciBNZWRpdW0gQXJ0aWNsZXMuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLnNlbGVjdGVkRGF0YXNldCA9PSAyKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuc2hvd1Byb2Nlc3NlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIHByb2Nlc3MgYWxsIGRvY3VtZW50cyBmaXJzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnRzID0gdGhpcy5uZXdEb2NzUHJvY2Nlc3NlZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGdldEFuYWx5c2lzKHRoaXMuc2V0dGluZ3Muc2VsZWN0ZWRNZXRob2QsIGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zdWNjZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgbW91bnRlZDogZnVuY3Rpb24oKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdW50ZWRcIik7XHJcbiAgICAgICAgbG9hZEQzKCk7XHJcbiAgICAgICAgbG9hZEpxdWVyeSgpO1xyXG4gICAgfVxyXG59KTsiLCJmdW5jdGlvbiBsb2FkV29yZENsb3VkKHJlc3Ape1xyXG4gICAgbGV0IGRhdGEgPSBbXTtcclxuICAgIGZvcih2YXIgd29yZCBpbiByZXNwW1wib3ZlcmFsbF93b3JkXCJdKXtcclxuICAgICAgICBsZXQgd2VpZ2h0ID0gcmVzcFtcIm92ZXJhbGxfd29yZFwiXVt3b3JkXTtcclxuICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogd29yZCxcclxuICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGNyZWF0ZVdvcmRDbG91ZChcIm92ZXJhbGwtd2NcIiwgZGF0YSwgXCJBbGwgRG9jdW1lbnRzXCIpO1xyXG5cclxuICAgIGZvcih2YXIgdG9waWMgaW4gcmVzcFtcInRvcGljX3dvcmRcIl0pe1xyXG4gICAgICAgIGxldCBkYXRhID0gW107XHJcbiAgICAgICAgZm9yKHZhciB3b3JkIGluIHJlc3BbXCJ0b3BpY193b3JkXCJdW3RvcGljXSl7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHQgPSByZXNwW1widG9waWNfd29yZFwiXVt0b3BpY11bd29yZF07XHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB3b3JkLFxyXG4gICAgICAgICAgICAgICAgd2VpZ2h0OiB3ZWlnaHRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjdG9waWMtd2NzXCIpLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbC1zbS02XCI+PGRpdiBzdHlsZT1cIm91dGxpbmU6IHNvbGlkIDFweDtcIiBpZD1cInRvcGljJyt0b3BpYysnXCIgc3R5bGU9XCJoZWlnaHQ6IDMwMHB4O1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGNyZWF0ZVdvcmRDbG91ZChcInRvcGljXCIrdG9waWMsIGRhdGEsIFwiVG9waWMgXCIrdG9waWMpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVXb3JkQ2xvdWQoaWQsIGRhdGEsIHRpdGxlKXtcclxuICAgIEhpZ2hjaGFydHMuY2hhcnQoaWQsIHtcclxuICAgICAgICBzZXJpZXM6IFt7XHJcbiAgICAgICAgICAgIHR5cGU6ICd3b3JkY2xvdWQnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICByb3RhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogMCxcclxuICAgICAgICAgICAgICAgIHRvOiAwLFxyXG4gICAgICAgICAgICAgICAgb3JpZW50YXRpb25zOiA1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5hbWU6ICdTY29yZSdcclxuICAgICAgICB9XSxcclxuICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aXRsZVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59Il19
