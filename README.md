# Queue Display Template

## Installation

```
copy & past
```

## Configuration
Change configuration in `app.js`

```
const TOKEN = `xxx`;
const API_URL = 'http://localhost:3002/v1';
```

`TOKEN` Generate from Q4U web management.
`API_URL` Q4U API url.

Change Youtube ID:

```
<iframe id="ytplayer" type="text/html"
  src="https://www.youtube.com/embed/YOUTUBE_ID?playlist=YOUTUBE_ID&enablejsapi=0&controls=1&loop=1&autoplay=1&origin=http://ict.moph.go.th"
  frameborder="0"></iframe>
```

Replace `YOUTUBE_ID` with youtube id

example:  `https://youtube.com/watch?v=XL9HQsWFxgY`

`YOUTUBE_ID` is `XL9HQsWFxgY`

## Runnig

```
open ./service-point.html
```

# Screenshort

![Q4U](ss.png)