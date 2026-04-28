# Turbofan RUL Frontend

Static dashboard for Jyotsna's turbofan engine Remaining Useful Life project.

## Run locally

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173/frontend/
```

## Deploy

Deploy the `frontend` folder as a static site on Vercel, Netlify, Render Static Site, or GitHub Pages.

The current prediction panel is a demo interface based on the exported experiment metrics. When the real `model_export` folder is available, connect the form submission in `app.js` to a backend endpoint that loads your trained model.
