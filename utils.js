var defined_periods = {
    Ramayana : "-2000:-1900", 
    Mahabharata : "-1500:-1400",
    Buddha : "-500:-400", 
    Alexander : "-350:-325", 
    Mauryan : "-323:-250",
    Default: "-5000:2100",
    None: null
}

function parse_period(period){
    // range can be a string like "a:b" where a is start time and b is end time. Either may be null.
    // or it may be one of the predefined ones
    var s = new String(period);
    var start = -5000;
    var end = 2000;
    var parts = s.split(':');
    if (parts !== undefined && parts !== null && parts.length === 2){
        if (parts[0] !== null && parts[0] !== ''){
            start = parseInt(parts[0]);
        }
        
        if (parts[1] !== null && parts[1] !== ''){;
            end = parseInt(parts[1]);
        }
    }
    else if (defined_periods[s] !== undefined){
        return parse_period(defined_periods[s]);
    }
    return [start, end];
}

function is_timestep_in_period(timestep_start, timestep_end, period){
    var range_endpoints = parse_period(period);
    var range_start = range_endpoints[0];
    var range_end = range_endpoints[1];

    if ((timestep_start>=range_start) && (timestep_end<=range_end)){
        return true;
    }
    return false;
}