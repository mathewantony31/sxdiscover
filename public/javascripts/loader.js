// // Userlist data array for filling in info box
// var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {
    
	// When send to phone button is clicked 

	$('#phone').click(function(){
	    $.post("/sms",
	    {
	        number: "+15124703773",
	        message: "Kanye is in the house"
	    },
	    function(data, status){
	        alert("Data: " + data + "\nStatus: " + status);
	    });
	});

});


// // Functions =============================================================

// // Fill table with data
//     function populateTable() {

//     // Empty content string
//     var tableContent = '';

//     // jQuery AJAX call for JSON
//     $.getJSON( '/bands', function(data) {

//         var results = ['SX'];

//         data.sort(function(a,b){
//             return Date.parse(a["date"]+" "+a["time"]).getTime()-Date.parse(b["date"]+" "+b["time"]).getTime();
//         });

//         // For each item in our JSON, add a table row and cells to the content string
//         $.each(data, function(){

//             try{
//                 var d = getDate(this.date);
//                 var t = getTime(this.time);
//                 var v = this.venue;

//                 if (v == "TBD"){
//                   t = "TBD";
//                 }
//             //Remove first element that was added twice
//             results = results.slice(1); 

//             for(var i=0;i<results.length; i++){
//             if (results[i][0].date == d){
//               results[i][0].bands.push([this.name, this.venue, t]);
//               break;
//             } else if (i==results.length-1) {
//               results.push([{
//                 date:d,
//                 bands: [[this.name, this.venue, t]]
//                 }]);
//               break;
//               }
//             }
//           } catch (e){
//             console.log("Error: Couldn't access bands from /bands response");
//           }

//             tableContent += '<tr>';
//             tableContent += '<td>' + this.name + '</td>';
//             tableContent += '<td>' + d + '</td>';
//             tableContent += '<td>' + t + '</td>';
//             tableContent += '<td>' + v + '</td>';
//             tableContent += '</tr>';
//         });

//         // Inject the whole content string into our existing HTML table
//         // $('#bandList').html(tableContent);
//         console.log(results);
//     });
// };

//     function getDate(showdate){

//     var day = new String();

//     if (showdate == ""){
//         return showdate;
//     }
//     else{
//         switch(parseInt(showdate.slice(-2))) {
//         case 11:
//         case 18:
//             day = "Friday, March "+showdate.slice(-2)+"th";
//             break;
//         case 12:
//         case 19:
//             day = "Saturday, March "+showdate.slice(-2)+"th";
//             break;
//         case 13:
//         case 20:
//             day = "Sunday, March "+showdate.slice(-2)+"th";
//             break;   
//         case 14:
//             day = "Monday, March "+showdate.slice(-2)+"th";
//             break;             
//         case 15:
//             day = "Tuesday, March "+showdate.slice(-2)+"th";
//             break;        
//         case 16:
//             day = "Wednesday, March "+showdate.slice(-2)+"th";
//             break;        
//         case 17:
//             day = "Thursday, March "+showdate.slice(-2)+"th";
//             break;        
//         default:
//             day = showdate;
//     }
//     }
//     return day;
// };

//     function getTime(showtime){

//     var time = new String();
//     var hour = parseInt(showtime.substring(0,2));
//     var min = parseInt(showtime.substring(3,5));
//     var ampm = "am";

//     if (showtime == ""){
//         return showtime;
//     }
//     else{
//         switch(hour) {
//         case 0:
//             if (min == 0){
//                 time = "Midnight";
//             }
//             else{
//                 time = "12:"+showtime.substring(3,5)+" am";
//             }
            
//             break;
//         case 12:
//             if (min == 0){
//                 time = "Noon";
//             }
//             else{
//                 time = showtime.substring(0,5)+" pm";
//             }    
//             break;   
//         default:
//             if (hour > 12){
//                 hour = hour - 12;
//                 ampm = "pm"
//             }

//             if (min == 0){
//                 time = hour.toString() +" "+ampm;
//             }
//             else{
//                 time = hour.toString() + showtime.substring(3,5)+" "+ampm;
//             }
//         }
//     }
//     return time;
// };


