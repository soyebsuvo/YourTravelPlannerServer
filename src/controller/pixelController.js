
export const PixelGenerateCityImages = async (req, res) => {
    try
    {
        const { cities } = req.body;
        const numberOfImagesPerCity = 4;

        if (!cities || cities.length === 0) {
            return res.status(400).send({ error: "No cities provided" });
        }

        const images = await Promise.all(
            cities.map(async (city) => {
                const query = `${city} tour`;
                const photos = await pexels.photos.search({
                    query,
                    orientation: "portrait",
                    per_page: numberOfImagesPerCity,
                });
            
                // Get the URLs of the images
                const imageUrls = photos.photos.map(photo => photo.src.original);
                return imageUrls; // Return the image URLs
            })
        );

        if(!images) {
            res.status(500).send({ error : "Error generating images"});
        }

        if(images) {
            const cityImages = images.map((urlArray, index) => ({images : urlArray.map(url => ({ url }))}));
            res.send(cityImages);
        }
    }
    catch (error) {
        console.error("Error generating images:", error);
        res.status(500).send({ status : 500, message : "Error generating images", code : error });
    }
}