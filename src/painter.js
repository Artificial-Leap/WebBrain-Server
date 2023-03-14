import { Dalle } from "dalle-node";

export default class painter {
  static instance;
  openai = null;

  constructor(openai) {
    painter.instance = this;
    this.openai = openai;
  }

  async generateImage(prompt) {
    const response = await this.openai.createImage({
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });
    console.log(response.data);
    const image_url = response.data.data[0].url;
    return image_url;
  }
}
