// QuickAdd user script: prompt for a post title once, auto-derive the slug.
// Sets two variables consumed by the Jekyll Post template + filename format:
//   {{VALUE:title}}     -> the title you typed
//   {{VALUE:post-slug}} -> kebab-case, punctuation-stripped slug
module.exports = async (params) => {
  const { quickAddApi } = params;

  const title = await quickAddApi.inputPrompt("Enter title");
  if (!title) {
    throw new Error("No title entered — cancelled.");
  }

  const slug = title
    .toLowerCase()
    .normalize("NFKD")               // split accented chars
    .replace(/[̀-ͯ]/g, "") // drop accent marks
    .replace(/[^\w\s-]/g, "")    // strip punctuation
    .trim()
    .replace(/\s+/g, "-")        // spaces -> hyphens
    .replace(/-+/g, "-")         // collapse repeats
    .replace(/^-|-$/g, "");      // trim edge hyphens

  params.variables["title"] = title;
  params.variables["post-slug"] = slug;
};
