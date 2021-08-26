# Discord Lonely Bot

Link to add to your server [here](https://discord.com/oauth2/authorize?client_id=647044127313362980&scope=bot&permissions=0).

## Table Of Contents

1. [Example usages](#Example_Usages)
2. [Setup](#Setup)
3. [Extra Information](#Extra_Information)

## Example Usages <a name="Example_Usages"></a>

| Command name | Example                                                                       |
| ------------ | ----------------------------------------------------------------------------- |
| `help`       | ![help command example](https://i.imgur.com/pdmNJWq.png)                      |
| `steamid`    | ![steamid command example](https://i.imgur.com/DtaQ7dF.png)                   |
| `profile`    | ![profile command example](https://i.imgur.com/7Pjjnrk.png)                   |
| `counter`    | ![counter command example](https://i.imgur.com/wAvEkgj.png)                   |
| `meta`       | (Image pending) Displays the pick rate and winrate of top heroes in the meta  |
| `play`       | (Image pending) Searches and finds the song to play from youtube and plays it |

## Setup <a name="Setup"></a>

Set up the environment variables by copying over the text in `.env.example` to `.env` and fill out the missing variables.

| Environment variable | Value                  |
| -------------------- | ---------------------- |
| `BOT_TOKEN`          | Discord bot token      |
| `BOT_URI`            | Mongodb connection uri |

</br>

Ensure that you have node and npm installed, and run

```bash
# Install dependencies
npm install

# Set up husky git hooks
npm prepare

# Run the bot
node index.js
```

## Extra Information <a name="Extra_Information"></a>

### Tech Stack

#### Language

TypeScript is used for the bot for better code checking, and documentation. You can find the classes in the `src/types` folder, and interfaces for things such as the database, or OpenDota API in the `src/types/interfaces` folder.

#### Npm scripts

| Script    | Purpose                                                         |
| --------- | --------------------------------------------------------------- |
| `build`   | Compiles the code into `dist` folder                            |
| `format`  | Automatically formats the code using prettier                   |
| `lint`    | Runs eslint on all TypeScript files, and fixes them if possible |
| `start`   | Compiles the code and starts the bot                            |
| `prepare` | Installs husky scripts for git hooks                            |
| `test`    | Run tests inside test folder                                    |

### Cool Facts

- The bot is named lonely bot after Lone Druid a Dota 2 hero who I spam too much.
- Heroku runs whatever code is on the master branch, and reloads the bot after an update, so try to reduce the number of commits to master, as each reload results in a short downtime.
