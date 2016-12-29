/**
Global variables
**/
// var connectedDeviceConfig = {"note": "Out of the box, the predix-seed app uses mock data, so these values are not required.  Set these values for connecting to real Predix services.",
// "clientId": "kepware",
// "uaaUri": "https://ad3c70da-70ba-4b79-afad-1ec3cecdbb16.predix-uaa.run.aws-usw02-pr.ice.predix.io",
// "base64ClientCredential": "a2Vwd2FyZTprZXB3YXJl",
// "appUri": "http://localhost:5000",
// "timeseriesURL": "https://time-series-store-predix.run.aws-usw02-pr.ice.predix.io/v1/datapoints",
// "timeseriesZone": "d68e28b9-2f6d-4e95-bbdb-d07e070f8827",
// "assetURL": "{Asset URL from VCAPS}",
// "assetZoneId": "{The Zone ID for the Asset Service Created}"};
var common_connectedDeviceConfig='';
var accessToken = '';
var chartId='';
// var pxsimplechart=document.getElementById(chartId);//获取simple-line-chart 对象
var pxsimplelinechartTest;
var tag_Name='';

/**
Method to generate the list of tags to choose from
**/
function UpdateRealData(chartId,tagName) {
  getCommonconnectedDeviceConfig().then(
    function(response) {
			console.log(response);
      common_connectedDeviceConfig = JSON.parse(response);
      this.chartId=chartId;
      this.tag_Name=tagName;
      pxsimplelinechartTest=document.querySelector(this.chartId);
      setInterval(updateCharts,3000);
    },
    function(error) {
      console.error("Failed when getting the Configurations", error);
  });
}
//millisPerPixel = 900 means 15 minutes, 1800 means 30 minutes, 3600 means 1 hour
// function UpdateRealData(chartId,tagName){
//   this.chartId=chartId;
//   this.tagName=tagName;
//   this.pxsimplechart=document.getElementById(chartId);
//   setInterval(updateCharts,3000);
// }
function updateCharts(){
    // this.pxsimplechart=document.getElementById(chartId);
	  updatecommonChart(tag_Name);
}
/**
Method to update the Chart with the latest data from the selected tags
This method quries UAA and Timeseries directly
**/
function updatecommonChart (tagName) {
    var myuaaRequest = new XMLHttpRequest();
    var auth = common_connectedDeviceConfig.base64ClientCredential;
    var uaaParams = "grant_type=client_credentials&client_id=" + common_connectedDeviceConfig.clientId;
		var line_date;
		var line_data;

    myuaaRequest.open('GET', common_connectedDeviceConfig.uaaUri + "/oauth/token?" + uaaParams, true);
    myuaaRequest.setRequestHeader("Authorization", "Basic " + auth);

    myuaaRequest.onreadystatechange = function() {
      if (myuaaRequest.readyState == 4) {
        var res = JSON.parse(myuaaRequest.responseText);
        accessToken = res.token_type + ' ' + res.access_token;

        var my_TimeSeriesBody = {
          tags: []
        };

        var realtimeSeriesGetData = new XMLHttpRequest();
        var datapointsUrl = common_connectedDeviceConfig.timeseriesURL;
        realtimeSeriesGetData.open('POST', datapointsUrl + "/latest", true);

        my_TimeSeriesBody.tags.push({
            "name" : tagName
        });

        realtimeSeriesGetData.setRequestHeader("Predix-Zone-Id", common_connectedDeviceConfig.timeseriesZone);
        realtimeSeriesGetData.setRequestHeader("Authorization", accessToken);
        realtimeSeriesGetData.setRequestHeader("Content-Type", "application/json");

        realtimeSeriesGetData.onload = function() {
          if (realtimeSeriesGetData.status >= 200 && realtimeSeriesGetData.status < 400) {
            var datas = JSON.parse(realtimeSeriesGetData.responseText);
            var str = JSON.stringify(realtimeSeriesGetData.responseText, null, 2);
						line_date = datas.tags[0].results[0].values[0][0];
						line_data = datas.tags[0].results[0].values[0][1];

							pxsimplelinechartTest.addPoint([line_date,line_data]); //添加实时数据
							console.log([line_date,line_data]);
          	}
          else {
            {
              console.log("Error on updating the chart...");
            }
          }
        };
        realtimeSeriesGetData.send(JSON.stringify(my_TimeSeriesBody));
      }
      else {
        console.log("No access token");
      }
    };
    myuaaRequest.send();
}

/**
Method to make the necessary rest call and get the configurations from the server
**/
function getCommonconnectedDeviceConfig() {
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
