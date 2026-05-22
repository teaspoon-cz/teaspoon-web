const Image = require("@11ty/eleventy-img");
const path = require("path");

const BG_IMAGES = ["cojeto.jpg", "slide_2.jpg", "betka.jpg"];

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

module.exports = function(eleventyConfig) {
  eleventyConfig.on("eleventy.before", generateBgImages);

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
