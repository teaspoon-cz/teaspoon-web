module.exports = function(eleventyConfig) {
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
