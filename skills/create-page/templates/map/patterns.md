# Map patterns

Vocabulary only a map uses. The panel, the card, the pins, the list-to-pin link, the phone sheet and the offline drawing are in `main.html` and do not change from map to map; what changes is the places, and the places are research done before the page is written. The recipes below are what to run at writing time, and what to add to the script for a drive or for areas.

## The list is the data

Every entry in `#places` carries `data-lat` and `data-lon`; the script numbers the entries in document order, draws a pin for each, and builds the popup from the entry's own heading, first paragraph and picture. So the whole of a map's content is written once, in the HTML, and the map cannot show a place the list does not name. An entry's number is its position in the list, which is why the visible number in the entry has to be written in the same order.

## Placing a pin: geocode it

A position comes from a geocoder, never from memory. Nominatim over OpenStreetMap answers a name and a street with coordinates and the address it matched, which is the check that it found the right door. It asks for a real user agent and one request a second.

```python
import json, time, urllib.parse, urllib.request

def geocode(query: str, viewbox: str | None = None) -> dict:
    """Coordinates to four decimals and the address matched. viewbox is
    'west,north,east,south' to keep a chain's branch inside one city."""
    params = {"q": query, "format": "json", "limit": 1}
    if viewbox:
        params |= {"viewbox": viewbox, "bounded": 1}
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": "instrument-page/1.0"})
    hit = json.load(urllib.request.urlopen(request))[0]
    time.sleep(1.1)
    return {"lat": round(float(hit["lat"]), 4), "lon": round(float(hit["lon"]), 4), "matched": hit["display_name"]}

print(geocode("Katz's Delicatessen, East Houston Street, New York"))
# {'lat': 40.7223, 'lon': -73.9874, 'matched': "Katz's Delicatessen, 205, East Houston Street, ..."}
```

Read `matched` for every place. A chain returns whichever branch ranks first, so pass a `viewbox` around the city or name the street. A place Nominatim does not know is placed on its street (geocode the street and number) and the entry says "on Orchard Street" rather than pretending to the door. Keep the matched street: the Google Maps link below wants it.

## Links out

Two small links under an entry, never on its name, since the entry's own click goes to the pin. The place's own site, with its domain as the text. And Google Maps, through its documented URL scheme, which needs no key: a search for the name and street lands on the place's card there, where coordinates alone would drop a bare pin.

```python
import urllib.parse

def google_maps(name: str, street: str) -> str:
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(f"{name}, {street}")

def google_directions(stops: list[tuple[float, float]]) -> str:
    """Driving directions through the stops in order. The scheme takes up to
    nine waypoints between origin and destination, so split a longer drive by day."""
    at = lambda s: f"{s[0]:.4f},{s[1]:.4f}"
    q = {"api": "1", "travelmode": "driving", "origin": at(stops[0]), "destination": at(stops[-1])}
    if len(stops) > 2:
        q["waypoints"] = "|".join(at(s) for s in stops[1:-1])
    return "https://www.google.com/maps/dir/?" + urllib.parse.urlencode(q)
```

Write `&` as `&amp;` in the HTML. Apple Maps takes the same idea as `https://maps.apple.com/?q=<name>&ll=<lat>,<lon>`; one map app link per entry is enough, and Google's is the one most readers have.

## A picture for a place

Wikimedia Commons has a photo of most places worth a pin, with a license that allows it. Search the file namespace, read the license and the author from `extmetadata`, and take the thumbnail rather than the original:

```python
def commons(query: str) -> dict:
    api = "https://commons.wikimedia.org/w/api.php?"
    search = json.load(urllib.request.urlopen(api + urllib.parse.urlencode(
        {"action": "query", "list": "search", "srsearch": query, "srnamespace": 6, "srlimit": 5, "format": "json"})))
    title = search["query"]["search"][0]["title"]
    info = json.load(urllib.request.urlopen(api + urllib.parse.urlencode(
        {"action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 800, "format": "json"})))
    image = next(iter(info["query"]["pages"].values()))["imageinfo"][0]
    meta = image["extmetadata"]
    return {"thumb": image["thumburl"], "page": image["descriptionurl"], "license": meta["LicenseShortName"]["value"], "artist": meta["Artist"]["value"]}
```

Look at the picture before using it: the first hit for a restaurant is as often a plate as a storefront, and either is fine so long as it is the place. Then crop it to 3:2 and encode it at 480 by 320, quality 72, with the `inline_photo` recipe in [`references/images.md`](../../references/images.md); a map's cards are small, and the popup reuses the card's image element rather than carrying a second copy. Credit every photo in the sources: author, license, and a link to its Commons page. `CC0`, `CC BY` and `CC BY-SA` are fine; leave a photo with any other license alone.

## Colors the map can paint

MapLibre's paint properties take color strings, and every gray in the skin is a `light-dark()` pair as text, so a token is resolved through a real property before it is handed over. The probe is in `main.html`'s script as `tone`:

```js
const probe = document.createElement("span");
probe.style.display = "none";
document.body.append(probe);
const tone = (name) => {
  probe.style.color = `var(${name})`;
  return getComputedStyle(probe).color; // "rgb(14, 120, 105)"
};
```

Anything drawn on the map itself is added inside `map.on("style.load", …)`, because a change of theme is a change of style and a new style starts with none of the page's layers; the pins are DOM and stay. Read `tone` inside that handler so the color is the current theme's. Put drawn layers under the style's labels by passing the first symbol layer's id as `beforeId`, so a road or a shape never covers a street name.

## A drive: the route is the router's

A road is a line a routing service drew. OSRM's public demo server routes over OpenStreetMap with no key; give it the stops in order as `lon,lat` pairs and ask for the full geometry as an encoded polyline, which is a tenth the size of coordinates:

```python
stops = [("Golden Gate Bridge Welcome Center", 37.8078, -122.4749), ("Pigeon Point Lighthouse", 37.1821, -122.3941), ...]
coords = ";".join(f"{lon},{lat}" for _, lat, lon in stops)
url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=polyline"
route = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "instrument-page/1.0"})))["routes"][0]
for (name, *_), leg in zip(stops, route["legs"]):
    print(name, round(leg["distance"] / 1000, 1), "km", round(leg["duration"] / 60), "min")
print(len(route["geometry"]), "characters of polyline")
```

Each leg is the drive from one stop to the next; `distance` is meters and `duration` seconds of driving without stops or traffic, and the card says that. A full-overview polyline for a long drive is 50 KB, most of it detail no zoom on the page will show: decode it, simplify with Douglas-Peucker at about 0.0002 degrees (twenty meters), and re-encode, which brings 17,000 points to 1,500 and 6 KB. Check one thing before trusting the line: a leg whose time is far longer than its distance suggests is a road the router found closed and detoured round, and the card should say which.

In the page, the route is one string and a decoder, and the line is a GeoJSON source drawn under the labels, in brand:

```js
// Google's polyline encoding, precision 5: each coordinate is a delta from the last, five bits a character.
const decode = (s) => {
  const out = [];
  let i = 0,
    lat = 0,
    lon = 0;
  while (i < s.length) {
    for (const which of [0, 1]) {
      let shift = 0,
        result = 0,
        b;
      do {
        b = s.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d;
      else lon += d;
    }
    out.push([lat / 1e5, lon / 1e5]);
  }
  return out;
};
const line = decode(ROUTE);
map.on("style.load", () => {
  const labels = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: line.map(([lat, lon]) => [lon, lat]),
      },
    },
  });
  map.addLayer(
    {
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": tone("--color-brand-500"),
        "line-width": 4,
        "line-opacity": 0.9,
      },
    },
    labels,
  );
});
frame(line);
```

GeoJSON is `[lon, lat]` where the list and the polyline are `[lat, lon]`; the swap happens once, here. The stops are the list's entries as usual, each with its leg to the next one written in: the distance in the reader's units, the time as hours and minutes, and the day it falls on, with a directions link on each day's heading. The offline drawing gets the same line, projected with the pins' `x` and `y`, as a `<polyline>` in `stroke-brand-500`, and its extent is the line's rather than the stops'.

## Areas: shading with a judgment

An area is an entry with a ring instead of a point. Write the ring on the entry as `data-ring="lat,lon lat,lon …"` and a `data-verdict` the legend explains, then draw the rings as one GeoJSON source with the color chosen per feature, and frame the map on all of them:

```js
const verdictColor = () => [
  "match",
  ["get", "verdict"],
  "near",
  tone("--color-brand-500"),
  "change",
  tone("--color-warning-500"),
  tone("--color-gray-400"),
];
map.on("style.load", () => {
  const labels = map.getStyle().layers.find((l) => l.type === "symbol")?.id;
  map.addSource("areas", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: places.map((p) => ({
        type: "Feature",
        properties: { n: p.n, verdict: p.verdict },
        geometry: {
          type: "Polygon",
          coordinates: [[...p.ring, p.ring[0]].map(([lat, lon]) => [lon, lat])],
        },
      })),
    },
  });
  map.addLayer(
    {
      id: "areas",
      type: "fill",
      source: "areas",
      paint: { "fill-color": verdictColor(), "fill-opacity": 0.22 },
    },
    labels,
  );
  map.addLayer(
    {
      id: "areas-line",
      type: "line",
      source: "areas",
      paint: { "line-color": verdictColor(), "line-width": 1.5 },
    },
    labels,
  );
});
// A click on a shape is a click on its entry. Registered once; the listener is the map's and survives a change of style.
map.on("click", "areas", (event) =>
  light(places[event.features[0].properties.n - 1]),
);
map.on("mouseenter", "areas", () => {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "areas", () => {
  map.getCanvas().style.cursor = "";
});
```

Each entry carries a small square of its verdict's color before its line, so the list and the shading agree without a trip to the legend; the same move ties any entry to a color the map gives it. A polygon's ring closes on itself, so the first corner is repeated at the end. A ring drawn by hand is five to eight corners placed on streets and landmarks the geocoder returned, and the sources say it was drawn by hand. Geocode the corners rather than guessing them: a neighborhood remembered a kilometer east is an opinion about the wrong streets. The offline drawing gets the same rings as `<polygon>`s in the verdict's `fill-*` class.

A circle is arithmetic, and is honest when its rule is on the page. MapLibre has no circle-in-meters, so draw one as a polygon of 64 points round the center, 1,200 m out for a fifteen-minute walk at eighty meters a minute, and let the legend say so in those words.

Minutes for a commute come from the transport authority's own planner where one answers, asked for a real departure, and the sources name it and the time asked. Transport for London's journey planner answers without a key: `https://api.tfl.gov.uk/Journey/JourneyResults/<from>/to/<to>?time=0830&timeIs=Departing&date=<yyyymmdd>&mode=tube,overground,national-rail,walking`, where a station is its `icsCode` from `https://api.tfl.gov.uk/StopPoint/Search/<name>`. Take the shortest journey's `duration` and its legs' line names.

## The anchor pin

A page with an anchor, the office the commute runs to, the hotel the restaurants are near, gives it a pin that is not a number: a star in the page's ink, so the numbered pins read as the choices and the anchor as the given. It is a DOM marker like the others, `<div class="pin pin-anchor"><span><i class="ph ph-star"></i></span></div>`, with `.pin-anchor span { background: var(--color-primary); color: var(--color-primary-foreground); }`, and it is in the frame with the shapes.

## Framing

`frame(points)` in `main.html` fits a set of `[lat, lon]` points into the part of the panel the card leaves free, with a margin wide enough that a pin at the edge is whole, and caps the zoom at 16 so a page with one place, or two a block apart, opens on a neighborhood rather than a rooftop. An entry's click frames its own point at street zoom, or its ring on an areas page. On a drive, frame the line rather than the stops, since the road bows away from the straight line between them.

## Units

A drive in the reader's units: miles for a US road, kilometers elsewhere, and both only when the readers are split. Hours and minutes rather than decimal hours. A leg's figure is rounded to the ten minutes and the whole mile, since the router's second is not a claim the page can stand behind.
