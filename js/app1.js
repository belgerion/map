function viewModel() {
    var self = this;
    var map;
    var infoWindow;
    var geocoder;

    self.mTech = ko.observable();
    self.setCenter = ko.observable(false);
    self.location = ko.observable('Montana Tech');
    self.marker = ko.observableArray([]);
    self.currentNeighborhood = ko.observable();

// Sets the initial map values, as described in the AJAX project and Google Developers API documenation.
    function initialize() {
        geocoder = new google.maps.Geocoder();
        self.mTech(new google.maps.LatLng(46.012346, -112.557698));
        infoWindow = new google.maps.InfoWindow();
        map = new google.maps.Map(document.getElementById('map-canvas'), self.mapOptions());
        searchNeighborhood(self.mTech());
    }

// Sets the map values for the default zoom and center point when it loads.
    self.mapOptions = ko.computed(function() {
        return {
            zoom: 15,
            center: self.mTech(),
        };
    });

// Initializes the place feature of the Google maps API and sends the inquery to generate the results.
    function searchNeighborhood(neighborhood) {
      var service = new google.maps.places.PlacesService(map);
      service.textSearch(self.locate(neighborhood), searchResults);
    }

// Generates the list of locations near to the neighborhood, and sends that to an array. Also clears the list should the neighborhood change, and removes the markers from the map.
    function searchResults(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            self.marker.removeAll();
            for (var i = 0; i < results.length; i++) {
                newList = results[i];
                self.marker.push(new marker(newList.geometry.location, newList.name, newList.formatted_address));
            }
            self.setMarker();
        }
        else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    }
    self.photo = ko.observable({name: 'Pick a Place'});
    self.photos = ko.observableArray([new flickr('img/nerd_logo.jpg')]);


// Finds the places that match the criteria within the given radius, that will be added to the list, and displayed on the map.
    self.locate = function(localStuff) {
        return {
            location: localStuff,
            radius: 600,
            query: 'tourist',
            type: ['tourist']
        };
    };

//Converts a new neighborhood from the user input into the lat/long coordinates that the Google maps api can use to find the new location.
    self.geoCode = function(address) {
        geocoder.geocode( { 'address': address}, function(results) {
            self.setCenter(results[0].geometry.location);
            map.setCenter(self.setCenter());
            self.location(results[0].formatted_address);
                        self.marker.removeAll();

        });
    };

// PLaces the markers on the map, and calls the animation that will be displayed when the related location is clicked from the list.
    self.setMarker = function() {
        for (var i = 0; i < self.marker().length; i++) {
            var marker = self.marker()[i];
            marker.setMap(map);
            marker.setAnimation(null);
            google.maps.event.addListener(marker, 'click', function() {
                self.currentNeighborhood(this);
                this.selectResult();
                this.markerAnimate();
                this.flickrPicture();
            });
        }
    };

// Takes the user input and sends it to the geocode to be translated into lat/long coordinates.
    self.search = function() {
        address = self.location();
        self.geoCode(address);
        setTimeout(function() {
            searchNeighborhood(self.setCenter());
        }, 100);
    };

// Creates the marker for each of the locations, and assigns them the appropriate values to list the name and address.
    function marker(loc, title, address) {
        var latlng = loc;
        var click = new google.maps.Marker({
          position: latlng,
          title: title,
          hasPhotos: ko.observable()
        });
        click.address = address;
        // Sends the formatted location information to the list to be displayed.
        click.selectResult = function() {
            infoWindow.setContent("<div class='infoWindow'>" + this.title + "<p>" + this.address + "</p></div>");
            infoWindow.open(map, this);
        };
        // Sets the marker to bounce when the associated location in the list is clicked.
        click.markerAnimate = function() {
            for (var i = 0; i < self.marker().length; i++) {
                var marker = self.marker()[i];
                if (marker.setAnimation() !== null) {
                    marker.setAnimation(null);
                }
            }
            this.setAnimation(google.maps.Animation.BOUNCE);
        };
        // Checks to see if there is a picture available of the location, or displays the default image. Adds the images to an array to be displayed in the photo-popup, and clears the previous photos when a new location is entered.
        flickrPics = function (data) {
            var photos = data.items;
            var photolist = [];
            for (var i = 0; i < photos.length; i++) {
                photolist.push(photos[i].media.m);
            }
            self.photos.removeAll();
            if (photolist.length === 0) {
                self.photos.push(new flickr('img/nerd_logo.jpg'));
            }
            else {
                for (var link in photolist) {
                    self.photos.push(new flickr(photolist[link]));
                }
            }
        };
        // Gets the image from Flickr based on the name of the location that was clicked
        click.flickrPicture = function() {
            var picture = title;
            self.photo({name: picture});
            $.ajax({
                url: "https://api.flickr.com/services/feeds/photos_public.gne" + "?jsoncallback=?&format=json&tags=" + picture,
                dataType: "jsonp",
                success: flickrPics,
                timeout: 2000,
            });
        };
        return click;
    }

    google.maps.event.addDomListener(window, 'load', initialize());
}

// Sends the Flickr images to the html to be displayed in the popup
function flickr(link) {
    return {
        url: link
    };
}

$('#photo-popup').click(function() {
    $('.photoframe').toggleClass('showphotos');
});

$(function() {
    ko.applyBindings(new viewModel());
});

