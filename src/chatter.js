import { Configuration, OpenAIApi } from "openai";
import { config } from "./configLoader.js";
import database from "./database.js";
import painter from "./painter.js";

const configuration = new Configuration({
  apiKey: config.openai_key,
});
const openai = new OpenAIApi(configuration);
new painter(openai);

const agentName = "Ginny";
async function completion(
  text,
  sender,
  stop = null,
  model = "text-davinci-003"
) {
  console.log("completion", text);
  const completion = await openai.createCompletion({
    model: model,
    prompt: text,
    max_tokens: 250,
    top_p: 1,
    frequency_penalty: 0.4,
    presence_penalty: 0.6,
    temperature: 0.8,
    stop: stop != null ? stop : [agentName + ":", sender + ":"],
  });
  return completion.data.choices[0].text;
}

const base_prompt = `#Information
The chat is between {agent} and other users through a chat app.
{agent} is a 31 years old, female fashion designer from Greece, who likes to design clothes and help others dress.
{agent} likes Street Style clothing, but she is interested in other styles as well.
{agent} doesn't like to curse or be mean, she is always helpful and likes to discuss various things, some of which are: fashion, travel and food.

#Chat:
`;
const bored_prompt = `#Information
The chat is between {agent} and other users through a chat app.
{agent} is a 31 years old, female fashion designer from Greece, who likes to design clothes and help others dress.
{agent} likes Street Style clothing, but she is interested in other styles as well.
{agent} doesn't like to curse or be mean, she is always helpful and likes to discuss various things, some of which are: fashion, travel and food.

{agent} Wants to talk about something, but no one is talking there, so she tries to start the conversation
#Chat:
{agent}:
`;

export default async function handleMessage(sender, messages) {
  let msgs = "";
  let first = true;
  messages.map((msg) => {
    //if message is older than 10 minutes ignore it
    if (Date.now() - msg.timestamp > 600000) return;
    if (msg.author.username === sender || msg.author.username === agentName) {
      msgs += (first ? "" : "\n") + msg.author.username + ": " + msg.content;
      first = false;
    }
  });

  msgs = msgs.split("\n").reverse().join("\n");

  let prompt = base_prompt + "\n" + msgs;
  prompt = prompt.replace("{agent}", agentName);
  prompt = prompt.replace("{user}", sender);
  prompt += `\n${agentName}: `;

  const resp = await completion(prompt, sender);
  return resp;
}

export async function handleBoredMessage() {
  let prompt = bored_prompt;
  prompt = prompt.replace("{agent}", agentName);

  const resp = await completion(prompt, sender);
  return resp;
}

export async function getImagePrompt(text) {
  const basePrompt = `#Find the prompt that will be used to generate an image
#Input: Hello {agent}, can you generate a black t-shirt?
#Output: a black t-shirt
#Input: generate a tree with green leaves, please
#Output: a tree with green leaves
#Input: make me a green car
#Output: a green car
#Input: Can you make an image from a happy family, sitting around a table and eating breackfast?
#Output: a happy family, sitting around a table and eating breackfast
#Input: Can you geneate an image from a happy family, sitting around a table and eating breackfast?
#Output: a happy family, sitting around a table and eating breackfast
#Input: Can you Make for me a photo of a valley
#Output: a photo of a valley
#Input: {message}
#Output:`;

  const prompt = basePrompt
    .replace("{agent}", agentName)
    .replace("{message}", text);
  console.log("getImagePrompt", prompt);
   const resp = await completion(
    prompt,
    "",
    ["\n", "#Input:", "#Output"],
    "davinci-codex"
  );
  return resp;
}
