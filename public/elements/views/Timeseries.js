/**
Global variables
**/
//var smoothie = require('smoothie');

var connectedDeviceConfig = '';
var accessToken = '';
var selectTag; //默认选定的
document.scripts[0].src=" ./smoothie.js";
var selectline = new TimeSeries();

// add for vis-chart
var visArray = new Array(); // to store the object from timeseries

var lineData=[];
var pxsimplechart=document.querySelector("#realtimechart4"); //获取simple-line-chart 对象
//add for vis-chart
var pxtimeseriesvis=document.querySelector("#timeseriesvis"); 

var tagNames = new Array();
//millisPerPixel = 900 means 15 minutes, 1800 means 30 minutes, 3600 means 1 hour
var smoothie = new SmoothieChart({millisPerPixel:900,labels:{fillStyle:'#00ff00'},timestampFormatter:SmoothieChart.timeFormatter});


// added for asset date to hartData, not used so far
//function  AssembleDateAndData(x,y) //声明对象
//{
//   this.x = x;
//   this.y= y;
//}
//get data to px-vis chart with 25 data points

// added for convert the from and to in vis-timeseires range
function get_unix_time_stamp(strtime=false){
    if(strtime){
        var date = new Date(strtime);
    }else{
        var date = new Date();
    }
    time1 = date.getTime();   //会精确到毫秒---长度为13位
    //time2 = date.valueOf(); //会精确到毫秒---长度为13位
    //time3 = Date.parse(date); //只能精确到秒，毫秒将用0来代替---长度为10位
    return time1;
}

/**
This function is called on the submit button of Get timeseries data to fetch
data from TimeSeries.
**/
function onclick_machineServiceData() {
	this.selectTag = getTagsSelectedValue();
	//this function is for px-vis-chart

	setInterval(updateAllCharts,3000);

}

// securepag-view submit button calls onclick_machineServiceData() -> getTagsSelectedValue() and updateAllCharts, calls function updateChart (num) 
//Fetching the selected tags
function getTagsSelectedValue() {
  var tagSelected;
  var tagList = document.getElementById('tagList');
  for (var tagCount = 0; tagCount < tagList.options.length; tagCount++) {
     if(tagList.options[tagCount].selected === true){
          //tagSelected = tagList.options[tagCount].value ;
		tagSelected = tagCount;
      }
  //var tagSelected = tagList.options[tagCount].value ;
   }
  return tagSelected;
}
function updateAllCharts(){
// this is for simple chart
updateChart(this.selectTag);
//update vischart
updateVisChart(this.selectTag);

}

/**
Method to update the Chart with the latest data from the selected tags
This method quries UAA and Timeseries directly
**/
//This function is used for realtime charter(smoothie.js) and px-simple-chart
function updateChart (num) {
    var uaaRequest = new XMLHttpRequest();
    var auth = connectedDeviceConfig.base64ClientCredential;
    var uaaParams = "grant_type=client_credentials&client_id=" + connectedDeviceConfig.clientId;
	 var newdate;
	 var linedata;

    uaaRequest.open('GET', connectedDeviceConfig.uaaUri + "/oauth/token?" + uaaParams, true);
    uaaRequest.setRequestHeader("Authorization", "Basic " + auth);

    uaaRequest.onreadystatechange = function() {
      if (uaaRequest.readyState == 4) {
        var res = JSON.parse(uaaRequest.responseText);
        accessToken = res.token_type + ' ' + res.access_token;

        var myTimeSeriesBody = {
          tags: []
        };
        //"tags":[{"name":"CompressionRatio"}]

        var timeSeriesGetData = new XMLHttpRequest();

        var datapointsUrl = connectedDeviceConfig.timeseriesURL;

        //curl 'https://time-series-store-predix.run.aws-jp01-pr.ice.predix.io/v1/datapoints/latest' -X post -H 'predix-zone-id: cbe8918f-3052-4454-9ed0-4ced7d932b68' -H 'authorization: Bearer Please log in first.' -H 'content-type: application/json' --data-binary '{"tags":[{"name":"CompressionRatio"}]}'

        timeSeriesGetData.open('POST', datapointsUrl + "/latest", true);

          myTimeSeriesBody.tags.push({
						"name" : tagNames[num]
        });
          //"name":"CompressionRatio"


        timeSeriesGetData.setRequestHeader("Predix-Zone-Id", connectedDeviceConfig.timeseriesZone);
        timeSeriesGetData.setRequestHeader("Authorization", accessToken);
        timeSeriesGetData.setRequestHeader("Content-Type", "application/json");

        
        timeSeriesGetData.onload = function() {
          if (timeSeriesGetData.status >= 200 && timeSeriesGetData.status < 400) {
            var data = JSON.parse(timeSeriesGetData.responseText);
            var str = JSON.stringify(timeSeriesGetData.responseText, null, 2);
            // add this if to avoid affect other functions.
                if (data.tags[0].results[0].values.length != 0){
						newdate = data.tags[0].results[0].values[0][0];
						linedata = data.tags[0].results[0].values[0][1];
							pxsimplechart.addPoint([newdate,linedata]); //添加实时数据
							selectline.append(newdate, linedata);
                }

          	}
          else {
            {
              console.log("Error on updating the chart...");
            }
          }
        };
        
        timeSeriesGetData.send(JSON.stringify(myTimeSeriesBody));

      }
      else {
        console.log("Simple chart -No access token");
      }
    };

    uaaRequest.onerror = function() {
      document.getElementById("errorMessage").innerHTML = "Error getting UAA Access Token";
    };
    uaaRequest.send();
}
// This is for vis-time series
function updateVisChart (num) {
    var uaaRequest = new XMLHttpRequest();
    var auth = connectedDeviceConfig.base64ClientCredential;
    var uaaParams = "grant_type=client_credentials&client_id=" + connectedDeviceConfig.clientId;
    uaaRequest.open('GET', connectedDeviceConfig.uaaUri + "/oauth/token?" + uaaParams, true);
    uaaRequest.setRequestHeader("Authorization", "Basic " + auth);

    uaaRequest.onreadystatechange = function() {

      if (uaaRequest.readyState == 4) {  
        var res = JSON.parse(uaaRequest.responseText);
        accessToken = res.token_type + ' ' + res.access_token;

        // add for vis-chart
        //"cache_time":0,"tags":[{"name":"CompressionRatio","order":"desc"}]
        // can use peroid selector for start and end, refer to dashboards-view, time series chart usage.
        var vismyTimeSeriesBody = {
        			cache_time:0,
               tags: [],
               //start:1483885436959,
               //end:1485433203000
               start:1485760803000, //try to convert the from and to in range attribute
               end:1485760803000
              };


        // add for vis-chart
        var vistimeSeriesGetData = new XMLHttpRequest();
        var datapointsUrl = connectedDeviceConfig.timeseriesURL;


        //curl 'https://time-series-store-predix.run.aws-jp01-pr.ice.predix.io/v1/datapoints' -X post -H 'predix-zone-id: cbe8918f-3052-4454-9ed0-4ced7d932b68' -H 'authorization: Bearer Please log in first.' -H 'content-type: application/json' --data-binary '{"cache_time":0,"tags":[{"name":"CompressionRatio","order":"desc"}],"start":1483273203000,"end":1485778803000}'
        // add for vis-chart
        vistimeSeriesGetData.open('POST', datapointsUrl, true);

          vismyTimeSeriesBody.tags.push({
				"name" : tagNames[num]
          
});
          //add for vis-chart
          vismyTimeSeriesBody.start = get_unix_time_stamp(timeseriesvis.range.from);
          vismyTimeSeriesBody.end = get_unix_time_stamp(timeseriesvis.range.to);
        // add for vis-chart
        vistimeSeriesGetData.setRequestHeader("Predix-Zone-Id", connectedDeviceConfig.timeseriesZone);
        vistimeSeriesGetData.setRequestHeader("Authorization", accessToken);
        vistimeSeriesGetData.setRequestHeader("Content-Type", "application/json");
        // add for vis-chart
        vistimeSeriesGetData.onload = function() {
//            if (vistimeSeriesGetData.status >= 200 && vistimeSeriesGetData.status < 400) {
            if (vistimeSeriesGetData.status >= 200&& vistimeSeriesGetData.status < 400) {
            	var data = JSON.parse(vistimeSeriesGetData.responseText);
            	console.log(data.tags[0].results[0].values.length);
            	for (var j=0; j<data.tags[0].results[0].values.length; j++){
            		visArray[j]={
                			x:data.tags[0].results[0].values[j][0],
                			y:data.tags[0].results[0].values[j][1]
            		         	};
            	} 
            	pxtimeseriesvis.chartData = visArray;
            	
            }	

            else {
              {
                console.log("Error on updating the chart...");
              }
            }
          };
//        timeSeriesGetData.send(JSON.stringify(myTimeSeriesBody));
        vistimeSeriesGetData.send(JSON.stringify(vismyTimeSeriesBody));
      }
      else {
        console.log("Vis-No access token");
      }
    };

    uaaRequest.onerror = function() {
      document.getElementById("errorMessage").innerHTML = "Error getting UAA Access Token";
    };
    uaaRequest.send();
}

/**
Method to generate the list of tags to choose from
**/
function configureTagsTimeseriesData() {
  getConnectedDeviceConfig().then(
    function(response) {
			console.log(response);
      connectedDeviceConfig = JSON.parse(response);

      {
        select = document.getElementById('tagList');
        if (select) {
          var timeSeriesUaaRequest = new XMLHttpRequest();
          var timeSeriesAuth = connectedDeviceConfig.base64ClientCredential;
          var uaaParams = "grant_type=client_credentials&client_id=" + connectedDeviceConfig.clientId;
          timeSeriesUaaRequest.open('GET', connectedDeviceConfig.uaaUri + "/oauth/token?" + uaaParams, true);
          timeSeriesUaaRequest.setRequestHeader("Authorization", "Basic " + timeSeriesAuth);
          timeSeriesUaaRequest.onreadystatechange = function() {
            if (timeSeriesUaaRequest.readyState == 4) {
              var res = JSON.parse(timeSeriesUaaRequest.responseText);
              accessToken = res.token_type + ' ' + res.access_token;
              var timeSeriesGetAllTags = new XMLHttpRequest();
              var datapointsUrl = connectedDeviceConfig.timeseriesURL;
              var getAllTagsUrl = datapointsUrl.replace("datapoints", "tags");

              timeSeriesGetAllTags.open('GET', getAllTagsUrl, true);

              timeSeriesGetAllTags.setRequestHeader("Predix-Zone-Id", connectedDeviceConfig.timeseriesZone);
              timeSeriesGetAllTags.setRequestHeader("Authorization", accessToken);
              timeSeriesGetAllTags.setRequestHeader("Content-Type", "application/json");

              timeSeriesGetAllTags.onreadystatechange = function() {
                if (timeSeriesGetAllTags.status >= 200 && timeSeriesGetAllTags.status < 400) {
									smoothie.addTimeSeries(selectline,{lineWidth:2,strokeStyle:'#00ff00'});
									smoothie.streamTo(document.getElementById("realtimechart"));

                  var data = JSON.parse(timeSeriesGetAllTags.responseText);

                  // Create all Tags
                  tagListElement = document.getElementById('tagList');
                  while (tagListElement.firstChild) {
                      tagListElement.removeChild(tagListElement.firstChild);
                  }

									var opt;
                  for (i=0; i < data.results.length; i++) {
			 							opt = document.createElement('option');
                    opt.value = data.results[i];
			 							if (opt.value == "null") continue;
                    	opt.innerHTML = data.results[i];
                    	tagListElement.appendChild(opt);
			 							//添加tags名字到数组
			 							tagNames.push(data.results[i]);
                  }
                }else {
                  document.getElementById("errorMessage").innerHTML = "Error getting tags from Timeseries";
                }
              }
              timeSeriesGetAllTags.send();
            }
            else
            {
              console.log("No access token");
            }
          };
          timeSeriesUaaRequest.onerror = function() {
            document.getElementById("errorMessage").innerHTML = "Error getting UAA Token when attempting to query Timeseries";
          };
          timeSeriesUaaRequest.send();
      }
    }
    },

    function(error) {
      console.error("Failed when getting the Configurations", error);
  });
}

/**
Method to make the necessary rest call and get the configurations from the server
**/
function getConnectedDeviceConfig() {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open('GET', '/securepages/datas');
    request.onload = function() {
      if (request.status == 200) {
        resolve(request.response);
      }else {
        reject(Error(request.statusText));
      }
    };
    request.send();
  });
}
