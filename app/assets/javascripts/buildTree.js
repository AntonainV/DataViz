var treeData = {};
    treeData.name = "Muse Me"
    treeData.children = new Array();
    treeData.group = "MuseMe";
var groupMap = {"MuseMe":0,"category":1,"poll":2,"item":3,"user":4};

function loadData(users,polls,relationships,items,audiences){
  var files = new Array(users,polls,relationships,items,audiences);
  var data = {};
  var remaining = files.length;
  files.forEach(function(value){
    d3.csv(value+".csv",function(csv){
      data[value]=csv;
      if(!--remaining){
        constructTreeData();
      } 
    })
  });
  /*
  d3.csv(users+".csv",function(userData){
    d3.csv(items+".csv",function(itemData){
      d3.csv(polls+".csv",function(pollData){
        d3.csv(audiences+".csv",function(audienceData){
          data["users"]=userData;
          data["polls"]=pollData;
          data["items"]=itemData;
          data["audiences"]=audienceData;
          constructTreeData();
        });
      });
    });
  });
  */

  function constructTreeData(){

    /* --------------------------------
     * construct user object, put user object in the usersMap array
     * Map user id and user object
     * ---------------------------------*/
    var usersMap = new Array();
    data["users"].forEach(function(value){
      var user={};
      user.name = value.user_name.match(/[^ |^\']+/);
      user.group = "user";
      usersMap[value.id]=user;
    });
    //console.log(usersMap);
    
   /* --------------------------------
    * construct item object, put in the itemsMap array
    * Map user id and item object
    * ---------------------------------*/
    var itemsMap = new Array();
    var k=0;
    data["items"].forEach(function(value){
      var item = {};
      item.name = "item_"+value.id;
      item.children = new Array();
      item.group = "item";
      
      var audiences = data["audiences"].filter(function(audience){
        return audience.has_voted == value.id;
      });
      if(audiences.length>0){
        audiences.forEach(function(audience){
          //rename the user
          var userTemp = {};
          userTemp.name = usersMap[audience.user_id].name + "_item_" + value.id;
          userTemp.group = "user";
          item.children.push(userTemp);
          //console.log(usersMap[audience.user_id]);
        });
      }
      itemsMap[value.id]=item;
    });
    //console.log(itemsMap);
    
    /* --------------------------------
    * construct poll object, put in the pollsMap array
    * Map poll id and poll object
    * ---------------------------------*/
    var pollsMap = new Array();
    data["polls"].forEach(function(value){
      var poll ={};
      poll.name = "poll_"+value.id;
      poll.children = new Array();
      poll.group = "poll";
      poll.total_votes = value.total_votes;
      var items = data["items"].filter(function(item){
        return item.poll_id == value.id;
      });
      items.forEach(function(item){
        var itemTemp ={};
        itemTemp.name = itemsMap[item.id].name + "_poll_"+ value.id;
        itemTemp.group = "item";
        itemTemp.children = itemsMap[item.id].children;
        poll.children.push(itemTemp);
      });
      pollsMap[value.id]=poll;

    });
    //console.log(pollsMap);

   /* --------------------------------
    * construct category object, put in the categorysMap array
    * Map category id and category object
    * ---------------------------------*/
    var categoryNames = ["Art","Beauty","Cars","CuteThings","Eletronics","Events","Fashion","Food","Humor","Media","Travel","Other"];
    var categorysMap = new Array();
    for(i=0;i<categoryNames.length;i++){
      var category = {};
      category.name = categoryNames[i];
      category.children = new Array();
      category.group = "category";
      var polls = data["polls"].filter(function(poll){
        return poll.category == i;
      });
      polls.forEach(function(poll){
        var pollTemp ={};
        pollTemp.name = pollsMap[poll.id].name + "_"+ categoryNames[i];
        pollTemp.group = "poll";
        pollTemp.children = pollsMap[poll.id].children;
        pollTemp.total_votes = pollsMap[poll.id].total_votes;
        category.children.push(pollTemp);
      })
      categorysMap[i]=category;
    }
    //console.log(categorysMap);
    
    /* ------- finish the tree -------*/ 
    categorysMap.forEach(function(category){
      treeData.children.push(category);
    });
  } 
}

loadData("users","polls","relationships","items","audiences");

function buildTree(color,containerName, customOptions)
{
  // build the options object
  var radius = 960/2;
  var options = $.extend({
      nodeRadius: 2, fontSize: 10
  }, customOptions);

  
  // Calculate total nodes, max label length
  var totalNodes = 0;
  var maxLabelLength = 0;
  /*visit(treeData, function(d)
  {
      totalNodes++;
      maxLabelLength = Math.max(d.name.length, maxLabelLength);
  }, function(d)
  {
      return d.children && d.children.length > 0 ? d.children : null;
  });*/

  // size of the diagram
  //var size = { width:$(containerName).outerWidth(), height: totalNodes * 5};

  var tree = d3.layout.tree()
      .size([radius-120, radius-120])
      .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  var nodes = tree.nodes(treeData);
  //console.log(nodes);
  var links = tree.links(nodes);

  
  /*
      <svg>
          <g class="container" />
      </svg>
   */
  var layoutRoot = d3.select(containerName).append("svg:svg")
      .attr("width", radius*2)
      .attr("height",radius*2-150)
      .append("svg:g")
      .attr("class", "container")
      .attr("transform", "translate(" + radius + ","+ radius/1.2+")");


  // Edges between nodes as a <path class="link" />
  var link = d3.svg.diagonal.radial()
      .projection(function(d){
        return [d.y, d.x / 180 * Math.PI];
      });

  layoutRoot.selectAll("path.link")
      .data(links)
      .enter()
      .append("svg:path")
      .attr("class", "link")
      .attr("d", link);

  /*
      Nodes as
      <g class="node">
          <circle class="node-dot" />
          <text />
      </g>
   */
  var nodeGroup = layoutRoot.selectAll("g.node")
      .data(nodes)
      .enter()
      .append("svg:g")
      .attr("title",function(d){
        var title = null;
        if(d.group == "user"){
          title = d.name.replace(/_item_([\d]+)/,"");
        }
        return title;
      })
      .attr("rel",function(d){
        var rel = (d.group == "user" ? "tooltip" : null);
        return rel;
      })
      .attr("class", function(d){
        if(d.group == "user" || d.group == "item" ||d.group == "poll"){
          if(d.group == "user"){
            var title = d.name.replace(/_item_([\d]+)/,"");
          }
          if(d.group == "item"){
            var title = d.name.replace(/_poll_([\d]+)/,"");
          }
          if(d.group == "poll"){
            var title = d.name.match(/poll_[\d]+/);
            //console.log(d.name);
            //console.log(title);
          }
          return d.group+" "+title+" "+d.name;
        }
        else if(d.group == "MuseMe"){
          return d.group;
        }
        else {return d.group +" "+d.name;}     
      })
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
      .style("fill", function(d) { return color[groupMap[d.group]]; });

  nodeGroup.append("svg:circle")
      .attr("class", "node-dot")
      /*---------- size encoding ---------------
       * item: number of votes it received
       * poll: number of votes it received 
       * category: number of polls it has
       *----------------------------------------*/
      .attr("r",function(d){
        if(d.group == "item" || d.group == "category"){
          var k = d.children == null ? 1 : d.children.length/2+1;
          return options.nodeRadius*k;
        }
        else if(d.group == "poll"){
          return options.nodeRadius*(d.total_votes/4+1);
        }
        else if(d.group == "MuseMe"){
          return options.nodeRadius*10;
        }
        else{
          return options.nodeRadius;
        }
      });
}

//pie chart
function pie(data,container,color){
  var w = 400, h=300, r=100;  
  var vis = d3.select(container)
      .append("svg:svg")              //create the SVG element inside the <body>
      .data([data])                   //associate our data with the document
          .attr("width", w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
          .attr("height", h)
      .append("svg:g")                //make a group to hold our pie chart
          .attr("transform", "translate(" + w/2 + "," + 150 + ")")    //move the center of the pie chart from 0, 0 to radius, radius
  
  

  var arc = d3.svg.arc()              //this will create <path> elements for us using arc data
      .outerRadius(r);

  var pie = d3.layout.pie()           //this will create arc data for us given a list of values
      .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array

  var arcs = vis.selectAll("g.slice")     
      .data(pie)                            
      .enter()                            
          .append("svg:g")                //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
              .attr("class", "slice");    //allow us to style things in the slices (like text)

      arcs.append("svg:path")
              .attr("fill", function(d, i) { return color(i); } ) //set the color for each slice to be chosen from the color function defined above
              .attr("d", arc);                                    //this creates the actual SVG path using the associated data (pie) with the arc drawing function

      arcs.append("svg:text")                                     //add a label to each slice
              .attr("transform", function(d) {                    //set the label's origin to the center of the arc
              //we have to make sure to set these before calling arc.centroid
              d.innerRadius = r*1.2;
              d.outerRadius = r*10;
              return "translate(" + arc.centroid(d) + ")";        //this gives us a pair of coordinates like [50, 50]
          })
          .attr("text-anchor", "middle")                          //center the text on it's origin
          .text(function(d, i) { return data[i].value; }); 
}

function pieLegend(data,container,color){
  var w = 500, h=400, r=10;  
  var fontHeight = 15;
  var vis = d3.select(container)
      .append("svg:svg");
  legend = vis.selectAll("g.legend")
      .data(data)
      .enter()
      .append("svg:g")
      .attr("class","legend");
  legend.append("svg:circle")
      .attr("fill",function(d,i){return color(i);})
      .attr("r",r)
      .attr("transform",function(d,i){
        if(i<6) return "translate("+(70*i+r)+","+r+")";
        else return "translate("+(70*(i-6)+r)+","+r*6+")"
        
      });  
  legend.append("svg:text")
      .attr("transform",function(d,i){
        if(i<6) return "translate("+(70*i)+","+(r*2+fontHeight)+")";
        else return "translate("+70*(i-6)+","+(r*7+fontHeight)+")"
        
      })
      .text(function(d,i){return data[i].label;});   
}



  
