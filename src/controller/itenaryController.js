import { GPTNonSessionChat } from "./gptController.js";
import { PixelGenerateCityImages } from "./pixelController.js";


export const GenerateAIItenary = async (req, res) => {
    try
    {
        const { selectedCities, prompt } = req.body;
        console.log(selectedCities, prompt);
        if (!selectedCities || selectedCities.length === 0) {
            return res.status(400).send({ error: "No cities provided", input : selectedCities });
        }
        if(!prompt) {
            return res.status(400).send({ error: "No prompt provided" });
        }

        const response = await GPTNonSessionChat({ message: prompt });
        const cityImages = await PixelGenerateCityImages({ cities : selectedCities });

        const output = { response: response, imageResponse: cityImages };
        return res.status(200).send(output);

    }
    catch (error) {
        return res.status(500).send({ error: error });
    }
}