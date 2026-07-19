const { imageSize } = require("image-size");
const https = require("https");

const urls = [
  "https://fdfvzzqiyyhxowftegpl.supabase.co/storage/v1/object/public/maazoud/products/maazoud-indian-oud.png",
  "https://fdfvzzqiyyhxowftegpl.supabase.co/storage/v1/object/public/maazoud/products/maazoud-mitti-e-hind-attar.png",
  "https://fdfvzzqiyyhxowftegpl.supabase.co/storage/v1/object/public/maazoud/products/maazoud-aqua-oud.png",
  "https://fdfvzzqiyyhxowftegpl.supabase.co/storage/v1/object/public/maazoud/products/maazoud-pack-of-3-attars.png",
  "https://fdfvzzqiyyhxowftegpl.supabase.co/storage/v1/object/public/maazoud/products/maazoud-black-musk.png",
  "https://fdfvzzqiyyhxowftegpl.supabase.co/storage/v1/object/public/maazoud/products/maazoud-khas-attar-fresh-9.png"
];

urls.forEach(url => {
  https.get(url, response => {
    const chunks = [];
    response.on("data", chunk => {
      chunks.push(chunk);
    }).on("end", () => {
      const buffer = Buffer.concat(chunks);
      try {
        const dimensions = imageSize(buffer);
        console.log(url.split("/").pop(), "=> Width:", dimensions.width, "Height:", dimensions.height);
      } catch (err) {
        console.error("Error parsing", url, err.message);
      }
    });
  });
});
