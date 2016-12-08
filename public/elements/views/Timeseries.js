/**
Global variables
**/
var connectedDeviceConfig = '';
var accessToken = '';
var selectTag=0; //默认选定的

var selectline = new TimeSeries();
var lines = new Array();  //用来存放数据线
//  //有多少tag就有多少条数据线
// for(i=0;i<20;i++){
// 	lines[i]=new TimeSeries();
// }
var lineData=[];
var pxdata=new Array();
var pxsimplechart

var tagNames = new Array();
//millisPerPixel = 900 means 15 minutes, 1800 means 30 minutes, 3600 means 1 hour
var smoothie = new SmoothieChart({millisPerPixel:900,labels:{fillStyle:'#00ff00'},timestampFormatter:SmoothieChart.timeFormatter});

/**
This function is called on the submit button of Get timeseries data to fetch
data from TimeSeries.
**/
function onclick_machineServiceData() {
	selectTag = getTagsSelectedValue();
	setInterval(updateAllCharts,3000);
}

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
	//for(var i=0;i<tagNames.length;i++){
		updateChart(selectTag);
	//}
}
/**
Method to update the Chart with the latest data from the selected tags
This method quries UAA and Timeseries directly
**/
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

        var timeSeriesGetData = new XMLHttpRequest();
        var datapointsUrl = connectedDeviceConfig.timeseriesURL;
        timeSeriesGetData.open('POST', datapointsUrl + "/latest", true);


        var tags = tagNames[num].split(",");
        for (i=0; i < tags.length; i++)
        {
          myTimeSeriesBody.tags.push({
            "name" : tags[i]
        });
        }

        timeSeriesGetData.setRequestHeader("Predix-Zone-Id", connectedDeviceConfig.timeseriesZone);
        timeSeriesGetData.setRequestHeader("Authorization", accessToken);
        timeSeriesGetData.setRequestHeader("Content-Type", "application/json");

        timeSeriesGetData.onload = function() {
          if (timeSeriesGetData.status >= 200 && timeSeriesGetData.status < 400) {
            var data = JSON.parse(timeSeriesGetData.responseText);
            var str = JSON.stringify(timeSeriesGetData.responseText, null, 2);
						newdate = data.tags[0].results[0].values[0][0];
						linedata = data.tags[0].results[0].values[0][1];
							// pxdata[0]=newdate;
							// pxdata[1]=linedata;
							// lineData.push(pxdata);
							pxsimplechart.addPoint([newdate,linedata]); //添加实时数据
								console.log([newdate,linedata]);
								selectline.append(newdate, linedata);
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
        console.log("No access token");
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
			// console.log(response);
      // connectedDeviceConfig = JSON.parse(response);
			connectedDeviceConfig={"note": "Out of the box, the predix-seed app uses mock data, so these values are not required.  Set these values for connecting to real Predix services.",
	    "clientId": "kepware",
	    "uaaUri": "https://ad3c70da-70ba-4b79-afad-1ec3cecdbb16.predix-uaa.run.aws-usw02-pr.ice.predix.io",
	    "base64ClientCredential": "a2Vwd2FyZTprZXB3YXJl",
	    "appUri": "http://localhost:5000",
	    "timeseriesURL": "https://time-series-store-predix.run.aws-usw02-pr.ice.predix.io/v1/datapoints",
	    "timeseriesZone": "d68e28b9-2f6d-4e95-bbdb-d07e070f8827",
	    "assetURL": "{Asset URL from VCAPS}",
	    "assetZoneId": "{The Zone ID for the Asset Service Created}"}
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

									pxsimplechart=document.getElementById('realtimechart4'); //获取simple-line-chart 对象

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
    request.open('GET', '/#/securepage/datas');
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
