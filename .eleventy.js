const Image = require("@11ty/eleventy-img");
const lightningcss = require("lightningcss");
const { PurgeCSS } = require("purgecss");
const { minify } = require("terser");
const path = require("path");
const fs = require("fs");

const BG_IMAGES = ["cojeto.jpg", "slide_2.jpg", "betka.jpg"];

const CSS_BUNDLES = [
  ["./src/css/bundle-critical.css", "./web/css/bundle-critical.min.css"],
  ["./src/css/bundle-deferred.css", "./web/css/bundle-deferred.min.css"],
];

const CSS_PAGE_FILES = [
  "google-fonts.css",
  "vc-index.css",
  "vc-kontakt.css",
  "vc-o-mne.css",
  "vc-clenstvi-jako-darek.css",
];

async function buildJS() {
  const jsDir = path.resolve("./web/js");
  const files = fs.readdirSync(jsDir).filter(f => f.endsWith(".js") && !f.endsWith(".min.js"));
  for (const file of files) {
    const src = path.join(jsDir, file);
    const out = path.join(jsDir, file.replace(/\.js$/, ".min.js"));
    const code = fs.readFileSync(src, "utf8");
    const result = await minify(code, { compress: true, mangle: true });
    const before = Buffer.byteLength(code);
    const after = Buffer.byteLength(result.code);
    fs.writeFileSync(out, result.code);
    console.log(`[terser] ${file}: ${(before/1024).toFixed(0)} KB → ${(after/1024).toFixed(0)} KB`);
  }
}

function buildCSS() {
  for (const [entry, out] of CSS_BUNDLES) {
    const { code } = lightningcss.bundle({
      filename: path.resolve(entry),
      minify: true,
      sourceMap: false,
    });
    fs.writeFileSync(out, code);
  }
  for (const file of CSS_PAGE_FILES) {
    const src = path.resolve(`./web/css/${file}`);
    const { code } = lightningcss.transform({
      filename: src,
      code: fs.readFileSync(src),
      minify: true,
    });
    fs.writeFileSync(path.resolve(`./web/css/${file.replace(".css", ".min.css")}`), code);
  }
}

async function generateBgImages() {
  for (const filename of BG_IMAGES) {
    await Image(`./web/photos/${filename}`, {
      formats: ["avif", "webp"],
      widths: [1200],
      outputDir: "./_site/photos/",
      urlPath: "/photos/",
      filenameFormat: (id, src, width, format) => {
        return `${path.parse(src).name}.${format}`;
      },
    });
  }
}

async function imageShortcode(src, alt, sizes, fetchpriority) {
  sizes = sizes || "(max-width: 768px) 100vw, 768px";
  const loading = fetchpriority === "high" ? "eager" : "lazy";

  const metadata = await Image(`./web/photos/${src}`, {
    formats: ["avif", "webp", "jpeg"],
    widths: [300, 768, 1024],
    outputDir: "./_site/photos/",
    urlPath: "/photos/",
    filenameFormat: (id, src, width, format) => {
      return `${path.parse(src).name}-${width}.${format}`;
    },
  });

  const attrs = {
    alt: alt || "",
    sizes,
    loading,
    decoding: "async",
    class: "attachment-medium_large size-medium_large",
  };
  if (fetchpriority) attrs.fetchpriority = fetchpriority;

  return Image.generateHTML(metadata, attrs);
}

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtmlFiles(fullPath));
    else if (entry.name.endsWith(".html")) results.push(fullPath);
  }
  return results;
}

module.exports = function(eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    await generateBgImages();
    buildCSS();
    await buildJS();
  });

  eleventyConfig.on("eleventy.after", async () => {
    const safelist = {
      // Keep dynamically-added state/variant classes from JS
      patterns: [/^fa-/, /^is-/, /^has-/, /^wp-/, /^menu-/, /^nav-/],
    };

    // Purge deferred bundle globally (shared across all pages)
    const deferredFile = "./_site/css/bundle-deferred.min.css";
    if (fs.existsSync(deferredFile)) {
      const [result] = await new PurgeCSS().purge({
        content: ["./_site/**/*.html", "./_site/**/*.js"],
        css: [deferredFile],
        safelist,
      });
      const before = fs.statSync(deferredFile).size;
      fs.writeFileSync(deferredFile, result.css);
      console.log(`[purgecss] bundle-deferred.min.css: ${(before/1024).toFixed(0)} KB → ${(result.css.length/1024).toFixed(0)} KB`);
    }

    // Purge critical CSS globally (must scan JS too — plugins add classes dynamically)
    const criticalFile = "./_site/css/bundle-critical.min.css";
    let criticalCSS = null;
    if (fs.existsSync(criticalFile)) {
      const [result] = await new PurgeCSS().purge({
        content: ["./_site/**/*.html", "./_site/**/*.js"],
        css: [criticalFile],
        safelist,
      });
      const before = fs.statSync(criticalFile).size;
      criticalCSS = result.css;
      console.log(`[purgecss] bundle-critical.min.css: ${(before/1024).toFixed(0)} KB → ${(criticalCSS.length/1024).toFixed(0)} KB`);
    }

    const jqueryFile = "./_site/js/jquery.min.js";
    const jqueryJS = fs.existsSync(jqueryFile) ? fs.readFileSync(jqueryFile, "utf8") : null;

    for (const htmlFile of findHtmlFiles("./_site")) {
      let html = fs.readFileSync(htmlFile, "utf8");
      let changed = false;

      if (criticalCSS && html.includes("/css/bundle-critical.min.css")) {
        html = html.replace(
          '<link href="/css/bundle-critical.min.css" rel="stylesheet" type="text/css" />',
          `<style>${criticalCSS}</style>`
        );
        changed = true;
      }

      if (jqueryJS && html.includes("/js/jquery.min.js")) {
        html = html.replace(
          '<script id="jquery-core-js" src="/js/jquery.min.js" type="text/javascript"></script>',
          () => `<script id="jquery-core-js">${jqueryJS}</script>`
        );
        changed = true;
      }

      if (changed) fs.writeFileSync(htmlFile, html);
    }
    if (criticalCSS) console.log(`[inline-css] bundle-critical.min.css inlined into all pages`);
  });

  eleventyConfig.addFilter("isoDate", (date) => {
    if (!(date instanceof Date)) return '';
    return date.toISOString().split('T')[0];
  });

  eleventyConfig.addFilter("inlineCSS", (urlPath) => {
    const filePath = path.resolve(`./web${urlPath}`);
    return fs.readFileSync(filePath, "utf8");
  });

  eleventyConfig.addAsyncShortcode("image", imageShortcode);

  eleventyConfig.addPassthroughCopy({ "web/css": "css" });
  eleventyConfig.addPassthroughCopy({ "web/js": "js" });
  eleventyConfig.addPassthroughCopy({ "web/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "web/logo": "logo" });
  eleventyConfig.addPassthroughCopy({ "web/photos": "photos" });
  eleventyConfig.addPassthroughCopy({ "web/images": "images" });
  eleventyConfig.addPassthroughCopy({ "web/admin": "admin" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    }
  };
};
