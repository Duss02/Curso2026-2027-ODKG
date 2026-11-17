# data/

`states.geo.json`: boundaries of the 16 German states, from the "3_mittel" (medium resolution)
file of https://github.com/isellsoap/deutschlandGeoJSON (based on GIS data from DIVA-GIS).
Coordinates are rounded to 4 decimals. A `wikidata` property (QID) was added to each feature;
the map page matches it against the `owl:sameAs` links of the `dbd:State` resources.
