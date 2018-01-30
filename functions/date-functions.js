var exports = module.exports = {};

exports.getDate = function(showdate){

    var day = new String();

    if (showdate == ""){
        return showdate;
    }
    else{
        switch(parseInt(showdate.slice(-2))) {
        case 11:
        case 18:
            day = "Friday, March "+showdate.slice(-2)+"th";
            break;
        case 12:
        case 19:
            day = "Saturday, March "+showdate.slice(-2)+"th";
            break;
        case 13:
        case 20:
            day = "Sunday, March "+showdate.slice(-2)+"th";
            break;   
        case 14:
            day = "Monday, March "+showdate.slice(-2)+"th";
            break;             
        case 15:
            day = "Tuesday, March "+showdate.slice(-2)+"th";
            break;        
        case 16:
            day = "Wednesday, March "+showdate.slice(-2)+"th";
            break;        
        case 17:
            day = "Thursday, March "+showdate.slice(-2)+"th";
            break;        
        default:
            day = showdate;
    }
    }
    return day;
};

exports.getTime = function(showtime){

var time = new String();
var hour = parseInt(showtime.substring(0,2));
var min = parseInt(showtime.substring(3,5));
var ampm = "am";

if (showtime == ""){
    return showtime;
}
else{
    switch(hour) {
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
            time = showtime.substring(0,5)+" pm";
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
            time = hour.toString() + showtime.substring(3,5)+" "+ampm;
        }
    }
}
return time;
};