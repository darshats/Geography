// TODO list
// principles - default_geo and default_property means they are retrieved using feature.getGeometry and feature.getProperties
// if a feature has time wise changes in geo or props, for each interval retrieve them from array. Return default if either is null
// timeline.js should have full geometry objects, not line coordinates
// load these geometry objects using a dummy data instance in setupchronoextent
// factor out the function to setStyle method. This function is called each time a property is updated
// when running a time step, if we determine feature falls into this period - check visibility first. 
// if object doesnt have a period-key, just use default geo and props. Dont touch object so setstyle is not called
// if object has a period key either geo/props will change. If geo is nonnull call setGeometry. If props is non-null
// update properties. Touching properties will cause setStyle to get called
// keep events as separate entities even if they share coordinates with locations



var filter_mappings = {
    pname: ['persons'],
    lname: ['texts'],
    aname: ['name', 'name-aka', 'river', 'name-aka', 'place']
};

var Popup;
var currentPopup;
var FadingPopup;
var fadedPopup;
const CHRONO_GEO = 'chrono_extent';
const CHRONO_PROP = 'chrono_prop';
const POLYGON_NAME = 'polygon_txt_overlay'
const DEFAULT_GEO = 'default_geometry'
const DEFAULT_PROP = 'default_properties'

// TODO for aname, we need to search name, river, place, name-aka, river-aka properties.
function click_handler(event) {
    var feature = event.feature;
    var content;
    cleanupExistingOverlay();

    // gather available info and render it
    var name = feature.getProperty('name');
    if (name !== undefined && name !== null) {
        content = "<div><lr><b>" + name + "</b></lr><hr/></div>";
    }
    var name_aka = feature.getProperty('name-aka');
    if (name_aka !== undefined && name_aka !== null) {
        var data3 = "Also known as: " + name_aka;
        content += "<div>" + data3 + "</div>"
    }
    // for city, add any other info
    var pointType = feature.getProperty('type');
    if (pointType !== undefined && pointType !== null) {
        if (pointType === 'city') {
            var capital = feature.getProperty('capital');
            if (capital !== undefined && capital !== null) {
                var data1 = "Capital of <b>" + capital + "</b>";
                content = content + "<div>" + data1 + "</div>"
            }
        }
        var river = feature.getProperty('river');
        if (river !== undefined && river !== null) {
            var data2 = "On banks of " + river;
            content += "<div>" + data2 + "</div>"
        }
    }
    // get info
    info = event.feature.getProperty('info');
    if (info !== undefined && info !== null) {
        content += "<div><lr><p>" + info + "</p></lr></div>"
    }
    // get info-link
    var info_link = feature.getProperty('info-link');
    if (info_link !== undefined && info_link !== null) {
        content += "<hr><font size=\"1\"><a href=\"" + info_link + "\">More info</a></font></hr>";
    }
    if (content !== undefined && content !== null) {
        // for point, retrieve exact position
        if (feature.getGeometry().getType() === "Point") {
            position = feature.getGeometry().get();
        }
        else {
            position = event.latLng;
        }
        cleanupExistingOverlay();
        var popup_div = getElementForOverlay();
        popup_div.innerHTML = content;
        currentPopup = new Popup(position, popup_div);
        currentPopup.setMap(map);
    }
}

function cleanupExistingOverlay() {
    // cleanup of existing popup
    if (currentPopup !== undefined && currentPopup !== null) {
        currentPopup.setMap(null);
        currentPopup = null;
    }
    var popupDiv = document.getElementById('content');
    if (popupDiv !== undefined && popupDiv !== null) {
        popupDiv.parentNode.removeChild(popupDiv);
        popupDiv = null;
    }
}

function getElementForOverlay() {
    // create new div for popup
    popupDiv = document.createElement('div');
    popupDiv.setAttribute('id', 'content');
    // insert after map
    document.getElementById('map').insertAdjacentElement('afterend', popupDiv);
    return popupDiv;
}

function getElementForFadingOverlay() {
    // create new div for popup
    fpopupDiv = document.createElement('div');
    fpopupDiv.setAttribute('id', 'fadingcontent');
    // insert after map
    document.getElementById('map').insertAdjacentElement('afterend', fpopupDiv);
    return fpopupDiv;
}

function cleanupFadedOverlay() {
    // cleanup of existing popup
    if (fadedPopup !== undefined && fadedPopup !== null) {
        fadedPopup.setMap(null);
        fadedPopup = null;
    }
    var fpopupDiv = document.getElementById('fadingcontent');
    if (fpopupDiv !== undefined && fpopupDiv !== null) {
        fpopupDiv.parentNode.removeChild(fpopupDiv);
        fpopupDiv = null;
    }
}

function createEventPopup(feature) {
    // at present, support events tied to a Point
    if (feature.getGeometry().getType() !== "Point") {
        return null;
    }
    var pointType = feature.getProperty('type');
    if (pointType !== undefined && pointType !== null) {
        if (pointType !== 'event') {
            return;
        }
    }

    position = feature.getGeometry().get();
    var name = feature.getProperty('name');
    var content = 'placeholder';
    if (name !== undefined && name !== null) {
        content = "<div><lr><b>" + name + "</b></lr><hr/></div>";
    }

    //cleanupFadedOverlay();
    var fpopup_div = getElementForFadingOverlay();
    fpopup_div.innerHTML = content;
    fadedPopup = new FadingPopup(position, fpopup_div);
    fadedPopup.setMap(map);
}

function zoom_handler(feature) {
    return;

    // dont changed filtered map on zoom
    if (is_filtered) {
        return;
    }
    var zoom_level = map.getZoom();
    if (zoom_level >= 7) {
        // make all data visible
        map.data.forEach(function (feature) {
            map.data.overrideStyle(feature, { visible: true });
        });
    }
    else {
        // make only visible that is explicitly marked
        map.data.revertStyle();
    }
}

function get_filter_option() {
    var selectBox = document.getElementById('filter-option');
    return selectBox.value;
}

function get_filter_value() {
    var textBox = document.getElementById('filter-value');
    return textBox.value.toLowerCase();
}

function process_filter() {
    is_filtered = true;
    filter_option = get_filter_option();
    filter_text = get_filter_value();
    console.log("Processing filter_option " + filter_option + " with value " + filter_text);
    // Go over all features in the JSON, looking for selected field values. If there is a match, override style to be visible
    // else override style to be hidden
    map.data.forEach(function (feature) {
        // first set all features invisible
        map.data.overrideStyle(feature, { visible: false });
        // now selectively make those features visible that match the filter
        var name = feature.getProperty('name');
        var mapped_properties = filter_mappings[filter_option];
        mapped_properties.forEach(function (mapped_property) {
            // TODO - in case of aname, this is a list.
            // TODO - in case of time, custom filtering is needed
            // search within features' mapped property
            var property_value = feature.getProperty(mapped_property);
            if (property_value !== undefined && property_value !== null) {
                console.log("Checking for " + filter_text + " in feature " + name + " and in field: " + mapped_property);
                if (property_value.toLowerCase().includes(filter_text)) {
                    console.log("Found match in " + property_value);
                    map.data.overrideStyle(feature, { visible: true });
                }
            }
        }
        )
    });
}

function clear_filter() {
    is_filtered = false;
    map.data.revertStyle();
}

function style_feature(feature) {
    var pointType = feature.getProperty('type');
    var pointTitle = feature.getProperty('name');
    var visibility = feature.getProperty('visible');

    if (visibility === undefined || visibility === null || visibility === false) {
        return ({ icon: {}, visible: false });
    }

    if (feature.getGeometry().getType() === "Point") {
        if (pointTitle !== undefined && pointTitle !== null) {
            if (pointType === 'city') {
                return ({
                    title: pointTitle,
                    icon: 'city.png'
                });
            }
            else if (pointType === 'place') {
                return /** @type {!google.maps.Data.StyleOptions} */({
                    title: pointTitle,
                    icon: 'place.png'
                });
            }
            else if (pointType === 'site') {
                return /** @type {!google.maps.Data.StyleOptions} */({
                    title: pointTitle,
                    icon: 'site.png'
                });
            }
            else if (pointType === 'kingdom') {
                return ({
                    title: pointTitle,
                    // kingdoms dont have an icon
                    icon: 'city.png'
                });
            }
            else {
                // for example event type. Only create faded popup, no markers
                return ({ icon: {}, visible: false });
            }
        }
        else {
            return ({ icon: {}, visible: false })
        }
    }
    else if (feature.getGeometry().getType() === "LineString"
        || feature.getGeometry().getType() === "MultiLineString") {
        var riverName = feature.getProperty('name');
        var river_type = feature.getProperty('type');
        if (river_type !== undefined && river_type !== null && river_type === 'river') {
            var strokeWeight = 2;
            var strokeColor = 'blue';
            var strokeOpacity = 1;
            var sw = feature.getProperty('stroke-width');
            var sc = feature.getProperty('stroke');
            var so = feature.getProperty('stroke-opacity');
            if (sw !== undefined && sw !== null) {
                strokeWeight = parseInt(sw);
            }
            if (sc !== undefined && sc !== null) {
                strokeColor = sc;
            }
            if (so != undefined && so !== null) {
                strokeOpacity = parseFloat(so);
            }
            return ({
                strokeColor: sc,
                strokeWeight: strokeWeight,
                strokeOpacity: so
            })
        }
    }
    else if (feature.getGeometry().getType() === "Polygon") {
        var poly_type = feature.getProperty('type');
        if (poly_type !== undefined && poly_type !== null) {
            if (poly_type === 'forest') {
                return ({ fillColor: 'green' });
            }
            else if (poly_type === 'kingdom') {
                var fc = feature.getProperty('fill');
                var fo = feature.getProperty('fill-opacity');
                if (fc !== undefined && fc !== null && fo !== undefined && fo !== null) {
                    return ({ fillColor: fc, fillOpacity: parseFloat(fo) })
                }
            }
        }
    }
}

function get_feature_data_for_interval(feature, timestep_start, timestep_end) {
    var name = feature.getProperty('name')
    var chrono_geo = feature.getProperty(CHRONO_GEO);
    var chrono_prop = feature.getProperty(CHRONO_PROP);
    if (chrono_geo === undefined || chrono_geo === null || chrono_prop === undefined || chrono_prop === null) {
        console.error('Chrono data not found on feature ' + name);
        return null;
    }

    geometry = null;
    properties = null;

    // extent is a dictionary of range-geometry pairs. Return the feature's range that contains the current time step
    for (var period in chrono_geo) {
        if (is_timestep_in_period(timestep_start, timestep_end, period)) {
            geometry = chrono_geo[period]; // this is a geometry object. Caller to do setGeometry on the feature
            break;
        }
    }

    for (var period in chrono_prop) {
        if (is_timestep_in_period(timestep_start, timestep_end, period)) {
            properties = chrono_prop[period];
            break;
        }
    }

    if (geometry !== null || properties !== null) {
        return [geometry, properties];
    }

    return null;
}

var global_start = -3000;
var global_end = -500;
var delta = 1;

timestep_start = global_start;
timestep_end = timestep_start + delta;

function set_timestep_status() {
    status_msg = null;
    if (timestep_end >= global_end) {
        // drop a message on screen.
        status_msg = 'Done';
        console.log('time step has no effect after interval is over')
    }
    else {
        if (timestep_start < 0) {
            status_msg = `${timestep_start} BC - `
        }
        else {
            status_msg = `${timestep_start} AD - `
        }
        if (timestep_end < 0) {
            status_msg += `${timestep_end} BC`
        }
        else {
            status_msg += `${timestep_end} AD`
        }

    }
    return status_msg;
}

function run_timestep() {
    period_div = document.getElementById('period');
    period_div.innerHTML = set_timestep_status();

    if (timestep_end >= global_end) {
        return;
    }

    // find all features that are part of this interval, and make those visible with right geometry.
    map.data.forEach(function (feature) {
        var name = feature.getProperty('name');
        var feature_data = get_feature_data_for_interval(feature, timestep_start, timestep_end);

        if (feature_data === undefined || feature_data === null) {
            // if time step is completely missing for a feature, make it invisible. It is either before its time, or after its time,
            // or author forgot to make a contiguous timeline!
            map.data.overrideStyle(feature, { visible: false });
            // if its a polygon, hid the overlay as well.
            if (feature.getGeometry().getType() === 'Polygon') {
                var txtOverlay = feature.getProperty(POLYGON_NAME);
                txtOverlay.setMap(null);
            }
            return;
        }

        // for event feature types, we just need to create the popup to render them and exit. For all other features
        // setup the geometry and properties for this timestep
        if (feature.getGeometry().getType() === "Point" && feature.getProperty('type') === 'event') {
            createEventPopup(feature);
        }
        else {
            feature_geometry = feature_data[0];
            feature_properties = feature_data[1];
            if (feature_geometry !== undefined && feature_geometry !== null) {
                if (feature_geometry !== DEFAULT_GEO) {
                    feature.setGeometry(feature_geometry);
                    // TODO - if non default geometry, then its being created fresh. Do a setStyle.
                }
                // Ensure feature is visible
                map.data.overrideStyle(feature, { visible: true });
                // if its a polygon, ensure the overlay shows as well.
                if (feature.getGeometry().getType() === 'Polygon') {
                    var txtOverlay = feature.getProperty(POLYGON_NAME);
                    txtOverlay.setMap(map);
                }
            }
            if (feature_properties !== undefined && feature_properties !== null) {
                if (feature_properties !== DEFAULT_PROP) {
                    // TODO some are styles and some are properties
                    map.data.overrideStyle(feature, feature_properties);
                }
            }
        }
    });
    timestep_start += delta;
    timestep_end += delta;

}

function run_timeline() {
    var interval = setInterval(function () {
        run_timestep();
        if (timestep_end >= global_end) {
            clearInterval(interval);
            console.log(`Ending animation at timestep_end:${timestep_end}`)
        }
    },
        60);
}

var map;
var is_filtered = false;

function initMap() {
    var mapDiv = document.getElementById('map');
    map = new google.maps.Map(mapDiv,
        {
            center: { lat: 28.6390792, lng: 76.87603 },
            zoom: 6,
            mapTypeId: 'satellite',
            streetViewControl: false,
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
            }
        });
    map.data.loadGeoJson('saraswati.json', null, function (features) {
        set_polygon_names(features);
        setup_chrono_extent(features);
    }
    );

    var searchDiv = document.getElementById('search');
    searchControl(searchDiv, map);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(searchDiv);

    Popup = createPopupClass();
    FadingPopup = createFadingPopupClass();
    setup_listeners();
    map.data.setStyle(style_feature);

    // setup map as at beginning
    setTimeout(function () { run_timestep(); }, 1000);

    function setup_listeners() {
        var animate_timeline_button = document.getElementById('run-time');
        google.maps.event.addDomListener(animate_timeline_button, 'click', run_timeline);

        var run_timestep_button = document.getElementById('run-time-step');
        google.maps.event.addDomListener(run_timestep_button, 'click', run_timestep);

        var do_search_button = document.getElementById('run-filter');
        google.maps.event.addDomListener(do_search_button, 'click', process_filter);

        map.data.addListener('click', click_handler);
        map.addListener('zoom_changed', zoom_handler);
    }

    function set_polygon_names(features) {
        for (i = 0; i < features.length; i++) {
            // Add title for a polygon at center
            if (features[i].getGeometry().getType() === "Polygon") {
                var title = features[i].getProperty('name');
                var type = features[i].getProperty('type');
                if (title !== undefined && title !== null) {
                    if (type !== undefined && type !== null) {
                        title = title + ' ' + type;
                    }
                }

                var bounds = new google.maps.LatLngBounds();
                features[i].getGeometry().forEachLatLng(function (path) {
                    bounds.extend(path);
                });
                var latlng = bounds.getCenter();
                TxtOverlay.prototype = new google.maps.OverlayView();
                customTxt = "<div>" + title + "</div>";
                txt = new TxtOverlay(latlng, customTxt, "customBox", map);
                // set it as a property so its reference is handy, e.g. to hide the overlay if polygon is hidden
                features[i].setProperty(POLYGON_NAME, txt);
            }
        }
    }

    function setup_chrono_extent(features) {
        for (i = 0; i < features.length; i++) {
            // stores time-range,geometry pair(s) as a property on feature for later use
            var geometry = {};
            // stores time-range, propertylist pair(s) as a property on feature for later use
            var properties = {};

            period = features[i].getProperty('period');
            period_key = features[i].getProperty('period-key');

            // some features may have only one range-coordinate pair defined by period, default geometry
            if (period !== undefined && period != null) {
                // if period is defined we only have the default geometry and other properties
                geometry[period] = DEFAULT_GEO;
                properties[period] = DEFAULT_PROP;
            }

            // some features may have period to define initial geometry and period-key to define later overrides
            if (period_key !== undefined && period_key !== null) {
                // find range,geometry and range,properties for this feature and add to dictionary 
                td.elements.forEach(function (x) {
                    if (x['place_key'] === period_key) {
                        var fc = new google.maps.Data();
                        var fs = fc.addGeoJson(x.timeline);
                        for (i = 0; i < fs.length; i++) {
                            var period = fs[i].getProperty('period');
                            geometry[period] = DEFAULT_GEO;
                            geo = fs[i].getGeometry();
                            if (geo !== undefined && geo !== null) {
                                geometry[period] = geo;
                            }
                            // copy properties if present
                            properties[period] = DEFAULT_PROP;
                            var propList = {};
                            fs[i].forEachProperty(function (value, key) {
                                propList[key] = value;
                            })
                            // only new props are added to collection. These props must be merged with existing before applying style
                            if (propList.length > 0) {
                                properties[period] = propList;
                            }
                        }
                    }
                })
            }
            if ((period === undefined || period === null) && (period_key === undefined || period_key === null)) {
                // if neither period nor period-key are defined use default range
                var default_period = defined_periods.Default;
                geometry[default_period] = null;
                properties[default_period] = null;
            }
            features[i].setProperty(CHRONO_GEO, geometry);
            features[i].setProperty(CHRONO_PROP, properties);
        }
    }
}

//adapted from this example http://code.google.com/apis/maps/documentation/javascript/overlays.html#CustomOverlays
//text overlays
function TxtOverlay(pos, txt, cls, map) {
    // Now initialize all properties.
    this.pos = pos;
    this.txt_ = txt;
    this.cls_ = cls;
    this.map_ = map;
    // We define a property to hold the image's
    // div. We'll actually create this div
    // upon receipt of the add() method so we'll
    // leave it null for now.
    this.div_ = null;
    TxtOverlay.prototype.onAdd = function () {
        // Note: an overlay's receipt of onAdd() indicates that
        // the map's panes are now available for attaching
        // the overlay to the map via the DOM.
        // Create the DIV and set some basic attributes.
        var div = document.createElement('DIV');
        div.className = this.cls_;
        div.innerHTML = this.txt_;
        // Set the overlay's div_ property to this DIV
        this.div_ = div;
        var overlayProjection = this.getProjection();
        var position = overlayProjection.fromLatLngToDivPixel(this.pos);
        div.style.left = position.x + 'px';
        div.style.top = position.y + 'px';
        // We add an overlay to a map via one of the map's panes.
        var panes = this.getPanes();
        panes.floatPane.appendChild(div);
    }
    TxtOverlay.prototype.draw = function () {
        var overlayProjection = this.getProjection();
        // Retrieve the southwest and northeast coordinates of this overlay
        // in latlngs and convert them to pixels coordinates.
        // We'll use these coordinates to resize the DIV.
        var position = overlayProjection.fromLatLngToDivPixel(this.pos);
        var div = this.div_;
        div.style.left = position.x + 'px';
        div.style.top = position.y + 'px';
    }
    //Optional: helper methods for removing and toggling the text overlay.
    TxtOverlay.prototype.onRemove = function () {
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
    }
    TxtOverlay.prototype.hide = function () {
        if (this.div_) {
            this.div_.style.visibility = "hidden";
        }
    }
    TxtOverlay.prototype.show = function () {
        if (this.div_) {
            this.div_.style.visibility = "visible";
        }
    }
    TxtOverlay.prototype.toggle = function () {
        if (this.div_) {
            if (this.div_.style.visibility == "hidden") {
                this.show();
            } else {
                this.hide();
            }
        }
    }
    TxtOverlay.prototype.toggleDOM = function () {
        if (this.getMap()) {
            this.setMap(null);
        } else {
            this.setMap(this.map_);
        }
    }
    // Explicitly call setMap() on this overlay
    this.setMap(map);
}

// adapted from this example https://developers.google.com/maps/documentation/javascript/examples/overlay-popup#top_of_page
/**
* Returns the Popup class.
*
* Unfortunately, the Popup class can only be defined after
* google.maps.OverlayView is defined, when the Maps API is loaded.
* This function should be called by initMap.
*/
function createPopupClass() {
    /**
    * A customized popup on the map.
    * @param {!google.maps.LatLng} position
    * @param {!Element} content The bubble div.
    * @constructor
    * @extends {google.maps.OverlayView}
    */
    function Popup(position, content) {
        this.position = position;
        content.classList.add('popup-bubble');
        // This zero-height div is positioned at the bottom of the bubble.
        var bubbleAnchor = document.createElement('div');
        bubbleAnchor.classList.add('popup-bubble-anchor');
        bubbleAnchor.appendChild(content);
        // This zero-height div is positioned at the bottom of the tip.
        this.containerDiv = document.createElement('div');
        this.containerDiv.classList.add('popup-container');
        this.containerDiv.appendChild(bubbleAnchor);
        // Optionally stop clicks, etc., from bubbling up to the map.
        google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
    }
    // ES5 magic to extend google.maps.OverlayView.
    Popup.prototype = Object.create(google.maps.OverlayView.prototype);
    /** Called when the popup is added to the map. */
    Popup.prototype.onAdd = function () {
        this.getPanes().floatPane.appendChild(this.containerDiv);
    };
    /** Called when the popup is removed from the map. */
    Popup.prototype.onRemove = function () {
        if (this.containerDiv.parentElement) {
            this.containerDiv.parentElement.removeChild(this.containerDiv);
        }
    };
    /** Called each frame when the popup needs to draw itself. */
    Popup.prototype.draw = function () {
        var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
        this.containerDiv.style.left = divPosition.x + 'px';
        this.containerDiv.style.top = divPosition.y + 'px';
        this.containerDiv.style.display = 'block';
    };
    return Popup;
}

function createFadingPopupClass() {
    /**
    * A customized popup on the map.
    * @param {!google.maps.LatLng} position
    * @param {!Element} content The bubble div.
    * @constructor
    * @extends {google.maps.OverlayView}
    */
    function FadingPopup(position, content) {
        this.position = position;
        content.classList.add('popup-bubble');
        // This zero-height div is positioned at the bottom of the bubble.
        var bubbleAnchor = document.createElement('div');
        bubbleAnchor.classList.add('popup-bubble-anchor');
        bubbleAnchor.appendChild(content);
        // This zero-height div is positioned at the bottom of the tip.
        this.containerDiv = document.createElement('div');
        this.containerDiv.classList.add('popup-container');
        this.containerDiv.appendChild(bubbleAnchor);
        // Optionally stop clicks, etc., from bubbling up to the map.
        google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
    }
    // ES5 magic to extend google.maps.OverlayView.
    FadingPopup.prototype = Object.create(google.maps.OverlayView.prototype);
    /** Called when the popup is added to the map. */
    FadingPopup.prototype.onAdd = function () {
        this.getPanes().floatPane.appendChild(this.containerDiv);
    };
    /** Called when the popup is removed from the map. */
    FadingPopup.prototype.onRemove = function () {
        if (this.containerDiv.parentElement) {
            this.containerDiv.parentElement.removeChild(this.containerDiv);
        }
    };
    /** Called each frame when the popup needs to draw itself. */
    FadingPopup.prototype.draw = function () {
        var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);
        this.containerDiv.style.left = divPosition.x + 'px';
        this.containerDiv.style.top = divPosition.y + 'px';
        this.containerDiv.style.display = 'block';
        this.containerDiv.style.animation = "slow-fade 3s steps(9) forwards";
    };
    return FadingPopup;
}
