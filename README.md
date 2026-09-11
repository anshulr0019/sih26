# VaahanDrishti

Vehicle movement dashboard with a Cesium 3D Live Map and a shared dark theme.
Camera status, vehicle sightings, congestion and alerts use the existing demo
datasets. Satellite imagery is not a live camera feed. Coverage circles are
illustrative 190 m radii; Night look is a visual filter, not a sensor feed.

## Run

Use Node 22.12+ or a supported newer release, then `npm ci` and `npm run dev`.
Build with `npm run build`; verify the built output with `npm run preview`.

## Map controls

Drag to pan; scroll to zoom; Ctrl + drag to tilt/rotate. Delhi resets to the
camera network, Globe zooms out to Earth, Top down changes pitch, and Orbit
rotates around the selected camera or Delhi. Clicking a camera in the list
flies to it and opens its existing registry details. Labels, coverage rings,
and the night filter can be toggled. Direct map input stops orbiting.

Satellite and Street work without credentials. Satellite failures fall back to
Street; terrain failures use an ellipsoid surface. Use the 2D map button below
the camera list if WebGL is unavailable. Search and analytics retain Leaflet.

## Optional photorealistic buildings

Copy `.env.example` to `.env.local` and set either `VITE_CESIUM_ION_TOKEN` or
`VITE_GOOGLE_MAPS_API_KEY`. For direct Google access, enable the Map Tiles API.
For ion access, authorize the token for Google's photorealistic asset. Restart
the dev server, then select Photorealistic 3D from the map source menu.

These variables are browser-visible: use provider-side domain restrictions
and minimum required permissions. Never put private server API credentials in
VITE variables. Provider eligibility, terms, quotas and billing apply. Detailed
3D mesh coverage varies by location; Delhi coverage has not been verified with
an authenticated provider in this project. The keyless satellite view remains
available where photorealistic data is missing.

## Vercel

Use the Vite preset, build command `npm run build`, and output directory `dist`.
Set optional VITE variables in Vercel's environment settings before rebuilding.
The plugin copies Cesium workers, assets and widgets into `dist/cesium`; deploy
the entire output. No upstream local development proxy is required.

Existing vehicle search, timelines, congestion views and alert acknowledgment
use their original logic. The reference and attribution are documented in
`THIRD_PARTY_NOTICES.md`.
