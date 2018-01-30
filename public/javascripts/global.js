// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {
    setTimeout(function(){
        $('article').addClass('loaded');
        // $('h1').css('color','#222222');
    }, 3000);
});


// Functions =============================================================

function getDate(showdate){

var day = new String();

if (showdate == ""){
    return showdate;
}
else{
    switch(parseInt(showdate.slice(-2))) {
    case 10:
    case 17:
        day = "Friday, March "+showdate.slice(-2)+"th";
        break;
    case 11:
    case 18:
        day = "Saturday, March "+showdate.slice(-2)+"th";
        break;
    case 12:
    case 19:
        day = "Sunday, March "+showdate.slice(-2)+"th";
        break;   
    case 13:
    case 20:
        day = "Monday, March "+showdate.slice(-2)+"th";
        break;             
    case 14:
        day = "Tuesday, March "+showdate.slice(-2)+"th";
        break;        
    case 8:
    case 15:
        day = "Wednesday, March "+showdate.slice(-2)+"th";
        break;        
    case 9:
    case 16:
        day = "Thursday, March "+showdate.slice(-2)+"th";
        break;        
    default:
        day = showdate;
    }
}
    return day;
};

function getTime(showtime){

    var time = new String();
    var hour = parseInt(showtime.substring(0,2));
    var min = parseInt(showtime.substring(3,5));

    var ampm = "am";

    if (showtime == "" || showtime == "tbd"){
        time = "tbd";
    }
    else{
        switch(hour) {
        case 23:
            if(min == 59){
                time = "Midnight";
            } else {
                time = showtime.substring(0,2)+":"+showtime.substring(3,5)+" pm";
            }

        case 0:
            if (min == 0){
                time = "Midnight";
            }
            else{
                time = "12:"+showtime.substring(3,5)+" am";
            }
            
            break;
        case 12:
            if (min == 0){
                time = "Noon";
            }
            else{
                time = showtime.substring(0,2)+":"+showtime.substring(3,5)+" pm";
            }    
            break;   
        default:
            if (hour > 12){
                hour = hour - 12;
                ampm = "pm"
            }

            if (min == 0){
                time = hour.toString() +" "+ampm;
            }
            else{
                time = hour.toString() +":"+ showtime.substring(3,5)+" "+ampm;
            }
        }
    }

    return time;
};


